/* AR PERIO — math.js (portado de src/lib/math.ts) */
/**
 * AR PERIO — utilidades matemáticas compartidas por el motor 3D.
 * Todas las magnitudes del modelo están en milímetros.
 */
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const lerp = (a, b, t) => a + (b - a) * t;
/** Interpolación suave con derivada nula en los extremos. */
const smoothstep = (edge0, edge1, x) => {
    const t = clamp((x - edge0) / (edge1 - edge0 || 1e-9), 0, 1);
    return t * t * (3 - 2 * t);
};
const deg = (d) => (d * Math.PI) / 180;
/** Catmull-Rom escalar para interpolar secciones anatómicas. */
function catmullRom(p0, p1, p2, p3, t) {
    const t2 = t * t;
    const t3 = t2 * t;
    return (0.5 *
        (2 * p1 +
            (-p0 + p2) * t +
            (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
            (-p0 + 3 * p1 - 3 * p2 + p3) * t3));
}
/**
 * Interpola el valor de una función definida por keyframes (y, valor)
 * usando Catmull-Rom. Acepta claves en orden ascendente O descendente.
 */
function sampleCurve(keysRaw, y) {
    const n = keysRaw.length;
    if (n === 0)
        return 0;
    // Normaliza a orden ascendente
    const keys = keysRaw[0][0] > keysRaw[n - 1][0] ? [...keysRaw].reverse() : keysRaw;
    if (y <= keys[0][0])
        return keys[0][1];
    if (y >= keys[n - 1][0])
        return keys[n - 1][1];
    let i = 0;
    while (i < n - 2 && y > keys[i + 1][0])
        i++;
    const y0 = keys[i][0];
    const y1 = keys[i + 1][0];
    const t = (y - y0) / (y1 - y0 || 1e-9);
    const p0 = keys[Math.max(0, i - 1)][1];
    const p1 = keys[i][1];
    const p2 = keys[i + 1][1];
    const p3 = keys[Math.min(n - 1, i + 2)][1];
    return catmullRom(p0, p1, p2, p3, t);
}
/** Curva de facilidad para transiciones de cámara. */
const easeInOutCubic = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
/** easeOutBack: arranca rápido y rebasa ligeramente el objetivo antes de asentarse
 * (efecto de "brotar": la gota de sangre emerge y se estabiliza). */
const easeOutBack = (t) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    const u = t - 1;
    return 1 + c3 * u * u * u + c1 * u * u;
};
/** Hash determinista barato para ruido de shaders (versión JS). */
function hash2(x, y) {
    const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return s - Math.floor(s);
}
/** Longitud de arco numérica de una polilínea de puntos 2D. */
function polylineLength(pts) {
    let len = 0;
    for (let i = 1; i < pts.length; i++) {
        len += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    }
    return len;
}
