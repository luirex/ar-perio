/* AR PERIO — materials.js · Materiales PBR + TRANSPARENCIA DINÁMICA + REALISMO
 *
 * Encía (MeshPhysicalMaterial parcheado vía onBeforeCompile):
 *  1. Vértices: desplazamiento local del tejido alrededor de la sonda.
 *  2. Fragmentos:
 *     - Transparencia LOCALIZADA y PROGRESIVA alrededor del segmento insertado
 *       de la sonda (cápsula uTipA→uTipB), recalculada cada frame.
 *     - SSS: término de translucencia de tejido delgado (luz que atraviesa la
 *       encía marginal desde atrás) + difusión cálida envolvente (medio-lambert).
 *     - Estipulación en dos escalas de la encía adherida + variación tonal
 *       orgánica + poros brillantes que rompen la specular plana.
 *
 * Esmalte: clearcoat húmedo + perikymata (líneas incrementales cervicales) +
 * opalescencia incisal, calculadas por shader a partir de la posición.
 */

/* ------------------------ Encía con parche de shader --------------------- */

function createGumUniforms() {
    return {
        uTipA: { value: new THREE.Vector3(0, -60, 0) },
        uTipB: { value: new THREE.Vector3(0, -60, 0) },
        uReveal: { value: 0 },
        uRadius: { value: 3.0 },
        uPush: { value: 0 },
        uBaseAlpha: { value: 1 },
        uMarginY: { value: 1.45 },
        uBaseY: { value: -4.5 },
        // Dirección de la luz clave en ESPACIO DE VISTA (se actualiza por frame)
        uKeyLightDir: { value: new THREE.Vector3(0.3, 0.5, 0.8) },
    };
}

const VERT_HEAD = `
uniform vec3 uTipA;
uniform vec3 uTipB;
uniform float uPush;
varying vec3 vArPos;
`;

const VERT_BODY = `
{
  vec3 arBA = uTipB - uTipA;
  vec3 arPA = position - uTipA;
  float arH = clamp(dot(arPA, arBA) / max(dot(arBA, arBA), 1e-6), 0.0, 1.0);
  vec3 arClosest = uTipA + arBA * arH;
  vec3 arAway = position - arClosest;
  float arD = length(arAway);
  float arPush = uPush * (1.0 - smoothstep(0.15, 2.4, arD));
  if (arD > 1e-5) { transformed += (arAway / arD) * arPush; }
  vArPos = transformed;
}
`;

const FRAG_HEAD = `
uniform vec3 uTipA;
uniform vec3 uTipB;
uniform float uReveal;
uniform float uRadius;
uniform float uBaseAlpha;
uniform float uMarginY;
uniform float uBaseY;
uniform vec3 uKeyLightDir;
varying vec3 vArPos;
float arHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
`;

const FRAG_BODY = `
{
  /* ——— Transparencia localizada dependiente de la sonda ——— */
  vec3 arBA = uTipB - uTipA;
  vec3 arPA = vArPos - uTipA;
  float arH = clamp(dot(arPA, arBA) / max(dot(arBA, arBA), 1e-6), 0.0, 1.0);
  float arD = length(arPA - arBA * arH);
  float arReveal = uReveal * (1.0 - smoothstep(uRadius * 0.22, uRadius, arD));
  diffuseColor.a *= uBaseAlpha * mix(1.0, 0.10, arReveal);
  // enriquecimiento eritematoso de la zona revelada
  diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.86, 0.52, 0.52), arReveal * 0.45);

  /* ——— SSS: translucencia de tejido delgado ——— */
  vec3 arV = normalize(-vViewPosition);          // hacia la cámara (espacio vista)
  vec3 arN = normalize(vNormal);
  vec3 arL = normalize(uKeyLightDir);            // hacia la luz (espacio vista)
  // grosor relativo: fino cerca del margen → más dispersión de luz
  float arThin = smoothstep(uBaseY + 2.0, uMarginY, vArPos.y);
  float arBack = pow(clamp(dot(arV, -(arL + arN * 0.36)), 0.0, 1.0), 2.0);
  diffuseColor.rgb += vec3(0.46, 0.10, 0.075) * (arBack * (0.38 + 0.95 * arThin));
  // difusión frontal cálida (medio-lambert): aspecto de mucosa viva
  float arWrap = clamp(dot(arN, arL) * 0.5 + 0.5, 0.0, 1.0);
  diffuseColor.rgb *= 0.78 + 0.22 * arWrap;

  /* ——— Textura clínica de la encía ——— */
  // estipulación en dos escalas (puntizado de naranja de la encía adherida)
  float arZone = smoothstep(uMarginY - 1.0, uMarginY - 2.2, vArPos.y)
               * smoothstep(uBaseY + 1.4, uBaseY + 3.0, vArPos.y);
  vec2 arP1 = vArPos.xz * 2.3 + vec2(vArPos.y * 0.85);
  vec2 arP2 = vArPos.xz * 1.15 + vec2(vArPos.y * 0.55);
  float arS1 = arHash(floor(arP1));
  float arS2 = arHash(floor(arP2) + 7.31);
  float arStip = step(0.74, arS1) * 0.095 + step(0.82, arS2) * 0.075;
  diffuseColor.rgb *= 1.0 - arZone * arStip;
  // poros brillantes: rompen la specular uniforme del tejido
  diffuseColor.rgb += vec3(0.05) * arZone * step(0.955, arS1);
  // vascularización: finos vasos que ascienden hacia el margen
  float arAng = atan(vArPos.x, vArPos.z);
  float arVessel = smoothstep(0.62, 0.92, arHash(vec2(floor(arAng * 22.0), floor((vArPos.y - uBaseY) * 1.3))));
  float arMargBand = smoothstep(uMarginY - 3.2, uMarginY - 0.5, vArPos.y)
                   * (1.0 - smoothstep(uMarginY - 0.5, uMarginY + 0.2, vArPos.y));
  diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.80, 0.40, 0.40), arVessel * arMargBand * 0.30);
  // película salival: brillo húmedo fino que recorre el margen gingival
  float arWet = smoothstep(uMarginY - 0.62, uMarginY - 0.10, vArPos.y)
              * (1.0 - smoothstep(uMarginY + 0.20, uMarginY + 0.72, vArPos.y));
  diffuseColor.rgb += vec3(0.028, 0.036, 0.040) * arWet;
  // variación tonal sutil (evita una encía "plástica")
  float arVar = sin(vArPos.x * 0.55 + vArPos.y * 0.35) * sin(vArPos.z * 0.62 - vArPos.y * 0.22);
  diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.95, 0.87, 0.885),
                         arZone * smoothstep(0.25, 0.85, arVar) * 0.5);
}
`;

/* Variación de rugosidad de la estipulación: rompe el especular plano
   (efecto "piel de naranja" al mover la luz). */
const FRAG_ROUGHNESS = `
{
  float arZoneR = smoothstep(uMarginY - 1.0, uMarginY - 2.2, vArPos.y)
                * smoothstep(uBaseY + 1.4, uBaseY + 3.0, vArPos.y);
  float arS1R = arHash(floor(vArPos.xz * 2.3 + vec2(vArPos.y * 0.85)));
  float arS2R = arHash(floor(vArPos.xz * 1.15 + vec2(vArPos.y * 0.55)) + 7.31);
  roughnessFactor = clamp(roughnessFactor + arZoneR * (step(0.70, arS1R) * 0.30 + step(0.80, arS2R) * 0.22), 0.10, 1.0);
  // película salival: el margen se vuelve más liso y especular (aspecto húmedo)
  float arWetR = smoothstep(uMarginY - 0.62, uMarginY - 0.10, vArPos.y)
               * (1.0 - smoothstep(uMarginY + 0.22, uMarginY + 0.75, vArPos.y));
  roughnessFactor = clamp(roughnessFactor - arWetR * 0.14, 0.08, 1.0);
}
`;

function createGumMaterial(uniforms) {
    const mat = new THREE.MeshPhysicalMaterial({
        vertexColors: true,
        color: "#ffffff",
        roughness: 0.36,
        metalness: 0,
        clearcoat: 0.30,
        clearcoatRoughness: 0.42,
        sheen: 0.32,
        sheenRoughness: 0.52,
        sheenColor: new THREE.Color("#e8a49c"),
        transparent: true,
        side: THREE.DoubleSide,
        envMapIntensity: 0.55,
    });
    mat.customProgramCacheKey = () => "arperio-gum-v4";
    mat.onBeforeCompile = (shader) => {
        shader.uniforms.uTipA = uniforms.uTipA;
        shader.uniforms.uTipB = uniforms.uTipB;
        shader.uniforms.uReveal = uniforms.uReveal;
        shader.uniforms.uRadius = uniforms.uRadius;
        shader.uniforms.uPush = uniforms.uPush;
        shader.uniforms.uBaseAlpha = uniforms.uBaseAlpha;
        shader.uniforms.uMarginY = uniforms.uMarginY;
        shader.uniforms.uBaseY = uniforms.uBaseY;
        shader.uniforms.uKeyLightDir = uniforms.uKeyLightDir;
        shader.vertexShader = VERT_HEAD + shader.vertexShader.replace(
            "#include <begin_vertex>",
            "#include <begin_vertex>\n" + VERT_BODY
        );
        shader.fragmentShader = FRAG_HEAD + shader.fragmentShader.replace(
            "#include <color_fragment>",
            "#include <color_fragment>\n" + FRAG_BODY
        ).replace(
            "#include <roughnessmap_fragment>",
            "#include <roughnessmap_fragment>\n" + FRAG_ROUGHNESS
        );
    };
    return mat;
}

/* ------------------------- Materiales del diente ------------------------- */

function createEnamelMaterial() {
    const mat = new THREE.MeshPhysicalMaterial({
        vertexColors: true,
        color: "#ffffff",
        roughness: 0.10,
        metalness: 0,
        clearcoat: 1.0,
        clearcoatRoughness: 0.06,
        ior: 1.63,
        envMapIntensity: 1.15,
        sheen: 0.3,
        sheenRoughness: 0.35,
        sheenColor: new THREE.Color("#e8f2ee"),
        specularIntensity: 1.0,
    });
    mat.customProgramCacheKey = () => "arperio-enamel-v3";
    mat.onBeforeCompile = (shader) => {
        shader.vertexShader = "varying vec3 vEnPos;\n" + shader.vertexShader.replace(
            "#include <begin_vertex>",
            "#include <begin_vertex>\nvEnPos = transformed;"
        );
        shader.fragmentShader = "varying vec3 vEnPos;\n" + shader.fragmentShader.replace(
            "#include <color_fragment>",
            `#include <color_fragment>
{
  // Perikymata: finas líneas incrementales del tercio cervical (se atenúan hacia incisal)
  float enCerv = smoothstep(4.8, 0.4, vEnPos.y);
  float enPeri = sin(vEnPos.y * 21.0 + sin(vEnPos.x * 0.8) * 0.6) * 0.5 + 0.5;
  diffuseColor.rgb *= 1.0 - enCerv * enPeri * 0.05;
  // Opalescencia incisal: el borde deja pasar luz (tono neutro-azulado translúcido)
  float enInc = smoothstep(8.2, 10.7, vEnPos.y);
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.90, 0.93, 0.94), enInc * 0.52);
  // halo ámbar sutil en la unión esmalte-dentina (efecto de translucidez)
  float enDz = smoothstep(0.4, 2.2, vEnPos.y) * smoothstep(4.2, 2.6, vEnPos.y);
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.96, 0.90, 0.78), enDz * 0.12);
}`
        ).replace(
            "#include <roughnessmap_fragment>",
            `#include <roughnessmap_fragment>
{
  // micro-relieve perikymata: la rugosidad ondula con las líneas incrementales
  float enCervR = smoothstep(4.8, 0.4, vEnPos.y);
  float enPeriR = sin(vEnPos.y * 21.0 + sin(vEnPos.x * 0.8) * 0.6) * 0.5 + 0.5;
  roughnessFactor = clamp(roughnessFactor + enCervR * enPeriR * 0.12, 0.04, 1.0);
}`
        );
    };
    return mat;
}

function createDentinMaterial() {
    return new THREE.MeshPhysicalMaterial({
        vertexColors: true,
        color: "#ffffff",
        roughness: 0.5,
        metalness: 0,
        clearcoat: 0.12,
        clearcoatRoughness: 0.4,
        envMapIntensity: 0.5,
    });
}

function createRootMaterial() {
    return new THREE.MeshPhysicalMaterial({
        vertexColors: true,
        color: "#ffffff",
        roughness: 0.68,
        metalness: 0,
        envMapIntensity: 0.4,
    });
}

function createPulpMaterial() {
    return new THREE.MeshPhysicalMaterial({
        color: "#c0574c",
        roughness: 0.45,
        emissive: new THREE.Color("#5e1f1a"),
        emissiveIntensity: 0.35,
    });
}

/* ------------------------ Utilidades de transparencia -------------------- */

/** Ajusta opacidad de un material estándar (modos anatómico/transparente). */
function setOpacity(mat, opacity) {
    const target = opacity < 0.999;
    if (mat.transparent !== target) {
        mat.transparent = target;
        mat.needsUpdate = true;
    }
    mat.opacity = opacity;
    mat.depthWrite = opacity > 0.85;
}
