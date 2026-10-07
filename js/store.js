/* AR PERIO — store.js · Persistencia local + sesión + auth docente.
 *
 * Toda la actividad se guarda en el navegador (localStorage) con claves
 * prefijadas "arperio:". Los casos, desafíos, preguntas y radiografías creados
 * por el docente viven aquí y pueden exportarse/importarse como JSON.
 */

/* ------------------------------- Utilidades ------------------------------- */

const rid = () => Math.random().toString(36).slice(2, 10);

/** ¿Está activo Firebase (cuentas reales + reglas de seguridad)? Si no, todo es local. */
const _secure = () => !!(window.FB && FB.enabled);

function loadLS(key, def) {
  try {
    const raw = localStorage.getItem("arperio:" + key);
    return raw === null ? structuredClone(def) : JSON.parse(raw);
  } catch (e) {
    console.warn("AR PERIO: no se pudo leer", key, e);
    return structuredClone(def);
  }
}

function saveLS(key, val) {
  try {
    const json = JSON.stringify(val);
    localStorage.setItem("arperio:" + key, json);
    if (window.FB) FB.push(key, json);   // espejo en Firebase (si está activo)
    return true;
  } catch (e) {
    toast({
      title: "Almacenamiento lleno",
      description: "El navegador ha agotado el espacio local. Exporta tu contenido e elimina imágenes antiguas.",
      variant: "destructive",
    });
    return false;
  }
}

/** Bus de eventos sencillo para repintar vistas cuando cambian los datos. */
const Bus = {
  _subs: {},
  on(ev, fn) { (this._subs[ev] ??= []).push(fn); return () => this.off(ev, fn); },
  off(ev, fn) { this._subs[ev] = (this._subs[ev] || []).filter((f) => f !== fn); },
  emit(ev, data) { (this._subs[ev] || []).forEach((f) => { try { f(data); } catch (e) { console.error(e); } }); },
};

/* ------------------------------- Ajustes ---------------------------------- */

const Settings = {
  data: loadLS("settings", { teacherCode: "PERIO2025" }),
  reload() { this.data = loadLS("settings", { teacherCode: "PERIO2025" }); },
  save() { saveLS("settings", this.data); },
  setTeacherCode(code) { this.data.teacherCode = code; this.save(); },
};

/* --------------------- Cuentas de estudiante (docente) -------------------- */
/* El docente crea usuarios y contraseñas para sus estudiantes. Cada cuenta
 * vive en este navegador y su progreso (mediciones, quizzes, lecturas y
 * periodontograma) queda SEPARADO por usuario.
 * accounts = { list: [{ id, username, name, passHash, at, lastLogin }],
 *              requireLogin: bool } */

/** Hash de contraseña: SHA-256 si está disponible; fallback determinista si no. */
async function hashPass(pw) {
  const s = "arperio:" + String(pw);
  try {
    if (window.crypto && crypto.subtle && crypto.subtle.digest) {
      const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
      return "sha:" + [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
    }
  } catch (e) { /* contexto no seguro: usar fallback */ }
  let h1 = 0x811c9dc5, h2 = 0x01000193;
  for (let i = 0; i < s.length; i++) {
    h1 = Math.imul(h1 ^ s.charCodeAt(i), 16777619) >>> 0;
    h2 = (h2 + s.charCodeAt(i) * (i + 7)) >>> 0;
  }
  return "fnv:" + h1.toString(16) + h2.toString(16);
}

const Accounts = {
  data: loadLS("accounts", { list: [], requireLogin: false }),
  reload() { this.data = loadLS("accounts", { list: [], requireLogin: false }); },
  save() { saveLS("accounts", this.data); Bus.emit("accounts"); },
  all() { return this.data.list ?? []; },
  /* Con Firebase, un invitado no recibe la lista del curso: solo sabe si existen cuentas
   * (hasAccounts, que viene de la configuración pública) para decidir si muestra el login. */
  count() { return this.all().length || (this.data.hasAccounts ? 1 : 0); },
  byUsername(u) {
    const q = String(u ?? "").trim().toLowerCase();
    return this.all().find((a) => a.username.toLowerCase() === q) ?? null;
  },
  byId(id) { return this.all().find((a) => a.id === id) ?? null; },
  async add({ username, password, name }) {
    const user = String(username ?? "").trim();
    const nombre = String(name ?? "").trim();
    if (nombre.length < 2) return { error: "Escribe el nombre del estudiante." };
    if (!/^[a-zA-Z0-9._-]{3,20}$/.test(user)) return { error: "El usuario debe tener 3-20 caracteres (letras, números, . _ -)." };
    if (this.byUsername(user)) return { error: "Ese usuario ya existe. Elige otro." };
    const minPw = _secure() ? 6 : 4;   // Firebase Auth exige 6 como mínimo
    if (String(password ?? "").length < minPw) return { error: `La contraseña debe tener al menos ${minPw} caracteres.` };
    if (_secure()) {
      const r = await FB.createStudent({ username: user, name: nombre, password: String(password) });
      if (r.error) return r;
      if (!this.byId(r.acc.id)) { this.data.list = [...this.all(), r.acc]; this.save(); }
      return { acc: r.acc };
    }
    const acc = { id: "sa-" + rid(), username: user, name: nombre, passHash: await hashPass(password), at: Date.now(), lastLogin: null };
    this.data.list = [...this.all(), acc];
    this.save();
    return { acc };
  },
  async setPassword(id, password) {
    const minPw = _secure() ? 6 : 4;
    if (String(password ?? "").length < minPw) return { error: `La contraseña debe tener al menos ${minPw} caracteres.` };
    const acc = this.byId(id);
    if (!acc) return { error: "Cuenta no encontrada." };
    if (_secure()) return FB.resetStudentPassword(acc, String(password));
    acc.passHash = await hashPass(password);
    this.save();
    return { ok: true };
  },
  rename(id, name) {
    const acc = this.byId(id);
    if (!acc) return;
    acc.name = String(name ?? "").trim() || acc.name;
    this.save();
    if (_secure()) FB.updateStudent(id, { name: acc.name });
  },
  remove(id) {
    const gone = this.byId(id);
    this.data.list = this.all().filter((a) => a.id !== id);
    this.save();
    // Borra también el progreso asociado a esa cuenta
    try {
      localStorage.removeItem("arperio:student:" + id);
      localStorage.removeItem("arperio:perio:" + id);
    } catch (e) { console.warn(e); }
    if (_secure() && gone) FB.deleteStudent(gone);   // ficha, acceso y progreso en la nube
  },
  /** Con Firebase devuelve la cuenta si usuario+contraseña son válidos; null si no.
   *  Lanza un Error si el fallo es de red (no de credenciales). */
  async verify(username, password) {
    if (_secure()) {
      const acc = await FB.studentLogin(username, password);
      if (!acc) return null;
      this.data.list = [acc];   // en este dispositivo solo existe la cuenta propia
      this.save();
      return acc;
    }
    const acc = this.byUsername(username);
    if (!acc) return null;
    if ((await hashPass(password)) !== acc.passHash) return null;
    acc.lastLogin = Date.now();
    this.save();
    return acc;
  },
  setRequireLogin(v) {
    this.data.requireLogin = !!v;
    this.save();
    if (_secure()) FB.setPublicConfig({ requireLogin: !!v });
  },
  importItems(items) {
    if (!Array.isArray(items)) return;
    if (_secure()) {
      // Con Firebase las contraseñas no se pueden importar: las cuentas se crean con «Nueva cuenta».
      console.warn("AR PERIO: se omite la importación de cuentas (modo seguro).");
      return;
    }
    for (const a of items) {
      if (!a || !a.username || !a.passHash) continue;
      const entry = {
        id: a.id || "sa-" + rid(),
        username: String(a.username),
        name: String(a.name || a.username),
        passHash: String(a.passHash),
        at: a.at || Date.now(),
        lastLogin: a.lastLogin ?? null,
      };
      const idx = this.all().findIndex((x) =>
        x.username.toLowerCase() === entry.username.toLowerCase() || (a.id && x.id === a.id));
      if (idx >= 0) this.data.list[idx] = { ...this.data.list[idx], ...entry };
      else this.data.list = [...this.all(), entry];
    }
    this.save();
  },
};

/* --------------------------- Sesión y acceso ------------------------------ */

const Session = {
  data: loadLS("session", { role: "student", since: null, studentId: null }),
  save() { saveLS("session", this.data); Bus.emit("session"); },
  isTeacher() { return this.data.role === "teacher"; },
  /** Cuenta del estudiante con sesión iniciada (o null si es invitado/docente). */
  student() {
    return this.data.role === "student" && this.data.studentId ? Accounts.byId(this.data.studentId) : null;
  },
  login(code) {
    if (_secure()) {
      // El docente entra con correo y contraseña de Firebase: se abre ese formulario.
      if (typeof showTeacherLogin === "function") showTeacherLogin();
      return false;
    }
    if (String(code).trim() === Settings.data.teacherCode) {
      this.data = { role: "teacher", since: Date.now(), studentId: null };
      this.save();
      return true;
    }
    return false;
  },
  /** Sesión de docente ya autenticada en Firebase (la llama el formulario de acceso docente). */
  teacherLogin() {
    this.data = { role: "teacher", since: Date.now(), studentId: null };
    this.save();
  },
  /** Inicia sesión de estudiante con una cuenta del docente. */
  studentLogin(acc) {
    this.data = { role: "student", since: Date.now(), studentId: acc.id };
    this.save();
    StudentScope.apply();
    if (Student.data.profileName === "Estudiante") {
      Student.data.profileName = acc.name || acc.username;
      Student.save();
    }
  },
  logout() {
    const hadStudent = !!this.data.studentId;
    const wasTeacher = this.isTeacher();
    this.data = { role: "student", since: null, studentId: null };
    this.save();
    if (_secure() && (hadStudent || wasTeacher)) FB.logout();   // envía lo pendiente, limpia el dispositivo y cierra Firebase
    if (hadStudent) StudentScope.apply();
  },
};

/* Si la cuenta de la sesión ya no existe (p. ej. borrada), volver a invitado
 * ANTES de cargar el progreso, para no leer una clave huérfana. */
if (Session.data.studentId && !Accounts.byId(Session.data.studentId)) {
  Session.data = { role: "student", since: null, studentId: null };
  Session.save();
}

/* ----------------------------- Estudiante --------------------------------- */
/* El progreso del estudiante se guarda en una clave DISTINTA por cuenta:
 * invitado → "student" · cuenta → "student:<id>" (ídem periodontograma). */

const studentKey = () => (Session.data?.studentId ? "student:" + Session.data.studentId : "student");
const perioKey = () => (Session.data?.studentId ? "perio:" + Session.data.studentId : "perio");

const _studentDef = {
  profileName: "Estudiante",
  sessions: [],          // {id, module, startedAt, seconds}
  measurements: [],      // {id, at, site, conditionId, measured, actual, error}
  challengeResults: [],  // {challengeId, score, detail, at}
  caseResults: [],       // {caseId, score, maxScore, at}
  quizResults: [],       // {topicId, categoryId, correct, total, at}
  chartResults: [],      // {exerciseId, mode, region, score, seconds, detail, at} · práctica de llenado
  readTopics: [],
  errorCounts: {},
  activeSession: null,
};

const Student = {
  data: loadLS(studentKey(), _studentDef),
  reload() { this.data = loadLS(studentKey(), _studentDef); },
  save() { saveLS(studentKey(), this.data); },
  setProfile(name) { this.data.profileName = name; this.save(); },
  startSession(moduleName) {
    if (this.data.activeSession) this.endSession();
    this.data.activeSession = { id: rid(), module: moduleName, startedAt: Date.now() };
    this.save();
  },
  endSession() {
    const s = this.data.activeSession;
    if (!s) return;
    const seconds = Math.max(1, Math.round((Date.now() - s.startedAt) / 1000));
    this.data.activeSession = null;
    this.data.sessions = [...this.data.sessions.slice(-199), { id: s.id, module: s.module, startedAt: s.startedAt, seconds }];
    this.save();
  },
  logMeasurement(m) {
    this.data.measurements = [...this.data.measurements.slice(-299), { ...m, id: rid(), at: Date.now() }];
    this.save();
  },
  logError(kind) {
    this.data.errorCounts[kind] = (this.data.errorCounts[kind] ?? 0) + 1;
    this.save();
  },
  saveChallengeResult(r) { this.data.challengeResults.push(r); this.save(); },
  saveCaseResult(r) { this.data.caseResults.push(r); this.save(); Bus.emit("student"); },
  saveQuizResult(r) { this.data.quizResults.push(r); this.save(); },
  /** Resultado de un ejercicio de llenado del periodontograma a boca completa. */
  saveChartResult(r) { this.data.chartResults = [...(this.data.chartResults ?? []).slice(-49), { ...r, id: rid(), at: Date.now() }]; this.save(); Bus.emit("student"); },
  markTopicRead(topicId) {
    if (!this.data.readTopics.includes(topicId)) {
      this.data.readTopics.push(topicId);
      this.save();
      Bus.emit("student");
    }
  },
  resetProgress() {
    this.data = structuredClone(_studentDef);
    this.save();
    Bus.emit("student");
  },
};

/** Datos (solo lectura) de la cuenta de un estudiante, sin cambiar la sesión. */
function readStudentData(id) {
  return loadLS("student:" + id, _studentDef);
}

/** Cambia el ámbito del progreso (invitado ↔ cuenta) y repinta lo dependiente. */
const StudentScope = {
  apply() {
    Student.reload();
    Perio.reload();
    Bus.emit("student");
    Bus.emit("perio");
  },
};

/** Estadísticas derivadas del estudiante. */
function computeStats(s) {
  const mae = s.measurements.length > 0
    ? s.measurements.reduce((a, m) => a + Math.abs(m.error), 0) / s.measurements.length
    : null;
  const practiceSeconds = s.sessions
    .filter((x) => ["simulacion", "explorar", "practica", "periodontograma"].includes(x.module))
    .reduce((a, x) => a + x.seconds, 0);
  const uniqueChallenges = new Set(s.challengeResults.map((r) => r.challengeId)).size;
  const uniqueCases = new Set(s.caseResults.map((r) => r.caseId)).size;
  const quizAcc = s.quizResults.length
    ? s.quizResults.reduce((a, q) => a + q.correct / Math.max(1, q.total), 0) / s.quizResults.length
    : null;
  const bestChallenge = {};
  for (const r of s.challengeResults) {
    bestChallenge[r.challengeId] = Math.max(bestChallenge[r.challengeId] ?? 0, r.score);
  }
  const chartTries = (s.chartResults ?? []).length;
  const chartBest = chartTries ? Math.round(Math.max(...s.chartResults.map((r) => r.score ?? 0))) : null;
  return { mae, practiceSeconds, uniqueChallenges, uniqueCases, quizAcc, bestChallenge, chartTries, chartBest };
}

/* --------------------------- Periodontograma ------------------------------ */

function summarizeTooth(record) {
  let recorded = 0, bopCount = 0, supCount = 0, sumPd = 0, maxPd = null, maxCal = null;
  for (const id of SITE_IDS) {
    const s = record.sites[id];
    if (!s || s.pd === undefined) continue;
    recorded++;
    if (s.bop) bopCount++;
    if (s.sup) supCount++;
    sumPd += s.pd;
    maxPd = Math.max(maxPd ?? 0, s.pd);
    maxCal = Math.max(maxCal ?? 0, s.pd + (s.rec ?? 0));
  }
  return {
    recorded, bopCount, supCount, maxPd,
    avgPd: recorded ? Math.round((sumPd / recorded) * 10) / 10 : null,
    maxCal,
  };
}

const PERIO_HEADER_DEF = { patient: "", date: "", smoker: false, allergies: false, notes: "" };

const Perio = {
  /* data = { header (datos del paciente), records: { [fdi]: diente } }.
   * Normalización: sesiones antiguas guardaron solo { records } — se completa header. */
  data: { header: { ...PERIO_HEADER_DEF }, records: {}, ...loadLS(perioKey(), { records: {} }) },
  reload() { this.data = { header: { ...PERIO_HEADER_DEF }, records: {}, ...loadLS(perioKey(), { records: {} }) }; },
  header() { return this.data.header ?? (this.data.header = { ...PERIO_HEADER_DEF }); },
  setHeader(patch) {
    this.data.header = { ...this.header(), ...patch };
    this.save();
    Bus.emit("perio");
  },
  save() { saveLS(perioKey(), this.data); },
  getTooth(toothId) {
    return this.data.records[toothId] ?? { toothId, sites: {}, mobility: 0, furcation: "—" };
  },
  setSite(toothId, site, patch) {
    const tooth = this.data.records[toothId] ?? { toothId, sites: {}, mobility: 0, furcation: "—" };
    const prev = tooth.sites[site] ?? { bop: false, sup: false };
    this.data.records[toothId] = {
      ...tooth,
      sites: { ...tooth.sites, [site]: { ...prev, ...patch, updatedAt: Date.now() } },
    };
    this.save();
    Bus.emit("perio");
  },
  setTooth(toothId, patch) {
    const tooth = this.data.records[toothId] ?? { toothId, sites: {}, mobility: 0, furcation: "—" };
    this.data.records[toothId] = { ...tooth, ...patch };
    this.save();
    Bus.emit("perio");
  },
  clearTooth(toothId) {
    delete this.data.records[toothId];
    this.save();
    Bus.emit("perio");
  },
  /** Borra los registros de TODA la dentición (mantiene la cabecera del paciente). */
  clearAllTeeth() {
    this.data.records = {};
    this.save();
    Bus.emit("perio");
  },
  calOf(toothId, site) {
    const rec = this.data.records[toothId]?.sites[site];
    if (!rec || rec.pd === undefined) return undefined;
    return Math.round((rec.pd + (rec.rec ?? 0)) * 10) / 10;
  },
};

/* --------------------- Contenido creado por el docente -------------------- */

const _contentDef = { customCases: [], customChallenges: [], customQuestions: [], learnImages: {}, diagramOverrides: {}, topicOverrides: {}, customTopics: [] };

const Content = {
  data: loadLS("content", _contentDef),
  reload() { this.data = loadLS("content", _contentDef); },
  save() { saveLS("content", this.data); Bus.emit("content"); },
  get cases() { return this.data.customCases; },
  get challenges() { return this.data.customChallenges; },
  get questions() { return this.data.customQuestions; },
  upsertCase(c) {
    const list = this.data.customCases;
    this.data.customCases = list.some((x) => x.id === c.id)
      ? list.map((x) => (x.id === c.id ? c : x))
      : [...list, c];
    this.save();
  },
  removeCase(id) { this.data.customCases = this.data.customCases.filter((x) => x.id !== id); this.save(); },
  upsertChallenge(c) {
    const list = this.data.customChallenges;
    this.data.customChallenges = list.some((x) => x.id === c.id)
      ? list.map((x) => (x.id === c.id ? c : x))
      : [...list, c];
    this.save();
  },
  removeChallenge(id) { this.data.customChallenges = this.data.customChallenges.filter((x) => x.id !== id); this.save(); },
  addQuestion(q) { this.data.customQuestions.push(q); this.save(); },
  removeQuestion(id) { this.data.customQuestions = this.data.customQuestions.filter((x) => x.id !== id); this.save(); },

  /* ---- Fotos del docente para los temas del módulo Aprender ----
   * learnImages = { [topicId]: [{ id, src (dataURL), caption, at }] } */
  learnImagesFor(topicId) { return (this.data.learnImages ?? {})[topicId] ?? []; },
  topicsWithImages() { return Object.keys(this.data.learnImages ?? {}).filter((k) => (this.data.learnImages[k] || []).length > 0); },
  addLearnImage(topicId, img) {
    this.data.learnImages = { ...(this.data.learnImages ?? {}) };
    this.data.learnImages[topicId] = [...this.learnImagesFor(topicId), { id: rid(), at: Date.now(), ...img }];
    this.save();
  },
  updateLearnImage(topicId, id, patch) {
    const list = this.learnImagesFor(topicId);
    if (!list.some((x) => x.id === id)) return;
    this.data.learnImages[topicId] = list.map((x) => (x.id === id ? { ...x, ...patch } : x));
    this.save();
  },
  removeLearnImage(topicId, id) {
    const list = this.learnImagesFor(topicId).filter((x) => x.id !== id);
    const next = { ...(this.data.learnImages ?? {}) };
    if (list.length) next[topicId] = list; else delete next[topicId];
    this.data.learnImages = next;
    this.save();
  },
  clearLearnImages(topicId) {
    const next = { ...(this.data.learnImages ?? {}) };
    delete next[topicId];
    this.data.learnImages = next;
    this.save();
  },

  /* ---- Reemplazo de las ilustraciones integradas de los temas ----
   * El docente puede sustituir el diagrama SVG original de un tema por una
   * imagen propia (foto clínica, esquema escaneado…).
   * diagramOverrides = { ["topicId::diagramId"]: { src (dataURL), caption, at } } */
  diagramOverride(topicId, diagramId) {
    return (this.data.diagramOverrides ?? {})[`${topicId}::${diagramId}`] ?? null;
  },
  setDiagramOverride(topicId, diagramId, val) {
    this.data.diagramOverrides = { ...(this.data.diagramOverrides ?? {}) };
    this.data.diagramOverrides[`${topicId}::${diagramId}`] = { at: Date.now(), ...val };
    this.save();
  },
  removeDiagramOverride(topicId, diagramId) {
    const next = { ...(this.data.diagramOverrides ?? {}) };
    delete next[`${topicId}::${diagramId}`];
    this.data.diagramOverrides = next;
    this.save();
  },
  topicsWithOverrides() {
    return [...new Set(Object.keys(this.data.diagramOverrides ?? {}).map((k) => k.split("::")[0]))];
  },

  /* ---- Edición del TEXTO de las lecciones (módulo Aprender) ----
   * El docente puede adaptar la redacción de cada tema a su curso: título,
   * resumen, bloques de contenido y preguntas. Se guarda una copia completa
   * del tema editado; el original se recupera con «Restaurar».
   * topicOverrides = { [topicId]: { title, summary, blocks, quiz, at } } */
  topicOverride(topicId) { return (this.data.topicOverrides ?? {})[topicId] ?? null; },
  setTopicOverride(topicId, val) {
    this.data.topicOverrides = { ...(this.data.topicOverrides ?? {}) };
    this.data.topicOverrides[topicId] = { at: Date.now(), ...val };
    this.save();
  },
  removeTopicOverride(topicId) {
    const next = { ...(this.data.topicOverrides ?? {}) };
    delete next[topicId];
    this.data.topicOverrides = next;
    this.save();
  },
  topicsWithTextOverrides() { return Object.keys(this.data.topicOverrides ?? {}); },

  /* ---- Temas creados desde cero por el docente (módulo Aprender) ----
   * Un tema propio es una lección completa (título, resumen, bloques y
   * preguntas) que vive junto a los 24 temas del programa dentro de la
   * categoría elegida. El estudiante lo ve en Aprender como uno más.
   * customTopics = [{ id: "ct-…", categoryId, title, summary, blocks, quiz, at }] */
  customTopicsAll() { return this.data.customTopics ?? []; },
  customTopicsFor(categoryId) { return this.customTopicsAll().filter((t) => t.categoryId === categoryId); },
  getCustomTopic(topicId) { return this.customTopicsAll().find((t) => t.id === topicId) ?? null; },
  isCustomTopic(topicId) { return this.customTopicsAll().some((t) => t.id === topicId); },
  upsertCustomTopic(t) {
    const list = this.customTopicsAll();
    this.data.customTopics = list.some((x) => x.id === t.id)
      ? list.map((x) => (x.id === t.id ? { ...x, ...t } : x))
      : [...list, t];
    this.save();
  },
  removeCustomTopic(topicId) {
    this.data.customTopics = this.customTopicsAll().filter((x) => x.id !== topicId);
    this.save();
  },

  importAll(payload) {
    const caseIds = new Set((payload.cases ?? []).map((c) => c.id));
    const chIds = new Set((payload.challenges ?? []).map((c) => c.id));
    this.data.customCases = [
      ...this.data.customCases.filter((c) => !caseIds.has(c.id)),
      ...(payload.cases ?? []),
    ];
    this.data.customChallenges = [
      ...this.data.customChallenges.filter((c) => !chIds.has(c.id)),
      ...(payload.challenges ?? []),
    ];
    if (payload.radiographs) RadioBank.importItems(payload.radiographs);
    if (payload.learnImages && typeof payload.learnImages === "object") {
      this.data.learnImages = { ...(this.data.learnImages ?? {}), ...payload.learnImages };
    }
    if (payload.diagramOverrides && typeof payload.diagramOverrides === "object") {
      this.data.diagramOverrides = { ...(this.data.diagramOverrides ?? {}), ...payload.diagramOverrides };
    }
    if (payload.topicOverrides && typeof payload.topicOverrides === "object") {
      this.data.topicOverrides = { ...(this.data.topicOverrides ?? {}), ...payload.topicOverrides };
    }
    if (Array.isArray(payload.customTopics)) {
      const ids = new Set(this.customTopicsAll().map((x) => x.id));
      this.data.customTopics = [
        ...this.customTopicsAll(),
        ...payload.customTopics.filter((t) => t && t.id && !ids.has(t.id)),
      ];
    }
    if (Array.isArray(payload.studentAccounts)) Accounts.importItems(payload.studentAccounts);
    this.save();
  },
  exportAll() {
    return JSON.stringify({
      cases: this.data.customCases,
      challenges: this.data.customChallenges,
      radiographs: RadioBank.items,
      learnImages: this.data.learnImages ?? {},
      diagramOverrides: this.data.diagramOverrides ?? {},
      topicOverrides: this.data.topicOverrides ?? {},
      customTopics: this.customTopicsAll(),
      studentAccounts: Accounts.all(),
    }, null, 2);
  },
};

/* ------------------------- Banco de radiografías -------------------------- */
/* El docente sube radiografías reales (se guardan como imágenes optimizadas
 * en el navegador) y las asocia a sus casos clínicos. */

const RadioBank = {
  items: loadLS("radiobank", []),
  reload() { this.items = loadLS("radiobank", []); },
  save() { saveLS("radiobank", this.items); Bus.emit("radiobank"); },
  add(item) { this.items.push({ id: rid(), at: Date.now(), ...item }); this.save(); },
  update(id, patch) {
    this.items = this.items.map((x) => (x.id === id ? { ...x, ...patch } : x));
    this.save();
  },
  remove(id) { this.items = this.items.filter((x) => x.id !== id); this.save(); },
  importItems(items) {
    const ids = new Set(this.items.map((x) => x.id));
    this.items = [...this.items, ...items.filter((x) => x && x.src && !ids.has(x.id))];
    this.save();
  },
};

/* -------------------- Normalización de casos (compat.) -------------------- */
/* Los casos pueden traer `radiograph` (esquemática única, integrada) o
 * `radiographs` (lista con imágenes subidas por el docente). */

function caseRadiographs(c) {
  if (Array.isArray(c.radiographs) && c.radiographs.length) return c.radiographs;
  if (c.radiograph) return [c.radiograph];
  return [];
}

/* ------------------------------- Firebase --------------------------------- */
/* Arranca la sincronización con la nube (no hace nada si Firebase no está
 * configurado). Debe ir al final: usa Session, Accounts, Content, etc. */
if (window.FB) FB.start();
