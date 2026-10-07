/* AR PERIO — views/teacher.js · Módulo 8: panel docente con ACCESO POR CÓDIGO.
 * Crear/editar casos clínicos con fotos y radiografías reales (subidas desde
 * el navegador), banco de radiografías, desafíos, banco de preguntas,
 * resultados del estudiante y ajustes (código de acceso, exportar/importar). */

function renderTeacher(root) {
  if (!Session.isTeacher()) {
    renderTeacherLogin(root);
    return () => {};
  }
  let tab = "casos";
  // Salto directo desde Aprender («Editar tema»): abre la pestaña de contenido
  if (window.__learnEditJump && findTopic(window.__learnEditJump)) tab = "fotos";
  const paint = () => {
    root.innerHTML = `
    <div class="teacher-tabs" id="ttabs">
      ${[["casos", "Casos clínicos"], ["radios", "Radiografías"], ["fotos", "Aprender · Contenido"],
         ["desafios", "Desafíos"], ["preguntas", "Banco de preguntas"], ["cuentas", "Estudiantes"],
         ["resultados", "Resultados"], ["progreso", "Progreso"], ["ajustes", "Ajustes"]].map(([id, label]) =>
        `<button class="ttab ${tab === id ? "active" : ""}" data-tab="${id}">${label}</button>`).join("")}
    </div>
    <div id="teacher-body"></div>`;
    $("#ttabs", root).addEventListener("click", (e) => {
      const b = e.target.closest("[data-tab]");
      if (!b) return;
      tab = b.dataset.tab;
      paint();
    });
    const body = $("#teacher-body", root);
    if (tab === "casos") teacherCasesTab(body, paint);
    else if (tab === "radios") teacherRadiosTab(body, paint);
    else if (tab === "fotos") teacherLearnImagesTab(body, paint);
    else if (tab === "desafios") teacherChallengesTab(body, paint);
    else if (tab === "preguntas") teacherQuestionsTab(body, paint);
    else if (tab === "cuentas") teacherStudentsTab(body, paint);
    else if (tab === "resultados") teacherResultsTab(body);
    else if (tab === "progreso") teacherProgressTab(body);
    else teacherSettingsTab(body);
  };
  paint();
  return () => {};
}

/* ------------------------------- Login ------------------------------------ */

function renderTeacherLogin(root) {
  root.innerHTML = `
  <div class="teacher-login card pad">
    <div class="tl-icon">${icon("graduation-cap", 30)}</div>
    <h2>Acceso docente</h2>
    <p class="hint">Este panel permite crear casos clínicos, subir radiografías, definir
    desafíos y revisar los resultados de los estudiantes. Introduce el código de acceso
    del docente.</p>
    <form id="tl-form">
      <label class="field"><span>${icon("key", 14)} Código de acceso</span>
        <input class="input" id="tl-code" type="password" autocomplete="off" placeholder="Código del docente" autofocus>
      </label>
      <p class="tl-error" id="tl-error"></p>
      <button class="btn primary block" type="submit">${icon("log-out", 15)} Ingresar como docente</button>
    </form>
    <p class="hint small">${icon("info", 13)} Código inicial: <b>PERIO2025</b> · puedes cambiarlo en
    Ajustes una vez dentro. El acceso queda activo en este navegador hasta que pulses «Salir».</p>
  </div>`;
  $("#tl-form", root).addEventListener("submit", (e) => {
    e.preventDefault();
    Student.endSession(); // cierra limpiamente la sesión de estudio anterior (invitado o cuenta)
    const code = $("#tl-code", root).value;
    if (Session.login(code)) {
      toast({ title: "Sesión docente iniciada", description: "Ya puedes gestionar casos clínicos y radiografías." });
      App.render();
    } else {
      $("#tl-error", root).textContent = "Código incorrecto. Inténtalo de nuevo.";
      $("#tl-code", root).select();
    }
  });
}

/* ---------------------------- Casos clínicos ------------------------------ */

function teacherCasesTab(body, repaint) {
  // Listener delegado UNA sola vez por invocación de la pestaña
  body.addEventListener("click", (e) => {
    const ed = e.target.closest("[data-edit]");
    if (ed) { const c = Content.cases.find((x) => x.id === ed.dataset.edit); if (c) openCaseEditor(body, c, () => body.dispatchEvent(new CustomEvent("repaint-cases"))); }
    const del = e.target.closest("[data-del]");
    if (del) {
      const c = Content.cases.find((x) => x.id === del.dataset.del);
      if (confirm(`¿Eliminar el caso «${c?.title}»? Esta acción no se puede deshacer.`)) {
        Content.removeCase(del.dataset.del);
        toast({ title: "Caso eliminado" });
        paint();
      }
    }
    const dup = e.target.closest("[data-dup]");
    if (dup) {
      const c = BUILTIN_CASES.find((x) => x.id === dup.dataset.dup);
      if (c) {
        const copy = structuredClone(c);
        copy.id = `${c.id}-copia-${Date.now().toString(36)}`;
        copy.title = `${c.title} (copia)`;
        copy.builtin = false;
        openCaseEditor(body, copy, () => body.dispatchEvent(new CustomEvent("repaint-cases")));
      }
    }
  });
  body.addEventListener("repaint-cases", () => paint());
  const paint = () => {
    body.innerHTML = `
    <div class="btn-row mb">
      <button class="btn small primary" id="tc-new">${icon("file-plus", 15)} Crear caso clínico</button>
      <button class="btn small outline" id="tc-export">${icon("download", 15)} Exportar JSON</button>
      <button class="btn small outline" id="tc-import">${icon("upload", 15)} Importar JSON</button>
    </div>
    ${Content.cases.length === 0 ? `
    <div class="card pad dashed"><p class="hint">Todavía no hay casos propios. Crea casos con el botón
    superior o importa un JSON compartido por otro docente. Los casos creados aquí aparecen en el
    módulo Casos clínicos sin necesidad de modificar el código.</p></div>` : `
    <div class="case-grid">
      ${Content.cases.map((c) => `
      <div class="card case-card">
        <div class="cc-head"><h3>${esc(c.title)}</h3><span class="badge outline">${esc(c.difficulty)}</span></div>
        <p class="cc-meta">${c.patient.age} años · ${c.questions.length} preguntas · condición: ${esc(conditionById(c.conditionId).label)}</p>
        <p class="cc-meta">${(c.photos || []).filter((p) => p.src).length} fotos · ${caseRadiographs(c).length} radiografías</p>
        <div class="cc-foot">
          <button class="btn small outline" data-edit="${c.id}">${icon("pencil", 13)} Editar</button>
          <button class="btn small ghost danger-text" data-del="${c.id}">${icon("trash", 13)} Eliminar</button>
        </div>
      </div>`).join("")}
    </div>`}
    <div class="card pad">
      <p class="hint"><b>Casos integrados (${BUILTIN_CASES.length}):</b>
      ${BUILTIN_CASES.map((c) => esc(c.title.split("·")[0].trim())).join(" · ")}. Para adaptar un caso
      integrado a tu curso, duplícalo y edítalo:</p>
      <div class="btn-row mt">
        ${BUILTIN_CASES.map((c) => `<button class="btn small ghost" data-dup="${c.id}">${icon("copy", 13)} Duplicar «${esc(c.title.split("·")[1]?.trim() || c.title)}»</button>`).join("")}
      </div>
    </div>`;
    $("#tc-new", body).addEventListener("click", () => openCaseEditor(body, null, paint));
    $("#tc-export", body).addEventListener("click", () => {
      const blob = new Blob([Content.exportAll()], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "ar-perio-contenido.json"; a.click();
      URL.revokeObjectURL(url);
    });
    $("#tc-import", body).addEventListener("click", async () => {
      const input = document.createElement("input");
      input.type = "file"; input.accept = "application/json";
      input.onchange = async () => {
        const f = input.files?.[0];
        if (!f) return;
        try {
          const data = JSON.parse(await f.text());
          Content.importAll({ cases: data.cases, challenges: data.challenges, radiographs: data.radiographs, learnImages: data.learnImages, diagramOverrides: data.diagramOverrides, topicOverrides: data.topicOverrides, customTopics: data.customTopics, studentAccounts: data.studentAccounts });
          toast({ title: "Contenido importado", description: `Casos: ${data.cases?.length ?? 0} · Desafíos: ${data.challenges?.length ?? 0} · Radiografías: ${data.radiographs?.length ?? 0} · Cuentas: ${data.studentAccounts?.length ?? 0}` });
          paint();
        } catch {
          toast({ title: "Error al importar", description: "El archivo no tiene un formato válido.", variant: "destructive" });
        }
      };
      input.click();
    });
  };
  paint();
}

/* --------------------------- Banco de radiografías ------------------------ */

function teacherRadiosTab(body, repaint) {
  // Listeners delegados UNA sola vez por invocación de la pestaña
  body.addEventListener("input", (e) => {
    const t = e.target.closest("[data-title]");
    if (t) { RadioBank.update(t.dataset.title, { title: t.value }); return; }
    const c = e.target.closest("[data-cap]");
    if (c) RadioBank.update(c.dataset.cap, { caption: c.value });
  });
  body.addEventListener("click", (e) => {
    const v = e.target.closest("[data-view]");
    if (v) {
      const r = RadioBank.items.find((x) => x.id === v.dataset.view);
      if (r) openLightbox(r.src, r.title + (r.caption ? " — " + r.caption : ""), { radio: true });
    }
    const d = e.target.closest("[data-del]");
    if (d && confirm("¿Eliminar esta radiografía del banco?")) {
      RadioBank.remove(d.dataset.del);
      paint();
    }
    const tc = e.target.closest("[data-tocase]");
    if (tc) {
      const r = RadioBank.items.find((x) => x.id === tc.dataset.tocase);
      if (!r) return;
      const cases = allCases();
      const o = openModal(`<div class="pad-modal">
        <h3 class="card-title">Insertar en un caso clínico</h3>
        <p class="hint mb">Selecciona el caso destino (se añade a sus radiografías):</p>
        <div class="pick-list">
          ${cases.map((c) => `<button class="pick-item" data-case="${c.id}">
            <b>${esc(c.title)}</b><span class="hint">${c.builtin ? "Integrado (se duplicará al guardar)" : "Del docente"}</span></button>`).join("")}
        </div></div>`);
      $$(".pick-item", o).forEach((b) => b.addEventListener("click", () => {
        const c = cases.find((x) => x.id === b.dataset.case);
        const target = Content.cases.find((x) => x.id === c.id) || (() => {
          const copy = structuredClone(c);
          copy.id = c.builtin ? `${c.id}-copia-${Date.now().toString(36)}` : c.id;
          copy.title = c.builtin ? `${c.title} (copia)` : c.title;
          copy.builtin = false;
          return copy;
        })();
        target.radiographs = [...caseRadiographs(target), { caption: r.caption || r.title, src: r.src }];
        Content.upsertCase(target);
        o.close();
        toast({ title: "Radiografía insertada", description: `Añadida a «${target.title}».` });
      }));
    }
  });
  const paint = () => {
    body.innerHTML = `
    <div class="card pad mb">
      <div class="panel-title">${icon("image", 15)} Banco de radiografías del curso</div>
      <p class="hint mb">Sube radiografías reales (se optimizan y guardan en este navegador).
      Después podrás insertarlas en cualquier caso clínico desde el editor de casos,
      o los estudiantes podrán estudiarlas al resolver el caso.</p>
      <div class="btn-row">
        <button class="btn small primary" id="rb-upload">${icon("upload", 15)} Subir radiografías</button>
      </div>
    </div>
    ${RadioBank.items.length === 0 ? `
    <div class="card pad dashed"><p class="hint">El banco está vacío. Sube imágenes de periapicales,
    panorámicas o bite-wings con sus descripciones. Formatos: JPG, PNG.</p></div>` : `
    <div class="radio-grid">
      ${RadioBank.items.map((r) => `
      <div class="card radio-card">
        <div class="radio-thumb" data-view="${r.id}"><img src="${r.src}" alt="${esc(r.title)}" loading="lazy"></div>
        <input class="input" value="${esc(r.title)}" data-title="${r.id}" placeholder="Título (p. ej. Periapical 11-13)">
        <input class="input" value="${esc(r.caption || "")}" data-cap="${r.id}" placeholder="Descripción clínica / hallazgos">
        <div class="btn-row">
          <button class="btn small outline" data-tocase="${r.id}" title="Insertar en un caso">${icon("file-plus", 13)} A un caso</button>
          <button class="btn small ghost danger-text" data-del="${r.id}">${icon("trash", 13)}</button>
        </div>
      </div>`).join("")}
    </div>`}`;
    $("#rb-upload", body).addEventListener("click", async () => {
      const srcs = await pickImages({ multiple: true, maxDim: 1400 });
      for (const src of srcs) RadioBank.add({ title: "Radiografía sin título", caption: "", src });
      if (srcs.length) {
        toast({ title: `${srcs.length} radiografía(s) añadidas al banco`, description: "Completa su título y descripción." });
        paint();
      }
    });
  };
  paint();
}
