/* AR PERIO — tooth.js (portado de src/3d/tooth.ts) */
/**
 * AR PERIO — Geometría paramétrica del incisivo central superior permanente.
 *
 * Sistema de coordenadas (mm): eje longitudinal del diente = Y.
 *   - CEJ (unión esmalte-cemento) en y = 0
 *   - Coronario hacia +y (borde incisal ≈ +10.7)
 *   - Apical hacia −y (ápice radicular ≈ −13.1)
 *   - θ = 0 → vestibular (+Z), θ = 90° → mesial (+X), θ = 180° → palatino (−Z)
 *
 * La superficie se define como un "loft" de secciones superelípticas
 * (más anchas mesiodistalmente que espesas vestíbulo-palatinamente) con
 * armónicos anatómicos: cíngulo palatino, convexidad vestibular, redondeo
 * disto-incisal y deriva apical distal.
 */
const Y_INCISAL = 10.75;
const Y_APEX = -13.1;
const Y_CEJ = 0;
/** Keyframes de sección: [y, semiancho mesiodistal a, semiespesor b, exponente p]. Orden ASCENDENTE en y. */
const CROWN_KEYS = [
    [0.0, 3.32, 3.14, 3.0],
    [1.4, 3.7, 3.3, 3.1],
    [3.2, 4.0, 3.33, 3.1],
    [5.0, 4.2, 3.18, 3.0],
    [6.8, 4.24, 2.92, 2.9],
    [8.4, 4.16, 2.32, 2.7],
    [9.6, 3.92, 1.42, 2.4],
    [10.35, 3.32, 0.66, 2.15],
    [10.75, 2.55, 0.3, 2.0],
];
const ROOT_KEYS = [
    [-13.1, 0.02, 0.02, 2.0],
    [-12.8, 0.18, 0.2, 2.0],
    [-12.0, 0.5, 0.54, 2.0],
    [-10.5, 1.02, 1.06, 2.1],
    [-8.5, 1.52, 1.56, 2.3],
    [-6.5, 1.96, 2.02, 2.5],
    [-4.0, 2.46, 2.45, 2.7],
    [-1.5, 2.95, 2.86, 2.9],
    [0.0, 3.32, 3.14, 3.0],
];
const A_CROWN = CROWN_KEYS.map((k) => [k[0], k[1]]);
const B_CROWN = CROWN_KEYS.map((k) => [k[0], k[2]]);
const P_CROWN = CROWN_KEYS.map((k) => [k[0], k[3]]);
const A_ROOT = ROOT_KEYS.map((k) => [k[0], k[1]]);
const B_ROOT = ROOT_KEYS.map((k) => [k[0], k[2]]);
const P_ROOT = ROOT_KEYS.map((k) => [k[0], k[3]]);
function sectionAt(y) {
    if (y >= 0) {
        return {
            a: sampleCurve(A_CROWN, y),
            b: sampleCurve(B_CROWN, y),
            p: sampleCurve(P_CROWN, y),
        };
    }
    return {
        a: sampleCurve(A_ROOT, y),
        b: sampleCurve(B_ROOT, y),
        p: sampleCurve(P_ROOT, y),
    };
}
/**
 * Punto de la superficie externa del diente.
 * @param theta radianes (0 = vestibular)
 * @param y altura sobre el CEJ
 */
function toothPoint(theta, y, out = new THREE.Vector3()) {
    const { a, b, p } = sectionAt(y);
    const s = Math.sin(theta);
    const c = Math.cos(theta);
    const e = 2 / p;
    let x = a * Math.sign(s) * Math.pow(Math.abs(s), e);
    let z = b * Math.sign(c) * Math.pow(Math.abs(c), e);
    // — Armónicos anatómicos —
    // Cíngulo palatino (tercio cervical de la corona, lado palatino)
    const cing = smoothstep(4.4, 2.0, y) * smoothstep(-0.4, 1.8, y);
    // Convexidad vestibular en corona media
    const lab = smoothstep(0.8, 3.6, y) * smoothstep(9.4, 6.4, y);
    let m = 1.0;
    m += 0.085 * cing * Math.pow(Math.max(0, -c), 1.6);
    m += 0.035 * lab * c * c;
    x *= m;
    z *= m;
    // Redondeo del ángulo disto-incisal
    if (x < 0 && y > 8.0) {
        x *= 1 - 0.1 * smoothstep(8.0, 10.6, y);
    }
    // Deriva apical hacia distal
    if (y < 0) {
        x += 0.05 * y * smoothstep(0, -6, y);
    }
    return out.set(x, y, z);
}
/** Distancia radial desde el eje del diente hasta la superficie. */
function toothRadius(theta, y) {
    const p = toothPoint(theta, y);
    return Math.hypot(p.x, p.z);
}
/** Dirección radial unitaria saliente en el ángulo dado. */
function radialDir(theta, out = new THREE.Vector3()) {
    const s = Math.sin(theta);
    const c = Math.cos(theta);
    const len = Math.hypot(s, c) || 1;
    return out.set(s / len, 0, c / len);
}
/**
 * Genera un "loft" cerrado alrededor del eje Y muestreando pointFn.
 * Las caras quedan orientadas hacia fuera.
 */
function makeLoft(pointFn, tTop, tBottom, opts = {}) {
    var _a, _b;
    const rings = (_a = opts.rings) !== null && _a !== void 0 ? _a : 88;
    const segs = (_b = opts.segs) !== null && _b !== void 0 ? _b : 120;
    const positions = new Float32Array((rings + 1) * segs * 3);
    const colors = opts.colorFn ? new Float32Array((rings + 1) * segs * 3) : null;
    const p = new THREE.Vector3();
    const tmp = new THREE.Vector3();
    const col = new THREE.Color();
    let vi = 0;
    for (let i = 0; i <= rings; i++) {
        const t = THREE.MathUtils.lerp(tTop, tBottom, i / rings);
        for (let j = 0; j < segs; j++) {
            const theta = (j / segs) * Math.PI * 2;
            pointFn(theta, t, p);
            positions[vi] = p.x;
            positions[vi + 1] = p.y;
            positions[vi + 2] = p.z;
            if (colors && opts.colorFn) {
                const c = opts.colorFn(tmp.copy(p), i / rings, j / segs, col);
                colors[vi] = c.r;
                colors[vi + 1] = c.g;
                colors[vi + 2] = c.b;
            }
            vi += 3;
        }
    }
    const indices = [];
    for (let i = 0; i < rings; i++) {
        for (let j = 0; j < segs; j++) {
            const a = i * segs + j;
            const b = i * segs + ((j + 1) % segs);
            const c = (i + 1) * segs + ((j + 1) % segs);
            const d = (i + 1) * segs + j;
            indices.push(a, c, b, a, d, c);
        }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    if (colors)
        geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
}
/* --------------------------- Mallas del diente --------------------------- */
const _tmpColA = new THREE.Color();
const _tmpColB = new THREE.Color();
const lerpColor = (c1, c2, t, out = new THREE.Color()) => out.copy(new THREE.Color(c1)).lerp(new THREE.Color(c2), t);
/** Corona (esmalte): superficie externa desde el CEJ hasta el borde incisal. */
function makeEnamelGeometry() {
    return makeLoft((theta, y, out) => toothPoint(theta, y, out), Y_INCISAL, -0.18, {
        rings: 84,
        segs: 120,
        // Degradado realista en 3 zonas: borde incisal translúcido-neutro →
        // tercio medio marfil claro → cervical marfil cálido (dentina trasluciendo)
        colorFn: (p, _r, _c, out) => {
            const t1 = smoothstep(10.75, 6.5, p.y);
            const t2 = smoothstep(3.5, -0.5, p.y);
            out.set("#f2f4f0").lerp(_tmpColA.set("#f9f5eb"), t1).lerp(_tmpColB.set("#e0d1ac"), t2);
            return out;
        },
    });
}
/** Núcleo de dentina (corona + raíz), visible al ocultar esmalte/cemento. */
function makeDentinGeometry() {
    const scaleKeys = [
        [-12.9, 0.93],
        [-11.0, 0.9],
        [-8.0, 0.88],
        [-4.0, 0.87],
        [0.0, 0.885],
        [3.0, 0.86],
        [6.0, 0.8],
        [9.0, 0.68],
        [10.75, 0.5],
    ];
    return makeLoft((theta, y, out) => {
        const p = toothPoint(theta, y, out);
        const s = sampleCurve(scaleKeys, y);
        p.x *= s;
        p.z *= s;
        return p;
    }, 10.45, -12.9, { rings: 88, segs: 96, colorFn: (p, _r, _c, out) => lerpColor("#ecd9a8", "#dfc48d", smoothstep(4, -6, p.y), out) });
}
/** Superficie radicular (cemento). */
function makeRootGeometry() {
    return makeLoft((theta, y, out) => toothPoint(theta, y, out), 0.18, Y_APEX, {
        rings: 70,
        segs: 96,
        colorFn: (p, _r, _c, out) => lerpColor("#e2cfae", "#d3bd97", smoothstep(0, -10, p.y), out),
    });
}
/** Cavidad pulpar: cámara estrecha + conducto único. */
function makePulpGeometry() {
    const scaleKeys = [
        [-12.6, 0.025],
        [-11.5, 0.045],
        [-9.0, 0.075],
        [-6.0, 0.105],
        [-3.0, 0.14],
        [0.5, 0.21],
        [3.0, 0.29],
        [5.5, 0.32],
        [8.0, 0.27],
        [9.8, 0.14],
    ];
    return makeLoft((theta, y, out) => {
        const p = toothPoint(theta, y, out);
        const s = sampleCurve(scaleKeys, y);
        p.x *= s;
        p.z *= s;
        return p;
    }, 10.0, -12.6, { rings: 60, segs: 48 });
}
