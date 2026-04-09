import csv
import io
import sqlite3
import os
import vobject
from flask import Flask, render_template, request, redirect, url_for, flash, Response

app = Flask(__name__)
app.secret_key = "change-me-in-production"

DB_PATH = os.path.join(os.path.dirname(__file__), "contacts.db")

FIELDS = ["first_name", "last_name", "email", "phone", "address", "postal_code", "city", "country", "notes"]


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with get_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS contacts (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                first_name  TEXT,
                last_name   TEXT,
                email       TEXT,
                phone       TEXT,
                address     TEXT,
                postal_code TEXT,
                city        TEXT,
                country     TEXT,
                notes       TEXT
            )
        """)
        existing = {row[1] for row in conn.execute("PRAGMA table_info(contacts)")}

        # Add any missing columns (migrates older databases)
        for col in ("first_name", "last_name", "postal_code", "city", "country"):
            if col not in existing:
                conn.execute(f"ALTER TABLE contacts ADD COLUMN {col} TEXT")

        # Migrate old single 'name' column → first_name / last_name
        if "name" in existing:
            rows = conn.execute(
                "SELECT id, name FROM contacts WHERE first_name IS NULL AND last_name IS NULL AND name IS NOT NULL"
            ).fetchall()
            for row in rows:
                parts = (row["name"] or "").strip().rsplit(" ", 1)
                first = parts[0] if len(parts) == 2 else parts[0]
                last = parts[1] if len(parts) == 2 else ""
                conn.execute(
                    "UPDATE contacts SET first_name=?, last_name=? WHERE id=?",
                    (first, last, row["id"]),
                )


def _display_name(row):
    return " ".join(filter(None, [row.get("first_name", ""), row.get("last_name", "")])) or "—"


def _form_values():
    return {f: request.form.get(f, "").strip() for f in FIELDS}


@app.route("/")
def index():
    query = request.args.get("q", "").strip()
    with get_db() as conn:
        if query:
            like = f"%{query}%"
            rows = conn.execute(
                """SELECT * FROM contacts
                   WHERE first_name LIKE ? OR last_name LIKE ?
                      OR email LIKE ? OR phone LIKE ?
                      OR city LIKE ? OR country LIKE ?
                   ORDER BY last_name, first_name""",
                (like, like, like, like, like, like),
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM contacts ORDER BY last_name, first_name"
            ).fetchall()
    return render_template("index.html", contacts=rows, query=query)


@app.route("/add", methods=["GET", "POST"])
def add():
    if request.method == "POST":
        vals = _form_values()
        if not vals["first_name"] and not vals["last_name"]:
            flash("At least a first name or last name is required.", "danger")
            return render_template("form.html", contact=vals, action="Add")
        with get_db() as conn:
            conn.execute(
                """INSERT INTO contacts (first_name,last_name,email,phone,address,postal_code,city,country,notes)
                   VALUES (?,?,?,?,?,?,?,?,?)""",
                [vals[f] for f in FIELDS],
            )
        flash(f'Contact "{vals["first_name"]} {vals["last_name"]}" added.', "success")
        return redirect(url_for("index"))
    return render_template("form.html", contact=None, action="Add")


@app.route("/edit/<int:contact_id>", methods=["GET", "POST"])
def edit(contact_id):
    with get_db() as conn:
        contact = conn.execute("SELECT * FROM contacts WHERE id=?", (contact_id,)).fetchone()
    if contact is None:
        flash("Contact not found.", "danger")
        return redirect(url_for("index"))
    if request.method == "POST":
        vals = _form_values()
        if not vals["first_name"] and not vals["last_name"]:
            flash("At least a first name or last name is required.", "danger")
            return render_template("form.html", contact=contact, action="Save")
        with get_db() as conn:
            conn.execute(
                """UPDATE contacts
                   SET first_name=?,last_name=?,email=?,phone=?,address=?,postal_code=?,city=?,country=?,notes=?
                   WHERE id=?""",
                [vals[f] for f in FIELDS] + [contact_id],
            )
        flash(f'Contact "{vals["first_name"]} {vals["last_name"]}" updated.', "success")
        return redirect(url_for("index"))
    return render_template("form.html", contact=contact, action="Save")


@app.route("/delete/<int:contact_id>", methods=["POST"])
def delete(contact_id):
    with get_db() as conn:
        row = conn.execute("SELECT first_name, last_name FROM contacts WHERE id=?", (contact_id,)).fetchone()
        if row:
            conn.execute("DELETE FROM contacts WHERE id=?", (contact_id,))
            flash(f'Contact "{row["first_name"]} {row["last_name"]}" deleted.', "success")
    return redirect(url_for("index"))


@app.route("/export")
def export_csv():
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM contacts ORDER BY last_name, first_name").fetchall()
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(FIELDS)
    for row in rows:
        writer.writerow([row[f] or "" for f in FIELDS])
    return Response(
        buf.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment; filename=contacts.csv"},
    )


def _insert_contacts(conn, rows):
    added = skipped = 0
    for row in rows:
        first = (row.get("first_name") or row.get("name") or "").strip()
        last = (row.get("last_name") or "").strip()
        # If only a combined 'name' key exists, split it
        if not first and not last and row.get("name"):
            parts = row["name"].strip().rsplit(" ", 1)
            first = parts[0]
            last = parts[1] if len(parts) == 2 else ""
        if not first and not last:
            skipped += 1
            continue
        conn.execute(
            """INSERT INTO contacts (first_name,last_name,email,phone,address,postal_code,city,country,notes)
               VALUES (?,?,?,?,?,?,?,?,?)""",
            [first, last] + [(row.get(f) or "").strip() for f in FIELDS[2:]],
        )
        added += 1
    return added, skipped


def _parse_vcard(content):
    rows = []
    for vcard in vobject.readComponents(content):
        row = {f: "" for f in FIELDS}
        # Prefer structured N: field for first/last name
        try:
            n = vcard.n.value
            row["first_name"] = (n.given or "").strip()
            row["last_name"] = (n.family or "").strip()
        except Exception:
            try:
                # Fall back to splitting FN
                parts = str(vcard.fn.value).strip().rsplit(" ", 1)
                row["first_name"] = parts[0]
                row["last_name"] = parts[1] if len(parts) == 2 else ""
            except Exception:
                pass
        try:
            row["email"] = str(vcard.email.value).strip()
        except Exception:
            pass
        try:
            row["phone"] = str(vcard.tel.value).strip()
        except Exception:
            pass
        try:
            adr = vcard.adr.value
            row["address"] = (adr.street or "").strip()
            row["city"] = (adr.city or "").strip()
            row["postal_code"] = (adr.code or "").strip()
            row["country"] = (adr.country or "").strip()
        except Exception:
            pass
        try:
            row["notes"] = str(vcard.note.value).strip()
        except Exception:
            pass
        rows.append(row)
    return rows


@app.route("/import", methods=["POST"])
def import_contacts():
    file = request.files.get("csvfile")
    if not file or not file.filename:
        flash("Please select a file.", "danger")
        return redirect(url_for("index"))

    filename = file.filename.lower()
    content = file.stream.read()

    if filename.endswith(".vcf"):
        try:
            rows = _parse_vcard(content.decode("utf-8-sig"))
        except Exception as e:
            flash(f"Could not read vCard file: {e}", "danger")
            return redirect(url_for("index"))

    elif filename.endswith(".csv"):
        stream = io.StringIO(content.decode("utf-8-sig"))
        reader = csv.DictReader(stream)
        reader.fieldnames = [h.strip().lower().replace(" ", "_") for h in (reader.fieldnames or [])]
        rows = list(reader)

    else:
        flash("Please select a .vcf (vCard) or .csv file.", "danger")
        return redirect(url_for("index"))

    with get_db() as conn:
        added, skipped = _insert_contacts(conn, rows)

    msg = f"Imported {added} contact(s)"
    if skipped:
        msg += f", skipped {skipped} row(s) without a name"
    flash(msg + ".", "success")
    return redirect(url_for("index"))


if __name__ == "__main__":
    init_db()
    app.run(debug=True, host="0.0.0.0", port=5020)
