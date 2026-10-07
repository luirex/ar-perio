/* AR PERIO — views/cases.js · Módulo 5: casos clínicos con razonamiento.
 * Combina casos integrados + casos del docente (con fotos y radiografías
 * reales subidas desde el panel docente). */

const KIND_LABEL = {
  diagnostico: "Diagnóstico", hallazgos: "Hallazgos", riesgo: "Factores de riesgo",
  pronostico: "Pronóstico", plan: "Plan de tratamiento",
};

function allCases() {
  return [...BUILTIN_CASES, ...Content.cases];
}

/** Figura de foto clínica (subida o esquemática). */
function casePhotoFigure(p) {
  if (p.src) {
    return `<figure class="case-photo upload">
      <img src="${p.src}" alt="${esc(p.caption || "Fotografía clínica")}" loading="lazy">
      <figcaption>${esc(p.caption || "Fotografía clínica")} · <span class="muted">imagen del docente</span></figcaption>
    </figure>`;
  }
  return CasePhotoSVG(p.kind || "sano", p.caption || "Ilustración clínica");
}

/** Figura de radiografía (subida o esquemática con % de pérdida ósea). */
function caseRadioFigure(r) {
  if (r.src) {
    return `<figure class="case-radio upload">
      <img src="${r.src}" alt="${esc(r.caption || "Radiografía")}" loading="lazy">
      <figcaption>${esc(r.caption || "Radiografía")} · <span class="muted">imagen del docente</span></figcaption>
    </figure>`;
  }
  return CaseRadiographSVG(r.boneLossPct ?? 0, r.caption || "Radiografía periapical");
}

function renderCases(root) {
  const paintList = () => {
    const results = Student.data.caseResults;
    root.innerHTML = `
    <div class="case-grid">
      ${allCases().map((c) => {
        const result = results.filter((r) => r.caseId === c.id).pop();
        return `<div class="card case-card">
          <div class="cc-head">
            <h3>${esc(c.title)}</h3>
            <span class="badge ${c.difficulty === "avanzado" ? "danger" : c.difficulty === "basico" ? "subtle" : "outline"}">${esc(c.difficulty)}</span>
          </div>
          <p class="cc-meta">${c.patient.age} años · ${c.patient.sex === "F" ? "Femenino" : "Masculino"} · ${esc((c.patient.chiefComplaint || "").slice(0, 90))}…</p>
          <div class="cc-foot">
            ${result
              ? `<span class="badge ok">Resuelto · ${result.score}/${result.maxScore}</span>`
              : `<span class="badge subtle">${c.builtin ? "Integrado" : "Del docente"}</span>`}
            <button class="btn small primary" data-open="${c.id}">Resolver caso</button>
          </div>
        </div>`;
      }).join("")}
    </div>`;
  };

  const paintCase = (caseId) => {
    const c = allCases().find((x) => x.id === caseId);
    if (!c) { paintList(); return; }
    const answers = {};
    const checked = {};
    let saved = !!Student.data.caseResults.filter((r) => r.caseId === c.id).length;
    const radios = caseRadiographs(c);

    root.innerHTML = `
    <div class="case-view">
      <div class="card pad">
        <h3 class="sec-title">1 · Historia clínica</h3>
        <div class="case-hist">
          <div>
            <p class="complaint">«${esc(c.patient.chiefComplaint)}»</p>
            <h4 class="mini-title">Antecedentes y evolución</h4>
            <ul class="dot-list teal">${c.patient.history.map((h) => `<li>${mdInline(h)}</li>`).join("")}</ul>
            <h4 class="mini-title">Hábitos</h4>
            <div class="badge-row">${c.patient.habits.map((h) => `<span class="badge outline">${esc(h)}</span>`).join("")}</div>
          </div>
          <div>
            <h4 class="mini-title">Hallazgos clínicos</h4>
            <ul class="dot-list amber">${c.clinicalFindings.map((h) => `<li>${mdInline(h)}</li>`).join("")}</ul>
            <div class="btn-row"><button class="btn small outline" id="case-3d">${icon("box", 15)} Ver modelo 3D del caso</button></div>
          </div>
        </div>
      </div>
      <div class="card pad">
        <h3 class="sec-title">2 · Examen complementario</h3>
        <div class="case-exam">
          <div class="case-photos" id="case-photos">
            ${c.photos.map((p) => casePhotoFigure(p)).join("") || '<div class="empty-note">Sin fotografías clínicas.</div>'}
          </div>
          <div class="case-perio">
            <p class="mini-title center">Periodontograma (diente 11)</p>
            ${ToothChartSVG({ toothId: c.perio.toothId, sites: c.perio.sites, mobility: c.perio.mobility, furcation: "—" })}
          </div>
          <div class="case-radios" id="case-radios">
            ${radios.length ? radios.map((r) => caseRadioFigure(r)).join("")
              : '<div class="empty-note">Sin radiografía disponible para este caso.</div>'}
          </div>
        </div>
      </div>
      <div class="card pad">
        <h3 class="sec-title">3 · Razonamiento clínico</h3>
        <p class="hint mb">Responde todas las preguntas y verifica cada una para conocer la respuesta modelo.</p>
        <div id="case-questions"></div>
      </div>
      <div id="case-result"></div>
      <div class="btn-row end"><button class="btn ghost" id="case-back">Volver a la lista de casos</button></div>
    </div>`;

    // Interacción con imágenes: lightbox (radiografías con controles)
    const wireFigures = (hostId, radio) => {
      const host = $(hostId, root);
      if (!host) return;
      host.addEventListener("click", (e) => {
        const fig = e.target.closest("figure");
        if (!fig || !host.contains(fig)) return;
        const cap = $("figcaption", fig)?.textContent || "";
        // Imagen subida por el docente…
        const img = $("img", fig);
        let src = img ? img.getAttribute("src") : null;
        // …o ilustración esquemática SVG (se serializa para el visor)
        if (!src) {
          const svg = $("svg", fig);
          if (!svg) return;
          src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(new XMLSerializer().serializeToString(svg));
        }
        openLightbox(src, cap, { radio });
      });
    };
    wireFigures("#case-photos", false);
    wireFigures("#case-radios", true);

    $("#case-3d", root).addEventListener("click", () => {
      for (const [site, rec] of Object.entries(c.perio.sites)) {
        Perio.setSite("incisivo-central-sup", site, { ...rec });
      }
      App.launchSim({
        conditionId: c.conditionId,
        returnTo: "casos",
        label: `Explorar el modelo 3D del caso: ${conditionById(c.conditionId).label}`,
      });
    });

    const qHost = $("#case-questions", root);
    c.questions.forEach((q, qi) => {
      const block = html(`<div class="case-q" data-qid="${esc(q.id)}">
        <div class="cq-badges">
          <span class="badge subtle">${KIND_LABEL[q.kind] || q.kind}</span>
          ${q.multi ? '<span class="badge outline">Selecciona todas las correctas</span>' : ""}
        </div>
        <p class="cq-prompt"><span class="muted">${qi + 1}.</span> ${mdInline(q.prompt)}</p>
        <div class="cq-options"></div>
        <div class="cq-foot">
          <span class="hint">${q.multi ? "Selecciona una o varias opciones" : "Selecciona una opción"}</span>
          <button class="btn small outline" disabled>Verificar</button>
        </div>
        <div class="cq-expl"></div>
      </div>`);
      const optsHost = $(".cq-options", block);
      const btn = $(".cq-foot button", block);
      optsHost.innerHTML = q.options.map((opt, i) => `
        <label class="cq-opt"><input type="${q.multi ? "checkbox" : "radio"}" name="${esc(q.id)}" value="${i}">
          <span>${esc(opt)}</span></label>`).join("");
      optsHost.addEventListener("change", () => {
        const sel = $$("input:checked", optsHost).map((x) => +x.value);
        answers[q.id] = sel;
        btn.disabled = sel.length === 0;
      });
      btn.addEventListener("click", () => {
        if (checked[q.id]) return;
        checked[q.id] = true;
        const sel = answers[q.id] ?? [];
        const ok = arraysEqualNum(sel.slice().sort((a, b) => a - b), q.correct.slice().sort((a, b) => a - b));
        $$("input", optsHost).forEach((x) => (x.disabled = true));
        const correctSet = new Set(q.correct);
        $$(".cq-opt", optsHost).forEach((el, i) => {
          const input = $("input", el);
          if (correctSet.has(i)) el.classList.add("correct");
          else if (input.checked) el.classList.add("wrong");
        });
        btn.remove();
        $(".cq-foot .hint", block).innerHTML =
          `<span class="${ok ? "ok-text" : "bad-text"}"><b>${ok ? "Correcto." : "Revisa:"}</b> ${esc(q.explanation)}</span>`;
        // ¿Completado?
        if (c.questions.every((qq) => checked[qq.id])) {
          const score = c.questions.reduce((a, qq) =>
            a + (arraysEqualNum((answers[qq.id] ?? []).slice().sort((x, y) => x - y), qq.correct.slice().sort((x, y) => x - y)) ? 1 : 0), 0);
          if (!saved) {
            Student.saveCaseResult({ caseId: c.id, score, maxScore: c.questions.length, at: Date.now() });
            saved = true;
          }
          $("#case-result", root).innerHTML = `
          <div class="card pad result-card">
            <h3 class="card-title primary">${icon("lightbulb", 17)} Resultado y puntos docentes</h3>
            <p class="score-big">${score} / ${c.questions.length}
              <span class="muted">(${Math.round((score / c.questions.length) * 100)} %)</span></p>
            <hr class="sep">
            <ul class="dot-list teal">${c.teachingPoints.map((t) => `<li>${mdInline(t)}</li>`).join("")}</ul>
            <button class="btn outline mt" id="case-back2">Volver a la lista de casos</button>
          </div>`;
          $("#case-back2", root).addEventListener("click", paintList);
        }
      });
      qHost.appendChild(block);
    });

    $("#case-back", root).addEventListener("click", paintList);
  };

  const arraysEqualNum = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);
  // Listener delegado UNA sola vez por renderCases (los repintados internos no lo duplican)
  root.addEventListener("click", (e) => {
    const b = e.target.closest("[data-open]");
    if (b) paintCase(b.dataset.open);
  });
  paintList();
  return () => {};
}
