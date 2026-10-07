# 🦷 AR PERIO — Entrenamiento interactivo en Periodoncia

Simulador educativo 3D de periodoncia para uso preclínico. **HTML/JavaScript puro**: sin Node, sin instalación, sin dependencias externas. Se ejecuta en cualquier navegador moderno (Chrome, Edge, Firefox, Safari) con WebGL.

![Módulos](https://img.shields.io/badge/m%C3%B3dulos-8-blue) ![Licencia](https://img.shields.io/badge/uso-educativo-green) ![Offline](https://img.shields.io/badge/funciona-sin%20internet-orange)

## 🚀 Cómo ejecutarla

**Opción A — Doble clic (recomendada para aulas):**
Abre el archivo `index.html` con doble clic. Listo. Todo funciona sin internet: el motor 3D (Three.js r147) va incluido en la carpeta `vendor/`.

**Opción B — Servidor estático (opcional):**
```bash
python3 -m http.server 8080
# abre http://localhost:8080
```
Compatible con cualquier hosting estático: GitHub Pages, Netlify, etc.

## 📋 Módulos

| # | Módulo | Descripción |
|---|--------|-------------|
| 1 | **Aprender Periodoncia** | Teoría con esquemas y quizzes |
| 2 | **Exploración 3D** | Capas anatómicas y modos de visualización |
| 3 | **Simulación de sondaje** | Transparencia dinámica de la encía |
| 4 | **Periodontograma** | 6 sitios por diente, NIC, BOP, interpretación |
| 5 | **Casos clínicos** | Historia, radiografías, razonamiento |
| 6 | **Práctica / Desafíos** | Evaluación de precisión |
| 7 | **Mi progreso** | Estadísticas del estudiante |
| 8 | **Panel docente** | Protegido por código de acceso |

## 👨‍🏫 Acceso docente

El módulo «Panel docente» está protegido por código de acceso.

> **Código inicial:** `PERIO2025`

Como docente puedes:
- Crear, editar y duplicar casos clínicos completos
- Subir fotos clínicas y radiografías reales (se guardan en el navegador como imágenes optimizadas)
- Gestionar el banco de radiografías del curso (visor con brillo/contraste/inversión y zoom)
- Crear desafíos de sondaje objetivo y preguntas de repaso
- Revisar resultados y errores frecuentes del estudiante
- Exportar/importar todo el contenido como JSON

## 📁 Estructura del proyecto

```
ar-perio-html/
├── index.html        # Punto de entrada
├── css/
│   └── main.css      # Tema clínico completo
├── vendor/           # Three.js r147 + OrbitControls (locales)
├── js/               # Núcleo, datos y motor 3D
│   └── views/        # Módulos de la interfaz
└── README.txt
```

## ⚠️ Notas importantes

- Los datos (progreso del estudiante, casos del docente, radiografías) se guardan en el **almacenamiento local del navegador**. Si se borra la información de navegación, se pierden. Usa la **exportación JSON** como copia de seguridad.
- Simulador educativo de uso preclínico. **No sustituye la formación ni el criterio profesional.**
