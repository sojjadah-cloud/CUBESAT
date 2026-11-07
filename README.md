# MTC CubeSat Society — Student Recruitment Platform

The bilingual (Arabic RTL / English LTR) recruitment portal for the MTC CubeSat Society at the Military Technological College, Sultanate of Oman. It has three parts:

- **Public site**: three pages that only go forward: home (`/`) → about (`/about`) → teams (`/teams`) → application. There is no menu or side pages. The name "MTC CubeSat Society" is kept in English in both languages; everything else follows the selected language.
- **Application wizard** (`/apply`): six steps: team area → team → basic information → skills & experience (skills, previous participation, motivation) → attachments → review & submit. Applicants are identified by student ID; no email is collected.
- **Team portal** (`/admin`, not linked from the public pages): dashboard, search and filters, applicant profiles, status workflow, internal notes, private document viewing, CSV export and an audit log.

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 15 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS 3 with design tokens in `tailwind.config.ts` and component classes in `src/app/globals.css` |
| Validation | Zod schemas in `src/lib/application.ts`, shared by the browser and the server |
| Database | PostgreSQL via `pg`. Local development uses embedded PostgreSQL (PGlite) when `DATABASE_URL` is not set |
| Files | Private disk storage outside `/public` (`UPLOAD_DIR`). Files are served only through authorised routes |
| Auth | Email-only sign-in for registered admin accounts (no password, by owner decision); database-backed sessions in an httpOnly cookie; roles `admin` / `reviewer` |
| Icons / fonts | Lucide, IBM Plex Sans Arabic, Inter, Manrope |

## Running locally

```bash
npm install
cp .env.example .env.local        # then edit values
npm run admin:create              # creates the first account from ADMIN_EMAIL in .env.local
npm run dev                       # http://localhost:3000
```

With no `DATABASE_URL`, data is stored in `.data/pglite`. Only one process at a time may open that directory, so stop `npm run dev` before running the scripts.

## Production setup

1. **PostgreSQL.** Set `DATABASE_URL` (and `DATABASE_SSL=true` if required). The schema in `src/lib/schema.ts` is idempotent and is applied automatically on start.
2. **Secrets.** Keep `.env` on the server only. No credentials are ever sent to the browser.
3. **Storage.** Point `UPLOAD_DIR` at a persistent, backed-up directory that the web server does **not** serve statically. To use object storage (S3, Azure Blob), replace the four functions in `src/lib/files.ts`.
4. **Admins.** On the server, run:
   ```bash
   ADMIN_EMAIL=lead@college.example ADMIN_NAME="Team Lead" ADMIN_ROLE=admin npm run admin:create
   ```
   Use `ADMIN_ROLE=reviewer` for reviewers. Add `-- --email x --disable` to deactivate an account.
5. **Reverse proxy.** Serve over HTTPS. Set `TRUST_PROXY=true` only if the proxy sets `X-Forwarded-For`.
6. **Retention.** Schedule `npm run retention:purge` to run daily. It removes expired drafts, orphaned files and, if `APPLICATION_RETENTION_DAYS` is set, applications older than that.
7. **Rate limiting** is in-memory per process. If you run several instances, add a shared limiter (e.g. Redis) or enforce limits at the proxy.

```bash
npm run build && npm start
```

## Deploying on Netlify

1. **Database.** In the Netlify site, open *Extensions* and enable **Netlify DB** (Neon). It sets `NETLIFY_DATABASE_URL` for the site, and the tables are created on the first request. (Any other PostgreSQL works too: set `DATABASE_URL`.)
2. **Uploads** go to Netlify Blobs automatically. No setup is needed.
3. **Admins.** In *Site configuration → Environment variables*, add `ADMIN_EMAILS` with the admin emails, separated by commas. Each one becomes an admin the first time it signs in.
4. Redeploy (*Deploys → Trigger deploy*).

Without a database the site refuses to save rather than losing data, because Netlify functions don't keep files on disk. `npm run retention:purge` works with the local disk only; on Netlify, delete old applications from the portal.

## Institutional configuration

| What | Where |
| --- | --- |
| Academic levels, departments, weekly-hour options | `config/institution.json` (specialisation is typed by the student) |
| Student ID format | `STUDENT_ID_PATTERN` (regex) + `STUDENT_ID_HINT_EN` / `STUDENT_ID_HINT_AR`. Default: 3–20 letters, digits or hyphens |
| Upload limits | `MAX_IMAGE_MB`, `MAX_CV_MB`, `MAX_IMAGES` |

Team content (names, descriptions, responsibilities, skills) is in `src/lib/teams.ts`. All interface text is in `src/lib/i18n/ar.ts` and `src/lib/i18n/en.ts`. The Arabic dictionary is type-checked against the English one, so a missing key fails the build.

## How it works

- **Drafts and data safety.** The wizard autosaves to the server about one second after each change. It also has a **Save draft** button. The draft is identified by a random token in an httpOnly cookie, and applicant data is never kept in `localStorage`. Refreshing the page or coming back later restores the draft at the same step. Browser Back/Forward move between steps. The page warns before closing if there are unsaved changes. Switching language keeps all entered data.
- **Submission.** The server validates the whole application again with the same Zod schemas. A per-draft `submissionKey` makes retries idempotent, so a double click or network retry never creates two applications. Each student ID can submit only once (case-insensitive). The success screen and reference number appear only after the server confirms.
- **Uploads.** The server checks each file's real type from its magic bytes (JPG/PNG/WEBP for images, PDF for the CV), not from the file extension. Files get random names and are stored outside the web root. A draft's files are visible only to that draft's owner. After submission, only signed-in staff can open them, and each view is audited.
- **Security.** Mutating requests must come from the same origin (CSRF protection). Sessions are stored in the database, use SameSite=Strict, are httpOnly, and expire after 8 hours by default. Sign-in is by email only: anyone who knows a registered admin email can open the portal, so keep the admin list short and remove people with `-- --email x --disable` when they leave. Logins, submissions, uploads and drafts are rate-limited. CSV export blocks spreadsheet-formula injection. Security headers and `noindex` are set on the portal.
- **Roles.** `reviewer` can view applications and files, change status and add notes. `admin` can also export, delete applications and read the audit log.
- **Audit log.** Records sign-ins (including failed ones), profile views, file views, status changes, notes, exports, deletions and retention purges.

## Project layout

```
config/institution.json        Levels, departments, pathways (edit this)
scripts/                       admin:create, retention:purge
src/app/                       Pages and API route handlers
src/components/wizard/         Application wizard and its steps
src/components/admin/          Team portal components
src/lib/                       Validation, database, auth, files, i18n, team data
```
