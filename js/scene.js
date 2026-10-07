/* AR PERIO — scene.js (portado de src/3d/scene.ts) */
/**
 * AR PERIO — Escena periodontal 3D.
 *
 * Orquesta: modelo anatómico paramétrico (diente + encía + hueso + PDL),
 * sonda virtual, iluminación clínica PBR, controles de cámara, capas
 * anatómicas, modos de visualización y controlador de sondaje.
 *
 * ARQUITECTURA: para añadir un nuevo diente (FASE 5) basta implementar su
 * geometría en src/3d y registrarla en data/models.ts; la escena, los
 * módulos y el periodontograma no cambian.
 */
const LAYER_LABELS = {
    diente: "Diente",
    esmalte: "Esmalte",
    dentina: "Dentina",
    raiz: "Raíz",
    pulpa: "Pulpa",
    encia: "Encía",
    ligamento: "Ligamento periodontal",
    hueso: "Hueso alveolar",
    sonda: "Sonda periodontal",
};
class PeriodontalScene {
    constructor(container, opts = {}) {
        var _a;
        this.scene = new THREE.Scene();
        this.raf = 0;
        this.lastT = 0;
        this.disposed = false;
        this.enamelMat = createEnamelMaterial();
        this.dentinMat = createDentinMaterial();
        this.rootMat = createRootMaterial();
        this.pulpMat = createPulpMaterial();
        this.boneMat = new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.62, metalness: 0, side: THREE.DoubleSide, envMapIntensity: 0.4 });
        this.pdlMat = new THREE.MeshPhysicalMaterial({ color: "#d98f86", roughness: 0.6, transparent: true, opacity: 0.92, side: THREE.DoubleSide, envMapIntensity: 0.35 });
        this.gumUniforms = createGumUniforms();
        this.stains = new Map();
        this.stainAnim = new Map();
        this.layers = {
            diente: true,
            esmalte: true,
            dentina: true,
            raiz: true,
            pulpa: false,
            encia: true,
            ligamento: false,
            hueso: false,
            sonda: true,
        };
        this.mode = "clinico";
        this.tween = null;
        this.cb = {};
        this.loop = (t) => {
            if (this.disposed)
                return;
            this.raf = requestAnimationFrame(this.loop);
            const dt = Math.min(0.05, (t - this.lastT) / 1000);
            this.lastT = t;
            if (this.tween) {
                this.tween.t = Math.min(1, this.tween.t + dt / 0.65);
                const k = easeInOutCubic(this.tween.t);
                this.camera.position.lerpVectors(this.tween.fromPos, this.tween.toPos, k);
                this.controls.target.lerpVectors(this.tween.fromTarget, this.tween.toTarget, k);
                if (this.tween.t >= 1)
                    this.tween = null;
            }
            this.controller.update(dt, t);
            // Rotación de cortesía: la escena gira suavemente tras 5 s sin
            // interacción (se detiene al instante al tocar el visor o la sonda)
            this.controls.autoRotate = !!(this.idleSpin && !this.tween && this.pointersDown === 0 && t - this.lastInteract > 5000);
            this.controls.update();
            // SSS: dirección de la luz clave en espacio de vista (por frame)
            if (this.gumUniforms && this.gumUniforms.uKeyLightDir) {
                this.gumUniforms.uKeyLightDir.value.copy(this.keyLightDir).transformDirection(this.camera.matrixWorldInverse);
            }
            // Animación de manchas de sangrado (emergen y se estabilizan)
            for (const [site, mesh] of this.stains) {
                const a = this.stainAnim.get(site);
                if (a !== undefined && a < 1) {
                    const na = Math.min(1, a + dt * 2.2);
                    this.stainAnim.set(site, na);
                    const k = easeOutBack(na);
                    mesh.scale.set(2.05 * k, 0.68 * k, 1.5 * k);
                }
            }
            this.renderer.render(this.scene, this.camera);
        };
        this.container = container;
        this.cond = conditionById((_a = opts.conditionId) !== null && _a !== void 0 ? _a : "sano");
        this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setSize(container.clientWidth || 640, container.clientHeight || 480, false);
        // Realismo: espacio de color sRGB, luces físicas y tono ACES
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.physicallyCorrectLights = true;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.12;
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        const canvas = this.renderer.domElement;
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        canvas.style.display = "block";
        canvas.style.touchAction = "none";
        container.appendChild(canvas);
        this.camera = new THREE.PerspectiveCamera(33, 1, 1, 600);
        this.camera.position.set(...VIEW_PRESETS.inicio.pos);
        this.controls = new THREE.OrbitControls(this.camera, canvas);
        this.controls.target.set(...VIEW_PRESETS.inicio.target);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.08;
        this.controls.rotateSpeed = 0.85;
        this.controls.zoomSpeed = 0.95;
        this.controls.minDistance = 14;
        this.controls.maxDistance = 150;
        this.controls.maxPolarAngle = Math.PI * 0.92;
        this.controls.enablePan = true;
        // Rotación de cortesía (autoRotate de OrbitControls): gira ~1.5°/s
        // solo cuando nadie interactúa. Cualquier toque la detiene al instante.
        this.idleSpin = opts.idleSpin !== false;
        this.lastInteract = performance.now();
        this.pointersDown = 0;
        this.controls.autoRotateSpeed = 0.5;
        const markInteract = () => { this.lastInteract = performance.now(); };
        this._onCanvasDown = () => { this.pointersDown++; markInteract(); };
        this._onWinUp = () => { if (this.pointersDown > 0) this.pointersDown--; markInteract(); };
        this._onWheel = () => markInteract();
        canvas.addEventListener("pointerdown", this._onCanvasDown, { passive: true });
        window.addEventListener("pointerup", this._onWinUp, { passive: true });
        canvas.addEventListener("wheel", this._onWheel, { passive: true });
        // Fondo: degradado de estudio clínico (matiz teal oscuro)
        this.scene.background = this.makeBackground();
        this.scene.fog = new THREE.Fog(0x0a1512, 190, 420);
        // Entorno PBR: estudio fotográfico propio (softboxes cálidos/fríos + rebote)
        this.pmrem = new THREE.PMREMGenerator(this.renderer);
        this.scene.environment = this.pmrem.fromScene(this.makeStudioEnv(), 0.04).texture;
        this.setupLights();
        this.buildAnatomy();
        this.buildProbeAndController(opts.probeVisible !== false);
        this.applyMode(this.mode);
        this.applyLayers();
        canvas.addEventListener("webglcontextlost", (e) => {
            var _a, _b;
            e.preventDefault();
            (_b = (_a = this.cb).onContextLost) === null || _b === void 0 ? void 0 : _b.call(_a);
        });
        this.resizeObs = new ResizeObserver(() => this.resize());
        this.resizeObs.observe(container);
        this.resize();
        // Hook de inspección (útil para pruebas E2E y depuración)
        if (typeof window !== "undefined") {
            window.__arperio = this;
        }
        this.lastT = performance.now();
        this.loop(this.lastT);
    }
    /* ------------------------------ Construcción ---------------------------- */
    makeBackground() {
        // Fondo de estudio con viñeta radial: foco suave centrado y bordes oscuros
        const c = document.createElement("canvas");
        c.width = 512;
        c.height = 512;
        const ctx = c.getContext("2d");
        const lin = ctx.createLinearGradient(0, 0, 0, 512);
        lin.addColorStop(0, "#17322b");
        lin.addColorStop(0.5, "#0f221d");
        lin.addColorStop(1, "#091411");
        ctx.fillStyle = lin;
        ctx.fillRect(0, 0, 512, 512);
        const rad = ctx.createRadialGradient(256, 222, 36, 256, 240, 358);
        rad.addColorStop(0, "rgba(58,110,99,0.20)");
        rad.addColorStop(0.45, "rgba(22,48,41,0.10)");
        rad.addColorStop(1, "rgba(3,10,8,0.66)");
        ctx.fillStyle = rad;
        ctx.fillRect(0, 0, 512, 512);
        const tex = new THREE.CanvasTexture(c);
        tex.encoding = THREE.sRGBEncoding;
        return tex;
    }
    /* Entorno de estudio: softboxes HDR suaves para speculars realistas */
    makeStudioEnv() {
        const env = new THREE.Scene();
        const addPanel = (w, h, color, intensity, x, y, z) => {
            const mat = new THREE.MeshBasicMaterial({
                color: new THREE.Color(color).multiplyScalar(intensity),
                side: THREE.DoubleSide,
            });
            const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
            p.position.set(x, y, z);
            p.lookAt(0, 0, 0);
            env.add(p);
        };
        // cúpula neutra oscura (estudio)
        env.add(new THREE.Mesh(new THREE.SphereGeometry(40, 24, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color("#39464a").multiplyScalar(0.85), side: THREE.BackSide })));
        addPanel(16, 10, "#fff3e2", 5.5, 18, 24, 18);  // softbox principal (cálido)
        addPanel(12, 8, "#dcefea", 2.2, -24, 10, -12); // relleno (frío)
        addPanel(10, 6, "#ffffff", 3.2, -8, 20, -24);  // contra (rim)
        addPanel(24, 24, "#e8cfc2", 0.85, 0, -30, 0);  // rebote inferior cálido (mucosa)
        return env;
    }
    setupLights() {
        const key = new THREE.DirectionalLight(0xfff2e2, 3.0);
        key.position.set(16, 28, 20);
        key.castShadow = true;
        key.shadow.mapSize.set(2048, 2048);
        key.shadow.radius = 7; // penumbra suave
        key.shadow.camera.left = -18;
        key.shadow.camera.right = 18;
        key.shadow.camera.top = 18;
        key.shadow.camera.bottom = -18;
        key.shadow.camera.near = 4;
        key.shadow.camera.far = 90;
        key.shadow.bias = -0.0002;
        key.shadow.normalBias = 0.025;
        this.scene.add(key);
        // dirección de la luz clave (para el SSS de la encía)
        this.keyLightDir = key.position.clone().normalize();
        const fill = new THREE.DirectionalLight(0xdff2ee, 0.55);
        fill.position.set(-20, 8, -14);
        this.scene.add(fill);
        const rim = new THREE.DirectionalLight(0xe8f6f2, 1.28);
        rim.position.set(-6, 18, -26);
        this.scene.add(rim);
        this.scene.add(new THREE.HemisphereLight(0xe8f2ef, 0x16221f, 0.35));
        // rebote cálido inferior (luz devuelta por la mucosa/piel)
        const bounce = new THREE.DirectionalLight(0xffd9c4, 0.16);
        bounce.position.set(2, -18, 10);
        this.scene.add(bounce);
        // Pedestal con desvanecimiento radial: se funde con el fondo (sin borde duro)
        const floorTex = (() => {
            const c = document.createElement("canvas");
            c.width = 256;
            c.height = 256;
            const ctx = c.getContext("2d");
            const g = ctx.createRadialGradient(128, 128, 6, 128, 128, 127);
            g.addColorStop(0, "rgba(34,56,49,0.98)");
            g.addColorStop(0.55, "rgba(23,40,35,0.80)");
            g.addColorStop(1, "rgba(17,29,25,0)");
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, 256, 256);
            const t = new THREE.CanvasTexture(c);
            t.encoding = THREE.sRGBEncoding;
            return t;
        })();
        const pedestal = new THREE.Mesh(new THREE.CircleGeometry(34, 64), new THREE.MeshStandardMaterial({
            map: floorTex, transparent: true, roughness: 0.95, metalness: 0, depthWrite: false,
        }));
        pedestal.rotation.x = -Math.PI / 2;
        pedestal.position.y = -14.6;
        pedestal.receiveShadow = true;
        this.scene.add(pedestal);
    }
    buildAnatomy() {
        this.enamel = new THREE.Mesh(makeEnamelGeometry(), this.enamelMat);
        this.dentin = new THREE.Mesh(makeDentinGeometry(), this.dentinMat);
        this.rootMesh = new THREE.Mesh(makeRootGeometry(), this.rootMat);
        this.pulp = new THREE.Mesh(makePulpGeometry(), this.pulpMat);
        for (const m of [this.enamel, this.dentin, this.rootMesh]) {
            m.castShadow = true;
            m.receiveShadow = true;
        }
        this.scene.add(this.enamel, this.dentin, this.rootMesh, this.pulp);
        this.buildPeriodontium();
    }
    buildPeriodontium() {
        var _a;
        const { mesh, landmarks } = buildGingiva(this.cond);
        if (this.gum) {
            this.scene.remove(this.gum);
            this.gum.geometry.dispose();
        }
        if (!this.gumMat) {
            this.gumMat = createGumMaterial(this.gumUniforms);
        }
        this.gum = mesh;
        this.gum.material = this.gumMat;
        this.gum.renderOrder = 3;
        this.scene.add(this.gum);
        const { bone, pdl } = buildBoneAndPdl(this.cond, landmarks);
        if (this.bone) {
            this.scene.remove(this.bone);
            this.bone.geometry.dispose();
        }
        if (this.pdl) {
            this.scene.remove(this.pdl);
            this.pdl.geometry.dispose();
        }
        this.bone = bone;
        this.bone.material = this.boneMat;
        this.bone.renderOrder = 1;
        this.pdl = pdl;
        this.pdl.material = this.pdlMat;
        this.pdl.renderOrder = 2;
        this.scene.add(this.bone, this.pdl);
        this.landmarks = landmarks;
        this.gumUniforms.uMarginY.value = landmarks.marginAvgY;
        this.gumUniforms.uBaseY.value = landmarks.baseAvgY;
        this.clearStains();
        (_a = this.controller) === null || _a === void 0 ? void 0 : _a.setAnatomyTargets([this.gum, this.enamel, this.rootMesh, this.bone]);
    }
    buildProbeAndController(probeVisible) {
        this.probe = buildProbe();
        this.probe.group.visible = probeVisible;
        this.scene.add(this.probe.group);
        this.controller = new ProbingController({
            camera: this.camera,
            controls: this.controls,
            canvas: this.renderer.domElement,
            wrapper: this.container,
            probe: this.probe,
            uniforms: this.gumUniforms,
            landmarks: this.landmarks,
            condition: this.cond,
            callbacks: {
                onStateChange: (s) => { var _a, _b; return (_b = (_a = this.cb).onProbeState) === null || _b === void 0 ? void 0 : _b.call(_a, s); },
                onFloorContact: (s) => { var _a, _b; return (_b = (_a = this.cb).onFloorContact) === null || _b === void 0 ? void 0 : _b.call(_a, s); },
                onBleed: (s) => {
                    var _a, _b;
                    this.showStain(s);
                    (_b = (_a = this.cb).onBleed) === null || _b === void 0 ? void 0 : _b.call(_a, s);
                },
                onOverpressure: () => { var _a, _b; return (_b = (_a = this.cb).onOverpressure) === null || _b === void 0 ? void 0 : _b.call(_a); },
            },
        });
        const guideObj = this.controller.getGuideObject();
        if (guideObj)
            this.scene.add(guideObj);
        this.controller.setAnatomyTargets([this.gum, this.enamel, this.rootMesh, this.bone]);
    }
    /* -------------------------------- Sangrado ------------------------------- */
    stainMat() {
        return new THREE.MeshPhysicalMaterial({
            color: "#8f1420",
            roughness: 0.18,
            clearcoat: 0.85,
            clearcoatRoughness: 0.12,
            transparent: true,
            opacity: 0.74,
        });
    }
    showStain(site) {
        // El sangrado es un SIGNO clínico: siempre se representa al provocarlo
        // (no depende de la opción de registro del BOP en el periodontograma).
        let m = this.stains.get(site);
        if (!m) {
            m = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), this.stainMat());
            m.scale.set(0.01, 0.01, 0.01);
            m.renderOrder = 4;
            this.stains.set(site, m);
            this.scene.add(m);
        }
        this.stainAnim.set(site, 0);
        // Posición: margen gingival en el ángulo central del sitio
        const theta = this.siteTheta(site);
        const p = new THREE.Vector3();
        this.controller.marginPoint(theta, p);
        const rad = new THREE.Vector3(Math.sin(theta), 0, Math.cos(theta));
        m.position.copy(p).addScaledVector(rad, 0.42);
        m.position.y -= 0.12;
    }
    siteTheta(site) {
        var _a;
        const def = SITES.find((s) => s.id === site);
        return (((_a = def === null || def === void 0 ? void 0 : def.theta) !== null && _a !== void 0 ? _a : 0) * Math.PI) / 180;
    }
    clearStains() {
        for (const m of this.stains.values()) {
            this.scene.remove(m);
            m.material.dispose();
            m.geometry.dispose();
        }
        this.stains.clear();
        this.stainAnim.clear();
    }
    /* ------------------------------ Comandos --------------------------------- */
    setCondition(conditionId) {
        this.cond = conditionById(conditionId);
        this.buildPeriodontium();
        this.controller.setLandmarks(this.landmarks, this.cond);
        this.controller.reset();
        this.applyMode(this.mode);
        this.applyLayers();
    }
    getConditionId() {
        return this.cond.id;
    }
    setLayer(id, visible) {
        this.layers[id] = visible;
        if (id === "diente") {
            this.layers.esmalte = visible;
            this.layers.dentina = visible;
            this.layers.raiz = visible;
        }
        this.applyLayers();
    }
    getLayers() {
        return { ...this.layers };
    }
    applyLayers() {
        this.enamel.visible = this.layers.diente && this.layers.esmalte;
        this.dentin.visible = this.layers.diente && this.layers.dentina;
        this.rootMesh.visible = this.layers.diente && this.layers.raiz;
        this.pulp.visible = this.layers.pulpa;
        this.gum.visible = this.layers.encia;
        this.pdl.visible = this.layers.ligamento;
        this.bone.visible = this.layers.hueso;
        this.probe.group.visible = this.layers.sonda;
    }
    setMode(m) {
        this.mode = m;
        this.applyMode(m);
        this.applyLayers();
    }
    getMode() {
        return this.mode;
    }
    applyMode(m) {
        if (m === "clinico") {
            this.layers.diente = true;
            this.layers.esmalte = true;
            this.layers.dentina = true;
            this.layers.raiz = true;
            this.layers.pulpa = false;
            this.layers.encia = true;
            this.layers.ligamento = false;
            this.layers.hueso = false;
            setOpacity(this.enamelMat, 1);
            setOpacity(this.dentinMat, 1);
            setOpacity(this.rootMat, 1);
            this.gumUniforms.uBaseAlpha.value = 1;
            setOpacity(this.boneMat, 1);
            setOpacity(this.pdlMat, 0.92);
        }
        else if (m === "anatomico") {
            this.layers.diente = true;
            this.layers.esmalte = true;
            this.layers.dentina = true;
            this.layers.raiz = true;
            this.layers.pulpa = true;
            this.layers.encia = true;
            this.layers.ligamento = true;
            this.layers.hueso = true;
            setOpacity(this.enamelMat, 0.26);
            setOpacity(this.dentinMat, 0.72);
            setOpacity(this.rootMat, 0.5);
            this.gumUniforms.uBaseAlpha.value = 0.3;
            setOpacity(this.boneMat, 0.5);
            setOpacity(this.pdlMat, 0.95);
        }
        else {
            // transparente
            this.layers.diente = true;
            this.layers.esmalte = true;
            this.layers.dentina = true;
            this.layers.raiz = true;
            this.layers.pulpa = false;
            this.layers.encia = true;
            this.layers.ligamento = true;
            this.layers.hueso = true;
            setOpacity(this.enamelMat, 0.9);
            setOpacity(this.dentinMat, 1);
            setOpacity(this.rootMat, 1);
            this.gumUniforms.uBaseAlpha.value = 0.2;
            setOpacity(this.boneMat, 0.4);
            setOpacity(this.pdlMat, 0.95);
        }
    }
    setView(v) {
        const p = VIEW_PRESETS[v];
        this.tween = {
            fromPos: this.camera.position.clone(),
            toPos: new THREE.Vector3(...p.pos),
            fromTarget: this.controls.target.clone(),
            toTarget: new THREE.Vector3(...p.target),
            t: 0,
        };
        if (v === "anatomica") {
            this.setMode("anatomico");
        }
    }
    resetView() {
        this.setView("inicio");
    }
    setProbeVisible(v) {
        this.layers.sonda = v;
        this.applyLayers();
    }
    resetProbe() {
        this.controller.reset();
    }
    setGuide(v) {
        this.controller.setGuideVisible(v);
    }
    setFocusSite(site) {
        this.controller.setFocusSite(site);
    }
    getProbeState() {
        return this.controller.getState();
    }
    siteTrueDepth(site) {
        return this.controller.siteTrueDepth(site);
    }
    registerMeasurement() {
        const st = this.controller.getState();
        if (!st.engaged || st.depth < 0.2)
            return null;
        return {
            site: st.site,
            measured: st.depth,
            actual: this.controller.getFloorArc(),
            conditionId: this.cond.id,
            bled: st.bled,
        };
    }
    /* ------------------------------- Bucle ----------------------------------- */
    resize() {
        const w = this.container.clientWidth;
        const h = this.container.clientHeight;
        if (w === 0 || h === 0)
            return;
        this.renderer.setSize(w, h, false);
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
    }
    dispose() {
        this.disposed = true;
        cancelAnimationFrame(this.raf);
        this.resizeObs.disconnect();
        this.controller.dispose();
        window.removeEventListener("pointerup", this._onWinUp);
        this.clearStains();
        this.scene.traverse((o) => {
            if (o instanceof THREE.Mesh) {
                o.geometry.dispose();
                const mats = Array.isArray(o.material) ? o.material : [o.material];
                for (const m of mats)
                    m.dispose();
            }
        });
        this.pmrem.dispose();
        this.controls.dispose();
        this.renderer.dispose();
        if (this.renderer.domElement.parentElement === this.container) {
            this.container.removeChild(this.renderer.domElement);
        }
    }
}
