// Course page: an illustrated cover strip, the course name and lecturers,
// the action buttons, and tabs.
(function () {
  const U = SH.utils;

  const TABS = [
    ["tasks", "משימות"],
    ["sums", "סיכומים"],
    ["exams", "מבחנים והכנה"],
    ["cards", "כרטיסיות"],
    ["ask", "שאל את הקורס"],
    ["enrich", "העשרה"],
    ["board", "הודעות"],
  ];

  // a drawing for each part of the course
  const TAB_ILL = { tasks: "tasks", sums: "notes", exams: "exams", cards: "cards", ask: "ask", enrich: "sea", board: "column" };

  function lecturers(c) {
    const ls = c.lecturers || [];
    if (!ls.length) return "";
    return `<div class="ch-lect">${ls
      .map((l) => {
        const extra = [l.role, l.hours].filter(Boolean).map(U.esc).join(" · ");
        return `<span class="lect"><b>${U.esc(l.name)}</b>${extra ? `<small>${extra}</small>` : ""}${l.email ? `<span class="mail" title="כתובת מייל">${U.esc(l.email)}</span>` : ""}</span>`;
      })
      .join("")}</div>`;
  }

  function actions(c) {
    const L = c.links || {};
    const items = [
      [L.moodle, U.I.link, "דף הקורס ב-Moodle"],
      [L.syllabus, U.I.book, "סילבוס"],
      [L.zoom, U.I.video, "זום"],
      [L.panopto, U.I.play, "הקלטות"],
    ].filter(([u]) => u);
    return items
      .map(([u, ic, label], i) => `<a class="btn ${i === 0 ? "primary" : ""}" href="${U.esc(u)}" target="_blank" rel="noopener">${ic} ${label}</a>`)
      .join("");
  }

  function autoButton(c) {
    const on = !!c.autoSummaries;
    return `<button class="btn auto-sum ${on ? "on" : ""}" data-act="autoSum" data-id="${U.esc(c.id)}" aria-pressed="${on}" title="הבוט יסכם הקלטות חדשות מ-Panopto לקורס הזה">
      <span class="sw" aria-hidden="true"><i></i></span>${on ? "סיכומים אוטומטיים פעילים" : "הפעל סיכומים אוטומטיים"}
    </button>`;
  }

  SH.pages.course = function () {
    const c = SH.store.course(SH.view.courseId);
    if (!c) {
      SH.view.page = "dash";
      return SH.pages.dash();
    }
    const tabs = TABS.filter(([k]) => k !== "enrich" || c.enrichment);
    let tab = SH.view.tab || "tasks";
    if (!tabs.find(([k]) => k === tab)) tab = "tasks";

    const sumsN = SH.state.summaries.filter((s) => s.courseId === c.id).length;
    const openN = SH.state.tasks.filter((t) => t.courseId === c.id && !t.done).length;
    const count = { tasks: openN, sums: sumsN };

    let body = "";
    const art = (html) => U.withIll(html, TAB_ILL[tab] || "calendar");
    if (tab === "tasks") body = art(SH.ui.tasks(c.id));
    if (tab === "sums") body = SH.ui.summaries(c.id);
    if (tab === "exams") body = SH.ui.exams(c);
    if (tab === "cards") body = art(SH.ui.flashcards(c.id));
    if (tab === "ask") body = art(SH.ui.ask(c));
    if (tab === "enrich") body = art(SH.ui.enrich(c.id));
    if (tab === "board") body = art(SH.ui.board(c.id));

    const next = U.nextLesson(c);
    const kicker = [
      U.esc(c.kind === "general" ? SH.store.cfg("generalLabel", "כללי") : SH.store.cfg("semesterLabel", "הסמסטר")),
      c.code ? `קורס ${U.esc(c.code)}` : "",
      next ? `המפגש הבא: יום ${U.DAYS[next.day]} ${U.esc(next.start)}${next.room ? " · " + U.esc(next.room) : ""}` : "",
    ].filter(Boolean);
    const grading = c.grading ? `<div class="ch-grading"><b>מרכיבי הציון</b> ${U.esc(c.grading)}</div>` : "";

    return `
      <header class="chead2 bleed" style="--cc:${U.esc(c.color || "")}">
        ${(() => {
          const pic = U.coursePic(c);
          if (c.image) return `<div class="ch-cover" style="${U.courseArt(c)}"></div>`;
          if (pic) return `<div class="ch-cover pic" style="background:${pic.bg}"><img class="ch-pic" src="${pic.src}" alt="" width="720" height="412"></div>`;
          return `<div class="ch-cover">${U.cover(c)}</div>`;
        })()}
        <div class="wrap ch-in">
          <div class="ch-kicker">${kicker.map((k) => `<span>${k}</span>`).join("")}</div>
          <h1>${U.esc(c.name)}</h1>
          ${lecturers(c)}
          ${grading}
          <div class="ch-actions">${actions(c)}${c.kind === "general" ? "" : autoButton(c)}</div>
          <nav class="tabs" aria-label="חלקי הקורס">${tabs
            .map(([k, label]) => `<button class="tab ${tab === k ? "on" : ""}" data-act="tab" data-v="${k}" ${tab === k ? 'aria-current="page"' : ""}>${label}${count[k] ? `<span class="tcount">${count[k]}</span>` : ""}</button>`)
            .join("")}</nav>
        </div>
      </header>
      <div class="wrap stack" style="--cc:${U.esc(c.color || "")}">
        ${SH.ui.statusAlert()}
        ${body}
      </div>`;
  };

  // automatic Panopto summaries are opt-in, per course
  SH.actions.autoSum = (el) => {
    const c = SH.store.course(el.dataset.id);
    if (!c) return;
    const on = !c.autoSummaries;
    SH.store.update("courses", c.id, { autoSummaries: on });
    U.toast(on ? `סיכומים אוטומטיים הופעלו ל${c.short || c.name}. הבוט יסכם את ההקלטות החדשות בריצה הבאה.` : `סיכומים אוטומטיים כובו ל${c.short || c.name}.`);
  };

  SH.actions.tab = (el) => {
    SH.view.tab = el.dataset.v;
    SH.render();
  };
})();
