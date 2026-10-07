/* AR PERIO — views/explore.js · Módulo 2: exploración 3D con capas y modos.
 * También define el contenedor de visor 3D reutilizable. */

/** Crea un visor 3D dentro de parent. Devuelve {wrap, scene, dispose()}. */
function makeViewer3D(parent, opts = {}) {
  const wrap = html('<div class="viewer3d" style="touch-action:none"></div>');
  parent.appendChild(wrap);
  let scene = null;
  try {
    scene = new PeriodontalScene(wrap, opts);
    if (opts.onReady) opts.onReady(scene);
  } catch (e) {
    console.error("AR PERIO: error al iniciar WebGL", e);
    wrap.innerHTML = `<div class="viewer-error">No se pudo iniciar el visor 3D en este dispositivo.
      Verifica que el navegador tenga aceleración gráfica (WebGL) habilitada.</div>`;
  }
  return {
    wrap,
    scene,
    dispose() {
      try { scene && scene.dispose(); } catch (e) { console.warn(e); }
      wrap.remove();
    },
  };
}

function viewerHelpTip() {
  return `<div class="viewer-tip">Cámara: arrastrar = rotar · rueda/pellizco = zoom · clic derecho = desplazar</div>`;
}

/** Añade al marco del visor 3D el botón de pantalla completa.
 * (La tecla Escape se gestiona con un único listener global en app.js.) */
function bindViewerFullscreen(frame) {
  if (!frame) return;
  const btn = html(`<button class="viewer-fs" title="Pantalla completa" aria-label="Pantalla completa">${icon("maximize", 15)}</button>`);
  frame.appendChild(btn);
  btn.addEventListener("click", () => {
    const on = frame.classList.toggle("viewer-full");
    btn.innerHTML = on ? icon("minimize", 15) : icon("maximize", 15);
    btn.title = on ? "Salir de pantalla completa" : "Pantalla completa";
    btn.setAttribute("aria-label", btn.title);
  });
}

function renderExplore(root) {
  root.innerHTML = `
  <div class="explore-layout">
    <div class="viewer-frame">
      <div class="viewer-host" id="exp-viewer"></div>
      ${viewerHelpTip()}
    </div>
    <aside class="side-panel">
      <div class="card pad">
        <div class="panel-title">${icon("camera", 15)} Vistas</div>
        <div class="view-btns" id="exp-views"></div>
        <hr class="sep">
        <div class="panel-title">Modo de visualización</div>
        <div class="mode-btns" id="exp-modes"></div>
        <p class="hint" id="exp-mode-hint"></p>
      </div>
      <div class="card pad">
        <div class="panel-title">${icon("layers", 15)} Capas anatómicas</div>
        <div id="exp-layers" class="layer-list"></div>
        <p class="hint">Al desactivar una capa se oculta visualmente sin eliminar el modelo.</p>
      </div>
      <div class="card pad">
        <div class="panel-title">Anatomía del modelo</div>
        <p class="hint">Corona anatómicamente correcta con esmalte realista, dentina, región
        cervical (CEJ), raíz con cemento, encía marginal y adherida con surco gingival real,
        ligamento periodontal y hueso alveolar con su cresta a 1.5–2 mm del CEJ. Cambia al
        modo anatómico y usa la vista «Anatómica interna» para estudiar las relaciones internas.</p>
      </div>
    </aside>
  </div>`;

  const viewer = makeViewer3D($("#exp-viewer", root), { probeVisible: false });
  bindViewerFullscreen($(".viewer-frame", root));
  const scene = viewer.scene;
  let layers = scene ? scene.getLayers() : null;
  let mode = scene ? scene.getMode() : "clinico";

  // Vistas
  const viewsHost = $("#exp-views", root);
  viewsHost.innerHTML = VIEW_BUTTONS.map((v) =>
    `<button class="btn small outline" data-view="${v.id}">${esc(v.label)}</button>`).join("") +
    `<button class="btn small outline" data-view="inicio">${icon("rotate-ccw", 13)} Reiniciar vista</button>`;
  viewsHost.addEventListener("click", (e) => {
    const b = e.target.closest("[data-view]");
    if (b && scene) scene.setView(b.dataset.view);
  });

  // Modos
  const MODES = [
    { id: "clinico", label: "Clínico", hint: "Modo clínico: modelo completamente realista, como se ve en la boca." },
    { id: "anatomico", label: "Anatómico", hint: "Modo anatómico: esmalte y encía translúcidos para observar dentina, pulpa, ligamento y hueso." },
    { id: "transparente", label: "Transparente", hint: "Modo transparente: relaciona diente, encía, ligamento y hueso alveolar." },
  ];
  const modesHost = $("#exp-modes", root);
  const modeHint = $("#exp-mode-hint", root);
  const paintModes = () => {
    modesHost.innerHTML = MODES.map((m) =>
      `<button class="mode-btn ${mode === m.id ? "active" : ""}" data-mode="${m.id}" title="${esc(m.hint)}">${esc(m.label)}</button>`).join("");
    modeHint.textContent = (MODES.find((m) => m.id === mode) || MODES[0]).hint;
  };
  paintModes();
  modesHost.addEventListener("click", (e) => {
    const b = e.target.closest("[data-mode]");
    if (!b) return;
    mode = b.dataset.mode;
    scene && scene.setMode(mode);
    paintModes();
  });

  // Capas
  const LAYER_ORDER = ["diente", "esmalte", "dentina", "raiz", "pulpa", "encia", "ligamento", "hueso", "sonda"];
  const layersHost = $("#exp-layers", root);
  const paintLayers = () => {
    layersHost.innerHTML = LAYER_ORDER.map((id) => `
      <div class="layer-row ${id === "diente" ? "strong" : ""}">
        <span class="layer-label">${esc(LAYER_LABELS[id])}</span>
        <span data-layer-slot="${id}"></span>
      </div>`).join("");
    for (const id of LAYER_ORDER) {
      const slot = $(`[data-layer-slot="${id}"]`, layersHost);
      slot.appendChild(switchEl(!!layers[id], (v) => {
        scene && scene.setLayer(id, v);
        layers[id] = v;
        if (id === "diente") { layers.esmalte = v; layers.dentina = v; layers.raiz = v; paintLayers(); }
      }));
    }
  };
  if (layers) paintLayers();

  return () => viewer.dispose();
}
