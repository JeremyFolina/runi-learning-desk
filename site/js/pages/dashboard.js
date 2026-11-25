// Home: a painted Tel Aviv street-to-beach banner with the greeting, four
// illustrated tiles whose drawings spill out of their frames, the courses, the day,
// the week, tasks and announcements.
(function () {
  const U = SH.utils;
  const st = SH.store;

  function hero() {
    const focus = SH.view.focus;
    const name = st.cfg("studentName", "");
    return `<section class="hero hero-art hero-full bleed">
      <div>
        <div class="hero-stage">
          <div class="hero-pic">
            <img class="hero-img" src="img/hero-tlv.png" alt="חוף תל אביב בקיץ: סוכת מציל, ים, שמש, דקל ובניין באוהאוס" width="3840" height="1645">
          </div>
          <div class="hero-copy">
            <div class="hero-eyebrow"><span class="hero-date">${U.long(U.today())}</span><span class="sep" aria-hidden="true">·</span>${["אוניברסיטת רייכמן", st.cfg("degreeLabel", ""), st.cfg("semesterLabel", "")].filter(Boolean).map(U.esc).join(" · ")}</div>
            <h1>${U.greeting()}${name ? `, <span class="nm">${U.esc(name)}</span>` : ""}</h1>
          </div>
          <div class="hero-actions top-actions">
            <button class="btn sm ${focus ? "primary" : ""}" data-act="focus" aria-pressed="${focus ? "true" : "false"}">${focus ? "יציאה ממצב מיקוד" : "מצב מיקוד"}</button>
            ${SH.ui.bell()}
          </div>
        </div>
      </div>
    </section>`;
  }

  // the summary bar, set like a faculty notice: four figures in ruled cells.
  // Each figure opens the list behind it, right under the bar.
  const BAND = {
    open: { label: "משימות פתוחות", title: "כל המשימות הפתוחות", pick: (t) => !t.done },
    today: { label: "להיום", title: "משימות שצריך לסיים היום", pick: (t) => !t.done && t.due && U.dayDiff(t.due) === 0 },
    late: { label: "באיחור", title: "משימות שעבר להן התאריך", pick: (t) => !t.done && t.due && U.dayDiff(t.due) < 0 },
    week: { label: "מועדים השבוע", title: "מועדים בשבעה הימים הקרובים" },
  };
  const weekEvents = () =>
    SH.state.events.filter((e) => e.date && U.dayDiff(e.date) >= 0 && U.dayDiff(e.date) <= 7).sort(U.byDate);

  function courseTag(courseId) {
    const c = st.course(courseId);
    return c
      ? `<span class="cpill"><i class="dot" style="background:${U.esc(c.color)}"></i>${U.esc(c.short || c.name)}</span>`
      : '<span class="cpill muted">כללי</span>';
  }

  function bandList(key) {
    const def = BAND[key];
    let rows = "";
    let n = 0;
    if (key === "week") {
      const list = weekEvents();
      n = list.length;
      rows = list
        .map((e) => {
          const d = U.dayDiff(e.date);
          const when = d === 0 ? "היום" : d === 1 ? "מחר" : `${U.long(e.date)}`;
          return `<li class="bl-row">
            <span class="bl-when">${U.esc(when)}${e.time ? ` · ${U.esc(e.time)}` : ""}</span>
            <span class="bl-title">${U.esc(e.title)}</span>
            ${courseTag(e.courseId)}
          </li>`;
        })
        .join("");
    } else {
      const list = SH.state.tasks
        .filter(def.pick)
        .sort((a, b) => String(a.due || "9999").localeCompare(String(b.due || "9999")));
      n = list.length;
      rows = list
        .map((t) => {
          const r = U.relDue(t.due);
          return `<li class="bl-row">
            <button class="bl-check" data-act="toggleTask" data-id="${U.esc(t.id)}" aria-label="סמן כבוצע: ${U.esc(t.title)}">${U.I.check}</button>
            <span class="bl-title">${U.esc(t.title)}</span>
            ${courseTag(t.courseId)}
            <span class="bl-due ${r.c}">${U.esc(r.t || "בלי תאריך")}</span>
          </li>`;
        })
        .join("");
    }
    const empty = key === "week" ? "אין מועדים בשבוע הקרוב." : key === "late" ? "אין משימות באיחור. כל הכבוד." : "אין כאן משימות.";
    return `<div class="band-panel" id="band-panel">
      <div class="wrap">
        <div class="bp-h">
          <h3>${def.title}<span class="bp-n">${n}</span></h3>
          <button class="btn sm" data-act="band" data-v="${key}">סגור</button>
        </div>
        ${n ? `<ul class="bl">${rows}</ul>` : `<p class="muted bp-empty">${empty}</p>`}
        ${key !== "week" && n ? '<p class="bp-hint muted small">לחיצה על ✓ מסמנת את המשימה כבוצעה.</p>' : ""}
      </div>
    </div>`;
  }

  function band() {
    const S = SH.state;
    const open = SH.view.band;
    const count = (k) => (k === "week" ? weekEvents().length : S.tasks.filter(BAND[k].pick).length);
    const cls = { today: count("today") ? "hot" : "", late: count("late") ? "bad" : "" };
    const stat = (k) =>
      `<button class="btile t-${k} ${cls[k] || ""} ${open === k ? "on" : ""}" data-act="band" data-v="${k}" aria-expanded="${open === k}" aria-controls="band-panel" aria-label="${BAND[k].label}: ${count(k)}">
        <img class="btile-img" src="img/tile-${k}.png" alt="" width="1500" height="720">
        <span class="btile-txt"><b class="btile-n">${count(k)}</b><span class="btile-l">${BAND[k].label}</span></span>
      </button>`;
    return `<section class="band band-art bleed" aria-label="תמונת מצב">
      <div class="wrap band-in">${["open", "today", "late", "week"].map(stat).join("")}</div>
      ${open && BAND[open] ? bandList(open) : ""}
    </section>`;
  }

  SH.actions.band = (el) => {
    SH.view.band = SH.view.band === el.dataset.v ? null : el.dataset.v;
    SH.render();
  };

  function courseCard(c) {
    const S = SH.state;
    const sums = S.summaries.filter((s) => s.courseId === c.id).length;
    const open = S.tasks.filter((t) => t.courseId === c.id && !t.done).length;
    const next = U.nextLesson(c);
    const lect = (c.lecturers || []).filter((l) => !/עוזר|מתרגל/.test(l.role || "")).map((l) => l.name)[0] || (c.lecturers || [])[0]?.name || "";
    const meta = [];
    if (next) meta.push(`<span>${U.I.cal}יום ${U.DSHORT[next.day]} ${U.esc(next.start)}</span>`);
    if (open) meta.push(`<span class="m-open">${open} משימות</span>`);
    if (sums) meta.push(`<span>${sums} סיכומים</span>`);
    const pic = U.coursePic(c);
    const cover = c.image
      ? `<span class="ccard-cover" style="${U.courseArt(c)}"></span>`
      : pic
        ? `<span class="ccard-cover pic" style="background:${pic.bg}"><img src="${pic.src}" alt="" width="720" height="412" loading="lazy"></span>`
        : `<span class="ccard-cover">${U.ill(U.illFor(c), "ill cover-ill")}</span>`;
    return `<button class="ccard" style="--cc:${U.esc(c.color)}" data-act="go" data-page="course" data-id="${U.esc(c.id)}">
      ${cover}
      <span class="ccard-body">
        ${c.code ? `<span class="ccard-code">${U.esc(c.code)}</span>` : ""}
        <span class="ccard-name">${U.esc(c.name)}</span>
        ${lect ? `<span class="ccard-lect">${U.esc(lect)}</span>` : ""}
        <span class="ccard-meta">${meta.join("")}</span>
      </span>
    </button>`;
  }

  function myCourses() {
    const courses = st.semesterCourses();
    if (!courses.length) return "";
    return `<section class="card mycourses hide-in-focus" aria-labelledby="mc-h">
      <div class="card-h has-ill">${U.spot("courses", "ill spot")}<h2 id="mc-h">הקורסים שלי</h2><span class="muted small">${courses.length} קורסים בסמסטר</span></div>
      <div class="cstrip">${courses.map(courseCard).join("")}</div>
    </section>`;
  }

  SH.pages.dash = function () {
    return `
      ${hero()}
      ${band()}
      <div class="wrap stack">
        ${SH.ui.statusAlert()}
        ${SH.ui.banner()}
        ${SH.ui.search()}
        ${U.withIll(SH.ui.today(), "cafe")}
        ${myCourses()}
        ${U.withIll(SH.ui.gcal(), "calendar")}
        <div class="row row-main">
          ${U.withIll(SH.ui.tasks(), "tasks")}
          ${U.withIll(SH.ui.board(), "column")}
        </div>
      </div>`;
  };

  SH.actions.focus = () => {
    SH.view.focus = !SH.view.focus;
    SH.render();
  };
})();
