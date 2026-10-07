/* AR PERIO — views/learn.js · Módulo 1: teoría interactiva con quizzes. */

/** Bloque de quiz (una respuesta, retroalimentación inmediata). */
function QuizBlock(parent, q, index, categoryId, topicId) {
  const wrap = html(`<div class="quiz-block" data-qid="${esc(q.id)}">
    <p class="quiz-prompt"><span class="muted">${index}.</span> ${mdInline(q.prompt)}</p>
    <div class="quiz-options"></div>
    <div class="quiz-feedback"></div>
  </div>`);
  const opts = $(".quiz-options", wrap);
  let answered = false;
  opts.innerHTML = q.options.map((opt, i) => `
    <button class="quiz-opt" data-i="${i}">
      <span class="qo-radio"></span><span>${esc(opt)}</span>
    </button>`).join("");
  opts.addEventListener("click", (e) => {
    const b = e.target.closest(".quiz-opt");
    if (!b || answered) return;
    answered = true;
    const idx = +b.dataset.i;
    const correct = idx === q.correct;
    Student.saveQuizResult({ topicId, categoryId, correct: correct ? 1 : 0, total: 1, at: Date.now() });
    $$(".quiz-opt", opts).forEach((el, i) => {
      el.disabled = true;
      if (i === q.correct) el.classList.add("correct");
      if (i === idx && i !== q.correct) el.classList.add("wrong");
    });
    $(".quiz-feedback", wrap).innerHTML =
      `<p class="${correct ? "ok" : "bad"}"><b>${correct ? "Correcto." : "Revisa:"}</b> ${esc(q.explanation)}</p>`;
  });
  parent.appendChild(wrap);
}

/** Renderiza un bloque de contenido educativo.
 * topicId permite resolver ilustraciones reemplazadas por el docente. */
function learnBlock(b, topicId) {
  switch (b.type) {
    case "p":
      return `<p class="learn-p">${mdInline(b.text)}</p>`;
    case "list": {
      const items = b.items.map((it) => `<li>${mdInline(it)}</li>`).join("");
      return b.ordered ? `<ol class="learn-list">${items}</ol>` : `<ul class="learn-list">${items}</ul>`;
    }
    case "table":
      return `<div class="table-wrap"><table class="table"><thead><tr>${b.headers.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead>
        <tbody>${b.rows.map((r) => `<tr>${r.map((c) => `<td>${mdInline(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
    case "note": {
      const tone = b.tone === "warn" ? "warn" : b.tone === "clinical" ? "clinical" : "tip";
      return `<div class="learn-note ${tone}">${mdInline(b.text)}</div>`;
    }
    case "diagram": {
      // Ilustración reemplazada por el docente: se muestra su imagen en lugar del SVG
      const ov = topicId ? Content.diagramOverride(topicId, b.id) : null;
      if (ov && ov.src) {
        const caption = (ov.caption ?? "") !== "" ? ov.caption : b.caption;
        return `<figure class="learn-diagram learn-diagram-custom" data-diaview="${esc(b.id)}" title="Ampliar imagen">
          <div class="dia-imgwrap"><img src="${ov.src}" alt="${esc(caption || b.id)}" loading="lazy"></div>
          ${caption ? `<figcaption>${esc(caption)} <span class="dia-by">· imagen del docente</span></figcaption>` : ""}
        </figure>`;
      }
      return `<figure class="learn-diagram">${(DIAGRAMS[b.id] || (() => ""))()}
        ${b.caption ? `<figcaption>${esc(b.caption)}</figcaption>` : ""}</figure>`;
    }
    case "kv":
      return `<div class="kv-box"><p class="kv-title">${esc(b.title)}</p>
        ${b.items.map((it) => `<div class="kv-row"><span class="k">${mdInline(it.k)}</span><span class="v">${mdInline(it.v)}</span></div>`).join("")}</div>`;
    case "compare":
      return `<div class="table-wrap"><table class="table compare"><thead><tr><th></th><th>${esc(b.columns[0])}</th><th>${esc(b.columns[1])}</th></tr></thead>
        <tbody>${b.rows.map((r) => `<tr><td class="cmp-k">${mdInline(r[0])}</td><td>${mdInline(r[1])}</td></tr>`).join("")}</tbody></table></div>`;
    default:
      return "";
  }
}

function renderLearn(root) {
  let activeTopicId = LEARN_CATEGORIES[0].topics[0].id;
  root.innerHTML = `<div class="learn-layout">
    <aside class="learn-nav card" id="learn-nav"></aside>
    <div class="learn-content" id="learn-content"></div>
  </div>`;

  // findTopic (global) ya aplica la edición de texto del docente si existe

  const paintNav = () => {
    const read = Student.data.readTopics;
    $("#learn-nav", root).innerHTML = learnCategories().map((c) => `
      <div class="ln-cat">
        <p class="ln-cat-title">${esc(c.title)}</p>
        ${c.topics.map((raw) => { const t = applyTopicOverride(raw); return `
          <button class="ln-topic ${t.id === activeTopicId ? "active" : ""}" data-topic="${t.id}">
            <span class="ln-check ${read.includes(t.id) ? "done" : ""}">${read.includes(t.id) ? icon("check-circle", 14) : ""}</span>
            <span>${esc(t.title)}</span>
          </button>`; }).join("")}
      </div>`).join("");
  };

  const paintTopic = () => {
    const found = findTopic(activeTopicId);
    const host = $("#learn-content", root);
    if (!found) { host.innerHTML = ""; return; }
    const { cat, topic } = found;
    const isRead = Student.data.readTopics.includes(topic.id);
    const extras = Content.questions.filter((q) => q.id.startsWith(topic.id + "-extra-"));
    // Se ocultan las preguntas sin completar (p. ej. recién añadidas por el docente)
    const ownQuiz = topic.quiz.filter((q) => q && q.prompt && (q.options ?? []).filter((o) => o).length >= 2);
    const quiz = [...ownQuiz, ...extras];
    const timgs = Content.learnImagesFor(topic.id);

    host.innerHTML = `
      <div class="card pad learn-topic">
        <div class="learn-topic-head">
          <div>
            <p class="learn-crumb">${esc(cat.title)}</p>
            <h2>${esc(topic.title)}</h2>
            <p class="learn-summary">${esc(topic.summary)}</p>
          </div>
          <div class="btn-row learn-head-actions">
            ${Session.isTeacher() ? `<button class="btn small outline" id="learn-doc-edit" title="Editar el texto y las imágenes de este tema en el panel docente">${icon("pencil", 14)} Editar tema</button>` : ""}
            <button class="btn small ${isRead ? "outline" : "primary"}" id="learn-mark">
              ${isRead ? icon("check-circle", 14) + " Leído" : "Marcar como leído"}
            </button>
          </div>
        </div>
        ${timgs.length ? `
        <div class="learn-photos">
          <div class="lp-head">${icon("image", 14)} Imágenes del curso
            <span class="hint">· aportadas por el docente · toca para ampliar</span></div>
          <div class="lp-grid">
            ${timgs.map((im) => `
            <figure class="lp-item" data-lpimg="${esc(im.id)}" title="Ampliar imagen">
              <div class="lp-imgwrap"><img src="${im.src}" alt="${esc(im.caption || topic.title)}" loading="lazy"></div>
              ${im.caption ? `<figcaption>${esc(im.caption)}</figcaption>` : ""}
            </figure>`).join("")}
          </div>
        </div>` : ""}
        <div class="learn-blocks">${topic.blocks.map((bl) => learnBlock(bl, topic.id)).join("")}</div>
        ${quiz.length ? `
          <div class="learn-quiz">
            <h3>${icon("list-checks", 16)} Comprueba lo aprendido</h3>
            <div id="learn-quiz-host"></div>
          </div>` : ""}
      </div>`;

    const markBtn = $("#learn-mark", host);
    markBtn.addEventListener("click", () => {
      Student.markTopicRead(topic.id);
      paintNav();
      markBtn.classList.remove("primary");
      markBtn.classList.add("outline");
      markBtn.innerHTML = icon("check-circle", 14) + " Leído";
      toast({ title: "Tema marcado como leído", description: topic.title });
    });
    // Atajo docente: editar este tema (texto, fotos, ilustraciones) en el panel
    const docBtn = $("#learn-doc-edit", host);
    if (docBtn) docBtn.addEventListener("click", () => {
      window.__learnEditJump = topic.id;
      App.setModule("docente");
    });
    const quizHost = $("#learn-quiz-host", host);
    if (quizHost) quiz.forEach((q, i) => QuizBlock(quizHost, q, i + 1, cat.id, topic.id));
    host.scrollIntoView({ block: "start", behavior: "smooth" });
  };

  $("#learn-nav", root).addEventListener("click", (e) => {
    const b = e.target.closest("[data-topic]");
    if (!b) return;
    activeTopicId = b.dataset.topic;
    paintNav();
    paintTopic();
  });

  // Galería e ilustraciones del docente: ampliar a pantalla completa (lightbox)
  $("#learn-content", root).addEventListener("click", (e) => {
    const dia = e.target.closest("[data-diaview]");
    if (dia) {
      const fd = findTopic(activeTopicId);
      const ov = fd ? Content.diagramOverride(fd.topic.id, dia.dataset.diaview) : null;
      if (ov) openLightbox(ov.src, ov.caption || "");
      return;
    }
    const f = e.target.closest("[data-lpimg]");
    if (!f) return;
    const found = findTopic(activeTopicId);
    if (!found) return;
    const im = Content.learnImagesFor(found.topic.id).find((x) => x.id === f.dataset.lpimg);
    if (im) openLightbox(im.src, im.caption || "");
  });

  paintNav();
  paintTopic();
  return () => {};
}
