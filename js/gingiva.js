/* AR PERIO — gingiva.js (portado de src/3d/gingiva.ts) */
/**
 * AR PERIO — Encía paramétrica con surco gingival funcional + hueso + PDL.
 *
 * La encía se genera como superficie toroidal: para cada ángulo θ alrededor
 * del diente se construye un perfil radial (pared interna del surco → fondo
 * → unión → rolle del margen → superficie externa → base), cerrado y
 * revolucionado alrededor del eje.
 *
 * EL SURCO ES UN HUECO REAL: entre la pared interna y el diente queda una
 * luz de ~0.5 mm en la entrada que se estrecha a ~0.3 mm en el fondo, por
 * donde se desliza la sonda virtual (ver src/3d/probing.ts).
 *
 * Hitos según la condición periodontal (data/models.ts):
 *   margen(θ) = margenSano(θ) + edema − recesión
 *   fondo(θ)  = CEJ(θ) − pérdida de inserción
 *   cresta(θ) = CEJ(θ) − 1.6 − pérdida ósea
 */
const Y_BONE_BOTTOM = -13.2;
/** Línea del CEJ: se hunde ligeramente en zonas interproximales. */
function cejY(theta) {
    return -0.55 * Math.pow(Math.abs(Math.sin(theta)), 1.5);
}
/** Margen sano festoneado: 1.45 vestibular medio, ~2.45 interproximal. */
function healthyMarginY(theta) {
    return 1.95 - 0.5 * Math.cos(2 * theta);
}
function buildLandmarks(cond) {
    const marginY = (t) => healthyMarginY(t) + cond.swell - cond.recession;
    const floorY = (t) => cejY(t) - cond.attachmentLoss;
    const crestY = (t) => cejY(t) - 1.6 - cond.boneLoss;
    return {
        marginY,
        floorY,
        crestY,
        cejY,
        gumOuterR: (t, y) => outerProfileR(t, y, cond),
        marginAvgY: marginY(0),
        baseAvgY: marginY(0) - 6.0,
    };
}
/** Profundidad de la base de la encía (más profunda en vestibular). */
function baseDepth(theta) {
    return 6.8 - 2.2 * (1 - Math.cos(theta)) / 2;
}
/* --------------------------- Hueso alveolar (contorno) ------------------- */
const BONE_A = [[-12.4, 3.2], [-11, 4.6], [-9, 5.6], [-6, 6.2], [-2, 6.6], [1.0, 6.7]];
const BONE_B = [[-12.4, 3.0], [-11, 4.2], [-9, 4.9], [-6, 5.3], [-2, 5.6], [1.0, 5.7]];
/** Radio del contorno externo del hueso en (θ, y). */
function boneOuterR(theta, y) {
    const a = sampleCurve(BONE_A, Math.min(y, 1.0));
    const b = sampleCurve(BONE_B, Math.min(y, 1.0));
    const e = 2 / 3.2;
    const s = Math.sin(theta);
    const c = Math.cos(theta);
    const x = a * Math.sign(s) * Math.pow(Math.abs(s), e);
    const z = b * Math.sign(c) * Math.pow(Math.abs(c), e);
    return Math.hypot(x, z);
}
/** Radio externo aproximado de la encía en (θ, y) para colisiones. */
function outerProfileR(theta, y, cond) {
    const yM = healthyMarginY(theta) + cond.swell - cond.recession;
    const mt = cond.marginThickness;
    const rM = toothRadius(theta, yM);
    const rAt = (yy) => toothRadius(theta, THREE.MathUtils.clamp(yy, -12.4, 10.6));
    const yO1 = yM - 2.3;
    const yO2 = yM - 4.8;
    const yBase = yM - baseDepth(theta);
    const pts = [
        [yM + 0.24 + cond.swell * 0.22, rM + 0.66 + mt],
        [yM - 0.5, rM + 1.05 + mt * 1.1],
        [yO1, rAt(yO1) + 2.1 + mt],
        [yO2, Math.max(boneOuterR(theta, yO2) + 1.15, rAt(yO2) + 2.7)],
        [yBase, boneOuterR(theta, yBase) + 1.4],
        [yBase - 3, boneOuterR(theta, yBase - 1.3) + 0.3],
    ];
    if (y >= pts[0][0])
        return pts[0][1];
    for (let i = 1; i < pts.length; i++) {
        if (y >= pts[i][0]) {
            const [y0, r0] = pts[i - 1];
            const [y1, r1] = pts[i];
            const t = (y - y0) / (y1 - y0 || 1e-6);
            return THREE.MathUtils.lerp(r0, r1, t);
        }
    }
    return pts[pts.length - 1][1];
}
/* ------------------------- Loft de perfiles radiales --------------------- */
const _v = new THREE.Vector3();
/**
 * Revoluciona un perfil radial (lista de [radio, y], cerrado implícitamente)
 * alrededor del eje del diente. El radio se mide desde el eje en la
 * dirección de la superficie del diente en (θ, y).
 */
function makeProfileLoft(profileFn, thetaSegs) {
    const base = profileFn(0);
    const N = base.length; // el perfil ya incluye el punto de cierre
    const positions = new Float32Array(thetaSegs * N * 3);
    for (let j = 0; j < thetaSegs; j++) {
        const theta = (j / thetaSegs) * Math.PI * 2;
        const prof = profileFn(theta);
        for (let i = 0; i < N; i++) {
            const [u, y] = prof[Math.min(i, prof.length - 1)];
            toothPoint(theta, y, _v);
            const r = Math.hypot(_v.x, _v.z) || 1;
            const idx = (j * N + i) * 3;
            positions[idx] = (u * _v.x) / r;
            positions[idx + 1] = y;
            positions[idx + 2] = (u * _v.z) / r;
        }
    }
    const indices = [];
    for (let i = 0; i < N - 1; i++) {
        for (let j = 0; j < thetaSegs; j++) {
            const j2 = (j + 1) % thetaSegs;
            const a = j * N + i;
            const b = j2 * N + i;
            const c = j2 * N + i + 1;
            const d = j * N + i + 1;
            indices.push(a, b, c, a, c, d);
        }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return { geometry, profileN: N, thetaSegs };
}
/** Coloca los colores por vértice tras el loft (idx = perfil, j = θ). */
function applyProfileColors(res, colorFn) {
    const { profileN: N, thetaSegs } = res;
    const colors = new Float32Array(thetaSegs * N * 3);
    const col = new THREE.Color();
    let k = 0;
    for (let j = 0; j < thetaSegs; j++) {
        const theta = (j / thetaSegs) * Math.PI * 2;
        for (let i = 0; i < N; i++) {
            colorFn(i, theta, col);
            colors[k++] = col.r;
            colors[k++] = col.g;
            colors[k++] = col.b;
        }
    }
    res.geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
}
/* ------------------------------ Perfil de encía -------------------------- */
function gumProfile(theta, cond, lm) {
    const yM = lm.marginY(theta);
    const yF = lm.floorY(theta);
    const yCr = lm.crestY(theta);
    const mt = cond.marginThickness;
    const rAt = (yy) => toothRadius(theta, THREE.MathUtils.clamp(yy, -12.4, 10.6));
    const rM = rAt(yM);
    const rF = rAt(yF);
    const yBase = yM - baseDepth(theta);
    const rSock = rAt(yBase - 1.0) + 0.3;
    const yI2 = Math.min(yF - 0.9, yCr + 0.3);
    const prof = [
        // Pared interna (de apical a coronal): revestimiento del alvéolo
        [rAt(yCr + 0.45) + 0.22, yCr + 0.45],
        [rAt(yI2) + 0.16, yI2],
        [rF + 0.3, yF], // FONDO DEL SURCO
        [rM + 0.52, yM], // ENTRADA DEL SURCO
        // Rolle del margen gingival
        [rM + 0.66 + mt, yM + 0.24 + cond.swell * 0.22],
        [rM + 1.05 + mt * 1.1, yM - 0.5],
        // Superficie externa
        [rAt(yM - 2.4) + 2.1 + mt, yM - 2.3],
        [Math.max(boneOuterR(theta, yM - 4.8) + 1.15, rAt(yM - 4.8) + 2.7), yM - 4.8],
        [boneOuterR(theta, yBase) + 1.4, yBase],
        // Base y doblez mucoso
        [boneOuterR(theta, yBase - 0.9) + 0.55, yBase - 0.9],
        [boneOuterR(theta, yBase - 1.3) + 0.18, yBase - 1.3],
        [rSock + 1.1, yBase - 1.1],
        [rSock + 0.62, yCr + 0.5], // cierre interior (oculto dentro del hueso)
    ];
    prof.push([prof[0][0], prof[0][1]]); // cierre del anillo
    return prof;
}
const _cMargin = new THREE.Color();
function gumVertexColor(cond, profileIdx, N, theta, out) {
    const base = new THREE.Color(cond.gumColor);
    const t = profileIdx / (N - 2);
    if (t < 3 / 13)
        out.copy(base).lerp(new THREE.Color("#a34340"), 0.42); // pared interna
    else if (t < 6 / 13)
        out.copy(base).lerp(new THREE.Color("#8f3a34"), 0.36); // margen
    else if (t < 9 / 13)
        out.copy(base).lerp(new THREE.Color("#d9a8a0"), 0.15); // adherida
    else
        out.copy(base).lerp(new THREE.Color("#9c4a46"), 0.26); // mucosa
    const papilla = Math.pow(Math.abs(Math.sin(theta)), 2);
    out.lerp(_cMargin.set("#b0433d"), papilla * 0.12);
}
function buildGingiva(cond) {
    const lm = buildLandmarks(cond);
    const res = makeProfileLoft((theta) => gumProfile(theta, cond, lm), 132);
    applyProfileColors(res, (i, theta, out) => gumVertexColor(cond, i, res.profileN, theta, out));
    const mesh = new THREE.Mesh(res.geometry, new THREE.MeshPhysicalMaterial({ vertexColors: true }));
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.frustumCulled = false;
    return { mesh, landmarks: lm };
}
function buildBoneAndPdl(cond, lm) {
    // Perfil óseo: [tabique interno → cresta → cortical externa → fondo]
    const boneProfile = (theta) => {
        const yCr = lm.crestY(theta);
        const rAt = (yy) => toothRadius(theta, THREE.MathUtils.clamp(yy, -12.9, 1.0));
        const prof = [
            [rAt(Y_BONE_BOTTOM + 0.6) + 0.3, Y_BONE_BOTTOM + 0.6],
            [rAt(yCr + 0.35) + 0.3, yCr + 0.35],
            [rAt(yCr + 0.15) + 0.62, yCr + 0.15],
            [boneOuterR(theta, yCr), yCr],
            [boneOuterR(theta, yCr - 2.5), yCr - 2.5],
            [boneOuterR(theta, -6.5), -6.5],
            [boneOuterR(theta, -9.5), -9.5],
            [boneOuterR(theta, -11.5), -11.5],
            [3.1, -12.5],
            [rAt(Y_BONE_BOTTOM + 0.35) + 0.55, Y_BONE_BOTTOM + 0.35],
        ];
        prof.push([prof[0][0], prof[0][1]]);
        return prof;
    };
    const boneRes = makeProfileLoft(boneProfile, 110);
    applyProfileColors(boneRes, (_i, theta, out) => {
        const v = 0.5 + 0.5 * Math.sin(theta * 3 + 1.2);
        out.set("#e9dfc6").lerp(new THREE.Color("#d5c8a6"), v * 0.4);
    });
    const bone = new THREE.Mesh(boneRes.geometry, new THREE.MeshPhysicalMaterial({
        vertexColors: true,
        roughness: 0.62,
        metalness: 0,
        side: THREE.DoubleSide,
    }));
    bone.castShadow = true;
    bone.receiveShadow = true;
    bone.frustumCulled = false;
    // Ligamento periodontal: media entre raíz y hueso, de la cresta al ápice
    const pdlGeo = makePdlGeometry(lm);
    const pdl = new THREE.Mesh(pdlGeo, new THREE.MeshPhysicalMaterial({
        color: "#d98f86",
        roughness: 0.6,
        transparent: true,
        opacity: 0.92,
        side: THREE.DoubleSide,
    }));
    pdl.frustumCulled = false;
    return { bone, pdl };
}
function makePdlGeometry(lm) {
    const rings = 56;
    const segs = 72;
    const positions = new Float32Array((rings + 1) * segs * 3);
    const p = new THREE.Vector3();
    for (let i = 0; i <= rings; i++) {
        const t = i / rings;
        for (let j = 0; j < segs; j++) {
            const theta = (j / segs) * Math.PI * 2;
            const yTop = lm.crestY(theta) + 0.2;
            const y = THREE.MathUtils.lerp(yTop, Y_BONE_BOTTOM + 0.75, t);
            toothPoint(theta, y, p);
            const r = Math.hypot(p.x, p.z) || 1;
            const target = r + 0.17;
            const idx = (i * segs + j) * 3;
            positions[idx] = (p.x / r) * target;
            positions[idx + 1] = p.y;
            positions[idx + 2] = (p.z / r) * target;
        }
    }
    const indices = [];
    for (let i = 0; i < rings; i++) {
        for (let j = 0; j < segs; j++) {
            const j2 = (j + 1) % segs;
            const a = i * segs + j;
            const b = i * segs + j2;
            const c = (i + 1) * segs + j2;
            const d = (i + 1) * segs + j;
            indices.push(a, b, c, a, c, d);
        }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
}
