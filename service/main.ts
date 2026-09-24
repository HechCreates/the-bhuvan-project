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

/* Failed-login counts live in Deno's key-value store when there is one, so
   they survive restarts and are shared across instances. Not every Deno
   Deploy plan or platform version provides it, and a service that refuses to
   start because its rate-limit store is missing would be a worse failure than
   a rate limit that forgets sooner. So: use KV if it is there, otherwise keep
   the counts in memory.

   In memory they reset when the instance does, which weakens the lockout --
   acceptable because the thing behind it is a 12-character minimum password
   hashed at 210,000 iterations, not a 4-digit code. */
let kv: Deno.Kv | null = null;
try {
  kv = await Deno.openKv();
} catch {
  console.warn("Deno KV unavailable; failed-login counts will be kept in memory only.");
}

const memory = new Map<string, { value: number; until: number }>();

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

/* Who may sign in.
 *
 * ADMIN_USERS holds one or more people, each with their OWN password:
 *
 *   nikhil@example.com:pbkdf2$210000$…,harsha@example.com:pbkdf2$210000$…
 *
 * Entries separated by a comma or a newline, email and hash by a colon --
 * neither appears in base64, so neither can split a hash by accident.
 *
 * Separate passwords rather than a shared one, because the commit this
 * service makes records who made it. A shared password would make every
 * edit anonymous and mean that removing one person's access means changing
 * everyone's password.
 *
 * ADMIN_EMAIL and ADMIN_PASSWORD still work for a single person.
 */
function users(): Map<string, string> {
  const map = new Map<string, string>();
  const raw = Deno.env.get("ADMIN_USERS");
  if (raw && raw.trim()) {
    for (const entry of raw.split(/[,\n]/)) {
      const t = entry.trim();
      if (!t) continue;
      const at = t.indexOf(":");
      if (at < 0) continue;
      map.set(t.slice(0, at).trim().toLowerCase(), t.slice(at + 1).trim());
    }
    if (!map.size) throw new Error("ADMIN_USERS is set but no entries parsed");
    return map;
  }
  map.set(env("ADMIN_EMAIL").trim().toLowerCase(), env("ADMIN_PASSWORD"));
  return map;
}

/* A real-shaped hash that no password matches. An unknown email is checked
   against this so that a wrong email costs the same work as a wrong
   password -- otherwise the time taken would say which addresses exist. */
const DUMMY_HASH = "pbkdf2$210000$AAAAAAAAAAAAAAAAAAAAAA==$" +
  "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";

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
  if (kv) return (await kv.get<number>(["login-failures", ip])).value ?? 0;
  const hit = memory.get(ip);
  if (!hit || hit.until < Date.now()) { memory.delete(ip); return 0; }
  return hit.value;
}
async function noteFailure(ip: string) {
  const n = (await failures(ip)) + 1;
  if (kv) await kv.set(["login-failures", ip], n, { expireIn: LOCK_FOR_MS });
  else memory.set(ip, { value: n, until: Date.now() + LOCK_FOR_MS });
}
async function clearFailures(ip: string) {
  if (kv) await kv.delete(["login-failures", ip]);
  else memory.delete(ip);
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

/* mapped to npm:js-yaml@4.1.0 in service/deno.json, which also turns off
   Node compatibility mode -- see the note in that file */
import { load, dump } from "js-yaml";

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

/* Adding to and removing from a list. The same rules as
   build/content-io.mjs, which is what the local dev server uses -- the
   editor sends identical requests to both, so they have to agree.

   An insert COPIES the item it was pressed on: a testimonial carries the
   framing measured from its own silhouette and a project card carries a
   photograph, and a blank item would render a hole. `values` then overwrites
   the fields the editor knows about, so a copy taken after an unsaved edit
   shows what the screen showed.

   A list cannot be emptied from here: removing the last item would leave a
   section with nothing in it and no way back. */
// deno-lint-ignore no-explicit-any
function splicePath(data: any, path: string, op: string, values?: Record<string, unknown>) {
  const keys = path.split(".");
  const at = Number(keys[keys.length - 1]);
  const listPath = keys.slice(0, -1).join(".");
  // deno-lint-ignore no-explicit-any
  const list = listPath.split(".").reduce((o: any, k) => (o == null ? o : o[k]), data);

  if (!Array.isArray(list)) throw new Error(`not a list: ${listPath}`);
  if (!Number.isInteger(at) || at < 0 || at >= list.length) {
    throw new Error(`no item ${keys[keys.length - 1]} in ${listPath} (${list.length} items)`);
  }

  if (op === "remove") {
    if (list.length <= 1) {
      throw new Error(`${listPath} has one item left; removing it would empty the section`);
    }
    list.splice(at, 1);
    return;
  }

  const copy = structuredClone(list[at]);
  for (const [field, value] of Object.entries(values ?? {})) setPath(copy, field, value);
  list.splice(at + 1, 0, copy);
}

// deno-lint-ignore no-explicit-any
function applyChange(data: any, c: { op?: string; path: string; value?: unknown; values?: Record<string, unknown> }) {
  if (c.op === "insert" || c.op === "remove") splicePath(data, c.path, c.op, c.values);
  else setPath(data, c.path, c.value);
}

/* Every page generated from a template. Four were missing -- faq, contact,
   projects and testimonials -- so those pages could be edited on screen and
   then refused at the moment of saving. content/site.yml stays out on
   purpose: it carries comments among its values, and writing it back would
   drop them. */
const EDITABLE = ["home", "about", "journey", "faq", "contact", "projects", "testimonials"];

function fileFor(scope: string): string {
  if (/^projects\/[a-z0-9-]+$/.test(scope)) return `content/${scope}.yml`;
  if (EDITABLE.includes(scope)) return `content/${scope}.yml`;
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

    const known = users();
    const stored = known.get(email);
    /* always hash, even for an email nobody has, so the answer takes the
       same time either way */
    const matched = password.length > 0 && await passwordMatches(password, stored ?? DUMMY_HASH);
    const ok = Boolean(stored) && matched;

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

      /* Edits are grouped per file so each one is read, changed and written
         once, however many fields on it were touched. Within a file they
         keep the order they were made in, which matters as soon as one of
         them adds or removes a list item: an edit recorded before the insert
         and one recorded after it mean different rows of the same list. */
      // deno-lint-ignore no-explicit-any
      const byFile = new Map<string, any[]>();
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
        for (const e of edits) applyChange(data, e);
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
