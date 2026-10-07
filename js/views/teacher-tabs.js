/* AR PERIO — views/teacher-tabs.js · Resto de pestañas del panel docente
 * (aprender·fotos, desafíos, preguntas, resultados, progreso, ajustes) + editor de casos. */

/* --------------------- Aprender · Fotos del curso ------------------------- */
/* El docente sube fotografías clínicas y las asocia a un tema concreto del
 * módulo Aprender; se muestran al estudiante dentro del tema con pie de foto.
 * Además, desde esta pestaña puede EDITAR EL TEXTO de las lecciones: título,
 * resumen, bloques de contenido y preguntas (autoguardado en localStorage). */

const BLK_META = {
  p: { label: "Párrafo", icon: "pencil" },
  list: { label: "Lista", icon: "list-checks" },
  table: { label: "Tabla", icon: "clipboard-list" },
  note: { label: "Nota destacada", icon: "lightbulb" },
  diagram: { label: "Ilustración", icon: "brush" },
  kv: { label: "Claves / definiciones", icon: "book-open" },
  compare: { label: "Tabla comparativa", icon: "clipboard-list" },
};

/** Editor de un bloque de contenido (recibe el bloque, su índice y el total). */
function learnBlockEditor(b, i, n) {
  const meta = BLK_META[b.type] ?? { label: b.type, icon: "info" };
  const head = `
      <div class="blk-head">
        <span class="blk-type">${icon(meta.icon, 13)} ${meta.label} <span class="blk-num">${i + 1}/${n}</span></span>
        <span class="blk-ops">
          <button class="btn tiny ghost" data-bup="${i}" ${i === 0 ? "disabled" : ""} title="Subir bloque">${icon("chevron-up", 13)}</button>
          <button class="btn tiny ghost" data-bdown="${i}" ${i === n - 1 ? "disabled" : ""} title="Bajar bloque">${icon("chevron-down", 13)}</button>
          <button class="btn tiny ghost danger-text" data-bdel="${i}" title="Eliminar bloque">${icon("trash", 13)}</button>
        </span>
      </div>`;
  let field = "";
  switch (b.type) {
    case "p":
      field = `<textarea class="textarea" rows="5" data-bi="${i}" data-f="text" placeholder="Texto del párrafo…">${esc(b.text ?? "")}</textarea>
        <p class="blk-hint">Encierra una palabra entre <b>**doble asterisco**</b> para mostrarla en negrita.</p>`;
      break;
    case "note":
      field = `<label class="field"><span>Tipo de nota</span>
          <select class="select" data-bi="${i}" data-f="tone">
            <option value="tip" ${b.tone !== "warn" && b.tone !== "clinical" ? "selected" : ""}>Consejo (verde)</option>
            <option value="clinical" ${b.tone === "clinical" ? "selected" : ""}>Nota clínica (ámbar)</option>
            <option value="warn" ${b.tone === "warn" ? "selected" : ""}>Precaución (rosa)</option>
          </select></label>
        <textarea class="textarea" rows="3" data-bi="${i}" data-f="text" placeholder="Texto de la nota…">${esc(b.text ?? "")}</textarea>`;
      break;
    case "list":
      field = `<textarea class="textarea" rows="${Math.max(3, (b.items ?? []).length + 1)}" data-bi="${i}" data-f="items">${esc((b.items ?? []).join("\n"))}</textarea>
        <label class="field inline"><input type="checkbox" data-bi="${i}" data-f="ordered" ${b.ordered ? "checked" : ""}> Lista numerada (1., 2., 3…)</label>
        <p class="blk-hint">Un elemento por línea.</p>`;
      break;
    case "kv":
      field = `<input class="input" value="${esc(b.title ?? "")}" data-bi="${i}" data-f="title" placeholder="Título de la caja">
        ${(b.items ?? []).map((it, j) => `
        <div class="kv-edit-row">
          <input class="input" value="${esc(it.k ?? "")}" data-bi="${i}" data-kv="${j}" data-f="k" placeholder="Término">
          <input class="input" value="${esc(it.v ?? "")}" data-bi="${i}" data-kv="${j}" data-f="v" placeholder="Definición">
          <button class="btn tiny ghost danger-text" data-kvd="${i}:${j}" title="Quitar fila">${icon("trash", 13)}</button>
        </div>`).join("")}
        <button class="btn tiny ghost" data-kva="${i}">${icon("plus", 13)} Añadir fila</button>`;
      break;
    case "table": {
      const cols = Math.max(1, (b.headers ?? []).length);
      field = `<div class="tbl-edit-row" style="grid-template-columns:repeat(${cols},1fr) 30px">
          ${(b.headers ?? []).map((h, j) => `<input class="input" value="${esc(h ?? "")}" data-bi="${i}" data-th="${j}" placeholder="Columna ${j + 1}">`).join("")}<span></span>
        </div>
        ${(b.rows ?? []).map((r, j) => `
        <div class="tbl-edit-row" style="grid-template-columns:repeat(${cols},1fr) 30px">
          ${r.map((c, k) => `<input class="input" value="${esc(c ?? "")}" data-bi="${i}" data-tr="${j}" data-td="${k}">`).join("")}
          <button class="btn tiny ghost danger-text" data-trd="${i}:${j}" title="Quitar fila">${icon("trash", 13)}</button>
        </div>`).join("")}
        <button class="btn tiny ghost" data-tra="${i}">${icon("plus", 13)} Añadir fila</button>
        <p class="blk-hint">Las celdas admiten **negritas**.</p>`;
      break;
    }
    case "compare":
      field = `<div class="tbl-edit-row cmp" style="grid-template-columns:1.1fr 1fr 1fr 30px">
          <span class="blk-hint">Criterio</span>
          <input class="input" value="${esc(b.columns?.[0] ?? "")}" data-bi="${i}" data-col="0" placeholder="Columna 1">
          <input class="input" value="${esc(b.columns?.[1] ?? "")}" data-bi="${i}" data-col="1" placeholder="Columna 2">
          <span></span>
        </div>
        ${(b.rows ?? []).map((r, j) => `
        <div class="tbl-edit-row cmp" style="grid-template-columns:1.1fr 1fr 1fr 30px">
          ${[0, 1, 2].map((k) => `<input class="input" value="${esc(r[k] ?? "")}" data-bi="${i}" data-cr="${j}" data-cd="${k}">`).join("")}
          <button class="btn tiny ghost danger-text" data-crd="${i}:${j}" title="Quitar fila">${icon("trash", 13)}</button>
        </div>`).join("")}
        <button class="btn tiny ghost" data-cra="${i}">${icon("plus", 13)} Añadir fila</button>`;
      break;
    case "diagram":
      field = `<input class="input" value="${esc(b.caption ?? "")}" data-bi="${i}" data-f="caption" placeholder="Pie de la ilustración">
        <p class="blk-hint">La imagen se sustituye en la sección «Ilustraciones del tema» de esta misma pestaña.</p>`;
      break;
    default:
      field = `<p class="blk-hint">Este bloque no es editable aquí.</p>`;
  }
  return `<div class="blk-card">${head}${field}</div>`;
}

/** Editor de una pregunta del tema. */
function learnQuizEditor(q, i, n) {
  return `
    <div class="blk-card">
      <div class="blk-head">
        <span class="blk-type">${icon("list-checks", 13)} Pregunta <span class="blk-num">${i + 1}/${n}</span></span>
        <span class="blk-ops">
          <button class="btn tiny ghost" data-qup="${i}" ${i === 0 ? "disabled" : ""} title="Subir">${icon("chevron-up", 13)}</button>
          <button class="btn tiny ghost" data-qdown="${i}" ${i === n - 1 ? "disabled" : ""} title="Bajar">${icon("chevron-down", 13)}</button>
          <button class="btn tiny ghost danger-text" data-qdel="${i}" title="Eliminar pregunta">${icon("trash", 13)}</button>
        </span>
      </div>
      <textarea class="textarea" rows="2" data-qi="${i}" data-f="prompt" placeholder="Enunciado de la pregunta…">${esc(q.prompt ?? "")}</textarea>
      ${(q.options ?? []).map((o, j) => `
      <label class="qopt-edit" title="Marca el círculo para señalar la respuesta correcta">
        <input type="radio" name="ttqc-${i}" data-qi="${i}" data-qcorrect="${j}" ${q.correct === j ? "checked" : ""}>
        <input class="input" value="${esc(o ?? "")}" data-qi="${i}" data-qo="${j}" placeholder="Opción ${j + 1}">
      </label>`).join("")}
      <textarea class="textarea" rows="2" data-qi="${i}" data-f="explanation" placeholder="Explicación que verá el estudiante al responder…">${esc(q.explanation ?? "")}</textarea>
    </div>`;
}

function teacherLearnImagesTab(body, repaint) {
  // Salto directo desde el módulo Aprender («Editar tema» como docente)
  let topicId = (window.__learnEditJump && findTopic(window.__learnEditJump))
    ? window.__learnEditJump : LEARN_CATEGORIES[0].topics[0].id;
  window.__learnEditJump = null;
  let capTimer = null;
  let creating = false;   // formulario de «Nuevo tema» abierto

  const splitKey = (key) => {
    const i = key.indexOf("::");
    return [key.slice(0, i), key.slice(i + 2)];
  };
  const saveCaption = (key, value) => {
    const [tid, id] = splitKey(key);
    Content.updateLearnImage(tid, id, { caption: value });
  };
  const saveDiaCaption = (key, value) => {
    const [tid, did] = splitKey(key);
    const ov = Content.diagramOverride(tid, did);
    if (ov) Content.setDiagramOverride(tid, did, { src: ov.src, caption: value, at: ov.at });
  };

  /* --------- Estado del editor de TEXTO de la lección --------- */
  let editing = false;     // editor abierto / cerrado
  let draft = null;        // copia editable del tema (título, resumen, bloques, quiz)
  let draftTopic = null;   // tema al que pertenece el draft actual
  let saveTimer = null;
  let pendingSave = false;

  const ensureDraft = () => {
    if (draft && draftTopic === topicId) return;
    const f = findTopic(topicId);
    draft = f ? structuredClone(f.topic) : null;
    draftTopic = topicId;
    pendingSave = false;
  };
  const draftPick = () => ({ title: draft.title, summary: draft.summary, blocks: draft.blocks, quiz: draft.quiz });
  const flashSaved = () => {
    const el = $("#tt-saved", body);
    if (!el) return;
    el.classList.add("show");
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove("show"), 1800);
  };
  /** Guarda el draft: los temas del programa van a topicOverrides y los temas
   * creados por el docente se actualizan directamente en customTopics. */
  const persistDraft = () => {
    if (!draft) return;
    const pick = draftPick();
    if (Content.isCustomTopic(topicId)) {
      const ct = Content.getCustomTopic(topicId);
      Content.upsertCustomTopic({ ...ct, ...pick });
    } else {
      Content.setTopicOverride(topicId, pick);
    }
    flashSaved();
  };
  const flushSave = () => {
    clearTimeout(saveTimer);
    if (!pendingSave || !draft || draftTopic !== topicId) return;
    pendingSave = false;
    persistDraft();
  };
  const scheduleSave = () => {
    pendingSave = true;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(flushSave, 650);
  };
  const saveNow = () => {
    clearTimeout(saveTimer);
    if (!draft || draftTopic !== topicId) return;
    pendingSave = false;
    persistDraft();
  };

  /** Aplica el valor de un campo del editor al draft y programa el guardado. */
  const applyField = (el) => {
    if (!draft) return;
    if (el.dataset.tt === "title") { draft.title = el.value; scheduleSave(); return; }
    if (el.dataset.tt === "summary") { draft.summary = el.value; scheduleSave(); return; }
    if (el.dataset.bi !== undefined) {
      const b = draft.blocks[+el.dataset.bi];
      if (!b) return;
      if (el.dataset.kv !== undefined) { const row = (b.items ??= [])[+el.dataset.kv]; if (row) row[el.dataset.f] = el.value; }
      else if (el.dataset.th !== undefined) { (b.headers ??= [])[+el.dataset.th] = el.value; }
      else if (el.dataset.tr !== undefined) { const row = (b.rows ??= [])[+el.dataset.tr]; if (row) row[+el.dataset.td] = el.value; }
      else if (el.dataset.col !== undefined) { (b.columns ??= ["", ""])[+el.dataset.col] = el.value; }
      else if (el.dataset.cr !== undefined) { const row = (b.rows ??= [])[+el.dataset.cr]; if (row) row[+el.dataset.cd] = el.value; }
      else if (el.dataset.f === "items") { b.items = el.value.split("\n"); }
      else if (el.dataset.f === "ordered") { b.ordered = el.checked; }
      else if (el.dataset.f) { b[el.dataset.f] = el.value; }
      scheduleSave();
      return;
    }
    if (el.dataset.qi !== undefined) {
      const q = draft.quiz[+el.dataset.qi];
      if (!q) return;
      if (el.dataset.qo !== undefined) { (q.options ??= [])[+el.dataset.qo] = el.value; }
      else if (el.dataset.qcorrect !== undefined) { q.correct = +el.dataset.qcorrect; }
      else if (el.dataset.f) { q[el.dataset.f] = el.value; }
      scheduleSave();
    }
  };

  // Listeners delegados UNA sola vez por invocación de la pestaña
  body.addEventListener("input", (e) => {
    const tt = e.target.closest("[data-bi],[data-qi],[data-tt]");
    if (tt) { applyField(tt); return; }
    const t = e.target.closest("[data-lcap]");
    if (t) { clearTimeout(capTimer); capTimer = setTimeout(() => saveCaption(t.dataset.lcap, t.value), 350); return; }
    const d = e.target.closest("[data-dcap]");
    if (d) { clearTimeout(capTimer); capTimer = setTimeout(() => saveDiaCaption(d.dataset.dcap, d.value), 350); }
  });
  body.addEventListener("change", (e) => {
    const tt = e.target.closest("[data-bi],[data-qi],[data-tt]");
    if (tt) { applyField(tt); return; }
    const t = e.target.closest("[data-lcap]");
    if (t) { clearTimeout(capTimer); saveCaption(t.dataset.lcap, t.value); return; }
    const d = e.target.closest("[data-dcap]");
    if (d) { clearTimeout(capTimer); saveDiaCaption(d.dataset.dcap, d.value); }
  });
  body.addEventListener("click", async (e) => {
    const jump = e.target.closest("[data-ltopic]");
    if (jump) { flushSave(); topicId = jump.dataset.ltopic; paint(); return; }
    const v = e.target.closest("[data-lview]");
    if (v) {
      const [tid, id] = splitKey(v.dataset.lview);
      const im = Content.learnImagesFor(tid).find((x) => x.id === id);
      if (im) openLightbox(im.src, im.caption || "");
      return;
    }
    const d = e.target.closest("[data-ldel]");
    if (d && confirm("¿Quitar esta imagen del tema?")) {
      const [tid, id] = splitKey(d.dataset.ldel);
      Content.removeLearnImage(tid, id);
      toast({ title: "Imagen eliminada" });
      paint();
      return;
    }
    const c = e.target.closest("[data-lclear]");
    if (c && confirm("¿Quitar TODAS las imágenes de este tema?")) {
      Content.clearLearnImages(c.dataset.lclear);
      paint();
      return;
    }
    const drep = e.target.closest("[data-drep]");
    if (drep) {
      const [tid, did] = splitKey(drep.dataset.drep);
      const srcs = await pickImages({ multiple: false, maxDim: 1600 });
      if (!srcs.length) return;
      const prev = Content.diagramOverride(tid, did);
      Content.setDiagramOverride(tid, did, { src: srcs[0], caption: prev ? prev.caption : "" });
      const tf = findTopic(tid);
      toast({
        title: "Ilustración reemplazada",
        description: tf ? `Tu imagen ya es visible en Aprender › ${tf.topic.title}.` : "Ya es visible en el módulo Aprender.",
      });
      paint();
      return;
    }
    const dvw = e.target.closest("[data-dview]");
    if (dvw) {
      const [tid, did] = splitKey(dvw.dataset.dview);
      const ov = Content.diagramOverride(tid, did);
      if (ov) openLightbox(ov.src, ov.caption || "");
      return;
    }
    const drst = e.target.closest("[data-drestore]");
    if (drst && confirm("¿Restaurar la ilustración original del programa en este tema?")) {
      const [tid, did] = splitKey(drst.dataset.drestore);
      Content.removeDiagramOverride(tid, did);
      toast({ title: "Ilustración original restaurada" });
      paint();
      return;
    }

    /* ---- Nuevo tema creado desde cero por el docente ---- */
    const ntg = e.target.closest("[data-ntoggle]");
    if (ntg) {
      flushSave();
      creating = !creating;
      paint();
      if (creating) $("#nt-card", body)?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    const ntc = e.target.closest("[data-nt-cancel]");
    if (ntc) { creating = false; paint(); return; }
    const nts = e.target.closest("#nt-save");
    if (nts) {
      const title = $("#nt-title", body).value.trim();
      if (!title) { alert("Ponle un título al tema."); return; }
      const summary = $("#nt-summary", body).value.trim();
      const categoryId = $("#nt-cat", body).value;
      const id = `ct-${Date.now().toString(36)}`;
      Content.upsertCustomTopic({
        id, categoryId,
        title,
        summary: summary || "Tema creado por el docente para este curso.",
        blocks: [{ type: "p", text: "" }],
        quiz: [],
        at: Date.now(),
      });
      creating = false;
      topicId = id;
      editing = true;
      draft = null; // ensureDraft clonará el tema recién creado
      toast({
        title: "Tema creado",
        description: "Ya es visible en Aprender. Añade ahora párrafos, listas, notas y preguntas.",
      });
      paint();
      $("#tt-card", body)?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    /* ---- Eliminar un tema creado por el docente ---- */
    const tdel = e.target.closest("[data-tt-delete]");
    if (tdel && confirm("¿Eliminar ESTE tema creado por ti?\nSe perderán su texto, sus fotos, sus preguntas extra y su registro de lectura. Los temas del programa no se ven afectados.")) {
      const id = topicId;
      Content.removeCustomTopic(id);
      Content.clearLearnImages(id);
      Object.keys(Content.data.diagramOverrides ?? {})
        .filter((k) => k.startsWith(id + "::"))
        .forEach((k) => Content.removeDiagramOverride(id, k.slice(id.length + 2)));
      Content.removeTopicOverride(id);
      Content.data.customQuestions = Content.data.customQuestions.filter((q) => !q.id.startsWith(id + "-extra-"));
      Content.save();
      Student.data.readTopics = Student.data.readTopics.filter((t) => t !== id);
      Student.save();
      clearTimeout(saveTimer);
      pendingSave = false;
      draft = null;
      editing = false;
      topicId = LEARN_CATEGORIES[0].topics[0].id;
      toast({ title: "Tema eliminado", description: "El resto del contenido no se ha modificado." });
      paint();
      return;
    }

    /* ---- Operaciones del editor de TEXTO de la lección ---- */
    const tte = e.target.closest("[data-tt-edit]");
    if (tte) {
      editing = true;
      ensureDraft();
      paint();
      $("#tt-card", body)?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    const ttd = e.target.closest("[data-tt-done]");
    if (ttd) { flushSave(); editing = false; paint(); return; }
    const ttr = e.target.closest("[data-tt-restore]");
    if (ttr && confirm("¿Restaurar el TEXTO ORIGINAL del programa en este tema?\nSe perderán tus ediciones de texto (las fotos y las ilustraciones reemplazadas se conservan).")) {
      clearTimeout(saveTimer);
      pendingSave = false;
      Content.removeTopicOverride(topicId);
      draft = null;
      editing = false;
      toast({ title: "Texto original restaurado" });
      paint();
      return;
    }
    const bup = e.target.closest("[data-bup]");
    if (bup) {
      ensureDraft();
      const i = +bup.dataset.bup;
      if (draft && i > 0) { [draft.blocks[i - 1], draft.blocks[i]] = [draft.blocks[i], draft.blocks[i - 1]]; saveNow(); paint(); }
      return;
    }
    const bdn = e.target.closest("[data-bdown]");
    if (bdn) {
      ensureDraft();
      const i = +bdn.dataset.bdown;
      if (draft && i < draft.blocks.length - 1) { [draft.blocks[i + 1], draft.blocks[i]] = [draft.blocks[i], draft.blocks[i + 1]]; saveNow(); paint(); }
      return;
    }
    const bdl = e.target.closest("[data-bdel]");
    if (bdl && confirm("¿Eliminar este bloque de la lección?")) {
      ensureDraft();
      if (draft) { draft.blocks.splice(+bdl.dataset.bdel, 1); saveNow(); paint(); }
      return;
    }
    const bad = e.target.closest("[data-badd]");
    if (bad) {
      ensureDraft();
      if (draft) {
        const t = bad.dataset.badd;
        draft.blocks.push(t === "p" ? { type: "p", text: "" }
          : t === "list" ? { type: "list", items: [""], ordered: false }
          : t === "note" ? { type: "note", tone: "tip", text: "" }
          : { type: "kv", title: "", items: [{ k: "", v: "" }] });
        saveNow();
        paint();
        $(".tt-blocks", body)?.lastElementChild?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }
    const kvd = e.target.closest("[data-kvd]");
    if (kvd) {
      ensureDraft();
      const [i, j] = kvd.dataset.kvd.split(":").map(Number);
      if (draft?.blocks[i]?.items) { draft.blocks[i].items.splice(j, 1); saveNow(); paint(); }
      return;
    }
    const kva = e.target.closest("[data-kva]");
    if (kva) {
      ensureDraft();
      const b = draft?.blocks[+kva.dataset.kva];
      if (b) { (b.items ??= []).push({ k: "", v: "" }); saveNow(); paint(); }
      return;
    }
    const trd = e.target.closest("[data-trd]");
    if (trd) {
      ensureDraft();
      const [i, j] = trd.dataset.trd.split(":").map(Number);
      if (draft?.blocks[i]?.rows) { draft.blocks[i].rows.splice(j, 1); saveNow(); paint(); }
      return;
    }
    const tra = e.target.closest("[data-tra]");
    if (tra) {
      ensureDraft();
      const b = draft?.blocks[+tra.dataset.tra];
      if (b) { const cols = Math.max(1, (b.headers ?? []).length); (b.rows ??= []).push(Array.from({ length: cols }, () => "")); saveNow(); paint(); }
      return;
    }
    const crd = e.target.closest("[data-crd]");
    if (crd) {
      ensureDraft();
      const [i, j] = crd.dataset.crd.split(":").map(Number);
      if (draft?.blocks[i]?.rows) { draft.blocks[i].rows.splice(j, 1); saveNow(); paint(); }
      return;
    }
    const cra = e.target.closest("[data-cra]");
    if (cra) {
      ensureDraft();
      const b = draft?.blocks[+cra.dataset.cra];
      if (b) { (b.rows ??= []).push(["", "", ""]); saveNow(); paint(); }
      return;
    }
    const qup = e.target.closest("[data-qup]");
    if (qup) {
      ensureDraft();
      const i = +qup.dataset.qup;
      if (draft && i > 0) { [draft.quiz[i - 1], draft.quiz[i]] = [draft.quiz[i], draft.quiz[i - 1]]; saveNow(); paint(); }
      return;
    }
    const qdn = e.target.closest("[data-qdown]");
    if (qdn) {
      ensureDraft();
      const i = +qdn.dataset.qdown;
      if (draft && i < draft.quiz.length - 1) { [draft.quiz[i + 1], draft.quiz[i]] = [draft.quiz[i], draft.quiz[i + 1]]; saveNow(); paint(); }
      return;
    }
    const qdl = e.target.closest("[data-qdel]");
    if (qdl && confirm("¿Eliminar esta pregunta del tema?")) {
      ensureDraft();
      if (draft) { draft.quiz.splice(+qdl.dataset.qdel, 1); saveNow(); paint(); }
      return;
    }
    const qad = e.target.closest("[data-qadd]");
    if (qad) {
      ensureDraft();
      if (draft) {
        draft.quiz.push({ id: `${topicId}-q-${Date.now().toString(36)}`, prompt: "", options: ["", "", "", ""], correct: 0, explanation: "" });
        saveNow();
        paint();
        $(".tt-quiz", body)?.lastElementChild?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    if (e.target.closest("#lp-upload")) {
      const srcs = await pickImages({ multiple: true, maxDim: 1400 });
      if (!srcs.length) return;
      for (const src of srcs) Content.addLearnImage(topicId, { src, caption: "" });
      const f = findTopic(topicId);
      toast({
        title: `${srcs.length} imagen(es) añadidas`,
        description: f ? `Ya son visibles en Aprender › ${f.topic.title}.` : "Ya son visibles en el módulo Aprender.",
      });
      paint();
    }
  });

  const paint = () => {
    const imgs = Content.learnImagesFor(topicId);
    const groups = learnCategories().map((c) => ({
      title: c.title,
      items: c.topics.map((raw) => {
        const t = applyTopicOverride(raw);
        const own = Content.isCustomTopic(t.id);
        return {
          id: t.id,
          label: `${t.title}${own ? " · propio" : ""}${Content.learnImagesFor(t.id).length ? ` (${Content.learnImagesFor(t.id).length})` : ""}`,
        };
      }),
    }));
    const withImages = Content.topicsWithImages();
    const withOverrides = Content.topicsWithOverrides();
    const withText = Content.topicsWithTextOverrides();
    const customs = Content.customTopicsAll();
    const f = findTopic(topicId);
    ensureDraft();
    const over = Content.topicOverride(topicId);
    const isCustom = Content.isCustomTopic(topicId);
    // Ilustraciones integradas del tema (reemplazables por el docente)
    const diags = (f ? f.topic.blocks : []).filter((b) => b.type === "diagram" && DIAGRAMS[b.id]);
    const topicsWithDiags = [];
    learnCategories().forEach((c) => c.topics.forEach((raw) => {
      if (applyTopicOverride(raw).blocks.some((b) => b.type === "diagram" && DIAGRAMS[b.id])) topicsWithDiags.push(raw);
    }));

    // Tarjeta del editor de TEXTO de la lección
    const textCard = `
    <div class="card pad mb" id="tt-card">
      <div class="tt-title-row">
        <div class="panel-title">${icon("pencil", 15)} Texto de la lección</div>
        ${isCustom
          ? '<span class="dia-badge own">Tema creado por ti</span>'
          : `<span class="dia-badge ${over ? "own" : ""}">${over ? "Texto editado por ti" : "Texto original del programa"}</span>`}
      </div>
      ${!editing ? `
      ${draft ? `<p class="hint"><b>${esc(draft.title)}</b> — ${esc(draft.summary)}</p>` : ""}
      <div class="btn-row mt">
        <button class="btn small primary" data-tt-edit>${icon("pencil", 13)} Editar texto</button>
        ${isCustom ? `<button class="btn small ghost danger-text" data-tt-delete>${icon("trash", 13)} Eliminar tema</button>` : ""}
        ${!isCustom && over ? `<button class="btn small ghost danger-text" data-tt-restore>${icon("refresh-cw", 13)} Restaurar original</button>` : ""}
      </div>
      <p class="hint small mt">${isCustom
        ? "Este tema lo creaste tú: edítalo cuando quieras y añade párrafos, listas, notas, tablas y preguntas. El estudiante lo ve en Aprender dentro de su categoría."
        : "Adapta el título, los párrafos, las listas, las tablas y las preguntas del tema a tu curso. Los cambios se guardan automáticamente y el estudiante los ve al instante en Aprender."}</p>` : `
      <div class="tt-editor">
        <label class="field"><span>Título del tema</span>
          <input class="input" value="${esc(draft?.title ?? "")}" data-tt="title" placeholder="Título del tema"></label>
        <label class="field"><span>Resumen (visible bajo el título)</span>
          <textarea class="textarea" rows="2" data-tt="summary" placeholder="Resumen del tema…">${esc(draft?.summary ?? "")}</textarea></label>
        <p class="blk-sec">${icon("book-open", 13)} Bloques de contenido (${draft?.blocks.length ?? 0})</p>
        <div class="tt-blocks">${(draft?.blocks ?? []).map((b, i) => learnBlockEditor(b, i, draft.blocks.length)).join("")}</div>
        <div class="btn-row">
          <button class="btn tiny ghost" data-badd="p">${icon("plus", 13)} Párrafo</button>
          <button class="btn tiny ghost" data-badd="list">${icon("plus", 13)} Lista</button>
          <button class="btn tiny ghost" data-badd="note">${icon("plus", 13)} Nota</button>
          <button class="btn tiny ghost" data-badd="kv">${icon("plus", 13)} Claves</button>
        </div>
        <p class="blk-sec mt">${icon("list-checks", 13)} Preguntas del tema (${draft?.quiz.length ?? 0})</p>
        <div class="tt-blocks tt-quiz">${(draft?.quiz ?? []).map((q, i) => learnQuizEditor(q, i, draft.quiz.length)).join("") || '<p class="hint">Este tema no tiene preguntas propias.</p>'}</div>
        <button class="btn tiny ghost" data-qadd>${icon("plus", 13)} Añadir pregunta</button>
        <p class="hint small mt">Las preguntas que añadas desde el <b>Banco de preguntas</b> se muestran además al final del tema.</p>
        <div class="btn-row mt">
          <button class="btn small primary" data-tt-done>${icon("check-circle", 14)} He terminado</button>
          ${isCustom ? `<button class="btn small ghost danger-text" data-tt-delete>${icon("trash", 13)} Eliminar tema</button>` : ""}
          ${!isCustom && over ? `<button class="btn small ghost danger-text" data-tt-restore>${icon("refresh-cw", 13)} Restaurar texto original</button>` : ""}
          <span class="tt-saved" id="tt-saved">${icon("check-circle", 13)} Guardado</span>
        </div>
        <p class="hint small">${isCustom
          ? "Guardado automático: cada cambio se guarda solo y es visible al instante para el estudiante. Con «Eliminar tema» lo borras por completo."
          : "Guardado automático: cada cambio se guarda solo. «Restaurar texto original» devuelve la redacción original del programa (las fotos y las ilustraciones reemplazadas se conservan)."}</p>
      </div>`}
    </div>`;

    body.innerHTML = `
    <div class="card pad mb">
      <div class="panel-title">${icon("book-open", 15)} Contenido del módulo Aprender</div>
      <p class="hint mb">Personaliza lo que ve el estudiante en <b>Aprender Periodoncia</b>:
      <b>crea temas nuevos</b> desde cero, <b>edita el texto</b> de las lecciones (títulos, párrafos,
      listas, tablas y preguntas), <b>añade fotos</b> a cualquier tema (atlas, fotos de la clínica,
      esquemas propios…) y <b>reemplaza las ilustraciones integradas</b> del programa por tus propias
      imágenes. Todo se guarda en este navegador y se incluye en la copia de seguridad JSON
      (Ajustes → Exportar todo).</p>
      <div class="lp-manage-row">
        <select class="select" id="lp-topic">
          ${groups.map((g) => `<optgroup label="${esc(g.title)}">${g.items.map((t) =>
            `<option value="${t.id}" ${t.id === topicId ? "selected" : ""}>${esc(t.label)}</option>`).join("")}</optgroup>`).join("")}
        </select>
        <button class="btn primary" id="lp-upload">${icon("upload", 15)} Subir fotos al tema</button>
        <button class="btn outline" data-ntoggle>${creating ? icon("x", 15) : icon("file-plus", 15)} ${creating ? "Cerrar nuevo tema" : "Nuevo tema"}</button>
        ${imgs.length ? `<button class="btn outline danger-text" data-lclear="${esc(topicId)}">${icon("trash", 14)} Quitar todas (${imgs.length})</button>` : ""}
      </div>
      ${f ? `<p class="hint mt">Tema seleccionado: <b>${esc(f.cat.title)} › ${esc(f.topic.title)}</b>${Content.isCustomTopic(topicId) ? " · tema creado por ti" : ""}.</p>` : ""}
    </div>
    ${creating ? `
    <div class="card pad mb" id="nt-card">
      <div class="panel-title">${icon("file-plus", 15)} Nuevo tema de lección</div>
      <p class="hint mb">Crea un tema desde cero: elige su categoría, ponle título y resumen, y después
      escribe su contenido con el editor (párrafos, listas, notas, tablas y preguntas). El tema
      aparecerá en Aprender como uno más, junto a los del programa, y también en el progreso
      del estudiante y en el banco de preguntas.</p>
      <div class="grid-2">
        <label class="field"><span>Categoría</span>
          <select class="select" id="nt-cat">${LEARN_CATEGORIES.map((c) => `<option value="${c.id}">${esc(c.title)}</option>`).join("")}</select></label>
        <label class="field"><span>Título del tema *</span>
          <input class="input" id="nt-title" placeholder="P. ej. Mantenimiento periodontal" maxlength="80"></label>
      </div>
      <label class="field"><span>Resumen (visible bajo el título)</span>
        <input class="input" id="nt-summary" placeholder="Una línea que resuma qué aprenderá el estudiante" maxlength="160"></label>
      <div class="btn-row mt">
        <button class="btn small primary" id="nt-save">${icon("plus", 14)} Crear tema</button>
        <button class="btn small ghost" data-nt-cancel>Cancelar</button>
      </div>
    </div>` : ""}
    ${textCard}
    ${imgs.length === 0 ? `
    <div class="card pad dashed"><p class="hint">Este tema aún no tiene fotos añadidas. Sube imágenes JPG o PNG:
    se optimizan automáticamente (máx. 1400 px) y aparecen de inmediato para el estudiante.</p></div>` : `
    <div class="radio-grid">
      ${imgs.map((im) => `
      <div class="card radio-card">
        <div class="radio-thumb" data-lview="${esc(topicId)}::${esc(im.id)}"><img src="${im.src}" alt="" loading="lazy"></div>
        <input class="input" value="${esc(im.caption || "")}" data-lcap="${esc(topicId)}::${esc(im.id)}"
          placeholder="Pie de foto: qué debe observar el estudiante">
        <div class="btn-row">
          <button class="btn small outline" data-lview="${esc(topicId)}::${esc(im.id)}">${icon("eye", 13)} Ver</button>
          <button class="btn small ghost danger-text" data-ldel="${esc(topicId)}::${esc(im.id)}">${icon("trash", 13)}</button>
        </div>
      </div>`).join("")}
    </div>`}
    <div class="card pad mt">
      <div class="panel-title">${icon("brush", 15)} Ilustraciones del tema</div>
      ${diags.length ? `
      <p class="hint mb">Este tema incluye ${diags.length === 1 ? "una ilustración didáctica" : `${diags.length} ilustraciones didácticas`} del programa.
      Reemplázala${diags.length === 1 ? "" : "s"} por tus propias imágenes (fotos clínicas, esquemas, diapositivas…)
      y el estudiante verá tu imagen en lugar del dibujo original. Siempre puedes restaurar el original.</p>
      <div class="dia-grid">
        ${diags.map((b, i) => {
          const ov = Content.diagramOverride(topicId, b.id);
          const key = `${esc(topicId)}::${esc(b.id)}`;
          return `
          <div class="card dia-card ${ov ? "replaced" : ""}">
            <div class="dia-thumb" ${ov ? `data-dview="${key}" title="Ampliar tu imagen"` : ""}>
              ${ov ? `<img src="${ov.src}" alt="" loading="lazy">` : DIAGRAMS[b.id]()}
            </div>
            <div class="dia-badges">
              <span class="dia-badge ${ov ? "own" : ""}">${ov ? "Tu imagen" : "Original del programa"}</span>
              <span class="dia-badge muted">${i + 1}/${diags.length}</span>
            </div>
            ${ov ? `
            <input class="input" value="${esc(ov.caption || "")}" data-dcap="${key}"
              placeholder="Pie de foto (opcional): qué debe observar el estudiante">
            <p class="hint dia-orig">Pie original: ${esc(b.caption || "—")}</p>
            <div class="btn-row">
              <button class="btn small primary" data-drep="${key}">${icon("refresh-cw", 13)} Cambiar imagen</button>
              <button class="btn small outline" data-dview="${key}">${icon("eye", 13)} Ver</button>
              <button class="btn small ghost danger-text" data-drestore="${key}">${icon("trash", 13)} Restaurar</button>
            </div>` : `
            <p class="hint dia-orig">${esc(b.caption || "")}</p>
            <div class="btn-row">
              <button class="btn small primary" data-drep="${key}">${icon("upload", 13)} Reemplazar por mi imagen</button>
            </div>`}
          </div>`;
        }).join("")}
      </div>` : `
      <p class="hint">El tema seleccionado no incluye ilustraciones integradas del programa; solo los temas
      marcados abajo las traen. Puedes saltar a cualquiera con un toque:</p>
      <div class="btn-row mt">
        ${topicsWithDiags.map((raw) => { const t = applyTopicOverride(raw); return `<button class="btn small ghost ${t.id === topicId ? "current" : ""}" data-ltopic="${esc(t.id)}">${icon("brush", 13)} ${esc(t.title)}</button>`; }).join("")}
      </div>`}
    </div>
    ${customs.length || withImages.length || withOverrides.length || withText.length ? `
    <div class="card pad mt">
      ${customs.length ? `
      <p class="hint"><b>Temas creados por ti (${customs.length}):</b></p>
      <div class="btn-row mt">
        ${customs.map((k) => {
          const t = findTopic(k.id);
          return t ? `<button class="btn small ghost ${k.id === topicId ? "current" : ""}" data-ltopic="${esc(k.id)}">${icon("file-plus", 13)} ${esc(t.topic.title)}</button>` : "";
        }).join("")}
      </div>` : ""}
      ${withText.length ? `
      <p class="hint ${customs.length ? "mt" : ""}"><b>Temas con texto editado:</b></p>
      <div class="btn-row mt">
        ${withText.map((k) => {
          const t = findTopic(k);
          return t ? `<button class="btn small ghost" data-ltopic="${esc(k)}">${icon("pencil", 13)} ${esc(t.topic.title)}</button>` : "";
        }).join("")}
      </div>` : ""}
      ${withImages.length ? `
      <p class="hint ${withText.length ? "mt" : ""}"><b>Temas con fotos del docente:</b></p>
      <div class="btn-row mt">
        ${withImages.map((k) => {
          const t = findTopic(k);
          return t ? `<button class="btn small ghost" data-ltopic="${esc(k)}">${icon("image", 13)} ${esc(t.topic.title)} (${Content.learnImagesFor(k).length})</button>` : "";
        }).join("")}
      </div>` : ""}
      ${withOverrides.length ? `
      <p class="hint ${withText.length || withImages.length ? "mt" : ""}"><b>Temas con ilustraciones reemplazadas:</b></p>
      <div class="btn-row mt">
        ${withOverrides.map((k) => {
          const t = findTopic(k);
          return t ? `<button class="btn small ghost" data-ltopic="${esc(k)}">${icon("brush", 13)} ${esc(t.topic.title)}</button>` : "";
        }).join("")}
      </div>` : ""}
    </div>` : ""}`;
    $("#lp-topic", body).addEventListener("change", (e) => { flushSave(); topicId = e.target.value; paint(); });
  };
  paint();
}

/* ------------------------------- Desafíos --------------------------------- */

function teacherChallengesTab(body, repaint) {
  let draft = {
    title: "", order: 6, type: "depth-target", description: "",
    instructions: ["Arrastra la sonda al margen e inserta la punta.", "Pulsa Registrar medición al alcanzar el objetivo."],
    conditionId: "gingivitis", targetSite: "any", targetDepth: 3, tolerance: 0.5, parTimeSec: 60,
  };
  // Listener delegado UNA sola vez por invocación de la pestaña
  body.addEventListener("click", (e) => {
    const d = e.target.closest("[data-delch]");
    if (d && confirm("¿Eliminar este desafío?")) { Content.removeChallenge(d.dataset.delch); paint(); }
  });
  const paint = () => {
    body.innerHTML = `
    <div class="challenge-editor-layout">
      <div class="card pad">
        <h3 class="card-title">Crear desafío de sondaje objetivo</h3>
        <label class="field"><span>Título</span><input class="input" id="chf-title" placeholder="Desafío personalizado · Sondaje de 4 mm"></label>
        <label class="field"><span>Descripción / consigna</span><textarea class="textarea" id="chf-desc" rows="2" placeholder="Detén la punta exactamente a 4 mm…"></textarea></label>
        <div class="grid-3">
          <label class="field"><span>Condición</span>
            <select class="select" id="chf-cond">${PERIO_CONDITIONS.map((c) => `<option value="${c.id}">${esc(c.label)}</option>`).join("")}</select></label>
          <label class="field"><span>Sitio objetivo</span>
            <select class="select" id="chf-site"><option value="any">Cualquiera</option>${SITES.map((s) => `<option value="${s.id}">${esc(s.label)}</option>`).join("")}</select></label>
          <label class="field"><span>Orden</span><input class="input num" id="chf-order" type="number" min="6" max="99" value="6"></label>
          <label class="field"><span>Profundidad objetivo (mm)</span><input class="input num" id="chf-depth" type="number" min="1" max="10" step="0.5" value="3"></label>
          <label class="field"><span>Tolerancia (± mm)</span><input class="input num" id="chf-tol" type="number" min="0.2" max="2" step="0.1" value="0.5"></label>
          <label class="field"><span>Tiempo par (s)</span><input class="input num" id="chf-time" type="number" min="30" max="600" step="10" value="60"></label>
        </div>
        <button class="btn primary block mt" id="chf-save">${icon("plus", 15)} Guardar desafío</button>
        <p class="hint mt">El desafío aparecerá de inmediato en el módulo Práctica del estudiante.</p>
      </div>
      <div>
        ${Content.challenges.map((c) => `
        <div class="card pad mb row-between">
          <div><p class="strong">${esc(c.title)}</p>
            <p class="hint">${c.targetDepth} ± ${c.tolerance} mm · ${esc(conditionById(c.conditionId).label)}${c.targetSite && c.targetSite !== "any" ? " · " + siteById(c.targetSite).short : ""}</p></div>
          <button class="btn small ghost danger-text" data-delch="${c.id}">${icon("trash", 14)}</button>
        </div>`).join("")}
        <div class="card pad dashed"><p class="hint">Desafíos integrados disponibles: ${BUILTIN_CHALLENGES.length}
        (sondaje de 3 mm, bolsa de 5 mm, registro de sangrado, seis sitios e interpretación).
        Los desafíos creados aquí se mezclan con ellos en el módulo Práctica.</p></div>
      </div>
    </div>`;
    $("#chf-save", body).addEventListener("click", () => {
      const title = $("#chf-title", body).value.trim();
      if (!title) { alert("Ponle un título al desafío."); return; }
      Content.upsertChallenge({
        id: `ch-${Date.now().toString(36)}`,
        title,
        order: +$("#chf-order", body).value || 6,
        type: "depth-target",
        description: $("#chf-desc", body).value.trim(),
        instructions: draft.instructions,
        conditionId: $("#chf-cond", body).value,
        targetSite: $("#chf-site", body).value,
        targetDepth: +$("#chf-depth", body).value,
        tolerance: +$("#chf-tol", body).value,
        parTimeSec: +$("#chf-time", body).value,
        builtin: false,
      });
      toast({ title: "Desafío guardado", description: title });
      paint();
    });
  };
  paint();
}

/* --------------------------- Banco de preguntas ---------------------------- */

function teacherQuestionsTab(body, repaint) {
  // Listener delegado UNA sola vez por invocación de la pestaña
  body.addEventListener("click", (e) => {
    const d = e.target.closest("[data-delq]");
    if (d) { Content.removeQuestion(d.dataset.delq); paint(); }
  });
  const paint = () => {
    const topicOpts = [];
    for (const c of learnCategories()) for (const raw of c.topics) topicOpts.push({ id: raw.id, label: `${c.title} › ${applyTopicOverride(raw).title}` });
    body.innerHTML = `
    <div class="question-editor-layout">
      <div class="card pad">
        <h3 class="card-title">Añadir pregunta a un tema</h3>
        <label class="field"><span>Tema</span>
          <select class="select" id="q-topic">${topicOpts.map((t) => `<option value="${t.id}">${esc(t.label)}</option>`).join("")}</select></label>
        <label class="field"><span>Enunciado</span><textarea class="textarea" id="q-prompt" rows="2"></textarea></label>
        <div class="grid-2" id="q-opts">
          ${[0, 1, 2, 3].map((i) => `
          <label class="qopt"><input type="radio" name="qcorrect" ${i === 0 ? "checked" : ""} title="Opción correcta">
            <input class="input" placeholder="Opción ${i + 1}"></label>`).join("")}
        </div>
        <label class="field"><span>Explicación</span><textarea class="textarea" id="q-expl" rows="2"></textarea></label>
        <button class="btn primary block mt" id="q-save">${icon("plus", 15)} Añadir al banco</button>
      </div>
      <div>
        ${Content.questions.length === 0 ? `
        <div class="card pad dashed"><p class="hint">Las preguntas que añadas aquí se muestran al final
        del tema elegido en el módulo Aprender Periodoncia.</p></div>` :
        Content.questions.map((x) => `
        <div class="card pad mb row-between-top">
          <div><p class="strong">${esc(x.prompt)}</p>
            <p class="ok-text">Correcta: ${esc(x.options[x.correct])}</p>
            <p class="hint">Tema: ${esc(x.id.split("-extra-")[0])}</p></div>
          <button class="btn small ghost danger-text" data-delq="${x.id}">${icon("trash", 14)}</button>
        </div>`).join("")}
      </div>
    </div>`;
    $("#q-save", body).addEventListener("click", () => {
      const prompt = $("#q-prompt", body).value.trim();
      const opts = $$("#q-opts input.input", body).map((i) => i.value.trim());
      if (!prompt || opts.some((o) => !o)) { alert("Completa el enunciado y las cuatro opciones."); return; }
      let correct = 0;
      $$("#q-opts input[type=radio]", body).forEach((r, i) => { if (r.checked) correct = i; });
      const topicId = $("#q-topic", body).value;
      Content.addQuestion({
        id: `${topicId}-extra-${Date.now().toString(36)}`,
        prompt, options: opts, correct,
        explanation: $("#q-expl", body).value.trim(),
      });
      toast({ title: "Pregunta añadida al banco", description: topicOpts.find((t) => t.id === topicId).label });
      paint();
    });
  };
  paint();
}

/* ------------------------------- Resultados ------------------------------- */

function teacherResultsTab(body) {
  const s = Student.data;
  const stats = computeStats(s);
  const rows = [...s.measurements].reverse().slice(0, 40).map((m) => `
    <tr>
      <td class="hint">${new Date(m.at).toLocaleString("es", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</td>
      <td>${siteById(m.site)?.short || m.site}</td>
      <td class="num">${m.measured.toFixed(1)}</td>
      <td class="num muted">${m.actual.toFixed(1)}</td>
      <td class="num ${Math.abs(m.error) > 1 ? "danger-text strong" : ""}">${m.error > 0 ? "+" : ""}${m.error.toFixed(1)}</td>
      <td class="hint">${esc(conditionById(m.conditionId).label)}</td>
    </tr>`).join("");
  body.innerHTML = `
  ${Accounts.count() ? `<div class="card pad mb"><p class="hint">${icon("info", 13)} Estos datos corresponden al <b>perfil con sesión iniciada en este navegador</b> (invitado o cuenta). Para consultar el progreso de cada estudiante con cuenta, usa la pestaña <b>Estudiantes</b>.</p></div>` : ""}
  <div class="stat-grid">
    <div class="card stat-card"><div class="sum-label">Mediciones de sondaje</div><p class="sum-value">${s.measurements.length}</p></div>
    <div class="card stat-card"><div class="sum-label">MAE (error medio)</div><p class="sum-value">${stats.mae !== null ? "± " + stats.mae.toFixed(2) + " mm" : "—"}</p></div>
    <div class="card stat-card"><div class="sum-label">Sesiones totales</div><p class="sum-value">${s.sessions.length}</p></div>
    <div class="card stat-card"><div class="sum-label">Tiempo de práctica</div><p class="sum-value">${Math.round(stats.practiceSeconds / 60)} min</p></div>
  </div>
  <div class="card pad">
    <h3 class="card-title">Últimas mediciones del estudiante</h3>
    <div class="table-wrap scroll"><table class="table">
      <thead><tr><th>Fecha</th><th>Sitio</th><th>Medido</th><th>Real</th><th>Error</th><th>Condición</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="6" class="center muted">Sin mediciones registradas.</td></tr>'}</tbody>
    </table></div>
  </div>
  <div class="card pad">
    <h3 class="card-title">Resultados de casos clínicos</h3>
    ${s.caseResults.length ? `<div class="badge-row">${s.caseResults.map((r) => {
      const c = allCases().find((x) => x.id === r.caseId);
      return `<span class="badge outline">${esc(c ? c.title : r.caseId)}: ${r.score}/${r.maxScore}</span>`;
    }).join("")}</div>` : '<p class="hint">Sin casos resueltos.</p>'}
  </div>`;
}

/* -------------------------------- Progreso -------------------------------- */

function teacherProgressTab(body) {
  const s = Student.data;
  const read = s.readTopics;
  const errorLabels = {
    "sobrepaso-fondo": "Presión excesiva",
    "sitio-incorrecto": "Sitio/profundidad incorrectos",
    "valor-impreciso": "Medición imprecisa",
    "sin-registro-bop": "BOP no registrado",
  };
  body.innerHTML = `
  ${Accounts.count() ? `<div class="card pad mb"><p class="hint">${icon("info", 13)} Vista del <b>perfil con sesión iniciada en este navegador</b>. El progreso individual de cada cuenta está en la pestaña <b>Estudiantes</b>.</p></div>` : ""}
  <div class="two-col">
    <div class="card pad">
      <h3 class="card-title">Dominio por tema</h3>
      ${learnCategories().map((c) => `
      <div class="mb">
        <p class="strong small">${esc(c.title)}</p>
        <div class="badge-row">${c.topics.map((raw) =>
          `<span class="badge ${read.includes(raw.id) ? "" : "subtle off"}">${esc(applyTopicOverride(raw).title)}${Content.isCustomTopic(raw.id) ? " · propio" : ""}</span>`).join("")}</div>
      </div>`).join("")}
    </div>
    <div class="card pad">
      <h3 class="card-title">${icon("alert-triangle", 15)} Errores frecuentes del estudiante</h3>
      ${Object.keys(s.errorCounts).length === 0 ? '<p class="hint">Sin errores registrados.</p>' : `
      <div>${Object.entries(s.errorCounts).sort((a, b) => b[1] - a[1]).map(([k, v]) => `
        <div class="err-row"><span>${esc(errorLabels[k] ?? k)}</span><span class="badge danger">${v}</span></div>`).join("")}</div>`}
      <p class="hint mt">Estos indicadores orientan la retroalimentación docente: presión excesiva sugiere
      reforzar la técnica de inserción; sitio incorrecto, la sistematización del sondaje;
      medición imprecisa, la lectura de la escala.</p>
    </div>
  </div>`;
}

/* -------------------------------- Ajustes --------------------------------- */

function teacherSettingsTab(body) {
  body.innerHTML = `
  <div class="two-col">
    <div class="card pad">
      <h3 class="card-title">${icon("key", 15)} Código de acceso docente</h3>
      <p class="hint mb">Código que los docentes deben introducir para entrar a este panel.</p>
      <label class="field"><span>Nuevo código</span>
        <input class="input" id="set-code" type="text" value="${esc(Settings.data.teacherCode)}"></label>
      <button class="btn primary mt" id="set-save">${icon("save", 15)} Guardar código</button>
    </div>
    <div class="card pad">
      <h3 class="card-title">${icon("download", 15)} Copia de seguridad del contenido</h3>
      <p class="hint mb">Exporta casos, desafíos, temas creados, textos editados de Aprender, fotos,
      ilustraciones reemplazadas, banco de radiografías y cuentas de estudiantes (con sus
      contraseñas cifradas) como JSON. Importar reemplaza los elementos con el mismo
      identificador.</p>
      <div class="btn-row">
        <button class="btn outline" id="set-export">${icon("download", 15)} Exportar todo</button>
        <button class="btn outline" id="set-import">${icon("upload", 15)} Importar JSON</button>
      </div>
    </div>
    <div class="card pad">
      <h3 class="card-title">${icon("log-out", 15)} Sesión docente</h3>
      <p class="hint mb">Cierra la sesión docente en este navegador. Los estudiantes seguirán
      usando la plataforma con su propio perfil.</p>
      <button class="btn danger" id="set-logout">${icon("log-out", 15)} Salir del modo docente</button>
    </div>
    <div class="card pad">
      <h3 class="card-title">${icon("refresh-cw", 15)} Datos del estudiante</h3>
      <p class="hint mb">Borra el progreso del estudiante en este navegador (mediciones, resultados,
      lecturas y periodontograma). No afecta al contenido del docente.</p>
      <button class="btn outline" id="set-resetstudent">Reiniciar progreso del estudiante</button>
    </div>
  </div>`;
  $("#set-save", body).addEventListener("click", () => {
    const v = $("#set-code", body).value.trim();
    if (!v) { alert("El código no puede quedar vacío."); return; }
    Settings.setTeacherCode(v);
    toast({ title: "Código actualizado" });
  });
  $("#set-export", body).addEventListener("click", () => {
    const blob = new Blob([Content.exportAll()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "ar-perio-contenido.json"; a.click();
    URL.revokeObjectURL(url);
  });
  $("#set-import", body).addEventListener("click", () => {
    const input = document.createElement("input");
    input.type = "file"; input.accept = "application/json";
    input.onchange = async () => {
      const f = input.files?.[0];
      if (!f) return;
      try {
        const data = JSON.parse(await f.text());
        Content.importAll({ cases: data.cases, challenges: data.challenges, radiographs: data.radiographs, learnImages: data.learnImages, diagramOverrides: data.diagramOverrides, topicOverrides: data.topicOverrides, customTopics: data.customTopics, studentAccounts: data.studentAccounts });
        toast({ title: "Contenido importado" });
      } catch { toast({ title: "Error al importar", description: "Archivo no válido.", variant: "destructive" }); }
    };
    input.click();
  });
  $("#set-logout", body).addEventListener("click", () => {
    Student.endSession();
    Session.logout();
    toast({ title: "Sesión docente cerrada" });
    App.setModule("home");
    maybeShowLoginGate();
  });
  $("#set-resetstudent", body).addEventListener("click", () => {
    if (confirm("¿Reiniciar TODO el progreso del perfil actual de este navegador?")) {
      Student.resetProgress();
      Perio.data.records = {};
      Perio.save();
      toast({ title: "Progreso del perfil reiniciado" });
    }
  });
}

/* ------------------------------ Estudiantes -------------------------------- */

/** Inicial para el avatar de la cuenta. */
function accInitial(acc) {
  return (acc.name || acc.username || "?").trim().charAt(0).toUpperCase() || "?";
}

/** Fecha corta en español. */
function accDate(ts) {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString("es", { day: "2-digit", month: "short", year: "numeric" });
}

function teacherStudentsTab(body, repaint) {
  // Listeners delegados UNA sola vez por invocación de la pestaña
  body.addEventListener("click", (e) => {
    const gen = e.target.closest("#acc-gen");
    if (gen) {
      const words = ["sonda", "margen", "bolsa", "furca", "esmalte", "hueso", "calculo", "cepillo", "collageno", "recesion"];
      $("#acc-pass", body).value = words[Math.floor(Math.random() * words.length)] + (10 + Math.floor(Math.random() * 90));
      return;
    }
    const det = e.target.closest("[data-detail]");
    if (det) {
      const acc = Accounts.byId(det.dataset.detail);
      if (acc) openAccDetailModal(acc);
      return;
    }
    const pw = e.target.closest("[data-pass]");
    if (pw) {
      const acc = Accounts.byId(pw.dataset.pass);
      if (acc) openAccPasswordModal(body, acc, paint);
      return;
    }
    const del = e.target.closest("[data-delacc]");
    if (del) {
      const acc = Accounts.byId(del.dataset.delacc);
      if (!acc) return;
      if (confirm(`¿Eliminar la cuenta de «${acc.name}» (@${acc.username})?\n\nSe borrará también todo su progreso en este navegador. Esta acción no se puede deshacer.`)) {
        Accounts.remove(acc.id);
        toast({ title: "Cuenta eliminada", description: `Se ha borrado el progreso de ${acc.name}.` });
        paint();
      }
    }
  });
  body.addEventListener("submit", async (e) => {
    const f = e.target.closest("#acc-form");
    if (!f || e.type !== "submit") return;
    e.preventDefault();
    const r = await Accounts.add({
      name: $("#acc-name", body).value,
      username: $("#acc-user", body).value,
      password: $("#acc-pass", body).value,
    });
    if (r.error) { $("#acc-error", body).textContent = r.error; return; }
    toast({ title: "Cuenta creada", description: `${r.acc.name} puede entrar con «${r.acc.username}» y su contraseña.` });
    paint();
  });

  const paint = () => {
    const list = Accounts.all();
    body.innerHTML = `
    <div class="two-col">
      <div>
        <div class="card pad mb">
          <h3 class="card-title">${icon("user-plus", 15)} Crear cuenta de estudiante</h3>
          <p class="hint mb">Crea un usuario y una contraseña para cada estudiante. Al entrar con su
          cuenta, su progreso (mediciones, quizzes, lecturas y periodontograma) queda separado
          del resto de perfiles de este navegador.</p>
          <form id="acc-form">
            <label class="field"><span>Nombre completo</span>
              <input class="input" id="acc-name" placeholder="p. ej. Ana Torres" maxlength="60"></label>
            <label class="field"><span>Usuario</span>
              <input class="input" id="acc-user" placeholder="letras, números, . _ -" autocomplete="off" autocapitalize="none" spellcheck="false" maxlength="20"></label>
            <label class="field"><span>Contraseña</span>
              <span class="acc-pass-row">
                <input class="input" id="acc-pass" autocomplete="off" placeholder="mínimo 4 caracteres" maxlength="40">
                <button type="button" class="btn small outline" id="acc-gen" title="Generar una contraseña sencilla">${icon("refresh-cw", 13)} Generar</button>
              </span></label>
            <p class="tl-error" id="acc-error"></p>
            <button class="btn primary block" type="submit">${icon("user-plus", 15)} Crear cuenta</button>
          </form>
        </div>
        <div class="card pad">
          <h3 class="card-title">${icon("shield", 15)} Acceso a la plataforma</h3>
          <div class="acc-toggle-row">
            <div>
              <p class="strong small">Exigir iniciar sesión con cuenta</p>
              <p class="hint">Si lo activas, la app pedirá usuario y contraseña al abrirla y no
              ofrecerá el modo invitado (el acceso docente por código sigue disponible).</p>
            </div>
            <span id="acc-req-host"></span>
          </div>
          <p class="hint mt">Con cuentas creadas y la opción desactivada, los estudiantes pueden
          elegir entre entrar con su cuenta o continuar como invitados.</p>
        </div>
      </div>
      <div>
        ${list.length === 0 ? `
        <div class="card pad dashed"><p class="hint">Todavía no hay cuentas de estudiantes. Crea la primera
        con el formulario de la izquierda: define un nombre, un usuario y una contraseña, y el
        estudiante podrá iniciar sesión desde la pantalla de acceso.</p></div>` : `
        <div class="card pad mb">
          <h3 class="card-title">${icon("users", 15)} Cuentas del curso (${list.length})</h3>
          <div class="acc-list">
            ${list.map((a) => {
              const s = readStudentData(a.id);
              const st = computeStats(s);
              const total = learnCategories().reduce((n, c) => n + c.topics.length, 0);
              return `
              <div class="acc-card">
                <div class="acc-main">
                  <div class="acc-avatar">${esc(accInitial(a))}</div>
                  <div class="acc-info">
                    <div class="acc-name-line"><b>${esc(a.name)}</b><span class="hint">@${esc(a.username)}</span></div>
                    <p class="hint acc-meta">Creada el ${accDate(a.at)} · Último acceso: ${a.lastLogin ? accDate(a.lastLogin) : "nunca"}</p>
                    <div class="badge-row">
                      <span class="badge subtle">${icon("book-open", 12)} Temas ${s.readTopics.length}/${total}</span>
                      <span class="badge subtle">${icon("list-checks", 12)} Quizzes ${s.quizResults.length}${st.quizAcc !== null ? " · " + Math.round(st.quizAcc * 100) + "%" : ""}</span>
                      <span class="badge subtle">${icon("crosshair", 12)} Mediciones ${s.measurements.length}${st.mae !== null ? " · ±" + st.mae.toFixed(1) + " mm" : ""}</span>
                      ${st.chartTries ? `<span class="badge subtle">${icon("clipboard-list", 12)} Periodonto. ${st.chartTries}${st.chartBest !== null ? " · mejor " + st.chartBest : ""}</span>` : ""}
                      <span class="badge subtle">${icon("clock", 12)} ${fmtTime(st.practiceSeconds)}</span>
                    </div>
                  </div>
                </div>
                <div class="btn-row">
                  <button class="btn small outline" data-detail="${a.id}">${icon("line-chart", 13)} Ver progreso</button>
                  <button class="btn small outline" data-pass="${a.id}">${icon("key", 13)} Contraseña</button>
                  <button class="btn small ghost danger-text" data-delacc="${a.id}" title="Eliminar cuenta">${icon("trash", 13)}</button>
                </div>
              </div>`;}).join("")}
          </div>
        </div>
        <div class="card pad"><p class="hint">${icon("info", 13)} Las cuentas viven en <b>este navegador</b>
        (almacenamiento local): cada equipo del aula mantiene sus propias cuentas. Las contraseñas
        se guardan cifradas y viajan en la copia de seguridad JSON por si migras de equipo.</p></div>`}
      </div>
    </div>`;
    // Interruptor «exigir login» (elemento DOM, se re-inserta en cada paint)
    $("#acc-req-host", body)?.appendChild(switchEl(!!Accounts.data.requireLogin, (v) => {
      Accounts.setRequireLogin(v);
      toast({ title: v ? "Inicio de sesión obligatorio" : "Modo invitado permitido", description: v ? "Los estudiantes deberán entrar con su cuenta." : "Los estudiantes podrán entrar sin cuenta." });
    }));
    $("#acc-name", body)?.focus();
  };
  paint();
}

/** Modal: cambiar la contraseña de una cuenta. */
function openAccPasswordModal(body, acc, onDone) {
  const o = openModal(`<div class="pad-modal">
    <h3 class="card-title">${icon("key", 15)} Contraseña de ${esc(acc.name)}</h3>
    <p class="hint mb">Usuario: <b>@${esc(acc.username)}</b>. La nueva contraseña sustituirá a la
    anterior; el estudiante la usará la próxima vez que entre.</p>
    <form id="pw-form">
      <label class="field"><span>Nueva contraseña</span>
        <input class="input" id="pw-new" autocomplete="off" maxlength="40"></label>
      <label class="field"><span>Repite la contraseña</span>
        <input class="input" id="pw-rep" autocomplete="off" maxlength="40"></label>
      <p class="tl-error" id="pw-error"></p>
      <button class="btn primary block" type="submit">${icon("save", 15)} Guardar contraseña</button>
    </form>
  </div>`);
  $("#pw-form", o).addEventListener("submit", async (e) => {
    e.preventDefault();
    const v = $("#pw-new", o).value;
    if (v !== $("#pw-rep", o).value) { $("#pw-error", o).textContent = "Las contraseñas no coinciden."; return; }
    const r = await Accounts.setPassword(acc.id, v);
    if (r.error) { $("#pw-error", o).textContent = r.error; return; }
    o.close();
    toast({ title: "Contraseña actualizada", description: `Cuenta de ${acc.name}.` });
    if (onDone) onDone();
  });
  $("#pw-new", o).focus();
}

/** Modal: progreso detallado de la cuenta de un estudiante. */
function openAccDetailModal(acc) {
  const s = readStudentData(acc.id);
  const st = computeStats(s);
  const total = learnCategories().reduce((n, c) => n + c.topics.length, 0);
  const rows = [...s.measurements].reverse().slice(0, 10).map((m) => `
    <tr>
      <td class="hint">${new Date(m.at).toLocaleString("es", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</td>
      <td>${siteById(m.site)?.short || m.site}</td>
      <td class="num">${m.measured.toFixed(1)}</td>
      <td class="num muted">${m.actual.toFixed(1)}</td>
      <td class="num ${Math.abs(m.error) > 1 ? "danger-text strong" : ""}">${m.error > 0 ? "+" : ""}${m.error.toFixed(1)}</td>
    </tr>`).join("");
  const errorLabels = {
    "sobrepaso-fondo": "Presión excesiva",
    "sitio-incorrecto": "Sitio/profundidad incorrectos",
    "valor-impreciso": "Medición imprecisa",
    "sin-registro-bop": "BOP no registrado",
  };
  openModal(`
  <div class="pad-modal">
    <div class="acc-detail-head">
      <div class="acc-avatar big">${esc(accInitial(acc))}</div>
      <div>
        <h3 class="card-title">${esc(acc.name)}</h3>
        <p class="hint">@${esc(acc.username)} · Creada el ${accDate(acc.at)} ·
        Último acceso: ${acc.lastLogin ? accDate(acc.lastLogin) : "nunca"}</p>
      </div>
    </div>
    <div class="stat-grid acc-detail-stats">
      <div class="card stat-card"><div class="sum-label">Temas leídos</div><p class="sum-value">${s.readTopics.length}/${total}</p></div>
      <div class="card stat-card"><div class="sum-label">Quizzes</div><p class="sum-value">${s.quizResults.length}${st.quizAcc !== null ? `<span class="sum-sub">${Math.round(st.quizAcc * 100)}%</span>` : ""}</p></div>
      <div class="card stat-card"><div class="sum-label">Mediciones</div><p class="sum-value">${s.measurements.length}</p></div>
      <div class="card stat-card"><div class="sum-label">Llenado perio.</div><p class="sum-value">${st.chartTries || "—"}${st.chartBest !== null ? `<span class="sum-sub">mejor ${st.chartBest}/100</span>` : ""}</p></div>
      <div class="card stat-card"><div class="sum-label">MAE</div><p class="sum-value">${st.mae !== null ? "± " + st.mae.toFixed(2) + " mm" : "—"}</p></div>
      <div class="card stat-card"><div class="sum-label">Sesiones</div><p class="sum-value">${s.sessions.length}</p></div>
      <div class="card stat-card"><div class="sum-label">Tiempo práctica</div><p class="sum-value">${fmtTime(st.practiceSeconds)}</p></div>
    </div>
    <div class="two-col">
      <div class="card pad">
        <h3 class="card-title">Dominio por tema</h3>
        ${learnCategories().map((c) => `
        <div class="mb">
          <p class="strong small">${esc(c.title)}</p>
          <div class="badge-row">${c.topics.map((raw) =>
            `<span class="badge ${s.readTopics.includes(raw.id) ? "" : "subtle off"}">${esc(applyTopicOverride(raw).title)}${Content.isCustomTopic(raw.id) ? " · propio" : ""}</span>`).join("")}</div>
        </div>`).join("")}
      </div>
      <div class="card pad">
        <h3 class="card-title">${icon("alert-triangle", 15)} Errores frecuentes</h3>
        ${Object.keys(s.errorCounts).length === 0 ? '<p class="hint">Sin errores registrados.</p>' : `
        <div>${Object.entries(s.errorCounts).sort((a, b) => b[1] - a[1]).map(([k, v]) => `
          <div class="err-row"><span>${esc(errorLabels[k] ?? k)}</span><span class="badge danger">${v}</span></div>`).join("")}</div>`}
        <h3 class="card-title mt">Últimas mediciones</h3>
        <div class="table-wrap scroll"><table class="table">
          <thead><tr><th>Fecha</th><th>Sitio</th><th>Medido</th><th>Real</th><th>Error</th></tr></thead>
          <tbody>${rows || '<tr><td colspan="5" class="center muted">Sin mediciones registradas.</td></tr>'}</tbody>
        </table></div>
      </div>
    </div>
  </div>`, { wide: true });
}
