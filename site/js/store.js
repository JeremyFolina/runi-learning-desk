// Data layer: every read and write of the site goes through here.
// Live data comes from the artifact's db capability; without it the page
// shows a read-only notice and keeps working on whatever it has.
(function () {
  const U = SH.utils;

  const LISTS = [
    "courses",
    "tasks",
    "events",
    "summaries",
    "announcements",
    "flashcards",
    "enrichment",
    "weekly",
    "grades",
    "focus",
  ];

  const DOCS = {
    system: "system/status",
    config: "system/config",
    bannerPrefs: "prefs/banner",
    bellPrefs: "prefs/bell",
    boardPrefs: "prefs/board",
  };

  const S = (SH.state = {});
  LISTS.forEach((c) => (S[c] = []));
  Object.keys(DOCS).forEach((k) => (S[k] = {}));

  let db = null;
  const loaded = new Set();
  const queues = {};

  function errMsg(e) {
    if (e?.code === "quota_exceeded") return "אין מקום לעוד פריטים. מחק פריטים ישנים ונסה שוב.";
    if (e?.code === "invalid_argument") return "אין הרשאה לשנות את הנתונים כאן.";
    return "השמירה לא הצליחה. נסה שוב בעוד רגע.";
  }

  // one write at a time per document
  function queued(path, fn) {
    const prev = queues[path] || Promise.resolve();
    const next = prev.then(fn).catch((e) => U.toast(errMsg(e)));
    queues[path] = next;
    return next;
  }

  const store = (SH.store = {
    mode: "loading",

    async init(onChange) {
      try {
        db = window.claude?.use ? await window.claude.use("db") : null;
      } catch {
        db = null;
      }
      if (!db) {
        this.mode = "offline";
        onChange();
        return;
      }
      this.mode = "live";

      LISTS.forEach((c) => {
        db.collection(c).onSnapshot(
          (snap) => {
            S[c] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
            loaded.add(c);
            onChange();
          },
          () => {
            loaded.add(c);
            onChange();
          }
        );
      });

      Object.entries(DOCS).forEach(([key, path]) => {
        db.doc(path).onSnapshot(
          (d) => {
            S[key] = d.exists ? d.data() : {};
            onChange();
          },
          () => {}
        );
      });
    },

    ready() {
      return this.mode !== "loading" && (this.mode !== "live" || loaded.size >= LISTS.length);
    },

    canWrite() {
      return this.mode === "live";
    },

    add(coll, data) {
      if (!db) return U.toast("מצב קריאה בלבד: השינוי לא נשמר.");
      const ref = db.collection(coll).doc();
      return queued(ref.path, () => ref.set(data));
    },

    update(coll, id, data) {
      if (!db) return U.toast("מצב קריאה בלבד: השינוי לא נשמר.");
      const path = `${coll}/${id}`;
      return queued(path, () => db.doc(path).update(data));
    },

    remove(coll, id) {
      if (!db) return U.toast("מצב קריאה בלבד: השינוי לא נשמר.");
      const path = `${coll}/${id}`;
      return queued(path, () => db.doc(path).delete());
    },

    // full replace of a single document (prefs, grades rows)
    put(path, data) {
      if (!db) return;
      return queued(path, () => db.doc(path).set(data));
    },

    // transcripts and course materials are big, so they are read on demand
    async sources(courseId) {
      if (!db) return [];
      try {
        const snap = await db.collection("sources").where("courseId", "==", courseId).get();
        return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      } catch {
        return [];
      }
    },

    async allSources() {
      if (!db) return [];
      try {
        const snap = await db.collection("sources").limit(400).get();
        return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      } catch {
        return [];
      }
    },
  });

  // ---------- derived lookups ----------
  store.course = (id) => S.courses.find((c) => c.id === id);
  store.color = (id) => store.course(id)?.color || "var(--faint)";
  store.semesterCourses = () =>
    S.courses
      .filter((c) => c.kind !== "general")
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  store.generalCourses = () => S.courses.filter((c) => c.kind === "general");
  // labels and ids written once by the setup skill into system/config
  store.cfg = (key, fallback) => (S.config && S.config[key]) || fallback;
})();
