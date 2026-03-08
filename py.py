from flask import Flask, request, render_template_string
import subprocess, os

app = Flask(__name__)

TEMPLATE = """
<!DOCTYPE html>
<html>
<head><title>Report Tool</title></head>
<body>
  <h2>System Report</h2>
  <form method="GET">
    <input name="name" placeholder="Your name" />
    <button type="submit">Generate</button>
  </form>
  {}
</body>
</html>
"""

@app.route("/")
def index():
    name = request.args.get("name", "")
    if name:
        report = f"<p>Report generated for: {name}</p>"
        page = TEMPLATE.format(report)
        return render_template_string(page)
    return TEMPLATE.format("")


@app.route("/status")
def status():
    return {"status": "ok", "uptime": os.popen("uptime").read().strip()}


@app.route("/health")
def health():
    return {"healthy": True}


if __name__ == "__main__":
    app.run(debug=False, host="127.0.0.1", port=8080)
