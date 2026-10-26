# Portal Oficial de Veeduría Ciudadana y Radicación - JAC Barrio Panamá II (Valledupar)

Plataforma comunitaria clonada e inspirada en la arquitectura de la sede electrónica institucional de la **Alcaldía de Valledupar (GOV.CO)**, adaptada con un propósito civil específico: **recoger, documentar y convertir en fichas de presión social para Instagram todos los reclamos, daños y solicitudes del Barrio Panamá II**.

---

## 🎯 Objetivo de la Estrategia Comunitaria

1. **Formalidad y Blindaje Legal (Ley 1757 de 2015):**  
   Cada vecino que radica una queja (por ejemplo, el poste de luz averiado, alcantarillas de Emdupar rebosadas o huecos en la vía) recibe un **Número de Radicado Consecutivo Oficial** con fecha y hora inmutable.
2. **Fin del "Visto" o la "Ignorada":**  
   Si una solicitud no es atendida, el sistema activa automáticamente la insignia **`IGNORADO POR LA ALCALDÍA`** y lleva un contador público de los días de desatención.
3. **Eslabón con Instagram (Presión Social Inmediata):**  
   Con un solo clic en **"Generar Ficha Instagram"**, la plataforma genera:
   * **Imagen gráfica cuadrada (1:1)** optimizada para post o historia, con el escudo, ubicación, foto de la evidencia y los días esperando solución.
   * **Texto (Caption) automático** con etiquetas directas a las cuentas del Alcalde, la Alcaldía, la Personería de Valledupar y hashtags comunitarios (`#PanamaIIPideRespuesta`, `#ValleduparSinLuz`).

---

## 📁 Archivos del Proyecto

* **[index.html](file:///c:/Users/Apocali/Desktop/Ingeneria%20inversa/index.html):** Estructura completa de la página con estética institucional GOV.CO, formulario de radicación, muro público de casos y visor interactivo.
* **[styles.css](file:///c:/Users/Apocali/Desktop/Ingeneria%20inversa/styles.css):** Reglas visuales, insignias y estilos adaptados para impresión formal de radicados.
* **[app.js](file:///c:/Users/Apocali/Desktop/Ingeneria%20inversa/app.js):** Lógica del sistema, persistencia en `localStorage`, motor de búsqueda de radicados, generador de imágenes de alta resolución mediante HTML5 Canvas y confeti ciudadano.

---

## 🚀 Cómo Usarlo y Verlo en tu Computadora

Solo abre el archivo **`index.html`** haciendo doble clic sobre él en tu explorador de archivos, o ábrelo directamente en tu navegador favorito (Chrome, Edge, Brave, Firefox).

Si prefieres levantarlo con un servidor local:
```powershell
npx serve .
```
o con Python:
```powershell
python -m http.server 8080
```
Y visita `http://localhost:8080`.

---

## 🌐 Cómo Publicarlo Gratis en Internet para que Todos los Vecinos Puedan Entrar

Puedes subir esta carpeta a cualquiera de estas plataformas gratuitas en menos de 2 minutos:

1. **Vercel / Netlify:**
   * Entra a [vercel.com](https://vercel.com) o [netlify.com](https://netlify.com).
   * Arrastra la carpeta `Ingeneria inversa` y suéltala en el panel.
   * Te dará un enlace público instantáneo (ejemplo: `jac-panama2-valledupar.vercel.app`) para ponerlo en la biografía de Instagram de la JAC.

2. **GitHub Pages:**
   * Sube estos archivos a un repositorio en GitHub y activa **Settings > Pages > Deploy from branch main**.

---

## 📱 Flujo Recomendado para el Instagram de la JAC

1. **Paso 1:** En la biografía de tu cuenta de Instagram `@jacpanama2.valledupar`, pon el enlace de la web:  
   👉 *"Radica aquí tu reporte formal del barrio Panamá II"*.
2. **Paso 2:** Cuando un vecino radique un poste caído o cualquier daño, entra al **Muro de Evidencia** de la página y toca **"Generar Ficha Instagram"**.
3. **Paso 3:** Toca **"Descargar Imagen PNG"** y **"Copiar Texto para Instagram"**.
4. **Paso 4:** Súbelo a Instagram etiquetando a:
   * `@ernestoorozcodurango` (Alcalde de Valledupar)
   * `@alcaldiavalledupar`
   * `@personeriavalledupar`
   * `@gobcesar`
5. **Paso 5:** Cuando la Alcaldía o la empresa de servicios solucione el problema, toca el botón de recarga en la tarjeta para cambiar su estado a **`Solucionado`** y publicar el post de agradecimiento y victoria comunitaria.
