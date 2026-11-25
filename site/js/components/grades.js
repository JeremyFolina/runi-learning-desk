// Grades and weighted average. Grades come from Moodle; credits you set once.
(function () {
  const U = SH.utils;
  const st = SH.store;

  function rows() {
    return st.semesterCourses().concat(st.generalCourses()).map((c) => {
      const g = SH.state.grades.find((x) => x.id === c.id) || {};
      return { c, grade: g.grade ?? "", credits: g.credits ?? c.credits ?? "" };
    });
  }

  SH.ui.grades = function () {
    const list = rows();
    let sum = 0;
    let w = 0;
    list.forEach((r) => {
      const g = parseFloat(r.grade);
      const k = parseFloat(r.credits);
      if (!isNaN(g) && !isNaN(k) && k > 0) {
        sum += g * k;
        w += k;
      }
    });
    const avg = w ? (sum / w).toFixed(1) : "—";

    return `<section class="card">
      <div class="card-h"><h2>ציונים וממוצע</h2><div><span class="muted small">ממוצע משוקלל</span> <span class="big-num">${avg}</span></div></div>
      <div class="scrollx"><table class="grades">
        <thead><tr><th>קורס</th><th>ציון</th><th>נקודות זכות</th></tr></thead>
        <tbody>${list
          .map(
            (r) => `<tr>
              <td><span class="cpill"><i class="dot" style="background:${U.esc(r.c.color)}"></i>${U.esc(r.c.name)}</span></td>
              <td><input class="inp" type="number" min="0" max="100" id="gr-${U.esc(r.c.id)}" data-change="grade" data-id="${U.esc(r.c.id)}" value="${U.esc(r.grade)}" placeholder="—" aria-label="ציון"></td>
              <td><input class="inp" type="number" min="0" step="0.5" id="cr-${U.esc(r.c.id)}" data-change="credits" data-id="${U.esc(r.c.id)}" value="${U.esc(r.credits)}" placeholder="—" aria-label="נקודות זכות"></td>
            </tr>`
          )
          .join("")}</tbody>
      </table></div>
      <div class="legend">ציונים שיתפרסמו במודל ייכנסו לכאן אוטומטית. אפשר גם להזין ידנית.</div>
    </section>`;
  };

  function save(id, patch) {
    const cur = SH.state.grades.find((x) => x.id === id) || {};
    const next = { grade: cur.grade ?? "", credits: cur.credits ?? "", ...patch };
    st.put("grades/" + id, next);
  }

  SH.changes = SH.changes || {};
  SH.changes.grade = (el) => save(el.dataset.id, { grade: el.value });
  SH.changes.credits = (el) => save(el.dataset.id, { credits: el.value });
})();
