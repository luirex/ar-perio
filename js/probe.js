/* AR PERIO — probe.js (portado de src/3d/probe.ts) */
/**
 * AR PERIO — Sonda periodontal virtual (tipo Williams).
 *
 * Punta redondeada, vástago metálico con bandas milimétricas en
 * 1-2-3-5-7-8-10 mm y mango hexagonal con banda de identificación.
 * El grupo se posiciona con el ORIGEN EN LA PUNTA y el mango hacia +Y,
 * de modo que orientar el grupo equivale a dirigir la sonda.
 */
function buildProbe() {
    const group = new THREE.Group();
    const steel = new THREE.MeshPhysicalMaterial({
        color: "#d3d7db",
        metalness: 0.98,
        roughness: 0.16,
        clearcoat: 0.4,
        clearcoatRoughness: 0.2,
        envMapIntensity: 1.25,
    });
    const darkSteel = new THREE.MeshPhysicalMaterial({
        color: "#2a2e31",
        metalness: 0.85,
        roughness: 0.38,
        envMapIntensity: 0.8,
    });
    const gripColor = new THREE.MeshPhysicalMaterial({
        color: "#b0524d",
        metalness: 0.35,
        roughness: 0.42,
        clearcoat: 0.5,
        envMapIntensity: 0.9,
    });
    // Punta redondeada
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.4, 24, 16), steel);
    group.add(ball);
    // Vástago cónico (0.33 → 0.42 mm de radio)
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.42, 12.5, 20), steel);
    shaft.position.y = 6.25 + 0.3;
    group.add(shaft);
    // Bandas milimétricas (Williams: 1, 2, 3, 5, 7, 8, 10)
    for (const mm of [1, 2, 3, 5, 7, 8, 10]) {
        const band = new THREE.Mesh(new THREE.TorusGeometry(0.345, 0.055, 10, 36), darkSteel);
        band.rotation.x = Math.PI / 2;
        band.position.y = mm;
        group.add(band);
    }
    // Transición al mango
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.55, 2.2, 24), steel);
    collar.position.y = 13.6;
    group.add(collar);
    // Mango hexagonal
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.0, 34, 6), steel);
    handle.position.y = 13.9 + 17;
    group.add(handle);
    // Bandas de agarre de color
    for (const y of [22, 27, 32, 37, 42]) {
        const ring = new THREE.Mesh(new THREE.CylinderGeometry(2.06, 2.06, 1.7, 6), gripColor);
        ring.position.y = y;
        group.add(ring);
    }
    // Extremo posterior redondeado
    const cap = new THREE.Mesh(new THREE.SphereGeometry(2.0, 20, 12), steel);
    cap.position.y = 47.4;
    group.add(cap);
    group.traverse((o) => {
        if (o instanceof THREE.Mesh) {
            o.castShadow = true;
            o.receiveShadow = false;
        }
    });
    // Volúmenes invisibles de agarre (más generosos que la geometría real)
    const ghost = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false });
    const tipHit = new THREE.Mesh(new THREE.SphereGeometry(2.6, 12, 8), ghost);
    tipHit.position.y = 1.2;
    group.add(tipHit);
    const handleHit = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.2, 40, 8), ghost);
    handleHit.position.y = 34;
    group.add(handleHit);
    return { group, tipHit, handleHit, tipSegment: 5.5 };
}
