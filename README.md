# MTC CubeSat Project — Student Recruitment Platform

The bilingual (Arabic RTL / English LTR) recruitment portal for the MTC CubeSat Project at the Military Technological College, Sultanate of Oman. It has three parts:

- **Public site**: a short home page (`/`) plus separate pages for the project (`/about`), the teams (`/teams`, with one page per team at `/teams/[id]`) and how to apply (`/how-to-apply`). Arabic mode is entirely in Arabic, including software and team names. English mode is entirely in English. The only exception is the language-switch button, which shows the other language's name.
- **Application wizard** (`/apply`): seven steps: team area → one team → student details → experience → skills & motivation → attachments → review & submit.
- **Team portal** (`/admin`): dashboard, search and filters, applicant profiles, status workflow, internal notes, private document viewing, CSV export and an audit log.

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 15 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS 3 with design tokens in `tailwind.config.ts` and component classes in `src/app/globals.css` |
| Validation | Zod schemas in `src/lib/application.ts`, shared by the browser and the server |
| Database | PostgreSQL via `pg`. Local development uses embedded PostgreSQL (PGlite) when `DATABASE_URL` is not set |
| Files | Private disk storage outside `/public` (`UPLOAD_DIR`). Files are served only through authorised routes |
| Auth | Email + bcrypt password, database-backed sessions in an httpOnly cookie, roles `admin` / `reviewer` |
| Icons / fonts | Lucide, IBM Plex Sans Arabic, Inter, Manrope |

## Running locally

```bash
npm install
cp .env.example .env.local        # then edit values
npm run admin:create              # creates the first account from ADMIN_EMAIL / ADMIN_PASSWORD in .env.local
npm run dev                       # http://localhost:3000
```

With no `DATABASE_URL`, data is stored in `.data/pglite`. Only one process at a time may open that directory, so stop `npm run dev` before running the scripts.

## Production setup

1. **PostgreSQL.** Set `DATABASE_URL` (and `DATABASE_SSL=true` if required). The schema in `db/schema.sql` is idempotent and is applied automatically on start.
2. **Secrets.** Keep `.env` on the server only. No credentials are ever sent to the browser.
3. **Storage.** Point `UPLOAD_DIR` at a persistent, backed-up directory that the web server does **not** serve statically. To use object storage (S3, Azure Blob), replace the four functions in `src/lib/files.ts`.
4. **Admins.** On the server, run:
   ```bash
   ADMIN_EMAIL=lead@college.example ADMIN_NAME="Team Lead" ADMIN_ROLE=admin ADMIN_PASSWORD='…' npm run admin:create
   ```
   Use `ADMIN_ROLE=reviewer` for reviewers. Add `-- --email x --disable` to deactivate an account.
5. **Reverse proxy.** Serve over HTTPS. Set `TRUST_PROXY=true` only if the proxy sets `X-Forwarded-For`.
6. **Retention.** Schedule `npm run retention:purge` to run daily. It removes expired drafts, orphaned files and, if `APPLICATION_RETENTION_DAYS` is set, applications older than that.
7. **Rate limiting** is in-memory per process. If you run several instances, add a shared limiter (e.g. Redis) or enforce limits at the proxy.

```bash
npm run build && npm start
```

## Institutional configuration — must be set before launch

I have **not** guessed any of the college's official formats. You need to set these:

| What | Where |
| --- | --- |
| Academic levels, departments, specialisations, weekly-hour options | `config/institution.json` (current values are **examples**) |
| Student ID format | `STUDENT_ID_PATTERN` (regex) + `STUDENT_ID_HINT_EN` / `STUDENT_ID_HINT_AR`. Default: 3–20 letters, digits or hyphens |
| College email domain(s) | `ALLOWED_EMAIL_DOMAINS` (comma-separated). Default: any valid email |
| Upload limits | `MAX_IMAGE_MB`, `MAX_CV_MB`, `MAX_IMAGES` |

Team content (names, descriptions, responsibilities, skills) is in `src/lib/teams.ts`. All interface text is in `src/lib/i18n/ar.ts` and `src/lib/i18n/en.ts`. The Arabic dictionary is type-checked against the English one, so a missing key fails the build.

## How it works

- **Drafts and data safety.** The wizard autosaves to the server about one second after each change. It also has a **Save draft** button. The draft is identified by a random token in an httpOnly cookie, and applicant data is never kept in `localStorage`. Refreshing the page or coming back later restores the draft at the same step. Browser Back/Forward move between steps. The page warns before closing if there are unsaved changes. Switching language keeps all entered data.
- **Submission.** The server validates the whole application again with the same Zod schemas. A per-draft `submissionKey` makes retries idempotent, so a double click or network retry never creates two applications. Each student ID can submit only once (case-insensitive). The success screen and reference number appear only after the server confirms.
- **Uploads.** The server checks each file's real type from its magic bytes (JPG/PNG/WEBP for images, PDF for the CV), not from the file extension. Files get random names and are stored outside the web root. A draft's files are visible only to that draft's owner. After submission, only signed-in staff can open them, and each view is audited.
- **Security.** Mutating requests must come from the same origin (CSRF protection). Sessions are stored in the database, use SameSite=Strict, are httpOnly, and expire after 8 hours by default. Login checks take the same time whether or not the account exists. Logins, submissions, uploads and drafts are rate-limited. CSV export blocks spreadsheet-formula injection. Security headers and `noindex` are set on the portal.
- **Roles.** `reviewer` can view applications and files, change status and add notes. `admin` can also export, delete applications and read the audit log.
- **Audit log.** Records sign-ins (including failed ones), profile views, file views, status changes, notes, exports, deletions and retention purges.

## Project layout

```
config/institution.json        Levels, departments, pathways (edit this)
db/schema.sql                  PostgreSQL schema
scripts/                       admin:create, retention:purge
src/app/                       Pages and API route handlers
src/components/wizard/         Application wizard and its steps
src/components/admin/          Team portal components
src/lib/                       Validation, database, auth, files, i18n, team data
```
