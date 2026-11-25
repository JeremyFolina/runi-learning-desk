// Exams and quizzes for one course, each with its preparation package:
// topic map, flashcards, analysis of sample exams, practice exams.
(function () {
  const U = SH.utils;
  const KIND = { exam: "מבחן", quiz: "בוחן", deadline: "הגשה", meeting: "מפגש" };
  const KCOLOR = { exam: "var(--t-required)", quiz: "var(--warn)", deadline: "#8e4fd6", meeting: "var(--accent)" };
  const view = (SH.view.exams = SH.view.exams || { open: {} });

  function topicMap(course, ev) {
    const topics = (course.topics || []).filter((t) => !t.date || t.date <= ev.date);
    if (!topics.length) return '<p class="muted small">מפת הנושאים תיבנה מהסילבוס ומהסיכומים, ותתעדכן אחרי כל שיעור.</p>';
    return topics
      .map((t) => {
        const tag = t.notOnExam
          ? '<span class="pill gray">לא במבחן</span>'
          : t.emphasis === "high"
            ? '<span class="pill red">הודגש</span>'
            : "";
        return `<div class="topic"><span class="nm">${U.esc(t.name)}</span>${tag}${t.lesson ? `<button class="btn ghost sm" data-act="go" data-page="course" data-id="${U.esc(course.id)}" data-tab="sums">שיעור ${U.esc(t.lesson)}</button>` : ""}</div>`;
      })
      .join("");
  }

  function prep(course, ev) {
    const cards = SH.state.flashcards.filter((f) => f.courseId === course.id).length;
    return `<div class="prep">
      <div><h3 style="font-size:14px;margin-bottom:8px">מפת חומר</h3>${topicMap(course, ev)}</div>
      <div><h3 style="font-size:14px;margin-bottom:6px">כרטיסיות</h3>
        <p class="muted small" style="margin:0 0 8px">${cards ? `${cards} כרטיסיות מכל השיעורים עד עכשיו.` : "כרטיסיות ייווצרו אחרי כל סיכום."}</p>
        ${cards ? `<button class="btn sm" data-act="go" data-page="course" data-id="${U.esc(course.id)}" data-tab="cards">לתרגול כרטיסיות</button>` : ""}
      </div>
      <div><h3 style="font-size:14px;margin-bottom:6px">ניתוח מבחנים לדוגמה</h3>
        ${course.examAnalysis ? `<div class="md" style="border:0;padding:0">${U.md(course.examAnalysis)}</div>` : '<p class="muted small" style="margin:0">כשיעלו למודל מבחנים לדוגמה, יופיעו כאן הנושאים החוזרים, המשקל של כל נושא ודפוסי השאלות, ומבחני תרגול שנבנו לפיהם.</p>'}
      </div>
    </div>`;
  }

  SH.ui.exams = function (course) {
    const list = SH.state.events.filter((e) => e.courseId === course.id).sort(U.byDate);
    if (!list.length) {
      return `<section class="card"><div class="empty"><b>אין מועדים רשומים לקורס</b>מבחנים, בחנים והגשות ייכנסו לכאן מהמודל, מהודעות המרצים ומהסילבוס.</div></section>`;
    }
    return `<div class="sums">${list
      .map((e) => {
        const c = U.countdown(e.date, e.time);
        const canPrep = e.kind === "exam" || e.kind === "quiz";
        const open = view.open[e.id];
        return `<div class="exam">
          <div class="exam-h">
            <div class="cd-num" style="color:${KCOLOR[e.kind] || "var(--fg)"}">${c ? c.n : "✓"}<small>${c ? c.u : "עבר"}</small></div>
            <div style="flex:1;min-width:180px">
              <span class="pill" style="background:${KCOLOR[e.kind]};color:#fff">${KIND[e.kind] || ""}</span>
              <div style="font-weight:500;margin-top:4px">${U.esc(e.title)}</div>
              <div class="muted small">${U.long(e.date)}${e.time ? " · " + U.esc(e.time) : ""}${e.details ? " · " + U.esc(e.details) : ""}</div>
            </div>
            ${canPrep && c ? `<button class="btn ${open ? "" : "primary"} sm" data-act="togglePrep" data-id="${U.esc(e.id)}">${open ? "סגור" : "חבילת הכנה"}</button>` : ""}
          </div>
          ${canPrep && open ? prep(course, e) : ""}
        </div>`;
      })
      .join("")}</div>`;
  };

  SH.actions.togglePrep = (el) => {
    view.open[el.dataset.id] = !view.open[el.dataset.id];
    SH.render();
  };
})();
