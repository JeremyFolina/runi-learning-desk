---
name: runi-learning-desk
description: Sets up "שולחן הלמידה" for a Reichman University (RUNI) student - a personal study site that collects Moodle announcements, deadlines, grades and course files three times a day, and can summarize Panopto lecture recordings for the courses the student switches on. Works without a browser sign-in, through the Moodle app key. Use when the student asks to install, set up, update or rebuild their learning desk, or to renew their Moodle key.
---

**Which part to follow:** a new install - steps 1 to 9. "תעדכן את שולחן הלמידה" or the site says there is an update - the section "Updating". A new Moodle key - step 2.3 only.

**If this skill is not installed yet** (the student pasted a GitHub link): run `mkdir -p ~/.runi-desk && T=$(mktemp -d) && curl -fsSL https://codeload.github.com/<owner>/<repo>/tar.gz/refs/heads/main | tar -xz -C "$T" --strip-components 1 && rm -rf ~/.claude/skills/runi-learning-desk && mkdir -p ~/.claude/skills && cp -R "$T" ~/.claude/skills/runi-learning-desk`, with owner/repo taken from the link, then read `~/.claude/skills/runi-learning-desk/SKILL.md` and follow it. Below, "this skill's folder" is `~/.claude/skills/runi-learning-desk`.

# שולחן הלמידה - setup for a Reichman student

This skill builds a personal study site for one Reichman student, plus one scheduled task that keeps it filled:

- **The site**: a published artifact with a database (courses, tasks, deadlines, announcements, summaries, flashcards, grades). Its files are in `site/` next to this SKILL.md: a Tel Aviv minimalist design with a full-width beach banner, illustrated summary tiles, painted course covers, a day timeline and a Google Calendar week.
- **The bot**: one scheduled task, three times a day (07:30, 13:30, 19:30), running on the student's own computer. It reads Moodle through the Moodle app key (no browser, no sign-in), and summarizes new Panopto recordings only for courses where the student turned on "סיכומים אוטומטיים" on the course page. Prompt template: `prompts/bot.md`.
- **Helpers** in `bin/`, installed to `~/.runi-desk/`: `moodle.sh` (read-only Moodle API), `moodle-file.sh` (file downloads), `panopto.py` (read-only Panopto: recordings and transcripts).

Every student gets their own site, their own key and their own data. Nothing is shared between students.

Talk to the student in Hebrew, short and plain. Do the work yourself; ask only what you cannot find.

## Hard rules

- Never type a username or password anywhere, and never ask for one.
- Never read, print, copy or send the files `~/.runi-desk/moodle-token` or `~/.runi-desk/panopto-cookies.txt`. Only the helper scripts use them.
- Never change anything in Moodle or Panopto (no submissions, no posts). Read only.
- Never write to the student's Google Calendar.
- Never copy another student's data. Every site starts empty.

## Step 1 - Explain and check requirements

Tell the student in 3-4 lines what they are getting. Then check:

1. **The Claude desktop app** is open on their computer (Bash and the scheduled-tasks tools must be available). Without it, tell them to open this chat in the desktop app and stop.
2. **Artifact** and **ArtifactData** tools exist (load ArtifactData with ToolSearch).
3. **Scheduled tasks**: `mcp__scheduled-tasks__create_scheduled_task` is available (load with ToolSearch). Without it the site can be built but nothing will update; say so and ask whether to continue.
4. **Google Calendar** connector: optional. If connected, the timetable comes from it automatically.
5. Tell them plainly: the bot runs only while the computer is on and the Claude app is open; summaries use part of their plan's usage, which is why they are capped (5 a day) and off by default.

## Step 2 - Install the helpers and the Moodle key

1. Copy everything in `bin/` (`moodle.sh`, `moodle-file.sh`, `panopto.py`, `desk-update.sh`) to `~/.runi-desk/` (create it with mode 700; scripts mode 700). Copy this skill's `REPO` file to `~/.runi-desk/repo` and its `VERSION` file to `~/.runi-desk/version`.
2. Write the current Moodle address to `~/.runi-desk/moodle-base`, without a trailing slash: `https://moodle.runi.ac.il/<year>` (the academic year in Moodle's path, e.g. `2027`). If unsure, ask the student which year their Moodle shows in the address bar.
3. The Moodle app key. The student does this themselves; you never see the key. Tell them, in Hebrew:
   1. Open in Chrome (sign in to Moodle if asked; if Chrome asks to open an app, cancel):
      `<MOODLE_BASE>/admin/tool/mobile/launch.php?service=moodle_mobile_app&passport=58213907&urlscheme=moodlemobile&confirmed=1`
   2. Right-click the link "לחצו כאן לפתיחת היישומון" and choose "העתקת כתובת הקישור". Do not click it.
   3. Run this in the terminal (give it as one `bash` block, it has a Run button):
      ```
      pbpaste | sed -n 's|.*token=||p' | base64 -D | awk -F':::' '{print $2}' > ~/.runi-desk/moodle-token && chmod 600 ~/.runi-desk/moodle-token && wc -c < ~/.runi-desk/moodle-token
      ```
      It prints **33** when the key was saved. 0 or 1 means the copy in step 2 did not work; repeat steps 2-3.
4. Check: `~/.runi-desk/moodle.sh core_webservice_get_site_info`. Keep `userid` as `MOODLE_USER_ID` and the first name for greetings. An `errorcode` means the key is wrong; repeat step 3.

The same three steps renew the key later, when the site says "צריך מפתח חדש למודל".

## Step 3 - Courses

1. `~/.runi-desk/moodle.sh core_enrol_get_users_courses userid=<MOODLE_USER_ID>`. The 7-digit course number is usually in `idnumber`, `shortname` or `fullname`; keep it as `code`.
2. Show the student the current-semester courses and ask in one message:
   - which courses to include (default: all current ones);
   - which are not regular lecture courses (seminar, workshop, program) - those get kind `general`;
   - their first name, year and degree, as they want them written on the site (e.g. "שנה ב׳ · פסיכולוגיה ומנהל עסקים");
   - whether they have a fixed daily break they do not study in (e.g. "13:00-13:45"), or none.
3. Courses to skip entirely go into `SKIP_COURSES` as one sentence: ` דלג על קורס "<name>" (<code>).` (leading space), or ` אין.` if none.

## Step 4 - Panopto and study groups

1. `/usr/bin/python3 -I ~/.runi-desk/panopto.py find` - finds this year's Panopto activity in their courses and remembers it. Then `login`, then `sessions 100`.
2. Group the recordings by folder; match folders to courses by course number or catalog number in the folder name.
3. Where one course has several lecturers or tutorial groups (different folders, or different names/days in the recording titles), show the options and ask which lecture and which tutorial are theirs.
4. Write `GROUP_RULES` as bullet lines, three spaces of indent, one per course that needed a choice, e.g.:
   `   - סטטיסטיקה רב-משתנית (2701533): ההרצאות של ד"ר X (שלישי 08:00), והתרגול של Y (רביעי 08:00). התעלם מהקלטות של קבוצות אחרות.`
   If no course needed a choice: `   - (אין קורסים עם כמה קבוצות)`.
   If `find` fails, the student may simply have no recordings yet; continue - summaries stay off until it works.

## Step 5 - Weekly timetable

Each course needs `lessons` (weekly meetings) for "My day", "next meeting" and review-task dates.

- If Google Calendar is connected: `list_calendars`, find the Reichman timetable (often imported, named like "יומן אישי מתחנת המידע"), read 14 days, build `lessons`, keep its id as `TIMETABLE_CALENDAR_ID`.
- Otherwise ask them to paste their timetable or send a screenshot from תחנת המידע, build `lessons` from it, and delete every `[[IF_CALENDAR]]...[[/IF_CALENDAR]]` block from the bot prompt.

Each lesson: `{day: 0-6 (0 = Sunday), start: "HH:MM", end: "HH:MM", type: "הרצאה" | "תרגול · <name>", room: "<room or empty>"}`.

## Step 6 - Publish the site

1. Copy the `site/` folder from this skill into the working directory.
2. Publish with the Artifact tool: `file_path` = the copied `index.html`, `root` = the copied site folder, `files` = every other file in it mapped to the same relative path (`css/...`, `js/...`, `img/...`). `icon`: `book`. `title`: `שולחן הלמידה`.
   `capabilities`: `{"db": {}, "sample": {}}`, and add `"mcp": {"servers": [{"server": "Google Calendar", "tools": ["list_events"]}]}` only if that connector is connected.
3. Keep the artifact URL as `ARTIFACT_URL`.

## Step 7 - Seed the database

One `ArtifactData` batch to `ARTIFACT_URL`:

- `courses/m<moodleId>` for each course:
  `{name, short, slug, code, moodleId, color, kind: "course" | "general", order, lessons, lecturers: [], topics: [], enrichment: false, autoSummaries: false, links: {moodle: "<MOODLE_BASE>/course/view.php?id=<moodleId>"}}`
  - `short`: a short Hebrew name (2-3 words). `slug`: short Latin id (`stats`, `macro`, `socpsy`, `bio`, `orgmgmt`...). Course covers are picked by subject from the slug and name (statistics, biology/brain, psychology, economics, management); other courses get a line drawing.
  - `color`: a different one each, from `#2f5bd3 #0f8f9e #e0611a #c2417f #7d4fd6 #b07a12 #3f8a2a #d23c6e #1f8f5f #5a6acf`.
- `system/status`: `{ok: true, needsLogin: false, lastRun: <now minus 14 days, in ms>, message: "ההתקנה הושלמה. הבוט אוסף את השבועיים האחרונים."}`
- `system/quota`: `{date: "", count: 0}`
- `system/config`: `{semesterLabel: "<e.g. סמסטר א׳ תשפ״ז>", generalLabel: "כללי", moodleUrl: "<MOODLE_BASE>/my/", studentName: "<first name>", degreeLabel: "<year · degree, or empty>", lunchBreak: "<HH:MM-HH:MM or empty>", timetableCalendarId: "<id or empty>"}`

## Step 8 - Create the bot

Fill `prompts/bot.md` by replacing every `{{NAME}}`:
`STUDENT_NAME, STUDENT_DESC (e.g. "סטודנט/ית שנה ב׳ ברייכמן, פסיכולוגיה ומנהל עסקים"), ARTIFACT_URL, MOODLE_USER_ID, TIMETABLE_CALENDAR_ID, GROUP_RULES, SKIP_COURSES, DAILY_MAX (5)`.
Remove the `[[IF_CALENDAR]]` / `[[/IF_CALENDAR]]` marker lines (keeping or deleting the blocks as decided in step 5). Check that no `{{` or `[[` is left.

Save the values for later updates in `~/.runi-desk/settings.json` (mode 600): `{"STUDENT_NAME": ..., "STUDENT_DESC": ..., "ARTIFACT_URL": ..., "MOODLE_USER_ID": ..., "TIMETABLE_CALENDAR_ID": "<id or empty>", "GROUP_RULES": ..., "SKIP_COURSES": ..., "DAILY_MAX": "5", "CALENDAR": true|false, "TASK_ID": "runi-desk"}`. It holds no key or password.

Create it with `mcp__scheduled-tasks__create_scheduled_task`: taskId `runi-desk`, title `שולחן הלמידה: בוט Moodle (בוקר, צהריים, ערב)`, cron `30 7,13,19 * * *` (local time), the filled prompt.

## Step 9 - First run and handover

1. Run it once now (`mcp__scheduled-tasks__run_scheduled_task`), so the site fills today. On the first run Claude may ask to allow the helper scripts; tell the student to choose "אפשר תמיד" so later runs go on their own.
2. Tell the student, briefly:
   - the site link (the publish card already shows it);
   - to turn on automatic summaries, open a course and switch "הפעל סיכומים אוטומטיים";
   - when the site says "צריך מפתח חדש למודל", ask Claude to renew the key (step 2.3);
   - the bot runs only while the computer is on and the Claude app is open.

## Updating

When the student asks to update, or the site shows "יש גרסה חדשה":

1. `~/.runi-desk/desk-update.sh check`. If `update=no`, say the desk is up to date and stop. If `~/.runi-desk/settings.json` or `~/.runi-desk/repo` is missing (an install from before updates existed), rebuild them: the repo from this skill's `REPO` file; the settings from the scheduled task's current prompt (`list_scheduled_tasks`) and the artifact URL in it.
2. `~/.runi-desk/desk-update.sh fetch` prints the folder of the new version (`NEW`). Tell the student in 2-3 lines what changed, from the newest entries in `NEW/CHANGELOG.md`.
3. Copy `NEW/bin/*` to `~/.runi-desk/` (mode 700), and replace `~/.claude/skills/runi-learning-desk` with a copy of `NEW`.
4. The site: list the artifact's published files (`Artifact` action `list`, scope `files`, url = `ARTIFACT_URL`), then publish `NEW/site/index.html` to the same `url`, with `root` = `NEW/site` and `files` = every other file in `NEW/site`. Omit `icon` and `capabilities`, so the site keeps them; the student's data stays in its database. Files that exist on the site but not in `NEW/site` are mapped to `null`.
5. The bot: fill `NEW/prompts/bot.md` from `settings.json` as in step 8 (with the calendar blocks kept or removed by `CALENDAR`), check that no `{{` or `[[` is left, and update the task `TASK_ID` with `mcp__scheduled-tasks__update_scheduled_task` (prompt only; keep the schedule).
6. If `NEW/CHANGELOG.md` lists extra steps for this version under "בעדכון", do them.
7. Copy `NEW/VERSION` to `~/.runi-desk/version`, set `updateAvailable: null` in `system/status`, delete `~/.runi-desk/update`, and tell the student it is done.

## If something fails

- **`moodle.sh` returns `invalidtoken`**: the key expired or was copied wrong; redo step 2.3.
- **Wrong year / `invalidrecord`**: `~/.runi-desk/moodle-base` points to last year's Moodle; fix the year.
- **`panopto.py find` finds nothing**: no Panopto activity yet in their courses. Keep everything else; summaries can be turned on later after `find` works.
- **A recording has no transcript**: the bot skips it.
- **Another university**: stop and say this version supports Reichman only.
