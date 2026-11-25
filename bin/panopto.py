#!/usr/bin/env python3
"""Read-only access to Reichman's Panopto without a browser.

Moodle (through the saved app key) hands out a signed LTI launch for a Panopto
activity in one of the student's courses; posting it to Panopto opens a Panopto
session, kept in a private cookie file. Commands:
  panopto.py find                  find a Panopto activity in the student's courses and remember it
  panopto.py login                 open a Panopto session
  panopto.py sessions [max]        list recent recordings (JSON)
  panopto.py srt <deliveryId>      print a recording's transcript (SRT text)
Nothing is ever changed in Panopto or Moodle.
"""
import http.cookiejar, json, os, re, subprocess, sys, urllib.parse, urllib.request

HOME = os.path.expanduser("~/.runi-desk")
JAR = os.path.join(HOME, "panopto-cookies.txt")
TOOL = os.path.join(HOME, "panopto-tool")
HOST = "https://runi.cloud.panopto.eu"

def moodle(fn, *args):
    out = subprocess.run([os.path.join(HOME, "moodle.sh"), fn, *args], capture_output=True, text=True, check=True).stdout
    return json.loads(out)

def opener():
    jar = http.cookiejar.MozillaCookieJar(JAR)
    if os.path.exists(JAR):
        jar.load(ignore_discard=True, ignore_expires=True)
    return jar, urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))

def save(jar):
    jar.save(ignore_discard=True, ignore_expires=True)
    os.chmod(JAR, 0o600)

def find():
    me = moodle("core_webservice_get_site_info")
    courses = moodle("core_enrol_get_users_courses", f"userid={me['userid']}")
    ids = [f"courseids[{i}]={c['id']}" for i, c in enumerate(courses)]
    ltis = moodle("mod_lti_get_ltis_by_courses", *ids).get("ltis", [])
    pan = [l for l in ltis if "panopto" in (l.get("name", "") + l.get("toolurl", "")).lower()]
    if not pan:
        print(json.dumps({"error": "no_panopto_activity"})); sys.exit(1)
    # prefer this year's activity (the year in the Moodle address), then take the first that launches
    base = open(os.path.join(HOME, "moodle-base")).read() if os.path.exists(os.path.join(HOME, "moodle-base")) else ""
    year = (re.findall(r"20\d\d", base) or [""])[-1]
    pan.sort(key=lambda l: 0 if year and year in l.get("name", "") else 1)
    chosen = None
    for l in pan:
        data = moodle("mod_lti_get_tool_launch_data", f"toolid={l['id']}")
        if str(data.get("endpoint", "")).startswith("http"):
            chosen = l
            break
    if not chosen:
        print(json.dumps({"error": "no_working_panopto_activity"})); sys.exit(1)
    pan = [chosen]
    with open(TOOL, "w") as f:
        f.write(str(chosen["id"]))
    print(json.dumps({"ok": True, "tool": chosen["id"], "name": chosen.get("name")}, ensure_ascii=False))

def login():
    tool = open(TOOL).read().strip() if os.path.exists(TOOL) else ""
    if not tool:
        print(json.dumps({"error": "run find first"})); sys.exit(1)
    data = moodle("mod_lti_get_tool_launch_data", f"toolid={tool}")
    if "errorcode" in data:
        print(json.dumps({"error": data["errorcode"]})); sys.exit(1)
    form = urllib.parse.urlencode({p["name"]: p["value"] for p in data["parameters"]}).encode()
    jar, op = opener()
    with op.open(urllib.request.Request(data["endpoint"], data=form, method="POST"), timeout=60) as r:
        r.read()
    save(jar)
    print(json.dumps({"ok": True}))

def sessions(maxn=60):
    jar, op = opener()
    body = json.dumps({"queryParameters": {"query": None, "sortColumn": 1, "sortAscending": False, "maxResults": int(maxn), "page": 0,
        "startDate": None, "endDate": None, "folderID": None, "bookmarked": False, "getFolderData": True,
        "isSharedWithMe": False, "isSubscriptionsPage": False, "includeArchived": False, "includePlaylists": True}}).encode()
    req = urllib.request.Request(HOST + "/Panopto/Services/Data.svc/GetSessions", data=body, headers={"Content-Type": "application/json"})
    with op.open(req, timeout=60) as r:
        res = json.loads(r.read())["d"]["Results"]
    save(jar)
    print(json.dumps([{"id": s["DeliveryID"], "name": s["SessionName"], "folder": s["FolderName"], "start": s["StartTime"], "dur": s["Duration"]} for s in res], ensure_ascii=False))

def srt(did):
    jar, op = opener()
    with op.open(HOST + f"/Panopto/Pages/Transcription/GenerateSRT.ashx?id={urllib.parse.quote(did)}&language=0", timeout=120) as r:
        sys.stdout.write(r.read().decode("utf-8", "replace"))

if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else ""
    if cmd == "find": find()
    elif cmd == "login": login()
    elif cmd == "sessions": sessions(sys.argv[2] if len(sys.argv) > 2 else 60)
    elif cmd == "srt": srt(sys.argv[2])
    else: print(__doc__)
