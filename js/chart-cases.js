/* AR PERIO — chart-cases.js · Práctica de llenado del periodontograma.
 *
 * Datos y lógica (sin DOM) del apartado «Boca completa»:
 *  - Dentición completa FDI (32 dientes, 6 sitios por diente).
 *  - CHART_EXERCISES: ejercicios integrados con hallazgos deterministas
 *    (transcripción con hoja del examinador y modo dictado).
 *  - gradeChart(): corrección campo a campo con puntuación ponderada.
 */

/* --------------------------- Dentición completa ---------------------------- */

const FULL_MOUTH = {
  upper: { right: ["18", "17", "16", "15", "14", "13", "12", "11"], left: ["21", "22", "23", "24", "25", "26", "27", "28"] },
  lower: { right: ["48", "47", "46", "45", "44", "43", "42", "41"], left: ["31", "32", "33", "34", "35", "36", "37", "38"] },
};

const ALL_TEETH = [...FULL_MOUTH.upper.right, ...FULL_MOUTH.upper.left, ...FULL_MOUTH.lower.right, ...FULL_MOUTH.lower.left];

/** Molares (dientes multirradiculares con furca explorable). */
const MOLAR_SET = new Set(["16", "17", "18", "26", "27", "28", "36", "37", "38", "46", "47", "48"]);

/** Regiones practicables en modo dictado (un cuadrante por sesión). */
const CHART_REGIONS = [
  { id: "Q1", label: "Cuadrante 1 · superior derecho", teeth: FULL_MOUTH.upper.right },
  { id: "Q2", label: "Cuadrante 2 · superior izquierdo", teeth: FULL_MOUTH.upper.left },
  { id: "Q3", label: "Cuadrante 3 · inferior izquierdo", teeth: FULL_MOUTH.lower.left },
  { id: "Q4", label: "Cuadrante 4 · inferior derecho", teeth: FULL_MOUTH.lower.right },
];

/** Tipo de diente según el segundo dígito FDI. */
function toothType(fdi) {
  const d = +String(fdi)[1];
  if (d <= 2) return "incisivo";
  if (d === 3) return "canino";
  if (d <= 5) return "premolar";
  return "molar";
}

const isPosterior = (fdi) => ["premolar", "molar"].includes(toothType(fdi));
const isInterprox = (siteId) => siteId !== "VMed" && siteId !== "PMed";

/** Formato compacto de milímetros: 2 · 2.5 (sin ceros decimales). */
function fmtMm(v) {
  if (v === undefined || v === null || Number.isNaN(+v)) return "—";
  const n = +v;
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

/** Etiqueta de superficie interna según el arco (palatino/lingual). */
function innerSurfaceLabel(arch) {
  return arch === "upper" ? "Palatino" : "Lingual";
}

/* ------------------------------ Ejercicios -------------------------------- */
/* Cada ejercicio declara reglas clínicas coherentes (no azar): los hallazgos
 * se derivan del tipo de diente, la superficie y los dientes «calientes»
 * (hotspots), de modo que la hoja del examinador es estable entre sesiones. */

const CHART_EXERCISES = [
  {
    id: "chk-sano",
    title: "Control · periodonto sano",
    subtitle: "Sondaje 1–3 mm sin sangrado",
    level: "Inicial",
    patient: {
      name: "M. Torres", age: 24, date: "2026-03-12", smoker: false, allergies: false,
      notes: "Paciente joven en control anual. Higiene correcta con focos aislados de placa interproximal.",
    },
    teaching:
      "Sondaje fisiológico (1–3 mm), sin recesiones, sin sangrado al sondaje y sin pérdida de inserción. " +
      "Los focos aislados de placa sin BOP no alteran el diagnóstico de salud. Objetivo del ejercicio: " +
      "familiarizarse con el rango normal y la velocidad de registro.",
    rules: {
      pd: (fdi, site) => {
        const post = isPosterior(fdi);
        if (site === "VMed" || site === "PMed") return post ? 2 : 1;
        return post ? 3 : 2;
      },
      rec: () => 0,
      bop: () => false,
      plaque: (fdi, site) => ["14:VMes", "14:VMed", "24:PMed", "36:VMes", "36:VDis", "46:PMes"].includes(fdi + ":" + site),
      sup: () => false,
      mobility: () => 0,
      furcation: () => "—",
      missing: [],
    },
  },
  {
    id: "chk-ging",
    title: "Gingivitis inducida por biofilm",
    subtitle: "Seudobolsas 3–4 mm · BOP generalizado",
    level: "Básico",
    patient: {
      name: "L. Andrade", age: 31, date: "2026-04-03", smoker: false, allergies: true,
      notes: "Encía enrojecida y edematosa con sangrado al sondaje generalizado. Sin pérdida de inserción ni recesiones. Higiene deficiente.",
    },
    teaching:
      "El edema eleva el margen gingival y forma seudobolsas de 3–4 mm SIN pérdida de inserción: " +
      "NIC se mantiene (rec = 0). El BOP generalizado (> 30 % de los sitios) define la gingivitis. " +
      "Recuerda: en el periodontograma la recesión se registra como 0 y el NIC coincide con el sondaje.",
    rules: {
      pd: (fdi, site) => {
        const post = isPosterior(fdi);
        if (site === "VMed" || site === "PMed") return post ? 3 : 2;
        return post ? 4 : 3;
      },
      rec: () => 0,
      bop: (fdi, site) => isInterprox(site) || isPosterior(fdi),
      plaque: (fdi, site) => (isInterprox(site) || isPosterior(fdi)) && !["12", "22"].includes(fdi),
      sup: () => false,
      mobility: () => 0,
      furcation: () => "—",
      missing: [],
    },
  },
  {
    id: "chk-perio3",
    title: "Periodontitis generalizada · estadio III",
    subtitle: "Bolsas 4–8 mm · recesiones · furcas",
    level: "Avanzado",
    patient: {
      name: "R. Cando", age: 52, date: "2026-02-18", smoker: true, allergies: false,
      notes: "Pérdida de inserción generalizada con bolsas profundas en sector posterior, recesiones múltiples, furcas en molares y movilidad en 16, 17, 26, 27, 36 y 46. Terceros molares ausentes.",
    },
    teaching:
      "Bolsas ≥ 6 mm con NIC ≥ 5 mm y afectación de furcaciones definen una periodontitis estadio III. " +
      "El sondaje se agrava en interproximal y sector posterior; la recesión se SUMA al sondaje para el NIC " +
      "(p. ej. 26 mesial: 8 mm de sondaje + 3 mm de recesión = NIC 11). La movilidad y la furca se registran " +
      "a nivel del diente completo. Terceros molares: se marcan como ausentes y no se registran sitios.",
    rules: {
      pd: (fdi, site) => {
        const t = toothType(fdi);
        let base;
        if (t === "incisivo") base = isInterprox(site) ? 4 : 3;
        else if (t === "canino") base = isInterprox(site) ? 4 : 3;
        else if (t === "premolar") base = isInterprox(site) ? 5 : 4;
        else base = isInterprox(site) ? 6 : 5;
        if (["16", "26"].includes(fdi)) base += isInterprox(site) ? 2 : 1;   // 8 interproximal
        if (["36", "46"].includes(fdi)) base += isInterprox(site) ? 1 : 0;   // 7 interproximal
        return Math.min(base, 9);
      },
      rec: (fdi) => {
        const t = toothType(fdi);
        if (["16", "26", "36", "46"].includes(fdi)) return 3;
        if (t === "premolar" || t === "molar") return 2;
        return 1;
      },
      bop: (fdi, site) => {
        if (fdi === "17" && site === "PMed") return false;   // sitios negativos aislados
        if (fdi === "27" && site === "VMed") return false;
        const t = toothType(fdi);
        return isInterprox(site) || t !== "incisivo";
      },
      plaque: (fdi, site) => (isInterprox(site) || (isPosterior(fdi) && site.startsWith("V"))) && !["13", "43"].includes(fdi),
      sup: (fdi, site) => ["26:VMes", "26:PMes", "46:PMes", "17:VDis"].includes(fdi + ":" + site),
      mobility: (fdi) => ({ "16": 1, "17": 1, "26": 2, "27": 1, "36": 1, "46": 1 }[fdi] ?? 0),
      furcation: (fdi) => ({ "16": "II", "17": "I", "26": "II", "27": "I", "36": "I", "46": "I" }[fdi] ?? "—"),
      missing: ["18", "28", "38", "48"],
    },
  },
];

const chartExerciseById = (id) => CHART_EXERCISES.find((c) => c.id === id) ?? null;

/** Construye los hallazgos completos (objetivo) de un ejercicio.
 * Devuelve { teeth: { [fdi]: { sites: { [site]: {pd, rec, bop, plaque, sup} }, mobility, furcation, missing } } } */
function buildChartTargets(exerciseId) {
  const ex = chartExerciseById(exerciseId);
  if (!ex) return null;
  const teeth = {};
  for (const fdi of ALL_TEETH) {
    if (ex.rules.missing.includes(fdi)) {
      teeth[fdi] = { missing: true, mobility: 0, furcation: "—", sites: {} };
      continue;
    }
    const sites = {};
    for (const s of SITE_IDS) {
      sites[s] = {
        pd: ex.rules.pd(fdi, s),
        rec: ex.rules.rec(fdi, s),
        bop: ex.rules.bop(fdi, s),
        plaque: ex.rules.plaque(fdi, s),
        sup: ex.rules.sup(fdi, s),
      };
    }
    teeth[fdi] = { missing: false, mobility: ex.rules.mobility(fdi), furcation: ex.rules.furcation(fdi), sites };
  }
  return { exerciseId, teeth };
}

/* ------------------------------- Corrección -------------------------------- */
/* Ponderación clínica: el sondaje pesa más que los signos acompañantes.
 *  - PD: acierto exacto = 1 · error de ±1 mm = 0.5 · resto = 0
 *  - BOP / placa / movilidad / furca / ausencia: acierto exacto
 *  - Recesión: se normaliza vacío = 0; exacto = 1 · ±1 mm = 0.5
 * Modo «hoja» evalúa todos los campos de los dientes cubiertos; el modo
 * «dictado» evalúa solo lo dictado (sondaje y sangrado de la región). */

function gradeChart(targets, draft, { mode = "sheet", regionTeeth = null } = {}) {
  const teethIds = regionTeeth ? ALL_TEETH.filter((t) => regionTeeth.includes(t)) : ALL_TEETH;
  const errors = [];
  const tally = { pd: [0, 0], bop: [0, 0], rec: [0, 0], plaque: [0, 0], sup: [0, 0], tooth: [0, 0] }; // [puntos, máximo]

  const gradeNum = (got, want, tolHalf = false) => {
    if (got === undefined || got === null || Number.isNaN(+got)) return want === 0 && tolHalf ? 1 : 0;
    const d = Math.abs(+got - want);
    if (d === 0) return 1;
    if (tolHalf && d <= 1) return 0.5;
    return 0;
  };

  for (const fdi of teethIds) {
    const want = targets.teeth[fdi];
    const got = draft.getTooth(fdi);

    // Nivel diente: ausencia, movilidad y furca (solo modo hoja)
    if (mode !== "dictation") {
      let pts = 0, max = 0;
      max += 1; pts += (got.missing === true) === (want.missing === true) ? 1 : 0;
      if (!want.missing) {
        max += 1; pts += (+got.mobility || 0) === want.mobility ? 1 : 0;
        if (MOLAR_SET.has(fdi)) { max += 1; pts += (got.furcation || "—") === want.furcation ? 1 : 0; }
      }
      tally.tooth[0] += pts; tally.tooth[1] += max;
      if (pts < max) {
        if ((got.missing === true) !== (want.missing === true)) errors.push({ tooth: fdi, field: "ausente", want: want.missing ? "Ausente" : "Presente", got: got.missing ? "Ausente" : "Presente", near: false });
        if (!want.missing && (+got.mobility || 0) !== want.mobility) errors.push({ tooth: fdi, field: "movilidad", want: "Grado " + want.mobility, got: got.mobility ? "Grado " + got.mobility : "—", near: Math.abs((+got.mobility || 0) - want.mobility) <= 1 });
        if (!want.missing && MOLAR_SET.has(fdi) && (got.furcation || "—") !== want.furcation) errors.push({ tooth: fdi, field: "furca", want: want.furcation, got: got.furcation || "—", near: false });
      }
    }

    if (want.missing) continue; // no hay sitios que evaluar

    for (const s of SITE_IDS) {
      const w = want.sites[s];
      const g = got.sites[s] ?? {};

      // Sondaje
      const pdPts = g.pd === undefined ? 0 : gradeNum(g.pd, w.pd);
      tally.pd[0] += pdPts; tally.pd[1] += 1;
      if (pdPts < 1) errors.push({ tooth: fdi, site: s, field: "sondaje", want: w.pd + " mm", got: g.pd === undefined ? "—" : fmtMm(g.pd) + " mm", near: pdPts === 0.5 });

      // Sangrado
      const bopOk = !!g.bop === !!w.bop;
      tally.bop[0] += bopOk ? 1 : 0; tally.bop[1] += 1;
      if (!bopOk) errors.push({ tooth: fdi, site: s, field: "sangrado", want: w.bop ? "Positivo" : "Negativo", got: g.bop ? "Positivo" : "Negativo", near: false });

      if (mode === "dictation") continue; // el dictado no incluye recesión ni placa

      // Recesión (vacío = 0)
      const recPts = gradeNum(g.rec ?? 0, w.rec, true);
      tally.rec[0] += recPts; tally.rec[1] += 1;
      if (recPts < 1) errors.push({ tooth: fdi, site: s, field: "recesión", want: (w.rec || 0) + " mm", got: fmtMm(g.rec ?? 0) + " mm", near: recPts === 0.5 });

      // Placa
      const plqOk = !!g.plaque === !!w.plaque;
      tally.plaque[0] += plqOk ? 1 : 0; tally.plaque[1] += 1;
      if (!plqOk) errors.push({ tooth: fdi, site: s, field: "placa", want: w.plaque ? "Sí" : "No", got: g.plaque ? "Sí" : "No", near: false });

      // Supuración
      const supOk = !!g.sup === !!w.sup;
      tally.sup[0] += supOk ? 1 : 0; tally.sup[1] += 1;
      if (!supOk) errors.push({ tooth: fdi, site: s, field: "supuración", want: w.sup ? "Sí" : "No", got: g.sup ? "Sí" : "No", near: false });
    }
  }

  // Ponderación (renormalizada según los campos evaluados)
  const W = mode === "dictation"
    ? { pd: 0.7, bop: 0.3, rec: 0, plaque: 0, sup: 0, tooth: 0 }
    : { pd: 0.5, bop: 0.2, rec: 0.1, plaque: 0.04, sup: 0.03, tooth: 0.13 };
  let sumW = 0, sumPts = 0;
  for (const k of Object.keys(W)) {
    if (!tally[k][1]) continue;
    sumW += W[k];
    sumPts += W[k] * (tally[k][0] / tally[k][1]);
  }
  const score = sumW ? Math.round((sumPts / sumW) * 100) : 0;

  return {
    score,
    tally: {
      pd: { pts: Math.round(tally.pd[0] * 10) / 10, max: tally.pd[1], pct: tally.pd[1] ? Math.round((tally.pd[0] / tally.pd[1]) * 100) : null },
      bop: { pts: tally.bop[0], max: tally.bop[1], pct: tally.bop[1] ? Math.round((tally.bop[0] / tally.bop[1]) * 100) : null },
      rec: { pts: Math.round(tally.rec[0] * 10) / 10, max: tally.rec[1], pct: tally.rec[1] ? Math.round((tally.rec[0] / tally.rec[1]) * 100) : null },
      plaque: { pts: tally.plaque[0], max: tally.plaque[1], pct: tally.plaque[1] ? Math.round((tally.plaque[0] / tally.plaque[1]) * 100) : null },
      sup: { pts: tally.sup[0], max: tally.sup[1], pct: tally.sup[1] ? Math.round((tally.sup[0] / tally.sup[1]) * 100) : null },
      tooth: { pts: Math.round(tally.tooth[0] * 10) / 10, max: tally.tooth[1], pct: tally.tooth[1] ? Math.round((tally.tooth[0] / tally.tooth[1]) * 100) : null },
    },
    errors,
    gradedTeeth: teethIds.filter((t) => !targets.teeth[t].missing),
    missingTeeth: teethIds.filter((t) => targets.teeth[t].missing),
  };
}

/* ---------------------- Resumen clínico de la boca ------------------------- */
/** Índices periodontales a partir de un almacén con getTooth(fdi). */
function summarizeMouth(store, teethIds = ALL_TEETH) {
  let sites = 0, recorded = 0, bop = 0, plaque = 0, sup = 0, sumPd = 0, sumCal = 0, maxPd = null, maxCal = null, recSites = 0, deep4 = 0, deep6 = 0;
  let teethPresent = 0, mobTeeth = 0, furcTeeth = 0;
  for (const fdi of teethIds) {
    const t = store.getTooth(fdi);
    if (t.missing) continue;
    teethPresent++;
    if ((+t.mobility || 0) >= 1) mobTeeth++;
    if (t.furcation && t.furcation !== "—") furcTeeth++;
    for (const s of SITE_IDS) {
      const r = t.sites?.[s];
      if (!r) continue;
      if (r.pd === undefined) continue;
      recorded++;
      if (r.bop) bop++;
      if (r.plaque) plaque++;
      if (r.sup) sup++;
      if (r.rec) recSites++;
      sumPd += r.pd;
      sumCal += r.pd + (r.rec ?? 0);
      maxPd = Math.max(maxPd ?? 0, r.pd);
      maxCal = Math.max(maxCal ?? 0, r.pd + (r.rec ?? 0));
      if (r.pd >= 4) deep4++;
      if (r.pd >= 6) deep6++;
    }
  }
  const pct = (n, d) => (d ? Math.round((n / d) * 100) : null);
  return {
    teethPresent, sites: teethPresent * SITE_IDS.length, recorded,
    bop, bopPct: pct(bop, recorded), plaque, plaquePct: pct(plaque, recorded), sup, supPct: pct(sup, recorded),
    avgPd: recorded ? Math.round((sumPd / recorded) * 10) / 10 : null,
    avgCal: recorded ? Math.round((sumCal / recorded) * 10) / 10 : null,
    maxPd, maxCal, recSites, deep4, deep6, mobTeeth, furcTeeth,
  };
}

/** Interpretación educativa automática de la boca completa. */
function interpretMouth(sum) {
  if (!sum.recorded) return "";
  const lines = [];
  if (sum.maxPd !== null && sum.maxPd < 4 && sum.maxCal !== null && sum.maxCal < 4) {
    lines.push(`Sondaje máximo de ${fmtMm(sum.maxPd)} mm sin pérdida de inserción${sum.bopPct === 0 ? " y sin sangrado" : ""}: compatible con ${sum.bopPct && sum.bopPct > 0 ? "gingivitis" : "periodonto sano"}.`);
  } else {
    if (sum.deep4 > 0) lines.push(`Sitios con sondaje ≥ 4 mm: ${sum.deep4}${sum.deep6 ? ` (de ellos ≥ 6 mm: ${sum.deep6})` : ""} — indicación de instrumentación subgingival en esos sitios.`);
    if (sum.maxCal !== null && sum.maxCal >= 4) {
      const estadio = sum.maxCal >= 7 ? "estadio III–IV" : sum.maxCal >= 5 ? "estadio III" : "estadio I–II";
      lines.push(`NIC máximo de ${fmtMm(sum.maxCal)} mm: pérdida de inserción compatible con periodontitis (${estadio} según el NIC; confírmalo con la pérdida ósea radiográfica y los dientes perdidos).`);
    }
  }
  lines.push(`Sangrado al sondaje: ${sum.bop}/${sum.recorded} sitios (${sum.bopPct ?? 0} %)${sum.bopPct !== null && sum.bopPct >= 30 ? " — BOP ≥ 30 % define inflamación activa" : ""}.`);
  if (sum.plaquePct !== null) lines.push(`Placa registrada en ${sum.plaque}/${sum.recorded} sitios (${sum.plaquePct} %).`);
  if (sum.mobTeeth) lines.push(`Movilidad ≥ grado 1 en ${sum.mobTeeth} diente(s)${sum.furcTeeth ? ` y furca afectada en ${sum.furcTeeth}` : ""}.`);
  if (sum.recSites) lines.push(`Recesiones registradas en ${sum.recSites} sitios: valora indicaciones de técnica quirúrgica/higiene.`);
  return `<ul class="interp-list">${lines.map((l) => `<li>${l}</li>`).join("")}</ul>`;
}
