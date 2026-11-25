// "Ask the course": answers only from this course's summaries, transcripts
// and materials, and says which lesson the answer comes from.
(function () {
  const U = SH.utils;
  const st = SH.store;
  const MAX_CHARS = 180000;
  const view = (SH.view.ask = SH.view.ask || {});
  let ctl = null;

  function slot(courseId) {
    view[courseId] = view[courseId] || { q: "", a: "", busy: false, err: "" };
    return view[courseId];
  }

  SH.ui.ask = function (course) {
    const s = slot(course.id);
    const off = !SH.services.sample;
    return `<section class="card">
      <div class="card-h"><h2>שאל את הקורס</h2><span class="muted small">עונה רק מתוך הסיכומים, התמלולים וחומרי הקורס</span></div>
      <div class="card-b" style="display:grid;gap:12px">
        ${off ? '<div class="muted">השאלות זמינות כשהאתר פתוח בתוך Claude.</div>' : ""}
        <form class="ask-form" data-form="ask" data-id="${U.esc(course.id)}">
          <input class="inp" id="ask-q-${U.esc(course.id)}" name="q" value="${U.esc(s.q)}" placeholder="למשל: מה ההבדל בין שיעור התעסוקה לשיעור ההשתתפות?" ${off ? "disabled" : ""} required>
          ${s.busy ? `<button class="btn" type="button" data-act="askStop">עצור</button>` : `<button class="btn primary" type="submit" ${off ? "disabled" : ""}>שאל</button>`}
        </form>
        ${s.a || s.busy || s.err ? `<div class="ask-out" id="ask-out-${U.esc(course.id)}">${U.esc(s.a || (s.busy ? "חושב…" : ""))}</div>` : ""}
        ${s.err ? `<div class="small" style="color:var(--t-required)">${U.esc(s.err)}</div>` : ""}
      </div>
    </section>`;
  };

  async function buildContext(courseId) {
    const sums = SH.state.summaries
      .filter((s) => s.courseId === courseId)
      .sort((a, b) => (+a.lesson || 0) - (+b.lesson || 0))
      .map((s) => `### סיכום שיעור ${s.lesson} (${s.date})\n${s.body}`);
    const srcs = (await st.sources(courseId)).map((s) => `### ${s.kind === "transcript" ? "תמלול" : "חומר קורס"}: ${s.title}${s.lesson ? ` (שיעור ${s.lesson})` : ""}\n${s.text}`);
    let ctx = sums.join("\n\n");
    for (const s of srcs) {
      if (ctx.length + s.length > MAX_CHARS) break;
      ctx += "\n\n" + s;
    }
    return ctx;
  }

  const ERR = {
    not_granted: "השאלות לא אושרו לאתר הזה.",
    rate_limited: "יותר מדי שאלות ברצף. נסה שוב בעוד דקה.",
    session_expired: "צריך להתחבר מחדש ל-Claude.",
    sampling_disabled: "Claude לא זמין בחשבון הזה.",
    refused: "לא התקבלה תשובה לשאלה הזו. נסה לנסח אחרת.",
  };

  SH.forms.ask = async (data, form) => {
    const courseId = form.dataset.id;
    const course = st.course(courseId);
    const s = slot(courseId);
    const q = (data.q || "").trim();
    if (!q || s.busy) return;
    Object.assign(s, { q, a: "", busy: true, err: "" });
    SH.render();

    const ctx = await buildContext(courseId);
    const prompt = `אתה עוזר לימודי לסטודנט בקורס "${course.name}".
ענה בעברית, בקצרה ובבהירות, רק על סמך החומר שלמטה. בסוף התשובה ציין מאיזה שיעור או חומר היא לקוחה.
אם התשובה לא נמצאת בחומר, אמור זאת במפורש ואל תמציא.

--- חומר הקורס ---
${ctx || "(עוד אין חומר שמור לקורס הזה)"}
--- סוף החומר ---

שאלה: ${q}`;

    ctl = new AbortController();
    try {
      await SH.services.ask(
        prompt,
        ({ text }) => {
          s.a = text;
          const out = document.getElementById("ask-out-" + courseId);
          if (out) out.textContent = text;
        },
        ctl.signal
      );
    } catch (e) {
      s.a = e?.text || s.a;
      if (e?.code !== "cancelled") s.err = ERR[e?.code] || "התשובה לא הושלמה. נסה שוב.";
    }
    s.busy = false;
    SH.render();
  };

  SH.actions.askStop = () => ctl?.abort();
})();
