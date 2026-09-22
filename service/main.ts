/* The admin interface's backend. Deployed to Deno Deploy.
 *
 * It does exactly two things, and deliberately nothing else:
 *
 *   POST /login   check an email and password, hand back a short-lived token
 *   POST /save    take edits from the editor and commit them to the repository
 *
 * WHY THIS EXISTS. The site is static files on GitHub Pages, so there is
 * nothing on the server to write to. Saving has to become a commit, and a
 * commit needs a token that can write to the repository. That token must
 * never reach the browser -- so it lives here, in Deno Deploy's secret
 * storage, and the browser only ever gets a session token that this service
 * issued and can refuse.
 *
 * WHAT IT DOES NOT DO. It does not build the site. It commits content files
 * only; the repository's GitHub Actions workflow regenerates the pages and
 * publishes them, exactly as it does for a commit made by hand. So the
 * editor cannot produce a site that a developer could not have produced, and
 * there is one build path rather than two.
 *
 * SECRETS, all set in the Deno Deploy dashboard, none in this file:
 *
 *   GITHUB_TOKEN      fine-grained token, Contents: read and write, on this
 *                     repository only
 *   GITHUB_REPO       "hechcreates/the-bhuvan-project"
 *   ADMIN_EMAIL       who may sign in
 *   ADMIN_PASSWORD    the hash, from `node service/hash-password.mjs`
 *                     -- the plain password is never stored anywhere
 *   SESSION_SECRET    a long random string; signs session tokens
 *   ALLOWED_ORIGIN    "https://www.thebhuvanproject.com"
 */

const env = (k: string, fallback?: string): string => {
  const v = Deno.env.get(k) ?? fallback;
  if (v === undefined) throw new Error(`missing secret: ${k}`);
  return v;
};

const kv = await Deno.openKv();

/* ---------- small helpers ---------- */

const enc = new TextEncoder();
const b64 = (b: ArrayBuffer | Uint8Array) =>
  btoa(String.fromCharCode(...new Uint8Array(b as ArrayBuffer)));
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

/* Constant time, so a wrong password cannot be narrowed down by how long the
   comparison took. */
function sameBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

async function pbkdf2(password: string, salt: Uint8Array, iterations: number) {
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  return new Uint8Array(
    await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations }, key, 256),
  );
}

/* "pbkdf2$210000$<salt>$<hash>" -- the format service/hash-password.mjs writes */
async function passwordMatches(password: string, stored: string): Promise<boolean> {
  const [scheme, iters, salt, hash] = stored.split("$");
  if (scheme !== "pbkdf2") return false;
  const got = await pbkdf2(password, unb64(salt), Number(iters));
  return sameBytes(got, unb64(hash));
}

/* ---------- session tokens ---------- */

async function hmac(data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(env("SESSION_SECRET")), { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  return b64(await crypto.subtle.sign("HMAC", key, enc.encode(data)));
}

const EIGHT_HOURS = 8 * 60 * 60 * 1000;

async function issueToken(email: string): Promise<{ token: string; expires: number }> {
  const expires = Date.now() + EIGHT_HOURS;
  const body = `${email}|${expires}`;
  return { token: `${btoa(body)}.${await hmac(body)}`, expires };
}

async function tokenHolder(token: string | null): Promise<string | null> {
  if (!token || !token.includes(".")) return null;
  const [bodyB64, sig] = token.split(".");
  let body: string;
  try { body = atob(bodyB64); } catch { return null; }
  const expected = await hmac(body);
  if (!sameBytes(enc.encode(sig), enc.encode(expected))) return null;
  const [email, expires] = body.split("|");
  if (!expires || Number(expires) < Date.now()) return null;
  return email;
}

/* ---------- brute force ---------- */

const MAX_FAILURES = 8;
const LOCK_FOR_MS = 15 * 60 * 1000;

async function failures(ip: string): Promise<number> {
  return (await kv.get<number>(["login-failures", ip])).value ?? 0;
}
async function noteFailure(ip: string) {
  const n = (await failures(ip)) + 1;
  await kv.set(["login-failures", ip], n, { expireIn: LOCK_FOR_MS });
}
async function clearFailures(ip: string) {
  await kv.delete(["login-failures", ip]);
}

/* ---------- GitHub ---------- */

const gh = async (path: string, init: RequestInit = {}) => {
  const res = await fetch(`https://api.github.com/repos/${env("GITHUB_REPO")}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${env("GITHUB_TOKEN")}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "User-Agent": "bhuvan-admin",
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) throw new Error(`GitHub ${init.method ?? "GET"} ${path}: ${res.status} ${await res.text()}`);
  return res.json();
};

/* One commit for the whole batch, through the git data API: blobs, then a
   tree on top of the current one, then a commit, then move the branch. A
   file-at-a-time API would make one commit per field, and a half-finished
   save would leave the site in a state nobody chose. */
async function commitFiles(
  files: { path: string; content: string; encoding: "utf-8" | "base64" }[],
  message: string,
) {
  const branch = "main";
  const ref = await gh(`/git/ref/heads/${branch}`);
  const head = ref.object.sha;
  const headCommit = await gh(`/git/commits/${head}`);

  const tree = [];
  for (const f of files) {
    const blob = await gh("/git/blobs", {
      method: "POST",
      body: JSON.stringify({ content: f.content, encoding: f.encoding }),
    });
    tree.push({ path: f.path, mode: "100644", type: "blob", sha: blob.sha });
  }

  const newTree = await gh("/git/trees", {
    method: "POST",
    body: JSON.stringify({ base_tree: headCommit.tree.sha, tree }),
  });
  const commit = await gh("/git/commits", {
    method: "POST",
    body: JSON.stringify({ message, tree: newTree.sha, parents: [head] }),
  });
  await gh(`/git/refs/heads/${branch}`, {
    method: "PATCH",
    body: JSON.stringify({ sha: commit.sha }),
  });
  return commit.sha as string;
}

async function readFile(path: string): Promise<string> {
  const res = await gh(`/contents/${encodeURI(path)}?ref=main`);
  /* Decode as UTF-8, not as bytes-to-string. atob alone returns one character
     per byte, so every curly quote and em dash in these files -- and they are
     full of both -- would come back as two broken characters and be written
     back that way. */
  return new TextDecoder().decode(unb64(res.content.replace(/\n/g, "")));
}

/* ---------- content files ---------- */

import { load, dump } from "npm:js-yaml@4.1.0";

/* Keep the comment header. js-yaml drops comments on dump, and these files
   open with the explanation of what they are -- including the note that an
   empty caption is meaningful. Saving must not quietly delete that. */
function splitHeader(text: string) {
  const lines = text.split(/\r?\n/);
  let i = 0;
  while (i < lines.length && (lines[i].startsWith("#") || lines[i].trim() === "")) i++;
  return { header: lines.slice(0, i).join("\n"), body: lines.slice(i).join("\n") };
}

// deno-lint-ignore no-explicit-any
function setPath(data: any, path: string, value: unknown) {
  const keys = path.split(".");
  let o = data;
  for (const k of keys.slice(0, -1)) {
    if (o == null || !(k in o)) throw new Error(`no such field: ${path}`);
    o = o[k];
  }
  const last = keys[keys.length - 1];
  if (o == null || !(last in o)) throw new Error(`no such field: ${path}`);
  o[last] = value;
}

function fileFor(scope: string): string {
  if (/^projects\/[a-z0-9-]+$/.test(scope)) return `content/${scope}.yml`;
  if (["home", "about", "journey"].includes(scope)) return `content/${scope}.yml`;
  throw new Error(`not an editable scope: ${scope}`);
}

/* ---------- responses ---------- */

const cors = () => ({
  "Access-Control-Allow-Origin": env("ALLOWED_ORIGIN"),
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
  Vary: "Origin",
});

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...cors() },
  });

/* ---------- the service ---------- */

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";

  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors() });
  if (url.pathname === "/health") return json({ ok: true });

  /* ---- login ---- */
  if (req.method === "POST" && url.pathname === "/login") {
    if (await failures(ip) >= MAX_FAILURES) {
      return json({ ok: false, error: "Too many attempts. Try again in 15 minutes." }, 429);
    }
    let email = "", password = "";
    try {
      const body = await req.json();
      email = String(body.email ?? "").trim().toLowerCase();
      password = String(body.password ?? "");
    } catch { /* falls through to the failure below */ }

    const ok = email === env("ADMIN_EMAIL").trim().toLowerCase()
      && password.length > 0
      && await passwordMatches(password, env("ADMIN_PASSWORD"));

    if (!ok) {
      await noteFailure(ip);
      /* one message for both wrong email and wrong password: telling them
         apart tells an attacker which half they got right */
      return json({ ok: false, error: "That email and password do not match." }, 401);
    }
    await clearFailures(ip);
    const { token, expires } = await issueToken(email);
    return json({ ok: true, token, expires });
  }

  /* ---- save ---- */
  if (req.method === "POST" && url.pathname === "/save") {
    const who = await tokenHolder(req.headers.get("Authorization")?.replace(/^Bearer /, "") ?? null);
    if (!who) return json({ ok: false, error: "Your session has expired. Sign in again." }, 401);

    try {
      const { changes = [], images = [] } = await req.json();
      if (!changes.length && !images.length) return json({ ok: false, error: "Nothing to save." }, 400);

      const files: { path: string; content: string; encoding: "utf-8" | "base64" }[] = [];

      /* photographs go in as they are */
      for (const im of images) {
        if (!/^[a-z0-9._-]+$/i.test(im.filename)) throw new Error(`unsafe filename: ${im.filename}`);
        if (!/^images\/[a-z0-9/_-]+$/i.test(im.dir)) throw new Error(`unsafe folder: ${im.dir}`);
        files.push({ path: `${im.dir}/${im.filename}`, content: im.base64, encoding: "base64" });
      }

      /* edits are grouped per file so each one is read, changed and written
         once, however many fields on it were touched */
      const byFile = new Map<string, { scope: string; path: string; value: unknown }[]>();
      for (const c of changes) {
        const file = fileFor(String(c.scope));
        if (!byFile.has(file)) byFile.set(file, []);
        byFile.get(file)!.push(c);
      }

      for (const [file, edits] of byFile) {
        const text = await readFile(file);
        const { header, body } = splitHeader(text);
        if (/^\s*#/m.test(body)) throw new Error(`${file} has comments among its values`);
        const data = load(body) ?? {};
        for (const e of edits) setPath(data, e.path, e.value);
        files.push({
          path: file,
          content: (header ? header.replace(/\s*$/, "") + "\n\n" : "")
            + dump(data, { lineWidth: 100, noRefs: true }),
          encoding: "utf-8",
        });
      }

      const what = [
        changes.length ? `${changes.length} ${changes.length === 1 ? "change" : "changes"}` : "",
        images.length ? `${images.length} ${images.length === 1 ? "photograph" : "photographs"}` : "",
      ].filter(Boolean).join(" and ");

      const sha = await commitFiles(files, `Edit from the admin interface: ${what}\n\nBy ${who}.`);
      return json({ ok: true, commit: sha.slice(0, 7), files: files.map((f) => f.path) });
    } catch (e) {
      return json({ ok: false, error: e instanceof Error ? e.message : String(e) }, 400);
    }
  }

  return json({ ok: false, error: "Not found" }, 404);
});
