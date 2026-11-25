// Focus timer (pomodoro): 25 minutes of study, 5 of rest.
// Every finished study block adds its minutes to the chosen course.
(function () {
  const U = SH.utils;
  const st = SH.store;
  const WORK = 25 * 60;
  const REST = 5 * 60;
  const t = (SH.view.timer = SH.view.timer || { left: WORK, phase: "work", running: false, courseId: "", tick: null });

  function clock() {
    const m = Math.floor(t.left / 60);
    const s = t.left % 60;
    return `${U.pad(m)}:${U.pad(s)}`;
  }

  function paint() {
    const el = document.getElementById("timer-clock");
    if (el) el.textContent = clock();
  }

  function logMinutes(courseId, minutes) {
    const key = U.today();
    const doc = SH.state.focus.find((f) => f.id === key);
    const cur = doc ? { ...doc } : {};
    delete cur.id;
    cur[courseId || "general"] = (cur[courseId || "general"] || 0) + minutes;
    st.put("focus/" + key, cur);
  }

  function finishPhase() {
    if (t.phase === "work") {
      logMinutes(t.courseId, WORK / 60);
      t.phase = "rest";
      t.left = REST;
      U.toast("סיימת 25 דקות. 5 דקות הפסקה.");
    } else {
      t.phase = "work";
      t.left = WORK;
      t.running = false;
      clearInterval(t.tick);
      U.toast("ההפסקה נגמרה. מוכן לסבב הבא?");
    }
    SH.render();
  }

  function weekMinutes() {
    const start = U.addDays(U.sod(new Date()), -6);
    const totals = {};
    SH.state.focus.forEach((f) => {
      if (U.parse(f.id) < start) return;
      Object.entries(f).forEach(([k, v]) => {
        if (k !== "id") totals[k] = (totals[k] || 0) + (+v || 0);
      });
    });
    return totals;
  }

  SH.ui.timer = function () {
    const courses = st.semesterCourses().concat(st.generalCourses());
    const totals = weekMinutes();
    const max = Math.max(60, ...Object.values(totals));
    const bars = courses
      .map((c) => {
        const m = totals[c.id] || 0;
        return `<div class="bar-row"><span>${U.esc(c.short || c.name)}</span><div class="track"><div class="fill" style="width:${(m / max) * 100}%;background:${U.esc(c.color)}"></div></div><span class="v">${(m / 60).toFixed(1)} ש׳</span></div>`;
      })
      .join("");

    return `<section class="card">
      <div class="card-h"><h2>${U.I.target} טיימר פוקוס</h2><span class="pill ${t.phase === "work" ? "accent" : "green"}">${t.phase === "work" ? "למידה" : "הפסקה"}</span></div>
      <div class="card-b">
        <div class="timer">
          <div class="timer-clock" id="timer-clock">${clock()}</div>
          <select class="inp" id="timer-course" data-change="timerCourse" aria-label="קורס">
            <option value="">כללי</option>
            ${courses.map((c) => `<option value="${U.esc(c.id)}" ${t.courseId === c.id ? "selected" : ""}>${U.esc(c.short || c.name)}</option>`).join("")}
          </select>
          <div class="fc-actions">
            <button class="btn primary" data-act="timerToggle">${t.running ? "השהה" : "התחל"}</button>
            <button class="btn" data-act="timerReset">איפוס</button>
          </div>
        </div>
        <h3 style="font-size:13.5px;margin:14px 0 8px">שעות למידה ב-7 הימים האחרונים</h3>
        <div class="bars">${bars}</div>
      </div>
    </section>`;
  };

  SH.actions.timerToggle = () => {
    t.running = !t.running;
    clearInterval(t.tick);
    if (t.running) {
      t.tick = setInterval(() => {
        t.left--;
        paint();
        if (t.left <= 0) finishPhase();
      }, 1000);
    }
    SH.render();
  };

  SH.actions.timerReset = () => {
    clearInterval(t.tick);
    Object.assign(t, { left: WORK, phase: "work", running: false });
    SH.render();
  };

  SH.changes = SH.changes || {};
  SH.changes.timerCourse = (el) => {
    t.courseId = el.value;
  };
})();
