/* AR PERIO — models.js (portado de src/data/models.ts) */
/**
 * AR PERIO — Registro de datos anatómicos y condiciones.
 *
 * ARQUITECTURA EXTENSIBLE (FASE 5): para incorporar un nuevo diente se añade
 * una entrada a TOOTH_MODELS y su generador geométrico en src/3d; para una
 * nueva condición periodontal basta una entrada en PERIO_CONDITIONS.
 * Ningún módulo de la interfaz necesita modificarse.
 */
/* ------------------------------ Sitios de sondaje ------------------------ */
/** Ángulo θ en grados: 0 = vestibular, +90 = mesial, 180 = palatino, -90 = distal. */
const SITES = [
    { id: "VMes", label: "Vestibular mesial", short: "V-Mes", surface: "vestibular", sector: "mesial", theta: 60 },
    { id: "VMed", label: "Vestibular medio", short: "V-Med", surface: "vestibular", sector: "medio", theta: 0 },
    { id: "VDis", label: "Vestibular distal", short: "V-Dis", surface: "vestibular", sector: "distal", theta: -60 },
    { id: "PMes", label: "Palatino mesial", short: "P-Mes", surface: "palatino", sector: "mesial", theta: 120 },
    { id: "PMed", label: "Palatino medio", short: "P-Med", surface: "palatino", sector: "medio", theta: 180 },
    { id: "PDis", label: "Palatino distal", short: "P-Dis", surface: "palatino", sector: "distal", theta: 240 },
];
const SITE_IDS = SITES.map((s) => s.id);
const siteById = (id) => SITES.find((s) => s.id === id);
/** Clasifica un ángulo continuo (grados) al sitio de sondaje correspondiente. */
function siteFromTheta(thetaDeg) {
    let t = ((thetaDeg % 360) + 360) % 360; // 0..360
    // Sectores de 60° centrados en: V-Mes 60, P-Mes 120, P-Med 180, P-Dis 240, V-Dis 300, V-Med 0/360
    const order = ["VMed", "VMes", "PMes", "PMed", "PDis", "VDis"];
    const idx = Math.floor(((t + 30) % 360) / 60);
    return order[idx];
}
/* --------------------------- Registro de dientes ------------------------- */
const TOOTH_MODELS = [
    {
        id: "incisivo-central-sup",
        fdi: "11",
        name: "Incisivo central superior permanente",
        type: "incisivo",
        available: true,
        geometry: "central-incisor",
    },
    // FASE 5 — estructura lista para incorporar nuevos modelos:
    { id: "incisivo-lateral-sup", fdi: "12", name: "Incisivo lateral superior", type: "incisivo", available: false, geometry: "central-incisor" },
    { id: "canino-sup", fdi: "13", name: "Canino superior", type: "canino", available: false, geometry: "central-incisor" },
    { id: "primer-premolar-sup", fdi: "14", name: "Primer premolar superior", type: "premolar", available: false, geometry: "central-incisor" },
    { id: "primer-molar-sup", fdi: "16", name: "Primer molar superior", type: "molar", available: false, geometry: "central-incisor" },
];
const PRIMARY_TOOTH = TOOTH_MODELS[0];
/* ----------------------- Condiciones periodontales ----------------------- */
/**
 * Geometría resultante (mm, sobre el eje del diente con CEJ en y = 0):
 *   margen(θ)  = margenSano(θ) + swell − recesión
 *   fondo(θ)   = CEJ(θ) − attachmentLoss
 *   PD(θ)      = arco de superficie entre margen y fondo ≈ margen − fondo
 * El incisivo sano presenta ~1.5 mm en vestibular medio y ~2.5–3 mm
 * interproximal, como se describe en la literatura clásica.
 */
const PERIO_CONDITIONS = [
    {
        id: "sano",
        label: "Periodonto sano",
        description: "Encía rosa coral, margen fino adaptado al diente y surco fisiológico de 1–3 mm. Sin sangrado al sondaje.",
        swell: 0,
        recession: 0,
        attachmentLoss: 0,
        boneLoss: 0,
        gumColor: "#c47b74",
        marginThickness: 0,
        bleedingSites: [],
    },
    {
        id: "gingivitis",
        label: "Gingivitis (edema moderado)",
        description: "Inflamación gingival con edema: el margen se engruesa y asciende formando seudobolsas de 3–4 mm. Sin pérdida de inserción. Sangrado al sondaje generalizado.",
        swell: 1.5,
        recession: 0,
        attachmentLoss: 0,
        boneLoss: 0,
        gumColor: "#c25a55",
        marginThickness: 0.55,
        bleedingSites: ["VMes", "VMed", "VDis", "PMes", "PMed", "PDis"],
    },
    {
        id: "perio-leve",
        label: "Periodontitis inicial",
        description: "Pérdida de inserción incipiente: el vestibular medio alcanza ~5 mm y las zonas interproximales superan los 6 mm. Ideal para localizar sondajes objetivos por sitio.",
        swell: 0.9,
        recession: 0.3,
        attachmentLoss: 2.9,
        boneLoss: 2.4,
        gumColor: "#bb615b",
        marginThickness: 0.3,
        bleedingSites: ["VMes", "VDis", "PMes", "PDis"],
    },
    {
        id: "perio-moderada",
        label: "Periodontitis moderada",
        description: "Bolsas de 5–7 mm con pérdida de inserción, recesión incipiente y sangrado en varios sitios.",
        swell: 1.0,
        recession: 0.6,
        attachmentLoss: 3.4,
        boneLoss: 3.0,
        gumColor: "#b95d58",
        marginThickness: 0.35,
        bleedingSites: ["VMes", "VMed", "VDis", "PMes"],
    },
    {
        id: "perio-avanzada",
        label: "Periodontitis avanzada",
        description: "Pérdida de inserción ≥ 6 mm con recesión marcada: raíz expuesta, bolsas residuales profundas y cresta ósea destruida.",
        swell: 0.6,
        recession: 3.6,
        attachmentLoss: 6.4,
        boneLoss: 6.0,
        gumColor: "#b35a58",
        marginThickness: 0.2,
        bleedingSites: ["VMes", "PMes", "PDis"],
    },
];
const conditionById = (id) => { var _a; return (_a = PERIO_CONDITIONS.find((c) => c.id === id)) !== null && _a !== void 0 ? _a : PERIO_CONDITIONS[0]; };
/* --------------------------- Definición de módulos ----------------------- */
const MODULE_CARDS = [
    {
        id: "aprender",
        title: "Aprender Periodoncia",
        subtitle: "Teoría interactiva",
        description: "Anatomía periodontal, examen, enfermedades e instrumentación con esquemas, tablas y mini evaluaciones.",
        icon: "BookOpen",
        phase: 4,
        accent: "teal",
    },
    {
        id: "explorar",
        title: "Exploración 3D",
        subtitle: "Modelo anatómico",
        description: "Explora libremente el incisivo central superior con encía: rota, acercate y activa capas anatómicas.",
        icon: "Box",
        phase: 1,
        accent: "teal",
    },
    {
        id: "simulacion",
        title: "Simulación de sondaje",
        subtitle: "Práctica preclínica",
        description: "Manipula la sonda periodontal virtual, insértala en el surco y observa la transparencia dinámica de la encía.",
        icon: "Crosshair",
        phase: 1,
        accent: "coral",
    },
    {
        id: "periodontograma",
        title: "Periodontograma",
        subtitle: "Registro clínico",
        description: "Registra los 6 sitios por diente y practica el llenado completo de la ficha (32 dientes) con ejercicios corregidos, índices e interpretación.",
        icon: "ClipboardList",
        phase: 2,
        accent: "teal",
    },
    {
        id: "casos",
        title: "Casos clínicos",
        subtitle: "Razonamiento clínico",
        description: "Resuelve casos con historia clínica, periodontograma, radiografías y modelo 3D. Diagnostica y planifica.",
        icon: "Stethoscope",
        phase: 3,
        accent: "coral",
    },
    {
        id: "practica",
        title: "Práctica / Desafíos",
        subtitle: "Entrenamiento evaluado",
        description: "Desafíos de precisión de sondaje, registro de sangrado e interpretación con retroalimentación automática.",
        icon: "Target",
        phase: 3,
        accent: "amber",
    },
    {
        id: "progreso",
        title: "Mi progreso",
        subtitle: "Resultados",
        description: "Precisión del sondaje, casos completados, errores frecuentes, tiempo de práctica y avance por tema.",
        icon: "LineChart",
        phase: 4,
        accent: "slate",
    },
    {
        id: "docente",
        title: "Panel docente",
        subtitle: "Gestión académica",
        description: "Crea y edita casos clínicos, preguntas y desafíos; revisa resultados y errores frecuentes del estudiante.",
        icon: "GraduationCap",
        phase: 4,
        accent: "slate",
    },
];
function pdSeverity(pd) {
    if (pd === undefined)
        return "healthy";
    if (pd < 3)
        return "healthy";
    if (pd < 4)
        return "mild";
    if (pd < 6)
        return "moderate";
    return "severe";
}
const SEVERITY_COLOR = {
    healthy: "#14915c",
    mild: "#d99a17",
    moderate: "#e2601c",
    severe: "#c22035",
};
const SEVERITY_LABEL = {
    healthy: "Normal",
    mild: "Leve",
    moderate: "Moderado",
    severe: "Severo",
};
