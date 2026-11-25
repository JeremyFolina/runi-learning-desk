// Google Calendar panel: read-only week grid, in the same layout as the academic calendar.
(function () {
  const U = SH.utils;
  const H0 = 7;
  const H1 = 24;
  const HP = 36;
  const GBLUE = "#4285f4";

  const STATE_COPY = {
    loading: "טוען את היומן…",
    unavailable: "היומן זמין כשהאתר פתוח בתוך Claude.",
    needs_reauth: "החיבור ל-Google Calendar פג. חבר אותו מחדש בהגדרות Claude, תחת Connectors.",
    server_not_connected: "Google Calendar לא מחובר. הוסף אותו בהגדרות Claude, תחת Connectors.",
    approval_required: "צריך לאשר לאתר לקרוא את היומן.",
    not_in_manifest: "הגישה ליומן לא אושרה לאתר הזה.",
    selection_required: "יש יותר מחיבור אחד ל-Google Calendar. בחר אחד בהודעה של Claude.",
  };

  // university events take the course colour; other timetable items a neutral teal; personal events Google blue
  const colorOf = (e) => (e.course ? e.course.color : e.uni ? "#5f7f86" : GBLUE);

  // all-day events cover every day from date up to (not including) endDate
  function allDayOn(items, key) {
    return items.filter((e) => e.allDay && e.date <= key && (e.endDate ? key < e.endDate : key === e.date));
  }

  // timed events on one day, clipped to the day, with side-by-side lanes for overlaps
  function timedOn(items, key) {
    const evs = items
      .filter((e) => !e.allDay && e.date === key)
      .map((e) => {
        const s = U.toMin(e.start);
        let en = e.endDate === key ? U.toMin(e.end) : 24 * 60;
        if (en <= s) en = s + 30;
        return { e, s, en };
      })
      .sort((a, b) => a.s - b.s || b.en - a.en);
    // group overlapping events into clusters, then give each a lane
    let cluster = [];
    let clusterEnd = -1;
    const flush = () => {
      const lanes = [];
      cluster.forEach((x) => {
        let i = lanes.findIndex((end) => end <= x.s);
        if (i < 0) i = lanes.length;
        lanes[i] = x.en;
        x.lane = i;
      });
      cluster.forEach((x) => (x.lanes = lanes.length));
      cluster = [];
    };
    evs.forEach((x) => {
      if (x.s >= clusterEnd && cluster.length) flush();
      cluster.push(x);
      clusterEnd = Math.max(clusterEnd, x.en);
    });
    if (cluster.length) flush();
    return evs;
  }

  function grid() {
    const g = SH.services.gcal;
    const ws = SH.services.calWeekStart();
    const today = U.today();
    const days = [0, 1, 2, 3, 4, 5, 6].map((i) => U.addDays(ws, i));
    const items = g.state === "ok" ? SH.services.gcalItems() : [];
    const H = (H1 - H0) * HP;
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();

    let html = `<div class="week" style="grid-template-columns:42px repeat(7,minmax(80px,1fr));min-width:620px"><div class="wk-head"></div>`;
    html += days.map((d) => `<div class="wk-head ${U.iso(d) === today ? "today" : ""}">${U.DSHORT[d.getDay()]}<b>${d.getDate()}</b></div>`).join("");
    html += `<div class="wk-allday-l">כל היום</div>`;
    html += days
      .map(
        (d) =>
          `<div class="wk-allday">${allDayOn(items, U.iso(d))
            .map((e) => `<a class="chip" style="background:${colorOf(e)}" href="${U.esc(e.link || "https://calendar.google.com")}" target="_blank" rel="noopener" title="${U.esc(e.title)}">${U.esc(e.title)}</a>`)
            .join("")}</div>`
      )
      .join("");
    html += `<div class="wk-times" style="height:${H}px">${Array.from({ length: H1 - H0 }, (_, i) => (i ? `<span style="top:${i * HP}px">${U.pad(H0 + i)}:00</span>` : "")).join("")}</div>`;

    html += days
      .map((d) => {
        const key = U.iso(d);
        const isToday = key === today;
        const blocks = timedOn(items, key)
          .map(({ e, s, en, lane, lanes }) => {
            const top = Math.max(0, ((s - H0 * 60) / 60) * HP);
            const bottom = Math.min(H, ((en - H0 * 60) / 60) * HP);
            if (bottom <= 0) return "";
            const h = Math.max(20, bottom - top - 2);
            const w = 100 / lanes;
            return `<a class="lesson" style="top:${top}px;height:${h}px;background:${colorOf(e)};inset-inline:auto;inset-inline-start:calc(${lane * w}% + 2px);width:calc(${w}% - 4px)" href="${U.esc(e.link || "https://calendar.google.com")}" target="_blank" rel="noopener" title="${U.esc(`${e.fullTitle || e.title} · ${e.start}–${e.end}${e.room ? " · " + e.room : ""}`)}"><b>${U.esc(e.title)}</b>${e.type ? U.esc(e.type) + " " : ""}${U.esc(e.start)}–${U.esc(e.end)}${e.room ? " · " + U.esc(e.room) : ""}</a>`;
          })
          .join("");
        const line = isToday && nowMin >= H0 * 60 && nowMin <= H1 * 60 ? `<div class="now-line" style="top:${((nowMin - H0 * 60) / 60) * HP}px"></div>` : "";
        return `<div class="wk-col ${isToday ? "today" : ""}" style="height:${H}px">${blocks}${line}</div>`;
      })
      .join("");
    return html + "</div>";
  }

  function notice() {
    const g = SH.services.gcal;
    if (g.state === "ok") return "";
    const copy = STATE_COPY[g.state] || "היומן לא נטען כרגע. הוא יתעדכן שוב בעוד כמה דקות.";
    const allow = g.state === "approval_required" ? ' <button class="btn sm" data-act="allowCal">אשר גישה ליומן</button>' : "";
    return `<div class="empty" style="padding:10px">${U.esc(copy)}${allow}</div>`;
  }

  function rangeLabel() {
    const ws = SH.services.calWeekStart();
    const we = U.addDays(ws, 6);
    return `${ws.getDate()}/${ws.getMonth() + 1} – ${we.getDate()}/${we.getMonth() + 1}`;
  }

  SH.ui.gcal = function () {
    const g = SH.services.gcal;
    setTimeout(() => SH.services.checkUniCalendar && SH.services.checkUniCalendar(), 0);
    const fresh = g.storedAt ? `<span class="muted small">עודכן ${U.ago(g.storedAt)}</span>` : "";
    return `<section class="card hide-in-focus">
      <div class="card-h">
        <h2>${U.I.cal} Google Calendar</h2>
        <div class="top-actions">
          ${fresh}
          <div class="calnav">
            <button class="ib" data-act="gcalPrev" aria-label="השבוע הקודם">${U.I.prev}</button>
            <span class="rng">${U.esc(rangeLabel())}</span>
            <button class="ib" data-act="gcalNext" aria-label="השבוע הבא">${U.I.next}</button>
          </div>
          <button class="btn sm" data-act="gcalToday">היום</button>
          <button class="btn sm" data-act="gcalRefresh">רענן</button>
          <a class="btn sm" href="https://calendar.google.com" target="_blank" rel="noopener">פתח ${U.I.ext}</a>
        </div>
      </div>
      ${notice()}
      <div class="scrollx">${grid()}</div>
      <div class="legend">
        <span><i class="dot" style="background:${GBLUE}"></i>יומן אישי</span>
        <span>שיעורים ומבחנים מתחנת המידע בצבע הקורס</span>
      </div>
    </section>`;
  };

  SH.actions.gcalRefresh = () => SH.services.refreshCalendar();
  SH.actions.allowCal = () => SH.services.allowCalendar();
  SH.actions.gcalPrev = () => SH.services.setCalWeek(SH.services.gcal.wk - 1);
  SH.actions.gcalNext = () => SH.services.setCalWeek(SH.services.gcal.wk + 1);
  SH.actions.gcalToday = () => {
    if (SH.services.gcal.wk !== 0) SH.services.setCalWeek(0);
  };
})();
