// Top bar: the brand and main links, and under it a row of the semester's
// courses, one tap away.
(function () {
  const U = SH.utils;
  const st = SH.store;

  function courseChip(c) {
    const on = SH.view.page === "course" && SH.view.courseId === c.id;
    return `<button class="cb-chip ${on ? "on" : ""}" style="--cc:${U.esc(c.color)}" data-act="go" data-page="course" data-id="${U.esc(c.id)}" ${on ? 'aria-current="page"' : ""}>
      <span class="dot"></span><span class="nm">${U.esc(c.short || c.name)}</span>
    </button>`;
  }

  SH.ui.sidebar = function () {
    document.documentElement.dataset.season = U.season();
    const v = SH.view;
    const moodle = st.cfg("moodleUrl", "https://moodle.runi.ac.il/");
    const courses = st.semesterCourses().concat(st.generalCourses());
    const link = (page, label) =>
      `<button class="tb-link ${v.page === page ? "on" : ""}" data-act="go" data-page="${page}" ${v.page === page ? 'aria-current="page"' : ""}>${label}</button>`;
    return `
      <div class="tb-bar">
        <div class="wrap tb-row">
          <button class="tb-brand" data-act="go" data-page="dash" aria-label="שולחן הלמידה, בית">
            ${U.logo(38)}
            <span class="tb-name"><b>שולחן הלמידה</b><small>אוניברסיטת רייכמן · ${U.esc(st.cfg("semesterLabel", ""))}</small></span>
          </button>
          <nav class="tb-nav" aria-label="ראשי">
            ${link("dash", "בית")}
            ${link("general", "כללי")}
            <a class="tb-link" href="${U.esc(moodle)}" target="_blank" rel="noopener">Moodle ${U.I.ext}</a>
          </nav>
          <div class="tb-end">${SH.ui.statusChip()}</div>
        </div>
      </div>
      ${courses.length ? `<nav class="coursebar" aria-label="הקורסים שלי"><div class="wrap cb-row">${courses.map(courseChip).join("")}</div></nav>` : ""}`;
  };
})();
