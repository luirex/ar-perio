/* AR PERIO — views/dashboard.js · Pantalla principal con los 8 módulos. */

const AP_ACCENTS = {
  teal: "teal", coral: "coral", amber: "amber", slate: "slate",
};

function renderDashboard(root) {
  const stats = computeStats(Student.data);
  const acc = Session.student();
  const modules = MODULE_CARDS.map((m) => {
    const locked = m.id === "docente" && !Session.isTeacher();
    return `<a class="module-card ${AP_ACCENTS[m.accent]}" href="#${m.id}">
      <div class="mc-top">
        <span class="mc-icon">${icon(m.icon, 22)}</span>
        <span class="badge subtle">Fase ${m.phase}</span>
      </div>
      <div>
        <h3>${esc(m.title)} ${locked ? icon("lock", 14, "mc-lock") : ""}</h3>
        <p class="mc-sub">${esc(m.subtitle)}</p>
      </div>
      <p class="mc-desc">${esc(m.description)}</p>
      <span class="mc-open">Abrir módulo ${icon("arrow-right", 14)}</span>
    </a>`;
  }).join("");

  const read = Student.data.readTopics;
  const topicProgress = learnCategories().map((c) => {
    const n = c.topics.filter((t) => read.includes(t.id)).length;
    const pct = c.topics.length ? Math.round((n / c.topics.length) * 100) : 0;
    return `<div>
      <div class="tp-row"><span class="tp-title">${esc(c.title)}</span><span class="tp-count">${n}/${c.topics.length}</span></div>
      <div class="progress"><div class="progress-bar" style="width:${pct}%"></div></div>
    </div>`;
  }).join("");

  root.innerHTML = `
  <div class="dash">
    <section class="hero">
      <div class="hero-art-bg">${ARHeroArt()}</div>
      <div class="hero-body">
        <div class="hero-text">
          <span class="badge glass">Plataforma educativa de Periodoncia</span>
          ${acc ? `<span class="badge glass">${icon("user", 13)} Sesión de ${esc(acc.name)}</span>` : ""}
          <h1>AR PERIO</h1>
          <p class="hero-sub">Entrenamiento interactivo en Periodoncia</p>
          <p class="hero-desc">Aprende, explora y entrena el sondaje periodontal sobre un modelo
            anatómico 3D del incisivo central superior. Teoría, simulación, periodontograma,
            casos clínicos y retroalimentación en un solo entorno preclínico.</p>
          <div class="hero-cta">
            <a class="btn white" href="#simulacion">${icon("crosshair", 16)} Practicar sondaje 3D</a>
            <a class="btn ghost-w" href="#aprender">${icon("book-open", 16)} Empezar por la teoría</a>
          </div>
        </div>
        <div class="hero-art">${ARHeroArt()}</div>
      </div>
    </section>

    <section class="dash-summary">
      ${summaryCard("activity", "Precisión de sondaje", stats.mae !== null ? `± ${stats.mae.toFixed(1)} mm` : "—",
        stats.mae !== null ? (stats.mae <= 0.5 ? "Excelente" : stats.mae <= 1 ? "Buena" : "En mejora") : "Sin mediciones")}
      ${summaryCard("target", "Desafíos completados", `${stats.uniqueChallenges}/5`, "Práctica evaluada")}
      ${summaryCard("stethoscope", "Casos resueltos", `${stats.uniqueCases}`, "Razonamiento clínico")}
      ${summaryCard("clock", "Tiempo de práctica", fmtTime(stats.practiceSeconds), "Simulación y práctica")}
    </section>

    <section class="dash-modules">
      <div class="sec-head">
        <h2>Módulos</h2>
        <p>Flujo de aprendizaje: aprender → explorar → simular → registrar → analizar → resolver casos</p>
      </div>
      <div class="module-grid">${modules}</div>
    </section>

    <section class="dash-topics">
      <div class="card pad">
        <h3 class="card-title">Avance en Aprender Periodoncia</h3>
        <div class="tp-grid">${topicProgress}</div>
      </div>
    </section>
  </div>`;

  function summaryCard(ic, label, value, hint) {
    return `<div class="card sum-card">
      <div class="sum-label">${icon(ic, 16)} ${esc(label)}</div>
      <p class="sum-value">${esc(value)}</p>
      <p class="sum-hint">${esc(hint)}</p>
    </div>`;
  }
}

/** Ilustración del hero (sección del periodonto con sonda). */
function ARHeroArt() {
  return `<svg viewBox="0 0 240 240" aria-hidden="true">
    <path d="M96 36c-13 0-19 8-20.5 19-1.2 9 .8 17 2.6 26 2.3 11 3.2 23 4.6 37 .8 8 4 11.5 7 9.4 2.6-1.8 2.6-7.4 3.4-14 .8-6.4 2-11.6 6.4-11.6 4.4 0 5.6 5.2 6.4 11.6.8 6.6.8 12.2 3.4 14 3 2.1 6.2-1.4 7-9.4 1.4-14 2.3-26 4.6-37 1.8-9 3.8-17 2.6-26C125 44 119 36 106 36c-4 0-5.6 2-10 2s-6-2-10-2z" fill="#f4f2ec" opacity="0.97"/>
    <path d="M106 62c-5 0-8 3-8.6 7-.5 3.4.6 6.4 1.4 9.6 1 4.2 1.5 8.8 2 14 .3 3 1.5 4.4 2.6 3.6 1-.7 1-2.8 1.3-5.3.3-2.4.8-4.4 2.4-4.4 1.6 0 2.1 2 2.4 4.4.3 2.5.3 4.6 1.3 5.3 1.1.8 2.3-.6 2.6-3.6.5-5.2 1-9.8 2-14 .8-3.2 1.9-6.2 1.4-9.6-.6-4-3.6-7-8.6-7-1.6 0-2.2.8-4 .8s-2.4-.8-4-.8z" fill="#d98f86" opacity="0.9"/>
    <path d="M72 96c-6 2-11 7-11.6 13.4-.7 7.4 4.4 13.6 11 16.6 5 2.2 10.8 2.6 14.6 2.8l19-.2c3.8-.2 9.6-.6 14.6-2.8 6.6-3 11.7-9.2 11-16.6-.6-6.4-5.6-11.4-11.6-13.4-4-1.4-8.4-1-12.4-.4-3.2.5-6.4 1.6-11.6 1.6s-8.4-1.1-11.6-1.6c-4-.6-8.4-1-12.4.4z" fill="#e8a49c" opacity="0.95"/>
    <path d="M60 128c-3 8-1.6 16 3.6 22 5 5.8 12.6 8.6 20.4 9.6l44 .4c7.8-1 15.4-3.8 20.4-9.6 5.2-6 6.6-14 3.6-22-2.2-6-7-10-13.4-11.6l-65.2 0c-6.4 1.6-11.2 5.6-13.4 11.6z" fill="#e9dfc6" opacity="0.9"/>
    <path d="M86 112v26M126 112v26" stroke="#d98f86" stroke-width="2.4" stroke-linecap="round" opacity="0.85"/>
    <g transform="rotate(24 160 30)">
      <rect x="157" y="-34" width="6" height="72" rx="3" fill="#ffffff" opacity="0.96"/>
      <circle cx="160" cy="39" r="3.4" fill="#ffffff"/>
      <path d="M158.6 6v6M161.4 6v6M158.6 20v6M161.4 20v6" stroke="#0d1a17" stroke-width="1.6" stroke-linecap="round"/>
    </g>
    <g opacity="0.9">
      <path d="M186 96h6M186 108h6M186 120h6" stroke="#9fd8cd" stroke-width="1.6" stroke-linecap="round"/>
      <path d="M189 92v32" stroke="#9fd8cd" stroke-width="1"/>
    </g>
  </svg>`;
}
