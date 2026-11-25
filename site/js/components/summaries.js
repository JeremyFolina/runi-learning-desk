// Lesson summaries for one course, numbered in the order the lessons happened.
// The list works as a table of contents; the open lesson is laid out as a
// paper page on the desk.
(function () {
  const U = SH.utils;
  const view = (SH.view.sums = SH.view.sums || { open: null });

  function page(s, c) {
    const meta = [U.long(s.date), s.mode, s.lecturer, s.duration].filter(Boolean).map(U.esc).join(" · ");
    const isTut = /^תרגול/.test(String(s.title || ""));
    return `<div class="page-wrap"><article class="page">
      <header class="page-run"><span class="c">${U.esc(c ? c.short || c.name : "")}</span><span>${isTut ? "תרגול לשיעור" : "שיעור"} ${U.esc(s.lesson || "")}</span></header>
      <h2 class="page-title">${U.esc(s.title)}</h2>
      <div class="page-meta">${meta}</div>
      <div class="md">${U.md(s.body)}</div>
      <footer class="page-foot">${U.esc(s.lesson || "")}</footer>
    </article></div>`;
  }

  SH.ui.summaries = function (courseId) {
    const c = SH.store.course(courseId);
    const list = SH.state.summaries
      .filter((s) => s.courseId === courseId)
      .sort((a, b) => (+a.lesson || 0) - (+b.lesson || 0) || U.byDate(a, b));

    if (!list.length) {
      return `<section class="card"><div class="empty"><b>עוד אין סיכומים לקורס הזה</b>
        כשהקלטה חדשה תעלה ל-Panopto, הבוט יסכם אותה באותו יום או למחרת, לפי מספר השיעור והתאריך.</div></section>`;
    }

    const known = list.find((s) => s.id === view.open);
    if (!view.open || (view.open !== "__none__" && !known)) view.open = list[list.length - 1].id;

    return `<div class="sums" style="--cc:${U.esc(c?.color || "")}">${list
      .map((s) => {
        const open = view.open === s.id;
        return `<div class="sum">
          <button class="sum-h" data-act="openSum" data-id="${U.esc(s.id)}" aria-expanded="${open}">
            <span class="lnum">${U.esc(s.lesson || "–")}<small>שיעור</small></span>
            <span class="tt"><b>${U.esc(s.title)}</b><span class="muted small">${U.long(s.date)}${s.mode ? " · " + U.esc(s.mode) : ""}${s.lecturer ? " · " + U.esc(s.lecturer) : ""}</span></span>
            ${s.duration ? `<span class="pill gray">${U.esc(s.duration)}</span>` : ""}
          </button>
          ${open ? page(s, c) : ""}
        </div>`;
      })
      .join("")}</div>`;
  };

  SH.actions.openSum = (el) => {
    view.open = view.open === el.dataset.id ? "__none__" : el.dataset.id;
    SH.render();
  };
})();
