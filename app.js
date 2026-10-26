/**
 * JAC Panamá II y III - Plataforma Oficial de Veeduría Ciudadana y Presión Social
 * Alcaldía de Valledupar, Cesar - Colombia
 * Integración Oficial: Supabase (PostgreSQL + Storage) + Leaflet (Mapa Delimitado)
 */

// Configuración Oficial de Supabase
const SUPABASE_URL = "https://qumwwqmfdszwrwtcznfq.supabase.co";
const SUPABASE_KEY = "sb_publishable_eharY6YnMohsirphNAizng_db4PD0bV";
let supabaseClient = null;

if (window.supabase) {
  try {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  } catch (err) {
    console.warn("Supabase init aviso:", err);
  }
}

// Delimitación Geográfica Estricta de Barrio Panamá II y III (Comuna 2 Sur de Valledupar)
// Coordenadas calibradas con precisión según el plano comunal oficial
const PANAMA_BOUNDS = [
  [10.4430, -73.2385], // Suroccidente (Transversal 4 / Calle 46)
  [10.4530, -73.2260]  // Nororiente (Calle 44 con Carrera 5)
];
const PANAMA_CENTRO_GLOBAL = [10.4485, -73.2325];
const PANAMA_CENTRO_II = [10.4496, -73.2345]; // Sector Panamá II (Zona Verde Azulada / Cian)
const PANAMA_CENTRO_III = [10.4480, -73.2305]; // Sector Panamá III (Zona Morada)

// Polígono 1: BARRIO PANAMÁ II (Verde Azulado / Cian #14b8a6)
const POLIGONO_PANAMA_II = [
  [10.4516, -73.2346], // Calle 44 límite norte
  [10.4498, -73.2324], // Calle 44 con Carrera 5A
  [10.4475, -73.2344], // Carrera 5A bajando hacia Carrera 5A 2
  [10.4479, -73.2366], // Transversal 3 / Transversal 3b
  [10.4503, -73.2360]  // Retorno hacia Calle 44
];

// Polígono 2: BARRIO PANAMÁ III (Morado #a855f7)
const POLIGONO_PANAMA_III = [
  [10.4509, -73.2322], // Carrera 5A con Calle 44B
  [10.4492, -73.2278], // Calle 45A / Calle 45B hacia Carrera 5
  [10.4460, -73.2306], // Calle 46 hacia Carrera 5
  [10.4473, -73.2350]  // Carrera 5A Bis / Carrera 5A 2
];

// Variables de Mapas Leaflet
let mapaPicker = null;
let pickerMarker = null;
let mapaGeneral = null;
let marcadoresCapa = null;

// Casos precargados iniciales de respaldo (si la base de datos está recién creada)
const CASOS_INICIALES = [
  {
    id: "RAD-PANAMA-2026-0001",
    titulo: "Poste de alumbrado público a punto de colapsar sobre viviendas",
    categoria: "Alumbrado Público",
    ubicacion: "Manzana 14 Casa 8 (Callejón peatonal)",
    sector: "Panamá II",
    tiempo: "38 días",
    diasNumero: 38,
    descripcion: "El poste de concreto presenta fractura severa en la base y se encuentra inclinado, sostenido únicamente por el cableado de energía. Se radicó petición formal a ESTIV y a la Alcaldía pero fuimos totalmente ignorados. Niños juegan a diario en la zona y el riesgo de electrocución o colapso es crítico.",
    foto: "https://images.unsplash.com/photo-1544717302-de2939b7ef71?auto=format&fit=crop&w=800&q=80",
    estado: "Ignorado",
    afectados: "45 familias",
    fecha: "18 de Septiembre, 2026",
    solicitante: "JAC Panamá II / Comité de Veeduría",
    lat: 10.4496,
    lng: -73.2348
  },
  {
    id: "RAD-PANAMA-2026-0002",
    titulo: "Alcantarilla rebosada de aguas servidas frente a la cancha sintética",
    categoria: "Emdupar",
    ubicacion: "Carrera 6B frente a la Cancha Sintética",
    sector: "Panamá III",
    tiempo: "22 días",
    diasNumero: 22,
    descripcion: "Aguas negras corriendo por la calle, olores nauseabundos e invasión de mosquitos. Emdupar no ha enviado el carro vactor a pesar de los constantes llamados de la comunidad.",
    foto: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80",
    estado: "En espera",
    afectados: "120 familias",
    fecha: "03 de Octubre, 2026",
    solicitante: "Comunidad Vecinal Mz 9 y 10",
    lat: 10.4480,
    lng: -73.2305
  },
  {
    id: "RAD-PANAMA-2026-0003",
    titulo: "Cráter peligroso en la vía de acceso Calle 44 con Carrera 6",
    categoria: "Malla Vial",
    ubicacion: "Entrada principal Calle 44 con Carrera 6",
    sector: "Panamá II",
    tiempo: "60 días",
    diasNumero: 60,
    descripcion: "Hueco profundo que abarca media calzada y ha provocado caídas de motociclistas y daños en vehículos. La Secretaría de Obras Públicas de Valledupar no ha intervenido.",
    foto: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80",
    estado: "Ignorado",
    afectados: "Todo el sector",
    fecha: "25 de Agosto, 2026",
    solicitante: "Gremio de Transportadores y Vecinos",
    lat: 10.4505,
    lng: -73.2330
  },
  {
    id: "RAD-PANAMA-2026-0004",
    titulo: "Recuperación de iluminación LED en el parque infantil",
    categoria: "Seguridad y Parques",
    ubicacion: "Parque Central del Barrio Panamá II",
    sector: "Panamá II",
    tiempo: "Solucionado",
    diasNumero: 0,
    descripcion: "Gracias a la presión pública comunitaria en redes sociales y la gestión de la JAC, la cuadrilla de alumbrado realizó el cambio total de luminarias.",
    foto: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=800&q=80",
    estado: "Solucionado",
    afectados: "Resuelto",
    fecha: "12 de Octubre, 2026",
    solicitante: "JAC Panamá II",
    lat: 10.4490,
    lng: -73.2355
  }
];

// Noticias iniciales en vivo
const NOTICIAS_DEFAULT = [
  {
    id: "noticia-1",
    titulo: "Equipo Azul, a dar un paso gigante antes Real Aracataca",
    fecha: "23 de octubre de 2026",
    categoria: "Deportes",
    descripcion: "Los vallenatos vienen de imponerse en la serie sobre Locos por el Fútbol de Nariño, teniendo en cuenta que el partido de ida terminó con victoria 1-0 a favor de los cesarenses.",
    foto: "https://valledupar-sedigov.s-integrations.co/attachment/files/download/94AE4B3E-F36B-1410-8C8C-00A971D655DB",
    enlace: "https://www.valledupar-cesar.gov.co/noticias/equipo-azul-a-dar-un-paso-gigante-antes-real-aracataca"
  },
  {
    id: "noticia-2",
    titulo: "Gobierno del alcalde Ernesto Orozco suma más de 130.000 acciones contra el dengue",
    fecha: "23 de octubre de 2026",
    categoria: "Salud Pública",
    descripcion: "En dos años y diez meses de la actual administración, los equipos de Enfermedades Transmitidas por Vectores intensifican fumigación y control.",
    foto: "https://valledupar-sedigov.s-integrations.co/attachment/files/download/3B484A3E-F36B-1410-8C8C-00A971D655DB",
    enlace: "https://www.valledupar-cesar.gov.co/noticias/gobierno-del-alcalde-ernesto-orozco-suma-mas-de-130000-acciones-contra-el-dengue"
  },
  {
    id: "noticia-3",
    titulo: "Capturado en Valledupar alias 'El Guajiro', señalado de cometer dos homicidios en Santa Marta",
    fecha: "22 de octubre de 2026",
    categoria: "Seguridad",
    descripcion: "De acuerdo con las autoridades, la captura se produjo en un puesto de registro y control en el perímetro urbano del municipio.",
    foto: "https://valledupar-sedigov.s-integrations.co/attachment/files/download/290B4A3E-F36B-1410-8C8C-00A971D655DB",
    enlace: "https://www.valledupar-cesar.gov.co/noticias/capturado-en-valledupar-alias-el-guajiro-senalado-de-cometer-dos-homicidios-en-santa-marta"
  }
];

let reclamos = [];
let noticias = [];
let archivoFotoSeleccionado = null;
let fotoActualDataUrl = "";
let reclamoSeleccionado = null;

// Inicialización de la aplicación
document.addEventListener("DOMContentLoaded", async () => {
  await cargarReclamos();
  cargarNoticias();
  renderizarMuro("todos");
  inicializarMapaPicker();
  configurarEventos();
  lucide.createIcons();
});

// ==========================================
// INICIALIZACIÓN DE MAPAS LEAFLET (PANAMÁ II Y III)
// ==========================================
function inicializarMapaPicker() {
  const contenedor = document.getElementById("mapaPanamaPicker");
  if (!contenedor || typeof L === "undefined") return;

  const southWest = L.latLng(PANAMA_BOUNDS[0][0], PANAMA_BOUNDS[0][1]);
  const northEast = L.latLng(PANAMA_BOUNDS[1][0], PANAMA_BOUNDS[1][1]);
  const bounds = L.latLngBounds(southWest, northEast);

  mapaPicker = L.map("mapaPanamaPicker", {
    center: PANAMA_CENTRO_II,
    zoom: 17,
    minZoom: 15,
    maxZoom: 19,
    maxBounds: bounds,
    maxBoundsViscosity: 1.0 // Impide estrictamente salirse de Panamá II y III
  });

  // Capa de mapas oficial Esri ArcGIS World Street Map (Totalmente abierta, ultra rápida y sin clave API)
  L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}", {
    attribution: 'Tiles &copy; Esri &mdash; Valledupar | JAC Panamá II y III',
    maxZoom: 19
  }).addTo(mapaPicker);

  // Polígono 1: BARRIO PANAMÁ II (Verde Azulado / Cian #14b8a6)
  const poliII = L.polygon(POLIGONO_PANAMA_II, {
    color: '#0d9488',
    fillColor: '#14b8a6',
    fillOpacity: 0.22,
    weight: 3.5,
    dashArray: '5, 5'
  }).addTo(mapaPicker);
  poliII.bindTooltip("<span class='text-teal-800 font-extrabold'>🟢 PANAMÁ II</span>", { permanent: true, direction: "center", className: "badge-mapa-panama" });

  // Polígono 2: BARRIO PANAMÁ III (Morado #a855f7)
  const poliIII = L.polygon(POLIGONO_PANAMA_III, {
    color: '#7e22ce',
    fillColor: '#a855f7',
    fillOpacity: 0.22,
    weight: 3.5,
    dashArray: '5, 5'
  }).addTo(mapaPicker);
  poliIII.bindTooltip("<span class='text-purple-800 font-extrabold'>🟣 PANAMÁ III</span>", { permanent: true, direction: "center", className: "badge-mapa-panama" });

  // Línea diagonal límite Calle 44
  L.polyline([
    [10.4525, -73.2355],
    [10.4498, -73.2324],
    [10.4475, -73.2270]
  ], {
    color: '#475569',
    weight: 2,
    dashArray: '4, 4',
    opacity: 0.8
  }).addTo(mapaPicker);

  // Marcador seleccionable
  pickerMarker = L.marker(PANAMA_CENTRO_II, {
    draggable: true,
    title: "Arrastra para fijar la manzana o casa afectada"
  }).addTo(mapaPicker);

  pickerMarker.bindPopup("<b>Ubicación seleccionada</b><br>Manzana 14 Casa 8 (Barrio Panamá II)").openPopup();

  // Actualizar coordenadas al arrastrar el pin
  pickerMarker.on("dragend", (e) => {
    const latLng = e.target.getLatLng();
    actualizarCoordenadasFormulario(latLng.lat, latLng.lng);
  });

  // Actualizar coordenadas al hacer clic en el mapa
  mapaPicker.on("click", (e) => {
    pickerMarker.setLatLng(e.latlng);
    actualizarCoordenadasFormulario(e.latlng.lat, e.latlng.lng);
  });
}

function actualizarCoordenadasFormulario(lat, lng) {
  const geoLat = document.getElementById("geoLat");
  const geoLng = document.getElementById("geoLng");
  const texto = document.getElementById("coordenadasTexto");
  if (geoLat) geoLat.value = lat.toFixed(5);
  if (geoLng) geoLng.value = lng.toFixed(5);
  if (texto) texto.textContent = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

// Inicializar Mapa Comunitario Completo
function inicializarMapaComunitario() {
  const contenedor = document.getElementById("mapaPanamaGeneral");
  if (!contenedor || typeof L === "undefined") return;

  if (mapaGeneral) {
    mapaGeneral.invalidateSize();
    actualizarMarcadoresComunitarios();
    return;
  }

  const southWest = L.latLng(PANAMA_BOUNDS[0][0], PANAMA_BOUNDS[0][1]);
  const northEast = L.latLng(PANAMA_BOUNDS[1][0], PANAMA_BOUNDS[1][1]);
  const bounds = L.latLngBounds(southWest, northEast);

  mapaGeneral = L.map("mapaPanamaGeneral", {
    center: PANAMA_CENTRO_II,
    zoom: 17,
    minZoom: 15,
    maxZoom: 19,
    maxBounds: bounds,
    maxBoundsViscosity: 1.0
  });

  L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}", {
    attribution: 'Tiles &copy; Esri &mdash; Valledupar | JAC Panamá II y III',
    maxZoom: 19
  }).addTo(mapaGeneral);

  // Polígono 1: BARRIO PANAMÁ II (Cian)
  const gPoliII = L.polygon(POLIGONO_PANAMA_II, {
    color: '#0d9488',
    fillColor: '#14b8a6',
    fillOpacity: 0.18,
    weight: 3.5,
    dashArray: '5, 5'
  }).addTo(mapaGeneral);
  gPoliII.bindTooltip("<span class='text-teal-800 font-extrabold'>🟢 PANAMÁ II</span>", { permanent: true, direction: "center", className: "badge-mapa-panama" });

  // Polígono 2: BARRIO PANAMÁ III (Morado)
  const gPoliIII = L.polygon(POLIGONO_PANAMA_III, {
    color: '#7e22ce',
    fillColor: '#a855f7',
    fillOpacity: 0.18,
    weight: 3.5,
    dashArray: '5, 5'
  }).addTo(mapaGeneral);
  gPoliIII.bindTooltip("<span class='text-purple-800 font-extrabold'>🟣 PANAMÁ III</span>", { permanent: true, direction: "center", className: "badge-mapa-panama" });

  // Línea diagonal límite Calle 44
  L.polyline([
    [10.4525, -73.2355],
    [10.4498, -73.2324],
    [10.4475, -73.2270]
  ], {
    color: '#475569',
    weight: 2,
    dashArray: '4, 4',
    opacity: 0.8
  }).addTo(mapaGeneral);

  marcadoresCapa = L.layerGroup().addTo(mapaGeneral);
  actualizarMarcadoresComunitarios();
}

function actualizarMarcadoresComunitarios() {
  if (!mapaGeneral || !marcadoresCapa) return;
  marcadoresCapa.clearLayers();

  reclamos.forEach(caso => {
    const lat = caso.lat || 10.4471;
    const lng = caso.lng || -73.2398;

    let markerColor = "#DC2626"; // Ignorado
    if (caso.estado === "En espera") markerColor = "#D97706";
    if (caso.estado === "Solucionado") markerColor = "#059669";

    const circleMarker = L.circleMarker([lat, lng], {
      radius: 9,
      fillColor: markerColor,
      color: "#FFFFFF",
      weight: 2.5,
      opacity: 1,
      fillOpacity: 0.95
    });

    const popupHtml = `
      <div style="min-width: 220px; font-family: Montserrat, sans-serif;">
        <div style="font-size: 10px; font-weight: 800; color: #004884; margin-bottom: 2px;">
          ${caso.id} • ${caso.sector || 'Panamá II'}
        </div>
        <div style="font-size: 12px; font-weight: 700; color: #1e293b; line-height: 1.25; margin-bottom: 4px;">
          ${caso.titulo}
        </div>
        <div style="font-size: 11px; color: #64748b; margin-bottom: 6px;">
          📍 ${caso.ubicacion}
        </div>
        <img src="${caso.foto}" style="width: 100%; height: 95px; object-fit: cover; border-radius: 6px; margin-bottom: 6px;">
        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 10px; font-weight: 700;">
          <span style="color: ${markerColor};">${caso.estado.toUpperCase()}</span>
          <button onclick="abrirModalInstagram('${caso.id}')" style="background: #004884; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer;">
            Ficha Instagram
          </button>
        </div>
      </div>
    `;

    circleMarker.bindPopup(popupHtml);
    circleMarker.addTo(marcadoresCapa);
  });
}

// ==========================================
// GESTIÓN DE BASE DE DATOS Y SUPABASE
// ==========================================
async function cargarReclamos() {
  let cargadosDesdeSupabase = false;

  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('reclamos')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        reclamos = data.map(r => ({
          id: r.id,
          titulo: r.titulo,
          categoria: r.categoria,
          ubicacion: r.ubicacion,
          sector: r.sector || "Panamá II",
          tiempo: r.tiempo,
          diasNumero: r.dias_numero || 1,
          descripcion: r.descripcion,
          foto: r.foto,
          estado: r.estado || "Ignorado",
          afectados: r.afectados || "Comunidad Panamá",
          fecha: r.fecha,
          solicitante: r.solicitante || "Habitante Panamá",
          lat: r.lat || 10.4471,
          lng: r.lng || -73.2398
        }));
        cargadosDesdeSupabase = true;
        localStorage.setItem("jac_panama2_reclamos", JSON.stringify(reclamos));
      }
    } catch (e) {
      console.log("Aviso: Conectando con fallback local de reclamos", e);
    }
  }

  if (!cargadosDesdeSupabase) {
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
}

function guardarEnLocalStorage() {
  localStorage.setItem("jac_panama2_reclamos", JSON.stringify(reclamos));
}

// Subir fotografía de evidencia al Storage de Supabase
async function subirFotoSupabase(file) {
  if (!supabaseClient || !file) return null;
  try {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `evidencia_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabaseClient.storage
      .from('evidencias')
      .upload(filePath, file, { cacheControl: '3600', upsert: false });

    if (uploadError) {
      console.warn("Aviso subiendo a Supabase Storage:", uploadError);
      return null;
    }

    const { data: publicUrlData } = supabaseClient.storage
      .from('evidencias')
      .getPublicUrl(filePath);

    return publicUrlData?.publicUrl || null;
  } catch (err) {
    console.warn("Excepción al subir foto a Supabase:", err);
    return null;
  }
}

// ==========================================
// RENDERIZADO DEL MURO Y NOTICIAS
// ==========================================
function renderizarMuro(filtro = "todos") {
  const contenedor = document.getElementById("gridReclamos");
  if (!contenedor) return;
  contenedor.innerHTML = "";

  const filtrados = filtro === "todos" 
    ? reclamos 
    : reclamos.filter(r => r.estado.toLowerCase() === filtro.toLowerCase());

  const countElem = document.getElementById("countTodos");
  if (countElem) countElem.textContent = reclamos.length;

  if (filtrados.length === 0) {
    contenedor.innerHTML = `
      <div class="col-span-full py-12 text-center bg-white rounded-xl border border-slate-200">
        <i data-lucide="check-circle" class="w-12 h-12 text-emerald-500 mx-auto mb-2"></i>
        <h4 class="font-bold text-slate-800">No hay reclamos en esta categoría</h4>
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
              ${caso.estado === "Ignorado" ? "IGNORADO POR ALCALDÍA" : caso.estado.toUpperCase()}
            </span>
          </div>
          <div class="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded border border-white/20">
            ${caso.id}
          </div>
        </div>

        <div class="p-5">
          <div class="flex items-center justify-between text-[10px] font-extrabold text-[#004884] uppercase tracking-wider mb-1">
            <span>${caso.categoria}</span>
            <span class="bg-blue-50 text-[#004884] px-1.5 py-0.5 rounded border border-blue-200">${caso.sector || 'Panamá II'}</span>
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
                <span>Solucionado con gestión comunitaria</span>
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

// Cargar Noticias
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

async function sincronizarNoticiasEnVivo() {
  const btn = document.getElementById("btnRecargarNoticias");
  if (!btn) return;
  const originalHtml = btn.innerHTML;
  btn.innerHTML = `<i data-lucide="loader" class="w-3.5 h-3.5 animate-spin"></i> <span>Consultando...</span>`;
  lucide.createIcons();

  try {
    const res = await fetch("https://api.allorigins.win/get?url=" + encodeURIComponent("https://www.valledupar-cesar.gov.co/"));
    if (res.ok) {
      const data = await res.json();
      const html = data.contents;
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
          const fechaMatch = textClean.match(/\d{1,2}\s+de\s+[a-záéíóúñ]+\s+de\s+\d{4}/i);
          const fecha = fechaMatch ? fechaMatch[0] : "Reciente";

          nuevasNoticias.push({
            id: slug,
            titulo: slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            fecha: fecha,
            categoria: "Alcaldía de Valledupar",
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
    console.log("Sincronización utilizó la caché más reciente:", err);
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
    <!-- NOTICIA PRINCIPAL -->
    <div class="md:col-span-6 bg-white rounded-xl border border-[#CADDFB] overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between">
      <div>
        <div class="relative h-60 w-full overflow-hidden bg-slate-900">
          <img src="${p.foto}" alt="${p.titulo}" class="w-full h-full object-cover">
          <span class="absolute top-3 left-3 bg-[#004884] text-white text-[11px] font-bold px-2.5 py-1 rounded shadow">
            ${p.categoria}
          </span>
        </div>
        <div class="p-6">
          <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">${p.fecha}</span>
          <h3 class="text-base sm:text-lg font-bold text-slate-900 leading-snug mt-1 hover:text-[#004884] transition cursor-pointer">
            ${p.titulo}
          </h3>
          <p class="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
            ${p.descripcion}
          </p>
        </div>
      </div>
      <div class="p-6 pt-0 text-right">
        <a href="${p.enlace}" target="_blank" class="inline-flex items-center gap-1 text-xs font-bold text-[#004884] hover:underline">
          <span>Leer noticia completa</span>
          <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
        </a>
      </div>
    </div>

    <!-- NOTICIAS SECUNDARIAS -->
    <div class="md:col-span-6 flex flex-col gap-4">
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
            <a href="${s1.enlace}" target="_blank" class="text-xs font-bold text-[#004884] hover:underline">Ver noticia →</a>
          </div>
        </div>
      </div>

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
            <a href="${s2.enlace}" target="_blank" class="text-xs font-bold text-[#004884] hover:underline">Ver noticia →</a>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ==========================================
// CONFIGURACIÓN DE EVENTOS DEL PORTAL
// ==========================================
function configurarEventos() {
  const btnRecargar = document.getElementById("btnRecargarNoticias");
  if (btnRecargar) {
    btnRecargar.addEventListener("click", sincronizarNoticiasEnVivo);
  }

  // Selector de Sector (Panamá II vs Panamá III)
  const selectorSector = document.getElementById("sector");
  if (selectorSector) {
    selectorSector.addEventListener("change", (e) => {
      const sec = e.target.value;
      const targetCoords = sec === "Panamá III" ? PANAMA_CENTRO_III : PANAMA_CENTRO_II;
      if (mapaPicker && pickerMarker) {
        mapaPicker.flyTo(targetCoords, 17, { duration: 0.8 });
        pickerMarker.setLatLng(targetCoords);
        pickerMarker.bindPopup(`<b>${sec}</b><br>Arrastra o haz clic para marcar la casa/daño`).openPopup();
        actualizarCoordenadasFormulario(targetCoords[0], targetCoords[1]);
      }
    });
  }

  // Manejo de Fotos (Dropzone)
  const dropzone = document.getElementById("dropzone");
  const fotoInput = document.getElementById("fotoInput");
  const dropzonePrompt = document.getElementById("dropzonePrompt");
  const dropzonePreview = document.getElementById("dropzonePreview");
  const previewImg = document.getElementById("previewImg");
  const previewName = document.getElementById("previewName");
  const btnRemoveImg = document.getElementById("btnRemoveImg");

  if (dropzone && fotoInput) {
    dropzone.addEventListener("click", () => fotoInput.click());

    fotoInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        if (file.size > 10 * 1024 * 1024) {
          alert("La fotografía es demasiado pesada (máx 10MB).");
          return;
        }
        archivoFotoSeleccionado = file;
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
      archivoFotoSeleccionado = null;
      fotoActualDataUrl = "";
      dropzonePrompt.classList.remove("hidden");
      dropzonePreview.classList.add("hidden");
    });
  }

  // Checkbox anónimo
  const checkAnonimo = document.getElementById("checkAnonimo");
  const datosPersonales = document.getElementById("datosPersonales");
  if (checkAnonimo && datosPersonales) {
    checkAnonimo.addEventListener("change", (e) => {
      if (e.target.checked) {
        datosPersonales.classList.add("opacity-40", "pointer-events-none");
      } else {
        datosPersonales.classList.remove("opacity-40", "pointer-events-none");
      }
    });
  }

  // Conmutador de Vistas: Muro de Tarjetas vs Mapa Comunitario
  const btnVistaGrid = document.getElementById("btnVistaGrid");
  const btnVistaMapa = document.getElementById("btnVistaMapa");
  const gridReclamos = document.getElementById("gridReclamos");
  const vistaMapaComunitario = document.getElementById("vistaMapaComunitario");

  if (btnVistaGrid && btnVistaMapa) {
    btnVistaGrid.addEventListener("click", () => {
      btnVistaGrid.className = "px-3 py-1.5 rounded-md font-bold bg-white text-[#004884] shadow-sm flex items-center gap-1.5 transition";
      btnVistaMapa.className = "px-3 py-1.5 rounded-md font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1.5 transition";
      gridReclamos.classList.remove("hidden");
      vistaMapaComunitario.classList.add("hidden");
    });

    btnVistaMapa.addEventListener("click", () => {
      btnVistaMapa.className = "px-3 py-1.5 rounded-md font-bold bg-white text-[#004884] shadow-sm flex items-center gap-1.5 transition";
      btnVistaGrid.className = "px-3 py-1.5 rounded-md font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1.5 transition";
      gridReclamos.classList.add("hidden");
      vistaMapaComunitario.classList.remove("hidden");
      inicializarMapaComunitario();
    });
  }

  // FORMULARIO DE RADICACIÓN
  const form = document.getElementById("formReclamo");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const btnSubmit = form.querySelector("button[type='submit']");
      const btnOriginalText = btnSubmit.innerHTML;
      btnSubmit.disabled = true;
      btnSubmit.innerHTML = `<i data-lucide="loader" class="w-4 h-4 animate-spin"></i> <span>Radicando y subiendo evidencia...</span>`;
      lucide.createIcons();

      try {
        const sector = document.getElementById("sector").value;
        const categoria = document.getElementById("categoria").value;
        const titulo = document.getElementById("titulo").value.trim();
        const ubicacion = document.getElementById("ubicacion").value.trim();
        const tiempoCantidad = document.getElementById("tiempoCantidad").value;
        const tiempoUnidad = document.getElementById("tiempoUnidad").value;
        const descripcion = document.getElementById("descripcion").value.trim();
        const esAnonimo = checkAnonimo ? checkAnonimo.checked : false;
        const nombreVecino = document.getElementById("nombreVecino") ? document.getElementById("nombreVecino").value.trim() : "";
        const latVal = parseFloat(document.getElementById("geoLat").value) || PANAMA_CENTRO_II[0];
        const lngVal = parseFloat(document.getElementById("geoLng").value) || PANAMA_CENTRO_II[1];

        const numRandom = Math.floor(1000 + Math.random() * 9000);
        const nuevoRadicado = `RAD-PANAMA-2026-${numRandom}`;

        // Subir foto a Supabase Storage si se cargó un archivo
        let fotoFinal = fotoActualDataUrl;
        if (archivoFotoSeleccionado) {
          const urlStorage = await subirFotoSupabase(archivoFotoSeleccionado);
          if (urlStorage) {
            fotoFinal = urlStorage;
          }
        }

        // Fallbacks visuales por categoría si no subió foto
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
          sector: sector,
          tiempo: `${tiempoCantidad} ${tiempoUnidad}`,
          diasNumero: parseInt(tiempoCantidad) * (tiempoUnidad === "meses" ? 30 : (tiempoUnidad === "años" ? 365 : 1)),
          descripcion: descripcion,
          foto: fotoFinal,
          estado: parseInt(tiempoCantidad) > 20 ? "Ignorado" : "En espera",
          afectados: `Comunidad ${sector}`,
          fecha: new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }),
          solicitante: esAnonimo ? "Vecino Anónimo" : (nombreVecino || `Habitante ${sector}`),
          lat: latVal,
          lng: lngVal
        };

        // Guardar en Supabase Database
        if (supabaseClient) {
          try {
            await supabaseClient.from('reclamos').insert([{
              id: nuevoCaso.id,
              titulo: nuevoCaso.titulo,
              categoria: nuevoCaso.categoria,
              ubicacion: nuevoCaso.ubicacion,
              sector: nuevoCaso.sector,
              tiempo: nuevoCaso.tiempo,
              dias_numero: nuevoCaso.diasNumero,
              descripcion: nuevoCaso.descripcion,
              foto: nuevoCaso.foto,
              estado: nuevoCaso.estado,
              afectados: nuevoCaso.afectados,
              fecha: nuevoCaso.fecha,
              solicitante: nuevoCaso.solicitante,
              lat: nuevoCaso.lat,
              lng: nuevoCaso.lng
            }]);
          } catch (dbErr) {
            console.warn("Aviso al guardar en Supabase (usando réplica local):", dbErr);
          }
        }

        reclamos.unshift(nuevoCaso);
        guardarEnLocalStorage();
        renderizarMuro("todos");
        actualizarMarcadoresComunitarios();

        form.reset();
        archivoFotoSeleccionado = null;
        fotoActualDataUrl = "";
        dropzonePrompt.classList.remove("hidden");
        dropzonePreview.classList.add("hidden");

        if (window.confetti) {
          confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
        }

        alert(`¡Reclamo radicado exitosamente!\n\nNúmero Oficial:\n${nuevoRadicado}\nSector: ${sector}\n\nHa quedado georreferenciado en el mapa y guardado en la base de datos de Panamá II y III. Ahora puedes generar la ficha gráfica para Instagram.`);
        document.getElementById("muro").scrollIntoView({ behavior: 'smooth' });
      } catch (err) {
        console.error("Error al radicar:", err);
        alert("Ocurrió un error al registrar el reclamo. Por favor revisa los campos e intenta de nuevo.");
      } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = btnOriginalText;
        lucide.createIcons();
      }
    });
  }

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

  if (btnBuscar && inputBuscar) {
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
            <div class="text-[11px] text-slate-600 mt-0.5">Ubicación: ${encontrado.ubicacion} (${encontrado.sector || 'Panamá II'})</div>
            <button onclick="abrirModalInstagram('${encontrado.id}')" class="mt-2 text-xs font-bold text-[#004884] hover:underline inline-flex items-center gap-1">
              <i data-lucide="instagram" class="w-3.5 h-3.5"></i> Crear ficha Instagram de este caso
            </button>
          </div>
        `;
      } else {
        resultadoBusqueda.innerHTML = `
          <div class="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-xs">
            No se encontró ningún radicado con el código <strong>${q}</strong>.
          </div>
        `;
      }
      lucide.createIcons();
    });
  }

  // Buscador del Header
  const btnTopSearch = document.getElementById("btnTopSearch");
  const topSearchInput = document.getElementById("topSearchInput");
  if (btnTopSearch && topSearchInput) {
    btnTopSearch.addEventListener("click", () => {
      const term = topSearchInput.value.trim().toLowerCase();
      if (!term) return;

      const filtrados = reclamos.filter(r => 
        r.titulo.toLowerCase().includes(term) || 
        r.descripcion.toLowerCase().includes(term) || 
        r.id.toLowerCase().includes(term) || 
        r.categoria.toLowerCase().includes(term) ||
        (r.sector && r.sector.toLowerCase().includes(term))
      );

      document.getElementById("muro").scrollIntoView({ behavior: 'smooth' });
      if (filtrados.length > 0) {
        reclamos = filtrados;
        renderizarMuro("todos");
        actualizarMarcadoresComunitarios();
      } else {
        alert(`No encontramos reclamos con el término "${term}". Puedes radicarlo en el formulario.`);
      }
    });
  }

  // Modal Instagram
  const btnCerrarModal = document.getElementById("btnCerrarModal");
  const modalInstagram = document.getElementById("modalInstagram");
  if (btnCerrarModal && modalInstagram) {
    btnCerrarModal.addEventListener("click", cerrarModalInstagram);
    modalInstagram.addEventListener("click", (e) => {
      if (e.target.id === "modalInstagram") cerrarModalInstagram();
    });
  }

  const btnCopiarCaption = document.getElementById("btnCopiarCaption");
  if (btnCopiarCaption) {
    btnCopiarCaption.addEventListener("click", () => {
      const texto = document.getElementById("captionText").textContent;
      navigator.clipboard.writeText(texto).then(() => {
        const toast = document.getElementById("copiedToast");
        if (toast) {
          toast.classList.remove("hidden");
          setTimeout(() => toast.classList.add("hidden"), 3000);
        }
      });
    });
  }

  const btnDescargarImagen = document.getElementById("btnDescargarImagen");
  if (btnDescargarImagen) {
    btnDescargarImagen.addEventListener("click", descargarImagenInstagram);
  }
}

// ==========================================
// MODAL DE INSTAGRAM Y DESCARGA ULTRA HD
// ==========================================
window.abrirModalInstagram = function(id) {
  const caso = reclamos.find(r => r.id === id);
  if (!caso) return;
  reclamoSeleccionado = caso;

  document.getElementById("igRadicado").textContent = caso.id;
  document.getElementById("igFecha").textContent = caso.fecha;
  document.getElementById("igCategoria").textContent = `${caso.categoria.toUpperCase()} • ${caso.sector ? caso.sector.toUpperCase() : 'PANAMÁ II'}`;
  document.getElementById("igTitulo").textContent = caso.titulo;
  document.getElementById("igUbicacion").textContent = `${caso.ubicacion} (${caso.sector || 'Panamá II'})`;
  document.getElementById("igFoto").src = caso.foto;
  document.getElementById("igTiempo").textContent = `${caso.tiempo.toUpperCase()} SIN RESPUESTA`;

  const caption = `🚨 DENUNCIA CIUDADANA - BARRIO ${caso.sector ? caso.sector.toUpperCase() : 'PANAMÁ II'} (VALLEDUPAR)
📍 Ubicación: ${caso.ubicacion}
📋 Radicado Oficial: ${caso.id}
⏱️ Tiempo ignorado por la administración: ${caso.tiempo} sin solución.

${caso.descripcion}

Los habitantes del Barrio Panamá exigimos que la @alcaldiavpar y las entidades competentes cumplan con sus obligaciones conforme a la Ley 1757 de 2015. ¡No esperemos que ocurra una tragedia o colapso para actuar!

Señor Alcalde @ernestoorozcodurango, @personeriavalledupar, @gobcesar: ¿quién responde por nuestra comunidad?

Por favor comparte esta publicación en tus historias para que no lo sigan ignorando. 📢
.
#Valledupar #PanamaII #PanamaIII #PanamaPideRespuesta #ValleduparSinLuz #AlcaldiaValledupar #ErnestoOrozco #Emdupar #Cesar`;

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

// Alternar estado y sincronizar con Supabase
window.cambiarEstado = async function(id) {
  const index = reclamos.findIndex(r => r.id === id);
  if (index === -1) return;

  const estados = ["Ignorado", "En espera", "Solucionado"];
  const estadoActual = reclamos[index].estado;
  const nuevoEstado = estados[(estados.indexOf(estadoActual) + 1) % estados.length];

  reclamos[index].estado = nuevoEstado;
  guardarEnLocalStorage();
  renderizarMuro("todos");
  actualizarMarcadoresComunitarios();

  if (supabaseClient) {
    try {
      await supabaseClient.from('reclamos').update({ estado: nuevoEstado }).eq('id', id);
    } catch (e) {
      console.warn("Aviso al actualizar estado en Supabase:", e);
    }
  }
};
