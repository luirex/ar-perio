/* AR PERIO — app.js · Shell SPA: navegación superior, enrutado por hash,
 * cabecera de módulo con retorno al menú y seguimiento de sesiones de estudio. */

const MODULE_IDS = ["home", "aprender", "explorar", "simulacion", "periodontograma", "casos", "practica", "progreso", "docente"];

const MODULE_META = {
  home: { title: "Inicio" },
  aprender: { title: "Aprender Periodoncia", subtitle: "Teoría interactiva con esquemas y mini evaluaciones", icon: "book-open" },
  explorar: { title: "Exploración 3D", subtitle: "Incisivo central superior permanente (FDI 11) · modelo anatómico interactivo", icon: "box", wide: true },
  simulacion: { title: "Simulación de sondaje", subtitle: "Sonda periodontal virtual · transparencia dinámica de la encía", icon: "crosshair", wide: true },
  periodontograma: { title: "Periodontograma", subtitle: "Diente 11 y boca completa (FDI 32 dientes) · práctica de llenado con ejercicios", icon: "clipboard-list" },
  casos: { title: "Casos clínicos", subtitle: "Razonamiento clínico en Periodoncia", icon: "stethoscope" },
  practica: { title: "Práctica / Desafíos", subtitle: "Entrenamiento evaluado con retroalimentación", icon: "target", wide: true },
  progreso: { title: "Mi progreso", subtitle: "Resultados, precisión y avance", icon: "line-chart" },
  docente: { title: "Panel docente", subtitle: "Gestión de contenido académico y revisión de resultados", icon: "graduation-cap", wide: true },
};

const App = {
  module: "home",
  _cleanup: null,

  moduleFromHash() {
    const h = location.hash.replace("#", "");
    return MODULE_IDS.includes(h) ? h : "home";
  },

  setModule(m) {
    if (!MODULE_IDS.includes(m)) m = "home";
    const target = m === "home" ? "#home" : "#" + m;
    if (location.hash !== target) history.replaceState(null, "", target);
    this.render(m);
  },

  /** Contexto para lanzar la simulación desde otro módulo (caso, perio…). */
  simContext: null,
  launchSim(ctx) { this.simContext = ctx; this.setModule("simulacion"); },
  clearSimContext() { this.simContext = null; },

  render(forced) {
    const m = forced || this.moduleFromHash();
    this.module = m;
    // Limpieza del módulo anterior (dispose de escenas 3D, listeners…)
    if (this._cleanup) { try { this._cleanup(); } catch (e) { console.warn(e); } this._cleanup = null; }
    Student.endSession();

    // Navegación superior
    this.paintNav();

    // Cabecera + contenido del módulo
    const meta = MODULE_META[m];
    const app = $("#app");
    const trackSession = m !== "practica"; // los desafíos miden su propio tiempo
    if (trackSession) Student.startSession(meta.title);
    app.innerHTML = `
      <header class="module-header ${meta.wide ? "wide" : ""}">
        <div class="mh-inner ${meta.wide ? "wide" : ""}">
          ${m !== "home" ? `<button class="btn small outline" id="mh-back" aria-label="Volver al menú principal">${icon("arrow-left", 15)}<span class="hide-sm">Menú</span></button>` : ""}
          <div class="mh-titles">
            ${meta.icon ? `<span class="mh-icon">${icon(meta.icon, 20)}</span>` : ""}
            <div><h1 class="mh-title">${esc(meta.title)}</h1>
              ${meta.subtitle ? `<p class="mh-subtitle">${esc(meta.subtitle)}</p>` : ""}</div>
          </div>
          <div class="mh-actions" id="mh-actions"></div>
        </div>
      </header>
      <main class="module-main ${meta.wide ? "wide" : ""}" id="module-root"></main>`;

    const root = $("#module-root");
    const views = {
      home: renderDashboard,
      aprender: renderLearn,
      explorar: renderExplore,
      simulacion: renderSimulation,
      periodontograma: renderPerio,
      casos: renderCases,
      practica: renderPractice,
      progreso: renderProgress,
      docente: renderTeacher,
    };
    this._cleanup = views[m](root) || null;
    const back = $("#mh-back");
    if (back) back.addEventListener("click", () => this.setModule("home"));
    window.scrollTo({ top: 0 });
  },

  paintNav() {
    const items = [{ id: "home", label: "Inicio" },
      ...MODULE_CARDS.map((m) => ({ id: m.id, label: NAV_SHORT[m.title] || m.title }))];
    const teacher = Session.isTeacher();
    const acc = Session.student();
    const nav = $("#topnav-inner");
    nav.innerHTML = `
      <a href="#home" class="brand" aria-label="AR PERIO — inicio">
        ${ARPerioLogoSVG()}
        <span class="brand-text">
          <span class="brand-name">AR PERIO</span>
          <span class="brand-sub hide-sm">Entrenamiento interactivo en Periodoncia</span>
        </span>
      </a>
      <nav class="top-links" aria-label="Módulos">
        ${items.map((it) => `<a href="#${it.id}" class="top-link ${this.module === it.id ? "active" : ""}" data-nav="${it.id}">${esc(it.label)}</a>`).join("")}
      </nav>
      <div class="nav-right">
        ${teacher
          ? `<span class="badge teacher">${icon("graduation-cap", 13)} Docente</span>
             <button class="btn small ghost" id="nav-logout" title="Cerrar sesión docente">${icon("log-out", 14)}<span class="hide-sm">Salir</span></button>`
          : acc
            ? `<span class="badge student" title="Sesión de ${esc(acc.name)}">${icon("user", 13)} <span class="hide-sm">${esc(acc.name.length > 16 ? acc.name.split(" ")[0] : acc.name)}</span></span>
               <button class="btn small ghost" id="nav-logout" title="Cerrar sesión de estudiante">${icon("log-out", 14)}<span class="hide-sm">Salir</span></button>`
            : `<button class="btn small ghost" id="nav-teacher" title="Acceso docente">${icon("lock", 14)}<span class="hide-sm">Docente</span></button>`}
        <button class="btn small outline icon-only burger" id="nav-burger" aria-label="Abrir menú">${icon("menu", 18)}</button>
      </div>`;
  },

  openMobileMenu(items) {
    const o = openModal(`<nav class="mobile-menu" aria-label="Módulos">
      ${items.map((it) => `<button class="mm-item ${this.module === it.id ? "active" : ""}" data-nav="${it.id}">${esc(it.label)}</button>`).join("")}
    </nav>`);
    o.addEventListener("click", (e) => {
      const b = e.target.closest("[data-nav]");
      if (b) { o.close(); this.setModule(b.dataset.nav); }
    });
  },
};

const NAV_SHORT = {
  "Aprender Periodoncia": "Aprender",
  "Exploración 3D": "Explorar",
  "Simulación de sondaje": "Simulación",
  "Periodontograma": "Periodonto.",
  "Casos clínicos": "Casos",
  "Práctica / Desafíos": "Práctica",
  "Mi progreso": "Progreso",
  "Panel docente": "Docente",
};

function ARPerioLogoSVG() {
  return `<svg viewBox="0 0 48 48" class="logo" role="img" aria-label="Logo AR PERIO">
    <rect x="1.5" y="1.5" width="45" height="45" rx="12" fill="#0d7a6e"/>
    <path d="M24 10c-4.2 0-6.6 2.5-7.2 6.2-.5 3 .2 5.6.9 8.6.8 3.6 1.1 7.5 1.7 12.2.3 2.2 1.6 3.3 2.7 2.6.9-.6 1-2.3 1.3-4.4.3-1.9.6-3.6 1.9-3.6 1.3 0 1.6 1.7 1.9 3.6.3 2.1.4 3.8 1.3 4.4 1.1.7 2.4-.4 2.7-2.6.6-4.7.9-8.6 1.7-12.2.7-3 1.4-5.6.9-8.6C36.6 12.5 34.2 10 30 10c-2.3 0-3.4 1-6 1s-3.7-1-6-1z" fill="#fdfdfb"/>
    <path d="M17.2 26.5c-2.2.6-3.6 1.9-3.6 3.7 0 2.3 2.1 3.8 4.6 4.2" fill="none" stroke="#e8a49c" stroke-width="1.6" stroke-linecap="round"/>
    <path d="M13.2 30.4c-1.8-4.4.4-8.9 3.8-10.9 2.4-1.4 5.3-1.5 7-1.5 1.7 0 4.6.1 7 1.5 3.4 2 5.6 6.5 3.8 10.9-1.2 3-4 5-7.6 5.6-1.2.2-2.1 1.2-3.2 1.2s-2-1-3.2-1.2c-3.6-.6-6.4-2.6-7.6-5.6z" fill="#e8a49c" opacity="0.92"/>
    <line x1="38" y1="6" x2="20.5" y2="23.5" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round"/>
    <circle cx="20.2" cy="23.8" r="1.7" fill="#ffffff"/>
    <line x1="30" y1="7.6" x2="31.9" y2="9.5" stroke="#0d1a17" stroke-width="1.6" stroke-linecap="round"/>
    <line x1="27.4" y1="10.2" x2="29.3" y2="12.1" stroke="#0d1a17" stroke-width="1.6" stroke-linecap="round"/>
  </svg>`;
}

/* --------------------------------- Arranque -------------------------------- */

window.addEventListener("hashchange", () => {
  const m = App.moduleFromHash();
  if (m !== App.module) App.render(m);
});

document.addEventListener("DOMContentLoaded", () => {
  // Salir de la pantalla completa del visor 3D con Escape (listener único)
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    document.querySelectorAll(".viewer-frame.viewer-full").forEach((f) => {
      f.classList.remove("viewer-full");
      const b = f.querySelector(".viewer-fs");
      if (b) { b.innerHTML = icon("maximize", 15); b.title = "Pantalla completa"; b.setAttribute("aria-label", "Pantalla completa"); }
    });
  });
  // Un único listener de navegación (evita acumulación entre renders)
  $("#topnav-inner").addEventListener("click", (e) => {
    const link = e.target.closest("[data-nav]");
    if (link) { e.preventDefault(); App.setModule(link.dataset.nav); return; }
    if (e.target.closest("#nav-teacher")) { App.setModule("docente"); return; }
    if (e.target.closest("#nav-logout")) {
      const wasTeacher = Session.isTeacher();
      const acc = Session.student();
      Student.endSession(); // cierra limpiamente la sesión de estudio del ámbito actual
      Session.logout();
      toast({
        title: wasTeacher ? "Sesión docente cerrada" : "Sesión cerrada",
        description: acc ? `Hasta pronto, ${acc.name}.` : "",
      });
      App.setModule("home");
      maybeShowLoginGate();
      return;
    }
    if (e.target.closest("#nav-burger")) {
      const items = [{ id: "home", label: "Inicio" },
        ...MODULE_CARDS.map((m) => ({ id: m.id, label: NAV_SHORT[m.title] || m.title }))];
      App.openMobileMenu(items);
    }
  });
  App.render();
  // Puerta de acceso: si el docente creó cuentas y nadie ha entrado aún
  maybeShowLoginGate();
});
