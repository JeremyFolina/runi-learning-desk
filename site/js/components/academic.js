// Academic calendar: weekly timetable plus exams, quizzes and deadlines.
(function () {
  const U = SH.utils;
  const st = SH.store;
  const H0 = 8;
  const H1 = 21;
  const HP = 36;
  const KIND = { exam: "מבחן", quiz: "בוחן", deadline: "הגשה", meeting: "מפגש" };
  const KCOLOR = { exam: "var(--t-required)", quiz: "var(--warn)", deadline: "#8e4fd6", meeting: "var(--accent)" };

  const view = (SH.view.cal = SH.view.cal || { mode: "week", wk: 0, mo: 0 });

  function weekStart(off) {
    const d = U.sod(new Date());
    return U.addDays(d, -d.getDay() + off * 7);
  }

  function chipsOn(key) {
    const ev = SH.state.events
      .filter((e) => e.date === key)
      .map((e) => {
        const c = st.course(e.courseId);
        return `<button class="chip" style="background:${KCOLOR[e.kind] || "var(--accent)"}" data-act="go" data-page="course" data-id="${U.esc(e.courseId)}" data-tab="exams" title="${U.esc(`${KIND[e.kind] || ""}: ${e.title}${c ? " · " + c.name : ""}`)}">${U.esc(KIND[e.kind] || "")} · ${U.esc(c?.short || e.title)}</button>`;
      });
    const due = SH.state.tasks
      .filter((t) => t.kind === "required" && !t.done && t.due === key)
      .map((t) => `<span class="chip" style="background:var(--t-required-bg);color:var(--t-required)" title="${U.esc(t.title)}">הגשה · ${U.esc(t.title)}</span>`);
    return ev.concat(due).join("");
  }

  function weekView() {
    const ws = weekStart(view.wk);
    const today = U.today();
    const days = [0, 1, 2, 3, 4, 5].map((i) => U.addDays(ws, i));
    const H = (H1 - H0) * HP;
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();

    let html = `<div class="week"><div class="wk-head"></div>`;
    html += days.map((d) => `<div class="wk-head ${U.iso(d) === today ? "today" : ""}">${U.DSHORT[d.getDay()]}<b>${d.getDate()}</b></div>`).join("");
    html += `<div class="wk-allday-l">מועדים</div>`;
    html += days.map((d) => `<div class="wk-allday">${chipsOn(U.iso(d))}</div>`).join("");
    html += `<div class="wk-times" style="height:${H}px">${Array.from({ length: H1 - H0 }, (_, i) => (i ? `<span style="top:${i * HP}px">${U.pad(H0 + i)}:00</span>` : "")).join("")}</div>`;

    html += days
      .map((d) => {
        const key = U.iso(d);
        const isToday = key === today;
        const blocks = SH.lessonsOn(key)
          .map((l) => {
            const top = ((U.toMin(l.start) - H0 * 60) / 60) * HP;
            const h = Math.max(20, ((U.toMin(l.end) - U.toMin(l.start)) / 60) * HP - 2);
            if (top < 0 || top > H) return "";
            return `<button class="lesson" style="top:${top}px;height:${h}px;background:${U.esc(l.course.color)}" data-act="go" data-page="course" data-id="${U.esc(l.course.id)}"><b>${U.esc(l.course.short || l.course.name)}</b>${U.esc(l.type || "")} ${U.esc(l.start)}${l.room ? " · " + U.esc(l.room) : ""}</button>`;
          })
          .join("");
        const line = isToday && nowMin >= H0 * 60 && nowMin <= H1 * 60 ? `<div class="now-line" style="top:${((nowMin - H0 * 60) / 60) * HP}px"></div>` : "";
        return `<div class="wk-col ${isToday ? "today" : ""}" style="height:${H}px">${blocks}${line}</div>`;
      })
      .join("");
    return html + "</div>";
  }

  function monthView() {
    const b = new Date();
    b.setDate(1);
    b.setMonth(b.getMonth() + view.mo);
    const first = U.sod(b);
    const start = U.addDays(first, -first.getDay());
    const today = U.today();
    let html = `<div class="week" style="grid-template-columns:repeat(7,minmax(70px,1fr))">${U.DSHORT.map((d) => `<div class="wk-head">${d}</div>`).join("")}`;
    for (let i = 0; i < 42; i++) {
      const d = U.addDays(start, i);
      const key = U.iso(d);
      const out = d.getMonth() !== first.getMonth();
      html += `<div class="wk-allday" style="min-height:76px;${out ? "background:var(--surface-2)" : ""}"><span class="small" style="font-weight:500;color:${key === today ? "var(--accent)" : "var(--muted)"}">${d.getDate()}</span>${chipsOn(key)}</div>`;
    }
    return html + "</div>";
  }

  function rangeLabel() {
    if (view.mode === "week") {
      const ws = weekStart(view.wk);
      const we = U.addDays(ws, 5);
      return `${ws.getDate()}/${ws.getMonth() + 1} – ${we.getDate()}/${we.getMonth() + 1}`;
    }
    const b = new Date();
    b.setDate(1);
    b.setMonth(b.getMonth() + view.mo);
    return b.toLocaleDateString("he-IL", { month: "long", year: "numeric" });
  }

  SH.ui.academic = function () {
    return `<section class="card hide-in-focus">
      <div class="card-h">
        <h2>${U.I.book} לוח אקדמי</h2>
        <div class="top-actions">
          <div class="calnav">
            <button class="ib" data-act="calPrev" aria-label="הקודם">${U.I.prev}</button>
            <span class="rng">${U.esc(rangeLabel())}</span>
            <button class="ib" data-act="calNext" aria-label="הבא">${U.I.next}</button>
          </div>
          <button class="btn sm" data-act="calToday">היום</button>
          <div class="seg">
            <button class="${view.mode === "week" ? "on" : ""}" data-act="calMode" data-v="week">שבוע</button>
            <button class="${view.mode === "month" ? "on" : ""}" data-act="calMode" data-v="month">חודש</button>
          </div>
        </div>
      </div>
      <div class="scrollx">${view.mode === "week" ? weekView() : monthView()}</div>
      <div class="legend">
        <span><i class="dot" style="background:var(--t-required)"></i>מבחן</span>
        <span><i class="dot" style="background:var(--warn)"></i>בוחן</span>
        <span><i class="dot" style="background:#8e4fd6"></i>הגשה</span>
        <span><i class="dot" style="background:var(--accent)"></i>מפגש מיוחד</span>
        <span>שיעורים בצבע הקורס</span>
      </div>
    </section>`;
  };

  SH.actions.calPrev = () => {
    view.mode === "week" ? view.wk-- : view.mo--;
    SH.render();
  };
  SH.actions.calNext = () => {
    view.mode === "week" ? view.wk++ : view.mo++;
    SH.render();
  };
  SH.actions.calToday = () => {
    view.wk = 0;
    view.mo = 0;
    SH.render();
  };
  SH.actions.calMode = (el) => {
    view.mode = el.dataset.v;
    SH.render();
  };
})();
