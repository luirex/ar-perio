/* AR PERIO — learn-data-1.js (portado de src/data/learn/part1.ts) */
/**
 * AR PERIO — Contenido educativo (1/2): Anatomía periodontal y Examen periodontal.
 * Estructura declarativa: el docente puede añadir temas nuevos extendiendo
 * estas listas sin modificar los componentes de la interfaz.
 */
const ANATOMIA = {
    id: "anatomia",
    title: "Anatomía periodontal",
    description: "Los tejidos que sostienen al diente: encía, ligamento periodontal, cemento radicular y hueso alveolar, junto con la unión dentogingival y el surco gingival.",
    topics: [
        {
            id: "an-encia",
            title: "Encía",
            summary: "Porción visible del periodonto: encía marginal, adherida e interdental, con sus características clínicas normales.",
            blocks: [
                {
                    type: "p",
                    text: "La **encía** es la porción del periodonto de protección que rodea el cuello del diente y cubre el proceso alveolar. Clínicamente es la única estructura del periodonto visible en la exploración, por lo que su aspecto constituye la primera fuente de información del estado periodontal. Su extensión coronaria va desde el margen gingival libre hasta la unión mucogingival, donde se continúa con la mucosa alveolar más móvil y rojiza.",
                },
                {
                    type: "kv",
                    title: "Divisiones de la encía",
                    items: [
                        { k: "Encía marginal (libre)", v: "Collar que rodea el diente, de 0.5–2 mm de ancho; forma el margen y el surco gingival." },
                        { k: "Encía adherida", v: "Firmemente unida al hueso y al cemento; superficie estipulada (puntizado de naranja) y queratinizada." },
                        { k: "Encía interdental", v: "Papila que ocupa el espacio interproximal; forma piramidal en zona anterior." },
                    ],
                },
                {
                    type: "p",
                    text: "La **encía sana** se describe clásicamente como de color rosa coral o salmonado, con contornos festoneados que siguen la línea cervical del diente, superficie estipulada en la encía adherida, consistencia firme y elástica, y margen fino adaptado al diente como una cuchilla. El estancamiento del biofilm altera cada una de estas características: el color se torna rojo, el margen se engrosa y redondea, y puede aparecer sangrado espontáneo o provocado.",
                },
                {
                    type: "diagram",
                    id: "periodontium",
                    caption: "Sección sagital del periodonto: relaciones entre diente, encía, ligamento y hueso.",
                },
                {
                    type: "note",
                    tone: "clinical",
                    text: "La anchura de encía queratinizada es variable (1–9 mm) y es mayor en incisivos y caninos. Una banda estrecha o ausente se asocia a mayor recesión ante trauma de cepillado o inflamación.",
                },
            ],
            quiz: [
                {
                    id: "an-encia-q1",
                    prompt: "¿Cuál es la característica de superficie típica de la encía adherida sana?",
                    options: ["Estipulación (puntizado de naranja)", "Brillante y lisa", "Ulcerada", "Descamativa"],
                    correct: 0,
                    explanation: "La estipulación aparece en la encía adherida queratinizada y refleja la unión firme del tejido al hueso subyacente; desaparece con el edema inflamatorio.",
                },
                {
                    id: "an-encia-q2",
                    prompt: "La unión mucogingival separa la encía adherida de…",
                    options: ["El surco gingival", "La mucosa alveolar", "El ligamento periodontal", "El cemento radicular"],
                    correct: 1,
                    explanation: "La línea mucogingival es el límite entre la encía queratinizada y adherida y la mucosa alveolar móvil, más rojiza y delgada.",
                },
            ],
        },
        {
            id: "an-ligamento",
            title: "Ligamento periodontal",
            summary: "Tejido conectivo que une cemento y hueso alveolar: fibras, células y funciones de soporte, nutrición y propiocepción.",
            blocks: [
                {
                    type: "p",
                    text: "El **ligamento periodontal** es un tejido conectivo altamente celular y vascularizado que ocupa un espacio de 0.15–0.38 mm entre el cemento radicular y la lámina dura del alvéolo. No es una estructura pasiva: sus haces de fibras de colágena se insertan por un lado en el cemento y por otro en el hueso (fibras de Sharpey), suspendiendo al diente en su alvéolo y transformando las fuerzas masticatorias en tensión tolerable para el hueso.",
                },
                {
                    type: "table",
                    headers: ["Grupo de fibras", "Recorrido", "Función principal"],
                    rows: [
                        ["Fibras alveolocrestales", "Cresta alveolar → cemento cervical", "Resisten fuerzas oclusales oblicuas"],
                        ["Fibras horizontales", "Hueso → cemento, casi horizontales", "Resisten fuerzas laterales"],
                        ["Fibras oblicuas (mayoría)", "Hueso apical → cemento coronario", "Soportan la carga axial masticatoria"],
                        ["Fibras apicales", "Alrededor del ápice", "Estabilizan la porción apical"],
                        ["Fibras interradiculares", "Fondo de furcación → cemento", "Soportan dientes multirradiculares"],
                    ],
                },
                {
                    type: "p",
                    text: "Además del soporte, el ligamento cumple funciones de **nutrición** (vasculariza cemento y hueso alveolar), **propiocepción** (mecanorreceptores que informan de la intensidad y dirección de las fuerzas) y **remodelado** (células como cementoblastos, osteoblastos y fibroblastos renuevan constantemente sus componentes). Cuando el ligamento se destruye en la periodontitis, el diente pierde soporte y aparece movilidad patológica.",
                },
                {
                    type: "note",
                    tone: "tip",
                    text: "En radiografías el espacio del ligamento se ve como una franja radiolúcida de 0.15–0.38 mm entre la raíz y la lámina dura; su ensanchamiento sugiere sobrecarga o inflamación.",
                },
            ],
            quiz: [
                {
                    id: "an-lig-q1",
                    prompt: "El grosor normal del espacio del ligamento periodontal es de…",
                    options: ["0.15–0.38 mm", "1–2 mm", "2–3 mm", "0.5–1 mm"],
                    correct: 0,
                    explanation: "El espacio periodontal normal es fino (fracción de milímetro); en la radiografía se aprecia como línea radiolúcida entre cemento y lámina dura.",
                },
                {
                    id: "an-lig-q2",
                    prompt: "Las fibras más numerosas del ligamento periodontal son las…",
                    options: ["Alveolocrestales", "Oblicuas", "Horizontales", "Apicales"],
                    correct: 1,
                    explanation: "Las fibras oblicuas constituyen la mayoría y son las principales responsables de resistir las fuerzas axiales de la masticación.",
                },
            ],
        },
        {
            id: "an-cemento",
            title: "Cemento radicular",
            summary: "Tejido mineralizado que recubre la raíz y ancla las fibras del ligamento: formación, tipos y reparación.",
            blocks: [
                {
                    type: "p",
                    text: "El **cemento radicular** es el tejido mineralizado, avascular y sin inervación, que recubre la superficie radicular desde el cuello anatómico hasta el ápice. Es la estructura donde se insertan las fibras de Sharpey del ligamento periodontal, convirtiéndose en el ancla del aparato de soporte. A diferencia del hueso, el cemento no se remodela de forma continua, sino que se deposita lentamente a lo largo de la vida, lo que permite su reparación y la reinserción de fibras tras el tratamiento periodontal.",
                },
                {
                    type: "kv",
                    title: "Tipos de cemento",
                    items: [
                        { k: "Cemento acelular (primario)", v: "Cubre los dos tercios coronarios de la raíz; se forma antes de la erupción; sin células incluidas." },
                        { k: "Cemento celular (secundario)", v: "Se deposita tras la erupción en el tercio apical e interradicular; incluye cementocitos." },
                        { k: "Cemento afibrilar", v: "Bandas cervicales sin fibras; explica variantes de la línea amelocementaria." },
                    ],
                },
                {
                    type: "p",
                    text: "La unión esmalte-cemento (CEJ) marca el límite entre corona y raíz y es un punto de referencia fundamental en periodoncia: de ella se miden la recesión gingival y el nivel de inserción clínica. Clínicamente puede localizarse al sondaje como una pequeña irregularidad dura, y en el modelo 3D de AR PERIO corresponde al cambio de textura y color entre esmalte y cemento.",
                },
                {
                    type: "note",
                    tone: "clinical",
                    text: "La exposición del cemento por recesión favorece la sensibilidad radicular, las caries radiculares y la abrasión; su conservación es clave en los procedimientos de raspado y alisado radicular.",
                },
            ],
            quiz: [
                {
                    id: "an-cem-q1",
                    prompt: "¿Qué característica distingue al cemento del hueso alveolar?",
                    options: [
                        "Se remodela continuamente",
                        "No se remodela de forma continua, se deposita lentamente",
                        "Está altamente vascularizado",
                        "Contiene osteocitos",
                    ],
                    correct: 1,
                    explanation: "El cemento se deposita de forma lenta y acumulativa durante toda la vida, sin remodelado continuo, lo que permite la reparación radicular.",
                },
            ],
        },
        {
            id: "an-hueso",
            title: "Hueso alveolar",
            summary: "Proceso alveolar que aloja las raíces: cortical, hueso esponjoso, cresta alveolar y su respuesta a la inflamación.",
            blocks: [
                {
                    type: "p",
                    text: "El **hueso alveolar** es la porción del maxilar y de la mandíbula que forma los alvéolos y da inserción a las fibras del ligamento periodontal. Se organiza como un arco de hueso de soporte (proceso alveolar) cuya parte más coronaria, la **cresta alveolar**, se sitúa normalmente a 1.5–2 mm apical de la unión esmalte-cemento en el diente sano. El alvéolo está revestido por una delgada capa de hueso compacto, la **lámina dura**, visible radiográficamente como línea radiopaca que delimita la raíz.",
                },
                {
                    type: "list",
                    items: [
                        "**Hueso de revestimiento (cortical):** lámina exterior que forma la tabla vestibular y palatina/lingual.",
                        "**Hueso de soporte (esponjoso):** trabéculas entre las corticales que transmiten y amortiguan las cargas.",
                        "**Hueso alveolar propiamente dicho:** la lámina dura que recubre el alvéolo y ancla el ligamento.",
                    ],
                },
                {
                    type: "p",
                    text: "El hueso alveolar es un tejido dinámico muy sensible a las fuerzas y a la inflamación. En la periodontitis, la inflamación del ligamento y del tejido conectivo produce reabsorción de la cresta, primero horizontal y después vertical (defectos angulares). La cantidad y patrón de pérdida ósea determinan el pronóstico y la posibilidad de regeneración, y constituye el principal criterio radiográfico de la estadificación.",
                },
                {
                    type: "diagram",
                    id: "periodontium",
                    caption: "Relación de la cresta alveolar con el CEJ en el periodonto sano.",
                },
            ],
            quiz: [
                {
                    id: "an-hueso-q1",
                    prompt: "En condiciones de salud, la cresta alveolar se localiza…",
                    options: [
                        "A nivel del CEJ",
                        "1.5–2 mm apical al CEJ",
                        "1.5–2 mm coronal al CEJ",
                        "A nivel del ápice radicular",
                    ],
                    correct: 1,
                    explanation: "La distancia normal entre el CEJ y la cresta alveolar es de 1.5–2 mm; en la exploración esto explica la profundidad fisiológica del surco y el sondaje normal de 1–3 mm.",
                },
                {
                    id: "an-hueso-q2",
                    prompt: "La lámina dura radiográfica corresponde a…",
                    options: [
                        "El cemento radicular",
                        "La cortical del alvéolo que reviste el hueso de soporte",
                        "La encía adherida calcificada",
                        "El esmalte cervical",
                    ],
                    correct: 1,
                    explanation: "La lámina dura es la delgada capa de hueso compacto que reviste el alvéolo; su integridad es signo de salud periodontal.",
                },
            ],
        },
        {
            id: "an-union",
            title: "Unión dentogingival",
            summary: "El sello biológico entre el diente y la encía: epitelio de unión, epitelio del surco y tejido conectivo supracrestal.",
            blocks: [
                {
                    type: "p",
                    text: "La **unión dentogingival** es el mecanismo de adhesión que sella el tejido blando contra la superficie del diente. Es única en el organismo: un epitelio se adhiere a una superficie mineralizada. Se compone del **epitelio de unión** (de 0.25 a más de 1 mm de longitud), que se adhiere al esmalte o al cemento mediante la membrana basal interna y los hemidesmosomas, y del **tejido conectivo supracrestal** que lo ancla al hueso por encima de la cresta.",
                },
                {
                    type: "list",
                    ordered: true,
                    items: [
                        "**Epitelio de unión:** sella el ambiente conectivo del surco; su porción apical coincide con el fondo del surco clínico.",
                        "**Epitelio del surco:** reviste la pared lateral del surco; delgado y semipermeable.",
                        "**Conectivo supracrestal:** fibras dentogingivales y dentoalveolares que estabilizan la encía contra el diente.",
                    ],
                },
                {
                    type: "p",
                    text: "Cuando el biofilm se acumula, la primera estructura comprometida es el epitelio de unión: se ulcera, se interdigitan leucocitos y permite que la sonda penetre más allá de su fondo apical. La **destrucción de la unión** y su migración apical sobre la raíz definen la bolsa periodontal verdadera, mientras que su desplazamiento coronal por edema define la seudobolsa de la gingivitis. Comprender esta diferencia es esencial para distinguir gingivitis de periodontitis al sondar.",
                },
                {
                    type: "note",
                    tone: "clinical",
                    text: "La permeabilidad de la unión dentogingival explica que el sondaje en salud pueda alcanzar el fondo del epitelio de unión (0.5–1 mm) sin que exista destrucción.",
                },
            ],
            quiz: [
                {
                    id: "an-uni-q1",
                    prompt: "El sello biológico del diente contra la encía lo establece principalmente…",
                    options: [
                        "El epitelio de unión mediante hemidesmosomas",
                        "El estipulado de la encía adherida",
                        "Las fibras oblicuas del ligamento",
                        "La lámina dura",
                    ],
                    correct: 0,
                    explanation: "El epitelio de unión se adhiere a la superficie dentaria mediante membrana basal interna y hemidesmosomas, constituyendo el sello dentogingival.",
                },
                {
                    id: "an-uni-q2",
                    prompt: "La migración apical del epitelio de unión sobre la raíz caracteriza…",
                    options: [
                        "La seudobolsa",
                        "La bolsa periodontal verdadera",
                        "El surco fisiológico",
                        "La hiperplasia gingival",
                    ],
                    correct: 1,
                    explanation: "Cuando el epitelio de unión migra apicalmente sobre cemento expuesto se forma una bolsa verdadera, con pérdida de inserción; la seudobolsa solo implica desplazamiento coronal del margen.",
                },
            ],
        },
        {
            id: "an-surco",
            title: "Surco gingival",
            summary: "El espacio potencial entre diente y encía: profundidad fisiológica, líquido crevicular y fondo del surco.",
            blocks: [
                {
                    type: "p",
                    text: "El **surco gingival** es el espacio potencial que rodea al diente entre el margen gingival libre y el fondo del surco (porción más coronaria del epitelio de unión). En condiciones de salud mide clínicamente **1 a 3 mm** al sondaje: la sonda desplaza levemente el epitelio de unión y alcanza su fondo, por lo que el valor clínico normal supera ligeramente la profundidad histológica real (≈ 0.69 mm). Un sondaje de 4 mm o más, o que sangra, obliga a sospechar patología.",
                },
                {
                    type: "p",
                    text: "Dentro del surco se encuentra el **líquido crevicular**, un exudado plasmático que fluye hacia la boca arrastrando productos del metabolismo bacteriano y células de defensa. Su caudal aumenta de forma notable con la inflamación, y es la vía por la que migran los neutrófilos que forman la banda defensiva del surco. En AR PERIO, el surco del modelo 3D reproduce esta geometría: el estudiante puede introducir la sonda en el espacio real entre la pared interna de la encía y la superficie del diente.",
                },
                {
                    type: "kv",
                    title: "Referencias clínicas del sondaje normal",
                    items: [
                        { k: "Vestibular / lingual medio", v: "1–2 mm" },
                        { k: "Zonas interproximales", v: "2–3 mm" },
                        { k: "Sondaje ≥ 4 mm", v: "Sospecha de bolsa o seudobolsa" },
                    ],
                },
                {
                    type: "note",
                    tone: "tip",
                    text: "La profundidad se mide desde el margen gingival hasta el fondo del surco. El nivel de inserción, en cambio, se mide desde el CEJ: ambos conceptos solo coinciden cuando el margen está en el CEJ.",
                },
            ],
            quiz: [
                {
                    id: "an-sur-q1",
                    prompt: "La profundidad clínica normal del surco gingival al sondaje es…",
                    options: ["0 mm", "1–3 mm", "3–5 mm", "4–6 mm"],
                    correct: 1,
                    explanation: "El sondaje normal en salud es de 1–3 mm; valores mayores sugieren inflamación con edema o pérdida de inserción.",
                },
                {
                    id: "an-sur-q2",
                    prompt: "El fondo del surco clínico corresponde a…",
                    options: [
                        "La cresta alveolar",
                        "La porción más coronaria del epitelio de unión",
                        "El margen gingival",
                        "La línea mucogingival",
                    ],
                    correct: 1,
                    explanation: "La sonda se detiene en la porción más coronal del epitelio de unión, que marca el fondo del surco.",
                },
            ],
        },
    ],
};
const EXAMEN = {
    id: "examen",
    title: "Examen periodontal",
    description: "Metodología de la exploración periodontal: inspección, sondaje, profundidad, nivel de inserción, sangrado, movilidad, recesión y furcaciones.",
    topics: [
        {
            id: "ex-inspeccion",
            title: "Inspección",
            summary: "La observación clínica sistematizada de encía y dientes antes de cualquier instrumentación.",
            blocks: [
                {
                    type: "p",
                    text: "La **inspección** es el primer paso del examen periodontal y precede al sondaje. Se realiza con luz adecuada, secado suave de los tejidos y ayuda de espejo y explorador. Debe ser sistematizada para no omitir zonas: se recorren todas las superficies de todos los dientes evaluando el estado de la encía marginal, adherida e interdental, así como la presencia de biopelícula, cálculo, restauraciones desbordadas y defectos mucogingivales.",
                },
                {
                    type: "table",
                    headers: ["Parámetro", "Aspecto normal", "Signos de alarma"],
                    rows: [
                        ["Color", "Rosa coral / salmonado", "Eritema rojo violáceo, difuso o localizado"],
                        ["Contorno", "Festoneado, margen fino en cuchilla", "Margen redondeado, bulboso, craters interdentales"],
                        ["Superficie", "Estipulada en adherida", "Lisa y brillante (edema), fisuras, ulceración"],
                        ["Consistencia", "Firme, resistente", "Blanda, esponjosa, indentable"],
                        ["Tamaño", "Proporcional al hueso", "Aumento de volumen, hiperplasia"],
                    ],
                },
                {
                    type: "p",
                    text: "Durante la inspección se valoran además el **sangrado espontáneo**, la **supuración** al comprimir la papila, la **recesión** visible, las **bioformas dentarias** y las **mucosas y frenillos** que puedan influir en la higiene. Los hallazgos se registran en la historia clínica y orientan el sondaje, que confirmará la extensión real de las lesiones.",
                },
                {
                    type: "note",
                    tone: "clinical",
                    text: "Secar la encía antes de inspeccionar es imprescindible: el brillo húmedo puede enmascarar el eritema y el puntizado desaparece aparentemente bajo la saliva.",
                },
            ],
            quiz: [
                {
                    id: "ex-ins-q1",
                    prompt: "¿Cuál de los siguientes es un signo de encía sana en la inspección?",
                    options: ["Superficie lisa y brillante", "Estipulación en la encía adherida", "Margen bulboso", "Eritema marginal difuso"],
                    correct: 1,
                    explanation: "La estipulación o puntizado de naranja es característico de la encía adherida sana y queratinizada.",
                },
            ],
        },
        {
            id: "ex-sondaje",
            title: "Sondaje periodontal",
            summary: "Técnica correcta de la sonda: angulación, fuerza, recorrido de los seis sitios y errores frecuentes.",
            blocks: [
                {
                    type: "p",
                    text: "El **sondaje** es la maniobra esencial del diagnóstico periodontal: consiste en introducir la sonda en el surco o bolsa y medir la distancia del margen al fondo. Se realiza en **seis sitios por diente** (mesiovestibular, vestibular medio, distovestibular, mesiolingual/palatino, medio y distal), porque las lesiones son localizadas y un solo sitio puede ocultar una bolsa activa.",
                },
                {
                    type: "list",
                    ordered: true,
                    items: [
                        "Insertar la sonda **paralela al eje longitudinal** del diente, con ligera inclinación hacia la zona interproximal en los sitios mesiales y distales.",
                        "Aplicar una fuerza ligera y constante (≈ 0.25 N, la que se percibe al presionar la uña sin dolor).",
                        "Caminar la sonda en pequeños pasos («walk around») por el fondo del surco, sin deslizarla de golpe.",
                        "Leer la profundidad en milímetros y registrar el valor en el periodontograma.",
                        "Repetir en los seis sitios y valorar los dientes contiguos cuando el patrón lo requiera.",
                    ],
                },
                {
                    type: "diagram",
                    id: "technique",
                    caption: "Secuencia de la técnica de sondaje y angulación correcta.",
                },
                {
                    type: "p",
                    text: "La **angulación** es el error técnico más frecuente: una sonda excesivamente inclinada sobreestima la profundidad al medir la hipotenusa del trayecto. La fuerza excesiva perfora el epitelio de unión sano y genera mediciones falsamente profundas y sangrado artefactual. En AR PERIO, la simulación corrige la angulación al acoplar la sonda a la superficie del diente y bloquea el avance al alcanzar el fondo, entrenando la percepción de la resistencia real.",
                },
                {
                    type: "note",
                    tone: "warn",
                    text: "Errores frecuentes: no sondar los seis sitios, sondar solo donde hay inflamación visible, usar la sonda como cureta para remover cálculo y medir con la sonda inclinada.",
                },
            ],
            quiz: [
                {
                    id: "ex-son-q1",
                    prompt: "¿Cuántos sitios se sondan por diente en un examen periodontal completo?",
                    options: ["Uno por superficie libre", "Tres", "Seis", "Ocho"],
                    correct: 2,
                    explanation: "Se registran seis sitios por diente: tres vestibulares (mesial, medio, distal) y tres linguales/palatinos.",
                },
                {
                    id: "ex-son-q2",
                    prompt: "La fuerza de sondaje recomendada es aproximadamente…",
                    options: ["La máxima que tolere el paciente", "≈ 0.25 N (ligera, como presionar la uña sin dolor)", "≈ 5 N", "Indiferente"],
                    correct: 1,
                    explanation: "Una fuerza ligera y constante (≈ 0.25 N) permite llegar al fondo del epitelio de unión sin perforarlo ni causar dolor.",
                },
                {
                    id: "ex-son-q3",
                    prompt: "Sondar con excesiva inclinación respecto al eje del diente produce…",
                    options: [
                        "Subestimación de la profundidad",
                        "Sobreestimación de la profundidad",
                        "Ningún error de medición",
                        "Sangrado ausente",
                    ],
                    correct: 1,
                    explanation: "La sonda inclinada recorre la hipotenusa del triángulo formado con el eje dentario y sobreestima la medida.",
                },
            ],
        },
        {
            id: "ex-profundidad",
            title: "Profundidad de sondaje",
            summary: "Interpretación de la medición del surco/bolsa: umbrales clínicos y factores que la modifican.",
            blocks: [
                {
                    type: "p",
                    text: "La **profundidad de sondaje (PS o PD)** es la distancia en milímetros desde el margen gingival hasta el fondo del surco o bolsa, medida con la sonda periodontal. Representa la profundidad clínicamente accesible del espacio dentogingival y es uno de los pilares del periodontograma. Su interpretación debe hacerse siempre junto al margen gingival: una PD de 5 mm con margen coronal (edema) puede significar seudobolsa sin pérdida de inserción, mientras que la misma PD con recesión indica destrucción real.",
                },
                {
                    type: "table",
                    headers: ["Medición", "Interpretación habitual"],
                    rows: [
                        ["1–3 mm", "Surco fisiológico (salud)"],
                        ["4 mm (aislado, sin sangrado)", "Vigilancia; valorar morfología y bioforma"],
                        ["≥ 5 mm", "Bolsa periodontal: indicación de terapia instrumentada"],
                        ["Valores falsamente elevados", "Angulación incorrecta, fuerza excesiva, cálculo subgingival"],
                    ],
                },
                {
                    type: "p",
                    text: "La PD no coincide exactamente con la destrucción histológica: la sonda penetra levemente el epitelio de unión y su lectura depende de la fuerza, del ángulo y de la inflamación. Por eso las mediciones deben ser **reproducibles**: el mismo operador, con la misma técnica, debe obtener valores similares en controles sucesivos. Una PD que aumenta entre visitas señala actividad de la enfermedad; una PD estable y sin sangrado señala estabilidad.",
                },
                {
                    type: "note",
                    tone: "tip",
                    text: "Regla mnemotécnica: la PD dice «hasta dónde llegó la sonda»; la inserción dice «cuánto periodonto queda».",
                },
            ],
            quiz: [
                {
                    id: "ex-pro-q1",
                    prompt: "Una PD de 5 mm con margen engrosado y coronal sin pérdida de inserción corresponde a…",
                    options: ["Bolsa verdadera", "Seudobolsa por edema", "Surco fisiológico", "Furcación grado III"],
                    correct: 1,
                    explanation: "En la seudobolsa el margen se desplaza coronalmente por edema: aumenta la PD sin migración apical del epitelio de unión.",
                },
            ],
        },
        {
            id: "ex-insercion",
            title: "Nivel de inserción clínica",
            summary: "El verdadero indicador de destrucción: medición desde el CEJ y cálculo con recesión.",
            blocks: [
                {
                    type: "p",
                    text: "El **nivel de inserción clínica (NIC o CAL)** mide la distancia desde la unión esmalte-cemento hasta el fondo del surco o bolsa, y expresa la cantidad real de periodonto de soporte perdido. Es el parámetro que diferencia gingivitis de periodontitis y el que se usa para la estadificación: mientras la profundidad de sondaje puede bajar con la corrección del edema, la pérdida de inserción solo se recupera con regeneración.",
                },
                {
                    type: "kv",
                    title: "Cálculo del NIC",
                    items: [
                        { k: "Con margen en el CEJ", v: "NIC = PD (la medida coincide)" },
                        { k: "Con recesión (margen apical al CEJ)", v: "NIC = PD + recesión" },
                        { k: "Con margen coronal al CEJ (edema/hiperplasia)", v: "NIC = PD − distancia del margen al CEJ" },
                    ],
                },
                {
                    type: "p",
                    text: "Para medirlo se localiza primero el CEJ al tacto con la punta de la sonda («notch» duro cervical); después se mide la distancia del margen gingival al CEJ (recesión positiva o negativa) y la PD del mismo sitio, y se aplican las fórmulas anteriores. En AR PERIO, el periodontograma calcula el NIC automáticamente al introducir PD y recesión, y el modelo 3D muestra la posición real del margen respecto al CEJ en cada condición clínica.",
                },
                {
                    type: "note",
                    tone: "clinical",
                    text: "Un NIC de 1–2 mm con PD de 4–5 mm y margen coronal indica seudobolsa; un NIC de 5 mm indica periodontitis con independencia de la PD registrada.",
                },
            ],
            quiz: [
                {
                    id: "ex-ins2-q1",
                    prompt: "En un sitio con PD de 4 mm y recesión de 2 mm, el NIC es…",
                    options: ["2 mm", "4 mm", "6 mm", "8 mm"],
                    correct: 2,
                    explanation: "Con recesión, NIC = PD + recesión = 4 + 2 = 6 mm de pérdida de inserción.",
                },
                {
                    id: "ex-ins2-q2",
                    prompt: "El nivel de inserción clínica se mide desde…",
                    options: ["El margen gingival", "La línea mucogingival", "La unión esmalte-cemento", "El borde incisal"],
                    correct: 2,
                    explanation: "El NIC se referencia al CEJ para reflejar la pérdida real de soporte, independiente de la posición del margen.",
                },
            ],
        },
        {
            id: "ex-sangrado",
            title: "Sangrado al sondaje",
            summary: "El signo de actividad inflamatoria más sensible: técnica de registro e interpretación del BOP.",
            blocks: [
                {
                    type: "p",
                    text: "El **sangrado al sondaje (BOP, bleeding on probing)** es el signo clínico más precoz y sensible de inflamación gingival: aparece antes que el eritema visible y antes de cualquier pérdida de inserción. Se registra de forma binaria (sí/no) por sitio tras un sondaje suave, y su presencia en un porcentaje elevado de sitios indica gingivitis activa; en un sitio previamente tratado sugiere recurrencia o actividad de una bolsa.",
                },
                {
                    type: "list",
                    items: [
                        "Sondaje con fuerza estandarizada y ligera; registrar el sangrado a los **10–30 segundos** de retirar la sonda.",
                        "Considerar positivos también el sangrado espontáneo y la supuración.",
                        "El **porcentaje de sitios con BOP** (BOP%) cuantifica la carga inflamatoria: < 10 % se considera compatible con salud/estabilidad.",
                        "Un BOP positivo persistente en el mismo sitio en visitas sucesivas identifica un **sitio de riesgo** de progresión.",
                    ],
                },
                {
                    type: "p",
                    text: "En AR PERIO el registro de sangrado se practica en la simulación: al sondar sitios inflamados aparece una representación clínica discreta de sangre en el margen, y el estudiante debe activar «Registrar sangrado» para documentarlo en el periodontograma, tal como lo haría en la clínica con el paciente real.",
                },
                {
                    type: "note",
                    tone: "warn",
                    text: "El sangrado ausente es un excelente predictor negativo (alta probabilidad de estabilidad); el sangrado presente, en cambio, no siempre predice destrucción: valora actividad, no cantidad de tejido perdido.",
                },
            ],
            quiz: [
                {
                    id: "ex-san-q1",
                    prompt: "El sangrado al sondaje se considera el signo más…",
                    options: [
                        "Específico de pérdida ósea",
                        "Precoz y sensible de inflamación gingival",
                        "Tardío de la periodontitis",
                        "Fiable de actividad ósea",
                    ],
                    correct: 1,
                    explanation: "El BOP aparece antes que otros signos y es muy sensible a la inflamación incipiente del surco.",
                },
                {
                    id: "ex-san-q2",
                    prompt: "¿Cuándo se registra el sangrado tras el sondaje?",
                    options: ["Inmediatamente al retirar la sonda", "A los 10–30 segundos", "A los 5 minutos", "Al día siguiente"],
                    correct: 1,
                    explanation: "El sangrado tardío (10–30 s) es el que mejor refleja la permeabilidad vascular del tejido inflamado.",
                },
            ],
        },
        {
            id: "ex-movilidad",
            title: "Movilidad dental",
            summary: "Gradación de Miller y las causas de movilidad patológica: pérdida de soporte y sobrecarga oclusal.",
            blocks: [
                {
                    type: "p",
                    text: "La **movilidad dental** se valora sujetando el diente con dos mangos de instrumentos y aplicando movimientos vestibulolinguales suaves, comparando siempre con los dientes vecinos. Un grado fisiológico de movilidad existe en todo diente sano; se considera patológica cuando excede ese rango y se gradúa clínicamente mediante la escala de Miller.",
                },
                {
                    type: "table",
                    headers: ["Grado (Miller)", "Definición clínica"],
                    rows: [
                        ["0", "Movilidad fisiológica (≤ 0.25 mm)"],
                        ["1", "Movilidad horizontal mayor de 0.25 mm pero ≤ 1 mm"],
                        ["2", "Movilidad horizontal mayor de 1 mm (corona y raíz)"],
                        ["3", "Movilidad horizontal y vertical; diente deprimible en el alvéolo"],
                    ],
                },
                {
                    type: "p",
                    text: "La movilidad depende de la **cantidad de periodonto restante**, del **grado de inflamación** y de las **fuerzas oclusales**. Un diente con soporte reducido pero sano y sin sobrecarga puede ser estable; un diente con soporte amplio puede movilizarse por trauma oclusal agudo. La movilidad del incisivo central superior en AR PERIO se registra en el periodontograma, y en los casos clínicos se integra con la pérdida de inserción para valorar el pronóstico.",
                },
                {
                    type: "note",
                    tone: "clinical",
                    text: "La movilidad puede disminuir tras el tratamiento antiinflamatorio; por eso se reevalúa en la fase de reevaluación, nunca como único criterio de pronóstico.",
                },
            ],
            quiz: [
                {
                    id: "ex-mov-q1",
                    prompt: "Un diente con movilidad horizontal de 1.5 mm y sin movilidad vertical corresponde a Miller grado…",
                    options: ["1", "2", "3", "0"],
                    correct: 1,
                    explanation: "La movilidad horizontal mayor de 1 mm sin componente vertical corresponde al grado 2 de Miller.",
                },
            ],
        },
        {
            id: "ex-recesion",
            title: "Recesión gingival",
            summary: "Desplazamiento apical del margen: medición desde el CEJ, clasificación y diagnóstico diferencial.",
            blocks: [
                {
                    type: "p",
                    text: "La **recesión gingival** es el desplazamiento del margen gingival apical a la unión esmalte-cemento, con exposición de la superficie radicular. Se mide en milímetros desde el CEJ hasta el margen (valor positivo cuando el margen está apical) y se registra por sitio en el periodontograma, porque condiciona el cálculo del nivel de inserción y el riesgo de sensibilidad, caries radicular y afectación estética.",
                },
                {
                    type: "p",
                    text: "Sus causas más frecuentes son el **trauma de cepillado** (técnica horizontal agresiva, cepillo duro), la **falta de encía queratinizada** con fenotipo fino, la **inflammación periodontal** con destrucción del tejido blando, las **inserciones musculares y frenillos** que traccionan el margen, y las **restauraciones invasivas del biotipo**. En el incisivo central superior predomina la recesión vestibular de origen traumático sobre fenotipo fino.",
                },
                {
                    type: "kv",
                    title: "Clasificación de Miller",
                    items: [
                        { k: "Clase I", v: "Recesión que no alcanza la línea mucogingival; sin pérdida interproximal" },
                        { k: "Clase II", v: "Recesión que alcanza o sobrepasa la mucogingival; sin pérdida interproximal" },
                        { k: "Clase III", v: "Recesión con pérdida interproximal de tejido blando o hueso" },
                        { k: "Clase IV", v: "Pérdida interproximal avanzada con malposición severa" },
                    ],
                },
                {
                    type: "note",
                    tone: "tip",
                    text: "En el modelo 3D de AR PERIO puedes activar la condición de periodontitis avanzada para ver el margen apical al CEJ con raíz expuesta y relacionar recesión con pérdida de inserción.",
                },
            ],
            quiz: [
                {
                    id: "ex-rec-q1",
                    prompt: "Una recesión vestibular de 3 mm que sobrepasa la línea mucogingival sin pérdida interproximal es Miller…",
                    options: ["Clase I", "Clase II", "Clase III", "Clase IV"],
                    correct: 1,
                    explanation: "La clase II de Miller alcanza o sobrepasa la unión mucogingival sin pérdida de tejido interproximal.",
                },
            ],
        },
        {
            id: "ex-furcaciones",
            title: "Furcaciones",
            summary: "Afectación de la zona de unión de las raíces: sondaje específico y clasificación de Glickman/Hamp.",
            blocks: [
                {
                    type: "p",
                    text: "La **furcación** es la zona donde divergen las raíces de un diente multirradicular. Su invasión por la periodontitis crea defectos de difícil acceso para la higiene y la instrumentación, por lo que su detección cambia el pronóstico y el plan de tratamiento. Aunque el incisivo central superior del modelo 3D de AR PERIO es unirradicular y no presenta furcación, todo examen completo la valora en premolares y molares.",
                },
                {
                    type: "table",
                    headers: ["Grado (Hamp)", "Hallazgo clínico"],
                    rows: [
                        ["I", "Defecto horizontal ≤ 3 mm (concavidad incipiente)"],
                        ["II", "Defecto horizontal > 3 mm sin traspasar la furcación (cul-de-sac)"],
                        ["III", "Traspaso completo («through and through») sondable por ambas entradas"],
                    ],
                },
                {
                    type: "p",
                    text: "El sondaje de furcación se realiza con la **sonda de Nabers**, curvada para adaptarse a la entrada interradicular, explorando las entradas vestibular y lingual de molares inferiores, y vestibular, mesial y distal de molares superiores. La técnica exige angulación táctil fina: la punta se introduce en la concavidad y se avanza buscando la profundidad horizontal del defecto. Un grado III implica comunicación con el medio oral por ambas entradas y suele requerir terapias específicas (regeneración, tunelización o extracción).",
                },
                {
                    type: "note",
                    tone: "clinical",
                    text: "En el periodontograma, la casilla de furcación se marca «—» en dientes unirradiculares como los incisivos, y con el grado I–III en multirradiculares.",
                },
            ],
            quiz: [
                {
                    id: "ex-fur-q1",
                    prompt: "La sonda específica para explorar furcaciones es…",
                    options: ["La sonda de Williams", "La sonda de Nabers", "El explorador de línea", "La cureta de Gracey"],
                    correct: 1,
                    explanation: "La sonda de Nabers tiene punta curva diseñada para penetrar y sondear las entradas de furcación.",
                },
                {
                    id: "ex-fur-q2",
                    prompt: "Un defecto de furcación que atraviesa completamente la zona interradicular es grado…",
                    options: ["I", "II", "III", "IV"],
                    correct: 2,
                    explanation: "El grado III es un traspaso completo comunicable desde ambas entradas («through and through»).",
                },
            ],
        },
    ],
};
