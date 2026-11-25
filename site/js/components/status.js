// Bot status light: when the bot last ran, and whether Moodle needs a new sign-in.
(function () {
  const U = SH.utils;

  function state() {
    const s = SH.state.system || {};
    if (s.needsLogin) return { cls: "bad", label: "צריך מפתח חדש למודל" };
    if (!s.lastRun) return { cls: "stale", label: "הבוט עוד לא רץ" };
    const hours = (Date.now() - s.lastRun) / 36e5;
    if (s.ok === false) return { cls: "bad", label: `ריצה נכשלה · ${U.ago(s.lastRun)}` };
    if (hours > 26) return { cls: "stale", label: `עדכון אחרון: ${U.ago(s.lastRun)}` };
    return { cls: "ok", label: `עודכן ${U.ago(s.lastRun)}` };
  }

  SH.ui.statusChip = function () {
    const s = state();
    return `<span class="status" title="${U.esc(SH.state.system?.message || "")}"><span class="dot ${s.cls}"></span>${U.esc(s.label)}</span>`;
  };

  // full-width notice on the dashboard in the rare case the Moodle app key stops working
  SH.ui.statusAlert = function () {
    const s = SH.state.system || {};
    const upd = s.updateAvailable
      ? `<div class="status-alert update-alert">
      <span class="dot" style="background:var(--accent, #025d94)"></span>
      <p><b>יש גרסה חדשה של שולחן הלמידה (${U.esc(s.updateAvailable)}).</b> כתוב ל-Claude "תעדכן את שולחן הלמידה". הנתונים שלך נשמרים.</p>
    </div>`
      : "";
    if (!s.needsLogin) return upd;
    return upd + `<div class="status-alert">
      <span class="dot" style="background:var(--t-required)"></span>
      <p><b>המפתח של אפליקציית Moodle הפסיק לעבוד.</b> הבוט לא יכול לאסוף מידע חדש. כתוב ל-Claude "צריך מפתח חדש למודל", ואחרי זה הבוט ישלים את מה שהוחמץ.</p>
    </div>`;
  };
})();
