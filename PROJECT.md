# Project Document — Contacts Database App

**Owner:** Roland Broos (Cypres11)
**Started:** May 2026
**Status:** Active

---

## 1. Background

A retired engineer learning to code, starting with GitHub and Python. The goal was to build a practical, real-world application as a learning project — a personal contact database that could be used on a Mac and an iPad.

---

## 2. Project Goals

- Build a contact database that can be modified in a web browser
- Run on any machine without installation
- Work on iPad and iPhone
- No monthly costs or subscriptions
- Learn Git, Python, JavaScript along the way

---

## 3. Development Journey

### Phase 1 — Flask Web App (Python)

The first version was built as a server-side web application using Python and Flask, with an SQLite database stored as a local file (`contacts.db`).

**What was built:**
- Full CRUD (add, edit, delete contacts)
- Search across name, email, phone, city, country
- CSV export and import
- vCard (.vcf) import — for direct import from Mac Contacts app
- Bootstrap 5 UI with responsive layout

**Fields:** name, email, phone, address, postal code, city, country, notes

**Key technical decisions:**
- Flask (Python web framework) — simple, easy to learn
- SQLite — lightweight, file-based database, no server needed
- Bootstrap 5 — clean UI without writing CSS from scratch
- vobject library — for parsing vCard files from Mac Contacts

**How to run:**
```bash
pip install -r requirements.txt
python app.py
# Open http://localhost:5020
```

**Limitation identified:** Flask requires Python to be running as a server. Cannot run on iPad.

---

### Phase 2 — UI Improvements

Several usability improvements were added to the Flask version:

- **Resizable columns** — drag the right edge of any column header; widths saved in localStorage
- **Sortable columns** — click any header to sort A→Z, click again for Z→A
- **Bulk delete** — checkboxes on each row, select-all, delete selected
- **Split name fields** — separated into First name and Last name
- **Address split** — separated into Street address, Postal code, City, Country
- **Category field** — free-text field for grouping contacts

---

### Phase 3 — Progressive Web App (PWA)

To make the app work on iPad without a server, the entire app was rewritten as a **Progressive Web App (PWA)** using pure JavaScript.

**Key architectural change:**
- Removed Flask/Python backend entirely
- Data now stored in **IndexedDB** (browser's built-in database)
- App runs entirely in the browser — no server needed
- Works offline after first load

**Files:**

| File | Purpose |
|---|---|
| `index.html` | Complete UI — toolbar, table, modals |
| `app.js` | All JavaScript logic (DB, IO, App modules) |
| `manifest.json` | PWA manifest — enables "Add to Home Screen" |
| `sw.js` | Service worker — offline caching |
| `icon.svg` | App icon for iPad home screen |
| `logo.jpg` | Company logo shown in toolbar |

**JavaScript architecture (app.js):**

```
DB module   — IndexedDB wrapper (open, getAll, add, update, remove, bulkRemove)
IO module   — CSV export, CSV import parser, vCard parser, insertRows helper
App module  — UI: render table, search, sort, modals, bulk delete, resize columns
```

**PWA features:**
- Installable on iPad/iPhone home screen via Safari → Share → Add to Home Screen
- Works offline after first load (service worker caches all assets)
- Runs full-screen like a native app when installed

---

### Phase 4 — Deployment

**GitHub Pages** was used for free public hosting:
- No server costs
- Automatic deployment on every `git push`
- Accessible from any device with a browser

**URLs:**
- Repository: `github.com/Cypres11/contacts-db`
- Live app: `https://cypres11.github.io/contacts-db/`

---

## 4. Features (current version)

| Feature | Description |
|---|---|
| Add contact | Modal form with all fields |
| Edit contact | Same modal, pre-filled |
| Delete contact | Single delete with confirmation |
| Bulk delete | Checkboxes + "Delete selected" button |
| Search | Real-time search across name, category, email, phone, city, country |
| Sort | Click column header; arrow shows direction |
| Resize columns | Drag right edge of header; widths saved in localStorage |
| Export CSV | Downloads all (or filtered) contacts as .csv |
| Import CSV | Upload CSV with header row |
| Import vCard | Upload .vcf exported from Mac Contacts app |
| Offline | Works without internet after first load |
| Installable | Add to iPad/iPhone/Mac home screen |

**Contact fields:**
first name, last name, category, email, phone, street address, postal code, city, country, notes

---

## 5. Data Storage

Contacts are stored in **IndexedDB**, the browser's built-in database.

| Property | Detail |
|---|---|
| Location | Inside the browser on the device |
| Visible in Finder/Files? | No |
| Shared between devices? | No — each device has its own copy |
| Shared between browsers? | No — Chrome and Safari are separate |
| Backup method | Export CSV |

> **Important:** always export CSV regularly as a backup. If browser data is cleared, contacts are lost.

To move contacts between devices: **Export CSV** on one device, **Import CSV** on the other.

---

## 6. Repository Structure

```
contacts-db/
├── index.html       # PWA UI
├── app.js           # All JavaScript
├── manifest.json    # PWA manifest
├── sw.js            # Service worker
├── icon.svg         # App icon
├── logo.jpg         # Logo
└── README.md        # User guide

hello-world/         # Original learning repo (kept for reference)
├── app.py           # Flask version (legacy)
├── requirements.txt
└── templates/
    ├── index.html
    └── form.html
```

---

## 7. Technology Stack

| Layer | Technology | Reason |
|---|---|---|
| UI | HTML + Bootstrap 5 | Responsive, works on any screen |
| Logic | Vanilla JavaScript | No frameworks — easy to learn from |
| Database | IndexedDB | No server needed, works offline |
| Offline | Service Worker | Caches files after first load |
| Install | Web App Manifest | "Add to Home Screen" on iOS |
| Hosting | GitHub Pages | Free, automatic deployment |
| Version control | Git + GitHub | Industry standard |

---

## 8. Working with the Code

### Local development (Mac)

```bash
cd ~/Documents/contacts-db
python3 -m http.server 8080
# Open http://localhost:8080
```

### Deploying updates

```bash
cd ~/Documents/contacts-db
# Make your changes to index.html or app.js
git add .
git commit -m "Description of what changed"
git push origin main
# GitHub Pages updates automatically within ~1 minute
```

### Getting updates on iPad

Open `https://cypres11.github.io/contacts-db/` in Safari and refresh.
If you see an old version: clear Safari cache or do a hard refresh.

---

## 9. Lessons Learned

- **Git workflow:** clone → edit → add → commit → push
- **Branch management:** feature branches, merging into master/main
- **Python/Flask:** routing, templates, SQLite, CSV handling, vCard parsing
- **JavaScript:** modules, async/await, Promises, DOM manipulation, IndexedDB
- **PWA concepts:** service workers, Web App Manifest, offline caching
- **Browser storage:** difference between localStorage, IndexedDB, cookies
- **GitHub Pages:** free static hosting directly from a repository

---

## 10. Future Ideas

- [ ] Sync contacts between devices (would require a backend or cloud service)
- [ ] Photo/avatar per contact
- [ ] Birthday reminders
- [ ] Groups / tags for bulk emailing
- [ ] Dark mode
- [ ] Print view / address labels

---

*Project developed with Claude Code (Anthropic) — May 2026*
