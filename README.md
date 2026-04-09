# Contact Database — PWA

A personal contact database that runs entirely in your browser.
No server, no account, no subscription. Works on Mac, iPad, iPhone, and any device with a modern browser.

---

## Features

- **Add, edit and delete** contacts with full details
- **Fields:** First name, Last name, Category, Email, Phone, Street address, Postal code, City, Country, Notes
- **Search** across name, category, email, phone, city and country
- **Sort** any column by clicking its header (click again to reverse)
- **Resize columns** by dragging the right edge of a header; double-click to reset
- **Select multiple contacts** with checkboxes and delete them in one go
- **Export to CSV** — downloads all contacts as a spreadsheet-compatible file
- **Import from CSV** — upload a CSV file exported from Excel or Numbers
- **Import from vCard (.vcf)** — import directly from the Mac Contacts app
- **Works offline** — once loaded, the app works without internet
- **Installable** on iPad and iPhone home screen (behaves like a native app)

---

## Where your data lives

Contacts are stored in **IndexedDB**, the browser's built-in database.

| What | Detail |
|---|---|
| Location | Inside the browser, on your device |
| Visible in Finder? | No — managed by the browser |
| Shared between devices? | No — each device has its own copy |
| Shared between browsers? | No — Chrome and Safari have separate storage |
| Survives page refresh? | Yes |
| Lost if you clear browser data? | Yes |

> **Always keep a backup: use Export CSV regularly.**
> To move contacts between devices, export CSV on one and import on the other.

---

## Running the app locally (Mac)

### First time

```bash
# 1. Clone the repository (creates a folder called contacts-app)
git clone https://github.com/Cypres11/hello-world.git ~/Documents/contacts-app
cd ~/Documents/contacts-app

# 2. Start a local web server
python3 -m http.server 8080
```

Then open **http://localhost:8080** in your browser.

### Every time after that

```bash
cd ~/Documents/contacts-app
git pull origin master        # get the latest updates
python3 -m http.server 8080
```

Open **http://localhost:8080**. Stop the server with `Ctrl + C`.

---

## Using on iPad / iPhone (via GitHub Pages)

The app is published at:

**https://cypres11.github.io/hello-world/**

Open that URL in **Safari** on your iPad or iPhone.

### Install to home screen

1. Tap the **Share** button (box with an arrow pointing up)
2. Tap **Add to Home Screen**
3. Tap **Add**

The app now appears on your home screen and opens full-screen, just like a native app.
It works offline after the first load.

---

## Importing your Mac contacts

1. Open the **Contacts** app on your Mac
2. Press **⌘A** to select all contacts
3. Go to **File → Export → Export vCard…**
4. Save the `.vcf` file anywhere
5. Open the contact database app
6. Click **Import** → choose the `.vcf` file → click **Import**

---

## Importing / Exporting CSV

### Export
Click **Export CSV** in the toolbar. A file called `contacts.csv` is downloaded.
Open it in Excel or Numbers to view or edit.

### Import
The CSV must have a header row. Recognised column names:

| Column | Required? |
|---|---|
| `first_name` | At least one name column is required |
| `last_name` | At least one name column is required |
| `category` | optional |
| `email` | optional |
| `phone` | optional |
| `address` | optional |
| `postal_code` | optional |
| `city` | optional |
| `country` | optional |
| `notes` | optional |

Extra columns are ignored. A combined `name` column is also accepted and split automatically.

---

## Updating the app

When a new version is available:

```bash
cd ~/Documents/contacts-app
git pull origin master
```

Then restart the local server. On iPad, refresh the page in Safari.

---

## File structure

```
hello-world/
├── index.html       # The complete UI (toolbar, table, modals)
├── app.js           # All JavaScript logic:
│                    #   DB  — IndexedDB database (read, write, delete)
│                    #   IO  — CSV and vCard import / CSV export
│                    #   App — table rendering, search, sort, modals
├── manifest.json    # PWA manifest — makes the app installable
├── sw.js            # Service worker — enables offline use
├── icon.svg         # App icon shown on iPad home screen
├── logo.jpg         # Logo shown in the toolbar
│
│   (Legacy Flask version — kept for reference)
├── app.py           # Python/Flask web server
├── requirements.txt # Python dependencies
└── templates/       # Jinja2 HTML templates
```

---

## Technology overview

| Layer | Technology | Why |
|---|---|---|
| UI | HTML + Bootstrap 5 | Clean, responsive, works on any screen size |
| Logic | Vanilla JavaScript | No frameworks — easy to read and learn from |
| Database | IndexedDB (browser built-in) | No server needed, works offline |
| Offline | Service Worker | Caches files so the app works without internet |
| Install | Web App Manifest | Enables "Add to Home Screen" on iOS/Android |
| Hosting | GitHub Pages (free) | Public URL, no server costs |

---

## Troubleshooting

**Logo does not appear**
Make sure `logo.jpg` (lowercase) is in the root of the repository.

**App shows old version after an update**
Hard-refresh: `⌘ Shift R` on Mac, or clear Safari cache on iPad.

**Contacts disappeared**
This happens if browser data was cleared. Export CSV regularly as a backup.

**"Not a git repository" error**
You are in the wrong folder. Run `cd ~/Documents/contacts-app` first.

---

*Built with Claude Code — a retired engineer learning to code, April 2026.*
