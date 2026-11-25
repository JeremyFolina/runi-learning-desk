// Enrichment for non-analytic courses: famous studies, real-life examples,
// and recommendations (podcasts, talks, books), built against the syllabus.
(function () {
  const U = SH.utils;
  const GROUPS = [
    ["study", "ניסויים ומחקרים מפורסמים"],
    ["example", "דוגמאות מהחיים ומהחדשות"],
    ["recommend", "להמשך: פודקאסטים, הרצאות וספרים"],
  ];

  function card(e) {
    return `<div class="en">
      ${e.topic ? `<span class="pill gray" style="justify-self:start">${U.esc(e.topic)}</span>` : ""}
      <b>${U.esc(e.title)}</b>
      <p>${U.esc(e.body)}</p>
      ${e.url ? `<a class="small" href="${U.esc(e.url)}" target="_blank" rel="noopener">לפתיחה ${U.I.ext}</a>` : ""}
    </div>`;
  }

  SH.ui.enrich = function (courseId) {
    const all = SH.state.enrichment.filter((e) => e.courseId === courseId);
    if (!all.length) {
      return `<section class="card"><div class="empty"><b>העשרה בדרך</b>תכנים יתווספו מול נושאי הסילבוס.</div></section>`;
    }
    return GROUPS.map(([k, label]) => {
      const list = all.filter((e) => e.kind === k);
      if (!list.length) return "";
      return `<section class="card"><div class="card-h"><h2>${label}</h2></div><div class="card-b"><div class="enrich">${list.map(card).join("")}</div></div></section>`;
    }).join("");
  };
})();
