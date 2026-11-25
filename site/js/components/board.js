// Lecturers' notice board: announcements from every course, newest first.
(function () {
  const U = SH.utils;
  const st = SH.store;
  const view = (SH.view.board = SH.view.board || { open: null, all: false });
  const LIMIT = 6;

  SH.ui.board = function (courseId) {
    const seen = new Set(SH.state.boardPrefs?.seen || []);
    let list = SH.state.announcements
      .filter((a) => !courseId || a.courseId === courseId)
      .sort((a, b) => String(b.date).localeCompare(String(a.date)));
    const total = list.length;
    if (!view.all) list = list.slice(0, LIMIT);
    const unread = SH.state.announcements.filter((a) => (!courseId || a.courseId === courseId) && !seen.has(a.id)).length;

    const items = list
      .map((a) => {
        const c = st.course(a.courseId);
        const open = view.open === a.id;
        return `<div class="ann">
          <button class="ann-h" data-act="openAnn" data-id="${U.esc(a.id)}" aria-expanded="${open}">
            <span class="dot" style="margin-top:7px;background:${U.esc(c?.color || "var(--faint)")}"></span>
            <span class="tt"><b>${U.esc(a.title)} ${seen.has(a.id) ? "" : '<span class="pill accent">חדש</span>'}</b>
              <span class="muted small">${U.esc(c?.short || c?.name || "")}${a.author ? " · " + U.esc(a.author) : ""} · ${U.esc(U.ago(Date.parse(a.date)))}</span></span>
          </button>
          ${open ? `<div class="ann-body">${U.esc(a.body)}${a.url ? `\n\n<a href="${U.esc(a.url)}" target="_blank" rel="noopener">פתח במודל</a>` : ""}</div>` : ""}
        </div>`;
      })
      .join("");

    return `<section class="card hide-in-focus">
      <div class="card-h"><h2>${U.I.mega} לוח מודעות${unread ? ` <span class="pill accent">${unread} חדשות</span>` : ""}</h2>
        ${total > LIMIT ? `<button class="btn ghost sm" data-act="annAll">${view.all ? "הצג פחות" : `הצג את כל ה-${total}`}</button>` : ""}
      </div>
      ${items || '<div class="empty"><b>אין הודעות עדיין</b>הודעות המרצים יופיעו כאן אחרי ריצת הבוט.</div>'}
    </section>`;
  };

  SH.actions.openAnn = (el) => {
    const id = el.dataset.id;
    view.open = view.open === id ? null : id;
    const seen = new Set(SH.state.boardPrefs?.seen || []);
    if (!seen.has(id)) {
      seen.add(id);
      st.put("prefs/board", { seen: [...seen] });
    }
    SH.render();
  };

  SH.actions.annAll = () => {
    view.all = !view.all;
    SH.render();
  };
})();
