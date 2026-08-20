# SKS Warm — Admin Panel

Plain HTML/CSS/JS dashboard (no build step) for managing form submissions and
editable site content. Talks to the [backend API](../server/README.md) over `fetch`.

## Local use

Just open `index.html` in a browser (or serve the folder with any static
server, e.g. `npx serve .`), with the backend running locally on
`http://localhost:5000` (the default in `js/config.js`).

Log in with the credentials you created via `npm run create-admin` in `/server`.

## Deploying

This is a static site — deploy it anywhere static hosting works (a second
Vercel project, Netlify, GitHub Pages, or even served by the backend itself).

1. Before deploying, edit `js/config.js` and set `API_BASE_URL` to your deployed
   backend URL (e.g. `https://sks-warm-backend.onrender.com`).
2. If deploying to Vercel: create a new project, set the **Root Directory** to
   `admin-panel`, framework preset "Other" (no build command needed).
3. Add the admin panel's deployed URL to the backend's `FRONTEND_URL` env var
   so CORS allows it.

Keep this URL private/unlisted — it's not linked from the public site. Anyone
who reaches it still needs valid admin credentials to see or change anything.
