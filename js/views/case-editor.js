/* AR PERIO — views/case-editor.js · Editor de casos clínicos del docente.
 * Formulario completo: identificación, historia, FOTOS y RADIOGRAFÍAS subidas
 * (o esquemáticas), periodontograma, preguntas con respuestas múltiples y
 * puntos docentes. Todo se guarda en el navegador (sin tocar código). */

function emptyCaseQuestion() {
  return {
    id: `q-${Math.random().toString(36).slice(2, 8)}`,
    kind: "diagnostico", prompt: "", options: ["", "", "", ""],
    correct: [0], multi: false, explanation: "",
  };
}

function emptyCaseDraft() {
  return {
    id: `caso-${Date.now().toString(36)}`,
    title: "Nuevo caso clínico",
    difficulty: "intermedio",
    patient: { age: 40, sex: "F", chiefComplaint: "", history: [], background: [], habits: [] },
    clinicalFindings: [],
    photos: [],
    radiographs: [],
    perio: { toothId: "incisivo-central-sup", sites: {}, mobility: 0 },
    conditionId: "sano",
    questions: [emptyCaseQuestion()],
    teachingPoints: [],
  };
}

/** Abre el editor sobre `body`. initial: caso a editar o null. */
function openCaseEditor(body, initial, onDone) {
  const normalizeCase = (c) => {
    c.photos = Array.isArray(c.photos) ? c.photos.filter((p) => p && (p.src || p.kind)) : [];
    c.radiographs = caseRadiographs(c);
    delete c.radiograph;
    return c;
  };
  const draft = initial ? normalizeCase(structuredClone(initial)) : emptyCaseDraft();

  const paint = () => {
    body.innerHTML = `
    <div class="card pad case-editor">
      <div class="ce-head">
        <h2>${initial ? "Editar caso" : "Nuevo caso clínico"}</h2>
        <span class="badge subtle">${draft.builtin ? "copia de un caso integrado" : "caso del docente"}</span>
        <div class="ce-head-actions">
          <button class="btn small outline" id="ce-cancel">${icon("x", 14)} Cancelar</button>
          <button class="btn small primary" id="ce-save">${icon("save", 14)} Guardar caso</button>
        </div>
      </div>

      <section class="ce-section grid-ce-id">
        <label class="field"><span>Título</span><input class="input" id="ce-title" value="${esc(draft.title)}"></label>
        <label class="field"><span>Edad</span><input class="input num" id="ce-age" type="number" min="0" max="110" value="${draft.patient.age}"></label>
        <label class="field"><span>Sexo</span>
          <select class="select" id="ce-sex">
            <option value="F" ${draft.patient.sex === "F" ? "selected" : ""}>Femenino</option>
            <option value="M" ${draft.patient.sex === "M" ? "selected" : ""}>Masculino</option>
          </select></label>
        <label class="field"><span>Dificultad</span>
          <select class="select" id="ce-diff">
            ${["basico", "intermedio", "avanzado"].map((d) => `<option value="${d}" ${draft.difficulty === d ? "selected" : ""}>${d === "basico" ? "Básico" : d === "intermedio" ? "Intermedio" : "Avanzado"}</option>`).join("")}
          </select></label>
      </section>

      <section class="ce-section grid-2">
        <label class="field"><span>Motivo de consulta</span>
          <textarea class="textarea" id="ce-cc" rows="2" placeholder="«Mis encías sangran al cepillarme…»">${esc(draft.patient.chiefComplaint)}</textarea></label>
        <label class="field"><span>Antecedentes / evolución (uno por línea)</span>
          <textarea class="textarea" id="ce-hist" rows="3">${esc(draft.patient.history.join("\n"))}</textarea></label>
        <label class="field"><span>Hábitos (uno por línea)</span>
          <textarea class="textarea" id="ce-habits" rows="2">${esc(draft.patient.habits.join("\n"))}</textarea></label>
        <label class="field"><span>Hallazgos clínicos (uno por línea)</span>
          <textarea class="textarea" id="ce-find" rows="3">${esc(draft.clinicalFindings.join("\n"))}</textarea></label>
      </section>

      <hr class="sep">

      <section class="ce-section">
        <h4 class="ce-sub">${icon("image", 15)} Imágenes clínicas</h4>
        <div class="ce-images">
          <div class="ce-img-col">
            <p class="hint">Fotografías reales del caso (opcional):</p>
            <div class="ce-photo-list" id="ce-photos"></div>
            <button class="btn small outline" id="ce-photo-up">${icon("upload", 13)} Subir fotografías</button>
          </div>
          <div class="ce-img-col">
            <p class="hint">Ilustración esquemática (si no hay fotos):</p>
            <select class="select" id="ce-artkind">
              ${[["sano", "Encía sana"], ["gingivitis", "Gingivitis"], ["recession", "Recesión"], ["periodontitis", "Periodontitis"]].map(([v, l]) =>
                `<option value="${v}">${l}</option>`).join("")}
            </select>
            <div class="ce-art-preview" id="ce-artprev"></div>
          </div>
        </div>
      </section>

      <section class="ce-section">
        <h4 class="ce-sub">${icon("eye", 15)} Radiografías del caso</h4>
        <p class="hint">Sube radiografías reales, elige una del banco del curso o añade la
        esquemática con porcentaje de pérdida ósea.</p>
        <div class="btn-row mb">
          <button class="btn small outline" id="ce-radio-up">${icon("upload", 13)} Subir radiografía</button>
          <button class="btn small outline" id="ce-radio-bank">${icon("image", 13)} Del banco (${RadioBank.items.length})</button>
          <button class="btn small ghost" id="ce-radio-synth">${icon("plus", 13)} Añadir esquemática</button>
        </div>
        <div class="ce-radio-list" id="ce-radios"></div>
      </section>

      <hr class="sep">

      <section class="ce-section">
        <div class="ce-perio-head">
          <h4 class="ce-sub">Periodontograma del caso (diente 11)</h4>
          <label class="field inline"><span>Movilidad</span>
            <select class="select" id="ce-mob">${[0, 1, 2, 3].map((m) => `<option value="${m}" ${draft.perio.mobility === m ? "selected" : ""}>Grado ${m}</option>`).join("")}</select></label>
          <label class="field inline"><span>Condición 3D</span>
            <select class="select" id="ce-cond">${PERIO_CONDITIONS.map((c) => `<option value="${c.id}" ${draft.conditionId === c.id ? "selected" : ""}>${esc(c.label)}</option>`).join("")}</select></label>
        </div>
        <div class="table-wrap"><table class="table">
          <thead><tr><th>Sitio</th><th>PD (mm)</th><th>Recesión</th><th>BOP</th><th>Supuración</th></tr></thead>
          <tbody>
            ${SITES.map((site) => {
              const rec = draft.perio.sites[site.id] ?? { bop: false, sup: false };
              return `<tr>
                <td class="strong small">${esc(site.label)}</td>
                <td><input class="input num small-in" type="number" min="0" max="15" step="0.5" value="${rec.pd ?? ""}" data-site="${site.id}" data-f="pd"></td>
                <td><input class="input num small-in" type="number" min="0" max="8" step="0.5" value="${rec.rec ?? ""}" data-site="${site.id}" data-f="rec"></td>
                <td class="center"><input type="checkbox" class="big-check" ${rec.bop ? "checked" : ""} data-site="${site.id}" data-f="bop"></td>
                <td class="center"><input type="checkbox" class="big-check" ${rec.sup ? "checked" : ""} data-site="${site.id}" data-f="sup"></td>
              </tr>`;
            }).join("")}
          </tbody>
        </table></div>
      </section>

      <hr class="sep">

      <section class="ce-section">
        <div class="row-between mb">
          <h4 class="ce-sub">Preguntas del caso</h4>
          <button class="btn small outline" id="ce-q-add">${icon("plus", 13)} Añadir pregunta</button>
        </div>
        <div id="ce-questions"></div>
      </section>

      <hr class="sep">

      <section class="ce-section">
        <label class="field"><span>Puntos docentes (uno por línea)</span>
          <textarea class="textarea" id="ce-teach" rows="3">${esc(draft.teachingPoints.join("\n"))}</textarea></label>
      </section>
    </div>`;

    /* ---------- fotos ---------- */
    const photoList = $("#ce-photos", body);
    const paintPhotos = () => {
      photoList.innerHTML = draft.photos.map((p, i) => `
        <div class="ce-photo">
          <img src="${p.src}" alt="">
          <input class="input" value="${esc(p.caption || "")}" placeholder="Pie de foto" data-photo-cap="${i}">
          <button class="btn small ghost danger-text" data-photo-del="${i}">${icon("trash", 13)}</button>
        </div>`).join("") || '<p class="hint">Sin fotos subidas.</p>';
    };
    paintPhotos();
    $("#ce-photo-up", body).addEventListener("click", async () => {
      const srcs = await pickImages({ multiple: true, maxDim: 1000 });
      for (const src of srcs) draft.photos.push({ caption: "", kind: "upload", src });
      if (srcs.length) { paintPhotos(); toast({ title: `${srcs.length} foto(s) añadidas` }); }
    });
    photoList.addEventListener("input", (e) => {
      const c = e.target.closest("[data-photo-cap]");
      if (c) draft.photos[+c.dataset.photoCap].caption = c.value;
    });
    photoList.addEventListener("click", (e) => {
      const d = e.target.closest("[data-photo-del]");
      if (d) { draft.photos.splice(+d.dataset.photoDel, 1); paintPhotos(); }
    });

    /* ---------- ilustración esquemática ---------- */
    const artPrev = $("#ce-artprev", body);
    let artKind = draft.photos.find((p) => p.kind && p.kind !== "upload")?.kind || "sano";
    const paintArt = () => { artPrev.innerHTML = CasePhotoSVG(artKind, "Vista previa"); };
    paintArt();
    $("#ce-artkind", body).addEventListener("change", (e) => { artKind = e.target.value; paintArt(); });

    /* ---------- radiografías ---------- */
    const radioList = $("#ce-radios", body);
    const paintRadios = () => {
      radioList.innerHTML = draft.radiographs.map((r, i) => `
        <div class="ce-radio">
          <div class="ce-radio-thumb" data-rview="${i}">${r.src
            ? `<img src="${r.src}" alt="">`
            : CaseRadiographSVG(r.boneLossPct ?? 0, "").replace('<figure class="case-radio">', '<figure class="case-radio mini">')}</div>
          <div class="ce-radio-fields">
            ${r.src ? `<input class="input" value="${esc(r.caption || "")}" placeholder="Descripción de la radiografía" data-radio-cap="${i}">`
              : `<label class="field"><span>Descripción</span><input class="input" value="${esc(r.caption || "Radiografía periapical")}" data-radio-cap="${i}"></label>
                 <label class="field"><span>Pérdida ósea esquemática (%)</span><input class="input num" type="number" min="0" max="80" value="${r.boneLossPct ?? 0}" data-radio-bone="${i}"></label>`}
          </div>
          <button class="btn small ghost danger-text" data-radio-del="${i}">${icon("trash", 13)}</button>
        </div>`).join("") || '<p class="hint">Este caso no tiene radiografías.</p>';
    };
    paintRadios();
    radioList.addEventListener("input", (e) => {
      const c = e.target.closest("[data-radio-cap]");
      if (c) { draft.radiographs[+c.dataset.radioCap].caption = c.value; return; }
      const b = e.target.closest("[data-radio-bone]");
      if (b) { draft.radiographs[+b.dataset.radioBone].boneLossPct = Math.max(0, Math.min(80, +b.value || 0)); paintRadios(); }
    });
    radioList.addEventListener("click", (e) => {
      const v = e.target.closest("[data-rview]");
      if (v) {
        const r = draft.radiographs[+v.dataset.rview];
        if (r.src) openLightbox(r.src, r.caption || "Radiografía", { radio: true });
      }
      const d = e.target.closest("[data-radio-del]");
      if (d) { draft.radiographs.splice(+d.dataset.radioDel, 1); paintRadios(); }
    });
    $("#ce-radio-up", body).addEventListener("click", async () => {
      const srcs = await pickImages({ multiple: true, maxDim: 1400 });
      for (const src of srcs) draft.radiographs.push({ caption: "", src });
      if (srcs.length) { paintRadios(); toast({ title: `${srcs.length} radiografía(s) añadidas` }); }
    });
    $("#ce-radio-synth", body).addEventListener("click", () => {
      draft.radiographs.push({ caption: "Radiografía periapical", boneLossPct: 30 });
      paintRadios();
    });
    $("#ce-radio-bank", body).addEventListener("click", () => {
      if (!RadioBank.items.length) { toast({ title: "El banco está vacío", description: "Sube radiografías en la pestaña «Radiografías»." }); return; }
      const o = openModal(`<div class="pad-modal">
        <h3 class="card-title">Elegir del banco de radiografías</h3>
        <div class="bank-grid">
          ${RadioBank.items.map((r) => `<button class="bank-item" data-bank="${r.id}">
            <img src="${r.src}" alt=""><span>${esc(r.title)}</span></button>`).join("")}
        </div></div>`, { wide: true });
      $$(".bank-item", o).forEach((b) => b.addEventListener("click", () => {
        const r = RadioBank.items.find((x) => x.id === b.dataset.bank);
        draft.radiographs.push({ caption: r.caption || r.title, src: r.src });
        o.close();
        paintRadios();
      }));
    });

    /* ---------- periodontograma ---------- */
    body.addEventListener("input", (e) => {
      const t = e.target.closest("[data-site]");
      if (!t) return;
      const site = t.dataset.site, f = t.dataset.f;
      const rec = draft.perio.sites[site] ?? { bop: false, sup: false };
      if (f === "pd" || f === "rec") rec[f] = t.value === "" ? undefined : +t.value;
      draft.perio.sites[site] = rec;
    });
    body.addEventListener("change", (e) => {
      const t = e.target.closest("[data-site]");
      if (!t) return;
      const site = t.dataset.site, f = t.dataset.f;
      const rec = draft.perio.sites[site] ?? { bop: false, sup: false };
      if (f === "bop" || f === "sup") rec[f] = t.checked;
      draft.perio.sites[site] = rec;
    });

    /* ---------- preguntas ---------- */
    const qHost = $("#ce-questions", body);
    const paintQuestions = () => {
      qHost.innerHTML = "";
      draft.questions.forEach((q, idx) => {
        const block = html(`<div class="ce-q">
          <div class="ce-q-head">
            <select class="select small-sel" data-qk="kind">
              ${[["diagnostico", "Diagnóstico"], ["hallazgos", "Hallazgos"], ["riesgo", "Factores de riesgo"], ["pronostico", "Pronóstico"], ["plan", "Plan de tratamiento"]].map(([v, l]) =>
                `<option value="${v}" ${q.kind === v ? "selected" : ""}>${l}</option>`).join("")}
            </select>
            <label class="check-label"><input type="checkbox" data-qk="multi" ${q.multi ? "checked" : ""}> Respuesta múltiple</label>
            <button class="btn small ghost danger-text" data-qdel="${idx}">${icon("trash", 13)}</button>
          </div>
          <input class="input" placeholder="Enunciado de la pregunta…" value="${esc(q.prompt)}" data-qk="prompt">
          <div class="grid-2">
            ${q.options.map((opt, oi) => `
            <label class="qopt">
              <input type="${q.multi ? "checkbox" : "radio"}" name="ceq-${idx}" data-qopt="${oi}" ${q.correct.includes(oi) ? "checked" : ""} title="Marcar como correcta">
              <input class="input" placeholder="Opción ${oi + 1}" value="${esc(opt)}" data-qopttext="${oi}"></label>`).join("")}
          </div>
          <textarea class="textarea" rows="2" placeholder="Retroalimentación educativa (explicación de la respuesta correcta)…" data-qk="expl">${esc(q.explanation)}</textarea>
        </div>`);
        block.addEventListener("input", (e) => {
          const k = e.target.dataset.qk;
          if (k === "prompt") q.prompt = e.target.value;
          if (k === "expl") q.explanation = e.target.value;
          const ot = e.target.dataset.qopttext;
          if (ot !== undefined) q.options[+ot] = e.target.value;
        });
        block.addEventListener("change", (e) => {
          const k = e.target.dataset.qk;
          if (k === "kind") q.kind = e.target.value;
          if (k === "multi") {
            q.multi = e.target.checked;
            if (!q.multi) q.correct = [q.correct[0] ?? 0];
            paintQuestions();
          }
          const oc = e.target.dataset.qopt;
          if (oc !== undefined) {
            const oi = +oc;
            if (q.multi) {
              q.correct = q.correct.includes(oi) ? q.correct.filter((x) => x !== oi) : [...q.correct, oi];
            } else q.correct = [oi];
          }
        });
        block.addEventListener("click", (e) => {
          const d = e.target.closest("[data-qdel]");
          if (d && draft.questions.length > 1) { draft.questions.splice(idx, 1); paintQuestions(); }
        });
        qHost.appendChild(block);
      });
    };
    paintQuestions();
    $("#ce-q-add", body).addEventListener("click", () => { draft.questions.push(emptyCaseQuestion()); paintQuestions(); });

    /* ---------- guardar / cancelar ---------- */
    $("#ce-cancel", body).addEventListener("click", () => onDone && onDone());
    $("#ce-save", body).addEventListener("click", () => {
      draft.title = $("#ce-title", body).value.trim();
      draft.patient.age = +$("#ce-age", body).value || 40;
      draft.patient.sex = $("#ce-sex", body).value;
      draft.difficulty = $("#ce-diff", body).value;
      draft.patient.chiefComplaint = $("#ce-cc", body).value.trim();
      draft.patient.history = linesToArray($("#ce-hist", body).value);
      draft.patient.habits = linesToArray($("#ce-habits", body).value);
      draft.clinicalFindings = linesToArray($("#ce-find", body).value);
      draft.perio.mobility = +$("#ce-mob", body).value;
      draft.conditionId = $("#ce-cond", body).value;
      draft.teachingPoints = linesToArray($("#ce-teach", body).value);
      // Si no hay fotos subidas, mantener la ilustración esquemática
      if (!draft.photos.some((p) => p.src)) {
        draft.photos = [{ caption: "Ilustración esquemática", kind: artKind }];
      }
      // Validación mínima
      if (!draft.title || draft.questions.some((q) => !q.prompt.trim() || q.options.some((o) => !o.trim()))) {
        alert("Completa el título y todas las preguntas (con opciones no vacías) antes de guardar.");
        return;
      }
      draft.builtin = false;
      Content.upsertCase(draft);
      toast({ title: "Caso guardado", description: `«${draft.title}» está disponible en el módulo Casos clínicos.` });
      onDone && onDone();
    });
  };
  paint();
}

function linesToArray(v) {
  return v.split("\n").map((l) => l.trim()).filter(Boolean);
}
