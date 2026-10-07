/* AR PERIO — ui.js · Iconos SVG, utilidades DOM, toasts, modales y lightbox. */

/* ------------------------------- Iconografía ------------------------------ */

const ICONS = {
  "book-open": '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
  box: '<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="M3.3 7 12 12l8.7-5"/><path d="M12 22V12"/>',
  crosshair: '<circle cx="12" cy="12" r="10"/><path d="M22 12h-4M6 12H2M12 6V2M12 22v-4"/>',
  "clipboard-list": '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4M12 16h4M8 11h.01M8 16h.01"/>',
  stethoscope: '<path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/>',
  target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  "line-chart": '<path d="M3 3v18h18"/><path d="m7 14 4-4 4 4 5-5"/>',
  "graduation-cap": '<path d="M22 10 12 5 2 10l10 5 10-5z"/><path d="M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5"/><path d="M22 10v6"/>',
  "arrow-left": '<path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>',
  "arrow-right": '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  plus: '<path d="M5 12h14M12 5v14"/>',
  save: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/>',
  trash: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  pencil: '<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>',
  copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>',
  "file-plus": '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v5h5"/><path d="M12 11v6M9 14h6"/>',
  droplet: '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>',
  hand: '<path d="M18 11V6a2 2 0 0 0-4 0v5M14 10V4a2 2 0 0 0-4 0v6M10 10.5V6a2 2 0 0 0-4 0v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>',
  "rotate-ccw": '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
  maximize: '<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>',
  minimize: '<path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/><path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/>',
  ruler: '<path d="M21.3 8.7 15.3 2.7a1 1 0 0 0-1.4 0L2.7 13.9a1 1 0 0 0 0 1.4l6 6a1 1 0 0 0 1.4 0l11.2-11.2a1 1 0 0 0 0-1.4z"/><path d="m7.5 10.5 2 2M10.5 7.5l2 2M13.5 4.5l2 2"/>',
  waves: '<path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>',
  layers: '<path d="M12 2 2 7l10 5 10-5-10-5z"/><path d="m2 12 10 5 10-5"/><path d="m2 17 10 5 10-5"/>',
  camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  "check-circle": '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/>',
  "x-circle": '<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/>',
  lightbulb: '<path d="M15 14c.2-1 .7-1.7 1.5-2.5A6 6 0 1 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6M10 22h4"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  timer: '<path d="M10 2h4"/><path d="m12 14 3-3"/><circle cx="12" cy="14" r="8"/>',
  award: '<circle cx="12" cy="8" r="6"/><path d="M15.5 12.9 17 22l-5-3-5 3 1.5-9.1"/>',
  "list-checks": '<path d="m3 17 2 2 4-4"/><path d="m3 7 2 2 4-4"/><path d="M13 6h8M13 12h8M13 18h8"/>',
  "alert-triangle": '<path d="M21.73 18l-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4M12 17h.01"/>',
  activity: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
  lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  "log-out": '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/>',
  eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
  "refresh-cw": '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/>',
  user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  key: '<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/>',
  zoom: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/><path d="M11 8v6M8 11h6"/>',
  brush: '<path d="m9.06 11.9 8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08"/><path d="M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1.08 1.1 2.49 2.02 4 2.02 2.2 0 4-1.8 4-4.04a3.01 3.01 0 0 0-3-3.02z"/>',
  "chevron-up": '<path d="m18 15-6-6-6 6"/>',
  "chevron-down": '<path d="m6 9 6 6 6-6"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  "user-plus": '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6"/><path d="M22 11h-6"/>',
  shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1 1 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
  play: '<path d="m6 4 14 8-14 8z"/>',
  printer: '<path d="M6 9V3h12v6"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8" rx="1"/>',
};

/** Devuelve el SVG del icono. */
function icon(name, size = 20, cls = "") {
  const d = ICONS[name] || ICONS.info;
  return `<svg class="ic ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
}

/* ------------------------------ Utilidades DOM ---------------------------- */

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/** Texto con **negritas** → HTML seguro. */
function mdInline(s) {
  return esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
}

function $(sel, root = document) { return root.querySelector(sel); }
function $$(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

/** Crea un elemento desde HTML. */
function html(fragment) {
  const t = document.createElement("template");
  t.innerHTML = fragment.trim();
  return t.content.firstElementChild;
}

/** Interruptor estilizado. Devuelve el elemento; onChange(bool). */
function switchEl(checked, onChange, id = "") {
  const wrap = html(`<label class="ap-switch ${id ? "" : "no-id"}" ${id ? `for="${id}"` : ""}>
    <input type="checkbox" ${checked ? "checked" : ""}>
    <span class="ap-track"><span class="ap-knob"></span></span>
  </label>`);
  const input = $("input", wrap);
  input.addEventListener("change", () => onChange(input.checked));
  return wrap;
}

function fmtTime(seconds) {
  if (seconds < 60) return `${Math.round(seconds)} s`;
  const m = Math.round(seconds / 60);
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)} h ${m % 60} min`;
}

function fmtClock(seconds) {
  return `${Math.floor(seconds / 60)}:${String(Math.round(seconds % 60)).padStart(2, "0")}`;
}

/* --------------------------------- Toasts --------------------------------- */

let _toastHost = null;
function toast(opts) {
  if (!_toastHost) {
    _toastHost = html('<div id="ap-toasts" aria-live="polite"></div>');
    document.body.appendChild(_toastHost);
  }
  const { title, description = "", variant = "default" } = opts;
  const el = html(`<div class="ap-toast ${variant === "destructive" ? "destructive" : ""}">
    <div class="ap-toast-bar"></div>
    <div class="ap-toast-body">
      <p class="ap-toast-title">${esc(title)}</p>
      ${description ? `<p class="ap-toast-desc">${esc(description)}</p>` : ""}
    </div>
  </div>`);
  _toastHost.appendChild(el);
  requestAnimationFrame(() => el.classList.add("show"));
  const kill = () => {
    el.classList.remove("show");
    setTimeout(() => el.remove(), 320);
  };
  el.addEventListener("click", kill);
  setTimeout(kill, 4600);
}

/* --------------------------------- Modales -------------------------------- */

let _modalHost = null;
/** Abre un modal. Devuelve el overlay (con .close()). */
function openModal(contentHTML, { wide = false, onClose = null } = {}) {
  closeModal();
  const overlay = html(`<div class="ap-modal-overlay">
    <div class="ap-modal ${wide ? "wide" : ""}" role="dialog" aria-modal="true">
      <button class="ap-modal-x" aria-label="Cerrar">${icon("x", 18)}</button>
      <div class="ap-modal-content"></div>
    </div>
  </div>`);
  $(".ap-modal-content", overlay).innerHTML = contentHTML;
  document.body.appendChild(overlay);
  document.body.classList.add("ap-modal-open");
  requestAnimationFrame(() => overlay.classList.add("show"));
  const close = () => {
    overlay.classList.remove("show");
    document.body.classList.remove("ap-modal-open");
    setTimeout(() => overlay.remove(), 220);
    if (onClose) onClose();
  };
  overlay.close = close;
  $(".ap-modal-x", overlay).addEventListener("click", close);
  overlay.addEventListener("pointerdown", (e) => { if (e.target === overlay) close(); });
  return overlay;
}

function closeModal() {
  const o = $(".ap-modal-overlay");
  if (o && o.close) o.close();
}

/* -------------------------------- Lightbox -------------------------------- */

/** Visor a pantalla completa de una imagen (foto clínica o radiografía).
 * Para radiografías añade controles de brillo/contraste/inversión. */
function openLightbox(src, caption = "", { radio = false } = {}) {
  const overlay = html(`<div class="ap-lightbox">
    <div class="ap-lightbox-top">
      <p class="ap-lightbox-caption">${esc(caption)}</p>
      <button class="ap-lb-btn" data-a="close" aria-label="Cerrar">${icon("x", 20)}</button>
    </div>
    <div class="ap-lightbox-stage"><img src="${src}" alt="${esc(caption)}" draggable="false"></div>
    ${radio ? `<div class="ap-lightbox-tools">
        <label>Brillo <input type="range" min="40" max="180" value="100" data-a="bright"></label>
        <label>Contraste <input type="range" min="40" max="220" value="115" data-a="contrast"></label>
        <button class="ap-lb-btn" data-a="invert" title="Invertir (negativo)">${icon("eye", 16)} Invertir</button>
        <button class="ap-lb-btn" data-a="reset" title="Restablecer">${icon("refresh-cw", 16)} Restablecer</button>
      </div>` : ""}
  </div>`);
  document.body.appendChild(overlay);
  document.body.classList.add("ap-modal-open");
  requestAnimationFrame(() => overlay.classList.add("show"));
  const img = $("img", overlay);
  const state = { b: 100, c: 115, inv: false };
  const apply = () => {
    img.style.filter = `brightness(${state.b}%) contrast(${state.c}%) ${state.inv ? "invert(1)" : ""}`;
  };
  apply();
  const close = () => {
    overlay.classList.remove("show");
    document.body.classList.remove("ap-modal-open");
    setTimeout(() => overlay.remove(), 200);
  };
  overlay.close = close;
  $('[data-a="close"]', overlay).addEventListener("click", close);
  overlay.addEventListener("pointerdown", (e) => { if (e.target === overlay) close(); });
  // Zoom y arrastre de la imagen
  let scale = 1, drag = null;
  const stage = $(".ap-lightbox-stage", overlay);
  stage.addEventListener("wheel", (e) => {
    e.preventDefault();
    scale = Math.min(6, Math.max(1, scale * (e.deltaY < 0 ? 1.15 : 0.87)));
    img.style.transform = `translate(${img._tx || 0}px, ${img._ty || 0}px) scale(${scale})`;
    img.classList.toggle("zoomed", scale > 1);
  }, { passive: false });
  img.addEventListener("pointerdown", (e) => {
    if (scale <= 1) return;
    drag = { x: e.clientX, y: e.clientY, tx: img._tx || 0, ty: img._ty || 0 };
    img.setPointerCapture(e.pointerId);
  });
  img.addEventListener("pointermove", (e) => {
    if (!drag) return;
    img._tx = drag.tx + (e.clientX - drag.x);
    img._ty = drag.ty + (e.clientY - drag.y);
    img.style.transform = `translate(${img._tx}px, ${img._ty}px) scale(${scale})`;
  });
  img.addEventListener("pointerup", () => (drag = null));
  const bright = $('[data-a="bright"]', overlay);
  const contrast = $('[data-a="contrast"]', overlay);
  if (bright) bright.addEventListener("input", () => { state.b = +bright.value; apply(); });
  if (contrast) contrast.addEventListener("input", () => { state.c = +contrast.value; apply(); });
  const inv = $('[data-a="invert"]', overlay);
  if (inv) inv.addEventListener("click", () => { state.inv = !state.inv; apply(); });
  const rst = $('[data-a="reset"]', overlay);
  if (rst) rst.addEventListener("click", () => {
    state.b = 100; state.c = 115; state.inv = false; scale = 1; img._tx = 0; img._ty = 0;
    if (bright) bright.value = 100;
    if (contrast) contrast.value = 115;
    img.style.transform = "";
    apply();
  });
  return overlay;
}

/* --------------------------- Subida de imágenes --------------------------- */

/** Lee un archivo de imagen y lo reescala (límite maxDim) a dataURL JPEG. */
function fileToDataURL(file, maxDim = 1100, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onerror = () => reject(new Error("No se pudo leer el archivo"));
    fr.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Imagen no válida"));
      img.onload = () => {
        const k = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * k));
        const h = Math.max(1, Math.round(img.height * k));
        const c = document.createElement("canvas");
        c.width = w; c.height = h;
        c.getContext("2d").drawImage(img, 0, 0, w, h);
        resolve(c.toDataURL("image/jpeg", quality));
      };
      img.src = fr.result;
    };
    fr.readAsDataURL(file);
  });
}

/** Abre el selector de archivos y devuelve las imágenes como dataURL. */
function pickImages({ multiple = false, maxDim = 1100, accept = "image/*" } = {}) {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.multiple = multiple;
    input.style.display = "none";
    document.body.appendChild(input);
    input.addEventListener("change", async () => {
      const files = Array.from(input.files || []);
      const out = [];
      for (const f of files) {
        try { out.push(await fileToDataURL(f, maxDim)); } catch (e) { console.warn(e); }
      }
      input.remove();
      resolve(out);
    });
    input.addEventListener("cancel", () => { input.remove(); resolve([]); });
    input.click();
  });
}
