/* AR PERIO — diagrams.js · Diagramas SVG educativos e ilustraciones clínicas.
 * Generadores de SVG como cadenas (portados de los componentes React).
 * Añadir un diagrama nuevo = crear la función y registrarla en DIAGRAMS.
 */

const DIAGRAM_COLORS = {
  enamel: "#f4f2ec", enamelStroke: "#b9b3a4", dentin: "#e6cf9d", pulp: "#d98f86",
  cementum: "#ddc9a8", gum: "#e8a49c", gumDeep: "#c97b74", bone: "#e9dfc6",
  boneStroke: "#b3a682", pdl: "#d98f86", label: "#4b5f5a", teal: "#0d7a6e",
  rose: "#c22035", amber: "#d99a17",
};

/** Etiqueta con línea guía. */
function diagLabel(x, y, tx, ty, text, anchor = "start", color = DIAGRAM_COLORS.label) {
  return `<g><path d="M${x} ${y} L${tx} ${ty}" stroke="${color}" stroke-width="1" fill="none" opacity="0.6"/>
    <circle cx="${x}" cy="${y}" r="2" fill="${color}"/>
    <text x="${tx}" y="${ty + 3.5}" text-anchor="${anchor}" font-size="11.5" font-weight="600" fill="${color}">${text}</text></g>`;
}

/* ------------------- Sección sagital del periodonto ---------------------- */

function DiagramPeriodontium() {
  const C = DIAGRAM_COLORS;
  return `<svg viewBox="0 0 640 400" class="w-full" role="img" aria-label="Sección del periodonto">
    <rect width="640" height="400" rx="12" fill="#fbfefd"/>
    <path d="M150 210 C130 250 128 320 158 352 C190 384 300 384 330 350 C358 318 352 248 332 208 L150 210 z" fill="${C.bone}" stroke="${C.boneStroke}" stroke-width="2"/>
    <path d="M170 230 q70 14 140 0" stroke="${C.boneStroke}" stroke-width="1.2" fill="none" opacity="0.5"/>
    <path d="M165 320 q75 12 150 -2" stroke="${C.boneStroke}" stroke-width="1.2" fill="none" opacity="0.5"/>
    <path d="M158 208 C148 172 176 138 214 130 C236 126 244 128 246 130 C248 138 252 148 262 152 C276 158 288 152 296 148 C330 158 344 186 332 208 C320 232 288 244 244 244 C200 244 170 234 158 208 z" fill="${C.gum}" stroke="${C.gumDeep}" stroke-width="2"/>
    <path d="M246 132 C248 148 252 162 260 172" stroke="#a34340" stroke-width="2" fill="none" stroke-dasharray="4 2.5"/>
    <path d="M216 128 C214 92 226 52 242 34 C258 52 272 92 268 128 C268 134 262 138 242 138 C222 138 216 134 216 128 z" fill="${C.enamel}" stroke="${C.enamelStroke}" stroke-width="2"/>
    <path d="M224 128 C224 96 232 62 242 48 C252 62 260 96 258 128 L258 258 C258 296 254 330 242 346 C230 330 226 296 226 258 z" fill="${C.dentin}" stroke="#c4a86a" stroke-width="1.6"/>
    <path d="M242 66 C246 84 248 100 247 116 L247 300 C247 322 245 336 242 342 C239 336 237 322 237 300 L237 116 C236 100 238 84 242 66 z" fill="${C.pulp}"/>
    <path d="M226 200 C226 296 232 330 242 346 C252 330 258 296 258 200" stroke="${C.cementum}" stroke-width="5" fill="none" opacity="0.85"/>
    <path d="M226 236 C226 296 232 330 242 346 C252 330 258 296 258 236" stroke="${C.pdl}" stroke-width="2.4" fill="none" stroke-dasharray="3 2"/>
    ${diagLabel(242, 60, 330, 40, "Esmalte")}
    ${diagLabel(250, 150, 352, 150, "Dentina")}
    ${diagLabel(243, 250, 352, 250, "Cemento radicular")}
    ${diagLabel(242, 310, 348, 312, "Pulpa / conducto")}
    ${diagLabel(262, 152, 390, 170, "Surco gingival", "start", "#a34340")}
    ${diagLabel(236, 134, 120, 110, "Margen gingival", "end")}
    ${diagLabel(300, 160, 430, 120, "Encía libre", "start", "#a34340")}
    ${diagLabel(312, 200, 430, 205, "Encía adherida")}
    ${diagLabel(226, 280, 128, 280, "Ligamento periodontal", "end")}
    ${diagLabel(170, 330, 110, 352, "Hueso alveolar", "end")}
    ${diagLabel(196, 224, 92, 224, "Cresta alveolar (1.5–2 mm del CEJ)", "end")}
    <circle cx="234" cy="140" r="3" fill="${C.teal}"/>
    ${diagLabel(234, 140, 96, 150, "CEJ", "end", C.teal)}
    <g transform="translate(560, 300)">
      <rect x="-4" y="-16" width="8" height="120" rx="4" fill="#eef4f3"/>
      <line x1="0" y1="-12" x2="0" y2="100" stroke="${C.label}" stroke-width="1"/>
      ${[0, 1, 2, 3].map((i) => `<line key="${i}" x1="-7" y1="${i * 36 - 10}" x2="7" y2="${i * 36 - 10}" stroke="${C.label}" stroke-width="1.6"/>`).join("")}
      <text x="0" y="122" text-anchor="middle" font-size="9" fill="${C.label}" font-weight="600">mm</text>
    </g>
  </svg>`;
}

/* ---------------------------- Sonda periodontal --------------------------- */

function DiagramProbe() {
  const C = DIAGRAM_COLORS;
  const bands = [1, 2, 3, 5, 7, 8, 10];
  return `<svg viewBox="0 0 640 400" class="w-full" role="img" aria-label="Sonda periodontal">
    <rect width="640" height="400" rx="12" fill="#fbfefd"/>
    <g transform="rotate(18 320 200)">
      <rect x="470" y="184" width="150" height="32" rx="6" fill="#b9bec4" stroke="#8a9096" stroke-width="2"/>
      <rect x="500" y="184" width="10" height="32" fill="#b0524d"/>
      <rect x="530" y="184" width="10" height="32" fill="#b0524d"/>
      <rect x="560" y="184" width="10" height="32" fill="#b0524d"/>
      <rect x="150" y="194" width="320" height="12" rx="6" fill="#d3d7db" stroke="#9aa1a7" stroke-width="1.5"/>
      ${bands.map((mm) => `<rect key="${mm}" x="${140 - mm * 12}" y="192" width="4.5" height="16" rx="1.5" fill="#22262a"/>`).join("")}
      <circle cx="46" cy="200" r="7" fill="#d3d7db" stroke="#9aa1a7" stroke-width="1.5"/>
    </g>
    <g transform="translate(70, 250)">
      <rect x="0" y="20" width="240" height="14" rx="7" fill="#d3d7db" stroke="#9aa1a7" stroke-width="1.5"/>
      ${[1, 2, 3].map((mm) => `<g key="${mm}">
        <rect x="${214 - mm * 40}" y="16" width="6" height="22" rx="2" fill="#22262a"/>
        <text x="${217 - mm * 40}" y="52" text-anchor="middle" font-size="11" font-weight="700" fill="${C.label}">${mm}</text>
      </g>`).join("")}
      <text x="234" y="52" text-anchor="middle" font-size="11" font-weight="700" fill="${C.label}">mm</text>
      <circle cx="8" cy="27" r="9" fill="#d3d7db" stroke="#9aa1a7" stroke-width="1.5"/>
      <circle cx="8" cy="27" r="3.4" fill="#f2f4f5"/>
      ${diagLabel(8, 27, -2, -14, "Punta redondeada (0.4–0.5 mm)", "start", C.teal)}
      <text x="120" y="-16" text-anchor="middle" font-size="12" font-weight="700" fill="${C.label}">Detalle de la hoja calibrada</text>
    </g>
    <g transform="translate(500, 60)">
      <text font-size="12" font-weight="700" fill="${C.label}">Sonda tipo Williams</text>
      <text y="18" font-size="11" fill="${C.label}">Bandas en 1 · 2 · 3 · 5 · 7 · 8 · 10 mm</text>
      <text y="34" font-size="11" fill="${C.label}">Fuerza de trabajo ≈ 0.25 N</text>
    </g>
  </svg>`;
}

/* ------------------------- Técnica de sondaje ----------------------------- */

function DiagramTechnique() {
  const C = DIAGRAM_COLORS;
  const panel = (tx, title, pd, extra = "") => `
    <g transform="translate(${tx}, 30)">
      <rect width="190" height="310" rx="10" fill="#ffffff" stroke="#dbe7e4" stroke-width="1.5"/>
      <text x="95" y="26" text-anchor="middle" font-size="12.5" font-weight="700" fill="${C.label}">${title}</text>
      <path d="M75 90 C73 62 82 40 95 26 C108 40 117 62 115 90 L115 200 C115 224 108 240 95 252 C82 240 75 224 75 200 z" fill="${C.dentin}" stroke="#c4a86a" stroke-width="1.5"/>
      <path d="M75 90 C75 66 84 44 95 32 L95 92 C88 92 78 92 75 90 z" fill="${C.enamel}" stroke="${C.enamelStroke}" stroke-width="1.4"/>
      <path d="M60 140 C52 168 60 196 95 208 C130 196 138 168 130 140 C124 128 112 124 95 124 C78 124 66 128 60 140 z" fill="${C.gum}" stroke="${C.gumDeep}" stroke-width="1.6" opacity="0.92"/>
      ${extra}
      <text x="95" y="286" text-anchor="middle" font-size="11" font-weight="600" fill="${C.teal}">${pd}</text>
    </g>`;
  return `<svg viewBox="0 0 640 400" class="w-full" role="img" aria-label="Técnica de sondaje">
    <rect width="640" height="400" rx="12" fill="#fbfefd"/>
    ${panel(18, "1 · Acercamiento", "Sonda paralela al eje del diente", `
      <rect x="150" y="52" width="12" height="150" rx="6" fill="#c3ccd0" stroke="#8a9096" stroke-width="1.2" transform="rotate(14 156 120)"/>
      <circle cx="150" cy="196" r="5" fill="#c3ccd0"/>
      <path d="M152 150 L172 150" stroke="${C.rose}" stroke-width="1.6"/>
      <text x="176" y="146" font-size="10" font-weight="700" fill="${C.rose}">10–15°</text>`)}
    ${panel(226, "2 · Inserción", "Fuerza ligera hasta el fondo", `
      <rect x="150" y="40" width="12" height="170" rx="6" fill="#c3ccd0" stroke="#8a9096" stroke-width="1.2" transform="rotate(2 156 120)"/>
      <circle cx="153" cy="208" r="5" fill="#c3ccd0"/>
      <path d="M156 175 L156 196 M150 189 L162 189" stroke="${C.teal}" stroke-width="1.6"/>
      <text x="163" y="180" font-size="10" font-weight="700" fill="${C.teal}">fondo</text>`)}
    ${panel(434, "3 · Caminar el surco", "«Walk around»: pequeños pasos", `
      ${[0, 1, 2].map((i) => `<rect key="${i}" x="${140 + i * 18}" y="${58 + i * 14}" width="11" height="150" rx="5.5" fill="#c3ccd0" stroke="#8a9096" stroke-width="1.1" opacity="${0.9 - i * 0.22}" transform="rotate(${8 + i * 12} ${145 + i * 18} 133)"/>`).join("")}
      <path d="M120 220 Q160 232 176 216" stroke="${C.teal}" stroke-width="1.8" fill="none" stroke-dasharray="5 3"/>`)}
  </svg>`;
}

/* ----------------- Salud vs Gingivitis vs Periodontitis ------------------- */

function _gppPanel(tx, title, gumColor, marginDrop, pocketDepth, note, noteColor, showAttachmentLoss) {
  const C = DIAGRAM_COLORS;
  const marginY = 118 + marginDrop;
  const floorY = marginY + pocketDepth;
  return `<g transform="translate(${tx}, 26)">
    <rect width="196" height="330" rx="10" fill="#ffffff" stroke="#dbe7e4" stroke-width="1.5"/>
    <text x="98" y="24" text-anchor="middle" font-size="12.5" font-weight="700" fill="${C.label}">${title}</text>
    <path d="M52 ${showAttachmentLoss ? 250 : 226} C44 258 46 296 66 310 C96 328 140 326 158 306 C174 288 172 254 162 228" fill="${C.bone}" stroke="#b3a682" stroke-width="1.6"/>
    <path d="M78 108 C76 78 86 52 98 36 C110 52 120 78 118 108 L118 240 C118 264 110 278 98 290 C86 278 78 264 78 240 z" fill="${C.dentin}" stroke="#c4a86a" stroke-width="1.5"/>
    <path d="M78 108 C78 82 88 56 98 42 L98 110 C90 110 81 110 78 108 z" fill="${C.enamel}" stroke="#b9b3a4" stroke-width="1.3"/>
    <path d="M64 ${marginY} C58 ${marginY + 18} 62 ${floorY - 6} 80 ${floorY + 4} C92 ${floorY + 10} 118 ${floorY + 8} 130 ${floorY - 4} C146 ${floorY - 12} 150 ${marginY + 12} 146 ${marginY} C140 ${marginY - 10} 120 ${marginY - 12} 98 ${marginY - 12} C76 ${marginY - 12} 70 ${marginY - 8} 64 ${marginY} z" fill="${gumColor}" stroke="#a34340" stroke-width="1.6"/>
    <g transform="translate(98, 0)">
      <rect x="-3.5" y="${marginY - 64}" width="7" height="${pocketDepth + 68}" rx="3.5" fill="#c3ccd0" stroke="#8a9096" stroke-width="1"/>
      <circle cy="${floorY - 2}" r="4" fill="#c3ccd0"/>
      <line x1="26" y1="${marginY}" x2="26" y2="${floorY}" stroke="${noteColor}" stroke-width="2"/>
      <line x1="20" y1="${marginY}" x2="32" y2="${marginY}" stroke="${noteColor}" stroke-width="2"/>
      <line x1="20" y1="${floorY}" x2="32" y2="${floorY}" stroke="${noteColor}" stroke-width="2"/>
      <text x="38" y="${(marginY + floorY) / 2 + 4}" font-size="11" font-weight="800" fill="${noteColor}">${(pocketDepth / 13).toFixed(1)} mm</text>
    </g>
    <circle cx="90" cy="128" r="2.4" fill="${C.teal}"/>
    ${showAttachmentLoss ? `
      <line x1="76" y1="128" x2="76" y2="${floorY}" stroke="${C.rose}" stroke-width="1.4" stroke-dasharray="3 2.5"/>
      <text x="70" y="${(128 + floorY) / 2}" text-anchor="end" font-size="9.5" font-weight="700" fill="${C.rose}">NIC</text>` : ""}
    <text x="98" y="352" text-anchor="middle" font-size="10.5" font-weight="600" fill="${noteColor}">${note}</text>
  </g>`;
}

function DiagramGingivitisPeriodontitis() {
  const C = DIAGRAM_COLORS;
  return `<svg viewBox="0 0 640 400" class="w-full" role="img" aria-label="Comparación salud, gingivitis y periodontitis">
    <rect width="640" height="400" rx="12" fill="#fbfefd"/>
    ${_gppPanel(16, "Salud", C.gum, 0, 26, "PD 1–3 mm · sin BOP", C.teal, false)}
    ${_gppPanel(222, "Gingivitis", "#c25a55", -12, 46, "Seudobolsa 3–4 mm · BOP + · NIC normal", C.amber, false)}
    ${_gppPanel(428, "Periodontitis", "#b95d58", -4, 64, "Bolsa verdadera ≥ 5 mm · pérdida de inserción", C.rose, true)}
  </svg>`;
}

/* ------------------------------ Estadificación ---------------------------- */

function DiagramStaging() {
  const C = DIAGRAM_COLORS;
  const stages = [
    { label: "Estadio I", cal: "CAL 1–2 mm", bone: "&lt; 15 %", color: "#8fd3b8" },
    { label: "Estadio II", cal: "CAL 3–4 mm", bone: "15–33 %", color: "#e0b23e" },
    { label: "Estadio III", cal: "CAL ≥ 5 mm", bone: "&gt; 33 % · ≤ 4 dientes perdidos", color: "#e2601c" },
    { label: "Estadio IV", cal: "CAL ≥ 5 mm", bone: "&gt; 33 % · ≥ 5 dientes perdidos", color: "#c22035" },
  ];
  return `<svg viewBox="0 0 640 400" class="w-full" role="img" aria-label="Estadificación de la periodontitis">
    <rect width="640" height="400" rx="12" fill="#fbfefd"/>
    <text x="320" y="30" text-anchor="middle" font-size="14" font-weight="800" fill="${C.label}">Estadificación (severidad y complejidad)</text>
    ${stages.map((s, i) => `
    <g transform="translate(${24 + i * 152}, 56)">
      <rect width="136" height="150" rx="10" fill="${s.color}" opacity="0.18"/>
      <rect width="136" height="34" rx="10" fill="${s.color}"/>
      <text x="68" y="22" text-anchor="middle" font-size="12.5" font-weight="800" fill="#12211d">${s.label}</text>
      <text x="68" y="62" text-anchor="middle" font-size="11.5" font-weight="700" fill="${C.label}">${s.cal}</text>
      <text x="68" y="86" text-anchor="middle" font-size="10" fill="${C.label}">Pérdida ósea:</text>
      <text x="68" y="100" text-anchor="middle" font-size="10" font-weight="700" fill="${C.label}">${s.bone}</text>
    </g>`).join("")}
    <g transform="translate(40, 240)">
      <text font-size="13" font-weight="800" fill="${C.label}">Regla práctica ante criterios discrepantes</text>
      <text y="22" font-size="12" fill="${C.label}">→ se asigna siempre el estadio más alto.</text>
      <text y="52" font-size="12" font-weight="700" fill="${C.teal}">Estadio = la foto (daño acumulado) · Grado = la película (ritmo y riesgo)</text>
      <text y="76" font-size="11.5" fill="${C.label}">Grado A: pérdida/edad &lt; 0.25 · Grado B: 0.25–1.0 · Grado C: &gt; 1.0, tabaco ≥ 10 cig/día o HbA1c ≥ 7 %</text>
      <text y="96" font-size="11.5" fill="${C.label}">El estadio orienta la terapia; el grado, la intensidad y los intervalos de soporte.</text>
    </g>
  </svg>`;
}

/* ------------------------------ Instrumentación --------------------------- */

function DiagramInstruments() {
  const C = DIAGRAM_COLORS;
  return `<svg viewBox="0 0 640 400" class="w-full" role="img" aria-label="Principios de instrumentación">
    <rect width="640" height="400" rx="12" fill="#fbfefd"/>
    <g transform="translate(24, 40)">
      <text font-size="13" font-weight="800" fill="${C.label}">Cureta de Gracey (sección)</text>
      <path d="M40 70 L40 250 L110 250 L110 70 C110 52 96 42 75 42 C54 42 40 52 40 70 z" fill="${C.dentin}" stroke="#c4a86a" stroke-width="1.6"/>
      <path d="M22 96 C10 120 12 150 24 176 C30 190 42 196 52 192" stroke="#8a9096" stroke-width="9" fill="none" stroke-linecap="round"/>
      <path d="M22 96 C10 120 12 150 24 176 C30 190 42 196 52 192" stroke="#c3ccd0" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path d="M24 92 L-4 40" stroke="#9aa1a7" stroke-width="7" stroke-linecap="round"/>
      <path d="M36 158 A26 26 0 0 1 52 132" stroke="${C.teal}" stroke-width="1.6" fill="none" stroke-dasharray="4 3"/>
      <text x="58" y="150" font-size="10.5" font-weight="700" fill="${C.teal}">70–80°</text>
      <text x="60" y="196" font-size="10.5" font-weight="700" fill="${C.label}">Tercio terminal</text>
      <circle cx="52" cy="192" r="3" fill="${C.teal}"/>
    </g>
    <g transform="translate(240, 40)">
      <text font-size="13" font-weight="800" fill="${C.label}">Agarre y fulcrum</text>
      ${[0, 60, 120].map((dx) => `<path key="${dx}" d="M${20 + dx} 90 L${20 + dx} 240 L${74 + dx} 240 L${74 + dx} 90 C${74 + dx} 74 ${62 + dx} 64 ${47 + dx} 64 C${32 + dx} 64 ${20 + dx} 74 ${20 + dx} 90 z" fill="${C.enamel}" stroke="#c9c4b8" stroke-width="1.5"/>`).join("")}
      <path d="M50 140 C90 120 130 130 160 160" stroke="#9aa1a7" stroke-width="6" fill="none" stroke-linecap="round"/>
      <path d="M160 160 L196 132" stroke="#8a9096" stroke-width="8" stroke-linecap="round"/>
      <circle cx="196" cy="132" r="8" fill="${C.rose}" opacity="0.25"/>
      <circle cx="196" cy="132" r="3.5" fill="${C.rose}"/>
      <text x="206" y="128" font-size="10.5" font-weight="700" fill="${C.rose}">Fulcrum</text>
      <text x="60" y="120" font-size="10.5" font-weight="700" fill="${C.teal}">Agarre de lapicero</text>
      <path d="M96 172 q18 10 36 0" stroke="${C.teal}" stroke-width="1.8" fill="none"/>
      <path d="M126 168 l8 4 l-6 5" fill="none" stroke="${C.teal}" stroke-width="1.8"/>
      <text x="92" y="196" font-size="10" font-weight="600" fill="${C.teal}">golpes coronales</text>
    </g>
    <g transform="translate(470, 40)">
      <text font-size="13" font-weight="800" fill="${C.label}">Punta ultrasónica</text>
      <path d="M20 80 L96 130" stroke="#9aa1a7" stroke-width="12" stroke-linecap="round"/>
      <path d="M20 80 L96 130" stroke="#c3ccd0" stroke-width="7" stroke-linecap="round"/>
      <path d="M96 130 L150 150" stroke="#8a9096" stroke-width="8" stroke-linecap="round"/>
      <path d="M120 190 C112 220 116 260 132 282 C150 262 156 224 148 192 C140 184 128 184 120 190 z" fill="${C.dentin}" stroke="#c4a86a" stroke-width="1.6"/>
      <circle cx="150" cy="160" r="3" fill="${C.teal}"/>
      <circle cx="162" cy="170" r="2.2" fill="${C.teal}" opacity="0.7"/>
      <circle cx="170" cy="182" r="1.6" fill="${C.teal}" opacity="0.5"/>
      <text x="10" y="220" font-size="10.5" font-weight="700" fill="${C.teal}">0–15°</text>
      <path d="M40 214 A40 40 0 0 1 66 196" stroke="${C.teal}" stroke-width="1.5" fill="none" stroke-dasharray="4 3"/>
      <text x="86" y="316" font-size="10.5" font-weight="600" fill="${C.label}">Cara lateral · movimiento constante</text>
      <text x="86" y="332" font-size="10.5" font-weight="600" fill="${C.label}">+ irrigación del surco</text>
    </g>
  </svg>`;
}

const DIAGRAMS = {
  periodontium: DiagramPeriodontium,
  probe: DiagramProbe,
  technique: DiagramTechnique,
  gingivitisVsPeriodontitis: DiagramGingivitisPeriodontitis,
  staging: DiagramStaging,
  instruments: DiagramInstruments,
};

/* ------------------- Ilustraciones clínicas (casos) ----------------------- */

/** Ilustración clínica esquemática por tipo (sano/gingivitis/recession/periodontitis). */
function CasePhotoSVG(kind, caption) {
  let teeth = "";
  [110, 158, 206, 254, 302, 350].forEach((x, i) => {
    const w = i === 0 || i === 5 ? 38 : 42;
    const h = i === 2 || i === 3 ? 66 : 58;
    let extra = "";
    if (kind === "gingivitis") {
      extra = `<path d="M${x - w / 2} ${128 + h} Q${x} ${128 + h + 8} ${x + w / 2} ${128 + h} L${x + w / 2} ${128 + h - 14} Q${x} ${128 + h - 4} ${x - w / 2} ${128 + h - 14} z" fill="#c93b3b" opacity="0.85"/>`;
    } else if (kind === "periodontitis") {
      extra = `<path d="M${x - w / 2} ${128 + h - 12} Q${x} ${128 + h - 2} ${x + w / 2} ${128 + h - 12} L${x + w / 2} ${128 + h - 22} Q${x} ${128 + h - 12} ${x - w / 2} ${128 + h - 22} z" fill="#b53030" opacity="0.8"/>
        <rect x="${x - w / 2 + 6}" y="${128 + h - 24}" width="${w - 12}" height="8" rx="4" fill="#e0c9a0"/>`;
    } else if (kind === "recession" && i === 2) {
      extra = `<rect x="${x - 12}" y="${128 + h - 16}" width="24" height="14" rx="5" fill="#e0c9a0"/>`;
    }
    teeth += `<g><path d="M${x - w / 2} 128 L${x - w / 2} ${128 + h} Q${x} ${128 + h + 10} ${x + w / 2} ${128 + h} L${x + w / 2} 128 Q${x} 118 ${x - w / 2} 128 z" fill="#f6f4ee" stroke="#c9c4b8" stroke-width="1.5"/>${extra}</g>`;
  });
  const gums = {
    gingivitis: `<path d="M60 150 C130 200 350 200 420 150 C350 240 130 240 60 150 z" fill="#d4574f" opacity="0.55"/>`,
    periodontitis: `<path d="M60 150 C130 198 350 198 420 150 C350 236 130 236 60 150 z" fill="#c05a55" opacity="0.5"/>`,
    recession: `<path d="M60 150 C130 202 350 202 420 150 C350 238 130 238 60 150 z" fill="#dfa79e" opacity="0.7"/>`,
    sano: `<path d="M60 150 C130 204 350 204 420 150 C350 240 130 240 60 150 z" fill="#e2a49c" opacity="0.75"/>`,
  }[kind] || "";
  return `<figure class="case-photo">
    <svg viewBox="0 0 480 300" class="w-full" role="img" aria-label="${esc(caption)}">
      <path d="M40 150 C120 118 360 118 440 150 C360 260 120 260 40 150 z" fill="#e8b4a8" stroke="#c98d7f" stroke-width="2"/>
      <path d="M52 152 C130 126 350 126 428 152 C350 250 130 250 52 152 z" fill="#f7e6dd" stroke="#c98d7f" stroke-width="1.2"/>
      ${teeth}
      ${gums}
      <text x="240" y="286" text-anchor="middle" font-size="11" fill="#9aa5a1" font-weight="600">Ilustración esquemática · AR PERIO</text>
    </svg>
    <figcaption>${esc(caption)}</figcaption>
  </figure>`;
}

/** Radiografía periapical esquemática con pérdida ósea configurable. */
function CaseRadiographSVG(boneLossPct, caption) {
  const crest = 118 + (boneLossPct / 100) * 90;
  let teeth = "";
  [120, 210, 300].forEach((x, i) => {
    teeth += `<g>
      <path d="M${x - 26} 60 Q${x} 48 ${x + 26} 60 L${x + 22} ${250 + i * 6} Q${x} ${262 + i * 6} ${x - 22} ${250 + i * 6} z" fill="#e8e6de" opacity="0.92"/>
      <path d="M${x - 14} 74 L${x - 12} ${246 + i * 6} L${x + 12} ${246 + i * 6} L${x + 14} 74 Q${x} 66 ${x - 14} 74 z" fill="#cfccc2" opacity="0.6"/>
      <path d="M${x - 23} ${crest} L${x - 21} ${248 + i * 6}" stroke="#f2f0ea" stroke-width="1.6" opacity="0.8"/>
      <path d="M${x + 23} ${crest} L${x + 21} ${248 + i * 6}" stroke="#f2f0ea" stroke-width="1.6" opacity="0.8"/>
    </g>`;
  });
  return `<figure class="case-radio">
    <svg viewBox="0 0 480 360" class="w-full" role="img" aria-label="${esc(caption)}">
      <rect width="480" height="360" fill="#0b0f0e"/>
      ${teeth}
      <rect x="70" y="${crest}" width="340" height="${348 - crest}" fill="#b9b3a4" opacity="0.28"/>
      <path d="M70 ${crest + 10} Q150 ${crest - 6} 240 ${crest + 4} Q330 ${crest - 4} 410 ${crest + 8}" stroke="#d8d3c6" stroke-width="3" fill="none" opacity="0.85"/>
      <path d="M70 128 L410 128" stroke="#4d8f72" stroke-width="1.2" stroke-dasharray="6 4"/>
      <text x="416" y="131" font-size="10" fill="#4d8f72" font-weight="700">CEJ</text>
      <path d="M92 128 L92 ${crest}" stroke="#e2601c" stroke-width="1.8"/>
      <path d="M86 128 L98 128 M86 ${crest} L98 ${crest}" stroke="#e2601c" stroke-width="1.8"/>
      <text x="76" y="${(128 + crest) / 2}" font-size="11" fill="#e2601c" font-weight="700" text-anchor="end">${boneLossPct} %</text>
      <text x="240" y="30" text-anchor="middle" font-size="12" fill="#8a9490" font-weight="600">Radiografía periapical (esquemática) · sector anterosuperior</text>
    </svg>
    <figcaption>${esc(caption)}</figcaption>
  </figure>`;
}
