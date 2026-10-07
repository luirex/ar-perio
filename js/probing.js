/* AR PERIO — probing.js (portado de src/3d/probing.ts) */
/**
 * AR PERIO — Controlador de sondaje periodontal.
 *
 * Interacción (mouse + pantalla táctil):
 *  - Arrastrar la sonda: movimiento libre en el plano de la cámara.
 *  - Al aproximar la punta al margen gingival (~1.2 mm) la sonda se
 *    "acopla" al diente: el arrastre vertical inserta/retira la sonda
 *    a lo largo de la superficie y el arrastre horizontal recorre
 *    circunferencialmente los sitios de sondaje.
 *  - Colisiones: la punta no atraviesa el diente, el fondo del surco
 *    (tope con resistencia), la encía ni el hueso.
 *
 * La profundidad se mide como ARCO DE SUPERFICIE entre el margen y la
 * punta (integración numérica), con precisión de 0.1 mm.
 */
const UP = new THREE.Vector3(0, 1, 0);
const round1 = (v) => Math.round(v * 10) / 10;
class ProbingController {
    constructor(opts) {
        var _a;
        /** Mallas anatómicas contra las que la sonda se desliza al arrastrar. */
        this.anatomyTargets = [];
        /** Punta libre (mm, mundo). */
        this.tipPos = new THREE.Vector3(3, 7, 15);
        /** Modo acoplado: ángulo y arco de inserción. */
        this.theta = 0;
        this.s = 0;
        this.engaged = false;
        this.dragging = false;
        this.focusSite = null;
        this.guideVisible = true;
        this.guideMesh = null;
        this.guideTheta = NaN;
        this.guideFlash = 0;
        this.raycaster = new THREE.Raycaster();
        this.grabPlane = new THREE.Plane();
        this.lastPlanePt = new THREE.Vector3();
        this.ndc = new THREE.Vector2();
        this.floorArcCache = 0;
        /** Objetivo de superficie bajo el cursor (modo libre). */
        this.surfaceTarget = null;
        this.bledThisInsertion = false;
        this.overpressureLatched = false;
        this.lastEmit = 0;
        this.lastState = null;
        this.floorContactLatch = false;
        this._p = new THREE.Vector3();
        this._p2 = new THREE.Vector3();
        this._dir = new THREE.Vector3();
        this._rad = new THREE.Vector3();
        this._tan = new THREE.Vector3();
        this._up = new THREE.Vector3();
        this._q = new THREE.Quaternion();
        this._prev = new THREE.Vector3();
        this._cur = new THREE.Vector3();
        // Vectores exclusivos del manejador de eventos (no compartir con el bucle)
        this._e1 = new THREE.Vector3();
        this._e2 = new THREE.Vector3();
        this._e3 = new THREE.Vector3();
        this.onPointerDown = (e) => {
            if (e.button !== undefined && e.button !== 0 && e.pointerType === "mouse")
                return;
            if (!this.updateNDC(e))
                return;
            this.raycaster.setFromCamera(this.ndc, this.camera);
            const hits = this.raycaster.intersectObjects([this.probe.tipHit, this.probe.handleHit], false);
            if (hits.length === 0)
                return;
            // La sonda captura el gesto: la cámara no debe orbitar.
            e.stopPropagation();
            e.preventDefault();
            this.dragging = true;
            this.controls.enabled = false;
            try {
                e.currentTarget.setPointerCapture(e.pointerId);
            }
            catch {
                /* ignorar */
            }
            this.updateGrabPlane(this.probe.group.position);
            this.raycaster.ray.intersectPlane(this.grabPlane, this.lastPlanePt);
            this.canvas.style.cursor = "grabbing";
        };
        this.onPointerMove = (e) => {
            var _a;
            if (!this.dragging) {
                // Cursor de agarre al pasar sobre la sonda (escritorio)
                if (e.pointerType === "mouse" && this.canvas.isConnected) {
                    if (this.updateNDC(e)) {
                        this.raycaster.setFromCamera(this.ndc, this.camera);
                        const hits = this.raycaster.intersectObjects([this.probe.tipHit, this.probe.handleHit], false);
                        this.canvas.style.cursor = hits.length ? "grab" : "";
                    }
                }
                return;
            }
            e.preventDefault();
            if (!this.updateNDC(e))
                return;
            this.raycaster.setFromCamera(this.ndc, this.camera);
            if (this.engaged) {
                // Modo acoplado: Δ en el plano de la cámara → (dθ, ds)
                const planePt = this.raycaster.ray.intersectPlane(this.grabPlane, this._e1);
                if (!planePt)
                    return;
                const delta = this._e2.copy(planePt).sub(this.lastPlanePt);
                this.lastPlanePt.copy(planePt);
                radialDir(this.theta, this._rad);
                this._tan.set(this._rad.z, 0, -this._rad.x);
                const rTip = Math.max(1.5, Math.hypot(this.probe.group.position.x, this.probe.group.position.z));
                const dTheta = (delta.dot(this._tan) / rTip) * 1.15;
                this.insertionDir(this.theta, this.s, this._e3);
                const ds = delta.dot(this._e3) * 1.15; // arrastre apical = inserción
                this.theta = this.theta + dTheta;
                this.s = this.s + ds;
            }
            else {
                // Modo libre: la punta persigue la superficie anatómica bajo el cursor
                // (raycast) y cae a un plano paralelo a la cámara fuera del modelo.
                const hits = this.anatomyTargets.length
                    ? this.raycaster.intersectObjects(this.anatomyTargets, false)
                    : [];
                if (hits.length > 0) {
                    const hit = hits[0];
                    const n = hit.face ? hit.face.normal.clone() : new THREE.Vector3(0, 1, 0);
                    this.surfaceTarget = (_a = this.surfaceTarget) !== null && _a !== void 0 ? _a : new THREE.Vector3();
                    this.surfaceTarget.copy(hit.point).addScaledVector(n, 0.4);
                }
                else {
                    this.surfaceTarget = null;
                    const planePt = this.raycaster.ray.intersectPlane(this.grabPlane, this._e1);
                    if (!planePt)
                        return;
                    const delta = this._e2.copy(planePt).sub(this.lastPlanePt);
                    this.lastPlanePt.copy(planePt);
                    this.tipPos.add(delta);
                }
            }
        };
        this.onPointerUp = (e) => {
            if (!this.dragging)
                return;
            this.dragging = false;
            this.surfaceTarget = null;
            this.controls.enabled = true;
            try {
                e.currentTarget.releasePointerCapture(e.pointerId);
            }
            catch {
                /* ignorar */
            }
            this.canvas.style.cursor = "";
        };
        this.camera = opts.camera;
        this.controls = opts.controls;
        this.canvas = opts.canvas;
        this.probe = opts.probe;
        this.uniforms = opts.uniforms;
        this.lm = opts.landmarks;
        this.cond = opts.condition;
        this.cb = (_a = opts.callbacks) !== null && _a !== void 0 ? _a : {};
        this.guideMat = new THREE.MeshBasicMaterial({
            color: "#2dd4bf",
            transparent: true,
            opacity: 0.55,
            depthWrite: false,
        });
        const wrapper = opts.wrapper;
        wrapper.addEventListener("pointerdown", this.onPointerDown, { capture: true });
        window.addEventListener("pointermove", this.onPointerMove, { passive: false });
        window.addEventListener("pointerup", this.onPointerUp);
        window.addEventListener("pointercancel", this.onPointerUp);
    }
    setLandmarks(lm, cond) {
        this.lm = lm;
        this.cond = cond;
        this.guideTheta = NaN;
        this.bleedReset();
        if (this.engaged) {
            this.engageAt(this.theta);
        }
    }
    setAnatomyTargets(list) {
        this.anatomyTargets = list;
    }
    setFocusSite(site) {
        this.focusSite = site;
        this.guideTheta = NaN;
    }
    setGuideVisible(v) {
        this.guideVisible = v;
        if (this.guideMesh)
            this.guideMesh.visible = v;
    }
    getGuideObject() {
        return this.guideMesh;
    }
    reset() {
        this.engaged = false;
        this.s = 0;
        this.tipPos.set(3, 7, 15);
        this.bleedReset();
    }
    bleedReset() {
        this.bledThisInsertion = false;
        this.overpressureLatched = false;
        this.floorContactLatch = false;
    }
    /* --------------------------- Eventos de puntero ------------------------- */
    updateNDC(e) {
        const rect = this.canvas.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0)
            return false;
        this.ndc.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
        return true;
    }
    /** Plano de arrastre paralelo a la cámara que pasa por la posición dada. */
    updateGrabPlane(through) {
        const camDir = this.camera.getWorldDirection(this._dir);
        this.grabPlane.setFromNormalAndCoplanarPoint(camDir, through);
    }
    /* ------------------------- Caminata sobre el diente ---------------------- */
    /** Dirección apical de inserción en (θ, s) para orientar la sonda. */
    insertionDir(theta, s, out) {
        const y = this.lm.marginY(theta) - Math.max(0, s) - 0.001;
        toothPoint(theta, Math.max(y, -12.2), this._p);
        toothPoint(theta, Math.max(y - 0.6, -12.6), this._p2);
        out.copy(this._p2).sub(this._p);
        if (out.lengthSq() < 1e-8)
            out.set(0, -1, 0);
        return out.normalize();
    }
    /**
     * Punto de la superficie a arco |s| del margen (s>0 apical, s<0 coronal).
     * Devuelve el punto y la dirección de marcha.
     */
    walk(theta, s, out, dirOut) {
        const yM = this.lm.marginY(theta);
        const dirSign = s >= 0 ? -1 : 1;
        const step = 0.22;
        const target = Math.abs(s);
        let y = THREE.MathUtils.clamp(yM, -12.2, 10.5);
        let traveled = 0;
        toothPoint(theta, y, this._prev);
        out.copy(this._prev);
        dirOut.set(0, dirSign, 0);
        for (let k = 0; k < 90; k++) {
            const ny = y + dirSign * step;
            if (ny > 10.6 || ny < -12.5)
                break;
            toothPoint(theta, ny, this._cur);
            const d = this._cur.distanceTo(this._prev);
            if (traveled + d >= target) {
                const t = target - traveled;
                out.lerpVectors(this._prev, this._cur, d > 1e-6 ? t / d : 0);
                dirOut.copy(this._cur).sub(this._prev);
                if (dirOut.lengthSq() > 1e-8)
                    dirOut.normalize();
                else
                    dirOut.set(0, dirSign, 0);
                return;
            }
            traveled += d;
            this._prev.copy(this._cur);
            out.copy(this._cur);
            y = ny;
        }
    }
    /** Arco de superficie desde el margen hasta la altura yTarget. */
    arcToY(theta, yTarget) {
        const yM = this.lm.marginY(theta);
        const dirSign = yTarget <= yM ? -1 : 1;
        const step = 0.22;
        let y = THREE.MathUtils.clamp(yM, -12.2, 10.5);
        let traveled = 0;
        toothPoint(theta, y, this._prev);
        for (let k = 0; k < 90; k++) {
            const ny = y + dirSign * step;
            if ((dirSign < 0 && ny < yTarget) || (dirSign > 0 && ny > yTarget) || ny < -12.5 || ny > 10.6) {
                // tramo final fino
                toothPoint(theta, THREE.MathUtils.clamp(yTarget, -12.5, 10.6), this._cur);
                traveled += this._cur.distanceTo(this._prev);
                return traveled;
            }
            toothPoint(theta, ny, this._cur);
            traveled += this._cur.distanceTo(this._prev);
            this._prev.copy(this._cur);
            y = ny;
        }
        return traveled;
    }
    /** Punto del margen gingival en θ. */
    marginPoint(theta, out = new THREE.Vector3()) {
        return toothPoint(theta, this.lm.marginY(theta), out);
    }
    /** Punto de la cresta del rolle del margen en θ (zona de acople). */
    crestPoint(theta, out = new THREE.Vector3()) {
        const p = toothPoint(theta, this.lm.marginY(theta), out);
        const r = Math.hypot(p.x, p.z) || 1;
        const offset = 0.66 + this.cond.marginThickness;
        p.set((p.x / r) * (r + offset), p.y + 0.24 + this.cond.swell * 0.22, (p.z / r) * (r + offset));
        return p;
    }
    /* ----------------------------- Acoplamiento ----------------------------- */
    tryEngage() {
        if (this.engaged || !this.probe.group.visible)
            return;
        // Se evalúa sobre la posición objetivo (tipPos), que puede adelantarse a la
        // posición visual (suavizada) durante el arrastre. Se considera tanto el
        // anillo del margen como la cresta del rolle (relevante con edema).
        const tip = this.tipPos;
        if (tip.lengthSq() === 0)
            return;
        let bestTheta = 0;
        let bestD2 = Infinity;
        for (let i = 0; i < 72; i++) {
            const t = (i / 72) * Math.PI * 2;
            this.marginPoint(t, this._p);
            let d = this._p.distanceToSquared(tip);
            if (d < bestD2) {
                bestD2 = d;
                bestTheta = t;
            }
            this.crestPoint(t, this._p);
            d = this._p.distanceToSquared(tip) * 1.15; // cresta: tolerancia ligeramente mayor
            if (d < bestD2) {
                bestD2 = d;
                bestTheta = t;
            }
        }
        if (bestD2 < 1.5 * 1.5) {
            this.probe.group.position.copy(tip);
            this.engageAt(bestTheta);
        }
    }
    engageAt(theta) {
        this.theta = theta;
        this.engaged = true;
        this.bleedReset();
        // Arco inicial aproximado desde la posición actual de la punta
        const yM = this.lm.marginY(theta);
        const yTip = this.tipPos.lengthSq() > 0 ? this.tipPos.y : this.probe.group.position.y;
        const approxS = Math.max(0, Math.min(yM - yTip, this.arcToY(theta, this.lm.floorY(theta))));
        this.s = THREE.MathUtils.clamp(approxS, -1.2, this.arcToY(theta, this.lm.floorY(theta)));
        // Recolocar el plano de arrastre sobre la punta acoplada
        if (this.dragging) {
            this.updateGrabPlane(this.probe.group.position);
            this.raycaster.setFromCamera(this.ndc, this.camera);
            this.raycaster.ray.intersectPlane(this.grabPlane, this.lastPlanePt);
        }
    }
    /* ----------------------------- Colisiones -------------------------------- */
    applyFreeCollisions() {
        const tip = this.tipPos;
        const theta = Math.atan2(tip.x, tip.z);
        const y = tip.y;
        const r = Math.hypot(tip.x, tip.z) || 1e-4;
        const yClamped = THREE.MathUtils.clamp(y, -12.6, 10.6);
        const rT = toothRadius(theta, yClamped);
        // 1. Nunca dentro del diente
        if (r < rT + 0.34) {
            const k = (rT + 0.34) / r;
            tip.x *= k;
            tip.z *= k;
            return;
        }
        // 2. Túnel rápido hacia el surco: acoplar de inmediato
        if (y < this.lm.marginY(theta) && r < rT + 0.85 && y > this.lm.floorY(theta) - 1.2) {
            this.tipPos.copy(this.probe.group.position);
            this.engageAt(theta);
            return;
        }
        // 3. No atravesar encía ni hueso por fuera
        if (y < this.lm.marginY(theta) + 0.2 && r >= rT + 0.85) {
            const rG = this.lm.gumOuterR(theta, y);
            if (r < rG + 0.25) {
                const k = (rG + 0.25) / r;
                tip.x *= k;
                tip.z *= k;
            }
            if (y < this.lm.crestY(theta)) {
                const rB = boneOuterR(theta, y);
                const r2 = Math.hypot(tip.x, tip.z) || 1e-4;
                if (r2 < rB + 0.3) {
                    const k = (rB + 0.3) / r2;
                    tip.x *= k;
                    tip.z *= k;
                }
            }
        }
        // 4. Límites de la escena
        tip.y = THREE.MathUtils.clamp(tip.y, -14.5, 14);
        const rMax = Math.hypot(tip.x, tip.z);
        if (rMax > 34) {
            const k = 34 / rMax;
            tip.x *= k;
            tip.z *= k;
        }
    }
    /* -------------------------------- Guía ----------------------------------- */
    rebuildGuide() {
        if (!this.guideVisible)
            return;
        if (this.guideMesh) {
            this.guideMesh.geometry.dispose();
            this.guideMesh.geometry = new THREE.BufferGeometry();
        }
        const floorS = this.arcToY(this.theta, this.lm.floorY(this.theta));
        const pts = [];
        const steps = 16;
        for (let i = 0; i <= steps; i++) {
            const s = THREE.MathUtils.lerp(-1.8, floorS + 0.0, i / steps);
            this.walk(this.theta, s, this._p, this._dir);
            radialDir(this.theta, this._rad);
            pts.push(this._p.clone().addScaledVector(this._rad, 0.34));
        }
        const curve = new THREE.CatmullRomCurve3(pts);
        const geo = new THREE.TubeGeometry(curve, 48, 0.13, 8, false);
        if (!this.guideMesh) {
            this.guideMesh = new THREE.Mesh(geo, this.guideMat);
            this.guideMesh.renderOrder = 5;
            this.guideMesh.frustumCulled = false;
        }
        else {
            this.guideMesh.geometry = geo;
        }
        const inFocus = this.focusSite == null || siteFromTheta((this.theta * 180) / Math.PI) === this.focusSite;
        this.guideMat.color.set(inFocus ? "#2dd4bf" : "#e0b23e");
    }
    /* ------------------------------ Actualización ---------------------------- */
    update(dt, now) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        if (!this.engaged && this.dragging)
            this.tryEngage();
        const floorS = this.arcToY(this.theta, this.lm.floorY(this.theta));
        this.floorArcCache = floorS;
        if (this.engaged) {
            const rawS = this.s;
            this.s = THREE.MathUtils.clamp(this.s, -2.4, floorS);
            // Detección de presión excesiva (intentar seguir más allá del fondo)
            if (rawS - floorS > 0.9 && this.s > 0.4 && !this.overpressureLatched) {
                this.overpressureLatched = true;
                (_b = (_a = this.cb).onOverpressure) === null || _b === void 0 ? void 0 : _b.call(_a);
                // SANGRADO TRAUMÁTICO: forzar la sonda más allá del fondo lesiona
                // el epitelio de unión y provoca hemorragia incluso en tejido
                // sano (feedback clínico inmediato: se ve, como en la clínica).
                if (!this.bledThisInsertion) {
                    this.bledThisInsertion = true;
                    (_d = (_c = this.cb).onBleed) === null || _d === void 0 ? void 0 : _d.call(_c, siteFromTheta((this.theta * 180) / Math.PI));
                }
            }
            if (this.s < -1.6) {
                this.engaged = false;
                this.tipPos.copy(this.probe.group.position);
                this.bleedReset();
            }
            else {
                // Colocar la punta sobre la superficie del diente
                this.walk(this.theta, this.s, this._p, this._dir);
                radialDir(this.theta, this._rad);
                this.probe.group.position.copy(this._p).addScaledVector(this._rad, 0.34);
                // Orientación: mango opuesto a la dirección de inserción
                this.insertionDir(this.theta, this.s, this._dir);
                this._up.copy(this._dir).multiplyScalar(-1);
                this._q.setFromUnitVectors(UP, this._up);
                this.probe.group.quaternion.slerp(this._q, 1 - Math.pow(0.0001, dt));
            }
        }
        if (!this.engaged) {
            // Persecución por frame del objetivo de superficie bajo el cursor
            if (this.dragging && this.surfaceTarget) {
                this.tipPos.lerp(this.surfaceTarget, 1 - Math.pow(1e-9, dt));
                this.updateGrabPlane(this.tipPos);
            }
            this.applyFreeCollisions();
            this.probe.group.position.lerp(this.tipPos, 1 - Math.pow(0.0001, dt));
            // Orientación libre: vertical con ligera inclinación hacia fuera
            radialDir(Math.atan2(this.probe.group.position.x, this.probe.group.position.z), this._rad);
            this._up.copy(UP).addScaledVector(this._rad, 0.28).normalize();
            this._q.setFromUnitVectors(UP, this._up);
            this.probe.group.quaternion.slerp(this._q, 1 - Math.pow(0.02, dt));
        }
        /* — Transparencia dinámica de la encía — */
        const depth = this.engaged ? THREE.MathUtils.clamp(this.s, 0, floorS) : 0;
        const reveal = THREE.MathUtils.clamp((depth - 0.15) / 2.0, 0, 1);
        this.uniforms.uTipA.value.copy(this.probe.group.position);
        this._up.copy(UP).applyQuaternion(this.probe.group.quaternion);
        this.uniforms.uTipB.value
            .copy(this.probe.group.position)
            .addScaledVector(this._up, this.probe.tipSegment);
        this.uniforms.uReveal.value = reveal;
        this.uniforms.uRadius.value = THREE.MathUtils.clamp(2.4 + depth * 0.35, 2.4, 4.4);
        this.uniforms.uPush.value = depth > 0.05 ? 0.38 : Math.max(0, this.uniforms.uPush.value - dt * 2);
        /* — Guía — */
        if (this.guideVisible) {
            const thetaDeg = ((this.theta * 180) / Math.PI) % 360;
            if (!Number.isFinite(this.guideTheta) || Math.abs(thetaDeg - this.guideTheta) > 2.5) {
                this.guideTheta = thetaDeg;
                this.rebuildGuide();
            }
            if (this.guideFlash > 0) {
                this.guideFlash = Math.max(0, this.guideFlash - dt * 2.4);
                this.guideMat.color.lerpColors(new THREE.Color("#ffffff"), new THREE.Color("#2dd4bf"), 1 - this.guideFlash);
            }
        }
        /* — Contacto con el fondo y sangrado — */
        const floorContact = this.engaged && this.s >= floorS - 0.06 && this.s > 0.3;
        if (floorContact && !this.floorContactLatch) {
            this.floorContactLatch = true;
            this.guideFlash = 1;
            (_d = (_c = this.cb).onFloorContact) === null || _d === void 0 ? void 0 : _d.call(_c, siteFromTheta((this.theta * 180) / Math.PI));
        }
        if (!floorContact)
            this.floorContactLatch = false;
        const site = siteFromTheta((this.theta * 180) / Math.PI);
        if (floorContact && !this.bledThisInsertion && this.cond.bleedingSites.includes(site)) {
            this.bledThisInsertion = true;
            (_f = (_e = this.cb).onBleed) === null || _f === void 0 ? void 0 : _f.call(_e, site);
        }
        if (this.s < 0.25) {
            this.bledThisInsertion = false;
            this.overpressureLatched = false;
        }
        /* — Emisión de estado (throttle) — */
        if (now - this.lastEmit > 90) {
            this.lastEmit = now;
            this.emitState(depth, floorContact, site);
        }
    }
    emitState(depth, floorContact, site) {
        var _a, _b;
        const st = {
            depth: round1(depth),
            engaged: this.engaged,
            inside: this.engaged && this.s > 0.15,
            floorContact,
            site,
            thetaDeg: Math.round((this.theta * 180) / Math.PI),
            bled: this.bledThisInsertion,
            dragging: this.dragging,
        };
        const prev = this.lastState;
        const changed = !prev ||
            prev.depth !== st.depth ||
            prev.engaged !== st.engaged ||
            prev.inside !== st.inside ||
            prev.floorContact !== st.floorContact ||
            prev.site !== st.site ||
            prev.bled !== st.bled ||
            prev.dragging !== st.dragging;
        if (changed) {
            this.lastState = st;
            (_b = (_a = this.cb).onStateChange) === null || _b === void 0 ? void 0 : _b.call(_a, st);
        }
    }
    getState() {
        const floorS = this.floorArcCache;
        const depth = this.engaged ? THREE.MathUtils.clamp(this.s, 0, floorS) : 0;
        return {
            depth: round1(depth),
            engaged: this.engaged,
            inside: this.engaged && this.s > 0.15,
            floorContact: this.engaged && this.s >= floorS - 0.06 && this.s > 0.3,
            site: siteFromTheta((this.theta * 180) / Math.PI),
            thetaDeg: Math.round((this.theta * 180) / Math.PI),
            bled: this.bledThisInsertion,
            dragging: this.dragging,
        };
    }
    /** Profundidad real del sitio actual (fondo del surco). */
    getFloorArc() {
        return round1(this.floorArcCache);
    }
    /** Profundidad verdadera de un sitio para evaluaciones. */
    siteTrueDepth(site) {
        const def = SITES.find((s) => s.id === site);
        const theta = (def.theta * Math.PI) / 180;
        return round1(this.arcToY(theta, this.lm.floorY(theta)));
    }
    dispose() {
        if (this.guideMesh) {
            this.guideMesh.geometry.dispose();
        }
        this.guideMat.dispose();
    }
}
