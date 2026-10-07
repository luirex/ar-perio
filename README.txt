AR PERIO · Entrenamiento interactivo en Periodoncia
====================================================

VERSIÓN HTML PURO (sin Node, sin instalación)
---------------------------------------------
Esta carpeta es una aplicación web completa que se ejecuta en cualquier
navegador moderno (Chrome, Edge, Firefox, Safari) con WebGL.

CÓMO EJECUTARLA (dos opciones):

  Opción A — Doble clic (recomendada para aulas):
     Abre el archivo index.html con doble clic. Listo.
     Todo funciona sin internet: el motor 3D (Three.js) va incluido en
     la carpeta vendor/ y no hay dependencias externas.

  Opción B — Servidor estático (opcional):
     python3 -m http.server 8080
     y abre http://localhost:8080
     (o cualquier hosting estático: GitHub Pages, Netlify, un USB…)

ACCESO DOCENTE
--------------
El módulo «Panel docente» está protegido por código de acceso.

  Código inicial: PERIO2025

Se puede cambiar en Panel docente → Ajustes → Código de acceso.
Como docente puedes:
  · Crear, editar y duplicar casos clínicos completos
  · SUBIR FOTOS clínicas y RADIOGRAFÍAS reales (se guardan en el
    navegador como imágenes optimizadas) y asociarlas a los casos
  · Gestionar el banco de radiografías del curso (con visor de
    brillo/contraste/inversión y zoom)
  · Crear desafíos de sondaje objetivo y preguntas de repaso
  · Revisar los resultados y errores frecuentes del estudiante
  · Exportar/importar todo el contenido como JSON para compartirlo
    con otros docentes

IMPORTANTE: los datos (progreso del estudiante, casos del docente,
radiografías) se guardan en el almacenamiento local del NAVEGADOR.
Si se borra la información de navegación, se pierden. Usa la
exportación JSON como copia de seguridad.

CONTENIDO DE LA CARPETA
-----------------------
  index.html            Punto de entrada
  css/main.css          Tema clínico completo
  vendor/               Three.js r147 + OrbitControls (locales)
  js/                   Núcleo, datos y motor 3D
  js/views/             Módulos de la interfaz (9 módulos)

MÓDULOS
-------
  1. Aprender Periodoncia · teoría con esquemas y quizzes
  2. Exploración 3D · capas anatómicas y modos de visualización
  3. Simulación de sondaje · transparencia dinámica de la encía
  4. Periodontograma · 6 sitios, NIC, BOP, interpretación
  5. Casos clínicos · historia, radiografías, razonamiento
  6. Práctica / Desafíos · evaluación de precisión
  7. Mi progreso · estadísticas del estudiante
  8. Panel docente · (código de acceso)

Simulador educativo de uso preclínico. No sustituye la formación ni el
criterio profesional.
