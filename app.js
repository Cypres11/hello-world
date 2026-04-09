/**
 * Contact Database — PWA
 * Pure JavaScript + IndexedDB. No server needed.
 *
 * Structure:
 *   DB     — IndexedDB wrapper (open, CRUD)
 *   IO     — CSV and vCard import / CSV export
 *   App    — UI logic: render table, modals, search, sort, resize, bulk-delete
 */

'use strict';

/* ══════════════════════════════════════════════════════════════════
   1. CONSTANTS
══════════════════════════════════════════════════════════════════ */

// The fields in the order we want them in exports/imports
const FIELDS = [
  'first_name', 'last_name', 'email', 'phone',
  'address', 'postal_code', 'city', 'country', 'notes'
];


/* ══════════════════════════════════════════════════════════════════
   2. DB  — IndexedDB wrapper
   IndexedDB is the browser's built-in database.
   It works offline and stores data permanently on the device.
══════════════════════════════════════════════════════════════════ */

const DB = (() => {
  const DB_NAME    = 'contactsDB';
  const DB_VERSION = 1;
  const STORE      = 'contacts';

  // open() returns a Promise that resolves with the database connection.
  // The first time it runs it also creates the object store (like a table).
  function open() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);

      // onupgradeneeded runs when the DB is created for the first time
      req.onupgradeneeded = e => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE)) {
          // autoIncrement: true means the id is set automatically (like AUTOINCREMENT in SQLite)
          db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
        }
      };

      req.onsuccess = e => resolve(e.target.result);
      req.onerror   = e => reject(e.target.error);
    });
  }

  // getAll() — returns all contacts as an array
  async function getAll() {
    const db = await open();
    return new Promise((resolve, reject) => {
      const req = db.transaction(STORE, 'readonly')
                    .objectStore(STORE)
                    .getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror   = e  => reject(e.target.error);
    });
  }

  // add() — inserts a new contact; returns the auto-generated id
  async function add(contact) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const req = db.transaction(STORE, 'readwrite')
                    .objectStore(STORE)
                    .add(contact);
      req.onsuccess = () => resolve(req.result);
      req.onerror   = e  => reject(e.target.error);
    });
  }

  // update() — saves changes to an existing contact (must include .id)
  async function update(contact) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const req = db.transaction(STORE, 'readwrite')
                    .objectStore(STORE)
                    .put(contact);       // put() = insert or replace
      req.onsuccess = () => resolve();
      req.onerror   = e  => reject(e.target.error);
    });
  }

  // remove() — deletes a contact by id
  async function remove(id) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const req = db.transaction(STORE, 'readwrite')
                    .objectStore(STORE)
                    .delete(id);
      req.onsuccess = () => resolve();
      req.onerror   = e  => reject(e.target.error);
    });
  }

  // bulkRemove() — deletes multiple contacts in one transaction
  async function bulkRemove(ids) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const tx    = db.transaction(STORE, 'readwrite');
      const store = tx.objectStore(STORE);
      ids.forEach(id => store.delete(id));
      tx.oncomplete = () => resolve();
      tx.onerror    = e  => reject(e.target.error);
    });
  }

  // Expose only the functions other modules need
  return { getAll, add, update, remove, bulkRemove };
})();


/* ══════════════════════════════════════════════════════════════════
   3. IO  — Import and Export
══════════════════════════════════════════════════════════════════ */

const IO = (() => {

  // ── CSV Export ──────────────────────────────────────────────────
  // Converts the contacts array to a CSV string and triggers download.
  function exportCSV(contacts) {
    // Helper: wrap a cell value in quotes and escape any existing quotes
    const cell = v => `"${(v || '').replace(/"/g, '""')}"`;

    const header = FIELDS.join(',');
    const rows   = contacts.map(c => FIELDS.map(f => cell(c[f])).join(','));
    const csv    = [header, ...rows].join('\r\n');

    // Create a temporary download link and click it
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement('a'), {
      href: url, download: 'contacts.csv'
    });
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── CSV Import ──────────────────────────────────────────────────
  // Parses a CSV string into an array of contact objects.
  function parseCSV(text) {
    const lines = text.split(/\r\n|\r|\n/).filter(l => l.trim());
    if (lines.length < 2) return [];

    // Normalise header names: lowercase, replace spaces with underscores
    const headers = lines[0].split(',')
      .map(h => h.trim().replace(/^"|"$/g, '').toLowerCase().replace(/\s+/g, '_'));

    return lines.slice(1).map(line => {
      // Simple CSV split — handles quoted fields containing commas
      const values = [];
      let current = '', inQuotes = false;
      for (const ch of line) {
        if (ch === '"') { inQuotes = !inQuotes; }
        else if (ch === ',' && !inQuotes) { values.push(current); current = ''; }
        else { current += ch; }
      }
      values.push(current);

      // Map CSV columns to our FIELDS
      const obj = {};
      headers.forEach((h, i) => { obj[h] = (values[i] || '').trim(); });
      return obj;
    });
  }

  // ── vCard Import ────────────────────────────────────────────────
  // Parses a .vcf (vCard) file into contact objects.
  // vCard format docs: https://datatracker.ietf.org/doc/html/rfc6350
  function parseVCard(text) {
    const contacts = [];

    // Split on BEGIN:VCARD to get individual cards
    const blocks = text.split(/BEGIN:VCARD/i).slice(1);

    blocks.forEach(block => {
      const c = Object.fromEntries(FIELDS.map(f => [f, '']));

      // vCard "line folding": a line starting with space/tab continues the previous line
      const unfolded = block
        .replace(/\r\n[ \t]/g, '')
        .replace(/\n[ \t]/g, '');

      unfolded.split(/\r\n|\r|\n/).forEach(line => {
        // Each line is  PROPERTY[;params]:value
        const colon = line.indexOf(':');
        if (colon < 0) return;

        const keyFull = line.slice(0, colon).toUpperCase();
        const value   = line.slice(colon + 1).trim();

        // Strip parameters like TYPE=WORK from the key  (e.g. "EMAIL;TYPE=WORK" → "EMAIL")
        const key = keyFull.split(';')[0];

        switch (key) {
          case 'N': {
            // N:FamilyName;GivenName;Additional;Prefix;Suffix
            const parts = value.split(';');
            c.last_name  = (parts[0] || '').trim();
            c.first_name = (parts[1] || '').trim();
            break;
          }
          case 'FN':
            // FN is the formatted (display) name — only use if N: gave us nothing
            if (!c.first_name && !c.last_name) {
              const parts = value.trim().split(/\s+/);
              c.last_name  = parts.pop() || '';
              c.first_name = parts.join(' ');
            }
            break;
          case 'EMAIL':
            if (!c.email) c.email = value;
            break;
          case 'TEL':
            if (!c.phone) c.phone = value;
            break;
          case 'ADR': {
            // ADR:POBox;Extended;Street;City;Region;PostalCode;Country
            const parts = value.split(';');
            c.address     = (parts[2] || '').trim();
            c.city        = (parts[3] || '').trim();
            c.postal_code = (parts[5] || '').trim();
            c.country     = (parts[6] || '').trim();
            break;
          }
          case 'NOTE':
            c.notes = value;
            break;
        }
      });

      if (c.first_name || c.last_name) contacts.push(c);
    });

    return contacts;
  }

  // ── Shared insert helper ────────────────────────────────────────
  // Takes an array of raw objects (from CSV or vCard) and saves them to DB.
  async function insertRows(rows) {
    let added = 0, skipped = 0;
    for (const row of rows) {
      let first = (row.first_name || row.name || '').trim();
      let last  = (row.last_name  || '').trim();

      // If the file only had a combined "name" column, split it
      if (!first && !last && row.name) {
        const parts = row.name.trim().split(/\s+/);
        last  = parts.pop() || '';
        first = parts.join(' ');
      }

      if (!first && !last) { skipped++; continue; }

      const contact = {};
      FIELDS.forEach(f => { contact[f] = (row[f] || '').trim(); });
      contact.first_name = first;
      contact.last_name  = last;

      await DB.add(contact);
      added++;
    }
    return { added, skipped };
  }

  return { exportCSV, parseCSV, parseVCard, insertRows };
})();


/* ══════════════════════════════════════════════════════════════════
   4. App  — UI logic
══════════════════════════════════════════════════════════════════ */

const App = (() => {

  // ── State ───────────────────────────────────────────────────────
  let allContacts  = [];   // everything from IndexedDB
  let displayed    = [];   // what's currently shown (after search/sort)
  let sortCol      = null; // which column is sorted
  let sortDir      = 1;    // 1 = A→Z,  -1 = Z→A

  // Bootstrap modal instances (created once, reused)
  let contactModalBS, importModalBS;

  // ── Initialise ──────────────────────────────────────────────────
  async function init() {
    // Create Bootstrap modal objects
    contactModalBS = new bootstrap.Modal(document.getElementById('contactModal'));
    importModalBS  = new bootstrap.Modal(document.getElementById('importModal'));

    // Load contacts from IndexedDB and draw the table
    await refresh();

    // Search on every keystroke
    document.getElementById('searchInput').addEventListener('input', search);

    // Keyboard shortcut: Enter in search box
    document.getElementById('searchInput').addEventListener('keydown', e => {
      if (e.key === 'Escape') clearSearch();
    });

    // Wire up sortable column headers
    document.querySelectorAll('#contactTable thead th.sortable').forEach(th => {
      th.addEventListener('click', () => sortBy(th));
    });

    // Wire up resizable columns
    initResizers();

    // Register service worker for offline support
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(() => {
        // Silently ignore — app still works without it
      });
    }
  }

  // ── Load from DB and re-render ───────────────────────────────────
  async function refresh() {
    allContacts = await DB.getAll();
    applySearchAndSort();
  }

  // ── Search ──────────────────────────────────────────────────────
  function search() {
    applySearchAndSort();
  }

  function clearSearch() {
    document.getElementById('searchInput').value = '';
    applySearchAndSort();
  }

  // Filter + sort + render in one go
  function applySearchAndSort() {
    const q = document.getElementById('searchInput').value.trim().toLowerCase();
    document.getElementById('btnClearSearch').style.display = q ? '' : 'none';

    // Filter
    displayed = q
      ? allContacts.filter(c =>
          ['first_name','last_name','email','phone','city','country']
            .some(f => (c[f] || '').toLowerCase().includes(q))
        )
      : [...allContacts];

    // Sort
    if (sortCol) {
      displayed.sort((a, b) =>
        (a[sortCol] || '').localeCompare(b[sortCol] || '', undefined, { numeric: true }) * sortDir
      );
    } else {
      // Default: sort by last name then first name
      displayed.sort((a, b) =>
        (a.last_name || '').localeCompare(b.last_name || '') ||
        (a.first_name || '').localeCompare(b.first_name || '')
      );
    }

    renderTable();
  }

  // ── Sort ─────────────────────────────────────────────────────────
  function sortBy(th) {
    const col = th.dataset.col;

    // Reset previous sort header's icon
    if (sortCol && sortCol !== col) {
      const prevTh = document.querySelector(`th[data-col="${sortCol}"]`);
      if (prevTh) {
        prevTh.classList.remove('sort-asc', 'sort-desc');
        prevTh.querySelector('.sort-icon').className = 'bi bi-arrow-down-up sort-icon';
      }
    }

    if (sortCol === col) {
      sortDir *= -1;  // toggle direction
    } else {
      sortCol = col;
      sortDir = 1;
    }

    th.classList.toggle('sort-asc',  sortDir ===  1);
    th.classList.toggle('sort-desc', sortDir === -1);
    th.querySelector('.sort-icon').className =
      sortDir === 1 ? 'bi bi-arrow-up sort-icon' : 'bi bi-arrow-down sort-icon';

    applySearchAndSort();
  }

  // ── Render table ─────────────────────────────────────────────────
  function renderTable() {
    const tbody = document.getElementById('contactTbody');
    const wrap  = document.getElementById('tableWrap');
    const empty = document.getElementById('emptyState');
    const count = document.getElementById('contactCount');
    const q     = document.getElementById('searchInput').value.trim();

    if (displayed.length === 0) {
      wrap.style.display  = 'none';
      empty.style.display = '';
      document.getElementById('emptyMsg').textContent = q
        ? `No contacts match "${q}".`
        : 'No contacts yet. Add your first one!';
      count.textContent = '';
    } else {
      wrap.style.display  = '';
      empty.style.display = 'none';
      count.textContent   =
        `${displayed.length} contact${displayed.length !== 1 ? 's' : ''}`;
    }

    // Build all table rows at once (much faster than appending one by one)
    tbody.innerHTML = displayed.map(c => `
      <tr data-id="${c.id}">
        <td class="cb-col">
          <input type="checkbox" class="form-check-input row-cb"
                 onchange="App.updateBulkBar()">
        </td>
        <td class="fw-semibold">${esc(c.first_name)}</td>
        <td class="fw-semibold">${esc(c.last_name)}</td>
        <td>${c.email  ? `<a href="mailto:${esc(c.email)}">${esc(c.email)}</a>` : ''}</td>
        <td>${c.phone  ? `<a href="tel:${esc(c.phone)}">${esc(c.phone)}</a>`   : ''}</td>
        <td>${esc(c.address)}</td>
        <td>${esc(c.postal_code)}</td>
        <td>${esc(c.city)}</td>
        <td>${esc(c.country)}</td>
        <td class="text-muted">${esc(c.notes)}</td>
        <td class="text-end text-nowrap">
          <button class="btn btn-sm btn-outline-secondary me-1"
                  onclick="App.openEditModal(${c.id})" title="Edit">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger"
                  onclick="App.deleteOne(${c.id}, '${esc(c.first_name)} ${esc(c.last_name)}')"
                  title="Delete">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>`).join('');

    // Reset select-all checkbox
    document.getElementById('selectAll').checked       = false;
    document.getElementById('selectAll').indeterminate = false;
    updateBulkBar();
  }

  // HTML-escape helper — prevents XSS when inserting data into innerHTML
  function esc(v) {
    return (v || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ── Add / Edit modal ─────────────────────────────────────────────
  function openAddModal() {
    document.getElementById('modalTitle').textContent = 'Add Contact';
    document.getElementById('editId').value = '';
    clearForm();
    hideFormError();
    contactModalBS.show();
  }

  function openEditModal(id) {
    const c = allContacts.find(x => x.id === id);
    if (!c) return;
    document.getElementById('modalTitle').textContent = 'Edit Contact';
    document.getElementById('editId').value = id;
    document.getElementById('fFirstName').value  = c.first_name  || '';
    document.getElementById('fLastName').value   = c.last_name   || '';
    document.getElementById('fEmail').value      = c.email       || '';
    document.getElementById('fPhone').value      = c.phone       || '';
    document.getElementById('fAddress').value    = c.address     || '';
    document.getElementById('fPostalCode').value = c.postal_code || '';
    document.getElementById('fCity').value       = c.city        || '';
    document.getElementById('fCountry').value    = c.country     || '';
    document.getElementById('fNotes').value      = c.notes       || '';
    hideFormError();
    contactModalBS.show();
  }

  async function saveContact() {
    const first = document.getElementById('fFirstName').value.trim();
    const last  = document.getElementById('fLastName').value.trim();
    if (!first && !last) {
      showFormError('At least a first name or last name is required.');
      return;
    }

    const contact = {
      first_name:  first,
      last_name:   last,
      email:       document.getElementById('fEmail').value.trim(),
      phone:       document.getElementById('fPhone').value.trim(),
      address:     document.getElementById('fAddress').value.trim(),
      postal_code: document.getElementById('fPostalCode').value.trim(),
      city:        document.getElementById('fCity').value.trim(),
      country:     document.getElementById('fCountry').value.trim(),
      notes:       document.getElementById('fNotes').value.trim(),
    };

    const idVal = document.getElementById('editId').value;
    if (idVal) {
      contact.id = Number(idVal);
      await DB.update(contact);
      notify(`Contact "${first} ${last}" updated.`, 'success');
    } else {
      await DB.add(contact);
      notify(`Contact "${first} ${last}" added.`, 'success');
    }

    contactModalBS.hide();
    await refresh();
  }

  // ── Delete single ────────────────────────────────────────────────
  async function deleteOne(id, name) {
    if (!confirm(`Delete ${name}? This cannot be undone.`)) return;
    await DB.remove(id);
    notify(`Contact "${name}" deleted.`, 'success');
    await refresh();
  }

  // ── Bulk delete ──────────────────────────────────────────────────
  async function bulkDelete() {
    const checked = document.querySelectorAll('#contactTbody .row-cb:checked');
    if (!checked.length) return;
    if (!confirm(`Delete ${checked.length} contact(s)? This cannot be undone.`)) return;

    const ids = Array.from(checked).map(cb => Number(cb.closest('tr').dataset.id));
    await DB.bulkRemove(ids);
    notify(`Deleted ${ids.length} contact(s).`, 'success');
    await refresh();
  }

  function toggleSelectAll(checked) {
    document.querySelectorAll('#contactTbody .row-cb')
      .forEach(cb => cb.checked = checked);
    updateBulkBar();
  }

  function updateBulkBar() {
    const all     = document.querySelectorAll('#contactTbody .row-cb');
    const checked = document.querySelectorAll('#contactTbody .row-cb:checked');
    const n = checked.length;
    document.getElementById('selCount').textContent = n;
    document.getElementById('btnDeleteSelected').classList.toggle('d-none', n === 0);
    document.getElementById('selectAll').checked       = n > 0 && n === all.length;
    document.getElementById('selectAll').indeterminate = n > 0 && n < all.length;
  }

  // ── CSV Export ───────────────────────────────────────────────────
  function exportCSV() {
    IO.exportCSV(displayed.length ? displayed : allContacts);
  }

  // ── Import (CSV or vCard) ────────────────────────────────────────
  async function importFile() {
    const file = document.getElementById('importFile').files[0];
    if (!file) { showImportError('Please choose a file.'); return; }

    const name = file.name.toLowerCase();
    const text = await file.text();

    let rows;
    if (name.endsWith('.vcf')) {
      rows = IO.parseVCard(text);
    } else if (name.endsWith('.csv')) {
      rows = IO.parseCSV(text);
    } else {
      showImportError('Please choose a .vcf or .csv file.');
      return;
    }

    if (rows.length === 0) {
      showImportError('No contacts found in this file.');
      return;
    }

    const { added, skipped } = await IO.insertRows(rows);
    importModalBS.hide();

    let msg = `Imported ${added} contact(s)`;
    if (skipped) msg += `, skipped ${skipped} row(s) without a name`;
    notify(msg + '.', 'success');

    document.getElementById('importFile').value = '';
    hideImportError();
    await refresh();
  }

  // ── Notifications ────────────────────────────────────────────────
  function notify(message, type = 'success') {
    const box   = document.getElementById('alertBox');
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.innerHTML = `${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;
    box.prepend(alert);
    // Auto-dismiss after 4 seconds
    setTimeout(() => bootstrap.Alert.getOrCreateInstance(alert).close(), 4000);
  }

  function showFormError(msg) {
    const el = document.getElementById('formError');
    el.textContent = msg;
    el.style.display = '';
  }
  function hideFormError() {
    document.getElementById('formError').style.display = 'none';
  }
  function showImportError(msg) {
    const el = document.getElementById('importError');
    el.textContent = msg;
    el.style.display = '';
  }
  function hideImportError() {
    document.getElementById('importError').style.display = 'none';
  }
  function clearForm() {
    ['fFirstName','fLastName','fEmail','fPhone','fAddress',
     'fPostalCode','fCity','fCountry','fNotes']
      .forEach(id => document.getElementById(id).value = '');
  }

  // ── Resizable columns ────────────────────────────────────────────
  // Drag the right edge of a column header to resize it.
  // Widths are saved in localStorage so they survive a page refresh.
  const RESIZE_KEY = 'contactdb-col-widths';

  function initResizers() {
    const saved = JSON.parse(localStorage.getItem(RESIZE_KEY) || '{}');

    document.querySelectorAll('#contactTable thead th[data-col]').forEach(th => {
      // Restore saved width
      if (saved[th.dataset.col]) th.style.width = saved[th.dataset.col] + 'px';

      // Create drag handle
      const handle = document.createElement('div');
      handle.className = 'col-resizer';
      th.appendChild(handle);

      let startX, startW;

      handle.addEventListener('mousedown', e => {
        e.preventDefault();
        e.stopPropagation();   // Don't trigger sort
        startX = e.pageX;
        startW = th.offsetWidth;
        handle.classList.add('resizing');
        document.body.style.cursor     = 'col-resize';
        document.body.style.userSelect = 'none';

        const onMove = e => {
          th.style.width = Math.max(60, startW + (e.pageX - startX)) + 'px';
        };
        const onUp = () => {
          handle.classList.remove('resizing');
          document.body.style.cursor     = '';
          document.body.style.userSelect = '';
          saveWidths();
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup',   onUp);
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup',   onUp);
      });

      // Double-click: reset to auto width
      handle.addEventListener('dblclick', e => {
        e.preventDefault();
        th.style.width = '';
        saveWidths();
      });
    });
  }

  function saveWidths() {
    const widths = {};
    document.querySelectorAll('#contactTable thead th[data-col]').forEach(th => {
      widths[th.dataset.col] = th.offsetWidth;
    });
    localStorage.setItem(RESIZE_KEY, JSON.stringify(widths));
  }

  // ── Public interface ─────────────────────────────────────────────
  // These functions are called from HTML onclick attributes.
  return {
    init,
    search, clearSearch,
    openAddModal, openEditModal, saveContact,
    deleteOne, bulkDelete, toggleSelectAll, updateBulkBar,
    exportCSV, importFile,
  };

})();


// ── Start the app when the page is ready ──────────────────────────
document.addEventListener('DOMContentLoaded', () => App.init());
