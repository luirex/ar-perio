/* AR PERIO — views/progress.js · Módulo 7: progreso y resultados del estudiante. */

function renderProgress(root) {
  const s = Student.data;
  const stats = computeStats(s);

  /* Barras de mejores puntuaciones por desafío */
  const challengeNames = {};
  for (const c of [...BUILTIN_CHALLENGES, ...Content.challenges]) challengeNames[c.id] = c.title;
  const bestEntries = Object.entries(stats.bestChallenge);
  const challengeBars = bestEntries.length ? `
    <div class="bar-chart">
      ${bestEntries.map(([id, score], i) => `
      <div class="bar-row" title="${esc(challengeNames[id] || id)}">
        <span class="bar-label">${esc((challengeNames[id] || id).split("·")[1]?.trim() || challengeNames[id] || id)}</span>
        <div class="bar-track"><div class="bar-fill ${score >= 80 ? "ok" : score >= 50 ? "mid" : "bad"}" style="width:${score}%"></div></div>
        <span class="bar-value">${score}</span>
      </div>`).join("")}
    </div>` : '<p class="hint">Sin desafíos completados todavía.</p>';

  /* Dispersión de error de mediciones (últimas 30) */
  const lastM = s.measurements.slice(-30);
  const errChart = lastM.length ? (() => {
    const maxErr = Math.max(1.5, ...lastM.map((m) => Math.abs(m.error)));
    const W = 560, H = 130, pad = 24;
    const pts = lastM.map((m, i) => {
      const x = pad + (i / Math.max(1, lastM.length - 1)) * (W - pad * 2);
      const y = H / 2 - (m.error / maxErr) * (H / 2 - 10);
      return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" fill="${Math.abs(m.error) > 1 ? "#c22035" : "#0d7a6e"}" opacity="0.85"></circle>`;
    }).join("");
    return `<svg viewBox="0 0 ${W} ${H}" class="err-chart" role="img" aria-label="Error de mediciones">
      <line x1="${pad}" y1="${H / 2}" x2="${W - pad}" y2="${H / 2}" stroke="#9db4ae" stroke-width="1" stroke-dasharray="4 3"></line>
      <text x="6" y="${H / 2 - 4}" font-size="9" fill="#5b6f6a">0</text>
      <text x="6" y="14" font-size="9" fill="#5b6f6a">+${maxErr.toFixed(1)}</text>
      <text x="6" y="${H - 4}" font-size="9" fill="#5b6f6a">−${maxErr.toFixed(1)}</text>
      ${pts}
    </svg>`;
  })() : '<p class="hint">Sin mediciones registradas todavía. Practica el sondaje en la simulación.</p>';

  /* Sesiones recientes */
  const sessions = [...s.sessions].reverse().slice(0, 12);
  const sessionRows = sessions.map((x) => `<tr>
      <td>${new Date(x.startedAt).toLocaleString("es", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</td>
      <td>${esc(moduleTitle(x.module))}</td>
      <td class="num">${fmtTime(x.seconds)}</td>
    </tr>`).join("");

  /* Casos */
  const caseRows = [...s.caseResults].reverse().slice(0, 10).map((r) => {
    const c = allCases().find((x) => x.id === r.caseId);
    return `<tr><td>${esc(c ? c.title : r.caseId)}</td>
      <td class="num strong">${r.score}/${r.maxScore}</td>
      <td>${new Date(r.at).toLocaleDateString("es")}</td></tr>`;
  }).join("");

  /* Quiz por categoría */
  const quizRows = learnCategories().map((cat) => {
    const rs = s.quizResults.filter((r) => r.categoryId === cat.id);
    const acc = rs.length ? Math.round((rs.reduce((a, r) => a + r.correct / Math.max(1, r.total), 0) / rs.length) * 100) : null;
    return `<div class="bar-row">
      <span class="bar-label">${esc(cat.title)}</span>
      <div class="bar-track"><div class="bar-fill ${acc === null ? "" : acc >= 80 ? "ok" : acc >= 50 ? "mid" : "bad"}" style="width:${acc ?? 0}%"></div></div>
      <span class="bar-value">${acc === null ? "—" : acc + "%"}</span>
    </div>`;
  }).join("");

  /* Práctica de llenado del periodontograma */
  const chartRows = [...(s.chartResults ?? [])].reverse().slice(0, 8).map((r) => {
    const ex = chartExerciseById(r.exerciseId);
    return `<tr><td>${esc(ex ? ex.title : r.exerciseId)}</td>
      <td>${r.mode === "dictation" ? "Dictado" + (r.region ? " · " + r.region : "") : "Hoja"}</td>
      <td class="num strong">${r.score}/100</td>
      <td>${fmtTime(r.seconds ?? 0)}</td>
      <td>${new Date(r.at).toLocaleDateString("es")}</td></tr>`;
  }).join("");

  root.innerHTML = `
  <div class="progress-layout">
    <div class="stat-grid">
      ${statCard("Mediciones de sondaje", String(s.measurements.length), "activity")}
      ${statCard("Error medio (MAE)", stats.mae !== null ? `± ${stats.mae.toFixed(2)} mm` : "—", "target")}
      ${statCard("Desafíos superados", `${stats.uniqueChallenges}`, "award")}
      ${statCard("Casos resueltos", `${stats.uniqueCases}`, "stethoscope")}
      ${statCard("Llenado perio.", stats.chartTries ? `${stats.chartTries}${stats.chartBest !== null ? ` · mejor ${stats.chartBest}` : ""}` : "—", "clipboard-list")}
      ${statCard("Precisión en quizzes", stats.quizAcc !== null ? `${Math.round(stats.quizAcc * 100)} %` : "—", "list-checks")}
      ${statCard("Tiempo de práctica", fmtTime(stats.practiceSeconds), "clock")}
    </div>

    <div class="card pad">
      <h3 class="card-title">Error de sondaje por medición</h3>
      <p class="hint mb">Últimas ${lastM.length} mediciones · cada punto es el error (medido − real) en mm.
      Verde dentro de ±1 mm, rojo fuera.</p>
      ${errChart}
    </div>

    <div class="two-col">
      <div class="card pad">
        <h3 class="card-title">Mejores puntuaciones · desafíos</h3>
        ${challengeBars}
      </div>
      <div class="card pad">
        <h3 class="card-title">Precisión en quizzes por categoría</h3>
        <div class="bar-chart">${quizRows}</div>
      </div>
    </div>

    <div class="two-col">
      <div class="card pad">
        <h3 class="card-title">Sesiones recientes</h3>
        ${sessions.length ? `<div class="table-wrap"><table class="table"><thead><tr><th>Fecha</th><th>Módulo</th><th>Duración</th></tr></thead><tbody>${sessionRows}</tbody></table></div>`
          : '<p class="hint">Sin sesiones registradas.</p>'}
      </div>
      <div class="card pad">
        <h3 class="card-title">Casos clínicos resueltos</h3>
        ${caseRows.length ? `<div class="table-wrap"><table class="table"><thead><tr><th>Caso</th><th>Puntuación</th><th>Fecha</th></tr></thead><tbody>${caseRows}</tbody></table></div>`
          : '<p class="hint">Sin casos resueltos.</p>'}
      </div>
    </div>

    ${chartRows.length ? `<div class="card pad">
      <h3 class="card-title">Práctica de llenado del periodontograma</h3>
      <div class="table-wrap"><table class="table"><thead><tr><th>Ejercicio</th><th>Modo</th><th>Puntuación</th><th>Tiempo</th><th>Fecha</th></tr></thead><tbody>${chartRows}</tbody></table></div>
    </div>` : ""}

    <div class="card pad danger-zone">
      <h3 class="card-title">${icon("alert-triangle", 15)} Reiniciar progreso</h3>
      <p class="hint">Borra mediciones, resultados, lecturas y el periodontograma del estudiante.
      El contenido del docente no se modifica.</p>
      <button class="btn danger" id="prog-reset">${icon("trash", 15)} Reiniciar todo mi progreso</button>
    </div>
  </div>`;

  $("#prog-reset", root).addEventListener("click", () => {
    const o = openModal(`<div class="pad-modal">
      <h3 class="card-title">¿Reiniciar el progreso?</h3>
      <p class="hint mb">Esta acción no se puede deshacer.</p>
      <div class="btn-row"><button class="btn ghost" data-a="cancel">Cancelar</button>
      <button class="btn danger" data-a="ok">Sí, reiniciar</button></div>
    </div>`);
    $('[data-a="cancel"]', o).addEventListener("click", o.close);
    $('[data-a="ok"]', o).addEventListener("click", () => {
      Student.resetProgress();
      Perio.data.records = {};
      Perio.save();
      o.close();
      toast({ title: "Progreso reiniciado" });
      renderProgress(root);
    });
  });

  function statCard(label, value, ic) {
    return `<div class="card stat-card"><div class="sum-label">${icon(ic, 16)} ${esc(label)}</div>
      <p class="sum-value">${esc(value)}</p></div>`;
  }
}

function moduleTitle(id) {
  const map = {
    home: "Inicio", aprender: "Aprender Periodoncia", explorar: "Exploración 3D",
    simulacion: "Simulación de sondaje", periodontograma: "Periodontograma",
    casos: "Casos clínicos", practica: "Práctica / Desafíos", progreso: "Mi progreso",
    docente: "Panel docente",
    "Simulación de sondaje": "Simulación de sondaje", "Exploración 3D": "Exploración 3D",
    "Práctica / Desafíos": "Práctica / Desafíos", "Casos clínicos": "Casos clínicos",
    "Periodontograma": "Periodontograma", "Mi progreso": "Mi progreso",
  };
  return map[id] || id;
}
