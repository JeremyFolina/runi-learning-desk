// Notifications: the 3-day banner and the quiet weekly bell.
(function () {
  const U = SH.utils;
  const st = SH.store;
  const S = () => SH.state;
  const KIND = { exam: "מבחן", quiz: "בוחן", deadline: "הגשה" };
  const sessionShown = new Set();

  // everything dated within `days` from today: exams, quizzes, deadlines, required tasks
  function items(days) {
    const out = [];
    S().events.forEach((e) => {
      if (!KIND[e.kind]) return;
      const n = U.dayDiff(e.date);
      if (n >= 0 && n <= days) out.push({ id: "e:" + e.id, n, date: e.date, time: e.time, title: `${KIND[e.kind]}: ${e.title}`, courseId: e.courseId });
    });
    S().tasks.forEach((t) => {
      if (t.kind !== "required" || t.done || !t.due) return;
      const n = U.dayDiff(t.due);
      if (n >= 0 && n <= days) out.push({ id: "t:" + t.id, n, date: t.due, title: `הגשה: ${t.title}`, courseId: t.courseId });
    });
    return out.sort((a, b) => a.n - b.n);
  }
  SH.notifyItems = items;

  function when(it) {
    if (it.n === 0) return "היום" + (it.time ? " " + it.time : "");
    if (it.n === 1) return "מחר" + (it.time ? " " + it.time : "");
    return `בעוד ${it.n} ימים · ${U.short(it.date)}`;
  }

  // ---------- banner ----------
  let pendingShown = null;

  SH.ui.banner = function () {
    const p = S().bannerPrefs || {};
    const today = U.today();
    const forever = p.forever || {};
    const closed = p.closed || {};
    const shown = p.shown || {};

    const list = items(3).filter((it) => {
      if (forever[it.id] || closed[it.id] === today) return false;
      if (shown[it.id] === today && !sessionShown.has(it.id)) return false;
      return true;
    });
    if (!list.length) return "";

    // remember that these were shown today, so leaving counts like "close"
    const fresh = list.filter((it) => shown[it.id] !== today);
    fresh.forEach((it) => sessionShown.add(it.id));
    if (fresh.length && !pendingShown) {
      pendingShown = setTimeout(() => {
        pendingShown = null;
        const cur = S().bannerPrefs || {};
        const next = { ...(cur.shown || {}) };
        sessionShown.forEach((id) => (next[id] = today));
        st.put("prefs/banner", { ...cur, shown: next });
      }, 800);
    }

    return `<div class="banner hide-in-focus">${list
      .map((it) => {
        const c = st.course(it.courseId);
        return `<div class="banner-item">
          <span class="pill red">${U.esc(when(it))}</span>
          <span class="txt"><b>${U.esc(it.title)}</b>${c ? ` <span class="muted small">· ${U.esc(c.name)}</span>` : ""}</span>
          <button class="btn sm" data-act="bannerClose" data-id="${U.esc(it.id)}">סגור</button>
          <button class="btn ghost sm" data-act="bannerNever" data-id="${U.esc(it.id)}">אל תציג שוב</button>
        </div>`;
      })
      .join("")}</div>`;
  };

  function savePrefs(patch) {
    const cur = S().bannerPrefs || {};
    st.put("prefs/banner", { ...cur, ...patch(cur) });
  }

  SH.actions.bannerClose = (el) => {
    sessionShown.delete(el.dataset.id);
    savePrefs((cur) => ({ closed: { ...(cur.closed || {}), [el.dataset.id]: U.today() } }));
  };

  SH.actions.bannerNever = (el) => {
    sessionShown.delete(el.dataset.id);
    savePrefs((cur) => ({ forever: { ...(cur.forever || {}), [el.dataset.id]: true } }));
  };

  // ---------- bell ----------
  function unseen() {
    const seen = new Set(S().bellPrefs?.seen || []);
    return items(7).filter((it) => !seen.has(it.id));
  }

  SH.ui.bell = function () {
    const n = unseen().length;
    const open = SH.view.bellOpen;
    const list = items(7);
    const fresh = SH.view.bellFresh || new Set();
    return `<div class="bell-wrap">
      <button class="bell" data-act="bell" aria-label="התראות לשבוע הקרוב">${U.I.bell}${n ? `<span class="badge">${n}</span>` : ""}</button>
      ${
        open
          ? `<div class="panel" role="dialog" aria-label="השבוע הקרוב">
          <div class="panel-h">השבוע הקרוב</div>
          ${
            list.length
              ? list
                  .map((it) => {
                    const c = st.course(it.courseId);
                    return `<div class="notif">
                      <span class="dot" style="margin-top:7px;background:${it.n <= 3 ? "var(--t-required)" : "var(--accent)"}"></span>
                      <div style="flex:1;min-width:0"><div>${U.esc(it.title)} ${fresh.has(it.id) ? '<span class="pill accent">חדש</span>' : ""}</div>
                      <div class="when">${U.esc(when(it))}${c ? " · " + U.esc(c.name) : ""}</div></div>
                    </div>`;
                  })
                  .join("")
              : '<div class="empty">אין מועדים בשבוע הקרוב.</div>'
          }
        </div>`
          : ""
      }
    </div>`;
  };

  SH.actions.bell = () => {
    SH.view.bellOpen = !SH.view.bellOpen;
    if (SH.view.bellOpen) {
      SH.view.bellFresh = new Set(unseen().map((i) => i.id));
      const ids = items(7).map((i) => i.id);
      const seen = new Set(S().bellPrefs?.seen || []);
      if (ids.some((id) => !seen.has(id))) {
        // keep the ids that are still current, plus the ones just seen
        st.put("prefs/bell", { seen: ids });
      }
    }
    SH.render();
  };
})();
