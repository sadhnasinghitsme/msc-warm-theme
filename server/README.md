# SKS Warm — Backend API

Express + MongoDB backend for the SKS International University site. Handles the
admissions enquiry and contact forms (save to DB + email notification) and a
protected content API that powers the admin panel.

## Local setup

```bash
cd server
npm install
cp .env.example .env   # then fill in the values
npm run dev
```

Server runs on `http://localhost:5000` by default.

### Create your admin login

Set `ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD` (and optionally `ADMIN_SEED_NAME`) in `.env`, then:

```bash
npm run create-admin
```

Re-running this script updates the password for that email — use it to rotate credentials too.

### Seed the editable content blocks (optional but recommended)

```bash
npm run seed-content
```

This inserts default values for the content keys the frontend already reads
(`hero.title`, `hero.desc`, `about.paragraph1`, `contact.phone`, etc. — see
`scripts/seedContent.js`). It never overwrites a value you've already edited
from the admin panel.

## API overview

| Method | Route                    | Auth      | Purpose |
|--------|---------------------------|-----------|---------|
| POST   | `/api/auth/login`         | public    | Admin login, returns JWT |
| GET    | `/api/auth/me`            | protected | Current admin profile |
| POST   | `/api/enquiries`          | public    | Admission enquiry form submit |
| GET    | `/api/enquiries`          | protected | List/filter/paginate enquiries |
| PATCH  | `/api/enquiries/:id`      | protected | Update status/notes |
| DELETE | `/api/enquiries/:id`      | protected | Delete an enquiry |
| POST   | `/api/contact`            | public    | Contact form submit |
| GET    | `/api/contact`            | protected | List/filter contact messages |
| PATCH  | `/api/contact/:id`        | protected | Update status |
| DELETE | `/api/contact/:id`        | protected | Delete a message |
| GET    | `/api/content`            | public    | `{ key: value }` map for the frontend |
| GET    | `/api/content/admin`      | protected | Full content docs for the editor |
| PUT    | `/api/content/:key`       | protected | Create/update a content block |
| DELETE | `/api/content/:key`       | protected | Remove a content block |
| POST   | `/api/upload`             | protected | Image upload (needs Cloudinary env vars; otherwise just paste an image URL) |

All protected routes require `Authorization: Bearer <token>`.

## Deploying (Render or Railway)

1. Push this repo to GitHub.
2. Create a new **Web Service** and point it at this repo, with **Root Directory** set to `server`.
3. Build command: `npm install`. Start command: `npm start`.
4. Add all variables from `.env.example` in the host's environment settings —
   in particular `MONGODB_URI` (an [Atlas](https://www.mongodb.com/atlas) free
   cluster works fine), `JWT_SECRET`, `FRONTEND_URL` (your Vercel domain,
   comma-separate if you also need the admin panel's own domain), and the
   `EMAIL_*` / `NOTIFY_EMAIL_TO` values.
5. After the first deploy, run `npm run create-admin` once (Render: "Shell" tab
   on the service; Railway: `railway run npm run create-admin`) to create your
   login, then `npm run seed-content` to populate default editable text.
6. Copy the deployed URL (e.g. `https://sks-warm-backend.onrender.com`) — you'll
   need it in the frontend's `config.js` and the admin panel's `js/config.js`.

Note: Render/Railway's free tiers use an ephemeral filesystem, which is why
image uploads go through Cloudinary rather than local disk storage.

## CORS

`FRONTEND_URL` is a comma-separated allowlist. Include your production Vercel
domain and any preview/admin-panel domains you use, e.g.:

```
FRONTEND_URL=https://sks-warm-theme.vercel.app,https://sks-admin.vercel.app
```
