/* AR PERIO — views/perio-chart.js · Periodontograma a boca completa.
 *
 * Apartado de práctica del LLENADO del periodontograma (dentición completa
 * FDI, 6 sitios por diente) inspirado en la ficha clínica digital
 * periodontalchart-online.com (Universidad de Berna, perio-tools):
 *  - Modo libre: cabecera de paciente, registro por sitio (sondaje, recesión,
 *    sangrado, placa, supuración), movilidad/furca/ausencia por diente,
 *    NIC calculado, índices en vivo, interpretación, CSV e impresión.
 *  - Dos vistas de la ficha: «Tabla» numérica editable y «Gráfico» dental
 *    (odontograma SVG con severidad por sitio, puntos de BOP/placa/supuración,
 *    curva azul de nivel de inserción, filtros de estado y sumario central).
 *  - Registro en pares Rec→Son del mismo sitio (como el sondaje clínico:
 *    primero el margen gingival y a continuación la profundidad).
 *  - Ejercicios corregidos: transcripción con hoja del examinador y dictado
 *    por cuadrante con puntuación ponderada y revisión de errores.
 *
 * Los datos del modo libre viven en Perio (localStorage, por cuenta);
 * los ejercicios usan un borrador aislado en memoria que puede volcarse
 * al registro propio al terminar.
 */

/* Memoria entre visitas: vista activa (ficha/tabla/gráfico) y orden del Intro. */
let _pfView = "ficha"; // 'ficha' | 'tabla' | 'grafico'
let _pfPair = true;    // true: Intro salta Rec→Son del mismo sitio

/* Orden clínico de llenado (pares rec→pd por sitio, diente a diente),
 * igual que la secuencia «margen gingival y luego sondaje» de la ficha
 * de Berna. Se usa para el avance con Intro cuando _pfPair está activo. */
const PF_PAIR_ORDER = (() => {
  const out = [];
  for (const arch of ["upper", "lower"]) {
    const def = FULL_MOUTH[arch];
    for (const t of [...def.right, ...def.left]) {
      for (const s of ["VMes", "VMed", "VDis", "PMes", "PMed", "PDis"]) {
        out.push({ t, s, f: "rec" }, { t, s, f: "pd" });
      }
    }
  }
  return out;
})();

/* ------------------------- Borrador de ejercicios ------------------------- */
/* Mismo contrato que Perio (getTooth/setSite/setTooth…) sin persistencia,
 * para que la grilla funcione igual en modo libre y en modo ejercicio. */

function createDraftStore(header) {
  const data = { header: { ...header }, records: {} };
  return {
    data,
    header() { return data.header; },
    setHeader(patch) { data.header = { ...data.header, ...patch }; },
    getTooth(fdi) { return data.records[fdi] ?? { toothId: fdi, sites: {}, mobility: 0, furcation: "—" }; },
    setSite(fdi, site, patch) {
      const tooth = data.records[fdi] ?? { toothId: fdi, sites: {}, mobility: 0, furcation: "—" };
      const prev = tooth.sites[site] ?? { bop: false, sup: false, plaque: false };
      data.records[fdi] = { ...tooth, sites: { ...tooth.sites, [site]: { ...prev, ...patch } } };
    },
    setTooth(fdi, patch) {
      const tooth = data.records[fdi] ?? { toothId: fdi, sites: {}, mobility: 0, furcation: "—" };
      data.records[fdi] = { ...tooth, ...patch };
    },
    clearTooth(fdi) { delete data.records[fdi]; },
    clearAllTeeth() { data.records = {}; },
  };
}

/* ------------------------------ Exportar CSV ------------------------------ */

function chartToCSV(store) {
  const h = store.header();
  const escCsv = (v) => {
    const s = String(v ?? "");
    return /[",;\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const rows = [];
  rows.push(["# AR PERIO · Periodontograma a boca completa"]);
  if (h.patient) rows.push(["# Paciente: " + h.patient]);
  if (h.date) rows.push(["# Fecha: " + h.date]);
  rows.push(["# Fumador: " + (h.smoker ? "sí" : "no") + " · Alergias: " + (h.allergies ? "sí" : "no")]);
  rows.push([]);
  rows.push(["Diente", "Sitio", "Sondaje (mm)", "Recesión (mm)", "NIC (mm)", "Sangrado", "Placa", "Supuración"]);
  for (const t of ALL_TEETH) {
    const rec = store.getTooth(t);
    if (rec.missing) { rows.push([t, "AUSENTE", "", "", "", "", "", ""]); continue; }
    for (const s of SITE_IDS) {
      const r = rec.sites?.[s] ?? {};
      const cal = r.pd !== undefined ? Math.round((r.pd + (r.rec ?? 0)) * 10) / 10 : "";
      rows.push([t, siteById(s).label, r.pd ?? "", r.rec ?? "", cal, r.bop ? "Sí" : "No", r.plaque ? "Sí" : "No", r.sup ? "Sí" : "No"]);
    }
  }
  rows.push([]);
  rows.push(["Diente", "Movilidad (Miller)", "Furca", "Ausente"]);
  for (const t of ALL_TEETH) {
    const rec = store.getTooth(t);
    rows.push([t, rec.missing ? "" : (+rec.mobility || 0), rec.missing ? "" : (rec.furcation || "—"), rec.missing ? "Sí" : "No"]);
  }
  rows.push([]);
  const sum = summarizeMouth(store);
  rows.push(["# Índices"]);
  rows.push(["Sitios registrados", `${sum.recorded}/${sum.sites}`]);
  rows.push(["Sondaje medio (mm)", sum.avgPd ?? ""]);
  rows.push(["BOP", `${sum.bop} (${sum.bopPct ?? 0} %)`]);
  rows.push(["Placa", `${sum.plaque} (${sum.plaquePct ?? 0} %)`]);
  rows.push(["Sitios ≥ 4 mm", sum.deep4]);
  rows.push(["Sitios ≥ 6 mm", sum.deep6]);
  rows.push(["NIC máximo (mm)", sum.maxCal ?? ""]);
  return rows.map((r) => r.map(escCsv).join(";")).join("\r\n");
}

function downloadCSV() {
  const csv = chartToCSV(storeRef.current);
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  const d = new Date();
  a.href = URL.createObjectURL(blob);
  a.download = `periodontograma-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}.csv`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 400);
  toast({ title: "CSV exportado", description: "Ábrelo en Excel o Sheets (separador «;»)." });
}

/* ------------------------ Hoja del examinador ----------------------------- */
/* Tabla compacta con TODOS los hallazgos objetivo de un ejercicio. */

function examinerSheetHTML(targets) {
  const siteFields = [
    { label: "Rec", get: (r) => `<b>${fmtMm(r.rec)}</b>` },
    { label: "Son", get: (r) => `<b class="pf-son">${fmtMm(r.pd)}</b>` },
    { label: "BOP", get: (r) => `<i class="pf-sd ${r.bop ? "bop" : ""}"></i>` },
    { label: "Plq", get: (r) => `<i class="pf-sd plq ${r.plaque ? "on" : ""}"></i>` },
    { label: "Sup", get: (r) => `<i class="pf-sd sup ${r.sup ? "on" : ""}"></i>` },
  ];
  const surfaceBlock = (teeth, surfLabel, siteList) => siteFields.map(({ label, get }) =>
    `<tr><th class="pf-lab">${label} ${surfLabel}</th>${teeth.map((t) => {
      const tt = targets.teeth[t];
      if (tt.missing) return `<td class="pf-sc miss">AUS</td>`;
      return `<td class="pf-sc">${siteList.map((s) => get(tt.sites[s])).join(" ")}</td>`;
    }).join("")}</tr>`).join("");
  const toothRows = (teeth) => {
    const cell = (fn) => teeth.map((t) => `<td class="pf-sc">${fn(targets.teeth[t], t)}</td>`).join("");
    return `<tr class="pf-sheet-arch"><th class="pf-lab"></th><th colspan="${teeth.length}">DIENTE</th></tr>
      <tr><th class="pf-lab"></th>${teeth.map((t) => `<th class="pf-sh ${targets.teeth[t].missing ? "miss" : ""}">${t}</th>`).join("")}</tr>
      <tr><th class="pf-lab">Mov</th>${cell((tt) => (tt.missing ? "—" : "M" + tt.mobility))}</tr>
      <tr><th class="pf-lab">Furca</th>${cell((tt, t) => (tt.missing || !MOLAR_SET.has(t) ? "—" : tt.furcation))}</tr>
      <tr><th class="pf-lab">Ausente</th>${cell((tt) => (tt.missing ? "AUS" : "—"))}</tr>`;
  };
  const archBlock = (def, name) => {
    const all = def.right.concat(def.left);
    return `<tr class="pf-sheet-arch"><th class="pf-lab"></th><th colspan="${all.length}">${name} — VESTIBULAR</th></tr>
      ${surfaceBlock(all, "V", ["VMes", "VMed", "VDis"])}
      ${toothRows(all)}
      <tr class="pf-sheet-arch"><th class="pf-lab"></th><th colspan="${all.length}">${name} — ${name.startsWith("Max") ? "PALATINO" : "LINGUAL"}</th></tr>
      ${surfaceBlock(all, "P", ["PMes", "PMed", "PDis"])}`;
  };
  return `<div class="pf-sheet">
    <p class="hint mb">Hallazgos del examinador — transcribe estos valores en la grilla. Por diente y superficie: Mesial · Medio · Distal. Rec = recesión (mm) · Son = sondaje (mm) · BOP/Plq/Sup = puntos.</p>
    <div class="table-wrap"><table class="pf-grid pf-sheet-t">
      ${archBlock(FULL_MOUTH.upper, "Maxilar superior")}
      ${archBlock(FULL_MOUTH.lower, "Mandíbula")}
    </table></div>
    <p class="hint mt">Los dientes «AUS» deben marcarse como ausentes (clic en el número del diente → interruptor). La movilidad y la furca se registran en sus filas de la grilla.</p>
  </div>`;
}

/* ------------------------------ utilidades -------------------------------- */

const PF_SURFACE = { upper: "P", lower: "L" };
const pfQuadrantName = (fdi) => ({ 1: "superior derecho", 2: "superior izquierdo", 3: "inferior izquierdo", 4: "inferior derecho" }[+String(fdi)[0]]);

function pfToothName(fdi) {
  const names = { incisivo: "Incisivo", canino: "Canino", premolar: "Premolar", molar: "Molar" };
  return `${names[toothType(fdi)]} ${pfQuadrantName(fdi)} (FDI ${fdi})`;
}

const canSpeech = typeof window !== "undefined" && "speechSynthesis" in window;
function pfSpeak(text) {
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "es-ES"; u.rate = 0.95;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  } catch (e) { /* sin voz disponible */ }
}

/** Referencia al almacén activo (Perio o borrador) para helpers de módulo. */
const storeRef = { current: null };

/* --------------------------- Celdas de la grilla --------------------------- */

function pfSevStyle(v, alpha = "22") {
  if (v === undefined || v === null) return "";
  return `${SEVERITY_COLOR[pdSeverity(v)]}${alpha}`;
}

function pfSiteCell(t, s, f, rec, disabled) {
  const v = rec?.sites?.[s]?.[f];
  const style = f === "pd" ? `background:${pfSevStyle(v)}` : "";
  return `<td class="pf-c" data-t="${t}" data-s="${s}" data-f="${f}" style="${style}">
    <input class="pf-in" data-t="${t}" data-s="${s}" data-f="${f}" inputmode="decimal" maxlength="4"
      value="${v !== undefined && v !== null ? fmtMm(v) : ""}" ${disabled ? "disabled" : ""}
      aria-label="${t} ${siteById(s).label} ${f === "pd" ? "sondaje" : "recesión"} en mm">
  </td>`;
}

function pfNicCell(t, s, rec, disabled) {
  const r = rec?.sites?.[s];
  const cal = r?.pd !== undefined ? Math.round((r.pd + (r.rec ?? 0)) * 10) / 10 : undefined;
  return `<td class="pf-c pf-nic ${disabled ? "pf-m" : ""}" data-t="${t}" data-s="${s}" data-f="nic"
    style="background:${pfSevStyle(cal, "18")}" title="NIC = sondaje + recesión">${cal !== undefined ? fmtMm(cal) : "·"}</td>`;
}

function pfDotCell(t, s, f, rec, disabled) {
  const on = !!rec?.sites?.[s]?.[f];
  const kind = f === "bop" ? "bop" : f === "plaque" ? "plq" : "sup";
  const label = f === "bop" ? "sangrado al sondaje" : f === "plaque" ? "placa" : "supuración";
  const pretty = f === "bop" ? "Sangrado" : f === "plaque" ? "Placa" : "Supuración";
  return `<td class="pf-c"><button class="pf-dot ${kind} ${on ? "on" : ""}" data-t="${t}" data-s="${s}" data-f="${f}"
    ${disabled ? "disabled" : ""} aria-label="${t} ${siteById(s).label}: ${label} ${on ? "positivo" : "negativo"}"
    title="${pretty}"></button></td>`;
}

function pfToothCell(t, rec) {
  const mob = +rec.mobility || 0;
  const furc = rec.furcation && rec.furcation !== "—" ? rec.furcation : "";
  return `<td class="pf-tooth ${rec.missing ? "is-missing" : ""}" colspan="3" data-t="${t}">
    <button class="pf-tbtn" data-t="${t}" title="${esc(pfToothName(t))} · clic para ausencia y limpieza">${t}</button>
    ${mob >= 1 ? `<span class="pf-badge-mob" title="Movilidad grado ${mob}">M${mob}</span>` : ""}
    ${furc ? `<span class="pf-badge-furc" title="Furca grado ${furc}">F${furc}</span>` : ""}
  </td>`;
}

function pfSelectCell(t, rec, f, disabled) {
  if (f === "mobility") {
    const v = +rec.mobility || 0;
    return `<td class="pf-c pf-tsel" colspan="3"><select class="pf-sel" data-t="${t}" data-f="mobility" ${disabled ? "disabled" : ""} aria-label="Movilidad diente ${t}">
      ${[0, 1, 2, 3].map((m) => `<option value="${m}" ${v === m ? "selected" : ""}>${m}</option>`).join("")}
    </select></td>`;
  }
  const isMolar = MOLAR_SET.has(t);
  const v = rec.furcation || "—";
  return `<td class="pf-c pf-tsel" colspan="3"><select class="pf-sel" data-t="${t}" data-f="furcation" ${disabled || !isMolar ? "disabled" : ""} ${!isMolar ? 'title="Diente sin furca explorable"' : ""} aria-label="Furca diente ${t}">
    ${["—", "I", "II", "III"].map((g) => `<option value="${g}" ${v === g ? "selected" : ""}>${g}</option>`).join("")}
  </select></td>`;
}

/** Tabla de un arco completo (15 filas: 6 vestibulares, 3 de diente, 6 internas). */
function pfArchTable(archKey, store) {
  const def = FULL_MOUTH[archKey];
  const inner = PF_SURFACE[archKey];

  const siteRow = (label, surf, siteList, cellFn) => `<tr>
    <th class="pf-lab">${label}<span class="pf-sf ${surf === "V" ? "v" : "p"}">${surf}</span></th>
    ${def.right.map((t) => siteList.map((s) => cellFn(t, s, store.getTooth(t), store.getTooth(t).missing)).join("")).join("")}
    <td class="pf-mid"></td>
    ${def.left.map((t) => siteList.map((s) => cellFn(t, s, store.getTooth(t), store.getTooth(t).missing)).join("")).join("")}
  </tr>`;

  const toothRow = (label, fn) => `<tr>
    <th class="pf-lab">${label}</th>
    ${def.right.map((t) => fn(t, store.getTooth(t), store.getTooth(t).missing)).join("")}
    <td class="pf-mid"></td>
    ${def.left.map((t) => fn(t, store.getTooth(t), store.getTooth(t).missing)).join("")}
  </tr>`;

  const VS = ["VMes", "VMed", "VDis"], PS = ["PMes", "PMed", "PDis"];
  const cSite = (f) => (t, s, rec, dis) => pfSiteCell(t, s, f, rec, dis);
  const cNic = (t, s, rec, dis) => pfNicCell(t, s, rec, dis);
  const cDot = (f) => (t, s, rec, dis) => pfDotCell(t, s, f, rec, dis);

  return `<div class="card pad pf-card" data-arch="${archKey}">
    <div class="pf-arch-head">
      <h3 class="card-title">${archKey === "upper" ? "Maxilar superior" : "Mandíbula"}</h3>
      <span class="hint">Vestibular arriba · ${innerSurfaceLabel(archKey)} abajo · orden mesial–medio–distal</span>
    </div>
    <div class="table-wrap pf-wrap">
      <table class="pf-grid" aria-label="Periodontograma ${archKey === "upper" ? "maxilar superior" : "mandíbula"}">
        <tbody>
          ${siteRow("Recesión", "V", VS, cSite("rec"))}
          ${siteRow("Sondaje", "V", VS, cSite("pd"))}
          ${siteRow("NIC", "V", VS, cNic)}
          ${siteRow("Sangrado", "V", VS, cDot("bop"))}
          ${siteRow("Placa", "V", VS, cDot("plaque"))}
          ${siteRow("Supuración", "V", VS, cDot("sup"))}
          ${toothRow("Diente", pfToothCell)}
          ${toothRow("Movilidad", (t, rec, dis) => pfSelectCell(t, rec, "mobility", dis))}
          ${toothRow("Furca", (t, rec, dis) => pfSelectCell(t, rec, "furcation", dis))}
          ${siteRow("Supuración", inner, PS, cDot("sup"))}
          ${siteRow("Placa", inner, PS, cDot("plaque"))}
          ${siteRow("Sangrado", inner, PS, cDot("bop"))}
          ${siteRow("Sondaje", inner, PS, cSite("pd"))}
          ${siteRow("NIC", inner, PS, cNic)}
          ${siteRow("Recesión", inner, PS, cSite("rec"))}
        </tbody>
      </table>
    </div>
  </div>`;
}

/* ------------- Vista gráfica (odontograma a boca completa) ---------------- */
/* Réplica educativa del gráfico de la ficha de Berna: dientes en tira
 * oclusal, círculos de sondaje coloreados por severidad, puntos de
 * BOP/placa/supuración, línea azul de NIC y filtros de hallazgos. */

const PF_G_SEV_FILL = { healthy: "#14915c1f", mild: "#d99a1726", moderate: "#e2601c26", severe: "#c2203526" };

/** Silueta dental simplificada (vista oclusal) según el tipo de diente. */
function pfToothShapeSVG(type, cx, cy, missing, selected) {
  const w = { incisivo: 34, canino: 31, premolar: 40, molar: 46 }[type] ?? 36;
  const h = 48;
  const top = cy - h / 2, x = cx - w / 2;
  const fill = missing ? "#eef0ef" : "#f6f3ea";
  const stroke = missing ? "#c6ccc9" : selected ? "#0d7a6e" : "#c9c4b8";
  const sw = selected ? 2.4 : 1.5;
  const rx = type === "canino" ? 15 : type === "incisivo" ? 8 : 10;
  const cusps = missing ? [] : type === "molar" ? [-13, 0, 13] : type === "premolar" ? [-8.5, 8.5] : [];
  const bumps = cusps.map((dx) => `<circle cx="${cx + dx}" cy="${top + 3}" r="4.5" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`).join("");
  return `<rect x="${x}" y="${top}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>${bumps}`;
}

/** ¿Se atenúa el sitio con el filtro activo? (mob atenúa a nivel de diente) */
function pfGDimSite(r, gf) {
  if (!gf || gf === "mob") return false;
  if (gf === "bop") return !r.bop;
  if (gf === "plaque") return !r.plaque;
  if (gf === "deep") return !(r.pd !== undefined && r.pd >= 6);
  if (gf === "rec") return !(r.rec > 0);
  return false;
}

/** Círculo de sondaje de un sitio con sus puntos de hallazgo. */
function pfGSiteSVG(store, t, s, x, y, recY, gf) {
  const rec = store.getTooth(t);
  const miss = !!rec.missing;
  const r = rec.sites?.[s] ?? {};
  const has = r.pd !== undefined;
  const sev = pdSeverity(r.pd);
  const dim = miss || pfGDimSite(r, gf);
  const fill = has ? PF_G_SEV_FILL[sev] : miss ? "#f2f4f3" : "#ffffff";
  const stroke = has ? SEVERITY_COLOR[sev] : "#cfd9d6";
  const txtCol = has ? SEVERITY_COLOR[sev] : "#b3bfbb";
  const title = `${t} · ${siteById(s).label}${has ? ` · sondaje ${fmtMm(r.pd)} mm` : ""}` +
    `${r.rec ? ` · recesión ${fmtMm(r.rec)} mm` : ""}${r.bop ? " · BOP+" : ""}${r.plaque ? " · placa" : ""}${r.sup ? " · supuración" : ""}`;
  return `<g class="pf-gsite ${dim ? "dim" : ""} ${miss ? "miss" : ""}" data-t="${t}" data-s="${s}" role="button" tabindex="-1" aria-label="${esc(title)}">
    <title>${esc(title)}</title>
    <circle cx="${x}" cy="${y}" r="10.5" fill="${fill}" stroke="${stroke}" stroke-width="${has ? 2 : 1.2}"/>
    <text x="${x}" y="${y + 3.4}" text-anchor="middle" font-size="9.5" font-weight="800" fill="${txtCol}">${has ? fmtMm(r.pd) : "·"}</text>
    ${r.bop ? `<circle cx="${x + 8.6}" cy="${y - 8.6}" r="4.4" fill="#c22035" stroke="#fff" stroke-width="1.2"/>` : ""}
    ${r.plaque ? `<circle cx="${x + 10.4}" cy="${y + 2.6}" r="3.5" fill="#d99a17" stroke="#fff" stroke-width="1"/>` : ""}
    ${r.sup ? `<circle cx="${x - 10.4}" cy="${y + 2.6}" r="3.5" fill="#7c3aed" stroke="#fff" stroke-width="1"/>` : ""}
    ${r.rec ? `<text x="${x}" y="${recY}" text-anchor="middle" font-size="8" font-weight="700" fill="#8a5a44">R${fmtMm(r.rec)}</text>` : ""}
  </g>`;
}

/** Tira oclusal de un arco completo (16 dientes × 6 sitios + curva de NIC). */
function pfGraphicArch(archKey, store, gf, selected) {
  const def = FULL_MOUTH[archKey];
  const teeth = [...def.right, ...def.left];
  const W = 42 + teeth.length * 66 + 4;
  const H = 196;
  const S_OFF = { Mes: -22, Med: 0, Dis: 22 };
  const xOf = (t, s) => 42 + teeth.indexOf(t) * 66 + S_OFF[s.slice(1)];
  const TOOTH_TOP = 80, TOOTH_BOT = 128, TOOTH_CY = 104;

  const calPath = (siteList, yOf) => {
    let d = "", pen = false;
    const dots = [];
    for (const t of teeth) {
      const rec = store.getTooth(t);
      if (rec.missing) { pen = false; continue; }
      for (const s of siteList) {
        const r = rec.sites?.[s];
        const cal = r?.pd !== undefined ? Math.round((r.pd + (r.rec ?? 0)) * 10) / 10 : undefined;
        if (cal === undefined) { pen = false; continue; }
        const x = xOf(t, s), y = yOf(cal);
        d += `${pen ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)} `;
        dots.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.6" fill="#3f7cac"/>`);
        pen = true;
      }
    }
    return { d: d.trim(), dots: dots.join("") };
  };
  const calV = calPath(["VMes", "VMed", "VDis"], (c) => Math.min(TOOTH_BOT - 3, TOOTH_TOP + 5 + c * 1.9));
  const calP = calPath(["PMes", "PMed", "PDis"], (c) => Math.max(TOOTH_TOP + 3, TOOTH_BOT - 5 - c * 1.9));

  const toothG = teeth.map((t, i) => {
    const cx = 42 + i * 66;
    const rec = store.getTooth(t);
    const miss = !!rec.missing;
    const mob = +rec.mobility || 0;
    const furc = rec.furcation && rec.furcation !== "—" ? rec.furcation : "";
    const dimT = gf === "mob" && !miss && !(mob >= 1 || furc);
    const isSel = selected && selected.t === t;
    const badges = !miss && (mob >= 1 || furc)
      ? `<text x="${cx}" y="142" text-anchor="middle" font-size="9" font-weight="800" fill="#5b6f6a">${mob >= 1 ? "M" + mob : ""}${furc ? `${mob >= 1 ? " · " : ""}F${furc}` : ""}</text>` : "";
    return `<g class="pf-gtooth ${dimT ? "dim" : ""} ${miss ? "miss" : ""}" data-t="${t}">
      <text x="${cx}" y="15" text-anchor="middle" font-size="12.5" font-weight="800" fill="${miss ? "#a8b5b1" : isSel ? "#0d7a6e" : "#3d4f4a"}">${t}</text>
      ${pfToothShapeSVG(toothType(t), cx, TOOTH_CY, miss, isSel)}
      ${miss ? `<line x1="${cx - 15}" y1="${TOOTH_TOP + 8}" x2="${cx + 15}" y2="${TOOTH_BOT - 8}" stroke="#b6c2be" stroke-width="2.4"/>
        <line x1="${cx + 15}" y1="${TOOTH_TOP + 8}" x2="${cx - 15}" y2="${TOOTH_BOT - 8}" stroke="#b6c2be" stroke-width="2.4"/>` : ""}
      ${badges}
    </g>`;
  }).join("");

  const VS = ["VMes", "VMed", "VDis"], PS = ["PMes", "PMed", "PDis"];
  const sites = teeth.flatMap((t) => [
    ...VS.map((s) => pfGSiteSVG(store, t, s, xOf(t, s), 48, 68, gf)),
    ...PS.map((s) => pfGSiteSVG(store, t, s, xOf(t, s), 176, 158, gf)),
  ]).join("");

  return `<svg class="pf-gfx" viewBox="0 0 ${W} ${H}" role="img" aria-label="Odontograma gráfico ${archKey === "upper" ? "maxilar superior" : "mandíbula"}">
    <text x="10" y="52" font-size="11" font-weight="800" fill="#93a5a0">V</text>
    <text x="10" y="180" font-size="11" font-weight="800" fill="#93a5a0">${PF_SURFACE[archKey]}</text>
    <g class="pf-gcal">
      <path d="${calV.d}" fill="none" stroke="#3f7cac" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>${calV.dots}
      <path d="${calP.d}" fill="none" stroke="#3f7cac" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>${calP.dots}
    </g>
    ${toothG}
    ${sites}
  </svg>`;
}

/** Recuento de hallazgos para las insignias de los filtros. */
function pfGFilterCounts(store) {
  const c = { bop: 0, deep: 0, plaque: 0, rec: 0, mob: 0 };
  for (const t of ALL_TEETH) {
    const rec = store.getTooth(t);
    if (rec.missing) continue;
    if ((+rec.mobility || 0) >= 1 || (rec.furcation && rec.furcation !== "—")) c.mob++;
    for (const s of SITE_IDS) {
      const r = rec.sites?.[s];
      if (!r || r.pd === undefined) continue;
      if (r.bop) c.bop++;
      if (r.plaque) c.plaque++;
      if (r.pd >= 6) c.deep++;
      if (r.rec > 0) c.rec++;
    }
  }
  return c;
}

/** Insignias-filtro (como los «Status» de la ficha de Berna). */
function gFilterChipsHTML(store, gf) {
  const c = pfGFilterCounts(store);
  const chips = [
    { id: "bop", label: "Sangrado BOP", color: "#c22035", n: c.bop },
    { id: "deep", label: "Bolsas ≥ 6 mm", color: "#e2601c", n: c.deep },
    { id: "plaque", label: "Placa", color: "#d99a17", n: c.plaque },
    { id: "rec", label: "Recesión", color: "#8a5a44", n: c.rec },
    { id: "mob", label: "Movilidad / furca", color: "#5b6f6a", n: c.mob },
  ];
  return chips.map((ch) => `<button class="pf-gchip ${gf === ch.id ? "on" : ""}" data-gf="${ch.id}" style="--gc:${ch.color}"
    title="Resaltar solo los sitios con ${ch.label.toLowerCase()}"><i></i>${ch.label}<b>${ch.n}</b></button>`).join("");
}

/** Sumario central entre los arcos (sondaje medio · NIC · BOP · placa). */
function pfSummaryHTML(store) {
  const sum = summarizeMouth(store);
  const c = (l, v, u) => `<div class="pf-sum-c"><span>${l}</span><b>${v}${u ? `<i>${u}</i>` : ""}</b></div>`;
  return `<div class="pf-sum" id="pf-sum" role="status" aria-label="Resumen de la boca">
    ${c("Sondaje medio", sum.avgPd !== null ? fmtMm(sum.avgPd) : "—", "mm")}
    ${c("NIC medio", sum.avgCal !== null ? fmtMm(sum.avgCal) : "—", "mm")}
    ${c("BOP", sum.recorded ? String(sum.bopPct ?? 0) : "—", "%")}
    ${c("Placa", sum.recorded ? String(sum.plaquePct ?? 0) : "—", "%")}
    ${c("Sitios", `${sum.recorded}/${sum.sites}`, "")}
    ${c("≥ 4 / ≥ 6 mm", `${sum.deep4} / ${sum.deep6}`, "")}
  </div>`;
}

/** Cuerpo de la vista gráfica (dos arcos + sumario) reutilizable. */
function graphicBodyHTML(store, gf, selected) {
  const archRow = (key) => `<div class="pf-gfx-arch">
      <b>${key === "upper" ? "Maxilar superior" : "Mandíbula"}</b>
      <span class="hint">vestibular arriba · ${innerSurfaceLabel(key).toLowerCase()} abajo · línea azul: nivel de inserción (NIC)</span>
    </div>${pfGraphicArch(key, store, gf, selected)}`;
  return `${archRow("upper")}${pfSummaryHTML(store)}${archRow("lower")}`;
}

/** Tarjeta completa de la vista gráfica (dos arcos + sumario + filtros). */
function graphicCardHTML(store, gf, selected) {
  return `<div class="card pad pf-card pf-gfx-card" data-arch="gfx">
    <div class="pf-arch-head">
      <h3 class="card-title">${icon("line-chart", 15)} Ficha gráfica</h3>
      <div class="pf-gfilters" role="group" aria-label="Filtros de hallazgos">${gFilterChipsHTML(store, gf)}</div>
    </div>
    <div class="table-wrap pf-wrap">${graphicBodyHTML(store, gf, selected)}</div>
    <p class="hint">Pulsa un círculo para ver el detalle del sitio en el panel lateral. Los valores se
    editan en la vista «Tabla», en la simulación 3D o con los ejercicios; el gráfico se actualiza solo.</p>
  </div>`;
}

/* ------- Vista «Ficha clínica» (pantalla estilo perio-tools/Berna) ---------
 * Réplica educativa de la ficha de periodontalchart-online.com: tabla por
 * columnas de diente (Diente · Movilidad · Furca · Sangrado · Placa ·
 * Supuración · Recesión · Sondaje · NIC) y, en el centro de cada arcada,
 * la banda gráfica de la ficha de Berna:
 *  - dientes dibujados (corona vestibular + corona interna) sobre la línea
 *    amelocementaria (0 mm);
 *  - grilla negra de 1 mm por línea (16 mm), 6.45 px por mm como la ficha;
 *  - línea ROJA = margen gingival (recesión desde el CEJ);
 *  - línea AZUL = fondo del sondaje (bolsa);
 *  - polígono AZUL MARINO translúcido entre ambas = profundidad real de
 *    la bolsa sobre el diente;
 *  - puntos de BOP (rojo) sobre el margen, placa (azul) hacia coronal y
 *    supuración (violeta) hacia apical.
 * La banda vestibular mide hacia arriba desde el CEJ y la interna hacia
 * abajo, como en la referencia. Botón ST/BOP para alternar la banda entre
 * vista de sondaje y vista de sangrado.
 */

const PT_GEOM = {
  LAB: 88,              // ancho de la columna de etiquetas (px)
  TW: 44,               // ancho por diente (px)
  MM: 6.45,             // px por milímetro (como la ficha de Berna)
  STRIP: 162,           // alto de cada banda (vestibular / interna)
  CEJ_V: 106,           // y del CEJ en la banda vestibular (mide hacia arriba)
  CEJ_P: 53,            // y del CEJ en la banda interna (mide hacia abajo)
  MAX_MM: 16,           // líneas de la grilla
  get W() { return this.LAB + 16 * this.TW; },   // 792
  get H() { return this.STRIP * 2; },            // 324
  get CEJ_PG() { return this.STRIP + this.CEJ_P; }, // 215 · CEJ interno global
};

/** Orden visual izquierda→derecha de los sitios dentro de la columna del diente
 * (mesial hacia la línea media, como el sondaje clínico). */
const ptSiteSeq = (t) => (String(t)[0] === "1" || String(t)[0] === "4"
  ? ["Dis", "Med", "Mes"]
  : ["Mes", "Med", "Dis"]);

/** Centro x de la columna del diente y abcisas de sus tres sitios. */
const ptX = (teeth, t) => PT_GEOM.LAB + teeth.indexOf(t) * PT_GEOM.TW + PT_GEOM.TW / 2;
const ptSiteXs = (teeth, t) => ptSiteSeq(t).map((_, i) => ptX(teeth, t) + (i - 1) * 14);

/** Perfiles de corona por tipo de diente (coordenadas locales: y=0 en el CEJ,
 * borde incisal hacia abajo; se espejan para la superficie interna). */
const PT_CROWN = {
  incisivo: { w: 30, d: "M1 0 H29 V24 Q29 44 16 46 Q15 46.5 14 46 Q1 44 1 24 Z" },
  canino: { w: 31, d: "M1 0 H30 V22 Q30 34 15.5 50 Q1 34 1 22 Z" },
  premolar: { w: 37, d: "M1 0 H36 V22 Q36 40 28 42 Q22.5 43 19.5 37 Q16.5 43 10 42 Q1 40 1 22 Z" },
  molar: { w: 42, d: "M1 0 H41 V18 Q41 38 32 41 Q26.5 42 23.5 36 Q20.5 42 14 42 Q8.5 42 6.5 36 Q3.5 42 1 38 Z" },
};

/** Corona del diente (vestibular o interna) anclada a su línea del CEJ. */
function ptCrownSVG(t, surf, cx, missing) {
  const type = toothType(t);
  const { w, d } = PT_CROWN[type] ?? PT_CROWN.premolar;
  const cejY = surf === "V" ? PT_GEOM.CEJ_V : PT_GEOM.CEJ_PG;
  const tx = cx - w / 2;
  const tr = surf === "V"
    ? `translate(${tx.toFixed(1)} ${cejY})`
    : `translate(${tx.toFixed(1)} ${cejY}) scale(1 -1)`;
  const fill = missing ? "#ececec" : "#F2F2F2";
  const stroke = missing ? "#b6c2be" : "#101010";
  return `<g transform="${tr}">
    <path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="1.4" stroke-linejoin="round"/>
    <path d="M0 0 Q${w / 2} 4 ${w} 0" fill="none" stroke="#9a9a9a" stroke-width="1"/>
  </g>`;
}

/** Grupo SVG de un diente y superficie: corona + líneas GM/PD + polígono +
 * puntos de hallazgos + zonas pulsables por sitio. */
function ptToothGroup(t, surf, teeth, s) {
  const rec = s.getTooth(t);
  const missing = !!rec.missing;
  const seq = ptSiteSeq(t).map((k) => surf + k);
  const xs = ptSiteXs(teeth, t);
  const cx = ptX(teeth, t);
  const cejY = surf === "V" ? PT_GEOM.CEJ_V : PT_GEOM.CEJ_PG;
  const yOf = (mm) => surf === "V" ? cejY - mm * PT_GEOM.MM : cejY + mm * PT_GEOM.MM;

  const pts = seq.map((sid, i) => {
    const r = rec.sites?.[sid] ?? {};
    const has = r.pd !== undefined || (r.rec ?? 0) > 0;
    const gm = r.rec ?? 0;
    return { sid, x: xs[i], r, has, gmY: yOf(gm), pdY: yOf(gm + (r.pd ?? 0)) };
  });

  /* tramos contiguos de sitios registrados (como el bolígrafo en la ficha) */
  const runs = [];
  let cur = null;
  for (const p of pts) {
    if (!p.has) { cur = null; continue; }
    if (!cur) { cur = []; runs.push(cur); }
    cur.push(p);
  }

  const n1 = (v) => v.toFixed(1);
  const pocket = runs.map((run) => {
    const gpts = run.map((p) => `${n1(p.x)},${n1(p.gmY)}`).join(" ");
    const dpts = run.map((p) => `${n1(p.x)},${n1(p.pdY)}`).join(" ");
    const dpRev = [...run].reverse().map((p) => `${n1(p.x)},${n1(p.pdY)}`).join(" ");
    return `<polygon class="pt-poly" points="${gpts} ${dpRev}" fill="#000080" fill-opacity="0.5"/>
      <polyline class="pt-gm" points="${gpts}" fill="none" stroke="#e8132a" stroke-width="3"/>
      <polyline class="pt-pd" points="${dpts}" fill="none" stroke="#0038d8" stroke-width="3"/>`;
  }).join("");

  const crownOff = surf === "V" ? 7 : -7;
  const dots = pts.filter((p) => p.has).map((p) => {
    const ttl = `${p.r.pd !== undefined ? `sondaje ${fmtMm(p.r.pd)} mm` : ""}${p.r.rec ? `${p.r.pd !== undefined ? " · " : ""}recesión ${fmtMm(p.r.rec)} mm` : ""}`;
    return `${p.r.bop ? `<circle class="pt-bopdot s" cx="${n1(p.x)}" cy="${n1(p.gmY)}" r="3.4" fill="#e8132a" stroke="#fff" stroke-width="1"/>
      <circle class="pt-bopdot b" cx="${n1(p.x)}" cy="${n1(p.gmY)}" r="6.4" fill="#e8132a" stroke="#fff" stroke-width="1.6"/>` : ""}
      ${p.r.plaque ? `<circle cx="${n1(p.x)}" cy="${n1(p.gmY + crownOff)}" r="2.9" fill="#09f" stroke="#fff" stroke-width="0.8"/>` : ""}
      ${p.r.sup ? `<circle cx="${n1(p.x)}" cy="${n1(p.gmY - crownOff)}" r="2.9" fill="#7c3aed" stroke="#fff" stroke-width="0.8"/>` : ""}`;
  }).join("");

  const hitY = surf === "V" ? 3 : PT_GEOM.STRIP + 57;
  const hitH = surf === "V" ? 100 : 96;
  const hits = pts.map((p) => `<rect class="pt-hit pf-gsite" data-t="${t}" data-s="${p.sid}"
    x="${n1(p.x - 7)}" y="${hitY}" width="14" height="${hitH}" fill="transparent">
    <title>${t} · ${siteById(p.sid).label}${p.r.pd !== undefined ? ` · sondaje ${fmtMm(p.r.pd)} mm` : ""}${p.r.rec ? ` · recesión ${fmtMm(p.r.rec)} mm` : ""}${p.r.bop ? " · BOP+" : ""}${p.r.plaque ? " · placa" : ""}${p.r.sup ? " · supuración" : ""}</title></rect>`).join("");

  const xMark = missing
    ? `<g class="pt-x"><line x1="${cx - 14}" y1="${cejY + 6}" x2="${cx + 14}" y2="${cejY + 48}" stroke="#c22035" stroke-width="2.4"/>
       <line x1="${cx + 14}" y1="${cejY + 6}" x2="${cx - 14}" y2="${cejY + 48}" stroke="#c22035" stroke-width="2.4"/></g>` : "";

  const mob = +rec.mobility || 0;
  const furc = rec.furcation && rec.furcation !== "—" ? rec.furcation : "";
  const title = `${t} · ${pfToothName(t)}${missing ? " · ausente" : ""}${mob >= 1 ? ` · movilidad grado ${mob}` : ""}${furc ? ` · furca ${furc}` : ""}`;

  return `<g class="pt-tg ${missing ? "miss" : ""}" data-t="${t}" data-surf="${surf}">
    <title>${esc(title)}</title>
    ${ptCrownSVG(t, surf, cx, missing)}
    ${missing ? xMark : `${pocket}${dots}`}
    ${hits}
  </g>`;
}

/** Banda gráfica completa de una arcada (vestibular arriba · interna abajo). */
function ptBandSVG(archKey, teeth, s) {
  const lines = [];
  for (let mm = 0; mm <= PT_GEOM.MAX_MM; mm++) {
    const w = mm % 5 === 0 ? 1.6 : 1.1;
    lines.push(`<line x1="${PT_GEOM.LAB}" y1="${(PT_GEOM.CEJ_V - mm * PT_GEOM.MM).toFixed(2)}" x2="${PT_GEOM.W}" y2="${(PT_GEOM.CEJ_V - mm * PT_GEOM.MM).toFixed(2)}" stroke="#101010" stroke-width="${w}"/>`);
    lines.push(`<line x1="${PT_GEOM.LAB}" y1="${(PT_GEOM.CEJ_PG + mm * PT_GEOM.MM).toFixed(2)}" x2="${PT_GEOM.W}" y2="${(PT_GEOM.CEJ_PG + mm * PT_GEOM.MM).toFixed(2)}" stroke="#101010" stroke-width="${w}"/>`);
  }
  const mmLab = (mm, y) => `<text class="pt-mm" x="${PT_GEOM.LAB - 5}" y="${y + 2.4}">${mm}</text>`;
  const labs = [0, 5, 10, 15].flatMap((mm) => [
    mmLab(mm, PT_GEOM.CEJ_V - mm * PT_GEOM.MM),
    mmLab(mm, PT_GEOM.CEJ_PG + mm * PT_GEOM.MM),
  ]).join("");

  const groups = teeth.map((t) => ptToothGroup(t, "V", teeth, s) + ptToothGroup(t, "P", teeth, s)).join("");
  const inner = innerSurfaceLabel(archKey);

  return `<svg class="pt-band" viewBox="0 0 ${PT_GEOM.W} ${PT_GEOM.H}" data-arch="${archKey}"
    role="img" aria-label="Gráfico periodontal ${archKey === "upper" ? "maxilar superior" : "mandíbula"}">
    <rect class="pt-bg" x="${PT_GEOM.LAB}" y="2" width="${PT_GEOM.W - PT_GEOM.LAB}" height="${PT_GEOM.H - 4}" fill="#fff"/>
    <text class="pt-sf-lab" x="8" y="${PT_GEOM.CEJ_V - 26}">V</text>
    <text class="pt-sf-lab" x="8" y="${PT_GEOM.CEJ_PG + 40}">${archKey === "upper" ? "P" : "L"}</text>
    <g class="pt-grid">${lines.join("")}${labs}</g>
    <line x1="${PT_GEOM.LAB}" y1="${PT_GEOM.CEJ_V}" x2="${PT_GEOM.W}" y2="${PT_GEOM.CEJ_V}" stroke="#101010" stroke-width="2.2"/>
    <line x1="${PT_GEOM.LAB}" y1="${PT_GEOM.CEJ_PG}" x2="${PT_GEOM.W}" y2="${PT_GEOM.CEJ_PG}" stroke="#101010" stroke-width="2.2"/>
    <text class="pt-cej-lab" x="${PT_GEOM.LAB - 5}" y="${PT_GEOM.CEJ_V + 14}">CEJ</text>
    <text class="pt-cej-lab" x="${PT_GEOM.LAB - 5}" y="${PT_GEOM.CEJ_PG - 8}">CEJ</text>
    <text class="pt-zone" x="${PT_GEOM.LAB + 8}" y="16">VESTIBULAR · mm desde el CEJ</text>
    <text class="pt-zone" x="${PT_GEOM.LAB + 8}" y="${PT_GEOM.H - 7}">${inner.toUpperCase()} · mm desde el CEJ</text>
    ${groups}
  </svg>`;
}

/* ------------------- filas de la tabla de la ficha ------------------------ */

function ptRowHTML(label, surfChip, cells, cls = "") {
  return `<div class="pt-row ${cls}">
    <div class="pt-lab"><span>${label}</span>${surfChip ? `<b class="pt-sf ${surfChip === "V" ? "v" : "p"}">${surfChip}</b>` : ""}</div>
    ${cells.join("")}
  </div>`;
}

function ptToothNumCell(t, rec) {
  const mob = +rec.mobility || 0;
  const furc = rec.furcation && rec.furcation !== "—" ? rec.furcation : "";
  return `<div class="pt-cell pt-num pf-tooth ${rec.missing ? "is-missing" : ""}" data-t="${t}">
    <button class="pf-tbtn" data-t="${t}" title="${esc(pfToothName(t))} · clic para ausencia y limpieza">${t}</button>
    ${mob >= 1 ? `<span class="pf-badge-mob" title="Movilidad grado ${mob}">M${mob}</span>` : ""}
    ${furc ? `<span class="pf-badge-furc" title="Furca grado ${furc}">F${furc}</span>` : ""}
  </div>`;
}

/** Fila completa de una arcada (tabla + banda gráfica + tabla interna). */
function ptJawHTML(archKey, s) {
  const teeth = [...FULL_MOUTH[archKey].right, ...FULL_MOUTH[archKey].left];

  const cellInput = (t, surf, f) => {
    const rec = s.getTooth(t);
    const dis = !!rec.missing;
    const inner = ptSiteSeq(t).map((k) => {
      const sid = surf + k;
      const v = rec.sites?.[sid]?.[f];
      return `<input class="pf-in" data-t="${t}" data-s="${sid}" data-f="${f}" inputmode="decimal" maxlength="4"
        value="${v !== undefined && v !== null ? fmtMm(v) : ""}" ${dis ? "disabled" : ""}
        aria-label="${t} ${siteById(sid).label} ${f === "pd" ? "sondaje" : "recesión"} en mm">`;
    }).join("");
    return `<div class="pt-cell pf-c pt-g3 ${dis ? "pf-m" : ""}" data-t="${t}">${inner}</div>`;
  };

  const cellNic = (t, surf) => {
    const rec = s.getTooth(t);
    const dis = !!rec.missing;
    const inner = ptSiteSeq(t).map((k) => {
      const sid = surf + k;
      const r = rec.sites?.[sid];
      const cal = r?.pd !== undefined ? Math.round((r.pd + (r.rec ?? 0)) * 10) / 10 : undefined;
      return `<span class="pf-nic" data-t="${t}" data-s="${sid}" data-f="nic" title="NIC = sondaje + recesión">${cal !== undefined ? fmtMm(cal) : "·"}</span>`;
    }).join("");
    return `<div class="pt-cell pf-c pt-g3 pt-nicg ${dis ? "pf-m" : ""}" data-t="${t}">${inner}</div>`;
  };

  const cellDots = (t, surf, f) => {
    const rec = s.getTooth(t);
    const dis = !!rec.missing;
    const kind = f === "bop" ? "bop" : f === "plaque" ? "plq" : "sup";
    const label = f === "bop" ? "sangrado" : f === "plaque" ? "placa" : "supuración";
    const inner = ptSiteSeq(t).map((k) => {
      const sid = surf + k;
      const on = !!rec.sites?.[sid]?.[f];
      return `<button class="pf-dot ${kind} ${on ? "on" : ""}" data-t="${t}" data-s="${sid}" data-f="${f}"
        ${dis ? "disabled" : ""} aria-label="${t} ${siteById(sid).label}: ${label} ${on ? "positivo" : "negativo"}"></button>`;
    }).join("");
    return `<div class="pt-cell pf-c pt-g3 ${dis ? "pf-m" : ""}" data-t="${t}">${inner}</div>`;
  };

  const cellSel = (t, f) => {
    const rec = s.getTooth(t);
    const dis = !!rec.missing;
    if (f === "mobility") {
      const v = +rec.mobility || 0;
      return `<div class="pt-cell ${dis ? "pf-m" : ""}" data-t="${t}">
        <select class="pf-sel" data-t="${t}" data-f="mobility" ${dis ? "disabled" : ""} aria-label="Movilidad diente ${t}">
          ${[0, 1, 2, 3].map((m) => `<option value="${m}" ${v === m ? "selected" : ""}>${m}</option>`).join("")}
        </select></div>`;
    }
    const isMolar = MOLAR_SET.has(t);
    const v = rec.furcation || "—";
    return `<div class="pt-cell ${dis ? "pf-m" : ""}" data-t="${t}">
      <select class="pf-sel" data-t="${t}" data-f="furcation" ${dis || !isMolar ? "disabled" : ""} ${!isMolar ? 'title="Diente sin furca explorable"' : ""} aria-label="Furca diente ${t}">
        ${["—", "I", "II", "III"].map((g) => `<option value="${g}" ${v === g ? "selected" : ""}>${g}</option>`).join("")}
      </select></div>`;
  };

  return `<div class="pt-jaw" data-arch="${archKey}">
    <div class="pt-jaw-title">${archKey === "upper" ? "MAXILAR SUPERIOR" : "MANDÍBULA"} · FDI</div>
    <div class="pt-chart">
      ${ptRowHTML("Diente", null, teeth.map((t) => ptToothNumCell(t, s.getTooth(t))))}
      ${ptRowHTML("Movilidad", null, teeth.map((t) => cellSel(t, "mobility")), "pt-r-num")}
      ${ptRowHTML("Furca", null, teeth.map((t) => cellSel(t, "furcation")), "pt-r-num")}
      ${ptRowHTML("Sangrado", "V", teeth.map((t) => cellDots(t, "V", "bop")))}
      ${ptRowHTML("Placa", "V", teeth.map((t) => cellDots(t, "V", "plaque")))}
      ${ptRowHTML("Supuración", "V", teeth.map((t) => cellDots(t, "V", "sup")))}
      ${ptRowHTML("Recesión", "V", teeth.map((t) => cellInput(t, "V", "rec")))}
      ${ptRowHTML("Sondaje", "V", teeth.map((t) => cellInput(t, "V", "pd")))}
      ${ptRowHTML("NIC", "V", teeth.map((t) => cellNic(t, "V")), "pt-r-ro")}
      <div class="pt-band-wrap pf-wrap">${ptBandSVG(archKey, teeth, s)}</div>
      ${ptRowHTML("NIC", "P", teeth.map((t) => cellNic(t, "P")), "pt-r-ro")}
      ${ptRowHTML("Sondaje", "P", teeth.map((t) => cellInput(t, "P", "pd")))}
      ${ptRowHTML("Recesión", "P", teeth.map((t) => cellInput(t, "P", "rec")))}
      ${ptRowHTML("Supuración", "P", teeth.map((t) => cellDots(t, "P", "sup")))}
      ${ptRowHTML("Placa", "P", teeth.map((t) => cellDots(t, "P", "plaque")))}
      ${ptRowHTML("Sangrado", "P", teeth.map((t) => cellDots(t, "P", "bop")))}
    </div>
  </div>`;
}

/** Barra de control estilo perio-tools (blanca, con iconos, sobre fondo azul). */
function ptBarHTML(mode) {
  return `<div class="pt-bar">
    <button class="pt-btn" id="pt-print" title="Imprimir la ficha">${icon("printer", 14)}<span>Imprimir</span></button>
    <button class="pt-btn" id="pt-csv" title="Exportar en CSV">${icon("download", 14)}<span>Exportar</span></button>
    <button class="pt-btn ${mode === "bop" ? "on" : ""}" id="pt-mode" title="Alternar la banda gráfica: sondaje (líneas roja/azul) o sangrado BOP">
      ${icon("rotate-ccw", 14)}<span>ST/BOP</span><b class="pt-mode-lab">${mode === "bop" ? "BOP" : "Sondaje"}</b></button>
    <button class="pt-btn danger" id="pt-clear" title="Limpiar toda la boca">${icon("trash", 14)}<span>Limpiar</span></button>
    <span class="pt-bar-note">Ficha de periodontograma · diseño basado en periodontalchart-online.com (perio-tools)</span>
  </div>`;
}

/** Cabecera de paciente compacta dentro de la ficha (modo libre). */
function ptHeaderHTML() {
  const h = Perio.header();
  return `<div class="pt-head">
    <label class="pt-hf"><span>Paciente</span><input class="input" id="pf-h-patient" value="${esc(h.patient)}" placeholder="Nombre o iniciales" maxlength="60"></label>
    <label class="pt-hf"><span>Fecha</span><input class="input" type="date" id="pf-h-date" value="${esc(h.date)}"></label>
    <label class="pt-hf"><span>Notas clínicas</span><input class="input" id="pf-h-notes" value="${esc(h.notes)}" placeholder="Observaciones" maxlength="140"></label>
    <div class="pt-hf"><span>Fumador/a</span><span class="pf-h-sw" id="pf-h-smoker"></span></div>
    <div class="pt-hf"><span>Alergias</span><span class="pf-h-sw" id="pf-h-allergies"></span></div>
  </div>`;
}

/** Leyenda breve de la banda gráfica. */
function ptLegendHTML() {
  return `<div class="pt-leg">
    <span><i class="l-gm"></i> Margen gingival</span>
    <span><i class="l-pd"></i> Fondo del sondaje</span>
    <span><i class="l-pk"></i> Bolsa</span>
    <span><i class="l-bop"></i> BOP</span>
    <span><i class="l-plq"></i> Placa</span>
    <span><i class="l-sup"></i> Supuración</span>
    <span class="pt-leg-mm">Grilla: 1 mm por línea · CEJ = 0 mm · las medidas crecen alejándose del diente</span>
  </div>`;
}

/** Pantalla completa de la ficha (barra + cabecera + dos arcadas + sumario). */
function fichaScreenHTML(s, { editable = true, mode = "st" } = {}) {
  return `<div class="pf-ficha">
    ${ptBarHTML(mode)}
    ${editable ? ptHeaderHTML() : ""}
    <div class="pt-screen">
      ${ptJawHTML("upper", s)}
      <div class="pt-sum">${pfSummaryHTML(s)}</div>
      ${ptJawHTML("lower", s)}
      ${ptLegendHTML()}
    </div>
  </div>`;
}

function renderPerioFull(root) {
  /* ---- estado de la vista ---- */
  const st = {
    mode: "libre",            // 'libre' | 'ejercicio'
    exerciseId: CHART_EXERCISES[0].id,
    exMode: "sheet",          // 'sheet' | 'dictation'
    regionId: "Q1",
    started: false,
    draft: createDraftStore({}),
    targets: null,
    dictState: null,          // { order: [{t,s}], idx }
    result: null,
    selected: null,           // { t, s }
    selfEdit: false,
    exStartedAt: 0,
    view: _pfView,            // 'ficha' | 'tabla' | 'grafico'
    gFilter: null,            // null | 'bop' | 'deep' | 'plaque' | 'rec' | 'mob'
    pairEntry: _pfPair,       // Intro: rec→pd del mismo sitio
    ptMode: "st",             // banda gráfica de la ficha: 'st' (sondaje) | 'bop'
  };
  const store = () => (st.mode === "libre" ? Perio : st.draft);
  storeRef.current = store();

  /* ---- encabezado y cabeceras ---- */

  /** Modo (libre/ejercicio) + vista (tabla/gráfico) en una sola barra. */
  function toolbarHTML(showMode) {
    return `<div class="pf-toolbar">
      ${showMode ? `<div class="pf-seg" role="tablist" aria-label="Modo del periodontograma">
        <button class="pf-seg-btn ${st.mode === "libre" ? "active" : ""}" data-seg="libre" role="tab">Modo libre</button>
        <button class="pf-seg-btn ${st.mode === "ejercicio" ? "active" : ""}" data-seg="ejercicio" role="tab">Practicar con ejercicio</button>
      </div>` : ""}
      <div class="pf-seg pf-seg-view" role="group" aria-label="Vista de la ficha">
        <button class="pf-seg-btn ${st.view === "ficha" ? "active" : ""}" data-vseg="ficha" title="Ficha clínica de llenado, como periodontalchart-online.com">${icon("clipboard-list", 13)} Ficha clínica</button>
        <button class="pf-seg-btn ${st.view === "tabla" ? "active" : ""}" data-vseg="tabla" title="Grilla numérica editable">${icon("list-checks", 13)} Tabla</button>
        <button class="pf-seg-btn ${st.view === "grafico" ? "active" : ""}" data-vseg="grafico" title="Odontograma gráfico">${icon("line-chart", 13)} Gráfico</button>
      </div>
    </div>`;
  }

  function headerCardHTML() {
    const h = Perio.header();
    return `<div class="card pad pf-hdr">
      <div class="pf-hdr-head">
        <h3 class="card-title">${icon("user", 15)} Datos del paciente</h3>
        <span class="hint">${icon("save", 12)} Guardado automático en este navegador</span>
      </div>
      <div class="pf-hdr-grid">
        <label class="field"><span>Paciente</span><input class="input" id="pf-h-patient" value="${esc(h.patient)}" placeholder="Nombre o iniciales" maxlength="60"></label>
        <label class="field"><span>Fecha del registro</span><input class="input" type="date" id="pf-h-date" value="${esc(h.date)}"></label>
        <div class="field"><span>Fumador/a</span><span class="pf-h-sw" id="pf-h-smoker"></span></div>
        <div class="field"><span>Alergias</span><span class="pf-h-sw" id="pf-h-allergies"></span></div>
        <label class="field pf-h-notes"><span>Notas clínicas</span><input class="input" id="pf-h-notes" value="${esc(h.notes)}" placeholder="Observaciones del examen" maxlength="140"></label>
      </div>
    </div>`;
  }

  function caseCardHTML() {
    const ex = chartExerciseById(st.exerciseId);
    const p = ex.patient;
    return `<div class="card pad pf-case">
      <div class="pf-case-head">
        <span class="badge subtle">Ejercicio en curso</span>
        <b>${esc(ex.title)}</b>
        <span class="chip ${ex.level === "Inicial" ? "teal" : ex.level === "Básico" ? "amber" : "rose"}">${ex.level}</span>
        <button class="btn small ghost" id="pf-quit">${icon("x", 13)} Abandonar</button>
      </div>
      <div class="badge-row">
        <span class="chip slate">${icon("user", 12)} ${esc(p.name)} · ${p.age} años</span>
        <span class="chip slate">${icon("clock", 12)} ${esc(p.date)}</span>
        ${p.smoker ? `<span class="chip amber">Fumador/a</span>` : ""}
        ${p.allergies ? `<span class="chip rose">Alergias</span>` : ""}
        <span class="chip teal">${st.exMode === "sheet" ? "Hoja del examinador" : "Dictado · " + esc(CHART_REGIONS.find((r) => r.id === st.regionId).label)}</span>
      </div>
      <p class="hint">${esc(p.notes)}</p>
    </div>`;
  }

  function pickerHTML() {
    return `<div class="card pad" id="pf-picker">
      <h3 class="card-title primary">${icon("clipboard-list", 16)} Practicar el llenado</h3>
      <p class="hint mb">Elige un caso: lee la hoja del examinador (o sigue el dictado) y transcribe los hallazgos
      en la grilla. La corrección puntúa sondaje, sangrado, recesión, placa, movilidad, furca y ausencias.</p>
      <div class="pf-ex-list">
        ${CHART_EXERCISES.map((ex) => `
        <label class="pf-ex ${st.exerciseId === ex.id ? "sel" : ""}">
          <input type="radio" name="pf-ex" value="${ex.id}" ${st.exerciseId === ex.id ? "checked" : ""}>
          <span class="pf-ex-body">
            <b>${esc(ex.title)}</b>
            <span class="hint">${esc(ex.subtitle)}</span>
            <span class="pf-ex-meta">${esc(ex.patient.name)} · ${ex.patient.age} años · ${ex.patient.smoker ? "fumador" : "no fumador"}</span>
          </span>
          <span class="chip ${ex.level === "Inicial" ? "teal" : ex.level === "Básico" ? "amber" : "rose"}">${ex.level}</span>
        </label>`).join("")}
      </div>
      <div class="grid-2 mt">
        <label class="field"><span>Modo de práctica</span>
          <select class="select" id="pf-exmode">
            <option value="sheet" ${st.exMode === "sheet" ? "selected" : ""}>Transcripción con hoja del examinador</option>
            <option value="dictation" ${st.exMode === "dictation" ? "selected" : ""}>Dictado por cuadrante</option>
          </select></label>
        <label class="field" id="pf-region-field">
          <span>Cuadrante del dictado</span>
          <select class="select" id="pf-region" ${st.exMode === "dictation" ? "" : "disabled"}>
            ${CHART_REGIONS.map((r) => `<option value="${r.id}" ${st.regionId === r.id ? "selected" : ""}>${r.label}</option>`).join("")}
          </select></label>
      </div>
      <div class="btn-row mt">
        <button class="btn primary" id="pf-start">${icon("play", 15)} Comenzar ejercicio</button>
        <span class="hint">Los ejercicios usan un borrador aislado: no alteran tu registro libre.</span>
      </div>
    </div>`;
  }

  function legendHTML() {
    const h = store().header?.() ?? {};
    return `<div class="card pad pf-legend">
      <div class="perio-chart-head" style="margin-bottom:4px">
        <div class="legend">
          <span><i style="background:${SEVERITY_COLOR.healthy}"></i> 0–3</span>
          <span><i style="background:${SEVERITY_COLOR.mild}"></i> 3–4</span>
          <span><i style="background:${SEVERITY_COLOR.moderate}"></i> 4–6</span>
          <span><i style="background:${SEVERITY_COLOR.severe}"></i> ≥ 6</span>
        </div>
        <div class="pf-dots-legend">
          <span><i class="pf-dot bop on"></i> Sangrado</span>
          <span><i class="pf-dot plq on"></i> Placa</span>
        </div>
      </div>
      ${st.view === "tabla" ? `<div class="ctl-row pf-pair-row">
        <span class="ctl-label">Intro por sitio <span class="pf-pair-hint">recesión → sondaje del mismo sitio, como el sondaje clínico</span></span>
        <span class="pf-h-sw" id="pf-pair"></span>
      </div>` : ""}
      ${st.view === "ficha" ? `<p class="hint">Ficha clínica estilo periodontalchart-online.com: tabla de llenado con dientes FDI, píldoras de
      sangrado (rojo), placa (azul) y supuración (violeta), y banda gráfica central con la grilla de mm, el margen gingival
      (línea roja), el fondo del sondaje (línea azul) y la bolsa (polígono azul marino) sobre los dientes. Escribe sondaje y
      recesión y pulsa Intro; el NIC y la banda se recalculan al momento. Pulsa un punto de la banda para ver el detalle del
      sitio; el botón ST/BOP alterna la vista de sondaje y la de sangrado.</p>`
        : st.view === "tabla" ? `<p class="hint">Sondaje y recesión en mm · escribe y pulsa Intro para saltar a la siguiente celda · el NIC se calcula
      solo · pulsa el <b>número del diente</b> para marcarlo ausente o limpiarlo · superficie interna:
      ${innerSurfaceLabel("upper")} (superior) / ${innerSurfaceLabel("lower")} (inferior) · con «Ficha clínica» llenas la ficha
      estilo perio-tools y con «Gráfico» ves el odontograma con filtros de hallazgos.</p>`
        : `<p class="hint">Pulsa un círculo para ver el detalle del sitio en el panel lateral. Los valores se
      editan en la vista «Tabla», en la «Ficha clínica», en la simulación 3D o con los ejercicios; el gráfico se actualiza solo.</p>`}
      <div class="pf-print-head"><b>PERIODONTOGRAMA · AR PERIO</b><span>${esc(h.patient || "Paciente")}${h.date ? " · " + esc(h.date) : ""}</span></div>
    </div>`;
  }

  /* ---- panel lateral ---- */

  function indicesCardHTML() {
    return `<div class="card pad"><h3 class="card-title">${icon("activity", 15)} Resumen clínico</h3>
      <div id="pf-indices">${indicesInnerHTML()}</div></div>`;
  }

  function indicesInnerHTML() {
    const sum = summarizeMouth(store());
    const chip = (l, v) => `<div class="chip-box"><span>${l}</span><b>${v}</b></div>`;
    return `<div class="pf-chips">
      ${chip("Sitios", `${sum.recorded}/${sum.sites}`)}
      ${chip("Sond. medio", sum.avgPd !== null ? fmtMm(sum.avgPd) + " mm" : "—")}
      ${chip("BOP", sum.recorded ? `${sum.bopPct ?? 0} %` : "—")}
      ${chip("Placa", sum.recorded ? `${sum.plaquePct ?? 0} %` : "—")}
      ${chip("≥ 4 mm", sum.deep4)}
      ${chip("≥ 6 mm", sum.deep6)}
      ${chip("NIC medio", sum.avgCal !== null ? fmtMm(sum.avgCal) + " mm" : "—")}
      ${chip("NIC máx", sum.maxCal !== null ? fmtMm(sum.maxCal) + " mm" : "—")}
      ${chip("Movilidad", sum.mobTeeth)}
      ${chip("Furcas", sum.furcTeeth)}
      ${chip("Dientes", sum.teethPresent)}
    </div>
    <div class="pf-interp">${interpretMouth(sum) || '<p class="hint">Registra sitios para ver la interpretación automática.</p>'}</div>`;
  }

  function siteCardHTML() {
    if (!st.selected) return `<h3 class="card-title">Sitio seleccionado</h3>
      <p class="hint">Haz clic en una celda de sondaje o recesión para consultar aquí sus signos
      (sangrado, placa, supuración) y el nivel de inserción.</p>`;
    const rec = store().getTooth(st.selected.t).sites[st.selected.s] ?? {};
    const cal = rec.pd !== undefined ? Math.round((rec.pd + (rec.rec ?? 0)) * 10) / 10 : undefined;
    return `<h3 class="card-title">Diente ${st.selected.t} · ${siteById(st.selected.s).label}</h3>
      <p class="hint mb">${esc(pfToothName(st.selected.t))} · superficie ${siteById(st.selected.s).surface}</p>
      <div class="cal-box"><span>Nivel de inserción (NIC)</span><b id="pf-site-cal">${cal !== undefined ? fmtMm(cal) + " mm" : "—"}</b></div>
      <div class="ctl-row"><span class="ctl-label">Sangrado al sondaje</span><span class="pf-h-sw" id="pf-sw-bop"></span></div>
      <div class="ctl-row"><span class="ctl-label">Placa</span><span class="pf-h-sw" id="pf-sw-plaque"></span></div>
      <div class="ctl-row"><span class="ctl-label">Supuración</span><span class="pf-h-sw" id="pf-sw-sup"></span></div>
      <p class="hint">Sondaje y recesión se editan directamente en la grilla.</p>`;
  }

  function bindSiteCard() {
    if (!st.selected) return;
    const { t, s } = st.selected;
    for (const [f, host] of [["bop", "#pf-sw-bop"], ["plaque", "#pf-sw-plaque"], ["sup", "#pf-sw-sup"]]) {
      const el = $(host, root);
      if (!el) continue;
      const cur = !!store().getTooth(t).sites[s]?.[f];
      el.appendChild(switchEl(cur, (v) => {
        const patch = {}; patch[f] = v;
        if (st.mode === "libre") { st.selfEdit = true; Perio.setSite(t, s, patch); st.selfEdit = false; }
        else st.draft.setSite(t, s, patch);
        const dot = $(`.pf-dot[data-t="${t}"][data-s="${s}"][data-f="${f}"]`, root);
        if (dot) { dot.classList.toggle("on", v); dot.setAttribute("aria-label", `${t} ${siteById(s).label}: ${f === "bop" ? "sangrado" : f === "plaque" ? "placa" : "supuración"} ${v ? "positivo" : "negativo"}`); }
        clearErrorRings();
        paintSideDynamic(false);
        refreshGraphic();
      }));
    }
  }

  function progressText() {
    if (!st.started) return "";
    if (st.exMode === "dictation" && st.dictState) return `Dictado ${st.dictState.idx + 1}/${st.dictState.order.length}`;
    const sum = summarizeMouth(store());
    return `Sitios ${sum.recorded}/${sum.sites}`;
  }

  function exerciseCardHTML() {
    const ex = chartExerciseById(st.exerciseId);
    if (!st.started) return `<h3 class="card-title">${icon("target", 15)} Ejercicios de llenado</h3>
      <p class="hint">Tres casos con corrección automática: periodonto sano, gingivitis y periodontitis
      estadio III. Elige uno en «Practicar el llenado» para comenzar.</p>`;
    const attempts = (Student.data.chartResults ?? []).filter((r) => r.exerciseId === st.exerciseId).slice(-5).reverse();
    let resultHTML = "";
    if (st.result) {
      const t = st.result.tally;
      const chip = (l, x) => `<span class="chip ${x === null ? "slate" : x >= 80 ? "teal" : x >= 50 ? "amber" : "rose"}">${l} ${x ?? "—"} %</span>`;
      resultHTML = `<hr class="sep">
        <div class="pf-score ${st.result.score >= 80 ? "ok" : st.result.score >= 50 ? "mid" : "bad"}"><b>${st.result.score}</b><span>/ 100</span></div>
        <p class="hint center">${st.result.score >= 90 ? "Registro excelente." : st.result.score >= 75 ? "Buen registro: revisa los detalles marcados." : st.result.score >= 50 ? "Registro parcial: repasa la hoja y los errores." : "Vuelve a intentarlo revisando cada campo."} · Tiempo: ${fmtTime(st.result.seconds ?? 0)}</p>
        <div class="badge-row center">${chip("Sondaje", t.pd.pct)}${chip("Sangrado", t.bop.pct)}${chip("Recesión", t.rec.pct)}${chip("Placa", t.plaque.pct)}${chip("Supuración", t.sup.pct)}${chip("Diente", t.tooth.pct)}</div>
        ${st.result.errors.length ? `<details class="pf-errors"><summary>Errores detectados (${st.result.errors.length})</summary>
          <ul>${st.result.errors.slice(0, 16).map((e) => `<li><b>${e.tooth}${e.site ? " · " + siteById(e.site).short : ""}</b> — ${esc(e.field)}: registraste <b>${esc(String(e.got))}</b>, correcto <b>${esc(String(e.want))}</b>${e.near ? " (±1 mm)" : ""}</li>`).join("")}</ul></details>` : ""}
        <div class="btn-col">
          <button class="btn outline small" id="pf-review">${icon("eye", 14)} Ver errores en la grilla</button>
          <button class="btn outline small" id="pf-copy">${icon("copy", 14)} Copiar a mi registro</button>
          <button class="btn primary small" id="pf-retry">${icon("rotate-ccw", 14)} Reintentar</button>
        </div>
        <div class="pf-teach">${mdInline("**Repaso clínico:** " + ex.teaching)}</div>`;
    }
    return `<h3 class="card-title">${icon("target", 15)} Ejercicio</h3>
      <div class="badge-row">
        <span class="badge outline" id="pf-exprog">${progressText()}</span>
        ${st.exMode === "sheet" ? `<button class="btn small outline" id="pf-sheetbtn">${icon("list-checks", 13)} Hoja del examinador</button>` : ""}
        <button class="btn small primary" id="pf-grade">${icon("check-circle", 13)} ${st.result ? "Recalificar" : "Calificar"}</button>
        <button class="btn small ghost" id="pf-quit2">${icon("x", 13)} Abandonar</button>
      </div>
      ${resultHTML}
      ${attempts.length ? `<hr class="sep"><p class="hint"><b>Intentos anteriores</b></p>
        <ul class="pf-attempts">${attempts.map((a) => `<li>${a.mode === "dictation" ? "Dictado" : "Hoja"} · <b>${a.score}</b>/100 · ${new Date(a.at).toLocaleDateString("es")}</li>`).join("")}</ul>` : ""}`;
  }

  function actionsCardHTML() {
    return `<h3 class="card-title">Acciones</h3>
      <div class="btn-col">
        <button class="btn outline" id="pf-csv">${icon("download", 15)} Exportar CSV</button>
        <button class="btn outline" id="pf-print">${icon("printer", 15)} Imprimir ficha</button>
        <button class="btn danger" id="pf-clear">${icon("trash", 15)} Limpiar toda la boca</button>
      </div>
      <p class="hint">El registro libre se comparte con la simulación 3D (diente 11) y con la vista
      «Diente 11» de este módulo.</p>`;
  }

  /* ---- pintado general ---- */

  function paint() {
    storeRef.current = store();
    const inExercise = st.mode === "ejercicio";
    const graphic = st.view === "grafico";
    const ficha = st.view === "ficha";
    root.innerHTML = `
    <div class="perio-layout pf-view">
      <div class="perio-main">
        ${toolbarHTML(!inExercise || !st.started)}
        ${inExercise ? (st.started ? caseCardHTML() : pickerHTML()) : (ficha ? "" : headerCardHTML())}
        ${inExercise && st.started && st.exMode === "dictation" && st.dictState ? dictCardHTML() : ""}
        ${ficha
          ? fichaScreenHTML(store(), { editable: !inExercise, mode: st.ptMode })
          : graphic
            ? graphicCardHTML(store(), st.gFilter, st.selected)
            : `${pfArchTable("upper", store())}<div class="card pad pf-sum-card">${pfSummaryHTML(store())}</div>${pfArchTable("lower", store())}`}
        ${legendHTML()}
      </div>
      <aside class="side-panel pf-side">
        ${indicesCardHTML()}
        <div class="card pad" id="pf-site-host">${siteCardHTML()}</div>
        <div class="card pad">${inExercise ? exerciseCardHTML() : actionsCardHTML()}</div>
      </aside>
    </div>`;

    bindStatic();
    if (st.mode === "libre") bindHeader();
    bindSiteCard();
    if (inExercise && st.started && st.exMode === "dictation" && st.dictState) { bindDict(); highlightDictCell(); }
  }

  /** Repinta solo las zonas dependientes de los datos (índices, sitio, progreso). */
  function paintSideDynamic(withSite = true) {
    const idx = $("#pf-indices", root);
    if (idx) idx.innerHTML = indicesInnerHTML();
    const prog = $("#pf-exprog", root);
    if (prog) prog.textContent = progressText();
    if (withSite) {
      const host = $("#pf-site-host", root);
      if (host) { host.innerHTML = siteCardHTML(); bindSiteCard(); }
    }
  }

  /** Cuerpo gráfico con el estado actual (para refrescos sin perder el scroll). */
  function graphicInnerHTMLBody() {
    return graphicBodyHTML(store(), st.gFilter, st.selected);
  }

  /** Refresca la vista gráfica conservando la posición horizontal. */
  function refreshGraphic() {
    if (st.view !== "grafico") return;
    const wrap = $(".pf-gfx-card .pf-wrap", root);
    if (wrap) { const sl = wrap.scrollLeft; wrap.innerHTML = graphicInnerHTMLBody(); wrap.scrollLeft = sl; }
  }

  /** Redibuja en la ficha clínica los grupos SVG del diente editado
   * (corona, líneas GM/PD, polígono y puntos), sin repintar la vista. */
  function refreshFichaTooth(t) {
    if (st.view !== "ficha") return;
    for (const g of $$(`g.pt-tg[data-t="${t}"]`, root)) {
      const svg = g.closest("svg");
      const arch = svg?.dataset.arch === "lower" ? "lower" : "upper";
      const surf = g.dataset.surf;
      const teeth = [...FULL_MOUTH[arch].right, ...FULL_MOUTH[arch].left];
      g.outerHTML = ptToothGroup(t, surf, teeth, store());
    }
  }

  /* ---- dictado por cuadrante ---- */

  function dictCardHTML() {
    const ex = chartExerciseById(st.exerciseId);
    const item = st.dictState.order[st.dictState.idx];
    const tgt = st.targets.teeth[item.t].sites[item.s];
    const rec = st.draft.getTooth(item.t).sites[item.s] ?? {};
    const n = st.dictState.idx + 1, total = st.dictState.order.length;
    const last = st.dictState.idx === total - 1;
    const say = `«${tgt.pd} milímetros${tgt.bop ? ", con sangrado" : ", sin sangrado"}»`;
    return `<div class="card pad pf-dict" id="pf-dict">
      <div class="pf-dict-head">
        <span class="badge subtle">${icon("timer", 13)} Dictado</span>
        <b>${esc(ex.title)}</b>
        <span class="pf-dict-prog">${n} / ${total}</span>
      </div>
      <div class="pf-dict-item">
        <div class="pf-dict-loc">
          <span class="pf-dict-tooth">${item.t}</span>
          <div><b>${siteById(item.s).label}</b><br><span class="hint">${esc(pfQuadrantName(item.t))}</span></div>
        </div>
        <p class="pf-dict-say">${say}${canSpeech ? ` <button class="btn small ghost" id="pf-dict-spk" title="Escuchar el dictado">${icon("activity", 13)} Escuchar</button>` : ""}</p>
        <div class="pf-dict-row">
          <label class="field"><span>Sondaje (mm)</span>
            <input class="input num" id="pf-dict-pd" inputmode="decimal" maxlength="4"
              value="${rec.pd !== undefined ? fmtMm(rec.pd) : ""}" placeholder="—" autofocus></label>
          <label class="field"><span>Sangrado al sondaje</span><span class="pf-h-sw" id="pf-dict-bop"></span></label>
        </div>
        <div class="btn-row">
          <button class="btn small outline" id="pf-dict-prev" ${st.dictState.idx === 0 ? "disabled" : ""}>${icon("arrow-left", 14)} Anterior</button>
          ${last
            ? `<button class="btn small primary" id="pf-dict-end">${icon("check-circle", 14)} Terminar y calificar</button>`
            : `<button class="btn small primary" id="pf-dict-next">Siguiente ${icon("arrow-right", 14)}</button>`}
        </div>
        <div class="pf-dict-bar"><i style="width:${Math.round((n / total) * 100)}%"></i></div>
        <p class="hint">Intro = siguiente · la celda actual se resalta en la grilla · el dictado evalúa
        sondaje y sangrado de la región.</p>
      </div>
    </div>`;
  }

  function bindDict() {
    const item = st.dictState.order[st.dictState.idx];
    const bopHost = $("#pf-dict-bop", root);
    if (bopHost) {
      const cur = !!st.draft.getTooth(item.t).sites[item.s]?.bop;
      bopHost.appendChild(switchEl(cur, () => { /* el valor se lee al avanzar */ }));
    }
    const next = $("#pf-dict-next", root);
    if (next) next.addEventListener("click", () => dictGo(1));
    const prev = $("#pf-dict-prev", root);
    if (prev) prev.addEventListener("click", () => dictGo(-1));
    const end = $("#pf-dict-end", root);
    if (end) end.addEventListener("click", () => { dictCommitCurrent(); runGrading(); });
    const spk = $("#pf-dict-spk", root);
    if (spk) spk.addEventListener("click", () => {
      const tgt = st.targets.teeth[item.t].sites[item.s];
      pfSpeak(`Diente ${String(item.t).split("").join(" ")}, ${siteById(item.s).label}, ${tgt.pd} milímetros${tgt.bop ? ", con sangrado" : ""}`);
    });
    const inp = $("#pf-dict-pd", root);
    if (inp) {
      inp.addEventListener("keydown", (e) => {
        if (e.key === "Enter") { e.preventDefault(); dictGo(1); }
      });
      inp.focus(); inp.select();
    }
  }

  function dictCommitCurrent() {
    const item = st.dictState.order[st.dictState.idx];
    const pdEl = $("#pf-dict-pd", root);
    const bopEl = $("#pf-dict-bop input", root);
    if (!pdEl) return;
    const raw = pdEl.value.trim().replace(",", ".");
    if (raw === "" || Number.isNaN(+raw)) return; // sin valor: queda sin registrar
    let n = Math.max(0, Math.min(15, Math.round(parseFloat(raw) * 2) / 2));
    st.draft.setSite(item.t, item.s, { pd: n, bop: !!(bopEl && bopEl.checked) });
  }

  function dictGo(delta) {
    dictCommitCurrent();
    const nextIdx = st.dictState.idx + delta;
    if (nextIdx >= st.dictState.order.length) { runGrading(); return; }
    st.dictState.idx = Math.max(0, nextIdx);
    paint();
  }

  function highlightDictCell() {
    const item = st.dictState.order[st.dictState.idx];
    $$(".pf-cur", root).forEach((el) => el.classList.remove("pf-cur"));
    const el = st.view === "grafico"
      ? $(`.pf-gsite[data-t="${item.t}"][data-s="${item.s}"]`, root)
      : ($(`.pf-in[data-t="${item.t}"][data-s="${item.s}"][data-f="pd"]`, root)
        ?? $(`.pf-c[data-t="${item.t}"][data-s="${item.s}"][data-f="pd"]`, root));
    if (!el) return;
    el.classList.add("pf-cur");
    const wrap = el.closest(".pf-wrap, .pt-screen");
    if (wrap) {
      const wr = wrap.getBoundingClientRect(), er = el.getBoundingClientRect();
      const target = wrap.scrollLeft + (er.left - wr.left) - wr.width / 2 + er.width / 2;
      wrap.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
    }
  }

  /* ---- actualizaciones puntuales de celdas (sin repintar) ---- */

  function clearErrorRings() {
    $$(".pf-err, .pf-near", root).forEach((el) => el.classList.remove("pf-err", "pf-near"));
  }

  function updateSiteCell(t, s, f, v) {
    const td = $(`.pf-c[data-t="${t}"][data-s="${s}"][data-f="${f}"]`, root);
    if (td) td.style.background = f === "pd" ? pfSevStyle(v) : "";
    const r = store().getTooth(t).sites[s];
    const cal = r?.pd !== undefined ? Math.round((r.pd + (r.rec ?? 0)) * 10) / 10 : undefined;
    const nic = $(`.pf-nic[data-t="${t}"][data-s="${s}"]`, root);
    if (nic) {
      nic.textContent = cal !== undefined ? fmtMm(cal) : "·";
      nic.style.background = pfSevStyle(cal, "18");
    }
    const calBox = $("#pf-site-cal", root);
    if (calBox && st.selected && st.selected.t === t && st.selected.s === s) {
      calBox.textContent = cal !== undefined ? fmtMm(cal) + " mm" : "—";
    }
  }

  function pfToothInner(t, rec) {
    const mob = +rec.mobility || 0;
    const furc = rec.furcation && rec.furcation !== "—" ? rec.furcation : "";
    return `<button class="pf-tbtn" data-t="${t}" title="${esc(pfToothName(t))} · clic para ausencia y limpieza">${t}</button>
      ${mob >= 1 ? `<span class="pf-badge-mob" title="Movilidad grado ${mob}">M${mob}</span>` : ""}
      ${furc ? `<span class="pf-badge-furc" title="Furca grado ${furc}">F${furc}</span>` : ""}`;
  }

  function updateToothBadges(t) {
    const td = $(`.pf-tooth[data-t="${t}"]`, root);
    if (!td) return;
    const rec = store().getTooth(t);
    td.innerHTML = pfToothInner(t, rec);
    td.classList.toggle("is-missing", !!rec.missing);
  }

  function applyMissing(t, missing) {
    $$(`[data-t="${t}"]`, root).forEach((el) => {
      if (el.classList.contains("pf-tooth")) { el.classList.toggle("is-missing", missing); return; }
      el.classList.toggle("pf-m", missing);
      const ctrl = el.matches("input, select, button") ? el : el.querySelector("input, select, button");
      if (ctrl) ctrl.disabled = missing;
    });
  }

  /* ---- modal de diente (ausencia / limpieza) ---- */

  function openToothModal(t) {
    const rec = store().getTooth(t);
    const o = openModal(`<div class="pad-modal">
      <h3 class="card-title">Diente ${t}</h3>
      <p class="hint mb">${esc(pfToothName(t))}${MOLAR_SET.has(t) ? " · multirradicular (furca explorable)" : " · unirradicular"}</p>
      <div class="ctl-row"><span class="ctl-label">Ausente / sin registro</span><span class="pf-h-sw" id="ptm-miss"></span></div>
      <p class="hint">Al marcarlo ausente se excluye de los índices y se bloquean sus celdas.
      La movilidad y la furca se editan en sus filas de la grilla.</p>
      <div class="btn-row">
        <button class="btn small danger" id="ptm-clear">${icon("trash", 14)} Limpiar diente</button>
        <button class="btn small ghost" id="ptm-close">Cerrar</button>
      </div>
    </div>`);
    $("#ptm-miss", o).appendChild(switchEl(!!rec.missing, (v) => {
      if (st.mode === "libre") { st.selfEdit = true; Perio.setTooth(t, { missing: v }); st.selfEdit = false; }
      else st.draft.setTooth(t, { missing: v });
      applyMissing(t, v);
      refreshFichaTooth(t);
      paintSideDynamic();
    }));
    $("#ptm-close", o).addEventListener("click", o.close);
    $("#ptm-clear", o).addEventListener("click", () => {
      if (st.mode === "libre") { st.selfEdit = true; Perio.clearTooth(t); st.selfEdit = false; }
      else st.draft.clearTooth(t);
      o.close();
      paint();
      toast({ title: `Diente ${t} limpiado` });
    });
  }

  /* ---- corrección y ciclo del ejercicio ---- */

  function startExercise() {
    const ex = chartExerciseById(st.exerciseId);
    if (!ex) return;
    st.draft = createDraftStore({
      patient: `${ex.patient.name} (${ex.patient.age} años) · ejercicio`,
      date: ex.patient.date, smoker: ex.patient.smoker, allergies: ex.patient.allergies, notes: ex.patient.notes,
    });
    st.targets = buildChartTargets(st.exerciseId);
    st.started = true;
    st.result = null;
    st.selected = null;
    st.exStartedAt = Date.now();
    if (st.exMode === "dictation") {
      const region = CHART_REGIONS.find((r) => r.id === st.regionId) ?? CHART_REGIONS[0];
      // Los dientes ausentes del caso no se dictan (no tienen sitios que registrar)
      st.dictState = {
        idx: 0,
        order: region.teeth
          .filter((t) => !st.targets.teeth[t].missing)
          .flatMap((t) => SITE_IDS.map((s) => ({ t, s }))),
      };
    } else st.dictState = null;
    paint();
    toast({ title: "Ejercicio iniciado", description: st.exMode === "sheet" ? "Abre la hoja del examinador y transcribe los hallazgos." : "Sigue el dictado sitio a sitio." });
  }

  function quitExercise() {
    const o = openModal(`<div class="pad-modal">
      <h3 class="card-title">¿Abandonar el ejercicio?</h3>
      <p class="hint mb">El borrador de este ejercicio se descarta (tu registro libre no se toca).</p>
      <div class="btn-row"><button class="btn ghost" data-a="cancel">Continuar aquí</button>
      <button class="btn danger" data-a="ok">Sí, abandonar</button></div>
    </div>`);
    $('[data-a="cancel"]', o).addEventListener("click", o.close);
    $('[data-a="ok"]', o).addEventListener("click", () => {
      st.started = false; st.result = null; st.dictState = null; st.targets = null; st.selected = null;
      o.close();
      paint();
    });
  }

  function retryExercise() {
    const o = openModal(`<div class="pad-modal">
      <h3 class="card-title">¿Reintentar el ejercicio?</h3>
      <p class="hint mb">Se borra el borrador actual y se vuelve a empezar con la misma configuración.</p>
      <div class="btn-row"><button class="btn ghost" data-a="cancel">Cancelar</button>
      <button class="btn primary" data-a="ok">Reintentar</button></div>
    </div>`);
    $('[data-a="cancel"]', o).addEventListener("click", o.close);
    $('[data-a="ok"]', o).addEventListener("click", () => { o.close(); startExercise(); });
  }

  function runGrading() {
    const regionTeeth = st.exMode === "dictation"
      ? (CHART_REGIONS.find((r) => r.id === st.regionId) ?? CHART_REGIONS[0]).teeth
      : null;
    st.result = gradeChart(st.targets, st.draft, { mode: st.exMode === "dictation" ? "dictation" : "sheet", regionTeeth });
    st.result.seconds = Math.max(1, Math.round((Date.now() - st.exStartedAt) / 1000));
    Student.saveChartResult({
      exerciseId: st.exerciseId, mode: st.exMode,
      region: st.exMode === "dictation" ? st.regionId : "boca",
      score: st.result.score, seconds: st.result.seconds, detail: { tally: st.result.tally },
    });
    st.dictState = null; // el dictado termina al calificar
    paint();
    toast({
      title: `Corrección: ${st.result.score}/100`,
      description: st.result.errors.length ? `${st.result.errors.length} campos por revisar.` : "Sin errores.",
      variant: st.result.score >= 50 ? "default" : "destructive",
    });
  }

  function reviewErrors() {
    clearErrorRings();
    if (!st.result) return;
    const fMap = { "sondaje": "pd", "recesión": "rec", "sangrado": "bop", "placa": "plaque" };
    for (const err of st.result.errors) {
      let el = null;
      if (err.site) {
        const f = fMap[err.field];
        el = f ? $(`[data-f="${f}"][data-t="${err.tooth}"][data-s="${err.site}"]`, root) : null;
        if (el && el.classList.contains("pf-c")) el = el.querySelector("input, button") ?? el; // anilla el control
        if (!el) el = $(`.pf-gsite[data-t="${err.tooth}"][data-s="${err.site}"]`, root); // vista gráfica
      } else {
        el = $(`.pf-tooth[data-t="${err.tooth}"]`, root) ?? $(`.pf-gtooth[data-t="${err.tooth}"]`, root);
      }
      if (el) el.classList.add(err.near ? "pf-near" : "pf-err");
    }
    toast({ title: "Errores marcados", description: "Rojo: incorrecto · ámbar: error de ±1 mm." });
  }

  function copyToMyChart() {
    const ex = chartExerciseById(st.exerciseId);
    st.selfEdit = true;
    Perio.data.records = {};
    for (const t of ALL_TEETH) {
      const r = st.draft.data.records[t];
      if (r) Perio.data.records[t] = structuredClone(r);
    }
    Perio.data.header = {
      patient: `${ex.patient.name} (ejercicio: ${ex.title})`,
      date: new Date().toISOString().slice(0, 10),
      smoker: ex.patient.smoker, allergies: ex.patient.allergies, notes: ex.patient.notes,
    };
    Perio.save();
    st.selfEdit = false;
    toast({ title: "Copiado a tu registro", description: "Ya puedes verlo en el modo libre y en la vista «Diente 11»." });
  }

  /* ---- eventos ---- */

  function commitInput(el) {
    const { t, s, f } = el.dataset;
    const raw = el.value.trim().replace(",", ".");
    let v;
    if (raw === "" || Number.isNaN(+raw)) v = undefined;
    else v = Math.max(0, Math.min(f === "pd" ? 15 : 8, Math.round(parseFloat(raw) * 2) / 2));
    el.value = v !== undefined ? fmtMm(v) : "";
    const patch = {}; patch[f] = v;
    if (st.mode === "libre") { st.selfEdit = true; Perio.setSite(t, s, patch); st.selfEdit = false; }
    else st.draft.setSite(t, s, patch);
    updateSiteCell(t, s, f, v);
    clearErrorRings();
    paintSideDynamic(false);
    refreshFichaTooth(t);
  }

  function focusNextInput(cur) {
    /* Intro por sitio: rec→pd del mismo sitio y luego al sitio siguiente
     * (secuencia clínica «margen gingival → profundidad de sondaje»). */
    if (st.pairEntry) {
      const curKey = `${cur.dataset.t}|${cur.dataset.s}|${cur.dataset.f}`;
      const i = PF_PAIR_ORDER.findIndex((x) => `${x.t}|${x.s}|${x.f}` === curKey);
      for (let k = i + 1; k < PF_PAIR_ORDER.length; k++) {
        const nx = PF_PAIR_ORDER[k];
        const el = $(`.pf-in[data-t="${nx.t}"][data-s="${nx.s}"][data-f="${nx.f}"]`, root);
        if (el && !el.disabled) { el.focus(); el.select(); return; }
      }
      return;
    }
    const ins = $$(".pf-in", root).filter((i) => !i.disabled);
    const i = ins.indexOf(cur);
    const nx = ins[i + 1];
    if (nx) { nx.focus(); nx.select(); }
  }

  root.addEventListener("change", (e) => {
    const el = e.target;
    if (el.matches(".pf-in")) { commitInput(el); return; }
    if (el.matches(".pf-sel")) {
      const { t, f } = el.dataset;
      const patch = f === "mobility" ? { mobility: +el.value } : { furcation: el.value };
      if (st.mode === "libre") { st.selfEdit = true; Perio.setTooth(t, patch); st.selfEdit = false; }
      else st.draft.setTooth(t, patch);
      updateToothBadges(t);
      paintSideDynamic(false);
      return;
    }
    if (el.name === "pf-ex") { st.exerciseId = el.value; paint(); return; }
    if (el.id === "pf-exmode") {
      st.exMode = el.value;
      const field = $("#pf-region-field", root);
      const reg = $("#pf-region", root);
      if (field) field.style.opacity = st.exMode === "dictation" ? "" : "0.45";
      if (reg) reg.disabled = st.exMode !== "dictation";
      return;
    }
    if (el.id === "pf-region") { st.regionId = el.value; return; }
  });

  root.addEventListener("click", (e) => {
    const dot = e.target.closest(".pf-dot");
    if (dot && !dot.disabled) {
      const { t, s, f } = dot.dataset;
      const cur = !!store().getTooth(t).sites?.[s]?.[f];
      const patch = {}; patch[f] = !cur;
      if (st.mode === "libre") { st.selfEdit = true; Perio.setSite(t, s, patch); st.selfEdit = false; }
      else st.draft.setSite(t, s, patch);
      dot.classList.toggle("on", !cur);
      dot.setAttribute("aria-label", `${t} ${siteById(s).label}: ${f === "bop" ? "sangrado" : f === "plaque" ? "placa" : "supuración"} ${!cur ? "positivo" : "negativo"}`);
      st.selected = { t, s };
      const host = $("#pf-site-host", root);
      if (host) { host.innerHTML = siteCardHTML(); bindSiteCard(); }
      clearErrorRings();
      paintSideDynamic(false);
      refreshFichaTooth(t);
      return;
    }
    const tb = e.target.closest(".pf-tbtn");
    if (tb) { openToothModal(tb.dataset.t); return; }
    const seg = e.target.closest("[data-seg]");
    if (seg) {
      if (st.mode !== seg.dataset.seg) { st.mode = seg.dataset.seg; st.selected = null; paint(); }
      return;
    }
    const vseg = e.target.closest("[data-vseg]");
    if (vseg && st.view !== vseg.dataset.vseg) {
      st.view = vseg.dataset.vseg; _pfView = st.view; clearErrorRings(); paint(); return;
    }
    const gchip = e.target.closest("[data-gf]");
    if (gchip) {
      const id = gchip.dataset.gf;
      st.gFilter = st.gFilter === id ? null : id;
      paint();
      return;
    }
    const gs = e.target.closest(".pf-gsite");
    if (gs) {
      st.selected = { t: gs.dataset.t, s: gs.dataset.s };
      const host = $("#pf-site-host", root);
      if (host) { host.innerHTML = siteCardHTML(); bindSiteCard(); }
      refreshGraphic(); // resalta el diente del sitio elegido
      return;
    }
  });

  root.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.target.matches && e.target.matches(".pf-in")) {
      e.preventDefault();
      e.target.blur();
      focusNextInput(e.target);
    }
  });

  root.addEventListener("focusin", (e) => {
    if (e.target.matches && e.target.matches(".pf-in")) {
      const { t, s } = e.target.dataset;
      if (!st.selected || st.selected.t !== t || st.selected.s !== s) {
        st.selected = { t, s };
        const host = $("#pf-site-host", root);
        if (host) { host.innerHTML = siteCardHTML(); bindSiteCard(); }
      }
    }
  });

  /* ---- botones estáticos (re-enlazados en cada paint) ---- */

  /** Modal de confirmación para borrar los 32 dientes del registro libre. */
  function confirmClearAll() {
    const o = openModal(`<div class="pad-modal">
      <h3 class="card-title">¿Limpiar toda la boca?</h3>
      <p class="hint mb">Se borran los 32 dientes registrados (la cabecera del paciente se conserva).</p>
      <div class="btn-row"><button class="btn ghost" data-a="cancel">Cancelar</button>
        <button class="btn danger" data-a="ok">Sí, limpiar</button></div>
    </div>`);
    $('[data-a="cancel"]', o).addEventListener("click", o.close);
    $('[data-a="ok"]', o).addEventListener("click", () => {
      st.selfEdit = true; Perio.clearAllTeeth(); st.selfEdit = false;
      o.close(); paint();
      toast({ title: "Periodontograma limpio" });
    });
  }

  function bindStatic() {
    const on = (sel, fn) => { const el = $(sel, root); if (el) el.addEventListener("click", fn); };
    on("#pf-start", startExercise);
    on("#pf-quit", quitExercise);
    on("#pf-quit2", quitExercise);
    const pairHost = $("#pf-pair", root);
    if (pairHost) pairHost.appendChild(switchEl(st.pairEntry, (v) => {
      st.pairEntry = v; _pfPair = v;
      toast({ title: v ? "Intro por sitio" : "Intro por fila", description: v ? "Rec→Son del mismo sitio, luego al sitio siguiente." : "Avance clásico celda a celda por la fila." });
    }));
    on("#pf-grade", () => {
      if (st.exMode === "sheet") {
        const sum = summarizeMouth(store());
        if (!sum.recorded) { toast({ title: "Nada que corregir", description: "Registra al menos un sitio antes de calificar." }); return; }
      }
      runGrading();
    });
    on("#pf-sheetbtn", () => openModal(examinerSheetHTML(st.targets), { wide: true }));
    on("#pf-review", reviewErrors);
    on("#pf-copy", copyToMyChart);
    on("#pf-retry", retryExercise);
    on("#pf-csv", downloadCSV);
    on("#pf-print", () => window.print());
    on("#pf-clear", confirmClearAll);
    /* barra de la ficha clínica (estilo perio-tools) */
    on("#pt-print", () => window.print());
    on("#pt-csv", downloadCSV);
    on("#pt-clear", confirmClearAll);
    const modeBtn = $("#pt-mode", root);
    if (modeBtn) modeBtn.addEventListener("click", () => {
      st.ptMode = st.ptMode === "bop" ? "st" : "bop";
      $$(".pt-band", root).forEach((el) => el.classList.toggle("mode-bop", st.ptMode === "bop"));
      modeBtn.classList.toggle("on", st.ptMode === "bop");
      const lbl = $(".pt-mode-lab", modeBtn);
      if (lbl) lbl.textContent = st.ptMode === "bop" ? "BOP" : "Sondaje";
      toast({
        title: st.ptMode === "bop" ? "Vista BOP" : "Vista sondaje",
        description: st.ptMode === "bop"
          ? "La banda resalta los puntos de sangrado al sondaje."
          : "La banda muestra el margen gingival (roja), el sondaje (azul) y la bolsa (azul marino).",
      });
    });
  }

  function bindHeader() {
    const h = Perio.header();
    const bind = (id, key) => {
      const el = $(id, root);
      if (el) el.addEventListener("change", (e) => {
        const patch = {}; patch[key] = e.target.value;
        st.selfEdit = true; Perio.setHeader(patch); st.selfEdit = false;
      });
    };
    bind("#pf-h-patient", "patient");
    bind("#pf-h-date", "date");
    bind("#pf-h-notes", "notes");
    const sw = (id, key, cur) => {
      const el = $(id, root);
      if (el) el.appendChild(switchEl(cur, (v) => {
        const patch = {}; patch[key] = v;
        st.selfEdit = true; Perio.setHeader(patch); st.selfEdit = false;
      }));
    };
    sw("#pf-h-smoker", "smoker", !!h.smoker);
    sw("#pf-h-allergies", "allergies", !!h.allergies);
  }

  /* ---- integración con el bus (cambios externos: simulación, cuentas) ---- */

  const offPerio = Bus.on("perio", () => {
    if (st.mode === "libre" && !st.selfEdit) paint();
  });

  paint();
  return () => Bus.off("perio", offPerio);
}
