/* AR PERIO — views/perio.js · Módulo 4: periodontograma interactivo.
 * Dos vistas: «Diente 11» (odontograma individual enlazado a la simulación 3D)
 * y «Boca completa» (llenado de la ficha FDI a 32 dientes, con ejercicios). */

let _perioTab = "tooth11"; // memoria de la pestaña activa entre visitas

function renderPerio(root) {
  const paint = () => {
    root.innerHTML = `
      <div class="pf-tabs" role="tablist" aria-label="Vistas del periodontograma">
        <button class="pf-tab ${_perioTab === "tooth11" ? "active" : ""}" data-tab="tooth11" role="tab">
          ${icon("zoom", 15)} Diente 11
          <span class="pf-tab-sub">odontograma individual</span></button>
        <button class="pf-tab ${_perioTab === "full" ? "active" : ""}" data-tab="full" role="tab">
          ${icon("clipboard-list", 15)} Boca completa
          <span class="pf-tab-sub">llenado de la ficha · ejercicios</span></button>
      </div>
      <div id="perio-body"></div>`;
    const body = $("#perio-body", root);
    if (subCleanup) { try { subCleanup(); } catch (e) { console.warn(e); } subCleanup = null; }
    subCleanup = _perioTab === "full" ? (renderPerioFull(body) || null) : (renderPerioTooth11(body) || null);
  };
  let subCleanup = null;
  root.addEventListener("click", (e) => {
    const tab = e.target.closest("[data-tab]");
    if (tab && tab.dataset.tab !== _perioTab) { _perioTab = tab.dataset.tab; paint(); }
  });
  paint();
  return () => { if (subCleanup) { try { subCleanup(); } catch (e) { console.warn(e); } } };
}

/** Odontograma SVG de un diente con 6 sitios (editable o solo lectura). */
function ToothChartSVG(record, { selected = null, onSelect = null } = {}) {
  const COLS = [
    { id: "VMes", x: 72 }, { id: "VMed", x: 152 }, { id: "VDis", x: 232 },
    { id: "PMes", x: 72 }, { id: "PMed", x: 152 }, { id: "PDis", x: 232 },
  ];
  const sites = COLS.map(({ id, x }) => {
    const y = id.startsWith("V") ? 64 : 266;
    const rec = record.sites[id];
    const sev = pdSeverity(rec?.pd);
    const isSel = selected === id;
    const cal = rec?.pd !== undefined ? rec.pd + (rec.rec ?? 0) : undefined;
    const strokeSel = isSel ? 3 : rec?.pd !== undefined ? 2 : 1.4;
    const strokeCol = rec?.pd !== undefined ? SEVERITY_COLOR[sev] : "#b9c6c2";
    const fillCol = rec?.pd !== undefined ? SEVERITY_COLOR[sev] + "22" : "#ffffff";
    const txtCol = rec?.pd !== undefined ? SEVERITY_COLOR[sev] : "#93a5a0";
    return `<g class="site-g ${onSelect ? "clickable" : ""}" data-site="${id}" role="${onSelect ? "button" : ""}" aria-label="Sitio ${siteById(id).label}">
      <line x1="${x}" y1="${y + (id.startsWith("V") ? 16 : -16)}" x2="${x + (x - 152) * 0.16}" y2="${id.startsWith("V") ? 120 : 210}" stroke="#c7d3d0" stroke-width="1.2"/>
      <circle cx="${x}" cy="${y}" r="24" fill="${fillCol}" stroke="${strokeCol}" stroke-width="${strokeSel}"/>
      <text x="${x}" y="${y + 5}" text-anchor="middle" font-size="15" font-weight="700" fill="${txtCol}">${rec?.pd !== undefined ? rec.pd.toFixed(1) : "—"}</text>
      ${rec?.rec ? `<text x="${x}" y="${y + 36}" text-anchor="middle" font-size="9" font-weight="600" fill="#8a5a44">R ${rec.rec.toFixed(1)}</text>` : ""}
      ${cal !== undefined && rec?.rec ? `<text x="${x}" y="${y - 32}" text-anchor="middle" font-size="9" font-weight="700" fill="#55716c">NIC ${cal.toFixed(1)}</text>` : ""}
      ${rec?.bop ? `<g transform="translate(${x + 16}, ${y - 16})"><circle r="7.5" fill="#c22035"/>
        <path d="M0 -3.2 C2.4 0 3.2 1.2 3.2 2.4 A3.2 3.2 0 1 1 -3.2 2.4 C-3.2 1.2 -2.4 0 0 -3.2 z" fill="#fff" transform="scale(0.75)"/></g>` : ""}
      ${rec?.sup ? `<circle cx="${x - 17}" cy="${y - 17}" r="5" fill="#7c3aed" opacity="0.85"/>` : ""}
      <text x="${x}" y="${id.startsWith("V") ? y - 32 : y + 54}" text-anchor="middle" font-size="9.5" font-weight="600" fill="#5b6f6a">${siteById(id).short}</text>
    </g>`;
  }).join("");
  const chart = `<svg viewBox="0 0 304 330" class="tooth-chart" role="img" aria-label="Odontograma del diente 11">
    <text x="152" y="18" text-anchor="middle" font-size="12" font-weight="600" fill="#5b6f6a">VESTIBULAR</text>
    <text x="152" y="326" text-anchor="middle" font-size="12" font-weight="600" fill="#5b6f6a">PALATINO</text>
    <g opacity="0.65">
      <line x1="26" y1="120" x2="26" y2="210" stroke="#0d7a6e" stroke-width="2" stroke-dasharray="5 4"/>
      <text x="26" y="112" text-anchor="middle" fill="#0d7a6e" font-size="10" font-weight="700">M</text>
      <text x="278" y="112" text-anchor="middle" fill="#5b6f6a" font-size="10" font-weight="700">D</text>
    </g>
    <path d="M104 118 h96 a10 10 0 0 1 10 10 v76 c0 26 -14 40 -24 52 c-8 10 -18 16 -24 16 s-16 -6 -24 -16 c-10 -12 -24 -26 -24 -52 v-76 a10 10 0 0 1 10 -10 z" fill="#f4f2ec" stroke="#c9c4b8" stroke-width="1.5"/>
    <path d="M118 118 v70 M186 118 v70" stroke="#e3ddcf" stroke-width="1.4" fill="none"/>
    <text x="152" y="196" text-anchor="middle" fill="#9a9384" font-size="15" font-weight="800">11</text>
    ${sites}
    <g><rect x="236" y="216" width="58" height="30" rx="6" fill="#eef4f3" stroke="#c7d3d0"/>
      <text x="265" y="229" text-anchor="middle" font-size="8.5" fill="#5b6f6a" font-weight="600">MOVILIDAD</text>
      <text x="265" y="241" text-anchor="middle" font-size="11" font-weight="800" fill="#10201e">${record.mobility}</text></g>
  </svg>`;
  if (!onSelect) return chart;
  const holder = html(`<div class="w-full">${chart}</div>`);
  holder.addEventListener("click", (e) => {
    const g = e.target.closest("[data-site]");
    if (g) onSelect(g.dataset.site);
  });
  return holder;
}

/** Tabla compacta de los 6 sitios. */
function SiteTableHTML(record) {
  const rows = SITE_IDS.map((id) => {
    const s = record.sites[id];
    const pd = s?.pd;
    const cal = pd !== undefined ? Math.round((pd + (s.rec ?? 0)) * 10) / 10 : undefined;
    return `<tr>
      <td class="strong">${siteById(id).label}</td>
      <td class="num">${pd !== undefined ? `<span class="pd-pill" style="color:${SEVERITY_COLOR[pdSeverity(pd)]};background:${SEVERITY_COLOR[pdSeverity(pd)]}1c">${pd.toFixed(1)}</span>` : '<span class="muted">—</span>'}</td>
      <td class="num">${s?.rec ? s.rec.toFixed(1) : "—"}</td>
      <td class="num strong">${cal !== undefined ? cal.toFixed(1) : "—"}</td>
      <td>${s?.bop ? "Positivo" : s?.pd !== undefined ? "Negativo" : "—"}</td>
      <td>${s?.sup ? "Sí" : s?.pd !== undefined ? "No" : "—"}</td>
    </tr>`;
  }).join("");
  return `<div class="table-wrap"><table class="table">
    <thead><tr><th>Sitio</th><th>PD (mm)</th><th>Recesión</th><th>NIC</th><th>Sangrado</th><th>Supuración</th></tr></thead>
    <tbody>${rows}</tbody></table></div>`;
}

function perioInterpretation(record) {
  const summary = summarizeTooth(record);
  if (summary.recorded === 0) return "";
  const pockets = SITE_IDS.filter((id) => (record.sites[id]?.pd ?? 0) >= 4);
  const deep = SITE_IDS.filter((id) => (record.sites[id]?.pd ?? 0) >= 6);
  const bopPct = Math.round((summary.bopCount / 6) * 100);
  const lines = [];
  if (pockets.length === 0) {
    lines.push(`Todos los sitios registrados presentan sondaje &lt; 4 mm${summary.bopCount > 0 ? " con inflamación" : " y sin sangrado"}, compatible con ${summary.bopCount > 0 ? "gingivitis" : "salud periodontal"}.`);
  } else {
    lines.push(`Sitios con sondaje ≥ 4 mm: ${pockets.map((id) => `${siteById(id).short} (${record.sites[id].pd.toFixed(1)})`).join(", ")}.`);
    if (deep.length > 0) lines.push(`Bolsas profundas (≥ 6 mm): ${deep.map((id) => siteById(id).short).join(", ")} — indicación de terapia instrumentada subgingival.`);
  }
  if (summary.maxCal !== null && summary.maxCal >= 4) {
    lines.push(`NIC máximo de ${summary.maxCal.toFixed(1)} mm: pérdida de inserción que sugiere periodontitis (valora el estadio con CAL, pérdida ósea y dientes perdidos).`);
  } else if (summary.bopCount >= 3) {
    lines.push("NIC conservado con BOP elevado: patrón compatible con gingivitis (seudobolsas).");
  }
  lines.push(`Sangrado al sondaje en ${summary.bopCount}/6 sitios (${bopPct} %).`);
  return `<div class="card pad interpret">
    <h3 class="card-title primary">${icon("info", 15)} Interpretación del registro</h3>
    <ul class="interp-list">${lines.map((l) => `<li>${l}</li>`).join("")}</ul>
    <p class="hint">Interpretación educativa automática basada en umbrales clínicos convencionales; no sustituye el criterio profesional.</p>
  </div>`;
}

function renderPerioTooth11(root) {
  const toothId = PRIMARY_TOOTH.id;
  let selected = "VMed";

  const paint = () => {
    const record = Perio.getTooth(toothId);
    const summary = summarizeTooth(record);
    root.innerHTML = `
    <div class="perio-layout">
      <div class="perio-main">
        <div class="card pad center">
          <div class="perio-chart-head">
            <span class="badge subtle">${esc(PRIMARY_TOOTH.name)}</span>
            <div class="legend">
              <span><i style="background:${SEVERITY_COLOR.healthy}"></i> 0–3</span>
              <span><i style="background:${SEVERITY_COLOR.mild}"></i> 3–4</span>
              <span><i style="background:${SEVERITY_COLOR.moderate}"></i> 4–6</span>
              <span><i style="background:${SEVERITY_COLOR.severe}"></i> ≥ 6</span>
            </div>
          </div>
          <div class="perio-chart-host" id="perio-chart"></div>
          <div class="badge-row">
            <span class="badge outline">Sitios registrados: ${summary.recorded}/6</span>
            <span class="badge outline">BOP: ${summary.bopCount}/6</span>
            ${summary.maxPd !== null ? `<span class="badge outline">PD máx: ${summary.maxPd.toFixed(1)} mm</span>` : ""}
            ${summary.maxCal !== null ? `<span class="badge outline">NIC máx: ${summary.maxCal.toFixed(1)} mm</span>` : ""}
          </div>
          <div class="btn-row center">
            <button class="btn small outline" id="perio-tosim">${icon("box", 15)} Registrar en la simulación 3D</button>
            <button class="btn small outline" id="perio-clear">${icon("trash", 15)} Limpiar diente</button>
          </div>
        </div>
        <div class="card pad">
          <h3 class="card-title">Registro por sitio</h3>
          <p class="hint mb">PD = profundidad de sondaje · NIC = PD + recesión (nivel de inserción clínica)</p>
          ${SiteTableHTML(record)}
        </div>
        ${perioInterpretation(record)}
      </div>
      <aside class="side-panel">
        <div class="card pad">
          <h3 class="card-title">Datos del diente</h3>
          <p class="hint mb">Movilidad (Miller) y furcación se registran a nivel del diente completo.</p>
          <div class="grid-2">
            <label class="field"><span>Movilidad</span>
              <select class="select" id="perio-mob">
                ${[0, 1, 2, 3].map((m) => `<option value="${m}" ${record.mobility === m ? "selected" : ""}>Grado ${m}${m === 0 ? " (fisiológica)" : ""}</option>`).join("")}
              </select></label>
            <label class="field"><span>Furcación</span><input class="input" value="—" disabled title="Diente unirradicular"></label>
          </div>
          <hr class="sep">
          <div id="perio-site-editor"></div>
        </div>
        <div class="card pad">
          <h3 class="card-title primary">${icon("clipboard-list", 15)} Boca completa</h3>
          <p class="hint">El mismo registro, extendido a la dentición completa (FDI 32 dientes):
          practica el <b>llenado del periodontograma</b> con cabecera de paciente,
          índices en vivo, interpretación, exportación CSV, impresión y ejercicios
          corregidos (hoja del examinador y dictado por cuadrante).</p>
          <div class="btn-row"><button class="btn small primary" data-tab="full">${icon("arrow-right", 14)} Abrir boca completa</button></div>
        </div>
      </aside>
    </div>`;

    $("#perio-chart", root).appendChild(ToothChartSVG(record, { selected, onSelect: (s) => { selected = s; paint(); } }));
    $("#perio-mob", root).addEventListener("change", (e) => Perio.setTooth(toothId, { mobility: +e.target.value }));

    const edHost = $("#perio-site-editor", root);
    const data = record.sites[selected];
    const cal = data?.pd !== undefined ? Math.round((data.pd + (data.rec ?? 0)) * 10) / 10 : undefined;
    edHost.innerHTML = `
      <div class="site-ed">
        <h4>${siteById(selected).label}</h4>
        <p class="hint">Superficie ${siteById(selected).surface} · zona ${siteById(selected).sector}</p>
        <div class="grid-2">
          <label class="field"><span>Profundidad de sondaje (mm)</span>
            <input class="input num" id="se-pd" type="number" min="0" max="15" step="0.5" value="${data?.pd ?? ""}" placeholder="—"></label>
          <label class="field"><span>Recesión gingival (mm)</span>
            <input class="input num" id="se-rec" type="number" min="0" max="8" step="0.5" value="${data?.rec ?? ""}" placeholder="0"></label>
        </div>
        <div class="cal-box"><span>Nivel de inserción clínica (CAL)</span><b>${cal !== undefined ? cal.toFixed(1) + " mm" : "—"}</b></div>
        <div class="ctl-row"><span class="ctl-label">Sangrado al sondaje (BOP)</span><span id="se-bop"></span></div>
        <div class="ctl-row"><span class="ctl-label">Supuración</span><span id="se-sup"></span></div>
      </div>`;
    const recalc = () => {
      const d = Perio.getTooth(toothId).sites[selected];
      const c = d?.pd !== undefined ? Math.round((d.pd + (d.rec ?? 0)) * 10) / 10 : undefined;
      $(".cal-box b", edHost).textContent = c !== undefined ? c.toFixed(1) + " mm" : "—";
    };
    $("#se-pd", edHost).addEventListener("change", (e) => {
      const v = e.target.value;
      Perio.setSite(toothId, selected, { pd: v === "" ? undefined : Math.max(0, Math.min(15, +v)) });
      recalc();
    });
    $("#se-rec", edHost).addEventListener("change", (e) => {
      const v = e.target.value;
      Perio.setSite(toothId, selected, { rec: v === "" ? undefined : Math.max(0, Math.min(8, +v)) });
      recalc();
    });
    $("#se-bop", edHost).appendChild(switchEl(!!data?.bop, (v) => Perio.setSite(toothId, selected, { bop: v })));
    $("#se-sup", edHost).appendChild(switchEl(!!data?.sup, (v) => Perio.setSite(toothId, selected, { sup: v })));

    $("#perio-tosim", root).addEventListener("click", () => {
      const maxPd = summary.maxPd ?? 0;
      const cond = maxPd >= 5.5 ? "perio-moderada" : maxPd >= 4.5 ? "perio-leve" : (summary.bopCount > 0 && maxPd >= 3) ? "gingivitis" : "sano";
      App.launchSim({
        conditionId: cond,
        focusSite: selected,
        returnTo: "periodontograma",
        label: `Practicar el sitio ${siteById(selected).short} en 3D`,
      });
    });
    $("#perio-clear", root).addEventListener("click", () => { Perio.clearTooth(toothId); paint(); });
  };

  paint();
  const off = Bus.on("perio", () => paint());
  return () => Bus.off("perio", off);
}
