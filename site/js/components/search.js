// One search box over summaries, transcripts, course materials, tasks,
// announcements, flashcards and enrichment.
(function () {
  const U = SH.utils;
  const st = SH.store;
  let sources = null;
  let timer = null;

  SH.ui.search = function () {
    return `<div class="search hide-in-focus">
      ${U.I.search}
      <input type="search" id="global-search" placeholder="חיפוש בכל הקורסים: סיכומים, תמלולים, חומרים, משימות והודעות" autocomplete="off" aria-label="חיפוש">
      <div id="search-results"></div>
    </div>`;
  };

  function hit(text, q) {
    return String(text || "").toLowerCase().includes(q);
  }

  async function run(q) {
    const box = document.getElementById("search-results");
    if (!box) return;
    if (q.length < 2) {
      box.innerHTML = "";
      return;
    }
    if (!sources) sources = await st.allSources();
    const S = SH.state;
    const lq = q.toLowerCase();
    const out = [];
    const push = (kind, courseId, tab, title, text) =>
      out.push({ kind, courseId, tab, title, snip: U.snippet(text || title, q) });

    S.summaries.forEach((s) => (hit(s.title, lq) || hit(s.body, lq)) && push("סיכום", s.courseId, "sums", `שיעור ${s.lesson} · ${s.title}`, hit(s.body, lq) ? s.body : s.title));
    sources.forEach((s) => hit(s.text, lq) && push(s.kind === "transcript" ? "תמלול" : "חומר קורס", s.courseId, "ask", s.title, s.text));
    S.announcements.forEach((a) => (hit(a.title, lq) || hit(a.body, lq)) && push("הודעה", a.courseId, "tasks", a.title, a.body));
    S.tasks.forEach((t) => hit(t.title, lq) && push("משימה", t.courseId, "tasks", t.title, t.title));
    S.flashcards.forEach((f) => (hit(f.q, lq) || hit(f.a, lq)) && push("כרטיסייה", f.courseId, "cards", f.q, f.a));
    S.enrichment.forEach((e) => (hit(e.title, lq) || hit(e.body, lq)) && push("העשרה", e.courseId, "enrich", e.title, e.body));

    if (!out.length) {
      box.innerHTML = `<div class="results"><div class="res muted">לא נמצאו תוצאות עבור "${U.esc(q)}".</div></div>`;
      return;
    }
    box.innerHTML = `<div class="results">${out
      .slice(0, 12)
      .map((r) => {
        const c = st.course(r.courseId);
        return `<button class="res" data-act="go" data-page="${c ? "course" : "dash"}" data-id="${U.esc(r.courseId || "")}" data-tab="${r.tab}">
          <div><span class="pill gray">${r.kind}</span> <b>${U.esc(r.title)}</b>${c ? ` <span class="muted small">· ${U.esc(c.short || c.name)}</span>` : ""}</div>
          <div class="muted small">${r.snip}</div>
        </button>`;
      })
      .join("")}${out.length > 12 ? `<div class="res muted small">ועוד ${out.length - 12} תוצאות. דייק את החיפוש.</div>` : ""}</div>`;
  }

  document.addEventListener("input", (e) => {
    if (e.target.id !== "global-search") return;
    clearTimeout(timer);
    const q = e.target.value.trim();
    timer = setTimeout(() => run(q), 220);
  });
})();
