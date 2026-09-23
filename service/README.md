# The admin service

The backend for `/admin/`. It checks a password and commits edits to this
repository. Everything else — regenerating the pages and publishing them — is
done by the existing GitHub Actions workflow, exactly as for a commit made by
hand. There is one build path, not two.

It needs to exist because the site is static files on GitHub Pages: there is
nothing on the server to write to, so saving has to become a commit, and a
commit needs a token that can write to the repository. **That token must never
reach the browser.** It lives here; the browser only ever holds a session
token this service issued and can refuse.

Setting it up is four steps and about fifteen minutes, once.

---

## 1. Make a GitHub token

1. **github.com → your photo → Settings → Developer settings →
   Personal access tokens → Fine-grained tokens → Generate new token**
2. Name: `bhuvan admin service`
3. Expiration: **No expiration**.

   That sounds wrong and is the right answer here. The token's entire reach is
   "edit files in this one repository" — it cannot touch the account, other
   repositories, settings, or Actions secrets, and the worst a leak could do
   is make unwanted commits, which are visible in the history and revertible.
   An expiring token buys a bound on how long a silently stolen one stays
   useful; it costs publishing breaking in twelve months with no obvious
   explanation, long after anyone remembers why. For a two-person studio the
   second is much likelier than the first.

   What protects it instead: the narrow scope below, and knowing how to
   revoke. Revoking is the same page — open the token, press **Revoke**, and
   it dies instantly. Do that, make a new one and update `GITHUB_TOKEN` in
   Deno Deploy if the token is ever pasted somewhere by accident, if someone
   else gets into the GitHub or Deno account, or if anyone who had access
   stops working on the site.
4. Repository access: **Only select repositories** → `the-bhuvan-project`
5. Permissions → Repository permissions → **Contents: Read and write**.
   Nothing else. Leave every other permission alone.
6. Generate, and copy the token. **GitHub shows it once.**

A token scoped this way can edit this one repository and nothing else. It
cannot touch your other repositories, your account, or anyone else's work.

## 2. Make the password

In a terminal. The repository is the `site` folder, so start by going into
it -- running this from the folder above will say "Cannot find module":

```bash
cd "D:\Harsha\The Bhu.van Project\site"
```

```bash
node service/hash-password.mjs
```

It asks for a password twice, then prints two lines to paste in the next step.
The password itself is never written to a file, never committed, and never
sent anywhere — what gets stored is a hash. Use something long; a phrase of
four or five unrelated words is better than a short jumble.

## 3. Deploy

1. Sign in at **[dash.deno.com](https://dash.deno.com)** with GitHub.
2. **+ New app** (older versions of the dashboard called this "New Project"),
   then connect GitHub and pick `hechcreates/the-bhuvan-project`.
3. Set three things, under **Edit app config** / **App Directory**:

   | Setting | Value |
   |---|---|
   | App Directory | `service` |
   | Entrypoint | `main.ts` |
   | Install command | **empty** |

   **App Directory matters.** Run it from the repository root instead and the
   build fails with:

   ```
   error: Could not find "js-yaml" in a node_modules folder.
   ```

   The root holds a `package.json` for the site's own build scripts. Deno
   finds it, switches into Node compatibility mode, and then wants a
   `node_modules` folder that nothing created. Running from `service/`, next
   to its own `deno.json`, keeps the site's tooling and this service apart.

   Leave the install command empty on purpose: the site's `package.json`
   pulls in `sharp`, a large native image library used only for generating
   images locally. Installing it here would make every deploy slow and could
   fail outright. Deno fetches this service's one dependency itself.

   Deno's dashboard changes often and these settings move around — they may
   sit under "Build configuration" or "Advanced".
4. Before the first deploy, add these under **Settings → Environment
   Variables**:

   | Name | Value |
   |---|---|
   | `GITHUB_TOKEN` | the token from step 1 |
   | `GITHUB_REPO` | `hechcreates/the-bhuvan-project` |
   | `ADMIN_EMAIL` | the email that may sign in |
   | `ADMIN_PASSWORD` | the `pbkdf2$…` line from step 2 |
   | `SESSION_SECRET` | the second line from step 2 |
   | `ALLOWED_ORIGIN` | `https://www.thebhuvanproject.com` |

   **For more than one person**, leave `ADMIN_EMAIL` and `ADMIN_PASSWORD` out
   and set `ADMIN_USERS` instead — each person with their own password:

   ```
   nikhil@example.com:pbkdf2$210000$…,harsha@example.com:pbkdf2$210000$…
   ```

   Run step 2 once per person, with their email after the command:

   ```bash
   node service/hash-password.mjs nikhil@example.com
   ```

   It prints the whole `email:hash` line ready to paste. Separate people with
   a comma or a newline.

   Separate passwords rather than a shared one, because the commit this
   service makes records who made it — a shared password makes every edit
   anonymous, and removing one person's access means changing everyone's.
   To remove someone, delete their entry and redeploy.

5. Deploy. Deno gives the project a URL like
   `https://bhuvan-admin-xxxx.deno.dev`.
6. Check it is alive: open `<that URL>/health` — it should say `{"ok":true}`.

## 4. Point the editor at it

In `static/admin/index.html`, set `SERVICE` to the URL from step 3, then
commit. That same commit can remove the `CI === 'true'` guard in
`build/build.mjs` that currently keeps `/admin/` off the published site.

Then `https://www.thebhuvanproject.com/admin/` asks for the email and password
and works from any browser, including a phone.

---

## How a save works

1. The editor posts the changed fields, and any new photographs, with the
   session token.
2. This service checks the token, reads each content file from GitHub,
   changes only the named fields, and writes them back as **one commit** —
   not one commit per field, so a half-finished save cannot leave the site in
   a state nobody chose.
3. That commit triggers the normal build, which regenerates the pages and
   publishes. About a minute.

## What is deliberately not here

- **No account creation.** The people who may sign in are set by you in
  ADMIN_USERS, and changed by redeploying.
- **No password reset by email.** Run step 2 again and update the variable.
- **No file browser or arbitrary writes.** It will only write
  `content/*.yml`, `content/projects/*.yml` and files under `images/`.
  Anything else is refused by name.
- **No build.** It commits and stops. The site is built the one way it has
  always been built.

## If something goes wrong

- **"That email and password do not match"** — the same message whether the
  email or the password was wrong, on purpose: saying which was right tells
  an attacker half the answer.
- **"Too many attempts"** — eight failures from one address locks it for
  fifteen minutes.
- **"Your session has expired"** — sessions last eight hours. Sign in again.
- **Published but the site has not changed** — look at the Actions tab in
  GitHub. The commit is made; the build is what publishes it.
- **Everything fails at once, suddenly** — the likeliest cause is the GitHub
  token: revoked, or deleted along with something else. Step 1 again, then
  update `GITHUB_TOKEN` in Deno Deploy. Nothing on the site is lost either
  way; the token only controls whether new edits can be committed.
