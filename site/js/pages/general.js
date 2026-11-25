// General page: weekly summary, grades and the focus timer.
(function () {
  const U = SH.utils;

  function weekly() {
    const list = [...SH.state.weekly].sort((a, b) => String(b.date).localeCompare(String(a.date)));
    const w = list[0];
    if (!w) {
      return `<section class="card"><div class="card-h"><h2>סיכום שבועי</h2></div>
        <div class="empty"><b>הסיכום השבועי הראשון יגיע ביום חמישי</b>מה נלמד השבוע בכל קורס, מה עוד פתוח, ואילו כרטיסיות ממתינות לחזרה.</div></section>`;
    }
    return `<div class="page-wrap"><article class="page week-page">
      <header class="page-run"><span>סיכום שבועי</span><span>${U.long(w.date)}</span></header>
      <div class="md">${U.md(w.body)}</div>
    </article></div>`;
  }

  SH.pages.general = function () {
    return `
      <header class="phead bleed">
        <div class="wrap phead-in">${U.spot("promenade", "ill phead-ill")}
          <div><h1>כללי</h1><p>הסיכום השבועי, הציונים וטיימר הלמידה</p></div>
          <div class="top-actions">${SH.ui.bell()}</div>
        </div>
      </header>
      <div class="wrap stack">
        ${SH.ui.statusAlert()}
        ${weekly()}
        <div class="row row-2">
          ${U.withIll(SH.ui.grades(), "grades")}
          ${U.withIll(SH.ui.timer(), "timer")}
        </div>
      </div>`;
  };
})();
