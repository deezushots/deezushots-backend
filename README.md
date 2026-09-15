# Deezu Shots — website + admin dashboard

A two-part project:

```
deezu-shots/
├── frontend/   → static HTML/CSS/JS public site + admin dashboard (deploy to GitHub Pages)
└── backend/    → Node/Express API (deploy to Render), data in MongoDB, files on Cloudinary
```

The public site reads everything (bio, address, categories, photos/videos) live from the
backend API. Nothing is hard-coded except the one-time seed defaults in `backend/models/Settings.js`.

---

## 1. How it fits together

- **frontend/** is pure HTML, CSS, and vanilla JS — no build step. Serve it from any static
  host, including GitHub Pages.
- **backend/** is a small Express server with no local storage at all:
  - **MongoDB** (via MongoDB Atlas's free tier) holds the site's text content, categories, and
    the list of uploaded media.
  - **Cloudinary** (also free-tier friendly) stores and serves the actual photo/video files
    from its CDN — the backend never writes files to its own disk.
- Because nothing lives on Render's local disk, there's nothing for a redeploy or restart to
  wipe. Every deploy trigger that used to be a concern (new push, manual redeploy, crash
  restart, free-tier spin-down) is now harmless — your data lives in Mongo and Cloudinary, not
  on the server itself.
- The only file you touch after deploying is `frontend/js/config.js` — point it at your
  backend's URL.

---

## 2. One-time setup: MongoDB Atlas and Cloudinary

**MongoDB Atlas** (free M0 cluster is plenty for this):
1. Create an account at mongodb.com/cloud/atlas and a free M0 cluster.
2. Database Access → add a database user with a password.
3. Network Access → allow access from anywhere (`0.0.0.0/0`) so Render can reach it.
4. Get your connection string (Connect → Drivers) — it looks like
   `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/deezu-shots`. Keep the database name
   (`deezu-shots` above) — that's where your data will live.

**Cloudinary** (free tier: 25GB storage/bandwidth):
1. Create an account at cloudinary.com.
2. Your dashboard's home page shows **Cloud name**, **API Key**, and **API Secret** — copy all
   three.

---

## 3. Run it locally first

**Backend:**
```bash
cd backend
npm install
cp .env.example .env     # then fill in MONGODB_URI and the three CLOUDINARY_* values
npm start
```
This starts the API at `http://localhost:4000`. On first boot (once it connects to MongoDB) it
prints a default admin password in the terminal — write it down.

**Frontend:**
Edit `frontend/js/config.js`:
```js
window.API_BASE_URL = "http://localhost:4000/api";
```
Then serve the `frontend/` folder with any static server (opening `index.html` straight from
disk will hit browser CORS/file restrictions), for example:
```bash
cd frontend
npx serve .
```
Visit the printed local URL, and `/admin/login.html` to log in with the default password.

---

## 4. Deploy the backend to Render

1. Push the **backend/** folder to its own GitHub repo (e.g. `deezu-shots-api`).
2. In Render: **New → Web Service**, connect that repo.
3. Build command: `npm install`  ·  Start command: `npm start`
4. Add environment variables (Render dashboard → Environment):
   - `JWT_SECRET` — any long random string
   - `DEFAULT_ADMIN_PASSWORD` — the password you want on first boot
   - `FRONTEND_URL` — your GitHub Pages URL, e.g. `https://myusername.github.io`
     (comma-separate more than one origin if you test from several places)
   - `MONGODB_URI` — your Atlas connection string from step 2
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` — from Cloudinary
5. Deploy. Render gives you a URL like `https://deezu-shots-api.onrender.com`.

> **Free-tier note:** Render's free web services spin down after ~15 minutes of no traffic and
> take a few seconds to wake back up on the next request. That's just a cold-start delay, not
> data loss — since content lives in MongoDB and files live in Cloudinary, nothing is ever wiped
> by a spin-down, restart, or redeploy.

---

## 5. Deploy the frontend to GitHub Pages

1. Push the **frontend/** folder's contents to a GitHub repo — either:
   - `myusername.github.io` (root of the repo = root of the site), or
   - any other repo, with Pages enabled for the `main` branch, `/ (root)` folder.
2. Before pushing (or right after, then re-push), edit `frontend/js/config.js`:
   ```js
   window.API_BASE_URL = "https://deezu-shots-api.onrender.com/api";
   ```
3. In the repo's Settings → Pages, confirm the source branch/folder, save, and wait a minute
   for it to build.
4. Visit `https://myusername.github.io` (or your repo's Pages URL).

---

## 6. First login & handover to the client

1. Go to `/admin/login.html` on the live site.
2. Log in with the default password from step 4's Render logs (Render dashboard → your
   service → Logs).
3. Immediately open the **Change password** section at the bottom of the dashboard and set a
   new one — the default is only meant to get you in the door once.
4. From the dashboard you can edit every text field on the site (including the business
   address and Google Maps link), add/rename/delete categories under Photography,
   Videography, and Documentary, and upload or delete photos and video clips.

---

## 7. A few things worth knowing

- **Video size:** uploads are capped at 200MB per file in `backend/routes/media.js`
  (`limits.fileSize`) — raise it there if you need to. Cloudinary's free tier also has its own
  per-file and monthly limits worth checking as the library grows.
- **CORS:** if the dashboard ever shows network errors after deploying, double check
  `FRONTEND_URL` on Render exactly matches your GitHub Pages origin (including `https://`, no
  trailing slash).
- **Deleting media** removes the file from Cloudinary and its record from MongoDB in the same
  action — there's no separate cleanup step.
- The Google Maps link on the contact section links out to the address you gave
  (`https://maps.app.goo.gl/Kis4cLbwURPQT4Jp9`) rather than embedding a map iframe, since
  Google's short links can't be embedded directly — this is editable from the dashboard at any
  time under "Google Maps link".
