/* AR PERIO — views/practice.js · Módulo 6: desafíos con evaluación automática. */

function renderPractice(root) {
  const challenges = [...BUILTIN_CHALLENGES, ...Content.challenges].sort((a, b) => a.order - b.order);
  const paintList = () => {
    const best = {};
    for (const r of Student.data.challengeResults) best[r.challengeId] = Math.max(best[r.challengeId] ?? 0, r.score);
    root.innerHTML = `
    <div class="case-grid">
      ${challenges.map((c) => `
      <div class="card case-card">
        <div class="cc-head"><h3>${esc(c.title)}</h3>
          <span class="badge subtle">${c.builtin ? "Integrado" : "Docente"}</span></div>
        <p class="cc-meta">${esc(c.description)}</p>
        <div class="cc-foot column">
          ${best[c.id] !== undefined ? `
          <div class="best-row">
            <div class="best-label"><span>Mejor puntuación</span><b>${best[c.id]}/100</b></div>
            <div class="progress"><div class="progress-bar" style="width:${best[c.id]}%"></div></div>
          </div>` : ""}
          <div class="cc-foot-row">
            <span class="hint">${icon("timer", 14)} Tiempo par: ${fmtClock(c.parTimeSec)}</span>
            <button class="btn small primary" data-run="${c.id}">${icon("crosshair", 14)} Practicar</button>
          </div>
        </div>
      </div>`).join("")}
    </div>`;
  };

  const runChallenge = (chId) => {
    const challenge = challenges.find((c) => c.id === chId);
    if (!challenge) { paintList(); return; }
    Perio.clearTooth("incisivo-central-sup");
    const startTime = Date.now();
    let elapsed = 0;
    let sitesDone = new Set();
    let errors = 0;
    let savedResult = false;
    let state = "running";
    let quizAnswersRight = 0;
    const isQuiz = challenge.type === "interpret-perio";

    const finish = (partial) => {
      if (state !== "running") return;
      state = "done";
      const t = Math.round((Date.now() - startTime) / 1000);
      const par = challenge.parTimeSec;
      const timeScore = t <= par ? 100 : Math.max(40, 100 - (t - par) * 0.6);
      const precision = partial.precision ?? 80;
      const score = Math.max(0, Math.min(100, Math.round(0.55 * precision + 0.25 * timeScore + 20 - partial.errors * 8)));
      if (!savedResult) {
        savedResult = true;
        Student.saveChallengeResult({
          challengeId: challenge.id, score,
          detail: { precision, siteOk: partial.siteOk ?? undefined, timeSec: t, errors: partial.errors, notes: partial.notes },
          at: Date.now(),
        });
      }
      $("#ch-result", root).innerHTML = `
      <div class="card pad result-card primary-border">
        <div class="ch-result-head">
          <span class="ch-award">${icon("award", 24)}</span>
          <div><h3>Desafío completado</h3>
            <p class="hint">Puntuación global calculada con precisión (55 %), tiempo (25 %) y errores.</p></div>
          <p class="ch-score">${score}<span>/100</span></p>
        </div>
        <div class="ch-chips">
          <div class="chip-box"><span>Precisión</span><b>${precision !== null ? Math.round(precision) + " %" : "—"}</b></div>
          <div class="chip-box"><span>Sitio correcto</span><b>${partial.siteOk == null ? "—" : partial.siteOk ? "Sí" : "No"}</b></div>
          <div class="chip-box"><span>Tiempo</span><b>${fmtClock(t)}</b></div>
          <div class="chip-box"><span>Errores</span><b>${partial.errors}</b></div>
        </div>
        <ul class="dot-list teal">${partial.notes.map((n) => `<li>${esc(n)}</li>`).join("")}</ul>
        <div class="btn-row mt">
          <button class="btn outline" id="ch-restart">${icon("rotate-ccw", 15)} Repetir desafío</button>
          <button class="btn primary" id="ch-exit2">Volver a la lista</button>
        </div>
      </div>`;
      $("#ch-restart", root).addEventListener("click", () => runChallenge(challenge.id));
      $("#ch-exit2", root).addEventListener("click", paintList);
      window.scrollTo({ top: $("#ch-result", root).offsetTop - 90, behavior: "smooth" });
    };

    const handleMeasurement = (r) => {
      if (state !== "running") return;
      const tol = challenge.tolerance ?? 1.0;
      if (challenge.type === "depth-target") {
        const target = challenge.targetDepth ?? 3.0;
        const err = Math.abs(r.measured - target);
        const siteOk = !challenge.targetSite || challenge.targetSite === "any" || r.site === challenge.targetSite;
        if (err <= tol && siteOk) {
          finish({
            precision: Math.max(40, 100 - err * (30 / tol)), siteOk: true, errors: 0,
            notes: [
              `Registraste ${r.measured.toFixed(1)} mm en ${siteById(r.site).short} (objetivo ${target.toFixed(1)} ± ${tol} mm).`,
              "Excelente control de la inserción: la sonda debe detenerse sin forzar el fondo del surco.",
            ],
          });
        } else { Student.logError("sitio-incorrecto"); errors++; paintHeader(); }
      } else if (challenge.type === "find-pocket") {
        const target = challenge.targetDepth ?? 5.0;
        if (Math.abs(r.actual - target) <= tol && Math.abs(r.measured - r.actual) <= 0.6) {
          finish({
            precision: 100, siteOk: true, errors,
            notes: [
              `Bolsa de ${r.actual.toFixed(1)} mm identificada en ${siteById(r.site).short}.`,
              "Recuerda sondear los seis sitios de forma sistemática antes de concluir.",
            ],
          });
        } else { Student.logError("sitio-incorrecto"); errors++; paintHeader(); }
      } else if (challenge.type === "record-bop") {
        if (r.bled) {
          finish({
            precision: 100, siteOk: true, errors,
            notes: [
              `Sangrado al sondaje registrado en ${siteById(r.site).short} con la opción activa.`,
              "El BOP se documenta sitio a sitio tras un sondaje suave: es el signo más sensible de inflamación.",
            ],
          });
        } else { Student.logError("sin-registro-bop"); errors++; paintHeader(); }
      } else if (challenge.type === "complete-six") {
        sitesDone.add(r.site);
        const badge = $("#ch-registrations", root);
        if (badge) badge.textContent = [...sitesDone].map((s) => siteById(s).short).join(" · ");
        if (sitesDone.size >= 6) {
          finish({
            precision: 100, siteOk: true, errors,
            notes: [
              "Periodontograma completo: los seis sitios del diente registrados.",
              "Este registro sistemático es la base del seguimiento periodontal.",
            ],
          });
        }
        paintHeader();
      }
    };

    const paintHeader = () => {
      /* Los contadores pueden no existir: «Sitios» solo está en complete-six
         y la vista puede haber sido desmontada al navegar a otro módulo. */
      const elapsedEl = $("#ch-elapsed", root);
      if (!elapsedEl) return;
      elapsedEl.textContent = fmtClock(elapsed);
      $("#ch-errors", root).textContent = errors;
      const sitesEl = $("#ch-sites", root);
      if (sitesEl) sitesEl.textContent = `${sitesDone.size}/6`;
    };

    root.innerHTML = `
    <div class="challenge">
      <div class="card pad">
        <div class="ch-head">
          <div>
            <p class="ch-desc">${esc(challenge.description)}</p>
            <ol class="ch-instr">${challenge.instructions.map((ins, i) =>
              `<li><span class="num">${i + 1}</span>${esc(ins)}</li>`).join("")}</ol>
          </div>
          <div class="ch-stats">
            <div><span class="hint">${icon("clock", 13)} Tiempo</span><p class="ch-num" id="ch-elapsed">0:00</p></div>
            ${challenge.type === "complete-six" && state === "running" ? `<div><span class="hint">Sitios</span><p class="ch-num" id="ch-sites">0/6</p></div>` : ""}
            <div><span class="hint">Errores</span><p class="ch-num ${errors > 0 ? "danger-text" : ""}" id="ch-errors">0</p></div>
          </div>
        </div>
      </div>
      <div id="ch-body"></div>
      <div class="card pad" id="ch-reg-card" style="display:none">
        <p class="card-title">Mediciones del desafío</p>
        <p class="badge-row" id="ch-registrations"></p>
      </div>
      <div id="ch-result"></div>
      <div class="btn-row end"><button class="btn ghost" id="ch-exit">Salir del desafío</button></div>
    </div>`;

    $("#ch-exit", root).addEventListener("click", paintList);

    if (isQuiz) {
      $("#ch-body", root).innerHTML = `
      <div class="quiz-layout">
        <div class="card pad center">
          <p class="mini-title left">Periodontograma del paciente</p>
          ${ToothChartSVG({ toothId: "incisivo-central-sup", sites: challenge.perioData?.sites ?? {}, mobility: 1, furcation: "—" })}
        </div>
        <div class="card pad" id="ch-quizhost">
          <button class="btn primary block" id="ch-finishquiz">${icon("list-checks", 16)} Finalizar interpretación</button>
        </div>
      </div>`;
      const qhost = $("#ch-quizhost", root);
      let inserted = 0;
      (challenge.questions ?? []).forEach((q, i) => {
        // intercepta el registro de resultados para contar aciertos
        const before = Student.data.quizResults.length;
        QuizBlock(qhost, q, i + 1, "practica", `ch-${challenge.id}`);
        inserted++;
        // recuento tras cada respuesta
        const quizBlockEl = qhost.lastElementChild;
        quizBlockEl.addEventListener("click", () => {
          setTimeout(() => {}, 0);
        });
        void before;
      });
      $("#ch-finishquiz", root).addEventListener("click", () => {
        const total = (challenge.questions ?? []).length;
        const correct = Student.data.quizResults
          .filter((r) => r.topicId === `ch-${challenge.id}`)
          .slice(-total)
          .reduce((a, r) => a + r.correct, 0);
        finish({
          precision: total ? (correct / total) * 100 : 0, siteOk: null, errors: 0,
          notes: ["Interpretación de un periodontograma completo: PD, recesión, NIC y BOP."],
        });
      });
      void quizAnswersRight;
    } else {
      const host = $("#ch-body", root);
      const ws = buildProbingWorkspace(host, {
        conditionId: challenge.conditionId,
        onConditionChange: () => {},
        onMeasurement: handleMeasurement,
        hideConditionSelector: true,
        guideDefault: challenge.type !== "find-pocket",
      });
      $("#ch-reg-card", root).style.display = "";
      // dispose al salir: guardamos referencia
      const oldExit = $("#ch-exit", root);
      oldExit.addEventListener("click", () => ws.dispose(), { once: true });
      // también al terminar
      const obs = new MutationObserver(() => {
        if (!root.contains(ws.root)) { ws.dispose(); obs.disconnect(); }
      });
      obs.observe(root, { childList: true, subtree: true });
    }

    const iv = setInterval(() => {
      /* state != running al terminar; root desconectado al navegar a otro módulo */
      if (state !== "running" || !root.isConnected) { clearInterval(iv); return; }
      elapsed = Math.round((Date.now() - startTime) / 1000);
      paintHeader();
    }, 500);
    paintHeader();
  };

  // Listener delegado UNA sola vez por renderPractice (los repintados no lo duplican)
  root.addEventListener("click", (e) => {
    const b = e.target.closest("[data-run]");
    if (b) runChallenge(b.dataset.run);
  });
  paintList();
  return () => {};
}
