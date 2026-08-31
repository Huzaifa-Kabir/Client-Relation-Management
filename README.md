# Housing Disrepair CRM (Static / GitHub Pages Edition)

> Includes a **Date of Birth** field for both Client 1 and Client 2 (Section A), in addition to
> everything below.

A fully static, client-side rebuild of the Housing Disrepair CRM — plain HTML, CSS, and
JavaScript only. No server, no build step, no `npm install`. This deploys directly to
**GitHub Pages**, which only serves static files.

## What changed from the full-stack version

GitHub Pages cannot run a Node.js/Express server or a SQLite database, so this version moves
everything client-side:

| Feature              | Full-stack version              | This static version                                  |
|-----------------------|----------------------------------|-------------------------------------------------------|
| Auth                 | Express session, server-checked | Hardcoded check in `js/auth.js`, flag in `sessionStorage` |
| Case storage         | SQLite (`better-sqlite3`)       | Browser IndexedDB via [localForage](https://localforage.github.io/localForage/) (loaded from a CDN) |
| Uploaded photos      | Saved to disk, served by Express | Converted to base64 and stored inline with the case record |
| PDF export           | Server-side (`pdfkit`)          | Client-side ([jsPDF](https://github.com/parallax/jsPDF), loaded from a CDN) |

The two CDN scripts (`localforage` and `jspdf`) are the only external dependencies — both are
plain `<script>` tags in the HTML, so there's nothing to install and nothing that needs a build
tool.

**Important trade-off:** because everything lives in the browser's local storage, case data is
private to *that specific browser on that specific device* — it is not shared across devices or
visible to anyone else, and clearing site data/cookies for the page will erase it. This matches
what a static, no-backend site can offer; it is not a substitute for a real shared database if
multiple people need to see the same cases.

## Project structure

```
housing-disrepair-crm-pages/
├── index.html            # Login page (GitHub Pages entry point)
├── dashboard.html        # All Cases view
├── case-form.html        # Create / Edit case (Sections A–E)
├── case-view.html        # Read-only case view + PDF export
├── css/style.css
└── js/
    ├── auth.js           # Hardcoded login check
    ├── storage.js        # IndexedDB (localForage) read/write helpers
    ├── pdf-export.js     # Client-side PDF generation (jsPDF)
    ├── login.js
    ├── dashboard.js
    ├── case-form.js
    └── case-view.js
```

## Run it locally first (optional but recommended)

Because the pages use `fetch`-free, same-origin `<script>` loading, you can just open
`index.html` directly in a browser, or serve the folder with any static server, e.g.:

```bash
cd housing-disrepair-crm-pages
python3 -m http.server 8000
# then open http://localhost:8000
```

Login: `Huzaifa` / `Huzaifakabir@123`

## Deploy to your GitHub profile

1. **Create a new repository** on GitHub (e.g. `housing-disrepair-crm`). It can be public or
   private — Pages works for both on paid plans; public repos get Pages free.

2. **Push this folder's contents to the repo root** (so `index.html` sits at the top level):
   ```bash
   cd housing-disrepair-crm-pages
   git init
   git add .
   git commit -m "Housing Disrepair CRM - static build"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo>.git
   git push -u origin main
   ```

3. **Turn on GitHub Pages:**
   - Go to your repo → **Settings** → **Pages**
   - Under "Build and deployment", set **Source** to **Deploy from a branch**
   - Set **Branch** to `main` and folder to `/ (root)`
   - Click **Save**

4. GitHub will give you a URL shortly after, typically:
   ```
   https://<your-username>.github.io/<your-repo>/
   ```
   It can take a minute or two to go live the first time.

5. **Visit that URL** and log in with the credentials above.

### If you'd rather host it as your main profile site

If your repo is named exactly `<your-username>.github.io`, GitHub Pages serves it at
`https://<your-username>.github.io/` (no repo name in the path) instead — same steps above, just
name the repo that way when you create it.

## Notes

- Since credentials live in a plain JS file that ships to the browser, anyone can view-source and
  see them — this mirrors the "hardcoded login" requirement as given, but isn't real security.
  Don't put sensitive real client data into a public GitHub Pages deployment.
- If you later want real shared, multi-device storage and server-side security, the original
  full-stack version (Node/Express + SQLite) is the one to deploy to a host that can run a server,
  such as Render, Railway, or Fly.io — GitHub Pages alone can't run that version.
