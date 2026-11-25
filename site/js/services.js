// Connections outside the page: Google Calendar (read only) and Claude itself ("ask the course").
(function () {
  const U = SH.utils;
  const GCAL = "Google Calendar";

  const svc = (SH.services = {
    mcp: null,
    sample: null,
    gcal: { state: "loading", events: [], storedAt: null, error: "" },
  });

  svc.init = async function (onChange) {
    const use = window.claude?.use;
    if (!use) {
      svc.gcal.state = "unavailable";
      onChange();
      return;
    }
    const [mcp, sample] = await Promise.all([
      use("mcp").catch(() => null),
      use("sample").catch(() => null),
    ]);
    svc.mcp = mcp;
    svc.sample = sample;
    watchCalendar(onChange);
    onChange();
  };

  // ---------- Google Calendar: the shown week, refreshed every 10 minutes ----------
  // Two calendars: the student's primary calendar, and the university timetable
  // (system/config.timetableCalendarId), whose events are drawn in course colours.
  let calUnsubs = [];
  let calOnChange = () => {};
  svc.gcal.wk = 0;
  svc.gcal.uni = [];
  svc.gcal.uniId = "";
  // the week being shown, Sunday to Saturday
  svc.calWeekStart = function () {
    const d = U.sod(new Date());
    return U.addDays(d, -d.getDay() + svc.gcal.wk * 7);
  };
  svc.setCalWeek = function (off) {
    svc.gcal.wk = off;
    svc.gcal.events = [];
    svc.gcal.uni = [];
    svc.gcal.state = "loading";
    watchCalendar(calOnChange);
    calOnChange();
  };
  // the timetable calendar id can arrive after the first watch started
  svc.checkUniCalendar = function () {
    const id = SH.store.cfg("timetableCalendarId", "");
    if (svc.mcp && id !== svc.gcal.uniId) svc.setCalWeek(svc.gcal.wk);
  };

  function watchCalendar(onChange) {
    calOnChange = onChange;
    calUnsubs.forEach((u) => u());
    calUnsubs = [];
    if (!svc.mcp) {
      svc.gcal.state = "unavailable";
      return;
    }
    const start = svc.calWeekStart();
    const end = U.addDays(start, 7);
    const fmt = (d) => `${U.iso(d)}T00:00:00`;
    const input = { startTime: fmt(start), endTime: fmt(end), orderBy: "startTime", pageSize: 100 };
    const keep = (p) => (p.events || []).filter((e) => e.status !== "cancelled");
    const retract = ["needs_reauth", "server_not_connected", "not_in_manifest", "blocked_by_policy", "approval_required", "selection_required"];

    calUnsubs.push(
      svc.mcp.watchTool(
        GCAL,
        "list_events",
        input,
        (ev) => {
          if (ev.type === "data") {
            svc.gcal.events = keep(ev.result.payload || {});
            svc.gcal.storedAt = ev.result.cache?.storedAt || Date.now();
            svc.gcal.state = "ok";
          } else {
            const code = ev.error?.code;
            if (retract.includes(code)) {
              svc.gcal.events = [];
              svc.gcal.uni = [];
            }
            svc.gcal.state = code || "upstream_error";
          }
          onChange();
        },
        { refetchInterval: 600000 }
      )
    );

    const uniId = SH.store.cfg("timetableCalendarId", "");
    svc.gcal.uniId = uniId;
    if (uniId) {
      calUnsubs.push(
        svc.mcp.watchTool(
          GCAL,
          "list_events",
          Object.assign({ calendarId: uniId }, input),
          (ev) => {
            if (ev.type === "data") {
              // exams the student is not registered for are noise
              svc.gcal.uni = keep(ev.result.payload || {}).filter((e) => !/לא רשום למבחן/.test(e.description || ""));
            } else if (retract.includes(ev.error?.code)) {
              svc.gcal.uni = [];
            }
            onChange();
          },
          { refetchInterval: 600000 }
        )
      );
    }
  }

  // fetch the calendar again now, instead of waiting for the 10-minute refresh
  svc.refreshCalendar = async function () {
    if (!svc.mcp) return;
    try {
      await svc.mcp.invalidate(GCAL, "list_events");
      U.toast("היומן מתעדכן…");
    } catch (e) {
      svc.setCalWeek(svc.gcal.wk);
    }
  };

  svc.allowCalendar = async function () {
    if (!svc.mcp) return;
    try {
      await svc.mcp.callTool(GCAL, "list_events", { pageSize: 1 });
      svc.mcp.invalidate(GCAL).catch(() => {});
    } catch (e) {
      U.toast("לא התקבל אישור לגשת ליומן.");
    }
  };

  // match a timetable event to a course by the first words of the course name
  const norm = (s) => String(s || "").replace(/["'׳״`–-]/g, " ").replace(/\s+/g, " ").trim();
  function courseFor(title) {
    const t = norm(title);
    return (SH.state.courses || []).find((c) => {
      const words = norm(c.name).split(" ").slice(0, 3).join(" ");
      return words && t.startsWith(words);
    });
  }

  // normalise a Google event to {date, endDate, start, end, title, allDay, link, uni, course, room, type}
  function toItem(e, uni) {
    const s = e.start?.dateTime || e.start?.date || "";
    const en = e.end?.dateTime || e.end?.date || "";
    const allDay = !e.start?.dateTime;
    const course = uni ? courseFor(e.summary) : null;
    const desc = e.description || "";
    const type = /מבחן/.test(e.summary || "") ? "מבחן" : /תרגול/.test(desc) ? "תרגול" : /שיעור/.test(desc) ? "שיעור" : "";
    return {
      date: s.slice(0, 10),
      endDate: en.slice(0, 10),
      start: allDay ? "" : s.slice(11, 16),
      end: allDay ? "" : en.slice(11, 16),
      title: course ? course.short || course.name : e.summary || "(ללא כותרת)",
      fullTitle: e.summary || "",
      allDay,
      link: e.htmlLink,
      uni,
      course,
      room: uni ? (e.location || "").replace(/טרם נקבע/, "").trim() : "",
      type,
    };
  }
  svc.gcalItems = function () {
    return svc.gcal.events.map((e) => toItem(e, false)).concat(svc.gcal.uni.map((e) => toItem(e, true)));
  };

  // ---------- ask Claude ----------
  svc.ask = async function (prompt, onText, signal) {
    if (!svc.sample) throw { code: "not_granted" };
    return svc.sample(prompt, { onText, signal, cache: false });
  };
})();
