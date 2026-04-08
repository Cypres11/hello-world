import csv
import io
import sqlite3
import os
from flask import Flask, render_template, request, redirect, url_for, flash, Response

app = Flask(__name__)
app.secret_key = "change-me-in-production"

DB_PATH = os.path.join(os.path.dirname(__file__), "contacts.db")

FIELDS = ["name", "email", "phone", "address", "postal_code", "city", "country", "notes"]


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with get_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS contacts (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                name        TEXT NOT NULL,
                email       TEXT,
                phone       TEXT,
                address     TEXT,
                postal_code TEXT,
                city        TEXT,
                country     TEXT,
                notes       TEXT
            )
        """)
        # Migrate existing databases that are missing the new columns
        existing = {row[1] for row in conn.execute("PRAGMA table_info(contacts)")}
        for col in ("postal_code", "city", "country"):
            if col not in existing:
                conn.execute(f"ALTER TABLE contacts ADD COLUMN {col} TEXT")


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
                   WHERE name LIKE ? OR email LIKE ? OR phone LIKE ?
                      OR city LIKE ? OR country LIKE ?
                   ORDER BY name""",
                (like, like, like, like, like),
            ).fetchall()
        else:
            rows = conn.execute("SELECT * FROM contacts ORDER BY name").fetchall()
    return render_template("index.html", contacts=rows, query=query)


@app.route("/add", methods=["GET", "POST"])
def add():
    if request.method == "POST":
        vals = _form_values()
        if not vals["name"]:
            flash("Name is required.", "danger")
            return render_template("form.html", contact=vals, action="Add")
        with get_db() as conn:
            conn.execute(
                """INSERT INTO contacts (name,email,phone,address,postal_code,city,country,notes)
                   VALUES (?,?,?,?,?,?,?,?)""",
                [vals[f] for f in FIELDS],
            )
        flash(f'Contact "{vals["name"]}" added.', "success")
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
        if not vals["name"]:
            flash("Name is required.", "danger")
            return render_template("form.html", contact=contact, action="Save")
        with get_db() as conn:
            conn.execute(
                """UPDATE contacts
                   SET name=?,email=?,phone=?,address=?,postal_code=?,city=?,country=?,notes=?
                   WHERE id=?""",
                [vals[f] for f in FIELDS] + [contact_id],
            )
        flash(f'Contact "{vals["name"]}" updated.', "success")
        return redirect(url_for("index"))
    return render_template("form.html", contact=contact, action="Save")


@app.route("/delete/<int:contact_id>", methods=["POST"])
def delete(contact_id):
    with get_db() as conn:
        row = conn.execute("SELECT name FROM contacts WHERE id=?", (contact_id,)).fetchone()
        if row:
            conn.execute("DELETE FROM contacts WHERE id=?", (contact_id,))
            flash(f'Contact "{row["name"]}" deleted.', "success")
    return redirect(url_for("index"))


@app.route("/export")
def export_csv():
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM contacts ORDER BY name").fetchall()
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


@app.route("/import", methods=["POST"])
def import_csv():
    file = request.files.get("csvfile")
    if not file or not file.filename.endswith(".csv"):
        flash("Please select a .csv file.", "danger")
        return redirect(url_for("index"))

    stream = io.StringIO(file.stream.read().decode("utf-8-sig"))
    reader = csv.DictReader(stream)
    # Normalise header names: lowercase + strip spaces
    reader.fieldnames = [h.strip().lower().replace(" ", "_") for h in (reader.fieldnames or [])]

    if "name" not in reader.fieldnames:
        flash("CSV must have a 'name' column.", "danger")
        return redirect(url_for("index"))

    added = skipped = 0
    with get_db() as conn:
        for row in reader:
            name = row.get("name", "").strip()
            if not name:
                skipped += 1
                continue
            conn.execute(
                """INSERT INTO contacts (name,email,phone,address,postal_code,city,country,notes)
                   VALUES (?,?,?,?,?,?,?,?)""",
                [row.get(f, "").strip() for f in FIELDS],
            )
            added += 1

    flash(f"Imported {added} contact(s){f', skipped {skipped} row(s) without a name' if skipped else ''}.", "success")
    return redirect(url_for("index"))


if __name__ == "__main__":
    init_db()
    app.run(debug=True, host="0.0.0.0", port=5020)
