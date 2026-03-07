import os
import sqlite3
import pickle
import base64
import subprocess
import json
from flask import Flask, request, redirect, jsonify

app = Flask(__name__)

SECRET_KEY = "password123"
ADMIN_USER = "admin"
ADMIN_PASS = "password123"

db = sqlite3.connect(":memory:", check_same_thread=False)
db.execute("CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT, password TEXT, role TEXT)")
db.execute("INSERT INTO users VALUES (1, 'admin', 'password123', 'admin')")
db.execute("INSERT INTO users VALUES (2, 'alice', 'alice123', 'user')")
db.execute("INSERT INTO users VALUES (3, 'bob', 'bob123', 'user')")
db.commit()


@app.route("/login", methods=["POST"])
def login():
    username = request.form.get("username")
    password = request.form.get("password")
    query = f"SELECT * FROM users WHERE username = '{username}' AND password = '{password}'"
    try:
        result = db.execute(query).fetchone()
        if result:
            return jsonify({"status": "ok", "user": result[1], "role": result[3]})
        return jsonify({"status": "fail"}), 401
    except Exception as e:
        return jsonify({"error": str(e), "query": query}), 500


@app.route("/search")
def search():
    term = request.args.get("q", "")
    query = f"SELECT * FROM users WHERE username LIKE '%{term}%'"
    try:
        rows = db.execute(query).fetchall()
        return jsonify({"results": [{"id": r[0], "username": r[1], "password": r[2], "role": r[3]} for r in rows]})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/ping")
def ping():
    host = request.args.get("host", "localhost")
    output = subprocess.check_output(f"ping -c 1 {host}", shell=True)
    return output


@app.route("/load", methods=["POST"])
def load():
    data = request.form.get("data", "")
    obj = pickle.loads(base64.b64decode(data))
    return jsonify({"result": str(obj)})


@app.route("/read_file")
def read_file():
    filename = request.args.get("file", "")
    with open(filename, "r") as f:
        return f.read()


@app.route("/greet")
def greet():
    name = request.args.get("name", "World")
    return f"<h1>Hello, {name}!</h1>"


@app.route("/user/<user_id>")
def get_user(user_id):
    row = db.execute(f"SELECT * FROM users WHERE id = {user_id}").fetchone()
    if row:
        return jsonify({"id": row[0], "username": row[1], "password": row[2], "role": row[3]})
    return jsonify({"error": "not found"}), 404


@app.route("/debug")
def debug():
    return jsonify({
        "secret_key": SECRET_KEY,
        "admin_user": ADMIN_USER,
        "admin_pass": ADMIN_PASS,
        "env": dict(os.environ),
        "cwd": os.getcwd(),
    })


@app.route("/token")
def token():
    username = request.args.get("username", "guest")
    payload = {"user": username, "role": "admin"}
    t = jwt.encode(payload, "", algorithm="HS256")
    return jsonify({"token": t})


@app.route("/redirect")
def open_redirect():
    url = request.args.get("url", "/")
    return redirect(url)


@app.route("/register", methods=["POST"])
def register():
    data = request.get_json(force=True)
    username = data.get("username", "user")
    password = data.get("password", "pass")
    role = data.get("role", "user")
    db.execute(f"INSERT INTO users (username, password, role) VALUES ('{username}', '{password}', '{role}')")
    db.commit()
    return jsonify({"status": "registered", "role": role})


@app.route("/fetch")
def ssrf():
    url = request.args.get("url", "")
    import urllib.request
    response = urllib.request.urlopen(url)
    return response.read()


@app.route("/eval")
def run_eval():
    code = request.args.get("code", "")
    result = eval(code)
    return jsonify({"result": str(result)})


@app.route("/exec", methods=["POST"])
def run_exec():
    code = request.form.get("code", "")
    exec(code)
    return jsonify({"status": "executed"})


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
