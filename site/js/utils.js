// Shared helpers: escaping, dates, icons, toasts, markdown, action registry.
window.SH = { ui: {}, pages: {}, actions: {}, forms: {}, view: {} };

(function () {
  const U = (SH.utils = {});

  U.$ = (sel) => document.querySelector(sel);

  U.esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[c]);

  U.uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

  // ---------- dates (all local time) ----------
  U.DAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
  U.DSHORT = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];

  const pad = (n) => String(n).padStart(2, "0");
  U.pad = pad;

  U.iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  U.parse = (s) => {
    if (!s) return null;
    const [y, m, d] = s.slice(0, 10).split("-").map(Number);
    return new Date(y, m - 1, d);
  };

  U.today = () => U.iso(new Date());
  U.sod = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  U.addDays = (d, n) => {
    const x = new Date(d);
    x.setDate(x.getDate() + n);
    return x;
  };

  U.dayDiff = (s) => Math.round((U.parse(s) - U.sod(new Date())) / 864e5);
  U.short = (s) => {
    const d = U.parse(s);
    return d ? `${d.getDate()}/${d.getMonth() + 1}` : "";
  };
  U.long = (s) => {
    const d = U.parse(s);
    return d ? `יום ${U.DAYS[d.getDay()]}, ${d.getDate()}/${d.getMonth() + 1}` : "";
  };
  U.toMin = (t) => {
    const [h, m] = String(t || "0:0").split(":").map(Number);
    return h * 60 + (m || 0);
  };
  U.fromMin = (m) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;

  U.relDue = (s) => {
    if (!s) return { t: "", c: "" };
    const n = U.dayDiff(s);
    if (n < 0) return { t: `באיחור ${-n === 1 ? "יום" : -n + " ימים"}`, c: "due-late" };
    if (n === 0) return { t: "היום", c: "due-soon" };
    if (n === 1) return { t: "מחר", c: "due-soon" };
    if (n < 7) return { t: `עוד ${n} ימים · ${U.short(s)}`, c: "" };
    return { t: U.short(s), c: "" };
  };

  U.countdown = (date, time) => {
    const [h, m] = (time || "09:00").split(":").map(Number);
    const t = U.parse(date);
    t.setHours(h, m);
    const ms = t - new Date();
    if (ms < 0) return null;
    const days = Math.floor(ms / 864e5);
    if (days >= 1) return { n: days, u: days === 1 ? "יום" : "ימים" };
    return { n: Math.max(1, Math.round(ms / 36e5)), u: "שעות" };
  };

  U.greeting = () => {
    const h = new Date().getHours();
    if (h < 5) return "לילה טוב";
    if (h < 12) return "בוקר טוב";
    if (h < 17) return "צהריים טובים";
    if (h < 21) return "ערב טוב";
    return "לילה טוב";
  };

  U.ago = (ts) => {
    if (!ts) return "";
    const d = new Date(ts);
    const today = U.today();
    const key = U.iso(d);
    const hm = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    if (key === today) return `היום ${hm}`;
    if (key === U.iso(U.addDays(new Date(), -1))) return `אתמול ${hm}`;
    return `${U.short(key)} ${hm}`;
  };

  // ---------- icons ----------
  const ic = (p) => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`;
  U.I = {
    home: ic('<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>'),
    plus: ic('<path d="M12 5v14M5 12h14"/>'),
    x: ic('<path d="M6 6l12 12M18 6L6 18"/>'),
    prev: ic('<path d="M9 6l6 6-6 6"/>'),
    next: ic('<path d="M15 6l-6 6 6 6"/>'),
    cal: ic('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'),
    book: ic('<path d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2z"/><path d="M4 19V5"/>'),
    check: ic('<path d="M4 12l5 5L20 6"/>'),
    bell: ic('<path d="M6 8a6 6 0 1112 0c0 7 3 8 3 8H3s3-1 3-8"/><path d="M10 20a2 2 0 004 0"/>'),
    search: ic('<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>'),
    ext: ic('<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5"/>'),
    mega: ic('<path d="M3 11v2a1 1 0 001 1h2l5 4V6L6 10H4a1 1 0 00-1 1z"/><path d="M15 9a4 4 0 010 6"/>'),
    grid: ic('<rect x="4" y="4" width="7" height="7" rx="1"/><rect x="13" y="4" width="7" height="7" rx="1"/><rect x="4" y="13" width="7" height="7" rx="1"/><rect x="13" y="13" width="7" height="7" rx="1"/>'),
    target: ic('<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/>'),
    video: ic('<rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10l5-3v10l-5-3"/>'),
    play: ic('<path d="M7 5l12 7-12 7z"/>'),
    link: ic('<path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1"/>'),
  };

  // ---------- toast ----------
  U.toast = (msg) => {
    const t = document.createElement("div");
    t.className = "toast";
    t.textContent = msg;
    U.$("#toasts").appendChild(t);
    setTimeout(() => t.remove(), 3400);
  };

  // ---------- markdown ----------
  U.md = (src) => {
    const raw = window.marked ? window.marked.parse(String(src || "")) : U.esc(src).replace(/\n/g, "<br>");
    return window.DOMPurify ? window.DOMPurify.sanitize(raw) : raw;
  };

  // ---------- course art: a glowing flow of the course's color ----------
  // Every course gets its own panel built from its color plus two
  // neighbouring hues. Positions come from a hash of the id, so a course
  // always looks the same. A course with an `image` field uses that instead.
  function hexToHsl(hex) {
    const m = String(hex || "").replace("#", "").match(/^([0-9a-f]{6})$/i);
    if (!m) return [232, 70, 62];
    const n = parseInt(m[1], 16);
    const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
      h *= 60;
    }
    return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
  }

  function hash(str) {
    let h = 2166136261;
    for (const ch of String(str)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
    return () => {
      h = Math.imul(h ^ (h >>> 15), 2246822507);
      h = Math.imul(h ^ (h >>> 13), 3266489909);
      return ((h ^= h >>> 16) >>> 0) / 4294967296;
    };
  }

  const hsl = (h, s, l, a) => `hsl(${((h % 360) + 360) % 360} ${s}% ${l}% / ${a})`;

  U.art = (colors, seed = "x") => {
    const list = (Array.isArray(colors) ? colors : [colors]).filter(Boolean);
    const [h, s] = hexToHsl(list[0]);
    const sat = Math.max(58, Math.min(92, s + 10));
    const tone = list.length > 1
      ? list.slice(0, 4).map((c) => { const [hh] = hexToHsl(c); return hh; })
      : [h, h + 42, h - 48, h + 160];
    const rnd = hash(seed);
    const p = () => Math.round(10 + rnd() * 80);
    const ang = Math.round(rnd() * 360);
    const layers = [
      `linear-gradient(${110 + Math.round(rnd() * 40)}deg, transparent 38%, hsl(0 0% 100% / .16) 47%, transparent 56%)`,
      `radial-gradient(55% 70% at ${p()}% ${p()}%, ${hsl(tone[0], sat, 62, 0.95)} 0%, transparent 62%)`,
      `radial-gradient(48% 62% at ${p()}% ${p()}%, ${hsl(tone[1], sat, 58, 0.85)} 0%, transparent 60%)`,
      `radial-gradient(42% 55% at ${p()}% ${p()}%, ${hsl(tone[2], sat, 52, 0.8)} 0%, transparent 60%)`,
      `conic-gradient(from ${ang}deg at ${p()}% ${p()}%, ${hsl(tone[0], sat, 40, 0.55)}, ${hsl(tone[3] ?? tone[1], sat, 45, 0.35)}, ${hsl(tone[2], sat, 38, 0.5)}, ${hsl(tone[0], sat, 40, 0.55)})`,
    ];
    return `background-color:var(--art-base);background-image:${layers.join(",")};`;
  };

  U.courseArt = (c) =>
    c && c.image
      ? `background-color:var(--art-base);background-image:url('${String(c.image).replace(/["'\\()\s]/g, "")}');background-size:cover;background-position:center;`
      : U.art(c ? c.color : null, c ? c.id : "x");

  // next weekly meeting of a course, from its lessons [{day, start}]
  U.nextLesson = (c) => {
    const ls = (c && c.lessons) || [];
    if (!ls.length) return null;
    const now = new Date();
    const nowMin = now.getDay() * 1440 + now.getHours() * 60 + now.getMinutes();
    let best = null;
    ls.forEach((l) => {
      if (l.day == null || !l.start) return;
      let t = +l.day * 1440 + U.toMin(l.start);
      if (t <= nowMin) t += 7 * 1440;
      if (!best || t < best.t) best = { t, l };
    });
    return best ? best.l : null;
  };

  // ---------- small helpers ----------
  U.byDate = (a, b) => String(a.date || "").localeCompare(String(b.date || ""));
  U.snippet = (text, q, len = 90) => {
    const s = String(text || "").replace(/\s+/g, " ");
    const i = s.toLowerCase().indexOf(q.toLowerCase());
    if (i < 0) return U.esc(s.slice(0, len));
    const a = Math.max(0, i - 35);
    const part = s.slice(a, a + len);
    const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    return (a ? "…" : "") + U.esc(part).replace(re, (m) => `<mark>${m}</mark>`) + "…";
  };
})();
