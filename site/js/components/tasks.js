// Tasks: gray = from the system, brown = yours, red = required, green = done.
// Done tasks sink to the bottom and move to the archive after 2 days
// or at the end of their due day, whichever comes first.
(function () {
  const U = SH.utils;
  const st = SH.store;
  const LABEL = { auto: "מערכת", manual: "שלי", required: "חובה", done: "בוצע" };
  const COLOR = { auto: "var(--t-auto)", manual: "var(--t-manual)", required: "var(--t-required)", done: "var(--t-done)" };

  const view = (SH.view.tasks = SH.view.tasks || { filter: "open", archive: false });

  SH.ui.taskColor = (t) => COLOR[t.done ? "done" : t.kind || "manual"];

  function isArchived(t) {
    if (!t.done) return false;
    const now = Date.now();
    const byAge = (t.doneAt || 0) + 2 * 864e5;
    let byDue = Infinity;
    if (t.due) {
      const end = U.parse(t.due);
      end.setHours(23, 59, 59);
      byDue = end.getTime();
    }
    return now >= Math.min(byAge, byDue);
  }
  SH.isArchived = isArchived;

  function sortTasks(list) {
    return [...list].sort((a, b) => {
      if (!!a.done !== !!b.done) return a.done ? 1 : -1;
      return String(a.due || "9999").localeCompare(String(b.due || "9999"));
    });
  }

  function visible(courseId) {
    let list = SH.state.tasks.filter((t) => !courseId || t.courseId === courseId);
    if (view.archive) return list.filter(isArchived).sort((a, b) => (b.doneAt || 0) - (a.doneAt || 0));
    list = list.filter((t) => !isArchived(t));
    if (view.filter === "week") list = list.filter((t) => t.done || (t.due && U.dayDiff(t.due) <= 7));
    return sortTasks(list);
  }

  function row(t, showCourse) {
    const c = st.course(t.courseId);
    const k = t.done ? "done" : t.kind || "manual";
    const r = U.relDue(t.due);
    return `<tr>
      <td class="first" style="--c:${COLOR[k]}"><span class="ttl ${t.done ? "done" : ""}">${U.esc(t.title)}</span></td>
      ${showCourse ? `<td>${c ? `<span class="cpill"><i class="dot" style="background:${U.esc(c.color)}"></i>${U.esc(c.short || c.name)}</span>` : '<span class="muted">כללי</span>'}</td>` : ""}
      <td class="num ${t.done ? "" : r.c}">${U.esc(r.t)}</td>
      <td class="kind"><button class="kind-cell k-${k}" data-act="toggleTask" data-id="${U.esc(t.id)}" title="${t.done ? "סמן כלא בוצע" : "סמן כבוצע"}">${LABEL[k]}</button></td>
      <td style="width:34px"><button class="rowx" data-act="delTask" data-id="${U.esc(t.id)}" aria-label="מחק משימה">${U.I.x}</button></td>
    </tr>`;
  }

  function addForm(courseId) {
    const opts = st
      .semesterCourses()
      .concat(st.generalCourses())
      .map((c) => `<option value="${U.esc(c.id)}">${U.esc(c.short || c.name)}</option>`)
      .join("");
    const key = courseId || "all";
    return `<form class="addrow" data-form="addTask">
      <input class="inp grow" type="text" id="nt-title-${key}" name="title" placeholder="משימה חדשה, למשל: לעבור על סיכום שיעור 3 לפני התרגול" required>
      ${courseId ? `<input type="hidden" name="courseId" value="${U.esc(courseId)}">` : `<select class="inp" name="courseId" id="nt-course" aria-label="קורס"><option value="">כללי</option>${opts}</select>`}
      <input class="inp" type="date" name="due" id="nt-due-${key}" aria-label="תאריך יעד">
      <label class="check"><input type="checkbox" name="required" id="nt-req-${key}"> חובה להגשה</label>
      <button class="btn primary" type="submit">${U.I.plus} הוסף</button>
    </form>`;
  }

  SH.ui.tasks = function (courseId) {
    const list = visible(courseId);
    const archived = SH.state.tasks.filter((t) => (!courseId || t.courseId === courseId) && isArchived(t)).length;
    const seg = view.archive
      ? `<button class="btn sm" data-act="taskArchive">חזרה לרשימה</button>`
      : `<div class="top-actions">
          <div class="seg">
            <button class="${view.filter === "open" ? "on" : ""}" data-act="taskFilter" data-v="open">הכל</button>
            <button class="${view.filter === "week" ? "on" : ""}" data-act="taskFilter" data-v="week">השבוע</button>
          </div>
          <button class="btn ghost sm" data-act="taskArchive">ארכיון בוצעו${archived ? ` (${archived})` : ""}</button>
        </div>`;

    const table = list.length
      ? `<div class="scrollx"><table class="tasks"><thead><tr><th>משימה</th>${courseId ? "" : "<th>קורס</th>"}<th>יעד</th><th>סוג</th><th></th></tr></thead><tbody>${list.map((t) => row(t, !courseId)).join("")}</tbody></table></div>`
      : `<div class="empty"><b>${view.archive ? "הארכיון ריק" : "אין משימות פתוחות"}</b>${view.archive ? "משימות שבוצעו יגיעו לכאן אחרי יומיים." : "אפשר להוסיף משימה למטה."}</div>`;

    return `<section class="card">
      <div class="card-h"><h2>${U.I.check} ${view.archive ? "ארכיון בוצעו" : "משימות"}</h2>${seg}</div>
      ${table}
      ${view.archive ? "" : addForm(courseId)}
      <div class="legend">
        <span><i class="dot" style="background:var(--t-auto)"></i>מערכת</span>
        <span><i class="dot" style="background:var(--t-manual)"></i>שלי</span>
        <span><i class="dot" style="background:var(--t-required)"></i>חובה להגשה</span>
        <span><i class="dot" style="background:var(--t-done)"></i>בוצע</span>
      </div>
    </section>`;
  };

  SH.actions.toggleTask = (el) => {
    const t = SH.state.tasks.find((x) => x.id === el.dataset.id);
    if (!t) return;
    st.update("tasks", t.id, t.done ? { done: false, doneAt: null } : { done: true, doneAt: Date.now() });
  };

  SH.actions.delTask = (el) => st.remove("tasks", el.dataset.id);

  SH.actions.taskFilter = (el) => {
    view.filter = el.dataset.v;
    SH.render();
  };

  SH.actions.taskArchive = () => {
    view.archive = !view.archive;
    SH.render();
  };

  SH.forms.addTask = (data, form) => {
    const title = (data.title || "").trim();
    if (!title) return;
    st.add("tasks", {
      title,
      courseId: data.courseId || "",
      due: data.due || "",
      kind: data.required ? "required" : "manual",
      done: false,
      createdAt: Date.now(),
      source: "manual",
    });
    form.reset();
  };
})();
