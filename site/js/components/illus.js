// White City line drawings, each about the module it sits in:
// my day = a café table on Rothschild, the calendar = a Bauhaus facade whose
// windows are a month, tasks = a kiosk with a checklist board, announcements =
// the round poster column, courses = a bike with books, the timer = the Jaffa
// clock, flashcards = cards pinned on a balcony laundry line, and more.
// Every color comes from CSS variables; a course's color arrives as --cc.
(function () {
  const U = SH.utils;
  const INK = 'stroke="var(--ill-ink)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
  const THIN = 'stroke="var(--ill-ink)" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"';
  const svg = (vb, body, cls) => `<svg class="${cls}" viewBox="${vb}" aria-hidden="true" focusable="false">${body}</svg>`;

  // primitives
  const p = (d, fill = "none") => `<path d="${d}" fill="${fill}" ${INK}/>`;
  const t = (d, fill = "none") => `<path d="${d}" fill="${fill}" ${THIN}/>`;
  const c = (x, y, r, fill = "none") => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" ${INK}/>`;
  const dot = (x, y, r, fill) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`;
  const box = (x, y, w, h, fill = "none", rx = 0) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" ${INK}/>`;
  const tbox = (x, y, w, h, fill = "none", rx = 0) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" ${THIN}/>`;
  const ell = (x, y, rx, ry, fill = "none") => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}" ${INK}/>`;
  const C = {
    paper: "var(--ill-paper)",
    sun: "var(--ill-sun)",
    sea: "var(--ill-sea)",
    leaf: "var(--ill-leaf)",
    coral: "var(--ill-coral)",
    cc: "var(--ill-c)",
    ink: "var(--ill-ink)",
  };
  const ground = (y = 88) => p(`M4 ${y}H156`);
  const sun = (x, y, r = 9) => dot(x, y, r, C.sun);
  const birds = (x, y) => t(`M${x} ${y}l4 3 4-3M${x + 12} ${y - 6}l3 2 3-2`);
  const fronds = (x, y, s = 1) =>
    `<path d="M${x} ${y}c${-8 * s}-6 ${-18 * s}-4 ${-22 * s} 2M${x} ${y}c${6 * s}-8 ${16 * s}-8 ${20 * s}-2M${x} ${y}c${-1 * s}-9 ${3 * s}-15 ${9 * s}-17M${x} ${y}c${-9 * s} 0 ${-14 * s} 6 ${-15 * s} 12M${x} ${y}c${9 * s} 1 ${13 * s} 6 ${14 * s} 12" fill="none" stroke="var(--ill-leaf)" stroke-width="2.8" stroke-linecap="round"/>`;
  const palmTree = (x, base, h) => p(`M${x} ${base}c-2-${h * 0.45} 0-${h * 0.8} 4-${h}`) + fronds(x + 4, base - h);
  const ficus = (x, y, s = 1) =>
    c(x - 14 * s, y + 4 * s, 13 * s, C.leaf) + c(x + 14 * s, y + 6 * s, 12 * s, C.leaf) + c(x, y - 4 * s, 16 * s, C.leaf) +
    dot(x - 6 * s, y - 8 * s, 1.6, C.sun) + dot(x + 9 * s, y + 2 * s, 1.6, C.sun) + dot(x - 16 * s, y + 6 * s, 1.6, C.sun);
  const plant = (x, base) => box(x - 4, base - 7, 8, 7, C.coral, 1.5) + t(`M${x} ${base - 7}c-1-5-5-7-7-7M${x} ${base - 7}c1-5 5-7 7-7M${x} ${base - 7}v-8`);
  const wheel = (x, y, r) =>
    c(x, y, r) + dot(x, y, 1.6, C.ink) + t(`M${x - r * 0.7} ${y - r * 0.7}L${x + r * 0.7} ${y + r * 0.7}M${x + r * 0.7} ${y - r * 0.7}L${x - r * 0.7} ${y + r * 0.7}M${x} ${y - r}v${2 * r}M${x - r} ${y}h${2 * r}`);
  const checkmark = (x, y) => `<path d="M${x} ${y}l2.5 2.5 5-5.5" fill="none" stroke="var(--ill-c)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
  const lines = (x, y, w, n, gap = 5) => {
    let d = "";
    for (let i = 0; i < n; i++) d += `M${x} ${y + i * gap}h${i === n - 1 ? w * 0.6 : w}`;
    return t(d);
  };

  const SPOTS = {
    // my day: a café table under a ficus, coffee, a croissant and the day's planner
    cafe: () =>
      sun(140, 16) + birds(108, 18) +
      ficus(30, 26, 1.1) + p("M30 40c0 14-2 30 0 48") + t("M24 88c2-4 4-6 6-6s4 2 6 6") +
      ell(92, 60, 36, 6, C.paper) + p("M92 66v18M80 88h24") +
      // the planner, open
      p("M64 56l14-4 14 4-14 4z", C.paper) + t("M78 52v8M68 55.5h7M81 55.5h7") +
      // coffee with saucer and steam
      ell(108, 58.5, 9, 2.2, C.paper) + p("M101 46h14l-1.5 11h-11z", C.cc) + p("M115 49a3.5 3.5 0 010 6") +
      t("M105 42c-2-3 2-5 0-8M110 42c-2-3 2-5 0-8") +
      // croissant
      p("M118 56c1-5 8-7 13-3c-3 0-6 2-7 4z", C.sun) +
      // bistro chair
      p("M140 88l2-22h10l2 22M142 74h12M144 66c0-8 8-8 8 0"),

    // calendar: a Bauhaus facade whose windows read as a month
    calendar: () =>
      sun(140, 16) +
      box(26, 20, 92, 68, C.paper) + p("M22 20h100") +
      t("M30 26h84") +
      // ribbon balconies
      [36, 54, 72].map((y) => box(16, y, 48, 8, C.paper, 4) + t(`M22 ${y}v8M34 ${y}v8M46 ${y}v8M58 ${y}v8`)).join("") +
      // the month: a grid of windows, three booked, one is today
      (() => {
        let s = "";
        const marks = { "1-0": C.cc, "3-1": C.cc, "0-2": C.cc, "2-1": C.sun };
        for (let r = 0; r < 3; r++)
          for (let q = 0; q < 4; q++) s += tbox(70 + q * 11, 33 + r * 18, 8, 10, marks[`${q}-${r}`] || "none", 1);
        return s;
      })() +
      plant(30, 36) + plant(52, 54) +
      box(76, 76, 14, 12, C.sea) +
      palmTree(136, 88, 40) +
      ground(),

    // tasks: the kiosk, with a sandwich board turned to-do list
    tasks: () =>
      sun(20, 16) +
      p("M40 32l26-16 26 16z", C.cc) + t("M66 16v-6M62 10h8") +
      box(44, 32, 44, 42, C.paper) +
      p("M44 32v6q5.5 6 11 0q5.5 6 11 0q5.5 6 11 0q5.5 6 11 0v-6", C.sun) +
      box(51, 46, 30, 12, C.sea, 2) + t("M51 52h30") +
      p("M44 74h44M48 74v14M84 74v14") +
      // the board: three items, two done
      p("M104 88l6-44h26l6 44M110 44l-6 44M136 44l6 44", "none") +
      box(108, 46, 30, 30, C.paper, 2) +
      tbox(112, 51, 5, 5, "none", 1) + checkmark(111.5, 53.5) + t("M120 53.5h14") +
      tbox(112, 60, 5, 5, "none", 1) + checkmark(111.5, 62.5) + t("M120 62.5h12") +
      tbox(112, 69, 5, 5, "none", 1) + t("M120 71.5h10") +
      ground(),

    // announcements: the round Tel Aviv poster column
    column: () =>
      sun(140, 16) + birds(116, 22) +
      ficus(28, 34, 0.9) + p("M28 46v42") +
      // dome and finial
      p("M60 26q20-14 40 0z", C.cc) + p("M80 16v-6") + dot(80, 9, 2.2, C.ink) +
      ell(80, 26, 22, 3.5, C.paper) +
      p("M60 26v58M100 26v58") +
      ell(80, 84, 22, 3.5, C.paper) +
      // posters wrapped around the column
      p("M62 32h16v22h-16", C.sun) + t("M65 38h10M65 42h8M65 46h10") +
      p("M80 32h18v16h-18z", C.coral) + t("M83 37h12M83 41h9") +
      p("M62 58h20v20h-20", C.sea) + c(72, 66, 4, C.paper) +
      p("M84 52h14v26h-14z", C.paper) + t("M87 57h8M87 61h8M87 65h6M87 69h8") +
      ground(),

    // my courses: a bike with books in the basket
    courses: () =>
      sun(20, 18) + birds(36, 28) +
      wheel(44, 70, 16) + wheel(114, 70, 16) +
      p("M44 70l20-28h34l16 28M64 42l14 28H44M98 42L78 70", "none") +
      p("M56 36h14M96 42l4-10h8") +
      // basket with books and a plant
      box(102, 36, 24, 14, C.paper, 2) + t("M106 36v14M112 36v14M118 36v14M102 43h24") +
      box(104, 24, 6, 12, C.cc, 1) + box(110, 26, 6, 10, C.sun, 1) + box(116, 22, 6, 14, C.coral, 1) +
      t("M124 24c0-4 3-6 6-6M124 24c-1-4-4-6-7-5") +
      ground(),

    // grades: the lifeguard tower flying a ribbon with a star
    grades: () =>
      sun(24, 18) +
      p("M0 76q10-5 20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0V100H0z", C.sea) +
      p("M58 86l8-38M98 86l-8-38M62 70h32M60 78h36") +
      box(58, 30, 40, 20, C.paper, 2) + box(64, 35, 12, 9, C.sea, 1) + box(80, 35, 12, 9, C.sea, 1) +
      p("M54 30l24-14 24 14z", C.cc) +
      p("M78 16V2") + p("M78 3l20 4-20 5z", C.sun) + dot(86, 7, 1.8, C.ink) +
      t("M112 72q6-4 12 0M128 80q6-4 12 0"),

    // timer: the Jaffa clock tower
    timer: () =>
      sun(140, 16) +
      box(12, 60, 46, 28, C.paper) + box(102, 60, 46, 28, C.paper) +
      t("M20 88v-10a5 5 0 0110 0v10M38 88v-10a5 5 0 0110 0v10M110 88v-10a5 5 0 0110 0v10M128 88v-10a5 5 0 0110 0v10") +
      box(62, 30, 36, 58, C.paper) + box(58, 24, 44, 7, C.cc) +
      p("M66 24q14-20 28 0", C.paper) + p("M80 8v-4") +
      c(80, 46, 10, C.sun) +
      t("M80 37.5v2M80 52.5v2M71.5 46h2M86.5 46h2") + p("M80 46v-6M80 46h5") +
      p("M73 88V76a7 7 0 0114 0v12", C.sea) +
      t("M62 62h36M62 70h36"),

    // summaries: an open notebook on the café table, with glasses and coffee
    notes: () =>
      sun(140, 14) +
      ell(80, 72, 64, 8, C.paper) + p("M80 80v8") +
      p("M80 50c-12-6-26-6-38-1v20c12-5 26-5 38 1z", C.paper) +
      p("M80 50c12-6 26-6 38-1v20c-12-5-26-5-38 1z", C.paper) +
      p("M80 50v20") +
      t("M48 56c9-2 18-2 26 0M48 61c9-2 18-2 26 0M86 56c9-2 18-2 26 0M86 61c9-2 18-2 22 0") +
      c(62, 42, 5) + c(76, 42, 5) + p("M67 42h4") +
      p("M126 52h12l-1.5 10h-9z", C.cc) + t("M130 48c-2-3 2-4 0-7"),

    // exams: the lifeguard on watch, binoculars and the warning flag
    exams: () =>
      sun(22, 16) +
      p("M0 74q10-5 20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0V100H0z", C.sea) +
      p("M64 86l6-34M96 86l-6-34M66 70h28") +
      box(62, 34, 36, 18, C.paper, 2) + p("M58 34l22-12 22 12z", C.cc) +
      c(76, 42, 3.4, C.ink) + c(84, 42, 3.4, C.ink) +
      p("M110 86V30") + p("M110 31l18 6-18 6z", C.coral) +
      t("M30 84q6-4 12 0M130 82q6-4 12 0"),

    // flashcards: cards pinned on a balcony laundry line
    cards: () =>
      sun(140, 14) +
      box(14, 58, 132, 10, C.paper, 5) + p("M20 68v20M140 68v20") +
      p("M20 26v32M140 26v32") +
      p("M20 30q60 14 120 0") +
      [[34, 33, C.paper], [56, 37, C.sun], [80, 38.5, C.paper], [104, 37, C.cc], [126, 33, C.paper]]
        .map(([x, y, f]) => box(x - 8, y + 2, 16, 18, f, 1.5) + box(x - 1.5, y - 1, 3, 5, C.ink) + t(`M${x - 5} ${y + 9}h10M${x - 5} ${y + 13}h7`))
        .join("") +
      ground(),

    // ask the course: two people talking at the kiosk counter
    ask: () =>
      p("M52 34l22-14 22 14z", C.cc) + box(56, 34, 36, 34, C.paper) +
      p("M56 34v5q4.5 5 9 0q4.5 5 9 0q4.5 5 9 0q4.5 5 9 0v-5", C.sun) +
      p("M50 68h48M56 68v20M92 68v20") +
      c(30, 52, 6, C.paper) + p("M22 88v-20a8 8 0 0116 0v20", C.sea) +
      c(118, 52, 6, C.paper) + p("M110 88v-20a8 8 0 0116 0v20", C.coral) +
      box(8, 14, 34, 18, C.paper, 9) + t("M16 32l-2 6 8-6M15 21h20M15 26h14") +
      box(106, 12, 40, 20, C.paper, 10) + t("M132 32l4 6-10-6M114 20h24M114 25h16") +
      ground(),

    // enrichment: the old Jaffa port, a sailboat and the lighthouse
    sea: () =>
      sun(32, 22, 12) + birds(56, 18) +
      p("M0 70q10-5 20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0V100H0z", C.sea) +
      t("M10 84q6-4 12 0M60 88q6-4 12 0M110 84q6-4 12 0") +
      p("M58 68h40l-6 8h-28z", C.paper) + p("M78 68V30") +
      p("M80 32l18 34H80z", C.paper) + p("M76 36L62 64h14z", C.cc) +
      box(124, 30, 12, 40, C.paper) + p("M122 30h16l-3-8h-10z", C.coral) + dot(130, 18, 3, C.sun) +
      t("M124 42h12M124 54h12"),

    // the weekly summary: the promenade, a bench, a street lamp, the sea
    promenade: () =>
      sun(130, 18, 11) +
      p("M0 54h160") +
      p("M0 54q10-4 20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0V66H0z", C.sea) +
      t("M0 66h160M0 74h160") +
      p("M30 88V36M24 36h12") + p("M24 36q6-8 12 0", C.sun) +
      p("M60 80h44M60 74h44M64 80v8M100 80v8M62 68v6M102 68v6") +
      palmTree(130, 88, 44) +
      ground(),
  };

  // small drawings for the four summary tiles (viewBox 80 x 50)
  const MINI = {
    open: () =>
      box(24, 6, 32, 40, C.paper, 3) + box(33, 3, 14, 6, C.paper, 2) +
      tbox(29, 15, 5, 5, "none", 1) + checkmark(28.5, 17.5) + t("M37 17.5h14") +
      tbox(29, 25, 5, 5, "none", 1) + checkmark(28.5, 27.5) + t("M37 27.5h12") +
      tbox(29, 35, 5, 5, "none", 1) + t("M37 37.5h10"),
    today: () =>
      ell(40, 44, 18, 3.5, C.paper) + p("M28 22h24l-2 20H30z", C.paper) + p("M52 26a5 5 0 010 10") +
      t("M35 16c-2-3 2-5 0-8M42 16c-2-3 2-5 0-8") + sun(62, 10, 5),
    late: () =>
      box(30, 10, 20, 38, C.paper) + p("M28 10h24") + p("M32 10q8-10 16 0", C.paper) +
      c(40, 24, 6, C.paper) + p("M40 24v-4M40 24h3") +
      dot(60, 18, 7, "var(--t-required)") + `<path d="M60 14v5" stroke="#fff" stroke-width="2" stroke-linecap="round"/>` + dot(60, 22, 1.2, "#fff"),
    week: () =>
      p("M30 12q10-8 20 0z", C.paper) + p("M30 12v32M50 12v32") + ell(40, 12, 10, 2, C.paper) + ell(40, 44, 10, 2, C.paper) +
      p("M31 18h10v12h-10", C.sun) + p("M42 18h7v8h-7z", C.paper) + p("M31 32h18v8H31z", C.paper),
  };

  // ---------- module drawings in the style of the course covers ----------
  // A soft pastel card, one dark line, flat blobs of orange, green and blue,
  // and simple people. Fixed colors: these are small paintings, the same in both themes.
  const K = {
    line: "#2d3243",
    orange: "#f2a764",
    green: "#a8cfa0",
    blue: "#8db6dc",
    sand: "#f8d9b8",
    skin: "#f3c9a8",
    paper: "#ffffff",
    peach: "#f8ebe1",
    mint: "#e3eedf",
    sky: "#e5edf5",
    stone: "#f4eeea",
  };
  const KL = `stroke="${K.line}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"`;
  const kp = (d, fill = "none") => `<path d="${d}" fill="${fill}" ${KL}/>`;
  const kr = (x, y, w, h, fill = "none", rx = 3, extra = "") => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" ${KL} ${extra}/>`;
  const kc = (x, y, r, fill = "none") => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" ${KL}/>`;
  const blob = (x, y, rx, ry, fill, rot = 0) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}" transform="rotate(${rot} ${x} ${y})"/>`;
  const card = (fill) => `<rect width="160" height="100" rx="12" fill="${fill}"/>`;
  const kground = (y = 88) => kp(`M10 ${y}H150`);
  const head = (x, y, hair = K.line) => kc(x, y, 5.5, K.skin) + `<path d="M${x - 5.6} ${y - 0.5}a5.6 5.6 0 0 1 11.2 0c-2.4-2.6-8.6-2.6-11.2 0z" fill="${hair}"/>`;
  const stand = (x, base, shirt, pants = K.line) =>
    head(x, base - 50) +
    `<path d="M${x - 4} ${base - 25}l-1 25M${x + 4} ${base - 25}l1 25" stroke="${pants}" stroke-width="4" stroke-linecap="round"/>` +
    kp(`M${x - 7.5} ${base - 23}q0-17 7.5-20q7.5 3 7.5 20z`, shirt);
  // seated: dir = 1 faces left (knees to the left), -1 faces right
  const sit = (x, seat, shirt, pants = K.line, dir = 1) =>
    head(x, seat - 31) +
    `<path d="M${x} ${seat}h${-14 * dir}v14" fill="none" stroke="${pants}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>` +
    kp(`M${x - 7} ${seat + 1}q-1-17 7-20q8 3 7 20z`, shirt);
  const kplant = (x, base) =>
    kp(`M${x - 6} ${base}h12l-2-11h-8z`, K.orange) +
    blob(x - 6, base - 18, 5, 9, K.green, -25) + blob(x + 6, base - 19, 5, 9, K.green, 25) + blob(x, base - 24, 4.5, 9, K.green, 0) +
    kp(`M${x} ${base - 11}v-16M${x} ${base - 15}l-6-6M${x} ${base - 17}l6-6`);
  const sunBlob = (x, y, r = 11) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${K.orange}"/>`;
  const tick = (x, y, c = "#5a9e64") => `<path d="M${x} ${y}l3 3 6-6.5" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;

  Object.assign(SPOTS, {
    // my day: a morning at the café table, laptop and coffee
    cafe: () =>
      card(K.peach) + sunBlob(132, 22) + blob(34, 60, 26, 22, K.green) + kplant(30, 88) +
      kp("M58 68h56M86 68v20M76 88h20") +
      kp("M64 68l4-15h20l-3 15z", "#dfe6ef") + kc(76, 61, 1.4, K.line) +
      kp("M98 60h9l-1 8h-7z", K.paper) + kp("M100 55c-1.5-2 1.5-3 0-5M104 55c-1.5-2 1.5-3 0-5") +
      sit(128, 70, K.blue, K.line, 1) + kp("M122 70h14M136 70v18M122 70v18M136 70V50") +
      kground(),

    // calendar: a big wall calendar, one day ringed, another done
    calendar: () =>
      card(K.sky) + sunBlob(128, 20, 9) + blob(30, 70, 20, 16, K.green) +
      kr(34, 16, 74, 64, K.paper, 7) + `<path d="M34 23a7 7 0 0 1 7-7h60a7 7 0 0 1 7 7v7H34z" fill="${K.orange}" ${KL}/>` +
      kp("M50 12v8M92 12v8") +
      (() => {
        let s = "";
        for (let r = 0; r < 4; r++) for (let q = 0; q < 6; q++) s += `<rect x="${40 + q * 11}" y="${36 + r * 10}" width="7" height="6" rx="1.5" fill="${K.sky}"/>`;
        return s;
      })() +
      kc(73.5, 49, 6.5) + `<rect x="70" y="46" width="7" height="6" rx="1.5" fill="${K.blue}"/>` + tick(52, 59) +
      stand(128, 88, K.green) + kp("M122 50l-12-6") +
      kground(),

    // tasks: a clipboard checklist and a pencil
    tasks: () =>
      card(K.mint) + blob(116, 40, 26, 24, K.green) + sunBlob(26, 22, 8) +
      kr(46, 14, 58, 72, K.paper, 6) + kr(62, 9, 26, 10, K.blue, 4) +
      [26, 40, 54, 68].map((y, i) => kr(54, y, 8, 8, i < 2 ? "#e8f3e5" : K.paper, 2) + (i < 2 ? tick(55.5, y + 4) : "") + kp(`M68 ${y + 4}h${i === 3 ? 20 : 28}`)).join("") +
      `<g transform="rotate(35 122 60)">${kr(116, 30, 10, 46, K.orange, 2)}${kp("M116 76l5 10 5-10z", K.sand)}${kr(116, 26, 10, 6, "#e98c8c", 2)}</g>` +
      kground(),

    // announcements: a notice board with pinned notes and a megaphone
    column: () =>
      card(K.stone) + sunBlob(136, 20, 9) +
      kr(22, 14, 84, 58, "#e8cfaa", 5) + kp("M34 72v16M94 72v16") +
      `<g transform="rotate(-4 42 32)">${kr(30, 22, 24, 20, K.paper, 2)}${kp("M34 30h16M34 35h11")}</g>` +
      `<g transform="rotate(3 72 30)">${kr(60, 20, 24, 18, K.blue, 2)}</g>` +
      `<g transform="rotate(2 46 56)">${kr(34, 46, 24, 20, K.green, 2)}</g>` +
      `<g transform="rotate(-3 82 56)">${kr(68, 44, 28, 22, K.paper, 2)}${kp("M72 52h18M72 57h13M72 62h16")}</g>` +
      [42, 72, 46, 82].map((x, i) => `<circle cx="${x}" cy="${[22, 21, 47, 45][i]}" r="2" fill="#d9534f"/>`).join("") +
      kp("M114 46l18-10v26l-18-10z", K.orange) + kr(108, 44, 7, 8, K.paper, 2) +
      kp("M138 42q5 6 0 12M143 38q8 10 0 20") +
      kground(),

    // my courses: a stack of books under a graduation cap
    courses: () =>
      card(K.sky) + sunBlob(130, 22, 9) + blob(44, 66, 28, 18, K.green) +
      kr(52, 70, 56, 12, K.blue, 3) + kr(56, 58, 50, 12, K.orange, 3) + kr(50, 46, 54, 12, K.paper, 3) +
      kp("M58 52h40M60 76h40") +
      kp("M78 22l26 9-26 9-26-9z", K.line) + kp("M64 35v7q14 7 28 0v-7") + kp("M104 31v12") + `<circle cx="104" cy="45" r="2.4" fill="${K.orange}"/>` +
      kplant(128, 88) +
      kground(),

    // summaries: an open notebook, a pen, glasses and coffee
    notes: () =>
      card(K.peach) + blob(80, 58, 54, 24, K.sand) + sunBlob(136, 18, 8) +
      kp("M80 36c-12-6-28-6-40-1v40c12-5 28-5 40 1z", K.paper) +
      kp("M80 36c12-6 28-6 40-1v40c-12-5-28-5-40 1z", K.paper) + kp("M80 36v40") +
      kp("M46 46c9-3 18-3 27 0M46 53c9-3 18-3 27 0M46 60c9-3 14-3 20 0M87 46c9-3 18-3 27 0M87 53c9-3 18-3 22 0") +
      `<g transform="rotate(-30 112 70)">${kr(108, 52, 6, 30, K.blue, 2)}${kp("M108 82l3 6 3-6z", K.sand)}</g>` +
      kc(30, 70, 5) + kc(44, 70, 5) + kp("M35 70h4") +
      kp("M126 64h12l-1.5 12h-9z", K.paper) + kp("M138 67a3.5 3.5 0 010 6"),

    // exams: a graded paper, a pencil and an hourglass
    exams: () =>
      card(K.sky) + blob(44, 52, 34, 30, K.green) +
      `<g transform="rotate(-4 64 50)">${kr(40, 14, 50, 68, K.paper, 4)}${kp("M48 26h26M48 34h22")}${[46, 56, 66].map((y) => tick(48, y) + kp(`M60 ${y}h20`)).join("")}</g>` +
      `<circle cx="84" cy="22" r="9" fill="none" stroke="#d9534f" stroke-width="2"/><text x="84" y="26.5" text-anchor="middle" font-family="sans-serif" font-size="12" font-weight="700" fill="#d9534f">A</text>` +
      kp("M112 18h24M112 82h24") + kp("M115 18c0 16 18 16 18 32s-18 16-18 32M133 18c0 16-18 16-18 32s18 16 18 32") +
      kp("M118 76q6-8 12 0z", K.orange) + kp("M120 30q4 4 8 0z", K.orange) +
      kground(),

    // flashcards: a fanned stack with a question and a light bulb
    cards: () =>
      card(K.mint) + sunBlob(132, 20, 8) + blob(80, 60, 48, 26, K.green) +
      `<g transform="rotate(-14 62 52)">${kr(42, 24, 38, 54, K.blue, 5)}</g>` +
      `<g transform="rotate(10 98 52)">${kr(80, 24, 38, 54, K.orange, 5)}</g>` +
      kr(60, 18, 40, 58, K.paper, 5) +
      `<text x="80" y="55" text-anchor="middle" font-family="sans-serif" font-size="26" font-weight="700" fill="${K.line}">?</text>` +
      kp("M126 52a10 10 0 1 1 10 0v6h-10z", "#f8d58a") + kp("M127 62h8M128 66h6"),

    // ask the course: two people talking on a bench
    ask: () =>
      card(K.stone) + blob(80, 52, 50, 30, K.green) + sunBlob(26, 20, 8) +
      kp("M36 70h88M42 70v18M118 70v18M36 62h88") +
      sit(62, 70, K.orange, K.line, -1) + sit(98, 70, K.blue, K.line, 1) +
      kr(26, 14, 30, 18, K.paper, 9) + kp("M36 32l-2 6 7-6") + [36, 41, 46].map((x) => `<circle cx="${x}" cy="23" r="1.6" fill="${K.line}"/>`).join("") +
      kr(104, 12, 34, 20, K.paper, 10) + kp("M124 32l4 6-9-6M111 20h20M111 25h12") +
      kground(),

    // enrichment: reading on a pile of books under a bright idea
    sea: () =>
      card(K.sky) + blob(48, 60, 36, 26, K.green) +
      kr(30, 72, 52, 10, K.orange, 3) + kr(34, 62, 46, 10, K.paper, 3) +
      sit(60, 62, K.green, K.line, -1) + kr(66, 40, 14, 10, K.blue, 2) +
      kp("M110 44a14 14 0 1 1 14 0v8h-14z", "#f8d58a") + kp("M111 56h12M112 60h10") +
      kp("M117 14v-6M100 22l-5-4M134 22l5-4M96 36h-6M138 36h6") +
      kground(),

    // weekly summary: a week of days, most of them ticked
    promenade: () =>
      card(K.mint) + sunBlob(132, 20, 9) + blob(40, 64, 30, 20, K.green) +
      kr(18, 30, 124, 40, K.paper, 8) +
      [0, 1, 2, 3, 4, 5, 6].map((i) => {
        const x = 26 + i * 16.5;
        return kr(x, 40, 12, 22, i < 4 ? "#e8f3e5" : K.sky, 3) + (i < 4 ? tick(x + 1.5, 51) : "");
      }).join("") +
      kground(84),

    // grades: a trophy and a rising bar chart
    grades: () =>
      card(K.peach) + blob(110, 58, 38, 26, K.sand) + sunBlob(26, 20, 8) +
      [[92, 22], [108, 34], [124, 46]].map(([x, hgt]) => kr(x, 82 - hgt, 12, hgt, K.blue, 2)).join("") +
      kp("M40 24h32v12a16 16 0 0 1-32 0z", K.orange) + kp("M40 28h-6a6 6 0 0 0 6 10M72 28h6a6 6 0 0 1-6 10") +
      kp("M56 52v12M46 64h20v10H46z", K.paper) +
      kp("M56 30l2 4 4.5.5-3.2 3 1 4.5-4.3-2.3-4.3 2.3 1-4.5-3.2-3 4.5-.5z", "#fff6d8") +
      kground(),

    // timer: a stopwatch half way round, and an hourglass
    timer: () =>
      card(K.sky) + blob(70, 56, 40, 28, K.green) +
      kc(70, 52, 28, K.paper) + kp("M70 52V30a22 22 0 0 1 19 33z", K.orange) +
      kp("M64 18h12M70 18v6M92 28l5-5") + kc(70, 52, 2.5, K.line) + kp("M70 52l10-10") +
      kp("M114 30h20M114 78h20") + kp("M117 30c0 14 14 14 14 24s-14 10-14 24M131 30c0 14-14 14-14 24s14 10 14 24") +
      kp("M119 74q5-6 10 0z", K.orange) +
      kground(),
  });

  const NAMES = Object.keys(SPOTS);
  U.ILL_NAMES = NAMES;

  U.ill = (name, cls = "ill") => svg("0 0 160 100", (SPOTS[name] || SPOTS.calendar)(), cls);
  U.mini = (name) => svg("0 0 80 50", (MINI[name] || MINI.open)(), "ill bicon");

  // the same course always gets the same drawing (takes a course or its id)
  U.seed = (id) => {
    let h = 0;
    for (const ch of String(id || "")) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return h;
  };
  const COVER_SET = ["calendar", "column", "courses", "timer", "sea", "promenade", "cafe", "cards"];
  U.illFor = (course) => COVER_SET[U.seed(course && typeof course === "object" ? course.id : course) % COVER_SET.length];

  // the season still tints the sky and the sun, by date
  U.SEASONS = { spring: "אביב", summer: "קיץ", autumn: "סתיו", winter: "חורף" };
  U.season = () => {
    const m = new Date().getMonth();
    if (m >= 2 && m <= 4) return "spring";
    if (m >= 5 && m <= 7) return "summer";
    if (m >= 8 && m <= 10) return "autumn";
    return "winter";
  };

  // ---------- the hero skyline: the White City, in detail ----------
  function block(x, w, h, floors, tone) {
    const top = 200 - h;
    let s = `<rect x="${x}" y="${top}" width="${w}" height="${h}" fill="var(--ill-paper)" ${INK}/>`;
    s += t(`M${x + 4} ${top + 6}h${w - 8}`);
    const gap = h / (floors + 1);
    for (let i = 1; i <= floors; i++) {
      const y = top + gap * i - 5;
      if (i % 2 === 1) {
        s += `<rect x="${x - 8}" y="${y}" width="${w * 0.62}" height="9" rx="4.5" fill="var(--ill-paper)" ${INK}/>`;
        s += plant(x + w * 0.1, y);
      } else {
        for (let k = 0; k < 3; k++) s += tbox(x + 8 + k * 14, y - 1, 9, 11, "none", 1);
      }
      s += `<rect x="${x + w * 0.7}" y="${y - 2}" width="${w * 0.14}" height="12" fill="${tone}" ${THIN}/>`;
    }
    return s + `<path d="M${x - 4} ${top}h${w + 8}" fill="none" ${INK}/>`;
  }
  function tower(x) {
    let s = `<rect x="${x}" y="40" width="54" height="160" fill="var(--ill-paper)" ${INK}/>`;
    for (let y = 52; y < 196; y += 12) s += `<path d="M${x + 6} ${y}h42" fill="none" stroke="var(--ill-ink)" stroke-width="1" opacity=".45"/>`;
    return s + `<rect x="${x + 18}" y="28" width="18" height="12" fill="var(--ill-c)" ${INK}/>` + p(`M${x + 27} 28v-10`);
  }
  const posterColumn = (x) =>
    p(`M${x} 170q12-9 24 0z`, C.cc) + p(`M${x} 170v30M${x + 24} 170v30`) +
    p(`M${x + 1} 176h10v14h-10`, C.sun) + p(`M${x + 13} 178h10v10h-10z`, C.coral);

  U.skyline = () => {
    let s = `<circle cx="210" cy="78" r="46" fill="var(--ill-sun)"/>`;
    s += t("M150 60l6 4 6-4M180 44l5 3 5-3M260 50l6 4 6-4");
    s += `<path d="M0 214q15-8 30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0V240H0z" fill="var(--ill-sea)"/>`;
    s += t("M30 226q8-4 16 0M120 230q8-4 16 0M220 226q8-4 16 0");
    s += tower(560);
    s += block(350, 120, 118, 4, "var(--ill-coral)");
    s += `<g transform="translate(486 200)">${palmTree(0, 0, 120)}</g>`;
    s += block(640, 150, 92, 3, "var(--ill-c)");
    s += block(820, 96, 132, 5, "var(--ill-sea)");
    s += `<g transform="translate(928 200)">${palmTree(0, 0, 96)}</g>`;
    s += block(980, 130, 104, 4, "var(--ill-sun)");
    s += `<g transform="translate(1130 128)"><rect x="-6" y="8" width="32" height="64" fill="var(--ill-paper)" ${INK}/><rect x="-10" y="2" width="40" height="8" fill="var(--ill-c)" ${INK}/><path d="M-2 2q12-18 24 0" fill="var(--ill-paper)" ${INK}/><circle cx="10" cy="24" r="7" fill="var(--ill-sun)" ${INK}/><path d="M10 24v-4M10 24h3" fill="none" ${THIN}/><path d="M4 72V60a6 6 0 0112 0v12" fill="var(--ill-sea)" ${INK}/></g>`;
    s += `<g transform="translate(312 168)">${wheel(0, 22, 11)}${wheel(44, 22, 11)}<path d="M0 22l13-18h22l9 18M13 4l9 18H0M35 4L22 22" fill="none" ${INK}/></g>`;
    s += posterColumn(790);
    s += `<path d="M300 200H1200" fill="none" ${INK}/>`;
    return `<svg class="skyline" viewBox="0 0 1200 240" preserveAspectRatio="xMaxYMax slice" aria-hidden="true" focusable="false">${s}</svg>`;
  };

  // a wide course cover: two drawings side by side in the course's color
  U.cover = (course) => {
    const a = U.illFor(course);
    const b = COVER_SET[(COVER_SET.indexOf(a) + 3) % COVER_SET.length];
    const s =
      `<g transform="translate(70 8) scale(1.5)">${SPOTS[a]()}</g>` +
      `<g transform="translate(330 8) scale(1.5)">${SPOTS[b]()}</g>`;
    return `<svg class="cover" viewBox="0 0 640 160" preserveAspectRatio="xMidYMax meet" aria-hidden="true" focusable="false">${s}</svg>`;
  };

  // ---------- painted course covers, each about its subject ----------
  // [picture, background tint behind it]
  const PICS = {
    stats: ["img/course-stats.png", "#d5e7f3"],
    neuron: ["img/course-bio.png", "#e0e8db"],
    people: ["img/course-socpsy.png", "#f1e7db"],
    macro: ["img/course-macro.png", "#dce8f4"],
    org: ["img/course-org.png", "#f9e2d0"],
  };
  const SUBJECT = { mvstats: "stats", stats: "stats", bio: "neuron", socpsy: "people", macro: "macro", orgmgmt: "org" };
  const SUBJECT_WORDS = [
    [/סטטיסט/, "stats"],
    [/ביולוג|מוח|נוירו/, "neuron"],
    [/פסיכולוג/, "people"],
    [/כלכל|מאקרו|מיקרו/, "macro"],
    [/ניהול|ארגונ/, "org"],
  ];
  // the painted cover for a course, or null when there is none
  U.coursePic = (c) => {
    if (!c || c.image) return null;
    const hit = SUBJECT_WORDS.find(([re]) => re.test(`${c.name || ""} ${c.short || ""}`));
    const p = PICS[SUBJECT[c.slug] || (hit && hit[1])];
    return p ? { src: p[0], bg: p[1] } : null;
  };

  // ---------- the logo: a White City balcony block with the sun ----------
  U.logo = (size = 36) =>
    `<svg class="logo-mark" width="${size}" height="${size}" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <rect x="1" y="1" width="46" height="46" rx="11" fill="var(--logo-bg)"/>
      <circle cx="35" cy="13" r="6" fill="var(--ill-sun)"/>
      <rect x="9" y="17" width="22" height="6" rx="3" fill="var(--logo-fg)"/>
      <rect x="9" y="26" width="26" height="6" rx="3" fill="var(--logo-fg)"/>
      <rect x="9" y="35" width="30" height="6" rx="3" fill="var(--logo-fg)"/>
    </svg>`;

  // put a drawing into the first card header of a component's markup
  // minimalist module pictures made in Figma; the line drawings stay as a fallback
  const MODULE_PICS = ["cafe", "calendar", "tasks", "column", "courses", "notes", "exams", "cards", "ask", "sea", "promenade", "grades", "timer"];
  U.spot = (name, cls = "ill spot") =>
    MODULE_PICS.includes(name)
      ? `<img class="${cls} spot-pic" src="img/m-${name}.png" alt="" width="480" height="300" loading="lazy">`
      : U.ill(name, cls);
  U.withIll = (html, name) => String(html).replace('class="card-h">', `class="card-h has-ill">${U.spot(name, "ill spot")}`);
})();
