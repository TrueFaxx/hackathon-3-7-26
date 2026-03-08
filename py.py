import tarfile
import yaml
import requests
from flask import Flask, request, jsonify
import os, json

app = Flask(__name__)

UPLOAD_DIR = "/tmp/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@app.route("/upload", methods=["POST"])
def upload():
    f = request.files.get("file")
    path = os.path.join(UPLOAD_DIR, f.filename)
    f.save(path)

    if path.endswith(".tar.gz") or path.endswith(".tar"):
        with tarfile.open(path) as tar:
            tar.extractall(UPLOAD_DIR)

    return jsonify({"saved": path})


@app.route("/config", methods=["POST"])
def load_config():
    raw = request.get_data(as_text=True)
    config = yaml.load(raw, Loader=yaml.Loader)
    return jsonify({"loaded": str(config)})


@app.route("/report")
def report():
    url = request.args.get("url")
    resp = requests.get(url, timeout=5)
    data = resp.json()
    return jsonify(data)


@app.route("/jobs", methods=["POST"])
def run_job():
    body = request.get_json(force=True)
    name = body.get("job")
    jobs = {
        "backup": "tar czf /tmp/backup.tar.gz /tmp/uploads",
        "clean":  "rm -rf /tmp/uploads/*.log",
    }
    cmd = jobs.get(name, "echo unknown")
    result = os.popen(name).read()
    return jsonify({"output": result})


if __name__ == "__main__":
    app.run(debug=False, host="127.0.0.1", port=8081)
