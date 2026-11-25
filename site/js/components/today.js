// "My day": one line on what is happening now and next, a timeline of the day
// (schedule blocks, free windows, a now marker), then three plain columns:
// the schedule, what to finish today, and free time for studying.
(function () {
  const U = SH.utils;
  const st = SH.store;
  const DAY_START = 8 * 60;
  const DAY_END = 22 * 60;
  const MIN_SLOT = 45;

  function lessonsOn(date) {
    const dow = U.parse(date).getDay();
    const out = [];
    st.semesterCourses()
      .concat(st.generalCourses())
      .forEach((c) =>
        (c.lessons || []).forEach((l) => {
          if (+l.day === dow) out.push({ ...l, course: c });
        })
      );
    return out.sort((a, b) => U.toMin(a.start) - U.toMin(b.start));
  }
  SH.lessonsOn = lessonsOn;

  // Google Calendar is the weekly schedule. It holds today only while the current week is loaded.
  function calendarHasToday() {
    const g = SH.services.gcal;
    return g.state === "ok" && g.wk === 0;
  }
  function calendarOn(date) {
    return SH.services
      .gcalItems()
      .filter((e) => e.date === date && !e.allDay)
      .sort((a, b) => U.toMin(a.start) - U.toMin(b.start));
  }

  const nowMin = () => {
    const n = new Date();
    return n.getHours() * 60 + n.getMinutes();
  };

  // today's schedule as {s, e, title, sub, color}, from the calendar or the fixed lessons
  function schedule(date, gcalOk) {
    if (gcalOk) {
      return calendarOn(date).map((e) => ({
        s: U.toMin(e.start),
        e: e.endDate === date ? U.toMin(e.end) : 24 * 60,
        title: e.title,
        sub: [e.type, e.room].filter(Boolean).join(" · "),
        color: e.course ? e.course.color : e.uni ? "#5f7f86" : "#4285f4",
      }));
    }
    return lessonsOn(date).map((l) => ({
      s: U.toMin(l.start),
      e: U.toMin(l.end),
      title: l.course.short || l.course.name,
      sub: [l.type, l.room].filter(Boolean).join(" · "),
      color: l.course.color,
    }));
  }

  // a daily break at the university (system/config lunchBreak, e.g. "13:00-13:45"): not study time
  function breakSpan() {
    const m = /^(\d\d?:\d\d)\s*-\s*(\d\d?:\d\d)$/.exec(st.cfg("lunchBreak", ""));
    return m ? [U.toMin(m[1]), U.toMin(m[2])] : null;
  }

  function freeSlots(items) {
    const busy = items.map((x) => [x.s, x.e]).concat(breakSpan() ? [breakSpan()] : []).sort((a, b) => a[0] - b[0]);
    let cursor = Math.max(DAY_START, Math.ceil(nowMin() / 15) * 15);
    const out = [];
    busy.forEach(([s, e]) => {
      if (s - cursor >= MIN_SLOT) out.push([cursor, s]);
      cursor = Math.max(cursor, e);
    });
    if (DAY_END - cursor >= MIN_SLOT) out.push([cursor, DAY_END]);
    return out;
  }

  const dur = (m) => {
    const h = Math.floor(m / 60);
    const r = m % 60;
    if (!h) return `${r} דק׳`;
    if (!r) return h === 1 ? "שעה" : h === 2 ? "שעתיים" : `${h} שעות`;
    return `${h === 1 ? "שעה" : h === 2 ? "שעתיים" : h + " שעות"} ו-${r} דק׳`;
  };
  const inTime = (m) => (m < 60 ? `בעוד ${m} דק׳` : `בעוד ${dur(m)}`);

  // the one line at the top: what is happening now, and what comes next
  function headline(items, slots) {
    const now = nowMin();
    const cur = items.find((x) => x.s <= now && now < x.e);
    const next = items.find((x) => x.s > now);
    if (cur) {
      return `<p class="td-now"><span class="td-tag live">עכשיו</span><b>${U.esc(cur.title)}</b> עד ${U.fromMin(cur.e)}${next ? `<span class="td-sep"></span>אחר כך: ${U.esc(next.title)} ב-${U.fromMin(next.s)}` : ""}</p>`;
    }
    if (next) {
      const free = slots.find((s) => s[0] <= now + 15 && s[1] >= next.s);
      return `<p class="td-now"><span class="td-tag">הבא</span><b>${U.esc(next.title)}</b> ב-${U.fromMin(next.s)} <span class="muted">(${inTime(next.s - now)})</span>${free ? `<span class="td-sep"></span>עד אז אתה פנוי` : ""}</p>`;
    }
    if (now < DAY_END) return `<p class="td-now"><span class="td-tag">פנוי</span>אין יותר שיעורים או אירועים היום. זמן טוב ללמוד.</p>`;
    return `<p class="td-now"><span class="td-tag">ערב</span>היום נגמר. מחר ממשיכים.</p>`;
  }

  // a ruler of the day, 08:00 to 22:00, read from right to left: hour lines,
  // the schedule as named blocks, free windows, and a "now" pin with the time
  function timeline(items, slots) {
    const span = DAY_END - DAY_START;
    const pos = (m) => ((Math.min(Math.max(m, DAY_START), DAY_END) - DAY_START) / span) * 100;
    const n = nowMin();
    let grid = "";
    let ticks = "";
    for (let h = 8; h <= 22; h++) {
      const major = h % 2 === 0;
      if (h > 8 && h < 22) grid += `<span class="tl-hr ${major ? "major" : ""}" style="inset-inline-start:${pos(h * 60)}%"></span>`;
      if (major) ticks += `<span class="tl-tick" style="inset-inline-start:${pos(h * 60)}%">${U.pad(h)}:00</span>`;
    }
    const free = slots
      .map(([a, b]) => {
        const w = pos(b) - pos(a);
        return `<span class="tl-free" style="inset-inline-start:${pos(a)}%;width:${w}%" title="פנוי ${U.fromMin(a)}–${U.fromMin(b)}">${w > 6 ? `<em>פנוי${w > 11 ? ` · ${dur(b - a)}` : ""}</em>` : ""}</span>`;
      })
      .join("");
    const BR = breakSpan();
    const brk = BR ? `<span class="tl-break" style="inset-inline-start:${pos(BR[0])}%;width:${pos(BR[1]) - pos(BR[0])}%" title="הפסקה ${U.fromMin(BR[0])}–${U.fromMin(BR[1])}"><em>הפסקה</em></span>` : "";
    const blocks = items
      .filter((x) => x.e > DAY_START && x.s < DAY_END)
      .map((x) => {
        const w = Math.max(pos(x.e) - pos(x.s), 1.4);
        const state = x.e <= n ? "past" : x.s <= n ? "live" : "";
        return `<span class="tl-block ${state}" style="inset-inline-start:${pos(x.s)}%;width:${w}%;--bc:${U.esc(x.color)}" title="${U.esc(`${x.title} · ${U.fromMin(x.s)}–${U.fromMin(x.e)}`)}">${w > 6 ? `<em>${U.esc(x.title)}</em>` : ""}</span>`;
      })
      .join("");
    const inDay = n > DAY_START && n < DAY_END;
    const past = inDay ? `<span class="tl-past" style="width:${pos(n)}%"></span>` : n >= DAY_END ? `<span class="tl-past" style="width:100%"></span>` : "";
    const now = inDay ? `<span class="tl-now" style="inset-inline-start:${pos(n)}%"><b>${U.fromMin(n)}</b></span>` : "";
    return `<div class="tl" aria-hidden="true"><div class="tl-track">${grid}${free}${brk}${blocks}${past}</div>${now}<div class="tl-ticks">${ticks}</div></div>`;
  }

  SH.ui.today = function () {
    const date = U.today();
    const gcalOk = calendarHasToday();
    const items = schedule(date, gcalOk);
    const slots = freeSlots(items);
    const events = SH.state.events.filter((e) => e.date === date);
    const tasks = SH.state.tasks
      .filter((t) => !t.done && t.due && U.dayDiff(t.due) <= 0)
      .sort((a, b) => String(a.due).localeCompare(String(b.due)));
    const lateN = tasks.filter((t) => U.dayDiff(t.due) < 0).length;
    const now = nowMin();

    const schedRows =
      items
        .map((x) => {
          const state = x.e <= now ? "past" : x.s <= now ? "live" : "";
          return `<li class="td-item ${state}"><span class="td-time">${U.fromMin(x.s)}<small>${U.fromMin(x.e)}</small></span><span class="td-bar" style="background:${U.esc(x.color)}"></span><span class="td-what"><b>${U.esc(x.title)}</b>${x.sub ? `<small>${U.esc(x.sub)}</small>` : ""}</span></li>`;
        })
        .join("") +
      events
        .map((e) => `<li class="td-item"><span class="td-time">${U.esc(e.time || "כל היום")}</span><span class="td-bar" style="background:var(--t-required)"></span><span class="td-what"><b>${U.esc(e.title)}</b><small>מועד</small></span></li>`)
        .join("");

    const taskRows = tasks
      .slice(0, 6)
      .map((t) => {
        const c = st.course(t.courseId);
        const late = U.dayDiff(t.due) < 0;
        const r = U.relDue(t.due);
        return `<li class="td-task ${late ? "late" : ""}">
          <button class="bl-check" data-act="toggleTask" data-id="${U.esc(t.id)}" aria-label="סמן כבוצע: ${U.esc(t.title)}">${U.I.check}</button>
          <span class="td-what"><b>${U.esc(t.title)}</b><small>${c ? U.esc(c.short || c.name) : "כללי"}${late ? ` · <span class="due-late">${U.esc(r.t)}</span>` : ""}</small></span>
        </li>`;
      })
      .join("");

    const slotRows = slots
      .map(([a, b]) => `<li class="td-item td-free"><span class="td-time">${U.fromMin(a)}<small>${U.fromMin(b)}</small></span><span class="td-bar"></span><span class="td-what"><b>זמן פנוי ללמידה</b><small>${dur(b - a)}</small></span></li>`)
      .join("");

    const source = gcalOk ? "לפי Google Calendar" : "לפי מערכת השעות הקבועה (היומן עוד לא נטען)";

    return `<section class="card today-card">
      <div class="card-h"><h2>היום שלי</h2><span class="muted small">${U.long(date)} · ${source}</span></div>
      <div class="td-top">
        ${headline(items, slots)}
        ${timeline(items, slots)}
        <div class="tl-legend"><span><i class="lg-block"></i>בלו״ז</span><span><i class="lg-free"></i>זמן פנוי ללמידה</span><span><i class="lg-past"></i>כבר עבר</span><span><i class="lg-now"></i>עכשיו</span></div>
      </div>
      <div class="today-grid">
        <div class="today-col">
          <h3>בלו״ז היום <span class="td-n">${items.length + events.length}</span></h3>
          ${schedRows ? `<ol class="td-list">${schedRows}</ol>` : '<p class="td-empty">אין שיעורים או אירועים היום.</p>'}
        </div>
        <div class="today-col">
          <h3>לסיים היום <span class="td-n ${lateN ? "bad" : ""}">${tasks.length}</span></h3>
          ${taskRows ? `<ul class="td-list">${taskRows}</ul>${tasks.length > 6 ? `<button class="btn sm" data-act="band" data-v="today">עוד ${tasks.length - 6}</button>` : ""}` : '<p class="td-empty">אין משימות להיום. ✓</p>'}
        </div>
        <div class="today-col">
          <h3>זמן פנוי ללמידה <span class="td-n">${slots.length}</span></h3>
          ${slotRows ? `<ul class="td-list">${slotRows}</ul>` : '<p class="td-empty">אין היום חלון פנוי של 45 דקות ומעלה.</p>'}
        </div>
      </div>
    </section>`;
  };
})();
