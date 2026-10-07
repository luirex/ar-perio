/* AR PERIO — learn-index.js · Ensambla las categorías del contenido educativo.
 * Añadir categorías aquí las hace aparecer en Aprender, Mi progreso y el
 * panel docente sin más cambios. */

const LEARN_CATEGORIES = [
  ANATOMIA,
  EXAMEN,
  ENFERMEDADES,
  INSTRUMENTACION,
];

/** Temas creados desde cero por el docente (viven en Content.customTopics). */
const customTopicsAll = () => {
  try { return (typeof Content !== "undefined" && Content) ? (Content.data.customTopics ?? []) : []; }
  catch { return []; }
};

/** Categorías efectivas: los 24 temas del programa + los temas propios del
 * docente dentro de la categoría que eligió al crearlos. */
const learnCategories = () => LEARN_CATEGORIES.map((c) => ({
  ...c,
  topics: [...c.topics, ...customTopicsAll().filter((t) => t.categoryId === c.id)],
}));

/** Aplica la edición de TEXTO hecha por el docente sobre un tema original
 * (título, resumen, bloques y preguntas). El id y la categoría nunca cambian,
 * así que el progreso del estudiante y las preguntas extra siguen vinculadas. */
const applyTopicOverride = (topic) => {
  const o = (Content.data.topicOverrides ?? {})[topic.id];
  if (!o || typeof o !== "object") return topic;
  return {
    ...topic,
    title: (typeof o.title === "string" && o.title.trim()) ? o.title : topic.title,
    summary: typeof o.summary === "string" ? o.summary : topic.summary,
    blocks: Array.isArray(o.blocks) ? o.blocks : topic.blocks,
    quiz: Array.isArray(o.quiz) ? o.quiz : topic.quiz,
  };
};

const findTopic = (topicId) => {
  for (const cat of LEARN_CATEGORIES) {
    const topic = cat.topics.find((t) => t.id === topicId);
    if (topic) return { cat, topic: applyTopicOverride(topic) };
  }
  // Temas creados desde cero por el docente
  const ct = customTopicsAll().find((t) => t.id === topicId);
  if (ct) {
    const cat = LEARN_CATEGORIES.find((c) => c.id === ct.categoryId) ?? LEARN_CATEGORIES[0];
    return { cat, topic: applyTopicOverride(ct) };
  }
  return null;
};
