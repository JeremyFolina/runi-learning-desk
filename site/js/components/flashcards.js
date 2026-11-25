// Flashcards per course: by topic or all mixed. Cards you miss come back
// sooner (a simple 5-box spaced-repetition scheme).
(function () {
  const U = SH.utils;
  const st = SH.store;
  const GAPS = [0, 1, 2, 4, 7, 14];
  const view = (SH.view.cards = SH.view.cards || { topic: "__mix__", idx: 0, flipped: false, order: null, course: null });

  function deck(courseId) {
    let cards = SH.state.flashcards.filter((f) => f.courseId === courseId);
    if (view.topic !== "__mix__") cards = cards.filter((f) => f.topic === view.topic);
    const today = U.today();
    const due = cards.filter((f) => !f.due || f.due <= today);
    return due.length ? due : cards;
  }

  function shuffled(ids) {
    const a = [...ids];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  SH.ui.flashcards = function (courseId) {
    const all = SH.state.flashcards.filter((f) => f.courseId === courseId);
    if (!all.length) {
      return `<section class="card"><div class="empty"><b>עוד אין כרטיסיות</b>אחרי כל סיכום שיעור ייווצרו כרטיסיות שאלה-תשובה, מחולקות לפי נושא.</div></section>`;
    }
    if (view.course !== courseId) Object.assign(view, { course: courseId, topic: "__mix__", idx: 0, flipped: false, order: null });

    const topics = [...new Set(all.map((f) => f.topic).filter(Boolean))];
    const cards = deck(courseId);
    const ids = cards.map((c) => c.id);
    if (!view.order || view.order.some((id) => !ids.includes(id)) || view.order.length !== ids.length) {
      view.order = view.topic === "__mix__" ? shuffled(ids) : ids;
      view.idx = 0;
    }
    const card = cards.find((c) => c.id === view.order[view.idx % view.order.length]);
    const dueN = all.filter((f) => !f.due || f.due <= U.today()).length;

    const chips = [`<button class="${view.topic === "__mix__" ? "on" : ""}" data-act="cardTopic" data-v="__mix__">ערבב הכל</button>`]
      .concat(topics.map((t) => `<button class="${view.topic === t ? "on" : ""}" data-act="cardTopic" data-v="${U.esc(t)}">${U.esc(t)}</button>`))
      .join("");

    return `<section class="card">
      <div class="card-h"><h2>כרטיסיות</h2><span class="muted small">${all.length} כרטיסיות · ${dueN} לחזרה היום</span></div>
      <div class="card-b">
        <div class="scrollx"><div class="seg">${chips}</div></div>
        <div class="fc-wrap">
          <div class="muted small">כרטיס ${(view.idx % view.order.length) + 1} מתוך ${view.order.length}${card?.topic ? " · " + U.esc(card.topic) : ""}</div>
          <button class="fc ${view.flipped ? "back" : ""}" data-act="cardFlip">
            <span><span class="side-l">${view.flipped ? "תשובה" : "שאלה · לחץ להפוך"}</span>${U.esc(view.flipped ? card.a : card.q)}</span>
          </button>
          <div class="fc-actions">
            ${view.flipped ? `<button class="btn" data-act="cardGrade" data-v="0" data-id="${U.esc(card.id)}">לא ידעתי</button><button class="btn primary" data-act="cardGrade" data-v="1" data-id="${U.esc(card.id)}">ידעתי</button>` : `<button class="btn" data-act="cardFlip">הצג תשובה</button>`}
            <button class="btn ghost" data-act="cardNext">דלג</button>
          </div>
        </div>
      </div>
    </section>`;
  };

  SH.actions.cardFlip = () => {
    view.flipped = !view.flipped;
    SH.render();
  };

  SH.actions.cardNext = () => {
    view.idx++;
    view.flipped = false;
    SH.render();
  };

  SH.actions.cardTopic = (el) => {
    view.topic = el.dataset.v;
    view.order = null;
    view.flipped = false;
    SH.render();
  };

  SH.actions.cardGrade = (el) => {
    const card = SH.state.flashcards.find((f) => f.id === el.dataset.id);
    if (!card) return;
    const box = el.dataset.v === "1" ? Math.min(5, (card.box || 1) + 1) : 1;
    st.update("flashcards", card.id, { box, due: U.iso(U.addDays(new Date(), GAPS[box])) });
    view.idx++;
    view.flipped = false;
    SH.render();
  };
})();
