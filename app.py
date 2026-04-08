import sqlite3
import os
from flask import Flask, render_template, request, redirect, url_for, flash

app = Flask(__name__)
app.secret_key = "change-me-in-production"

DB_PATH = os.path.join(os.path.dirname(__file__), "contacts.db")


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with get_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS contacts (
                id       INTEGER PRIMARY KEY AUTOINCREMENT,
                name     TEXT NOT NULL,
                email    TEXT,
                phone    TEXT,
                address  TEXT,
                notes    TEXT
            )
        """)


@app.route("/")
def index():
    query = request.args.get("q", "").strip()
    with get_db() as conn:
        if query:
            rows = conn.execute(
                "SELECT * FROM contacts WHERE name LIKE ? OR email LIKE ? OR phone LIKE ? ORDER BY name",
                (f"%{query}%", f"%{query}%", f"%{query}%"),
            ).fetchall()
        else:
            rows = conn.execute("SELECT * FROM contacts ORDER BY name").fetchall()
    return render_template("index.html", contacts=rows, query=query)


@app.route("/add", methods=["GET", "POST"])
def add():
    if request.method == "POST":
        name = request.form["name"].strip()
        if not name:
            flash("Name is required.", "danger")
            return render_template("form.html", contact=None, action="Add")
        with get_db() as conn:
            conn.execute(
                "INSERT INTO contacts (name, email, phone, address, notes) VALUES (?,?,?,?,?)",
                (name, request.form["email"].strip(), request.form["phone"].strip(),
                 request.form["address"].strip(), request.form["notes"].strip()),
            )
        flash(f'Contact "{name}" added.', "success")
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
        name = request.form["name"].strip()
        if not name:
            flash("Name is required.", "danger")
            return render_template("form.html", contact=contact, action="Save")
        with get_db() as conn:
            conn.execute(
                "UPDATE contacts SET name=?, email=?, phone=?, address=?, notes=? WHERE id=?",
                (name, request.form["email"].strip(), request.form["phone"].strip(),
                 request.form["address"].strip(), request.form["notes"].strip(), contact_id),
            )
        flash(f'Contact "{name}" updated.', "success")
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


if __name__ == "__main__":
    init_db()
    app.run(debug=True, host="0.0.0.0", port=5000)
