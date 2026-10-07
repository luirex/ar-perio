/* AR PERIO — learn-data-2.js (portado de src/data/learn/part2.ts) */
/**
 * AR PERIO — Contenido educativo (2/2): Enfermedades periodontales e Instrumentación.
 */
const ENFERMEDADES = {
    id: "enfermedades",
    title: "Enfermedades periodontales",
    description: "Del estado de salud a la periodontitis: gingivitis, periodontitis, estadificación, gradación y factores de riesgo según la clasificación de 2017.",
    topics: [
        {
            id: "en-salud",
            title: "Salud periodontal",
            summary: "Definición de salud periodontal: hallazgos clínicos y estado de mantenimiento en dientes con y sin periodonto reducido.",
            blocks: [
                {
                    type: "p",
                    text: "La **salud periodontal** se define clínicamente por ausencia de inflamación: encía de color y contorno normales, sondaje de 1–3 mm, ausencia de sangrado al sondaje y ausencia de pérdida de inserción progresiva. La salud puede ser **intacta** (sin pérdida de inserción) o **restablecida sobre un periodonto reducido** (paciente tratado con secuelas anatómicas pero estable).",
                },
                {
                    type: "table",
                    headers: ["Parámetro", "Salud intacta", "Salud sobre periodonto reducido"],
                    rows: [
                        ["BOP", "≤ 10 % de sitios", "≤ 10 % de sitios"],
                        ["Profundidad de sondaje", "1–3 mm", "Puede haber sitios de 4 mm estables"],
                        ["Nivel de inserción", "En CEJ", "Reducido pero estable entre controles"],
                        ["Sangrado espontáneo / supuración", "Ausentes", "Ausentes"],
                    ],
                },
                {
                    type: "p",
                    text: "La salud no es un estado absoluto: se mantiene mediante el **control del biofilm** por el paciente y la **terapia de soporte periodontal** profesional. En AR PERIO, la condición «Periodonto sano» del modelo 3D muestra el margen fino adaptado, el surco fisiológico y el sondaje de 1–3 mm que definen este estado; comparar esta geometría con la de las condiciones patológicas es un excelente ejercicio de entrenamiento visual.",
                },
                {
                    type: "note",
                    tone: "tip",
                    text: "Un porcentaje de sitios con BOP menor del 10 % en un periodonto estable se considera compatible con salud clínica.",
                },
            ],
            quiz: [
                {
                    id: "en-sal-q1",
                    prompt: "¿Qué porcentaje de sitios con sangrado al sondaje es compatible con salud clínica?",
                    options: ["0 % exacto", "≤ 10 %", "≤ 30 %", "≤ 50 %"],
                    correct: 1,
                    explanation: "Se acepta un BOP ≤ 10 % como compatible con salud/estabilidad clínica.",
                },
            ],
        },
        {
            id: "en-gingivitis",
            title: "Gingivitis",
            summary: "Inflamación gingival reversible sin pérdida de inserción: formas, diagnóstico diferencial y evolución al sondaje.",
            blocks: [
                {
                    type: "p",
                    text: "La **gingivitis** es la inflamación del tejido gingival como respuesta al biofilm dental, **sin pérdida de inserción ni de hueso**. Es reversible: eliminada la causa y restaurada la higiene, la encía recupera su aspecto normal. Sus signos cardinales son eritema, edema con aumento de volumen, sangrado al sondaje y pérdida de la estipulación, con sondaje que puede alcanzar 3–4 mm por la seudobolsa edematosa.",
                },
                {
                    type: "diagram",
                    id: "gingivitisVsPeriodontitis",
                    caption: "Comparación de la geometría del sondaje en salud, gingivitis y periodontitis.",
                },
                {
                    type: "list",
                    items: [
                        "**Gingivitis inducida por biofilm:** la forma más prevalente; depende de la acumulación y del tiempo sin higiene.",
                        "**Gingivitis como manifestación de enfermedades sistémicas:** diabetes, leucemias, modificaciones hormonales (pubertad, embarazo).",
                        "**Lesiones gingivales no inducidas por biofilm:** de origen viral, fúngico, genético, dermatológico, traumático o alérgico.",
                    ],
                },
                {
                    type: "p",
                    text: "En el sondaje, la gingivitis se traduce en **seudobolsas**: el margen edematoso se desplaza coronalmente y la PD aumenta (típicamente 3–4 mm), pero el nivel de inserción medido desde el CEJ permanece normal. En AR PERIO, la condición «Gingivitis» reproduce exactamente esta geometría: margen engrosado y elevado, PD de 3–4 mm, y sangrado al sondaje en todos los sitios al activar el registro.",
                },
                {
                    type: "note",
                    tone: "clinical",
                    text: "La gingivitis NO es sinónimo de «bolsa de 4 mm»: la clave diagnóstica es el NIC conservado con margen coronal, y su tratamiento es la higiene y el raspado supragingival.",
                },
            ],
            quiz: [
                {
                    id: "en-gin-q1",
                    prompt: "¿Cuál es la característica diferencial de la gingivitis frente a la periodontitis?",
                    options: [
                        "Sangrado al sondaje",
                        "Ausencia de pérdida de inserción",
                        "Eritema marginal",
                        "Presencia de biofilm",
                    ],
                    correct: 1,
                    explanation: "Ambas pueden sangrar y tener biofilm; solo la periodontitis implica pérdida de inserción (NIC desde CEJ aumentado).",
                },
                {
                    id: "en-gin-q2",
                    prompt: "El aumento de la PD en la gingivitis edematosa se debe a…",
                    options: [
                        "Migración apical del epitelio de unión",
                        "Desplazamiento coronal del margen (seudobolsa)",
                        "Reabsorción de la cresta alveolar",
                        "Hiperplasia del cemento",
                    ],
                    correct: 1,
                    explanation: "El edema eleva el margen gingival y crea una seudobolsa sin destrucción del aparato de inserción.",
                },
            ],
        },
        {
            id: "en-periodontitis",
            title: "Periodontitis",
            summary: "La enfermedad destructiva del periodonto: patogenia, formas clínicas y criterios diagnósticos diferenciales.",
            blocks: [
                {
                    type: "p",
                    text: "La **periodontitis** es una enfermedad inflamatoria crónica de causa multifactorial, asociada a un biofilm disbiótico y modulada por factores del hospedero, que produce **destrucción progresiva del aparato de inserción** (epitelio de unión, conectivo, ligamento y hueso alveolar). Clínicamente se manifiesta por bolsas verdaderas (NIC ≥ 4 mm desde el CEJ), sangrado/supuración, pérdida ósea radiográfica y, en fases avanzadas, movilidad, migraciones y pérdida dentaria.",
                },
                {
                    type: "p",
                    text: "La lesión sigue una secuencia: gingivitis inicial → lesión temprana → lesión establecida → lesión avanzada. La transformación de una gingivitis en periodontitis ocurre solo en individuos **susceptibles**, y depende del equilibrio entre la carga bacteriana, la respuesta inmunitaria/inflamatoria del hospedero y los factores de riesgo (tabaco, diabetes, estrés, genética). Es esencial entender que la periodontitis es una enfermedad de **sitios**: progresa en brotes localizados, por lo que un diente puede estar sano y su vecino albergar una bolsa activa.",
                },
                {
                    type: "kv",
                    title: "Diagnóstico diferencial con gingivitis",
                    items: [
                        { k: "Nivel de inserción", v: "Perdido en periodontitis (NIC ≥ 4 mm); conservado en gingivitis" },
                        { k: "Pérdida ósea radiográfica", v: "Presente solo en periodontitis" },
                        { k: "Recesión y movilidad", v: "Posibles en periodontitis; ausentes en gingivitis" },
                        { k: "Reversibilidad", v: "La gingivitis es reversible; la periodontitis solo se estabiliza o regenera parcialmente" },
                    ],
                },
                {
                    type: "note",
                    tone: "clinical",
                    text: "En AR PERIO activa las condiciones «Periodontitis inicial/moderada/avanzada» y observa cómo el fondo del surco desciende apical al CEJ (bolsa verdadera) mientras el margen puede permanecer coronal, recesado o ambos.",
                },
            ],
            quiz: [
                {
                    id: "en-per-q1",
                    prompt: "La periodontitis se diferencia de la gingivitis porque…",
                    options: [
                        "Solo afecta a adultos mayores",
                        "Implica pérdida de inserción y de hueso alveolar",
                        "No presenta sangrado",
                        "Es producida exclusivamente por hongos",
                    ],
                    correct: 1,
                    explanation: "La destrucción del aparato de inserción (con pérdida ósea radiográfica) define a la periodontitis.",
                },
                {
                    id: "en-per-q2",
                    prompt: "La progresión de la periodontitis se describe como…",
                    options: [
                        "Lineal y uniforme en todos los dientes",
                        "En brotes localizados por sitios",
                        "Siempre aguda y dolorosa",
                        "Independiente del biofilm",
                    ],
                    correct: 1,
                    explanation: "La enfermedad progresa de forma episódica y site-specific: algunos sitios se destruyen mientras otros permanecen estables.",
                },
            ],
        },
        {
            id: "en-estadificacion",
            title: "Estadificación",
            summary: "La severidad y complejidad de la periodontitis según la clasificación 2017: estadios I a IV y sus criterios.",
            blocks: [
                {
                    type: "p",
                    text: "La **estadificación** responde a la pregunta «¿cuánta destrucción hay y qué complejidad presenta el caso?». Se basa en la pérdida de inserción clínica (CAL), la pérdida ósea radiográfica, la pérdida dentaria por periodontitis y la complejidad del manejo. Cuando los criterios discrepan, se asigna siempre el **estadio más alto**. La progresión estimada se corrige con la edad (pérdida÷edad) para detectar casos agresivos en jóvenes.",
                },
                {
                    type: "diagram",
                    id: "staging",
                    caption: "Criterios de estadificación I–IV de la periodontitis.",
                },
                {
                    type: "table",
                    headers: ["Criterio", "Estadio I", "Estadio II", "Estadio III", "Estadio IV"],
                    rows: [
                        ["CAL (sitio peor)", "1–2 mm", "3–4 mm", "≥ 5 mm", "≥ 5 mm"],
                        ["Pérdida ósea radiográfica", "< 15 %", "15–33 %", "> 33 %", "> 33 %"],
                        ["Pérdida dentaria por perio", "0", "0", "≤ 4 dientes", "≥ 5 dientes"],
                        ["Complejidad", "—", "Defectos angulares ≤ 3 mm", "Defectos angulares > 3 mm, furcación II–III", "Furcación III, mordida abierta, migraciones"],
                    ],
                },
                {
                    type: "p",
                    text: "El estadio orienta la **terapia**: el estadio I–II se resuelve con higiene y raspado y alisado radicular; el III puede requerir cirugía regenerativa o resecativa; el IV implica tratamiento multidisciplinario, incluyendo consideraciones protésicas y de rehabilitación. En los casos clínicos de AR PERIO deberás aplicar estos criterios con los datos del periodontograma y de la radiografía virtual para asignar el estadio correcto.",
                },
            ],
            quiz: [
                {
                    id: "en-est-q1",
                    prompt: "Un paciente con CAL de 6 mm en el sitio peor, pérdida ósea del 40 % y un molar perdido por periodontitis corresponde a estadio…",
                    options: ["I", "II", "III", "IV"],
                    correct: 2,
                    explanation: "CAL ≥ 5 mm con pérdida ósea > 33 % y ≤ 4 dientes perdidos por periodontitis definen el estadio III.",
                },
                {
                    id: "en-est-q2",
                    prompt: "Ante criterios dispares entre CAL y radiografía, se asigna…",
                    options: [
                        "El estadio más bajo",
                        "El promedio de los criterios",
                        "El estadio más alto",
                        "Se repite el examen",
                    ],
                    correct: 2,
                    explanation: "La regla de la clasificación 2017 es asignar siempre el estadio más alto ante cualquier criterio discrepante.",
                },
            ],
        },
        {
            id: "en-gradacion",
            title: "Gradación",
            summary: "La velocidad de progresión y el riesgo del hospedero: grados A, B y C con sus modificadores.",
            blocks: [
                {
                    type: "p",
                    text: "La **gradación** responde a «¿qué tan rápido progresa el caso y cuál es el riesgo del paciente?». El grado primario se estima con la **pérdida de inserción o hueso dividida por la edad** (índice de progresión), y se modifica por los **factores de riesgo directos**: tabaquismo (≥ 10 o ≥ 20 cigarrillos/día elevan un grado) y diabetes con HbA1c ≥ 7.0 %. Un caso con pérdida ósea del 50 % a los 30 años (50/30 > 1.0) es grado C: progresión rápida y hospedero de alto riesgo.",
                },
                {
                    type: "table",
                    headers: ["Criterio", "Grado A (lento)", "Grado B (moderado)", "Grado C (rápido)"],
                    rows: [
                        ["Pérdida ósea / edad", "< 0.25", "0.25 – 1.0", "> 1.0"],
                        ["Tabaco", "No fumador", "< 10 cig/día", "≥ 10 cig/día"],
                        ["Diabetes", "Normoglucemia", "HbA1c < 7.0 % en diabético", "HbA1c ≥ 7.0 %"],
                        ["Casos típicos", "Adulto mayor, destrucción leve", "Progresión proporcional a la edad", "Joven con destrucción avanzada"],
                    ],
                },
                {
                    type: "p",
                    text: "El grado orienta la **intensidad del tratamiento y del seguimiento**: un grado C exige terapia más agresiva, intervalos de soporte cortos (3–6 meses) y control estricto de los factores de riesgo; un grado A permite intervalos más largos. Los modificadores de grado también incluyen la carga de biofilm desproporcionada respecto a la destrucción, y ciertos genotipos, lo que se valora caso por caso.",
                },
                {
                    type: "note",
                    tone: "clinical",
                    text: "Mnemotecnia: el Estadio mira la FOTO (daño acumulado); el Grado mira la PELÍCULA (ritmo y riesgo).",
                },
            ],
            quiz: [
                {
                    id: "en-gra-q1",
                    prompt: "Paciente de 30 años con pérdida ósea del 45 % y HbA1c de 8 %: su grado es…",
                    options: ["A", "B", "C", "No graduable"],
                    correct: 2,
                    explanation: "45/30 > 1.0 y la diabetes mal controlada (HbA1c ≥ 7 %) confirman el grado C (progresión rápida).",
                },
                {
                    id: "en-gra-q2",
                    prompt: "El grado C implica…",
                    options: [
                        "Intervalos de mantenimiento más largos",
                        "Terapia intensiva y soporte con intervalos cortos",
                        "Que no requiere tratamiento",
                        "Solo higiene oral",
                    ],
                    correct: 1,
                    explanation: "El grado C (alto riesgo) exige terapia intensiva, control de factores de riesgo y mantenimiento en intervalos cortos (3–6 meses).",
                },
            ],
        },
        {
            id: "en-riesgo",
            title: "Factores de riesgo",
            summary: "Determinantes de susceptibilidad y progresión: tabaco, diabetes, higiene, estrés y factores locales.",
            blocks: [
                {
                    type: "p",
                    text: "Un **factor de riesgo** es una condición que aumenta la probabilidad de desarrollar la enfermedad o de que progrese. En periodoncia se dividen en **modificables** (sobre los que se puede actuar) y **no modificables** (genética, edad). Su identificación es obligatoria en el plan de tratamiento: tratar la bolsa sin controlar el factor de riesgo condena al fracaso terapéutico.",
                },
                {
                    type: "kv",
                    title: "Factores de riesgo principales",
                    items: [
                        { k: "Tabaco", v: "El más relevante: reduce la respuesta inmunitaria y vascular, enmascara el sangrado y empeora el pronóstico." },
                        { k: "Diabetes mellitas", v: "La hiperglucemia crónica amplifica la inflamación; la HbA1c ≥ 7 % aumenta el riesgo y la pérdida de inserción." },
                        { k: "Higiene oral deficiente", v: "Determina la carga y el tiempo de exposición al biofilm." },
                        { k: "Estrés y depresión", v: "Modulan la respuesta inmunitaria y el autocuidado." },
                        { k: "Factores locales", v: "Cálculo, restauraciones desbordadas, caries, prótesis deficientes, anatomía radicular." },
                        { k: "Predisposición genética", v: "Modula la susceptibilidad (agregación familiar en formas agresivas)." },
                    ],
                },
                {
                    type: "p",
                    text: "En la anamnesis de los casos clínicos de AR PERIO hallarás estos factores integrados con los hallazgos clínicos: reconocerlos —y proponer su control— forma parte de las preguntas de factores de riesgo y del plan de tratamiento. Recuerda que el tabaquismo eleva el grado de la periodontitis y que la diabetes no controlada exige coordinación con el médico tratante.",
                },
                {
                    type: "note",
                    tone: "warn",
                    text: "El paciente fumador suele sangrar menos: el vasoconstrictor enmascara el BOP. Valora la inflamación con criterios adicionales (color, edema, PD) y no confíes solo en el sangrado.",
                },
            ],
            quiz: [
                {
                    id: "en-rie-q1",
                    prompt: "¿Cuál de los siguientes es un factor de riesgo NO modificable?",
                    options: ["Tabaquismo", "Higiene oral", "Predisposición genética", "Diabetes mal controlada"],
                    correct: 2,
                    explanation: "La genética no es modificable; tabaco, higiene y control glucémico sí pueden modificarse.",
                },
                {
                    id: "en-rie-q2",
                    prompt: "En el paciente fumador, el sangrado al sondaje suele estar…",
                    options: [
                        "Aumentado",
                        "Enmascarado (disminuido) por vasoconstricción",
                        "Sin cambios",
                        "Ausente siempre",
                    ],
                    correct: 1,
                    explanation: "La nicotina produce vasoconstricción que reduce el eritema y el sangrado, enmascarando la inflamación real.",
                },
            ],
        },
    ],
};
const INSTRUMENTACION = {
    id: "instrumentacion",
    title: "Instrumentación",
    description: "Instrumentos periodontales y su técnica: sondas, curetas, equipos ultrasónicos y principios del raspado y alisado radicular.",
    topics: [
        {
            id: "in-sonda",
            title: "Sonda periodontal",
            summary: "Diseño, tipos (Williams, UNC-15, Nabers, PCP) y lectura correcta de la escala milimétrica.",
            blocks: [
                {
                    type: "p",
                    text: "La **sonda periodontal** es un instrumento de diagnóstico, no de tratamiento: su punta redondeada y calibrada permite medir la profundidad del surco sin dañar los tejidos. Consta de mango, vástago (recto o angulado) y hoja de trabajo calibrada en milímetros. En AR PERIO se reproduce una sonda tipo **Williams**, con bandas marcadas a 1, 2, 3, 5, 7, 8 y 10 mm.",
                },
                {
                    type: "diagram",
                    id: "probe",
                    caption: "Escala milimétrica de la sonda y magnificación de la punta redondeada.",
                },
                {
                    type: "table",
                    headers: ["Tipo", "Marcas (mm)", "Uso principal"],
                    rows: [
                        ["Williams", "1, 2, 3, 5, 7, 8, 10", "Sondaje general del surco y bolsas"],
                        ["UNC-15", "Cada mm, con números cada 5", "Docencia y registro detallado"],
                        ["PCP / O'Leary", "3, 6, 9, 12 (código de colores)", "Exámenes epidemiológicos rápidos"],
                        ["Nabers", "Punta curva, sin marcas finas", "Sondaje de furcaciones"],
                    ],
                },
                {
                    type: "p",
                    text: "La lectura se toma con el ojo perpendicular a la escala y la sonda adaptada al fondo del surco. En la simulación 3D puedes acercar la cámara a la zona del margen y **leer directamente las bandas de la sonda** que quedan dentro del surco gracias a la transparencia dinámica de la encía, exactamente como se hace en la clínica con el espejo y la luz.",
                },
                {
                    type: "note",
                    tone: "tip",
                    text: "La punta redondeada (0.4–0.5 mm) evita perforar el epitelio de unión; su integridad debe revisarse porque las puntas desgastadas o dobladas alteran la medición y dañan el tejido.",
                },
            ],
            quiz: [
                {
                    id: "in-son-q1",
                    prompt: "La sonda de Williams presenta bandas en los milímetros…",
                    options: ["1, 2, 3, 5, 7, 8, 10", "3, 6, 9, 12", "Cada milímetro numerado", "Solo 5 y 10"],
                    correct: 0,
                    explanation: "La Williams clásica se calibra en 1-2-3-5-7-8-10 mm.",
                },
                {
                    id: "in-son-q2",
                    prompt: "Para el sondaje de furcaciones se utiliza…",
                    options: ["La sonda de Williams", "La sonda PCP", "La sonda de Nabers", "El explorador 5-7"],
                    correct: 2,
                    explanation: "La sonda de Nabers, con su punta curva, está diseñada para las entradas de furcación.",
                },
            ],
        },
        {
            id: "in-curetas",
            title: "Curetas",
            summary: "Instrumentos cortantes manuales para el raspado y alisado radicular: universal vs. Gracey y su afinado.",
            blocks: [
                {
                    type: "p",
                    text: "Las **curetas** son instrumentos manuales de corte diseñadas para retirar cálculo subgingival y cemento necrótico, dejando una superficie radicular lisa y biocompatible. Todas tienen hoja con dos bordes cortantes, cara superior redondeada (dorso) y punta redondeada —a diferencia del azadón, que tiene cara superior plana y se limita al uso supragingival—.",
                },
                {
                    type: "compare",
                    columns: ["Cureta universal", "Cureta de Gracey ( específica)"],
                    rows: [
                        ["Ambos bordes cortantes activos", "Un solo borde cortante activo (lateral externo)"],
                        ["Hoja curva en un solo plano", "Hoja desviada (offset) y curvada dos veces"],
                        ["Para cualquier superficie", "Cada número está diseñado para zonas concretas (p. ej., Gracey 5-6 anterior, 7-8 y 13-14 posteriores)"],
                        ["Ángulo de trabajo 90° respecto al vástago", "Ángulo de trabajo de 70° preestablecido"],
                    ],
                },
                {
                    type: "p",
                    text: "La **técnica** exige: agarre de lapicero, fulcrum (punto de apoyo) estable, hoja adaptada al diente con el tercio terminal en contacto, angulación de 70–80° entre el borde cortante y la superficie, y golpes de trabajo potentes pero controlados con movimientos digitales. El **afinado** con piedra adecuada es imprescindible: una cureta desafilada compresiona el cálculo en lugar de cortarlo y traumatiza el tejido.",
                },
                {
                    type: "note",
                    tone: "clinical",
                    text: "Recuerda la secuencia del RAR: primero instrumentar el área más alejada del fulcrum y finalizar cada movimiento coronalmente, nunca deslizar la hoja dentro de la pared tisular.",
                },
            ],
            quiz: [
                {
                    id: "in-cur-q1",
                    prompt: "La cureta de Gracey se diferencia de la universal porque…",
                    options: [
                        "Tiene ambos bordes cortantes activos",
                        "Tiene un solo borde activo y hoja desviada para zonas específicas",
                        "Se usa solo supragingivalmente",
                        "Tiene cara superior plana",
                    ],
                    correct: 1,
                    explanation: "Las Gracey son específicas: un borde cortante activo y hoja con offset para superficies determinadas.",
                },
                {
                    id: "in-cur-q2",
                    prompt: "La angulación de trabajo correcta del borde cortante respecto a la raíz es de…",
                    options: ["45°", "70–80°", "90–100°", "15°"],
                    correct: 1,
                    explanation: "El ángulo ideal de corte respecto a la superficie radicular es de 70–80 grados.",
                },
            ],
        },
        {
            id: "in-ultrasonicos",
            title: "Instrumentos ultrasónicos",
            summary: "Raspado ultrasónico: mecanismo de acción, tipos de puntas y precauciones clínicas.",
            blocks: [
                {
                    type: "p",
                    text: "Los **instrumentos ultrasónicos** retiran el cálculo mediante vibración de alta frecuencia (25–42 kHz) combinada con irrigación acuosa. Su eficacia depende de tres factores: la potencia del aparato, el diseño de la punta y —el más importante— la **técnica de adaptación**: la punta trabaja con su cara lateral y su tercio terminal, nunca con la punta misma, con angulación baja (0–15°) y presión ligera, en movimientos de barrido superpuestos.",
                },
                {
                    type: "table",
                    headers: ["Tipo", "Frecuencia", "Características"],
                    rows: [
                        ["Magnetoestrictivo", "≈ 25–30 kHz", "Vibración elíptica; todas las caras de la punta cortan; requiere más refrigeración"],
                        ["Piezoeléctrico", "≈ 28–36 kHz", "Vibración lineal; corta con las caras laterales; calor más controlado"],
                    ],
                },
                {
                    type: "p",
                    text: "Las ventajas del ultrasonido incluyen la **irrigación** del surco (lavado de endotoxinas y detritus), el acceso a fondos de bolsa con puntas finas y el menor tiempo operatorio. Sus **precauciones**: evitar en pacientes con marcapasos antiguos no blindados, valorar aerosoles (protección cruzada, alta carga bacteriana), y moderar su uso en superficies radiculares expuestas para no remover excesivo cemento.",
                },
                {
                    type: "note",
                    tone: "warn",
                    text: "Trabajar con la punta perpendicular o apoyada de punta fragmenta el esmalte y calienta la hoja: la regla de oro es cara lateral, angulación baja y movimiento constante.",
                },
            ],
            quiz: [
                {
                    id: "in-ult-q1",
                    prompt: "La punta ultrasónica debe aplicarse con…",
                    options: [
                        "La punta misma, perpendicular al diente",
                        "La cara lateral y el tercio terminal, con angulación baja",
                        "Ambos bordes como la cureta",
                        "Presión firme y sin irrigación",
                    ],
                    correct: 1,
                    explanation: "El ultrasonido trabaja con la cara lateral y el tercio activo, con angulación de 0–15° y presión ligera.",
                },
            ],
        },
        {
            id: "in-tecnica",
            title: "Técnica de instrumentación",
            summary: "Principios comunes del raspado y alisado radicular: secuencia, fulcrum, angulación y criterios de terminación.",
            blocks: [
                {
                    type: "p",
                    text: "El **raspado y alisado radicular (RAR)** es el pilar de la terapia periodontal no quirúrgica: eliminar el biofilm y el cálculo subgingival y dejar la raíz lisa y compatible con la reinsertión. Su eficacia es máxima en bolsas de 4–6 mm y disminuye con la profundidad: por encima de 6–7 mm el acceso se complica y se valora la cirugía de acceso.",
                },
                {
                    type: "diagram",
                    id: "instruments",
                    caption: "Principios de agarre, fulcrum y angulación de la instrumentación manual.",
                },
                {
                    type: "list",
                    ordered: true,
                    items: [
                        "**Anestesia** adecuada de la zona.",
                        "**Secuencia ordenada** por cuadrantes y superficies (p. ej., de distal a mesial, de vestibular a lingual).",
                        "**Agarre de lapicero**, fulcrum estable extrabucal o intrabucal, y brazo relajado.",
                        "**Adaptación** del tercio terminal de la hoja y **angulación** de 70–80° (manual) o 0–15° (ultrasónico).",
                        "**Golpes de trabajo** coronales, superpuestos, potentes para cálculo y ligeros para el alisado final.",
                        "**Criterios de terminación**: superficie dura y lisa al explorador, ausencia de cálculo visible, control del sangrado.",
                    ],
                },
                {
                    type: "p",
                    text: "La reevaluación a las 4–6 semanas determina el resultado: la reducción de la PD se logra por recolocación del margen (resolución del edema) y por adherencia del tejido (retracción por cicatrización). Los sitios residuales con PD ≥ 5 mm y BOP positivo indican reinspección o terapia quirúrgica. La práctica preclínica en AR PERIO entrena los fundamentos de acceso y angulación que esta secuencia exige en la clínica.",
                },
                {
                    type: "note",
                    tone: "tip",
                    text: "Nunca se termina un RAR por el reloj sino por los criterios táctiles y visuales: dureza, lisura y ausencia de sangrado persistente.",
                },
            ],
            quiz: [
                {
                    id: "in-tec-q1",
                    prompt: "¿A las cuántas semanas se reevalúa el resultado del RAR?",
                    options: ["1 semana", "4–6 semanas", "3 meses", "Al día siguiente"],
                    correct: 1,
                    explanation: "La maduración de la cicatrización y la estabilización del margen requieren de 4 a 6 semanas.",
                },
                {
                    id: "in-tec-q2",
                    prompt: "El fulcrum correcto es…",
                    options: [
                        "Un punto de apoyo estable, generalmente sobre dientes vecinos",
                        "Sostener el instrumento con toda la mano",
                        "Apoyar el instrumento en la mejilla",
                        "Trabajar sin apoyo",
                    ],
                    correct: 0,
                    explanation: "El fulcrum es el apoyo estable (habitualmente en dientes contiguos) que controla la fuerza y evita accidentes.",
                },
            ],
        },
    ],
};
