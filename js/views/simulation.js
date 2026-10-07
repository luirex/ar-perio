/* AR PERIO — views/simulation.js · Módulo 3: simulación de sondaje.
 * Espacio de trabajo compartido con Práctica/Desafíos.
 */

/** Construye el espacio de sondaje (visor + HUD + controles).
 * opts: {conditionId, onConditionChange, focusSite, guideDefault,
 *        onMeasurement, hideConditionSelector}
 * Devuelve {root, dispose(), getScene()} */
function buildProbingWorkspace(parent, opts = {}) {
  const state = {
    conditionId: opts.conditionId || "sano",
    guide: opts.guideDefault !== false,
    recordBop: false,
  };
  let lastOverpressure = 0;

  const root = html(`
  <div class="probe-layout">
    <div class="viewer-frame">
      <div class="viewer-host" id="pw-viewer"></div>
      <div class="viewer-overlay-instr">
        <span class="oi-title">${icon("hand", 14)} Arrastra la sonda</span>
        Arrastra la <b>punta</b> hasta el margen gingival: se acoplará al diente.<br>
        Vertical = insertar · Horizontal = cambiar de sitio.
      </div>
      ${viewerHelpTip()}
    </div>
    <aside class="probe-side">
      <div class="card pad" id="pw-hud"></div>
      <div class="card pad" id="pw-controls"></div>
    </aside>
  </div>`);
  parent.appendChild(root);
  // Botón de pantalla completa para el visor 3D (Escape para salir)
  bindViewerFullscreen($(".viewer-frame", root));

  /* ------------------------------ HUD ------------------------------ */
  const hud = $("#pw-hud", root);
  hud.innerHTML = `
    <div class="panel-title">${icon("ruler", 15)} Medición en tiempo real</div>
    <p class="hud-depth">Profundidad de sondaje: <span class="hud-value">0.0</span> mm</p>
    <p class="hud-site">Sitio: <span class="hud-site-name">—</span></p>
    <div class="hud-chips"></div>
    <div class="hud-gaugerow">
      <div class="hud-gauge">
        <div class="hud-marker"></div>
        <div class="hud-scale"><span>12</span><span>9</span><span>6</span><span>3</span><span>0</span></div>
      </div>
      <div class="hud-gaugelegend">
        <p><b>Referencia de profundidad.</b> El marcador indica la posición de la punta
        respecto al margen gingival (0 mm).</p>
        <ul>
          <li><span class="dot g1"></span> 0–3 mm: surco fisiológico</li>
          <li><span class="dot g2"></span> 3–5 mm: vigilancia / seudobolsa</li>
          <li><span class="dot g3"></span> 5–8 mm: bolsa periodontal</li>
          <li><span class="dot g4"></span> &gt; 8 mm: bolsa profunda</li>
        </ul>
        <div class="hud-floormsg">Fondo del surco alcanzado — registra la medición</div>
      </div>
    </div>
    <button class="btn primary block" id="pw-register">${icon("droplet", 16)} Registrar medición</button>`;

  /* --------------------------- Controles --------------------------- */
  const controls = $("#pw-controls", root);
  const paintControls = () => {
    controls.innerHTML = `
      ${opts.hideConditionSelector ? "" : `
        <div class="panel-title">${icon("waves", 15)} Condición periodontal</div>
        <select class="select" id="pw-cond">
          ${PERIO_CONDITIONS.map((c) => `<option value="${c.id}" ${c.id === state.conditionId ? "selected" : ""}>${esc(c.label)}</option>`).join("")}
        </select>
        <p class="hint">${esc((PERIO_CONDITIONS.find((c) => c.id === state.conditionId) || PERIO_CONDITIONS[0]).description)}</p>
        <hr class="sep">`}
      <div class="ctl-row"><span class="ctl-label">${icon("target", 14)} Modo guiado</span><span id="pw-guide-slot"></span></div>
      <div class="ctl-row"><span class="ctl-label danger">${icon("droplet", 14)} Registrar sangrado</span><span id="pw-bop-slot"></span></div>
      <p class="hint">El sangrado se ve de forma natural al sondar: emerge al tocar fondo
      en un sitio inflamado o al forzar la sonda más allá del fondo. Con
      «Registrar sangrado» activo, el BOP se documenta además en el periodontograma
      al registrar la medición.</p>
      <hr class="sep">
      <button class="btn small outline block" id="pw-reset">${icon("rotate-ccw", 13)} Reiniciar sonda</button>
      <hr class="sep">
      <div class="panel-title">${icon("camera", 15)} Vistas rápidas</div>
      <div class="view-btns" id="pw-views">
        ${VIEW_BUTTONS.filter((v) => v.id !== "anatomica").map((v) =>
          `<button class="btn small outline" data-view="${v.id}">${esc(v.label)}</button>`).join("")}
        <button class="btn small outline" data-view="inicio">${icon("rotate-ccw", 13)} Reiniciar vista</button>
      </div>
      <p class="hint">Encuadra el modelo según el sitio que vayas a sondar. La vista anatómica
      completa (capas internas) está en el módulo Explorar.</p>`;
    const condSel = $("#pw-cond", controls);
    if (condSel) condSel.addEventListener("change", () => {
      state.conditionId = condSel.value;
      // La encía y los hitos del modelo deben responder a la condición elegida:
      // el visor 3D se reconstruye (color, edema, margen, fondo del surco, hueso).
      viewer.scene && viewer.scene.setCondition(condSel.value);
      if (opts.onConditionChange) opts.onConditionChange(state.conditionId);
      paintControls();
    });
    $("#pw-guide-slot", controls).appendChild(switchEl(state.guide, (v) => {
      state.guide = v;
      viewer.scene && viewer.scene.setGuide(v);
    }));
    $("#pw-bop-slot", controls).appendChild(switchEl(state.recordBop, (v) => {
      state.recordBop = v;
    }));
    $("#pw-reset", controls).addEventListener("click", () => viewer.scene && viewer.scene.resetProbe());
    const viewsHost = $("#pw-views", controls);
    if (viewsHost) viewsHost.addEventListener("click", (e) => {
      const b = e.target.closest("[data-view]");
      if (b && viewer.scene) viewer.scene.setView(b.dataset.view);
    });
  };
  paintControls();

  /* ----------------------------- Visor ----------------------------- */
  const viewer = makeViewer3D($("#pw-viewer", root), { conditionId: state.conditionId }, (scene) => {
    scene.setFocusSite(opts.focusSite ?? null);
    scene.setGuide(state.guide);
    scene.cb.onOverpressure = () => {
      const now = Date.now();
      if (now - lastOverpressure < 4000) return;
      lastOverpressure = now;
      Student.logError("sobrepaso-fondo");
      toast({
        title: "Presión excesiva",
        description: "Has intentado forzar la sonda más allá del fondo del surco. En la clínica, detente al percibir la resistencia.",
        variant: "destructive",
      });
    };
  });

  /* --------------------- HUD en bucle rAF -------------------------- */
  const depthEl = $(".hud-value", hud);
  const siteEl = $(".hud-site-name", hud);
  const markerEl = $(".hud-marker", hud);
  const chipsEl = $(".hud-chips", hud);
  const floorEl = $(".hud-floormsg", hud);
  let raf = 0, lastSite = "", lastFlags = "";
  const tick = () => {
    raf = requestAnimationFrame(tick);
    const sc = viewer.scene;
    if (!sc) return;
    const st = sc.getProbeState();
    depthEl.textContent = st.depth.toFixed(1);
    if (st.site !== lastSite) { lastSite = st.site; siteEl.textContent = siteById(st.site).label; }
    markerEl.style.bottom = `${Math.min(100, (st.depth / 12) * 100)}%`;
    floorEl.style.opacity = st.floorContact ? "1" : "0";
    const flags = `${st.engaged}|${st.inside}|${st.floorContact}|${st.bled}`;
    if (flags !== lastFlags) {
      lastFlags = flags;
      const chips = [];
      if (!st.engaged) chips.push(["Sonda libre", "slate"]);
      if (st.engaged && !st.inside) chips.push(["Acoplada al margen", "teal"]);
      if (st.inside && !st.floorContact) chips.push(["Insertada en el surco", "amber"]);
      if (st.floorContact) chips.push(["Fondo del surco alcanzado", "rose"]);
      if (st.bled) chips.push(["Sangrado provocado", "rose-strong"]);
      chipsEl.innerHTML = chips.map(([l, c]) => `<span class="chip ${c}">${l}</span>`).join("");
    }
  };
  raf = requestAnimationFrame(tick);

  /* --------------------- Registro de mediciones -------------------- */
  $("#pw-register", hud).addEventListener("click", () => {
    const sc = viewer.scene;
    if (!sc) return;
    const r = sc.registerMeasurement();
    if (!r) {
      toast({
        title: "No hay una medición válida",
        description: "Acopla la sonda al margen gingival e insértala al menos 0.5 mm antes de registrar.",
        variant: "destructive",
      });
      return;
    }
    const bop = state.recordBop && r.bled;
    Perio.setSite("incisivo-central-sup", r.site, { pd: r.measured, bop });
    Student.logMeasurement({
      site: r.site,
      conditionId: r.conditionId,
      measured: r.measured,
      actual: r.actual,
      error: Math.round(Math.abs(r.measured - r.actual) * 10) / 10,
    });
    if (Math.abs(r.measured - r.actual) > 1.0) Student.logError("valor-impreciso");
    if (opts.onMeasurement) opts.onMeasurement({ ...r, bled: bop });
    toast({
      title: `Medición registrada · ${siteById(r.site).short}`,
      description: `Profundidad de sondaje: ${r.measured.toFixed(1)} mm${r.bled ? " · Sangrado al sondaje: positivo" : ""}`,
    });
  });

  return {
    root,
    getScene: () => viewer.scene,
    setCondition(id) { state.conditionId = id; viewer.scene && viewer.scene.setCondition(id); paintControls(); },
    dispose() {
      cancelAnimationFrame(raf);
      viewer.dispose();
      root.remove();
    },
  };
}

/* ------------------------------ Módulo 3 ---------------------------------- */

function renderSimulation(root) {
  const ctx = App.simContext;
  root.innerHTML = `
    ${ctx ? `
    <div class="sim-banner">
      <div class="sim-banner-text">
        <p class="sim-banner-title">${esc(ctx.label || "Modo enfocado")}</p>
        <p class="sim-banner-sub">${ctx.focusSite
          ? `Practica el sitio ${siteById(ctx.focusSite).short} con la condición del caso y registra la medición.`
          : "Explora la condición indicada y registra tus mediciones."}</p>
      </div>
      <div class="sim-banner-actions">
        <button class="btn small outline" id="sim-exitfocus">Salir del enfoque</button>
        ${ctx.returnTo ? `<button class="btn small primary" id="sim-return">${icon("arrow-left", 14)} Volver</button>` : ""}
      </div>
    </div>` : ""}
    <div id="sim-workspace"></div>`;

  const ws = buildProbingWorkspace($("#sim-workspace", root), {
    conditionId: (ctx && ctx.conditionId) || "sano",
    focusSite: (ctx && ctx.focusSite) || null,
    guideDefault: true,
    onConditionChange: () => {},
  });

  const exitBtn = $("#sim-exitfocus", root);
  if (exitBtn) exitBtn.addEventListener("click", () => { App.clearSimContext(); App.setModule("simulacion"); });
  const retBtn = $("#sim-return", root);
  if (retBtn) retBtn.addEventListener("click", () => {
    const dest = ctx.returnTo;
    App.clearSimContext();
    location.hash = "#" + dest;
  });

  return () => ws.dispose();
}
