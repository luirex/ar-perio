/* AR PERIO — Vistas predefinidas de cámara (mm, mundo).
 * Distancias calibradas para FOV 33° (aspecto fotográfico macro, sin
 * distorsión de perspectiva): encuadre equivalente al FOV 38° anterior. */
const VIEW_PRESETS = {
    inicio: { pos: [14, 7, 40], target: [0, 0.5, 0], label: "Vista inicial" },
    vestibular: { pos: [0, 4, 54], target: [0, 1.0, 0], label: "Vestibular" },
    palatina: { pos: [0, 4, -54], target: [0, 1.0, 0], label: "Palatina" },
    mesial: { pos: [54, 4, 7], target: [0, 1.0, 0], label: "Mesial" },
    distal: { pos: [-54, 4, -7], target: [0, 1.0, 0], label: "Distal" },
    incisal: { pos: [2.5, 59, 8], target: [0, 0, 0], label: "Incisal" },
    anatomica: { pos: [37, 0, 37], target: [0, -2.5, 0], label: "Anatómica interna" },
};
const VIEW_BUTTONS = [
    { id: "vestibular", label: "Vestibular" },
    { id: "palatina", label: "Palatina" },
    { id: "mesial", label: "Mesial" },
    { id: "distal", label: "Distal" },
    { id: "incisal", label: "Incisal" },
    { id: "anatomica", label: "Anatómica interna" },
];
