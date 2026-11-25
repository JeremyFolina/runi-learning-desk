// App shell: routing, rendering, and one place that wires every click,
// form and change to the handlers registered by components.
(function () {
  const U = SH.utils;
  const st = SH.store;
  const v = SH.view;

  v.page = v.page || "dash";

  // ---------- routing (bare #tokens only) ----------
  function fromHash() {
    const h = (location.hash || "").slice(1);
    if (h === "general") v.page = "general";
    else if (h.startsWith("c-")) {
      v.page = "course";
      v.courseId = h.slice(2);
    }
  }

  function toHash() {
    const token = v.page === "course" ? "c-" + v.courseId : v.page;
    try {
      history.replaceState(null, "", "#" + token);
    } catch {}
  }

  // ---------- render, keeping what the user is typing ----------
  function snapshotInputs(root) {
    const keep = {};
    root.querySelectorAll("input[id], textarea[id], select[id]").forEach((el) => {
      if (el.type === "checkbox") keep[el.id] = { checked: el.checked };
      else keep[el.id] = { value: el.value };
    });
    const a = document.activeElement;
    const focus = a && a.id && root.contains(a) ? { id: a.id, s: a.selectionStart, e: a.selectionEnd } : null;
    const results = document.getElementById("search-results")?.innerHTML || "";
    return { keep, focus, results };
  }

  function restoreInputs(root, snap) {
    Object.entries(snap.keep).forEach(([id, val]) => {
      const el = document.getElementById(id);
      if (!el || !root.contains(el)) return;
      // inputs whose value comes from data keep the data's value unless focused
      if (el.dataset.change && (!snap.focus || snap.focus.id !== id)) return;
      if ("checked" in val) el.checked = val.checked;
      else el.value = val.value;
    });
    const sr = document.getElementById("search-results");
    if (sr && snap.results) sr.innerHTML = snap.results;
    if (snap.focus) {
      const el = document.getElementById(snap.focus.id);
      if (el) {
        el.focus();
        try {
          el.setSelectionRange(snap.focus.s, snap.focus.e);
        } catch {}
      }
    }
  }

  SH.render = function () {
    const side = U.$("#side");
    const main = U.$("#main");
    side.innerHTML = SH.ui.sidebar();

    if (!st.ready()) {
      main.innerHTML = '<div class="wrap"><div class="empty"><b>טוען את שולחן הלמידה…</b></div></div>';
      return;
    }

    const snap = snapshotInputs(main);
    let html = "";
    if (st.mode === "offline") {
      html += `<div class="wrap" style="padding-top:16px"><div class="status-alert" style="background:var(--warn-bg)"><p>הדף פתוח מחוץ ל-Claude, ולכן הוא לא מחובר לנתונים שלך. פתח אותו דרך claude.ai או באפליקציית Claude.</p></div></div>`;
    }
    const page = SH.pages[v.page] || SH.pages.dash;
    html += page();
    main.innerHTML = html;
    document.body.classList.toggle("focus-mode", !!v.focus && v.page === "dash");
    restoreInputs(main, snap);
  };

  // ---------- navigation ----------
  SH.actions.go = (el) => {
    v.page = el.dataset.page || "dash";
    if (v.page === "course") v.courseId = el.dataset.id;
    v.tab = el.dataset.tab || "tasks";
    v.bellOpen = false;
    toHash();
    SH.render();
    window.scrollTo({ top: 0 });
  };

  // ---------- event wiring ----------
  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-act]");
    if (!el) {
      if (v.bellOpen && !e.target.closest(".bell-wrap")) {
        v.bellOpen = false;
        SH.render();
      }
      return;
    }
    const fn = SH.actions[el.dataset.act];
    if (fn) {
      e.preventDefault();
      fn(el, e);
    }
  });

  document.addEventListener("submit", (e) => {
    const form = e.target.closest("[data-form]");
    if (!form) return;
    e.preventDefault();
    const data = {};
    new FormData(form).forEach((val, key) => (data[key] = val));
    const fn = SH.forms[form.dataset.form];
    if (fn) fn(data, form);
  });

  document.addEventListener("change", (e) => {
    const el = e.target.closest("[data-change]");
    if (!el) return;
    const fn = (SH.changes || {})[el.dataset.change];
    if (fn) fn(el);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && v.bellOpen) {
      v.bellOpen = false;
      SH.render();
    }
  });

  // ---------- start ----------
  let pending = false;
  function onChange() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => {
      pending = false;
      SH.render();
    });
  }

  fromHash();
  SH.render();
  st.init(onChange);
  SH.services.init(onChange);

  // refresh clocks and countdowns once a minute, unless the user is typing
  setInterval(() => {
    const a = document.activeElement;
    if (!a || !a.matches("input, textarea, select")) SH.render();
  }, 60000);
})();
