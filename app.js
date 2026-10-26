/**
 * JAC PanamÃ¡ II - Plataforma Oficial de VeedurÃ­a Ciudadana y PresiÃ³n Social
 * AlcaldÃ­a de Valledupar, Cesar - Colombia
 */

// Casos precargados iniciales con el caso clave del poste de luz
const CASOS_INICIALES = [
  {
    id: "RAD-PANAMA-2026-0001",
    titulo: "Poste de alumbrado pÃºblico a punto de colapsar sobre viviendas",
    categoria: "Alumbrado PÃºblico",
    ubicacion: "Manzana 14 Casa 8 (CallejÃ³n peatonal)",
    tiempo: "38 dÃ­as",
    diasNumero: 38,
    descripcion: "El poste de concreto presenta fractura severa en la base y se encuentra inclinado, sostenido Ãºnicamente por el cableado de energÃ­a. Se radicÃ³ peticiÃ³n formal a ESTIV y a la AlcaldÃ­a pero fuimos totalmente ignorados. NiÃ±os juegan a diario en la zona y el riesgo de electrocuciÃ³n o colapso es crÃ­tico.",
    foto: "https://images.unsplash.com/photo-1544717302-de2939b7ef71?auto=format&fit=crop&w=800&q=80",
    estado: "Ignorado",
    afectados: "45 familias",
    fecha: "18 de Septiembre, 2026",
    solicitante: "JAC PanamÃ¡ II / ComitÃ© de VeedurÃ­a"
  },
  {
    id: "RAD-PANAMA-2026-0002",
    titulo: "Alcantarilla rebosada de aguas servidas frente a la cancha sintÃ©tica",
    categoria: "Emdupar",
    ubicacion: "Carrera 6B frente a la Cancha SintÃ©tica",
    tiempo: "22 dÃ­as",
    diasNumero: 22,
    descripcion: "Aguas negras corriendo por la calle, olores nauseabundos e invasiÃ³n de mosquitos. Emdupar no ha enviado el carro vactor a pesar de los constantes llamados de la comunidad.",
    foto: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80",
    estado: "En espera",
    afectados: "120 familias",
    fecha: "03 de Octubre, 2026",
    solicitante: "Comunidad Vecinal Mz 9 y 10"
  },
  {
    id: "RAD-PANAMA-2026-0003",
    titulo: "CrÃ¡ter peligroso en la vÃ­a de acceso Calle 44 con Carrera 6",
    categoria: "Malla Vial",
    ubicacion: "Entrada principal Calle 44 con Carrera 6",
    tiempo: "60 dÃ­as",
    diasNumero: 60,
    descripcion: "Hueco profundo que abarca media calzada y ha provocado caÃ­das de motociclistas y daÃ±os en vehÃ­culos. La SecretarÃ­a de Obras PÃºblicas de Valledupar no ha intervenido.",
    foto: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80",
    estado: "Ignorado",
    afectados: "Todo el sector",
    fecha: "25 de Agosto, 2026",
    solicitante: "Gremio de Transportadores y Vecinos"
  },
  {
    id: "RAD-PANAMA-2026-0004",
    titulo: "RecuperaciÃ³n de iluminaciÃ³n LED en el parque infantil",
    categoria: "Seguridad y Parques",
    ubicacion: "Parque Central del Barrio PanamÃ¡ II",
    tiempo: "Solucionado",
    diasNumero: 0,
    descripcion: "Gracias a la presiÃ³n pÃºblica comunitaria en redes sociales y la gestiÃ³n de la JAC, la cuadrilla de alumbrado realizÃ³ el cambio total de luminarias.",
    foto: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=800&q=80",
    estado: "Solucionado",
    afectados: "Resuelto",
    fecha: "12 de Octubre, 2026",
    solicitante: "JAC PanamÃ¡ II"
  }
];

// Noticias iniciales en vivo (extraÃ­das del portal de Valledupar)
const NOTICIAS_DEFAULT = [
  {
    id: "noticia-1",
    titulo: "Equipo Azul, a dar un paso gigante antes Real Aracataca",
    fecha: "23 de octubre de 2026",
    categoria: "Deportes",
    descripcion: "Los vallenatos vienen de imponerse en la serie sobre Locos por el FÃºtbol de NariÃ±o, teniendo en cuenta que el partido de ida terminÃ³ con victoria 1-0 a favor de los cesarenses.",
    foto: "https://valledupar-sedigov.s-integrations.co/attachment/files/download/94AE4B3E-F36B-1410-8C8C-00A971D655DB",
    enlace: "https://www.valledupar-cesar.gov.co/noticias/equipo-azul-a-dar-un-paso-gigante-antes-real-aracataca"
  },
  {
    id: "noticia-2",
    titulo: "Gobierno del alcalde Ernesto Orozco suma mÃ¡s de 130.000 acciones contra el dengue",
    fecha: "23 de octubre de 2026",
    categoria: "Salud PÃºblica",
    descripcion: "En dos aÃ±os y diez meses de la actual administraciÃ³n, los equipos de Enfermedades Transmitidas por Vectores intensifican fumigaciÃ³n y control.",
    foto: "https://valledupar-sedigov.s-integrations.co/attachment/files/download/3B484A3E-F36B-1410-8C8C-00A971D655DB",
    enlace: "https://www.valledupar-cesar.gov.co/noticias/gobierno-del-alcalde-ernesto-orozco-suma-mas-de-130000-acciones-contra-el-dengue"
  },
  {
    id: "noticia-3",
    titulo: "Capturado en Valledupar alias 'El Guajiro', seÃ±alado de cometer dos homicidios en Santa Marta",
    fecha: "22 de octubre de 2026",
    categoria: "Seguridad",
    descripcion: "De acuerdo con las autoridades, la captura se produjo en un puesto de registro y control en el perÃ­metro urbano del municipio.",
    foto: "https://valledupar-sedigov.s-integrations.co/attachment/files/download/290B4A3E-F36B-1410-8C8C-00A971D655DB",
    enlace: "https://www.valledupar-cesar.gov.co/noticias/capturado-en-valledupar-alias-el-guajiro-senalado-de-cometer-dos-homicidios-en-santa-marta"
  }
];

let reclamos = [];
let noticias = [];
let fotoActualDataUrl = "";
let reclamoSeleccionado = null;

// InicializaciÃ³n
document.addEventListener("DOMContentLoaded", () => {
  cargarReclamos();
  cargarNoticias();
  renderizarMuro("todos");
  configurarEventos();
  lucide.createIcons();
});

// Cargar Noticias (con persistencia local y fallback)
function cargarNoticias() {
  const guardadas = localStorage.getItem("valledupar_noticias_cache");
  if (guardadas) {
    try {
      noticias = JSON.parse(guardadas);
    } catch (e) {
      noticias = NOTICIAS_DEFAULT;
    }
  } else {
    noticias = NOTICIAS_DEFAULT;
    localStorage.setItem("valledupar_noticias_cache", JSON.stringify(noticias));
  }
  renderizarNoticias();
}

// Sincronizar noticias en vivo desde el portal de la AlcaldÃ­a
async function sincronizarNoticiasEnVivo() {
  const btn = document.getElementById("btnRecargarNoticias");
  const originalHtml = btn.innerHTML;
  btn.innerHTML = `<i data-lucide="loader" class="w-3.5 h-3.5 animate-spin"></i> <span>Consultando...</span>`;
  lucide.createIcons();

  try {
    // Usamos proxy pÃºblico o fetch directo para consultar el portal oficial
    const res = await fetch("https://api.allorigins.win/get?url=" + encodeURIComponent("https://www.valledupar-cesar.gov.co/"));
    if (res.ok) {
      const data = await res.json();
      const html = data.contents;
      
      // Extraemos las noticias del DOM oficial
      const newsLinks = [...html.matchAll(/href="\/noticias\/([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)];
      if (newsLinks.length > 0) {
        const nuevasNoticias = [];
        const visitados = new Set();

        for (const nl of newsLinks) {
          const slug = nl[1];
          if (visitados.has(slug)) continue;
          visitados.add(slug);

          const inner = nl[2];
          const imgMatch = inner.match(/src="([^"]+)"/);
          const textClean = inner.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

          // extraer fecha aproximada
          const fechaMatch = textClean.match(/\d{1,2}\s+de\s+[a-zÃ¡Ã©Ã­Ã³ÃºÃ±]+\s+de\s+\d{4}/i);
          const fecha = fechaMatch ? fechaMatch[0] : "Reciente";

          nuevasNoticias.push({
            id: slug,
            titulo: slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            fecha: fecha,
            categoria: "AlcaldÃ­a de Valledupar",
            descripcion: textClean.slice(0, 160) + "...",
            foto: imgMatch ? imgMatch[1] : NOTICIAS_DEFAULT[0].foto,
            enlace: "https://www.valledupar-cesar.gov.co/noticias/" + slug
          });

          if (nuevasNoticias.length >= 3) break;
        }

        if (nuevasNoticias.length > 0) {
          noticias = nuevasNoticias;
          localStorage.setItem("valledupar_noticias_cache", JSON.stringify(noticias));
          renderizarNoticias();
        }
      }
    }
  } catch (err) {
    console.log("Aviso: SincronizaciÃ³n en vivo utilizÃ³ la cachÃ© local mÃ¡s reciente.", err);
  } finally {
    btn.innerHTML = originalHtml;
    lucide.createIcons();
  }
}

function renderizarNoticias() {
  const cont = document.getElementById("contenedorNoticias");
  if (!cont || noticias.length < 3) return;

  const p = noticias[0];
  const s1 = noticias[1];
  const s2 = noticias[2];

  cont.innerHTML = `
    <!-- NOTICIA PRINCIPAL (Izquierda, Foto 3) -->
    <div class="md:col-span-6 bg-white rounded-xl border border-[#CADDFB] overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between">
      <div>
        <div class="relative h-60 w-full overflow-hidden bg-slate-900">
          <img src="${p.foto}" alt="${p.titulo}" class="w-full h-full object-cover">
          <div class="absolute top-3 left-3 bg-[#004884] text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase">
            ${p.fecha}
          </div>
        </div>
        <div class="p-5">
          <h3 class="text-base sm:text-lg font-bold text-slate-900 leading-snug hover:text-[#004884] transition cursor-pointer">
            ${p.titulo}
          </h3>
          <p class="text-xs text-slate-600 mt-2 leading-relaxed">
            ${p.descripcion}
          </p>
        </div>
      </div>
      <div class="px-5 py-3 border-t border-slate-100 bg-slate-50 flex justify-between items-center text-xs">
        <span class="text-slate-400 text-[11px]">${p.categoria}</span>
        <a href="${p.enlace}" target="_blank" class="text-[#004884] font-bold hover:underline">Leer completa â†’</a>
      </div>
    </div>

    <!-- NOTICIAS SECUNDARIAS (Derecha, Foto 3) -->
    <div class="md:col-span-6 flex flex-col gap-6">
      
      <!-- Sec 1 -->
      <div class="bg-white rounded-xl border border-[#CADDFB] overflow-hidden shadow-sm hover:shadow-md transition flex flex-col sm:flex-row items-stretch">
        <div class="sm:w-2/5 relative h-40 sm:h-auto shrink-0 bg-slate-900">
          <img src="${s1.foto}" alt="${s1.titulo}" class="w-full h-full object-cover">
        </div>
        <div class="p-4 flex flex-col justify-between flex-grow">
          <div>
            <span class="text-[10px] font-bold text-slate-400 uppercase">${s1.fecha}</span>
            <h4 class="text-xs sm:text-sm font-bold text-slate-900 leading-snug mt-1 hover:text-[#004884] transition cursor-pointer">
              ${s1.titulo}
            </h4>
            <p class="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
              ${s1.descripcion}
            </p>
          </div>
          <div class="mt-2 text-right">
            <a href="${s1.enlace}" target="_blank" class="text-xs font-bold text-[#004884] hover:underline">Ver noticia â†’</a>
          </div>
        </div>
      </div>

      <!-- Sec 2 -->
      <div class="bg-white rounded-xl border border-[#CADDFB] overflow-hidden shadow-sm hover:shadow-md transition flex flex-col sm:flex-row items-stretch">
        <div class="sm:w-2/5 relative h-40 sm:h-auto shrink-0 bg-slate-900">
          <img src="${s2.foto}" alt="${s2.titulo}" class="w-full h-full object-cover">
        </div>
        <div class="p-4 flex flex-col justify-between flex-grow">
          <div>
            <span class="text-[10px] font-bold text-slate-400 uppercase">${s2.fecha}</span>
            <h4 class="text-xs sm:text-sm font-bold text-slate-900 leading-snug mt-1 hover:text-[#004884] transition cursor-pointer">
              ${s2.titulo}
            </h4>
            <p class="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
              ${s2.descripcion}
            </p>
          </div>
          <div class="mt-2 text-right">
            <a href="${s2.enlace}" target="_blank" class="text-xs font-bold text-[#004884] hover:underline">Ver noticia â†’</a>
          </div>
        </div>
      </div>

    </div>
  `;
}

// Cargar y almacenar reclamos de PanamÃ¡ II
function cargarReclamos() {
  const guardados = localStorage.getItem("jac_panama2_reclamos");
  if (guardados) {
    try {
      reclamos = JSON.parse(guardados);
    } catch (e) {
      reclamos = CASOS_INICIALES;
    }
  } else {
    reclamos = CASOS_INICIALES;
    guardarEnLocalStorage();
  }
}

function guardarEnLocalStorage() {
  localStorage.setItem("jac_panama2_reclamos", JSON.stringify(reclamos));
}

// Renderizar Muro de Reclamos
function renderizarMuro(filtro = "todos") {
  const contenedor = document.getElementById("gridReclamos");
  if (!contenedor) return;
  contenedor.innerHTML = "";

  const filtrados = filtro === "todos" 
    ? reclamos 
    : reclamos.filter(r => r.estado.toLowerCase() === filtro.toLowerCase());

  document.getElementById("countTodos").textContent = reclamos.length;

  if (filtrados.length === 0) {
    contenedor.innerHTML = `
      <div class="col-span-full py-12 text-center bg-white rounded-xl border border-slate-200">
        <i data-lucide="check-circle" class="w-12 h-12 text-emerald-500 mx-auto mb-2"></i>
        <h4 class="font-bold text-slate-800">No hay reclamos en esta categorÃ­a</h4>
        <p class="text-xs text-slate-500">No se registran solicitudes pendientes en este estado.</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  filtrados.forEach(caso => {
    let badgeClass = "badge-espera";
    let badgeIcon = "clock";
    if (caso.estado === "Ignorado") {
      badgeClass = "badge-ignorado";
      badgeIcon = "alert-triangle";
    } else if (caso.estado === "Solucionado") {
      badgeClass = "badge-solucionado";
      badgeIcon = "check-circle";
    }

    const card = document.createElement("div");
    card.className = "bg-white rounded-xl border border-slate-200 shadow-sm shadow-hover overflow-hidden flex flex-col justify-between";
    card.innerHTML = `
      <div>
        <div class="relative h-48 w-full bg-slate-900 overflow-hidden">
          <img src="${caso.foto}" alt="${caso.titulo}" class="w-full h-full object-cover">
          <div class="absolute top-3 left-3 flex flex-wrap gap-1.5">
            <span class="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${badgeClass}">
              <i data-lucide="${badgeIcon}" class="w-3 h-3"></i>
              ${caso.estado === "Ignorado" ? "IGNORADO POR ALCALDÃA" : caso.estado.toUpperCase()}
            </span>
          </div>
          <div class="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded border border-white/20">
            ${caso.id}
          </div>
        </div>

        <div class="p-5">
          <div class="text-[10px] font-extrabold text-[#004884] uppercase tracking-wider mb-1">
            ${caso.categoria}
          </div>
          <h4 class="font-bold text-slate-900 text-base leading-snug mb-2">
            ${caso.titulo}
          </h4>
          <p class="text-xs text-slate-600 line-clamp-3 mb-4 leading-relaxed">
            ${caso.descripcion}
          </p>

          <div class="space-y-1.5 text-xs text-slate-500 pt-3 border-t border-slate-100">
            <div class="flex items-center gap-1.5">
              <i data-lucide="map-pin" class="w-3.5 h-3.5 text-red-500 shrink-0"></i>
              <span class="truncate font-medium text-slate-700">${caso.ubicacion}</span>
            </div>
            <div class="flex items-center gap-1.5">
              <i data-lucide="calendar" class="w-3.5 h-3.5 text-slate-400 shrink-0"></i>
              <span>Radicado: ${caso.fecha}</span>
            </div>
            ${caso.estado !== "Solucionado" ? `
              <div class="flex items-center gap-1.5 text-red-600 font-bold">
                <i data-lucide="flame" class="w-3.5 h-3.5 shrink-0"></i>
                <span>${caso.tiempo} sin respuesta municipal</span>
              </div>
            ` : `
              <div class="flex items-center gap-1.5 text-emerald-600 font-bold">
                <i data-lucide="badge-check" class="w-3.5 h-3.5 shrink-0"></i>
                <span>Solucionado con gestiÃ³n comunitaria</span>
              </div>
            `}
          </div>
        </div>
      </div>

      <div class="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
        <button onclick="abrirModalInstagram('${caso.id}')" class="flex-grow inline-flex items-center justify-center gap-1.5 bg-[#004884] hover:bg-[#013057] text-white font-bold text-xs py-2 px-3 rounded shadow-sm transition">
          <i data-lucide="instagram" class="w-3.5 h-3.5 text-yellow-300"></i>
          <span>Generar Ficha Instagram</span>
        </button>
        <button onclick="cambiarEstado('${caso.id}')" title="Alternar estado" class="p-2 text-slate-500 hover:text-[#004884] bg-white border border-slate-200 rounded hover:bg-slate-100 transition">
          <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i>
        </button>
      </div>
    `;

    contenedor.appendChild(card);
  });

  lucide.createIcons();
}

// Configurar Eventos
function configurarEventos() {
  // BotÃ³n recargar noticias en vivo
  const btnRecargar = document.getElementById("btnRecargarNoticias");
  if (btnRecargar) {
    btnRecargar.addEventListener("click", sincronizarNoticiasEnVivo);
  }

  // Foto Dropzone
  const dropzone = document.getElementById("dropzone");
  const fotoInput = document.getElementById("fotoInput");
  const dropzonePrompt = document.getElementById("dropzonePrompt");
  const dropzonePreview = document.getElementById("dropzonePreview");
  const previewImg = document.getElementById("previewImg");
  const previewName = document.getElementById("previewName");
  const btnRemoveImg = document.getElementById("btnRemoveImg");

  dropzone.addEventListener("click", () => fotoInput.click());

  fotoInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("La fotografÃ­a es demasiado pesada (mÃ¡x 5MB).");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        fotoActualDataUrl = event.target.result;
        previewImg.src = fotoActualDataUrl;
        previewName.textContent = file.name;
        dropzonePrompt.classList.add("hidden");
        dropzonePreview.classList.remove("hidden");
      };
      reader.readAsDataURL(file);
    }
  });

  btnRemoveImg.addEventListener("click", (e) => {
    e.stopPropagation();
    fotoInput.value = "";
    fotoActualDataUrl = "";
    dropzonePrompt.classList.remove("hidden");
    dropzonePreview.classList.add("hidden");
  });

  // Checkbox anÃ³nimo
  const checkAnonimo = document.getElementById("checkAnonimo");
  const datosPersonales = document.getElementById("datosPersonales");
  checkAnonimo.addEventListener("change", (e) => {
    if (e.target.checked) {
      datosPersonales.classList.add("opacity-40", "pointer-events-none");
    } else {
      datosPersonales.classList.remove("opacity-40", "pointer-events-none");
    }
  });

  // Formulario radicaciÃ³n
  const form = document.getElementById("formReclamo");
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const categoria = document.getElementById("categoria").value;
    const titulo = document.getElementById("titulo").value.trim();
    const ubicacion = document.getElementById("ubicacion").value.trim();
    const tiempoCantidad = document.getElementById("tiempoCantidad").value;
    const tiempoUnidad = document.getElementById("tiempoUnidad").value;
    const descripcion = document.getElementById("descripcion").value.trim();
    const esAnonimo = checkAnonimo.checked;
    const nombreVecino = document.getElementById("nombreVecino").value.trim();

    const numRandom = Math.floor(1000 + Math.random() * 9000);
    const nuevoRadicado = `RAD-PANAMA-2026-${numRandom}`;

    let fotoFinal = fotoActualDataUrl;
    if (!fotoFinal) {
      if (categoria.includes("Alumbrado")) {
        fotoFinal = "https://images.unsplash.com/photo-1544717302-de2939b7ef71?auto=format&fit=crop&w=800&q=80";
      } else if (categoria.includes("Emdupar")) {
        fotoFinal = "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80";
      } else {
        fotoFinal = "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80";
      }
    }

    const nuevoCaso = {
      id: nuevoRadicado,
      titulo: titulo,
      categoria: categoria,
      ubicacion: ubicacion,
      tiempo: `${tiempoCantidad} ${tiempoUnidad}`,
      diasNumero: parseInt(tiempoCantidad) * (tiempoUnidad === "meses" ? 30 : (tiempoUnidad === "aÃ±os" ? 365 : 1)),
      descripcion: descripcion,
      foto: fotoFinal,
      estado: parseInt(tiempoCantidad) > 20 ? "Ignorado" : "En espera",
      afectados: "Comunidad PanamÃ¡ II",
      fecha: new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }),
      solicitante: esAnonimo ? "Vecino AnÃ³nimo" : (nombreVecino || "Habitante PanamÃ¡ II")
    };

    reclamos.unshift(nuevoCaso);
    guardarEnLocalStorage();
    renderizarMuro("todos");

    form.reset();
    fotoActualDataUrl = "";
    dropzonePrompt.classList.remove("hidden");
    dropzonePreview.classList.add("hidden");

    if (window.confetti) {
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
    }

    alert(`Â¡Reclamo radicado exitosamente!\n\nNÃºmero Oficial:\n${nuevoRadicado}\n\nHa sido publicado en el Muro de Evidencias de PanamÃ¡ II. Ya puedes generar la ficha grÃ¡fica para Instagram.`);
    document.getElementById("muro").scrollIntoView({ behavior: 'smooth' });
  });

  // Filtros del Muro
  const filterBtns = document.querySelectorAll(".filter-btn");
  filterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      filterBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const filtro = btn.getAttribute("data-filter");
      renderizarMuro(filtro);
    });
  });

  // Buscador de Radicado
  const btnBuscar = document.getElementById("btnBuscarRadicado");
  const inputBuscar = document.getElementById("inputBuscarRadicado");
  const resultadoBusqueda = document.getElementById("resultadoBusqueda");

  btnBuscar.addEventListener("click", () => {
    const q = inputBuscar.value.trim().toUpperCase();
    if (!q) return;

    const encontrado = reclamos.find(r => r.id.toUpperCase() === q || r.id.toUpperCase().includes(q));
    resultadoBusqueda.classList.remove("hidden");

    if (encontrado) {
      resultadoBusqueda.innerHTML = `
        <div class="p-3 bg-emerald-50 border border-emerald-200 rounded text-emerald-900">
          <div class="font-bold text-xs flex justify-between">
            <span>${encontrado.id}</span>
            <span class="uppercase">${encontrado.estado}</span>
          </div>
          <div class="text-xs font-semibold mt-1">${encontrado.titulo}</div>
          <div class="text-[11px] text-slate-600 mt-0.5">UbicaciÃ³n: ${encontrado.ubicacion}</div>
          <button onclick="abrirModalInstagram('${encontrado.id}')" class="mt-2 text-xs font-bold text-[#004884] hover:underline inline-flex items-center gap-1">
            <i data-lucide="instagram" class="w-3.5 h-3.5"></i> Crear ficha Instagram de este caso
          </button>
        </div>
      `;
    } else {
      resultadoBusqueda.innerHTML = `
        <div class="p-3 bg-red-50 border border-red-200 rounded text-red-700">
          No se encontrÃ³ ningÃºn radicado con el cÃ³digo <strong>${q}</strong>.
        </div>
      `;
    }
    lucide.createIcons();
  });

  // Buscador del Header
  const btnTopSearch = document.getElementById("btnTopSearch");
  const topSearchInput = document.getElementById("topSearchInput");
  btnTopSearch.addEventListener("click", () => {
    const term = topSearchInput.value.trim().toLowerCase();
    if (!term) return;

    const filtrados = reclamos.filter(r => 
      r.titulo.toLowerCase().includes(term) || 
      r.descripcion.toLowerCase().includes(term) || 
      r.id.toLowerCase().includes(term) || 
      r.categoria.toLowerCase().includes(term)
    );

    document.getElementById("muro").scrollIntoView({ behavior: 'smooth' });
    if (filtrados.length > 0) {
      reclamos = filtrados;
      renderizarMuro("todos");
      cargarReclamos();
    } else {
      alert(`No encontramos reclamos con el tÃ©rmino "${term}". Puedes radicarlo en el formulario.`);
    }
  });

  // Modal Instagram
  document.getElementById("btnCerrarModal").addEventListener("click", cerrarModalInstagram);
  document.getElementById("modalInstagram").addEventListener("click", (e) => {
    if (e.target.id === "modalInstagram") cerrarModalInstagram();
  });

  document.getElementById("btnCopiarCaption").addEventListener("click", () => {
    const texto = document.getElementById("captionText").textContent;
    navigator.clipboard.writeText(texto).then(() => {
      const toast = document.getElementById("copiedToast");
      toast.classList.remove("hidden");
      setTimeout(() => toast.classList.add("hidden"), 3000);
    });
  });

  document.getElementById("btnDescargarImagen").addEventListener("click", descargarImagenInstagram);
}

window.abrirModalInstagram = function(id) {
  const caso = reclamos.find(r => r.id === id);
  if (!caso) return;
  reclamoSeleccionado = caso;

  document.getElementById("igRadicado").textContent = caso.id;
  document.getElementById("igFecha").textContent = caso.fecha;
  document.getElementById("igCategoria").textContent = caso.categoria.toUpperCase();
  document.getElementById("igTitulo").textContent = caso.titulo;
  document.getElementById("igUbicacion").textContent = caso.ubicacion;
  document.getElementById("igFoto").src = caso.foto;
  document.getElementById("igTiempo").textContent = `${caso.tiempo.toUpperCase()} SIN RESPUESTA`;

  const caption = `ðŸš¨ DENUNCIA CIUDADANA - BARRIO PANAMÃ II (VALLEDUPAR)
ðŸ“ UbicaciÃ³n: ${caso.ubicacion}
ðŸ“‹ Radicado Oficial: ${caso.id}
â±ï¸ Tiempo ignorado por la administraciÃ³n: ${caso.tiempo} sin soluciÃ³n.

${caso.descripcion}

Los habitantes del Barrio PanamÃ¡ II exigimos que la @alcaldiavpar y las empresas de servicios pÃºblicos cumplan con sus obligaciones. No esperemos que ocurra una tragedia para actuar.

SeÃ±or Alcalde @ernestoorozcodurango, @personeriavalledupar, @gobcesar: Â¿quiÃ©n responde por nuestra comunidad?

Por favor comparte esta publicaciÃ³n en tus historias para que no lo sigan ignorando. ðŸ“¢
.
#Valledupar #PanamaII #PanamaPideRespuesta #ValleduparSinLuz #AlcaldiaValledupar #ErnestoOrozco #Emdupar #Cesar`;

  document.getElementById("captionText").textContent = caption;
  document.getElementById("modalInstagram").classList.remove("hidden");
  lucide.createIcons();
};

function cerrarModalInstagram() {
  document.getElementById("modalInstagram").classList.add("hidden");
  reclamoSeleccionado = null;
}

function descargarImagenInstagram() {
  const elemento = document.getElementById("tarjetaInstagramRender");
  if (!elemento) return;

  const btn = document.getElementById("btnDescargarImagen");
  const textoOriginal = btn.innerHTML;
  btn.innerHTML = `<i data-lucide="loader" class="w-4 h-4 animate-spin"></i> Generando PNG Ultra HD...`;

  html2canvas(elemento, {
    scale: 3,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#001D3D'
  }).then(canvas => {
    const enlace = document.createElement("a");
    const nombreArchivo = `DENUNCIA_VALLEDUPAR_${reclamoSeleccionado ? reclamoSeleccionado.id : 'PANAMA'}.png`;
    enlace.download = nombreArchivo;
    enlace.href = canvas.toDataURL("image/png");
    enlace.click();
    btn.innerHTML = textoOriginal;
    lucide.createIcons();
  }).catch(err => {
    console.error(err);
    alert("Hubo un error al procesar el renderizado. Puedes tomar una captura de pantalla directa a la tarjeta.");
    btn.innerHTML = textoOriginal;
    lucide.createIcons();
  });
}

window.cambiarEstado = function(id) {
  const index = reclamos.findIndex(r => r.id === id);
  if (index === -1) return;

  const estados = ["Ignorado", "En espera", "Solucionado"];
  const estadoActual = reclamos[index].estado;
  const nuevoEstado = estados[(estados.indexOf(estadoActual) + 1) % estados.length];

  reclamos[index].estado = nuevoEstado;
  guardarEnLocalStorage();
  renderizarMuro("todos");
};

