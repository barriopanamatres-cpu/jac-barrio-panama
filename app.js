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

// DELIMITACIÓN EXACTA NODO POR NODO SOBRE LAS CALLES REALES DEL PLANO
const PANAMA_BOUNDS = [
  [10.4470, -73.2358], // Suroccidente (incluye Arboleda de Comfacesar y Confort Canino como referencia)
  [10.4528, -73.2290]  // Nororiente (incluye Calle 39 y punta de Carrera 5ª Bis)
];

const PANAMA_CENTRO = [10.44980, -73.23250];
const PANAMA_CENTRO_II = [10.44980, -73.23330]; // Entre Carrera 5ª A 2 y Carrera 5ª A
const PANAMA_CENTRO_III = [10.45030, -73.23120]; // Entre Carrera 5ª A y Carrera 5ª Bis

// PERÍMETRO CONTINUO Y EXACTO (Cubre de extremo a extremo Calle 44, Carrera 5ª Bis, Calle 45B y Cra 5ª A 2)
const POLIGONO_BARRIO_PANAMA = [
  [10.44925, -73.23455], // 1. Calle 44 esquina occidental (Cra 5A 2)
  [10.45030, -73.23390], // 2. Calle 44 con Cra 5A 1
  [10.45130, -73.23270], // 3. Calle 44 con Cra 5A
  [10.45255, -73.23110], // 4. Calle 44 con Cra 5 Bis (esquina nororiental Sejes)
  [10.45070, -73.23000], // 5. Bajando por Cra 5 Bis pasando Calle 45
  [10.44960, -73.22940], // 6. Cra 5 Bis frente a Karines
  [10.44850, -73.23120], // 7. Cra 5 Bis esquina con Calle 45B
  [10.44750, -73.23350], // 8. Borde sur Calle 45B
  [10.44810, -73.23490]  // 9. Esquina suroccidental
];

// Validación matemática: Raycasting Point-in-Polygon riguroso y sin cortes cóncavos
function estaDentroDelBarrio(lat, lng) {
  let inside = false;
  const vs = POLIGONO_BARRIO_PANAMA;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    let xi = vs[i][0], yi = vs[i][1];
    let xj = vs[j][0], yj = vs[j][1];
    let intersect = ((yi > lng) !== (yj > lng)) && (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

let ultimaPosicionValida = [10.44980, -73.23330];
let timeoutAviso = null;

function mostrarAvisoFueraPerimetro() {
  if (pickerMarker) {
    pickerMarker.bindPopup("<div style='font-size:11px; font-weight:700; color:#dc2626; padding:2px;'>⚠️ Solo puedes fijar puntos dentro del perímetro de Barrio Panamá II y III</div>").openPopup();
    if (timeoutAviso) clearTimeout(timeoutAviso);
    timeoutAviso = setTimeout(() => {
      if (pickerMarker) pickerMarker.closePopup();
    }, 2800);
  }
}

// Autocompletado inteligente de Dirección según el punto del mapa
async function autocompletarDireccionDesdeCoordenadas(lat, lng) {
  const inputUbicacion = document.getElementById("ubicacion");
  const selectSector = document.getElementById("sector");
  const badgeAuto = document.getElementById("badgeAutoDireccion");
  if (!inputUbicacion) return;

  // 1. Detección inmediata de Sector y Vías principales de Panamá II y III
  const sector = lng < -73.2322 ? "Panamá II" : "Panamá III";
  if (selectSector) selectSector.value = sector;

  let carrera = "";
  if (lng <= -73.2333) {
    carrera = "Carrera 5ª A 2";
  } else if (lng <= -73.2318) {
    carrera = "Carrera 5ª A";
  } else {
    carrera = "Carrera 5ª Bis";
  }

  let calle = "";
  if (lat >= 10.4509) {
    calle = "Calle 44";
  } else if (lat >= 10.4497) {
    calle = "Calle 45";
  } else {
    calle = "Calle 45B";
  }

  const direccionEstimada = `${carrera} con ${calle}, Barrio ${sector}`;
  inputUbicacion.value = direccionEstimada;

  if (badgeAuto) {
    badgeAuto.classList.remove("hidden");
    badgeAuto.textContent = "📍 Ubicación detectada";
  }

  // 2. Consulta adicional en segundo plano a OpenStreetMap para mayor precisión si hay red
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);
    const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
      signal: controller.signal,
      headers: { 'Accept-Language': 'es' }
    });
    clearTimeout(timeoutId);
    if (resp.ok) {
      const data = await resp.json();
      if (data && data.address && data.address.road) {
        inputUbicacion.value = `${data.address.road} con ${calle}, Barrio ${sector}`;
      }
    }
  } catch (err) {
    // Si la red externa no responde, la dirección local calculada ya está puesta
  }
}

function actualizarPosicionPin(lat, lng) {
  if (estaDentroDelBarrio(lat, lng)) {
    ultimaPosicionValida = [lat, lng];
    pickerMarker.setLatLng([lat, lng]);
    actualizarCoordenadasFormulario(lat, lng);
    autocompletarDireccionDesdeCoordenadas(lat, lng);
  } else {
    // Si intenta ubicar fuera del barrio, regresarlo de inmediato al último punto válido
    pickerMarker.setLatLng(ultimaPosicionValida);
    actualizarCoordenadasFormulario(ultimaPosicionValida[0], ultimaPosicionValida[1]);
    mostrarAvisoFueraPerimetro();
  }
}

// Variables de Mapas Leaflet
let mapaPicker = null;
let pickerMarker = null;
let mapaGeneral = null;
let marcadoresCapa = null;

// Casos precargados iniciales: limpio en cero según auditoría comunitaria
const CASOS_INICIALES = [];

// Noticias iniciales oficiales (Actualizadas con Alcaldía de Valledupar)
const NOTICIAS_DEFAULT = [
  {
    id: "noticia-1",
    titulo: "¡Atención! Valledupar tendrá restricciones para motocicletas durante dos noches por Halloween",
    fecha: "29 de octubre de 2026",
    categoria: "Seguridad y Movilidad",
    descripcion: "El gobierno del alcalde Ernesto Orozco Durán prepara medidas para el 30 y 31 de octubre. También se desplegará un dispositivo de seguridad con más de 400 uniformados y funcionarios.",
    foto: "https://f002.backblazeb2.com/file/Sedigov/valledupar/images/2026/10/8bb61594-f996-4460-a202-7f18157a217c.jpeg",
    enlace: "https://www.valledupar-cesar.gov.co/noticias/atencion-valledupar-tendra-restricciones-para-motocicletas-durante-dos-noches-por-halloween"
  },
  {
    id: "noticia-2",
    titulo: "Más de 900 niños y jóvenes de los corregimientos de Valledupar se forman en las Escuelas Culturales Gratuitas",
    fecha: "29 de octubre de 2026",
    categoria: "Cultura y Juventud",
    descripcion: "La cobertura del programa ofrecido por la Oficina de Cultura Municipal se extiende por las zonas sur, centro y norte con atención integral y formación artística.",
    foto: "https://f002.backblazeb2.com/file/Sedigov/valledupar/images/2026/10/3079af60-8bf3-4567-8552-a04bf19adce0.jpg",
    enlace: "https://www.valledupar-cesar.gov.co/noticias/mas-de-900-ninos-y-jovenes-de-los-corregimientos-de-valledupar-se-forman-en-las-escuelas-culturales-gratuitas"
  },
  {
    id: "noticia-3",
    titulo: "Policía capturó a tres personas con 65 dosis de estupefacientes en un taxi en Valledupar",
    fecha: "28 de octubre de 2026",
    categoria: "Seguridad Ciudadana",
    descripcion: "El procedimiento se realizó en el barrio Los Caciques, durante operativos de registro y control de la Policía Metropolitana para contrarrestar el microtráfico en la ciudad.",
    foto: "https://f002.backblazeb2.com/file/Sedigov/valledupar/images/2026/10/4c41f228-c897-458d-b8e4-60fce8856fc0.jpg",
    enlace: "https://www.valledupar-cesar.gov.co/noticias/policia-capturo-a-tres-personas-con-65-dosis-de-estupefacientes-en-un-taxi-en-valledupar"
  }
];

let reclamos = [];
let noticias = [];
let archivoFotoSeleccionado = null;
let fotoActualDataUrl = "";
let reclamoSeleccionado = null;

// Inicialización de la aplicación
document.addEventListener("DOMContentLoaded", async () => {
  // 1. Inicializar componentes visuales de inmediato y de forma resiliente
  try { inicializarCarruselAlcaldia(); } catch (e) { console.error("Carrusel:", e); }
  try { actualizarBarraNavJAC(); } catch (e) { console.error("Nav:", e); }
  try { cargarNoticias(); } catch (e) { console.error("Noticias:", e); }
  try { renderizarMuro("todos"); } catch (e) { console.error("Muro:", e); }
  try { renderizarRadicadosLegales("todos"); } catch (e) { console.error("Radicados Legales:", e); }
  try { inicializarMapaPicker(); } catch (e) { console.error("Mapa:", e); }
  try { configurarEventos(); } catch (e) { console.error("Eventos:", e); }
  try { lucide.createIcons(); } catch (e) {}

  // 2. Conectar a Supabase en segundo plano sin congelar la UI
  try {
    await cargarReclamos();
    renderizarMuro("todos");
    renderizarRadicadosLegales("todos");
  } catch (e) {
    console.error("Reclamos Supabase:", e);
  }
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
    center: PANAMA_CENTRO,
    zoom: 17,
    minZoom: 16,
    maxZoom: 20,
    maxBounds: bounds,
    maxBoundsViscosity: 1.0 // Impide estrictamente salirse de Panamá II y III
  });

  // Capa Google Maps Calles (Nítida, moderna y con nombres exactos)
  const googleStreets = L.tileLayer("https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}", {
    subdomains: ['0', '1', '2', '3'],
    attribution: '&copy; Google Maps | JAC Panamá II y III',
    maxZoom: 20
  });

  const googleSatellite = L.tileLayer("https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}", {
    subdomains: ['0', '1', '2', '3'],
    attribution: '&copy; Google Satellite | JAC Panamá II y III',
    maxZoom: 20
  });

  googleStreets.addTo(mapaPicker);

  L.control.layers({
    "🗺️ Google Calles": googleStreets,
    "🛰️ Google Satélite": googleSatellite
  }, null, { position: 'topright' }).addTo(mapaPicker);

  // PERÍMETRO OFICIAL ELEGANTE (Línea fina Azul Institucional #004884 sin barrotas negras)
  const perimetroPanama = L.polygon(POLIGONO_BARRIO_PANAMA, {
    color: '#004884',
    weight: 2.5,
    opacity: 0.9,
    fillColor: '#3366CC',
    fillOpacity: 0.05,
    lineCap: 'round',
    lineJoin: 'round'
  }).addTo(mapaPicker);

  // Encuadrar automáticamente al nivel de zoom de las casas y manzanas (Zoom 17-18)
  mapaPicker.fitBounds(perimetroPanama.getBounds(), { padding: [20, 20], maxZoom: 18 });

  // Marcador seleccionable
  pickerMarker = L.marker(PANAMA_CENTRO_II, {
    draggable: true,
    title: "Arrastra para fijar la manzana o casa afectada"
  }).addTo(mapaPicker);

  // Al hacer clic en el mapa o sobre el polígono del barrio, mover el pin y autocompletar la dirección
  mapaPicker.on("click", (e) => {
    actualizarPosicionPin(e.latlng.lat, e.latlng.lng);
  });

  perimetroPanama.on("click", (e) => {
    actualizarPosicionPin(e.latlng.lat, e.latlng.lng);
  });

  // Restricción: solo permitir fijar el pin dentro del perímetro al arrastrarlo
  pickerMarker.on("dragend", (e) => {
    const latLng = e.target.getLatLng();
    actualizarPosicionPin(latLng.lat, latLng.lng);
  });

  // Autocompletar datos iniciales al cargar
  actualizarPosicionPin(PANAMA_CENTRO_II[0], PANAMA_CENTRO_II[1]);
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
    center: PANAMA_CENTRO,
    zoom: 17,
    minZoom: 16,
    maxZoom: 20,
    maxBounds: bounds,
    maxBoundsViscosity: 1.0
  });

  // Capa Google Maps Calles
  const gGoogleStreets = L.tileLayer("https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}", {
    subdomains: ['0', '1', '2', '3'],
    attribution: '&copy; Google Maps | JAC Panamá II y III',
    maxZoom: 20
  });

  const gGoogleSatellite = L.tileLayer("https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}", {
    subdomains: ['0', '1', '2', '3'],
    attribution: '&copy; Google Satellite | JAC Panamá II y III',
    maxZoom: 20
  });

  gGoogleStreets.addTo(mapaGeneral);

  L.control.layers({
    "🗺️ Google Calles": gGoogleStreets,
    "🛰️ Google Satélite": gGoogleSatellite
  }, null, { position: 'topright' }).addTo(mapaGeneral);

  // PERÍMETRO OFICIAL ELEGANTE (Línea fina Azul Institucional #004884)
  const gPerimetroPanama = L.polygon(POLIGONO_BARRIO_PANAMA, {
    color: '#004884',
    weight: 2.5,
    opacity: 0.9,
    fillColor: '#3366CC',
    fillOpacity: 0.05,
    lineCap: 'round',
    lineJoin: 'round'
  }).addTo(mapaGeneral);

  mapaGeneral.fitBounds(gPerimetroPanama.getBounds(), { padding: [20, 20], maxZoom: 18 });

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
    if (caso.estado === "Enviado a Entidad" || caso.estado === "En espera") markerColor = "#0284C7"; // Azul institucional
    if (caso.radicadoEntidad) markerColor = "#7C3AED"; // Morado radicado
    if (caso.estado === "Solucionado") markerColor = "#059669"; // Verde

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
          <span style="color: ${markerColor};">${caso.radicadoEntidad ? 'RADICADO: ' + caso.radicadoEntidad : (caso.estado === 'En espera' ? 'ENVIADO A ENTIDAD' : caso.estado.toUpperCase())}</span>
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

      if (!error && data) {
        // En el muro público SOLO se muestran los casos validados que PROCEDEN
        // (no los archivados, ni rechazados, ni los que están 'En revisión')
        reclamos = data
          .filter(r => r.estado && r.estado !== 'Archivado' && r.estado !== 'En revisión' && r.estado !== 'Rechazado')
          .map(r => {
            let extra = {};
            try {
              const raw = localStorage.getItem("jac_radicados_extra");
              if (raw) extra = JSON.parse(raw)[r.id] || {};
            } catch (e) {}

            // 1. Columnas oficiales si existen en Supabase
            let radEntidad = r.radicado_entidad || "";
            let entDestino = r.entidad_destino || "";
            let fechaRadEntidad = r.fecha_radicado_entidad || "";
            let canalRad = r.canal_radicacion || "";
            let soporteRad = r.soporte_radicado_entidad || "";

            // 2. Extraer paquete completo de la nube [RAD_DATA:...] (Visible para toda la comunidad)
            if (r.afectados && r.afectados.includes("[RAD_DATA:")) {
              const matchData = r.afectados.match(/\[RAD_DATA:([^\]]+)\]/);
              if (matchData) {
                try {
                  const decoded = JSON.parse(decodeURIComponent(escape(atob(matchData[1]))));
                  if (!radEntidad && decoded.num) radEntidad = decoded.num;
                  if (!entDestino && decoded.ent) entDestino = decoded.ent;
                  if (!fechaRadEntidad && decoded.fec) fechaRadEntidad = decoded.fec;
                  if (!canalRad && decoded.can) canalRad = decoded.can;
                  if (!soporteRad && decoded.sop) soporteRad = decoded.sop;
                } catch (errData) {
                  console.warn("Aviso decodificando RAD_DATA:", errData);
                }
              }
            }

            // 3. Extraer formato simple [RAD:num|ent]
            if (r.afectados && r.afectados.includes("[RAD:")) {
              const match = r.afectados.match(/\[RAD:([^|\]]+)(?:\|([^\]]+))?\]/);
              if (match) {
                if (!radEntidad) radEntidad = match[1];
                if (!entDestino && match[2]) entDestino = match[2];
              }
            }

            // 4. Si falta algún dato, recurrir a la caché local como último recurso
            if (!radEntidad) radEntidad = extra.radicado_entidad || "";
            if (!entDestino) entDestino = extra.entidad_destino || "";
            if (!fechaRadEntidad) fechaRadEntidad = extra.fecha_radicado_entidad || "";
            if (!canalRad) canalRad = extra.canal_radicacion || "Correo Electrónico PQRS";
            if (!soporteRad) soporteRad = extra.soporte_radicado_entidad || "";

            const afectadosLimpio = (r.afectados || "Comunidad Panamá")
              .replace(/\[RAD:[^\]]+\]/g, "")
              .replace(/\[RAD_DATA:[^\]]+\]/g, "")
              .trim();

            let fechaEnvioJac = r.fecha_envio_jac || extra.fecha_envio_jac || r.fecha || "";

            return {
              id: r.id,
              titulo: r.titulo,
              categoria: r.categoria,
              ubicacion: r.ubicacion,
              sector: r.sector || "Panamá II",
              tiempo: r.tiempo,
              diasNumero: r.dias_numero || 1,
              descripcion: r.descripcion,
              foto: r.foto,
              estado: (r.estado === "En espera" ? "Enviado a Entidad" : (r.estado || "Enviado a Entidad")),
              afectados: afectadosLimpio,
              fecha: r.fecha,
              solicitante: r.solicitante || "Habitante Panamá",
              lat: r.lat || PANAMA_CENTRO_II[0],
              lng: r.lng || PANAMA_CENTRO_II[1],
              radicadoEntidad: radEntidad,
              entidadDestino: entDestino,
              fechaRadicadoEntidad: fechaRadEntidad,
              soporteRadicadoEntidad: soporteRad,
              canalRadicacion: canalRad,
              fechaEnvioJac: fechaEnvioJac
            };
          });
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
        reclamos = JSON.parse(guardados).map(r => ({
          ...r,
          estado: r.estado === 'En espera' ? 'Enviado a Entidad' : r.estado
        })).filter(r => r.estado && r.estado !== 'Archivado' && r.estado !== 'En revisión' && r.estado !== 'Rechazado');
      } catch (e) {
        reclamos = [];
      }
    } else {
      reclamos = [];
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
    : reclamos.filter(r => {
        const est = (r.estado || "").toLowerCase();
        const f = filtro.toLowerCase();
        if (f === "enviado a entidad" || f === "en espera" || f === "enviados") {
          return est.includes("enviado") || est.includes("espera") || est.includes("radicado");
        }
        return est === f;
      });

  const countElem = document.getElementById("countTodos");
  if (countElem) countElem.textContent = reclamos.length;

  if (reclamos.length === 0) {
    contenedor.innerHTML = `
      <div class="col-span-full py-16 px-6 text-center bg-white rounded-2xl border-2 border-dashed border-slate-200 shadow-sm">
        <div class="w-16 h-16 rounded-full bg-blue-50 text-[#004884] flex items-center justify-center mx-auto mb-4 border border-blue-100 shadow-inner">
          <i data-lucide="inbox" class="w-8 h-8"></i>
        </div>
        <h4 class="text-lg font-black text-slate-900 tracking-tight">Muro Comunitario Limpio (0 Reportes Activos)</h4>
        <p class="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-1.5 leading-relaxed">
          Actualmente no hay reclamos pendientes publicados para el Barrio Panamá II y III. Todo habitante puede radicar un reporte para iniciar la veeduría comunitaria con respaldo legal de la JAC.
        </p>
        <div class="mt-6 flex flex-wrap items-center justify-center gap-3">
          <a href="#radicar" class="inline-flex items-center gap-2 bg-[#004884] hover:bg-[#013057] text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-lg shadow transition">
            <i data-lucide="plus-circle" class="w-4 h-4"></i>
            <span>Radicar Primer Reporte</span>
          </a>
        </div>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  if (filtrados.length === 0) {
    contenedor.innerHTML = `
      <div class="col-span-full py-12 text-center bg-white rounded-xl border border-slate-200">
        <i data-lucide="check-circle" class="w-12 h-12 text-emerald-500 mx-auto mb-2"></i>
        <h4 class="font-bold text-slate-800">No hay reclamos en esta categoría</h4>
        <p class="text-xs text-slate-500">No se registran solicitudes en este filtro.</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  filtrados.forEach(caso => {
    let badgeClass = "badge-enviado";
    let badgeIcon = "send";
    let textoBadge = "ENVIADO A ENTIDAD";

    if (caso.radicadoEntidad) {
      badgeClass = "badge-radicado";
      badgeIcon = "file-check-2";
      textoBadge = `RADICADO: ${caso.radicadoEntidad}`;
    } else if (caso.estado === "Ignorado") {
      badgeClass = "badge-ignorado";
      badgeIcon = "alert-triangle";
      textoBadge = "IGNORADO POR ALCALDÍA";
    } else if (caso.estado === "Solucionado") {
      badgeClass = "badge-solucionado";
      badgeIcon = "check-circle";
      textoBadge = "SOLUCIONADO";
    } else {
      badgeClass = "badge-enviado";
      badgeIcon = "send";
      const entidadCorta = caso.entidadDestino ? caso.entidadDestino.split(' ')[0] : 'ENTIDAD';
      textoBadge = `ENVIADO A ${entidadCorta.toUpperCase()}`;
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
              ${textoBadge}
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
            ${caso.radicadoEntidad ? `
              <div class="mt-2.5 p-2 bg-blue-50 border border-blue-200 rounded-lg text-xs flex items-center justify-between text-[#004884]">
                <div class="flex items-center gap-1.5 font-bold">
                  <i data-lucide="file-check" class="w-3.5 h-3.5 text-[#004884] shrink-0"></i>
                  <span>Radicado Oficial: <span class="font-mono font-black text-blue-950">${caso.radicadoEntidad}</span></span>
                </div>
                ${caso.entidadDestino ? `<span class="text-[10px] bg-blue-100 font-bold px-1.5 py-0.5 rounded text-blue-900 truncate max-w-[110px]">${caso.entidadDestino.split(' ')[0]}</span>` : ''}
              </div>
            ` : ''}
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

// ==========================================
// CARRUSEL OFICIAL DE BANNERS DE LA ALCALDÍA DE VALLEDUPAR
// Sincronización en vivo con la API oficial GraphQL + Transiciones exactas
// ==========================================
const BANNERS_ALCALDIA_DEFAULT = [
  {
    id: "PEMP-1",
    titulo: "Plan Especial de Manejo y Protección (PEMP) Valledupar",
    imagen: "https://valledupar-sedigov.s-integrations.co/attachment/files/download/1CE34D3E-F36B-1410-8C8A-00A971D655DB",
    enlace: "https://forms.gle/Uy8fTg5eYWpAiQ92A"
  },
  {
    id: "IMPUESTOS-1",
    titulo: "Descuento 99% Impuestos Municipales",
    imagen: "https://valledupar-sedigov.s-integrations.co/attachment/files/download/C1604E3E-F36B-1410-8C8B-00A971D655DB",
    enlace: "https://valledupar.taxationsmart.co/ords/f?p=150000:1:12355446337061:::1:F_CDGO_CLNTE:10"
  },
  {
    id: "POT-1",
    titulo: "Revisión Plan de Ordenamiento Territorial (POT)",
    imagen: "https://valledupar-sedigov.s-integrations.co/attachment/files/download/AEE84D3E-F36B-1410-8C8B-00A971D655DB",
    enlace: "https://forms.gle/GuDd6imUzXcY9bqYA"
  },
  {
    id: "POT-2",
    titulo: "POT Valledupar 2026",
    imagen: "https://valledupar-sedigov.s-integrations.co/attachment/files/download/ABB513C5-190D-F111-AB1F-C45AB1C98469",
    enlace: "https://forms.gle/3egV6Fm6g6AfkGba9"
  },
  {
    id: "OMS-1",
    titulo: "Observatorio de Salud OMS Valledupar",
    imagen: "https://valledupar-sedigov.s-integrations.co/attachment/files/download/4C894F3E-F36B-1410-8C8A-00A971D655DB",
    enlace: "https://oms.valledupar-cesar.gov.co/"
  },
  {
    id: "DENGUE-1",
    titulo: "Campaña Oficial Todos Contra el Dengue",
    imagen: "https://valledupar-sedigov.s-integrations.co/attachment/files/download/0AE44986-3616-F111-AB1F-C45AB1C98469",
    enlace: "https://www.valledupar-cesar.gov.co/sala-de-prensa/la-prevencion-del-dengue-comienza-en-casa-jaide-medina-secretaria-de-salud"
  },
  {
    id: "ZAFA-1",
    titulo: "Zafa Pago Diario",
    imagen: "https://valledupar-sedigov.s-integrations.co/attachment/files/download/3FE94D3E-F36B-1410-8C8B-00A971D655DB",
    enlace: "https://www.monet.com.co/alcaldia-de-valledupar/"
  },
  {
    id: "CATASTRO-1",
    titulo: "Trámites de Gestión Catastral",
    imagen: "https://valledupar-sedigov.s-integrations.co/attachment/files/download/D09B20E1-5DBB-F011-BFB4-08BFB81D5CA8",
    enlace: "https://www.instagram.com/p/DLpP98dOhR1/?img_index=1"
  }
];

let listaBannersAlcaldia = [...BANNERS_ALCALDIA_DEFAULT];
let indiceSlideBanner = 0;
let timerBannerAutoplay = null;
let bannerEnPausa = false;

function inicializarCarruselAlcaldia() {
  renderizarCarruselBanners();
  iniciarAutoPlayBanner();
  sincronizarBannersEnVivoDesdeAlcaldia();
}

function renderizarCarruselBanners() {
  const wrapper = document.getElementById("carruselSlidesWrapper");
  const dotsWrapper = document.getElementById("carruselDotsWrapper");
  if (!wrapper || !dotsWrapper) return;

  wrapper.innerHTML = "";
  dotsWrapper.innerHTML = "";

  listaBannersAlcaldia.forEach((banner, idx) => {
    // 1. Elemento del Slide (Enlace oficial directo al hacer clic)
    const slide = document.createElement("a");
    slide.href = banner.enlace;
    slide.target = "_blank";
    slide.rel = "noopener noreferrer";
    slide.id = `slideBannerItem-${idx}`;
    slide.title = `Abrir en nueva pestaña: ${banner.titulo}`;
    slide.className = `absolute inset-0 block w-full h-full transition-opacity duration-700 ease-in-out cursor-pointer ${
      idx === indiceSlideBanner ? "opacity-100 z-10 pointer-events-auto" : "opacity-0 z-0 pointer-events-none"
    }`;
    slide.innerHTML = `
      <img 
        src="${banner.imagen}" 
        alt="${banner.titulo}" 
        class="w-full h-full object-cover object-center select-none"
        loading="${idx === 0 ? 'eager' : 'lazy'}"
      >
    `;
    wrapper.appendChild(slide);

    // 2. Indicador en forma de bolita (Dot)
    const dot = document.createElement("button");
    dot.type = "button";
    dot.id = `dotBannerItem-${idx}`;
    dot.onclick = () => irASlideBanner(idx);
    dot.className = `rounded-full transition-all cursor-pointer ${
      idx === indiceSlideBanner 
        ? "w-3 h-3 bg-white scale-110 shadow" 
        : "w-2.5 h-2.5 bg-transparent border border-white/60 hover:border-white"
    }`;
    dotsWrapper.appendChild(dot);
  });
}

function cambiarSlideBanner(delta) {
  if (listaBannersAlcaldia.length === 0) return;
  let nuevoIndice = indiceSlideBanner + delta;
  if (nuevoIndice < 0) nuevoIndice = listaBannersAlcaldia.length - 1;
  if (nuevoIndice >= listaBannersAlcaldia.length) nuevoIndice = 0;
  irASlideBanner(nuevoIndice);
}

function irASlideBanner(indice) {
  if (indice < 0 || indice >= listaBannersAlcaldia.length) return;
  
  // Ocultar slide anterior
  const slideViejo = document.getElementById(`slideBannerItem-${indiceSlideBanner}`);
  const dotViejo = document.getElementById(`dotBannerItem-${indiceSlideBanner}`);
  if (slideViejo) {
    slideViejo.className = "absolute inset-0 block w-full h-full transition-opacity duration-700 ease-in-out cursor-pointer opacity-0 z-0 pointer-events-none";
  }
  if (dotViejo) {
    dotViejo.className = "w-2.5 h-2.5 bg-transparent border border-white/60 hover:border-white rounded-full transition-all cursor-pointer";
  }

  // Mostrar slide nuevo
  indiceSlideBanner = indice;
  const slideNuevo = document.getElementById(`slideBannerItem-${indiceSlideBanner}`);
  const dotNuevo = document.getElementById(`dotBannerItem-${indiceSlideBanner}`);
  if (slideNuevo) {
    slideNuevo.className = "absolute inset-0 block w-full h-full transition-opacity duration-700 ease-in-out cursor-pointer opacity-100 z-10 pointer-events-auto";
  }
  if (dotNuevo) {
    dotNuevo.className = "w-3 h-3 bg-white scale-110 shadow rounded-full transition-all cursor-pointer";
  }

  // Reiniciar autoplay si no está pausado
  if (!bannerEnPausa) {
    iniciarAutoPlayBanner();
  }
}

function iniciarAutoPlayBanner() {
  if (timerBannerAutoplay) clearInterval(timerBannerAutoplay);
  timerBannerAutoplay = setInterval(() => {
    cambiarSlideBanner(1);
  }, 4000); // 4000ms idéntico a la Sede Electrónica oficial
}

window.togglePausaBanner = function() {
  bannerEnPausa = !bannerEnPausa;
  const texto = document.getElementById("textoPausaBanner");
  const svg = document.getElementById("svgPausaBanner");

  if (bannerEnPausa) {
    if (timerBannerAutoplay) {
      clearInterval(timerBannerAutoplay);
      timerBannerAutoplay = null;
    }
    if (texto) texto.textContent = "Reanudar";
    if (svg) svg.innerHTML = `<polygon points="5 3 19 12 5 21 5 3"></polygon>`;
  } else {
    iniciarAutoPlayBanner();
    if (texto) texto.textContent = "Pausar";
    if (svg) svg.innerHTML = `<rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect>`;
  }
};

window.cambiarSlideBanner = cambiarSlideBanner;
window.irASlideBanner = irASlideBanner;

// Sincronización en vivo con la API oficial GraphQL de la Alcaldía de Valledupar
async function sincronizarBannersEnVivoDesdeAlcaldia() {
  try {
    const res = await fetch("https://valledupar-sedigov.s-integrations.co/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `query Home {
          mainPage {
            ... on PageSliderBlock {
              sliders {
                id
                title
                orderIndex
                alternativeText
                image { downloadUrl }
                linkItem { url }
              }
            }
          }
        }`
      })
    });
    if (res.ok) {
      const json = await res.json();
      const sliderBlock = json.data?.mainPage?.find(b => b.sliders && b.sliders.length > 0);
      if (sliderBlock && sliderBlock.sliders.length > 0) {
        const nuevosBanners = sliderBlock.sliders
          .filter(s => s.image && s.image.downloadUrl)
          .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))
          .map(s => ({
            id: s.id,
            titulo: s.alternativeText || s.title || "Alcaldía de Valledupar",
            imagen: s.image.downloadUrl,
            enlace: s.linkItem?.url || "https://www.valledupar-cesar.gov.co"
          }));
        if (nuevosBanners.length > 0) {
          listaBannersAlcaldia = nuevosBanners;
          renderizarCarruselBanners();
        }
      }
    }
  } catch (e) {
    // Silencioso: usa la lista oficial local preconfigurada
  }
}

// ==============================================================================
// GESTIÓN Y SINCRONIZACIÓN EN VIVO DE NOTICIAS DE LA ALCALDÍA DE VALLEDUPAR
// ==============================================================================
function extraerTextoResumen(summaryRaw) {
  if (!summaryRaw) return "";
  if (typeof summaryRaw !== "string") return String(summaryRaw);
  if (summaryRaw.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(summaryRaw);
      const textos = [];
      function recorrer(nodo) {
        if (!nodo) return;
        if (nodo.text) textos.push(nodo.text);
        if (Array.isArray(nodo.children)) nodo.children.forEach(recorrer);
      }
      recorrer(parsed.root);
      if (textos.length > 0) return textos.join(" ");
    } catch (e) {}
  }
  return summaryRaw.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function generarSlugNoticia(titulo) {
  if (!titulo) return "noticia";
  return titulo
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatearFechaNoticia(fechaStr) {
  if (!fechaStr) return "Reciente";
  try {
    const d = new Date(fechaStr);
    if (isNaN(d.getTime())) return "Reciente";
    const meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
    return `${d.getDate()} de ${meses[d.getMonth()]} de ${d.getFullYear()}`;
  } catch (e) {
    return "Reciente";
  }
}

function actualizarBadgeSincronizacion(estaEnVivo) {
  const badge = document.getElementById("badgeSincronizacionNoticias");
  if (badge) {
    if (estaEnVivo) {
      badge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span><span>Sincronizado con Alcaldía (En Vivo)</span>`;
      badge.className = "bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5";
    }
  }
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
  }
  renderizarNoticias();

  // Sincronización automática con la Alcaldía oficial en segundo plano al cargar
  setTimeout(() => {
    sincronizarNoticiasEnVivo(true);
  }, 400);
}

async function sincronizarNoticiasEnVivo(esSilencioso = false) {
  const btn = document.getElementById("btnRecargarNoticias");
  let originalHtml = "";
  if (btn && !esSilencioso) {
    originalHtml = btn.innerHTML;
    btn.innerHTML = `<i data-lucide="loader" class="w-3.5 h-3.5 animate-spin"></i> <span class="hidden sm:inline">Sincronizando...</span>`;
    lucide.createIcons();
  }

  try {
    // Consulta directa a la API oficial GraphQL de SEDIGOV (Alcaldía Municipal de Valledupar)
    const res = await fetch("https://valledupar-sedigov.s-integrations.co/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `query GetNoticiasAlcaldia {
          newsItems(
            pagination: { skip: 0, take: 5 },
            orderBy: [{ publicationDate: DESC }]
          ) {
            id
            title
            summary
            date
            publicationDate
            alternativeText
            image {
              downloadUrl
            }
            dependency {
              name
            }
          }
        }`
      })
    });

    if (res.ok) {
      const json = await res.json();
      const items = json.data?.newsItems;
      if (Array.isArray(items) && items.length > 0) {
        const nuevasNoticias = items.map((item, idx) => {
          const resumenLimpio = extraerTextoResumen(item.summary);
          const slug = generarSlugNoticia(item.title);
          return {
            id: item.id || `noticia-${idx}`,
            titulo: item.title,
            fecha: formatearFechaNoticia(item.publicationDate || item.date),
            categoria: item.dependency?.name || (idx === 0 ? "Comunidad y Orden" : "Alcaldía de Valledupar"),
            descripcion: resumenLimpio || item.title,
            foto: item.image?.downloadUrl || NOTICIAS_DEFAULT[idx % NOTICIAS_DEFAULT.length].foto,
            enlace: `https://www.valledupar-cesar.gov.co/noticias/${slug}`
          };
        });

        if (nuevasNoticias.length >= 3) {
          noticias = nuevasNoticias;
          localStorage.setItem("valledupar_noticias_cache", JSON.stringify(noticias));
          localStorage.setItem("valledupar_noticias_last_sync", new Date().toISOString());
          renderizarNoticias();
          actualizarBadgeSincronizacion(true);
        }
      }
    }
  } catch (err) {
    console.warn("Aviso en sincronización en vivo de noticias:", err);
  } finally {
    if (btn && !esSilencioso && originalHtml) {
      btn.innerHTML = originalHtml;
      lucide.createIcons();
    }
  }
}
window.sincronizarNoticiasEnVivo = sincronizarNoticiasEnVivo;

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

        if (!estaDentroDelBarrio(latVal, lngVal)) {
          alert("⚠️ El punto seleccionado en el mapa está fuera del perímetro oficial de Barrio Panamá II y III.\nPor favor haz clic dentro del perímetro delimitado en el mapa.");
          document.getElementById("mapaPanamaPicker").scrollIntoView({ behavior: 'smooth' });
          btnSubmit.disabled = false;
          btnSubmit.innerHTML = btnOriginalText;
          lucide.createIcons();
          return;
        }

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
          estado: "En revisión", // Estado inicial de moderación: requiere validación de la JAC
          afectados: `Comunidad ${sector}`,
          fecha: new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }),
          solicitante: esAnonimo ? "Vecino Anónimo" : (nombreVecino || `Habitante ${sector}`),
          lat: latVal,
          lng: lngVal
        };

        // Guardar en Supabase Database en estado 'En revisión'
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
            console.warn("Aviso al guardar en Supabase:", dbErr);
          }
        }

        form.reset();
        archivoFotoSeleccionado = null;
        fotoActualDataUrl = "";
        dropzonePrompt.classList.remove("hidden");
        dropzonePreview.classList.add("hidden");

        if (window.confetti) {
          confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
        }

        // Mostrar modal oficial de radicado con validación previa
        const confNum = document.getElementById("confRadicadoNum");
        if (confNum) confNum.textContent = nuevoRadicado;

        const btnWa = document.getElementById("btnAvisarWhatsapp");
        if (btnWa) {
          const msgWa = encodeURIComponent(`Hola JAC Barrio Panamá II y III, acabo de radicar el caso ${nuevoRadicado} sobre ${categoria} en ${ubicacion} para su validación de procedencia.`);
          btnWa.href = `https://wa.me/573000000000?text=${msgWa}`;
        }

        const modalConf = document.getElementById("modalConfirmacionRadicado");
        if (modalConf) modalConf.classList.remove("hidden");
        lucide.createIcons();

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

  // Buscador de Radicado (Consulta si el caso procede y su estado en Supabase)
  const btnBuscar = document.getElementById("btnBuscarRadicado");
  const inputBuscar = document.getElementById("inputBuscarRadicado");
  const resultadoBusqueda = document.getElementById("resultadoBusqueda");

  if (btnBuscar && inputBuscar) {
    btnBuscar.addEventListener("click", async () => {
      const q = inputBuscar.value.trim().toUpperCase();
      if (!q) return;

      btnBuscar.disabled = true;
      btnBuscar.innerHTML = `<i data-lucide="loader" class="w-3.5 h-3.5 animate-spin"></i>`;
      lucide.createIcons();

      let encontrado = reclamos.find(r => 
        r.id.toUpperCase() === q || 
        r.id.toUpperCase().includes(q) || 
        (r.radicadoEntidad && r.radicadoEntidad.toUpperCase().includes(q))
      );

      // Si no está en reclamos validados (porque está 'En revisión' o 'Rechazado'), consultar directamente en Supabase
      if (!encontrado && supabaseClient) {
        try {
          const { data } = await supabaseClient.from('reclamos').select('*').ilike('id', `%${q}%`).limit(1);
          if (data && data.length > 0) {
            encontrado = data[0];
          }
        } catch (e) {
          console.warn("Error al buscar en Supabase:", e);
        }
      }

      resultadoBusqueda.classList.remove("hidden");

      if (encontrado) {
        let badgeColor = "bg-amber-100 text-amber-900 border-amber-300";
        let statusText = "En revisión previa por la JAC";
        let statusDesc = "Tu reporte está siendo evaluado por el delegado comunal para determinar su procedencia antes de publicación pública.";

        const radNum = encontrado.radicadoEntidad || encontrado.radicado_entidad;
        const entNom = encontrado.entidadDestino || encontrado.entidad_destino;

        if (encontrado.estado === "Solucionado") {
          badgeColor = "bg-emerald-100 text-emerald-900 border-emerald-300";
          statusText = "Solucionado por la entidad";
          statusDesc = "La situación reportada fue atendida y reparada formalmente en terreno.";
        } else if (radNum) {
          badgeColor = "bg-purple-100 text-purple-900 border-purple-300";
          statusText = "Radicado Oficial en Entidad";
          statusDesc = `El reporte cuenta con radicado oficial ${radNum} expedido por ${entNom || 'la entidad'}. La JAC realiza seguimiento de veeduría comunitaria.`;
        } else if (encontrado.estado === "Enviado a Entidad" || encontrado.estado === "En espera") {
          badgeColor = "bg-blue-100 text-[#004884] border-blue-300";
          statusText = "Confirmado por JAC - Enviado a Entidad";
          statusDesc = `La JAC confirmó la legitimidad de tu reporte y remitió el oficio formal ante ${entNom || 'la entidad competente'} para su atención prioritaria.`;
        } else if (encontrado.estado === "Ignorado") {
          badgeColor = "bg-red-100 text-red-900 border-red-300";
          statusText = "Sin respuesta de la entidad";
          statusDesc = "El término legal de respuesta expiró sin pronunciamiento de la entidad; el caso escala ante la Personería Municipal.";
        } else if (encontrado.estado === "Rechazado") {
          badgeColor = "bg-red-100 text-red-900 border-red-300";
          statusText = "No Procede";
          statusDesc = "El reporte no cumplió los criterios de radicación comunal (ubicación fuera de la zona o información insuficiente).";
        }

        resultadoBusqueda.innerHTML = `
          <div class="p-4 bg-white border border-slate-200 rounded-xl shadow-sm text-slate-800 space-y-2">
            <div class="flex items-center justify-between gap-2">
              <span class="font-mono text-xs font-bold text-[#004884]">${encontrado.id}</span>
              <span class="text-[10px] font-black uppercase px-2 py-0.5 rounded border ${badgeColor}">
                ${statusText}
              </span>
            </div>
            <h5 class="font-bold text-sm text-slate-900 leading-snug">${encontrado.titulo}</h5>
            <p class="text-xs text-slate-600">${encontrado.ubicacion} · <span class="font-semibold">${encontrado.sector || "Panamá II"}</span></p>
            
            ${radNum ? `
              <div class="p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-xs space-y-0.5">
                <div class="flex items-center gap-1.5 font-bold text-blue-900">
                  <i data-lucide="file-check-2" class="w-4 h-4 text-[#004884]"></i>
                  <span>Radicado Oficial de Trámite: <span class="font-mono font-black">${radNum}</span></span>
                </div>
                ${entNom ? `<div class="text-[11px] text-blue-800 pl-5">🏢 Radicado ante: <strong>${entNom}</strong></div>` : ''}
              </div>
            ` : ''}

            <div class="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-600 leading-relaxed">
              ℹ️ <strong>Estado del trámite:</strong> ${statusDesc}
            </div>
            ${encontrado.estado !== "En revisión" && encontrado.estado !== "Rechazado" ? `
              <button onclick="abrirModalInstagram('${encontrado.id}')" class="mt-2 text-xs font-bold text-[#004884] hover:underline inline-flex items-center gap-1">
                <i data-lucide="instagram" class="w-3.5 h-3.5"></i> Ficha Instagram de este caso
              </button>
            ` : ''}
          </div>
        `;
      } else {
        resultadoBusqueda.innerHTML = `
          <div class="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-xs">
            No se encontró ningún radicado con el código <strong>${q}</strong>.<br>
            Verifica que el número coincida exactamente (ej: RAD-PANAMA-2026-XXXX).
          </div>
        `;
      }
      btnBuscar.disabled = false;
      btnBuscar.innerHTML = `Buscar`;
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
// CONTROL DE TÉRMINOS LEGALES DE RESPUESTA (LEY 1755 DE 2015) - 15 DÍAS HÁBILES
// ==========================================
const FESTIVOS_COLOMBIA_2026 = [
  "2026-01-01", "2026-01-12", "2026-03-23", "2026-04-02", "2026-04-03",
  "2026-05-01", "2026-05-18", "2026-06-08", "2026-06-15", "2026-06-29",
  "2026-07-20", "2026-08-07", "2026-08-17", "2026-10-12", "2026-11-02",
  "2026-11-16", "2026-12-08", "2026-12-25"
];

function esDiaHabil(fecha) {
  const diaSemana = fecha.getDay();
  if (diaSemana === 0 || diaSemana === 6) return false;
  const isoStr = fecha.toISOString().slice(0, 10);
  if (FESTIVOS_COLOMBIA_2026.includes(isoStr)) return false;
  return true;
}

function parsearFechaUniversal(fechaStr) {
  if (!fechaStr) return new Date();
  if (fechaStr.includes("/")) {
    const partes = fechaStr.split("/");
    if (partes.length === 3) {
      return new Date(parseInt(partes[2]), parseInt(partes[1]) - 1, parseInt(partes[0]));
    }
  }
  const d = new Date(fechaStr);
  return isNaN(d.getTime()) ? new Date() : d;
}

function calcularTerminoLegal15Dias(fechaInicioStr, estadoCaso) {
  const PLAZO_LEGAL_DIAS = 15;
  const fechaInicio = parsearFechaUniversal(fechaInicioStr);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  let cursor = new Date(fechaInicio);
  cursor.setHours(0, 0, 0, 0);
  let diasHabilesSumados = 0;

  while (diasHabilesSumados < PLAZO_LEGAL_DIAS) {
    cursor.setDate(cursor.getDate() + 1);
    if (esDiaHabil(cursor)) {
      diasHabilesSumados++;
    }
  }
  const fechaVencimiento = new Date(cursor);

  let conteoCursor = new Date(fechaInicio);
  conteoCursor.setHours(0, 0, 0, 0);
  let diasHabilesTranscurridos = 0;

  while (conteoCursor < hoy) {
    conteoCursor.setDate(conteoCursor.getDate() + 1);
    if (esDiaHabil(conteoCursor)) {
      diasHabilesTranscurridos++;
    }
  }

  const diasRestantes = PLAZO_LEGAL_DIAS - diasHabilesTranscurridos;
  const porcentaje = Math.min(100, Math.round((diasHabilesTranscurridos / PLAZO_LEGAL_DIAS) * 100));

  let estadoTermino = "EN_TERMINO";
  let colorBadge = "bg-emerald-100 text-emerald-800 border-emerald-300";
  let colorBarra = "bg-emerald-600";
  let textoBadge = `Día ${diasHabilesTranscurridos} de ${PLAZO_LEGAL_DIAS} hábiles`;
  let mensajeAccion = "En plazo legal de respuesta";

  if (estadoCaso === "Solucionado" || estadoCaso === "Respondido") {
    estadoTermino = "RESPONDIDO";
    colorBadge = "bg-purple-100 text-purple-800 border-purple-300";
    colorBarra = "bg-purple-600";
    textoBadge = "✓ Respondido / Cerrado";
    mensajeAccion = "La entidad emitió respuesta oficial";
  } else if (diasHabilesTranscurridos > PLAZO_LEGAL_DIAS) {
    estadoTermino = "VENCIDO";
    const diasVencido = diasHabilesTranscurridos - PLAZO_LEGAL_DIAS;
    colorBadge = "bg-red-100 text-red-800 border-red-300 animate-pulse";
    colorBarra = "bg-red-600";
    textoBadge = `¡VENCIDO HACE ${diasVencido} DÍA${diasVencido > 1 ? 'S' : ''}!`;
    mensajeAccion = "🚨 Silencio administrativo: Sujeto a Tutela";
  } else if (diasRestantes <= 3) {
    estadoTermino = "POR_VENCER";
    colorBadge = "bg-amber-100 text-amber-800 border-amber-300";
    colorBarra = "bg-amber-500";
    textoBadge = `⚠️ ¡Quedan ${diasRestantes} día${diasRestantes > 1 ? 's' : ''}!`;
    mensajeAccion = "Próximo a vencer término legal";
  }

  const opcionesFecha = { day: '2-digit', month: 'short', year: 'numeric' };

  return {
    fechaInicioStr: fechaInicio.toLocaleDateString('es-CO', opcionesFecha),
    fechaVencimientoStr: fechaVencimiento.toLocaleDateString('es-CO', opcionesFecha),
    diasHabilesTranscurridos,
    diasRestantes: Math.max(0, diasRestantes),
    diasVencido: Math.max(0, diasHabilesTranscurridos - PLAZO_LEGAL_DIAS),
    porcentaje,
    estadoTermino,
    colorBadge,
    colorBarra,
    textoBadge,
    mensajeAccion
  };
}

let filtroRadicadosPublicoActivo = 'todos';

window.cambiarFiltroRadicadosPublicos = function(filtro) {
  filtroRadicadosPublicoActivo = filtro;
  const botones = ["todos", "VENCIDO", "POR_VENCER", "EN_TERMINO", "RESPONDIDO"];
  botones.forEach(b => {
    const btn = document.getElementById(`btnFiltroPub_${b}`);
    if (!btn) return;
    if (b === filtro) {
      btn.className = "px-3 py-1.5 rounded-lg text-xs font-bold transition bg-[#004884] text-white shadow-sm cursor-pointer";
    } else {
      btn.className = "px-3 py-1.5 rounded-lg text-xs font-semibold transition bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer";
    }
  });
  filtrarRadicadosLegalesPublicos();
};

window.filtrarRadicadosLegalesPublicos = function() {
  const query = (document.getElementById("inputBuscarRadicadosLegales")?.value || "").toLowerCase().trim();
  renderizarRadicadosLegales(filtroRadicadosPublicoActivo, query);
};

window.renderizarRadicadosLegales = function(filtro = "todos", query = "") {
  const contenedor = document.getElementById("contenedorRadicadosLegales");
  if (!contenedor) return;

  const radicadosActivos = reclamos.filter(r => r.estado && (r.estado === "Enviado a Entidad" || r.estado === "Solucionado"));

  let countEnPlazo = 0;
  let countPorVencer = 0;
  let countVencidos = 0;

  radicadosActivos.forEach(r => {
    const termino = calcularTerminoLegal15Dias(r.fechaRadicadoEntidad || r.fechaEnvioJac || r.fecha, r.estado);
    if (termino.estadoTermino === "VENCIDO") countVencidos++;
    else if (termino.estadoTermino === "POR_VENCER") countPorVencer++;
    else if (termino.estadoTermino === "EN_TERMINO") countEnPlazo++;
  });

  const elTotal = document.getElementById("pubTerminosTotal");
  if (elTotal) elTotal.textContent = radicadosActivos.length;
  const elEnPlazo = document.getElementById("pubTerminosEnPlazo");
  if (elEnPlazo) elEnPlazo.textContent = countEnPlazo;
  const elPorVencer = document.getElementById("pubTerminosPorVencer");
  if (elPorVencer) elPorVencer.textContent = countPorVencer;
  const elVencidos = document.getElementById("pubTerminosVencidos");
  if (elVencidos) elVencidos.textContent = countVencidos;

  const filtrados = radicadosActivos.filter(caso => {
    const termino = calcularTerminoLegal15Dias(caso.fechaRadicadoEntidad || caso.fechaEnvioJac || caso.fecha, caso.estado);

    if (filtro !== "todos" && termino.estadoTermino !== filtro) {
      return false;
    }

    if (query) {
      const matchId = (caso.id || "").toLowerCase().includes(query);
      const matchRad = (caso.radicadoEntidad || "").toLowerCase().includes(query);
      const matchEnt = (caso.entidadDestino || "").toLowerCase().includes(query);
      const matchTit = (caso.titulo || "").toLowerCase().includes(query);
      const matchUbi = (caso.ubicacion || "").toLowerCase().includes(query);
      if (!matchId && !matchRad && !matchEnt && !matchTit && !matchUbi) return false;
    }
    return true;
  });

  if (filtrados.length === 0) {
    contenedor.innerHTML = `
      <div class="bg-white p-8 rounded-3xl border border-slate-200 text-center text-slate-400">
        <i data-lucide="scale" class="w-12 h-12 mx-auto opacity-30 mb-3 text-purple-600"></i>
        <h4 class="text-base font-black text-slate-800">No hay radicados en este filtro</h4>
        <p class="text-xs text-slate-500 mt-1">Los oficios que la JAC remita a las entidades públicas aparecerán en este tablero con su semáforo de 15 días.</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  filtrados.sort((a, b) => {
    const tA = calcularTerminoLegal15Dias(a.fechaRadicadoEntidad || a.fechaEnvioJac || a.fecha, a.estado);
    const tB = calcularTerminoLegal15Dias(b.fechaRadicadoEntidad || b.fechaEnvioJac || b.fecha, b.estado);
    const peso = { "VENCIDO": 4, "POR_VENCER": 3, "EN_TERMINO": 2, "RESPONDIDO": 1 };
    return (peso[tB.estadoTermino] || 0) - (peso[tA.estadoTermino] || 0);
  });

  contenedor.innerHTML = filtrados.map(caso => {
    const termino = calcularTerminoLegal15Dias(caso.fechaRadicadoEntidad || caso.fechaEnvioJac || caso.fecha, caso.estado);
    const entidad = caso.entidadDestino || "Alcaldía de Valledupar";

    return `
      <div class="bg-white rounded-3xl border ${termino.estadoTermino === 'VENCIDO' ? 'border-red-300 shadow-lg ring-2 ring-red-200' : 'border-slate-200 shadow-sm'} p-5 sm:p-6 transition space-y-4">
        
        <!-- Cabecera de la Tarjeta -->
        <div class="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div class="flex items-center gap-3">
            <div class="w-11 h-11 rounded-2xl ${termino.estadoTermino === 'VENCIDO' ? 'bg-red-100 text-red-700' : 'bg-blue-50 text-[#004884]'} flex items-center justify-center shrink-0 shadow-sm">
              <i data-lucide="${termino.estadoTermino === 'VENCIDO' ? 'alert-octagon' : 'scale'}" class="w-5 h-5"></i>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="font-mono font-black text-xs sm:text-sm text-slate-900">${caso.id}</span>
                <span class="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-full uppercase">${caso.categoria}</span>
              </div>
              <div class="text-xs sm:text-sm font-extrabold text-[#004884] mt-0.5 flex items-center gap-1.5">
                <i data-lucide="building-2" class="w-3.5 h-3.5 text-blue-600"></i>
                <span>${entidad}</span>
              </div>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            ${caso.radicadoEntidad ? `
              <span class="bg-purple-50 text-purple-900 border border-purple-200 font-mono font-black text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm" title="Número de radicado asignado por la entidad">
                <i data-lucide="bookmark-check" class="w-4 h-4 text-purple-600"></i>
                <span>Rad. Entidad: ${caso.radicadoEntidad}</span>
              </span>
            ` : `
              <span class="bg-amber-50 text-amber-900 border border-amber-200 text-xs font-bold px-2.5 py-1 rounded-xl">
                En trámite de radicado
              </span>
            `}

            <span class="px-3.5 py-1.5 rounded-full text-xs font-black border ${termino.colorBadge} flex items-center gap-1.5 shadow-sm">
              <span>${termino.textoBadge}</span>
            </span>
          </div>
        </div>

        <!-- Semáforo y Barra de Progreso de 15 Días Hábiles -->
        <div class="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
          <div class="flex flex-wrap items-center justify-between text-xs font-bold text-slate-700 gap-2">
            <span class="flex items-center gap-1.5">
              <i data-lucide="clock" class="w-4 h-4 text-slate-500"></i>
              <span>Término de Ley 1755 de 2015 (15 Días Hábiles):</span>
            </span>
            <span class="${termino.estadoTermino === 'VENCIDO' ? 'text-red-700 font-black' : 'text-slate-900'}">${termino.mensajeAccion}</span>
          </div>

          <div class="w-full bg-slate-200 rounded-full h-3 overflow-hidden shadow-inner">
            <div class="${termino.colorBarra} h-3 rounded-full transition-all duration-700" style="width: ${termino.porcentaje}%"></div>
          </div>

          <div class="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-0.5">
            <span>📅 <strong>Fecha Envío:</strong> ${termino.fechaInicioStr} (${caso.canalRadicacion || 'Correo PQRS'})</span>
            <span>⏳ <strong>Vencimiento Improrrogable:</strong> <strong class="${termino.estadoTermino === 'VENCIDO' ? 'text-red-700 font-black underline' : 'text-slate-800'}">${termino.fechaVencimientoStr}</strong></span>
          </div>
        </div>

        <!-- Trazabilidad Ciudadana (Línea de Tiempo de 4 Pasos) -->
        <div class="py-2">
          <p class="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Trazabilidad de Veeduría Comunitaria</p>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <div class="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2">
              <div class="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px] shrink-0">1</div>
              <div>
                <div class="font-bold text-slate-800 text-[11px]">Reporte Habitante</div>
                <div class="text-[10px] text-slate-500">${caso.fecha || 'Registrado'}</div>
              </div>
            </div>

            <div class="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2">
              <div class="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px] shrink-0">2</div>
              <div>
                <div class="font-bold text-slate-800 text-[11px]">Validación JAC</div>
                <div class="text-[10px] text-slate-500">Aprobado y Firmado</div>
              </div>
            </div>

            <div class="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2">
              <div class="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px] shrink-0">3</div>
              <div>
                <div class="font-bold text-slate-800 text-[11px]">Remitido a Entidad</div>
                <div class="text-[10px] text-slate-500">${termino.fechaInicioStr}</div>
              </div>
            </div>

            <div class="p-2.5 ${caso.radicadoEntidad ? 'bg-purple-50 border-purple-100' : 'bg-slate-50 border-slate-100'} rounded-xl border flex items-center gap-2">
              <div class="w-6 h-6 rounded-full ${caso.radicadoEntidad ? 'bg-purple-200 text-purple-900' : 'bg-slate-200 text-slate-600'} flex items-center justify-center font-bold text-[10px] shrink-0">4</div>
              <div>
                <div class="font-bold ${caso.radicadoEntidad ? 'text-purple-900' : 'text-slate-800'} text-[11px]">${caso.radicadoEntidad ? 'Radicado Oficial' : 'Pendiente Radicado'}</div>
                <div class="text-[10px] text-slate-500">${caso.radicadoEntidad ? caso.radicadoEntidad : 'En asignación'}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Problema y Ubicación -->
        <div class="flex flex-col sm:flex-row gap-4 items-start pt-1">
          ${caso.foto ? `
            <img src="${caso.foto}" alt="Evidencia" class="w-full sm:w-32 h-24 object-cover rounded-2xl border border-slate-200 shrink-0 shadow-sm">
          ` : ''}
          <div class="space-y-1.5 flex-grow">
            <h4 class="text-base font-black text-slate-900 leading-snug">${caso.titulo}</h4>
            <p class="text-xs text-slate-600 flex items-center gap-1 font-medium">
              <i data-lucide="map-pin" class="w-3.5 h-3.5 text-red-500 shrink-0"></i>
              <span>${caso.ubicacion} (${caso.sector || 'Panamá II'})</span>
            </p>
            <p class="text-xs text-slate-600 line-clamp-2 leading-relaxed">${caso.descripcion}</p>

            ${caso.soporteRadicadoEntidad ? `
              <div class="pt-1">
                <button type="button" onclick="abrirVisorComprobante('${caso.id}')" class="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-3 py-1.5 rounded-xl transition shadow-sm cursor-pointer">
                  <i data-lucide="paperclip" class="w-3.5 h-3.5"></i>
                  <span>Ver Comprobante de Radicado Otorgado</span>
                </button>
              </div>
            ` : ''}
          </div>
        </div>

        <!-- Acciones de la Tarjeta -->
        <div class="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
          <div class="flex flex-wrap items-center gap-2">
            <button 
              onclick="abrirModalInstagram('${caso.id}')" 
              class="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer"
            >
              <i data-lucide="instagram" class="w-4 h-4 text-amber-300"></i>
              <span>Generar Ficha Instagram</span>
            </button>

            <button 
              onclick="compartirRadicadoLegalWhatsApp('${caso.id}')" 
              class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer"
            >
              <i data-lucide="message-circle" class="w-4 h-4"></i>
              <span>Compartir en WhatsApp</span>
            </button>
          </div>

          <div class="flex items-center gap-2 ml-auto">
            ${termino.estadoTermino === 'VENCIDO' ? `
              <span class="text-xs font-black text-red-700 bg-red-100 border border-red-300 px-3 py-1.5 rounded-xl flex items-center gap-1 animate-pulse">
                <i data-lucide="scale" class="w-3.5 h-3.5"></i>
                <span>Sujeto a Acción de Tutela (Art. 86)</span>
              </span>
            ` : `
              <span class="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl flex items-center gap-1">
                <i data-lucide="clock" class="w-3.5 h-3.5"></i>
                <span>En seguimiento de plazos</span>
              </span>
            `}
          </div>
        </div>

      </div>
    `;
  }).join("");

  lucide.createIcons();
};

window.compartirRadicadoLegalWhatsApp = function(id) {
  const caso = reclamos.find(r => r.id === id);
  if (!caso) return;
  const termino = calcularTerminoLegal15Dias(caso.fechaRadicadoEntidad || caso.fechaEnvioJac || caso.fecha, caso.estado);

  const texto = `🚨 *SEGUIMIENTO DE RADICADO Y TÉRMINOS LEGALES (15 DÍAS HÁBILES)*\n` +
    `Junta de Acción Comunal Barrio Panamá II y III · Valledupar\n\n` +
    `📋 *Radicado JAC:* ${caso.id}\n` +
    `${caso.radicadoEntidad ? '🏢 *Radicado Entidad:* ' + caso.radicadoEntidad + '\n' : ''}` +
    `🏛️ *Entidad:* ${caso.entidadDestino || 'Alcaldía de Valledupar'}\n` +
    `📍 *Lugar:* ${caso.ubicacion}\n\n` +
    `⚠️ *Problema:* ${caso.titulo}\n\n` +
    `⏱️ *Estado del Término Legal (Ley 1755 de 2015):*\n` +
    `• Fecha Envío: ${termino.fechaInicioStr}\n` +
    `• Vencimiento Obligatorio: ${termino.fechaVencimientoStr}\n` +
    `• Estado: *${termino.textoBadge}* (${termino.mensajeAccion})\n\n` +
    `🔗 Consulta el caso y súmate a la veeduría comunitaria:\n` +
    `https://barriopanamatres-cpu.github.io/jac-barrio-panama/#radicadosLegales`;

  const url = `https://wa.me/?text=${encodeURIComponent(texto)}`;
  window.open(url, '_blank');
};

// ==========================================
// GENERADOR DE AFICHES PROFESIONALES (INSTAGRAM / WHATSAPP)
// Formatos 1:1 Feed y 9:16 Historia con renderizado Ultra HD
// ==========================================
let formatoAficheActual = '1:1';
let temaAficheActual = 'institucional';

function sugerirTagInstagram(categoria) {
  const cat = (categoria || "").toLowerCase();
  if (cat.includes("alumbrado") || cat.includes("luz")) return "@estivsasesp";
  if (cat.includes("agua") || cat.includes("alcantarillado") || cat.includes("acueducto")) return "@emdupar";
  if (cat.includes("aseo") || cat.includes("basura")) return "@interaseo";
  if (cat.includes("energia") || cat.includes("electr")) return "@afinia_grupoepm";
  if (cat.includes("seguridad") || cat.includes("parque") || cat.includes("via") || cat.includes("hueco")) return "@gobcesar · @personeriavalledupar";
  return "@personeriavalledupar";
}

window.cambiarFormatoAfiche = function(formato) {
  formatoAficheActual = formato;
  const render = document.getElementById("tarjetaInstagramRender");
  const btn11 = document.getElementById("btnFormato11");
  const btn916 = document.getElementById("btnFormato916");
  const storyCta = document.getElementById("igStoryCta");
  const fotoContenedor = document.getElementById("igFotoContenedor");

  if (!render) return;

  if (formato === '9:16') {
    render.classList.remove("aspect-square", "max-w-[460px]");
    render.classList.add("aspect-[9/16]", "max-w-[360px]");
    if (btn11) {
      btn11.classList.remove("bg-[#004884]", "text-white", "shadow");
      btn11.classList.add("text-slate-400");
    }
    if (btn916) {
      btn916.classList.remove("text-slate-400");
      btn916.classList.add("bg-[#004884]", "text-white", "shadow");
    }
    if (storyCta) storyCta.classList.remove("hidden");
    if (fotoContenedor) {
      fotoContenedor.classList.remove("min-h-[170px]");
      fotoContenedor.classList.add("min-h-[250px]");
    }
  } else {
    render.classList.remove("aspect-[9/16]", "max-w-[360px]");
    render.classList.add("aspect-square", "max-w-[460px]");
    if (btn916) {
      btn916.classList.remove("bg-[#004884]", "text-white", "shadow");
      btn916.classList.add("text-slate-400");
    }
    if (btn11) {
      btn11.classList.remove("text-slate-400");
      btn11.classList.add("bg-[#004884]", "text-white", "shadow");
    }
    if (storyCta) storyCta.classList.add("hidden");
    if (fotoContenedor) {
      fotoContenedor.classList.remove("min-h-[250px]");
      fotoContenedor.classList.add("min-h-[170px]");
    }
  }
  lucide.createIcons();
};

window.cambiarTemaAfiche = function(tema) {
  temaAficheActual = tema;
  const render = document.getElementById("tarjetaInstagramRender");
  const btnInst = document.getElementById("btnTemaInstitucional");
  const btnAlerta = document.getElementById("btnTemaAlerta");
  const btnDark = document.getElementById("btnTemaDark");
  if (!render) return;

  [btnInst, btnAlerta, btnDark].forEach(btn => {
    if (btn) {
      btn.className = "px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition flex items-center gap-1.5 cursor-pointer";
    }
  });

  if (tema === 'alerta') {
    render.style.background = "linear-gradient(145deg, #1C0508 0%, #380C12 55%, #100204 100%)";
    render.style.border = "3px solid #991B1B";
    if (btnAlerta) btnAlerta.className = "px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 bg-red-950/80 text-red-200 border border-red-500/50 cursor-pointer";
  } else if (tema === 'dark') {
    render.style.background = "linear-gradient(145deg, #070A0F 0%, #111827 55%, #030712 100%)";
    render.style.border = "3px solid #334155";
    if (btnDark) btnDark.className = "px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 bg-slate-800 text-emerald-300 border border-emerald-500/40 cursor-pointer";
  } else {
    // Institucional
    render.style.background = "linear-gradient(145deg, #021226 0%, #0A254A 55%, #010B18 100%)";
    render.style.border = "3px solid #1E4D8C";
    if (btnInst) btnInst.className = "px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 bg-blue-900/60 text-blue-200 border border-blue-500/40 cursor-pointer";
  }
};

window.abrirModalInstagram = function(id) {
  const caso = (typeof reclamos !== 'undefined' ? reclamos.find(r => r.id === id) : null) || 
               (typeof todosLosReclamos !== 'undefined' ? todosLosReclamos.find(r => r.id === id) : null);
  if (!caso) return;
  reclamoSeleccionado = caso;

  // Llenar campos del afiche
  const elRadicado = document.getElementById("igRadicado");
  if (elRadicado) elRadicado.textContent = caso.id;

  const elFecha = document.getElementById("igFecha");
  if (elFecha) elFecha.textContent = caso.fecha || new Date().toLocaleDateString('es-CO');

  const elCatBadge = document.getElementById("igCategoriaBadge");
  const elCatLegacy = document.getElementById("igCategoria");
  const entidadCorta = caso.entidadDestino || (caso.entidad_destino ? caso.entidad_destino.split(' ')[0] : 'ALCALDÍA');
  const catTexto = `${(caso.categoria || 'DENUNCIA').toUpperCase()} | ${entidadCorta.toUpperCase()}`;
  if (elCatBadge) elCatBadge.textContent = catTexto;
  if (elCatLegacy) elCatLegacy.textContent = caso.categoria || 'DENUNCIA';

  const elTitulo = document.getElementById("igTitulo");
  if (elTitulo) elTitulo.textContent = caso.titulo;

  const elDesc = document.getElementById("igDescripcion");
  if (elDesc) elDesc.textContent = caso.descripcion;

  const elUbicacion = document.getElementById("igUbicacion");
  if (elUbicacion) elUbicacion.textContent = `${caso.ubicacion} (${caso.sector || 'Panamá II'})`;

  const elFoto = document.getElementById("igFoto");
  if (elFoto) {
    elFoto.crossOrigin = "anonymous";
    elFoto.src = caso.foto || 'assets/image1.jpeg';
    elFoto.onerror = () => { elFoto.src = 'assets/image1.jpeg'; };
  }

  const termino = calcularTerminoLegal15Dias(caso.fechaRadicadoEntidad || caso.fecha_radicado_entidad || caso.fechaEnvioJac || caso.fecha, caso.estado);

  const elTiempo = document.getElementById("igTiempo");
  let tiempoTexto = "";
  if (termino.estadoTermino === 'VENCIDO') {
    tiempoTexto = `¡TÉRMINO VENCIDO (${termino.diasVencido} DÍAS)! · ${caso.tiempo ? caso.tiempo.toUpperCase() : 'COMUNIDAD'} EN ESPERA`;
  } else if (termino.estadoTermino === 'POR_VENCER') {
    tiempoTexto = `¡QUEDAN ${termino.diasRestantes} DÍAS! · ${caso.tiempo ? caso.tiempo.toUpperCase() : 'COMUNIDAD'} EN ESPERA`;
  } else {
    tiempoTexto = `${caso.tiempo ? caso.tiempo.toUpperCase() : '30 DÍAS'} SIN ATENCIÓN`;
  }
  if (elTiempo) elTiempo.textContent = tiempoTexto;

  const elEntidadTag = document.getElementById("igEntidadTag");
  const tagEntidad = sugerirTagInstagram(caso.categoria);
  if (elEntidadTag) elEntidadTag.textContent = `@alcaldiavpar · @ernestoorozcodurango · ${tagEntidad}`;

  // Poblar personalizador rápido
  const inputTitulo = document.getElementById("customIgTitulo");
  if (inputTitulo) inputTitulo.value = caso.titulo;

  const inputTiempo = document.getElementById("customIgTiempo");
  if (inputTiempo) inputTiempo.value = tiempoTexto;

  const inputEntidad = document.getElementById("customIgEntidad");
  if (inputEntidad) inputEntidad.value = `@alcaldiavpar · @ernestoorozcodurango · ${tagEntidad}`;

  const inputDesc = document.getElementById("customIgDesc");
  if (inputDesc) inputDesc.value = caso.descripcion;

  // Caption para copiar
  actualizarCaptionInstagram();

  // Reset a formato 1:1 e Institucional
  cambiarFormatoAfiche('1:1');
  cambiarTemaAfiche('institucional');

  const modal = document.getElementById("modalInstagram");
  if (modal) modal.classList.remove("hidden");
  lucide.createIcons();
};

window.actualizarTextoAficheEnVivo = function() {
  const customTitulo = document.getElementById("customIgTitulo")?.value;
  const customTiempo = document.getElementById("customIgTiempo")?.value;
  const customEntidad = document.getElementById("customIgEntidad")?.value;
  const customDesc = document.getElementById("customIgDesc")?.value;

  if (customTitulo) document.getElementById("igTitulo").textContent = customTitulo;
  if (customTiempo) document.getElementById("igTiempo").textContent = customTiempo;
  if (customEntidad) document.getElementById("igEntidadTag").textContent = customEntidad;
  if (customDesc) document.getElementById("igDescripcion").textContent = customDesc;

  actualizarCaptionInstagram();
};

function actualizarCaptionInstagram() {
  if (!reclamoSeleccionado) return;
  const caso = reclamoSeleccionado;
  const titulo = document.getElementById("igTitulo")?.textContent || caso.titulo;
  const desc = document.getElementById("igDescripcion")?.textContent || caso.descripcion;
  const tags = document.getElementById("igEntidadTag")?.textContent || "@alcaldiavpar @ernestoorozcodurango";
  const termino = calcularTerminoLegal15Dias(caso.fechaRadicadoEntidad || caso.fecha_radicado_entidad || caso.fechaEnvioJac || caso.fecha, caso.estado);

  const caption = `🚨 DENUNCIA CIUDADANA OFICIAL · BARRIO ${caso.sector ? caso.sector.toUpperCase() : 'PANAMÁ II Y III'} (VALLEDUPAR)
📋 Radicado Oficial JAC: ${caso.id}
${caso.radicadoEntidad || caso.radicado_entidad ? '🏢 Radicado Entidad: ' + (caso.radicadoEntidad || caso.radicado_entidad) + '\n' : ''}📍 Ubicación: ${caso.ubicacion} (${caso.sector || 'Panamá II'})
⏱️ Afectación en el barrio: ${caso.tiempo || 'Varios meses'} sin intervención.

⚠️ PROBLEMÁTICA:
${titulo}

${desc}

⚖️ CONTROL DE TÉRMINOS LEGALES (Ley 1755 de 2015):
• Radicado formalmente el: ${termino.fechaInicioStr}
• Plazo perentorio de ley: 15 días hábiles (Vence: ${termino.fechaVencimientoStr})
• Estado actual: ${termino.textoBadge} — ${termino.mensajeAccion}
${termino.estadoTermino === 'VENCIDO' ? '🚨 ¡La entidad se encuentra en omisión legal! Sujeto a Acción de Tutela (Art. 86 C.P.) ante los Juzgados de Valledupar.\n' : ''}
¿Quién debe responder?
${tags} · @personeriavalledupar

Vecino: ¡Comparte esta publicación en tus historias y estados de WhatsApp para que la administración cumpla con su deber! 📢

Portal de veeduría y seguimiento en vivo:
🌐 https://barriopanamatres-cpu.github.io/jac-barrio-panama/#radicadosLegales

#PanamaExigeSolucion #Valledupar #BarrioPanama #VeeduriaCiudadana #ErnestoOrozco #ValleduparEnAlerta #AlcaldiaValledupar`;

  const captionEl = document.getElementById("captionText");
  if (captionEl) captionEl.textContent = caption;
}

window.cerrarModalInstagram = function() {
  const modal = document.getElementById("modalInstagram");
  if (modal) modal.classList.add("hidden");
  reclamoSeleccionado = null;
};

window.descargarImagenInstagram = function() {
  const elemento = document.getElementById("tarjetaInstagramRender");
  if (!elemento) return;

  const btn = document.getElementById("btnDescargarImagen");
  const textoOriginal = btn ? btn.innerHTML : "";
  if (btn) btn.innerHTML = `<i data-lucide="loader" class="w-4 h-4 animate-spin"></i> <span>Generando PNG Ultra HD...</span>`;
  lucide.createIcons();

  html2canvas(elemento, {
    scale: 3,
    useCORS: true,
    allowTaint: true,
    backgroundColor: null,
    logging: false
  }).then(canvas => {
    const enlace = document.createElement("a");
    const rad = reclamoSeleccionado ? reclamoSeleccionado.id : 'PANAMA';
    const fmt = formatoAficheActual === '9:16' ? 'HISTORIA_9x16' : 'FEED_1x1';
    enlace.download = `AFICHE_OFICIAL_${rad}_${fmt}.png`;
    enlace.href = canvas.toDataURL("image/png");
    enlace.click();
    if (btn) btn.innerHTML = textoOriginal;
    lucide.createIcons();
  }).catch(err => {
    console.error(err);
    alert("Hubo un error al generar la imagen. Puedes tomar una captura de pantalla directa.");
    if (btn) btn.innerHTML = textoOriginal;
    lucide.createIcons();
  });
};

window.copiarImagenInstagramAlClipboard = function() {
  const elemento = document.getElementById("tarjetaInstagramRender");
  if (!elemento) return;

  const btnTexto = document.getElementById("btnCopiarImgTexto");
  const textoOriginal = btnTexto ? btnTexto.textContent : "Copiar Imagen";
  if (btnTexto) btnTexto.textContent = "Procesando...";

  html2canvas(elemento, {
    scale: 2.5,
    useCORS: true,
    allowTaint: true,
    backgroundColor: null,
    logging: false
  }).then(canvas => {
    canvas.toBlob(blob => {
      if (!blob) {
        alert("No se pudo generar el archivo de imagen para copiar.");
        if (btnTexto) btnTexto.textContent = textoOriginal;
        return;
      }
      try {
        navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]).then(() => {
          if (btnTexto) btnTexto.textContent = "✓ ¡Imagen Copiada!";
          setTimeout(() => { if (btnTexto) btnTexto.textContent = textoOriginal; }, 2500);
        }).catch(err => {
          console.warn("Clipboard API no soportó imagen directamente:", err);
          descargarImagenInstagram();
          if (btnTexto) btnTexto.textContent = textoOriginal;
        });
      } catch (err) {
        console.warn("Excepción al copiar imagen:", err);
        descargarImagenInstagram();
        if (btnTexto) btnTexto.textContent = textoOriginal;
      }
    }, 'image/png');
  }).catch(err => {
    console.error(err);
    if (btnTexto) btnTexto.textContent = textoOriginal;
  });
};

window.copiarCaptionInstagram = function() {
  const texto = document.getElementById("captionText")?.textContent || "";
  navigator.clipboard.writeText(texto).then(() => {
    const toast = document.getElementById("copiedToast");
    if (toast) {
      toast.classList.remove("hidden");
      setTimeout(() => toast.classList.add("hidden"), 3000);
    }
  });
};

window.compartirAficheWhatsApp = function() {
  if (!reclamoSeleccionado) return;
  const caso = reclamoSeleccionado;
  const titulo = document.getElementById("igTitulo")?.textContent || caso.titulo;
  const tiempo = document.getElementById("igTiempo")?.textContent || caso.tiempo;

  const texto = `🚨 *DENUNCIA COMUNITARIA - BARRIO PANAMÁ II Y III (VALLEDUPAR)*\n\n` +
    `📋 *Radicado Oficial:* ${caso.id}\n` +
    `📍 *Ubicación:* ${caso.ubicacion}\n` +
    `⏱️ *Tiempo sin atención:* ${tiempo}\n\n` +
    `⚠️ *Problema:* ${titulo}\n` +
    `${caso.descripcion}\n\n` +
    `⚖️ Exigimos cumplimiento del Art. 23 C.P. y Ley 1757 de 2015 a @alcaldiavpar y autoridades competentes.\n\n` +
    `🔗 Consulta el caso y súmate a la veeduría:\n` +
    `https://barriopanamatres-cpu.github.io/jac-barrio-panama/`;

  const url = `https://wa.me/?text=${encodeURIComponent(texto)}`;
  window.open(url, '_blank');
};

// Alternar estado y sincronizar con Supabase
window.cambiarEstado = async function(id) {
  const index = reclamos.findIndex(r => r.id === id);
  if (index === -1) return;

  const estados = ["Ignorado", "Enviado a Entidad", "Solucionado"];
  const estadoActual = (reclamos[index].estado === "En espera") ? "Enviado a Entidad" : reclamos[index].estado;
  const idx = estados.indexOf(estadoActual);
  const nuevoEstado = estados[(idx === -1 ? 0 : idx + 1) % estados.length];

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

// ==========================================
// MODALES DE SERVICIOS A LA COMUNIDAD (JAC)
// ==========================================
window.irAlMapaComunitario = function(e) {
  if (e) e.preventDefault();
  const btnMapa = document.getElementById("btnVistaMapa");
  const muro = document.getElementById("muro");
  if (btnMapa) btnMapa.click();
  if (muro) muro.scrollIntoView({ behavior: 'smooth' });
};

window.abrirModalRendicion = function() {
  const mTotal = document.getElementById("mRendicionTotal");
  const mIgn = document.getElementById("mRendicionIgnorados");
  const mEsp = document.getElementById("mRendicionEspera");
  const mRes = document.getElementById("mRendicionResueltos");

  const total = reclamos.length;
  const ignorados = reclamos.filter(r => r.estado === "Ignorado").length;
  const enEspera = reclamos.filter(r => r.estado === "Enviado a Entidad" || r.estado === "En espera" || r.estado === "Radicado en Entidad").length;
  const resueltos = reclamos.filter(r => r.estado === "Solucionado").length;

  if (mTotal) mTotal.textContent = total;
  if (mIgn) mIgn.textContent = ignorados;
  if (mEsp) mEsp.textContent = enEspera;
  if (mRes) mRes.textContent = resueltos;

  const modal = document.getElementById("modalRendicion");
  if (modal) modal.classList.remove("hidden");
  lucide.createIcons();
};

window.abrirModalPeticiones = function() {
  const modal = document.getElementById("modalPeticiones");
  if (modal) modal.classList.remove("hidden");
  lucide.createIcons();
};

window.abrirModalPoliticaDatos = function() {
  const modal = document.getElementById("modalPoliticaDatos");
  if (modal) modal.classList.remove("hidden");
  lucide.createIcons();
};

window.cerrarModalesComunidad = function() {
  const m1 = document.getElementById("modalRendicion");
  const m2 = document.getElementById("modalPeticiones");
  const m3 = document.getElementById("modalPoliticaDatos");
  if (m1) m1.classList.add("hidden");
  if (m2) m2.classList.add("hidden");
  if (m3) m3.classList.add("hidden");
};

// ==========================================
// CUENTA ENCARGADA JAC - MODERACIÓN Y PROCEDENCIA
// ==========================================
const CLAVE_JAC = "JACPanama2026";

window.togglePasswordLogin = function() {
  const input = document.getElementById("loginClave");
  const eye = document.getElementById("eyeIconLogin");
  if (!input) return;
  if (input.type === "password") {
    input.type = "text";
    if (eye) eye.setAttribute("data-lucide", "eye-off");
  } else {
    input.type = "password";
    if (eye) eye.setAttribute("data-lucide", "eye");
  }
  lucide.createIcons();
};

window.autoLlenarClaveJAC = function() {
  const input = document.getElementById("loginClave");
  if (input) {
    input.value = "JACPanama2026";
    input.focus();
  }
};

window.abrirModalLoginJAC = function() {
  window.location.href = "admin.html";
};

window.abrirModalRegistroVecino = function() {
  const modal = document.getElementById("modalRegistroVecino");
  if (modal) modal.classList.remove("hidden");
  lucide.createIcons();
};

window.cerrarModalesAuth = function() {
  const m3 = document.getElementById("modalRegistroVecino");
  const m4 = document.getElementById("modalConfirmacionRadicado");
  if (m3) m3.classList.add("hidden");
  if (m4) m4.classList.add("hidden");
};

window.cerrarSesionJAC = function() {
  localStorage.removeItem("jac_sesion_activa");
  actualizarBarraNavJAC();
  cerrarModalesAuth();
  alert("Sesión de la Directiva JAC finalizada.");
};

function actualizarBarraNavJAC() {
  const authTopNav = document.getElementById("authTopNav");
  if (!authTopNav) return;
  const sesion = localStorage.getItem("jac_sesion_activa") === "true";

  if (sesion) {
    authTopNav.innerHTML = `
      <span class="bg-yellow-400 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded shadow-sm">JAC ACTIVA</span>
      <a href="admin.html" class="hover:underline font-bold text-white flex items-center gap-1 cursor-pointer">
        <i data-lucide="layout-dashboard" class="w-3.5 h-3.5"></i>
        <span>Panel de Control</span>
      </a>
      <span class="text-white/40">|</span>
      <button onclick="cerrarSesionJAC()" class="hover:underline text-white/80 cursor-pointer">Salir</button>
      <button id="btnDarkMode" class="text-white hover:text-yellow-300 transition ml-1" title="Cambiar tema">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path></svg>
      </button>
    `;
  } else {
    authTopNav.innerHTML = `
      <a href="admin.html" class="hover:underline flex items-center gap-1 cursor-pointer">
        <i data-lucide="lock" class="w-3.5 h-3.5 opacity-80"></i>
        <span>Inicio de sesión</span>
      </a>
      <span class="text-white/40">|</span>
      <a href="javascript:void(0)" onclick="abrirModalRegistroVecino()" class="hover:underline flex items-center gap-1 cursor-pointer">
        <i data-lucide="user-plus" class="w-3.5 h-3.5 opacity-80"></i>
        <span>Registro de usuario</span>
      </a>
      <button id="btnDarkMode" class="text-white hover:text-yellow-300 transition ml-1" title="Cambiar tema">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path></svg>
      </button>
    `;
  }
  lucide.createIcons();
}
window.actualizarBarraNavJAC = actualizarBarraNavJAC;

window.abrirPanelModeracionJAC = async function() {
  const modalLogin = document.getElementById("modalLoginJAC");
  if (modalLogin) modalLogin.classList.add("hidden");

  const modalMod = document.getElementById("modalModeracionJAC");
  if (modalMod) modalMod.classList.remove("hidden");

  await recargarModeracion();
  lucide.createIcons();
};

window.recargarModeracion = async function() {
  const listaContenedor = document.getElementById("listaCasosModeracion");
  if (!listaContenedor) return;
  listaContenedor.innerHTML = `<div class="py-8 text-center text-xs text-slate-500"><i data-lucide="loader" class="w-5 h-5 animate-spin mx-auto mb-2 text-[#004884]"></i>Cargando reportes para evaluación...</div>`;
  lucide.createIcons();

  let todosLosCasos = [];
  if (supabaseClient) {
    try {
      const { data } = await supabaseClient.from('reclamos').select('*').order('created_at', { ascending: false });
      if (data) todosLosCasos = data;
    } catch (e) {
      console.warn("Error cargando moderación:", e);
    }
  }

  const pendientes = todosLosCasos.filter(c => c.estado === "En revisión");
  const validados = todosLosCasos.filter(c => c.estado && c.estado !== "En revisión" && c.estado !== "Archivado" && c.estado !== "Rechazado");
  const solucionados = todosLosCasos.filter(c => c.estado === "Solucionado");

  const elPend = document.getElementById("modCountPendientes");
  const elVal = document.getElementById("modCountValidados");
  const elSol = document.getElementById("modCountSolucionados");
  const elTot = document.getElementById("modCountTotal");

  if (elPend) elPend.textContent = pendientes.length;
  if (elVal) elVal.textContent = validados.length;
  if (elSol) elSol.textContent = solucionados.length;
  if (elTot) elTot.textContent = todosLosCasos.filter(c => c.estado !== "Archivado").length;

  if (pendientes.length === 0) {
    listaContenedor.innerHTML = `
      <div class="p-8 text-center bg-slate-50 rounded-xl border border-slate-200">
        <i data-lucide="check-circle" class="w-10 h-10 text-emerald-600 mx-auto mb-2"></i>
        <h5 class="font-bold text-slate-900 text-sm">¡Bandeja de Entrada al Día!</h5>
        <p class="text-xs text-slate-500 mt-1">No hay reportes pendientes de revisión en este momento.</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  listaContenedor.innerHTML = "";
  pendientes.forEach(caso => {
    const card = document.createElement("div");
    card.className = "p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row gap-4 items-start";
    card.innerHTML = `
      <img src="${caso.foto || 'https://images.unsplash.com/photo-1544717302-de2939b7ef71?auto=format&fit=crop&w=400&q=80'}" class="w-full sm:w-28 h-28 object-cover rounded-lg shrink-0 border border-slate-200" alt="Evidencia">
      <div class="flex-grow space-y-1 w-full">
        <div class="flex flex-wrap items-center justify-between gap-1">
          <span class="font-mono text-xs font-black text-[#004884]">${caso.id}</span>
          <span class="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">${caso.categoria} · ${caso.sector || 'Panamá II'}</span>
        </div>
        <h5 class="font-bold text-sm text-slate-900 leading-snug">${caso.titulo}</h5>
        <p class="text-xs text-slate-600 line-clamp-2">${caso.descripcion}</p>
        <div class="text-[11px] text-slate-500 flex flex-wrap items-center gap-3 pt-1">
          <span>📍 <strong>${caso.ubicacion}</strong></span>
          <span>👤 ${caso.solicitante || 'Vecino'}</span>
          <span>🕒 Tiempo: ${caso.tiempo}</span>
        </div>
        <div class="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200 mt-2">
          <button onclick="aprobarCasoJAC('${caso.id}')" class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-1.5 px-3 rounded-lg shadow-sm transition flex items-center gap-1 cursor-pointer">
            <i data-lucide="check" class="w-3.5 h-3.5"></i>
            <span>✓ Procede: Aprobar y Publicar</span>
          </button>
          <button onclick="abrirModalInstagram('${caso.id}')" class="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs py-1.5 px-3 rounded-lg shadow-sm transition flex items-center gap-1 cursor-pointer">
            <i data-lucide="instagram" class="w-3.5 h-3.5"></i>
            <span>Ficha Instagram</span>
          </button>
          <button onclick="rechazarCasoJAC('${caso.id}')" class="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-xs py-1.5 px-3 rounded-lg transition flex items-center gap-1 cursor-pointer">
            <i data-lucide="x" class="w-3.5 h-3.5"></i>
            <span>No Procede</span>
          </button>
        </div>
      </div>
    `;
    listaContenedor.appendChild(card);
  });
  lucide.createIcons();
};

window.aprobarCasoJAC = async function(id) {
  if (!confirm(`¿Confirmas que este reporte PROCEDE y debe remitirse a la entidad competente?`)) return;
  if (supabaseClient) {
    try {
      await supabaseClient.from('reclamos').update({ estado: 'Enviado a Entidad' }).eq('id', id);
    } catch (e) {
      console.warn("Aviso:", e);
    }
  }
  await cargarReclamos();
  renderizarMuro("todos");
  actualizarMarcadoresComunitarios();
  await recargarModeracion();
  alert(`✅ Reporte ${id} confirmado y actualizado a 'Enviado a Entidad'.`);
};

window.rechazarCasoJAC = async function(id) {
  const motivo = prompt("Motivo por el cual este reporte NO procede:\n(Ej: Ubicación fuera del barrio, foto ilegible, reporte duplicado):", "No corresponde al sector del Barrio Panamá");
  if (!motivo) return;

  if (supabaseClient) {
    try {
      await supabaseClient.from('reclamos').update({ estado: 'Rechazado' }).eq('id', id);
    } catch (e) {
      console.warn("Aviso:", e);
    }
  }
  await cargarReclamos();
  renderizarMuro("todos");
  actualizarMarcadoresComunitarios();
  await recargarModeracion();
  alert(`Reporte ${id} marcado como 'No procede'.`);
};

// Listeners de Formularios de Login JAC y Registro Comunal
document.addEventListener("DOMContentLoaded", () => {
  const formLogin = document.getElementById("formLoginJAC");
  if (formLogin) {
    formLogin.addEventListener("submit", (e) => {
      e.preventDefault();
      const clave = document.getElementById("loginClave").value.trim();
      const errorMsg = document.getElementById("loginErrorMsg");

      if (clave === CLAVE_JAC || clave === "2026") {
        if (errorMsg) errorMsg.classList.add("hidden");
        localStorage.setItem("jac_sesion_activa", "true");
        window.location.href = "admin.html";
      } else {
        if (errorMsg) errorMsg.classList.remove("hidden");
      }
    });
  }

  const formRegistro = document.getElementById("formRegistroVecino");
  if (formRegistro) {
    formRegistro.addEventListener("submit", async (e) => {
      e.preventDefault();
      const nombre = document.getElementById("regNombre").value.trim();
      const cedula = document.getElementById("regCedula").value.trim();
      const tel = document.getElementById("regTelefono").value.trim();
      const sector = document.getElementById("regSector").value;
      const dir = document.getElementById("regDireccion").value.trim();
      const condicion = document.getElementById("regCondicion") ? document.getElementById("regCondicion").value : 'Propietario';
      const esVeedor = document.getElementById("regVeedor") ? document.getElementById("regVeedor").checked : true;

      const msgExito = document.getElementById("regExitoMsg");
      if (msgExito) msgExito.classList.remove("hidden");

      if (supabaseClient) {
        try {
          await supabaseClient.from('censo_vecinos').insert([{
            nombre: nombre,
            cedula: cedula,
            telefono: tel,
            sector: sector,
            direccion: dir,
            condicion: condicion,
            es_veedor: esVeedor
          }]);
        } catch (errDb) {
          console.warn("Aviso al guardar en censo_vecinos de Supabase:", errDb);
        }
      }

      setTimeout(() => {
        alert(`¡Gracias ${nombre}!\nHas quedado registrado formalmente en el Censo Comunitario de la JAC Barrio Panamá II y III.\nSector: ${sector}\nDirección: ${dir}`);
        cerrarModalesAuth();
        formRegistro.reset();
        if (msgExito) msgExito.classList.add("hidden");
      }, 1000);
    });
  }
});



// ==============================================================================
// VISOR PROFESIONAL DE COMPROBANTES DE RADICACIÓN (PDF E IMÁGENES)
// ==============================================================================
let comprobanteBlobUrlActual = null;

function cerrarModalVisorComprobante() {
  const modal = document.getElementById("modalVisorComprobante");
  if (modal) modal.classList.add("hidden");
  if (comprobanteBlobUrlActual && comprobanteBlobUrlActual.startsWith("blob:")) {
    try { URL.revokeObjectURL(comprobanteBlobUrlActual); } catch (e) {}
    comprobanteBlobUrlActual = null;
  }
}

function dataUrlToBlob(dataUrl) {
  try {
    const parts = dataUrl.split(",");
    const mimeMatch = parts[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : "application/pdf";
    const binStr = atob(parts[1]);
    const len = binStr.length;
    const u8arr = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      u8arr[i] = binStr.charCodeAt(i);
    }
    return new Blob([u8arr], { type: mime });
  } catch (err) {
    console.error("Error al convertir dataUrl a Blob:", err);
    return null;
  }
}

function abrirVisorComprobante(casoId) {
  const caso = (typeof reclamos !== "undefined" ? reclamos.find(r => r.id === casoId) : null)
            || (typeof todosLosReclamos !== "undefined" ? todosLosReclamos.find(r => r.id === casoId) : null);
  
  if (!caso) {
    alert("No se encontró el reporte seleccionado.");
    return;
  }

  const soporteUrl = caso.soporteRadicadoEntidad || caso.soporte_radicado_entidad || "";
  if (!soporteUrl) {
    alert("Este radicado aún no cuenta con un archivo o constancia oficial adjunta.");
    return;
  }

  const elRadId = document.getElementById("visorComprobanteRadicadoId");
  const elTitulo = document.getElementById("visorComprobanteTitulo");
  const elEntidad = document.getElementById("visorComprobanteEntidad");
  const elNumero = document.getElementById("visorComprobanteNumero");
  const elFecha = document.getElementById("visorComprobanteFecha");
  const elCuerpo = document.getElementById("visorComprobanteCuerpo");
  const btnDescargar = document.getElementById("btnDescargarComprobante");

  const entidadNombre = caso.entidadDestino || caso.entidad_destino || "Alcaldía de Valledupar";
  const numRad = caso.radicadoEntidad || caso.radicado_entidad || caso.id;
  const fechaRad = caso.fechaRadicadoEntidad || caso.fecha_radicado_entidad || caso.fecha || "Reciente";

  if (elRadId) elRadId.textContent = caso.id;
  if (elTitulo) elTitulo.textContent = `Constancia: ${caso.titulo}`;
  if (elEntidad) elEntidad.textContent = entidadNombre;
  if (elNumero) elNumero.textContent = numRad;
  if (elFecha) elFecha.textContent = fechaRad;

  let urlVisualizacion = soporteUrl;
  let esPdf = false;
  let esImagen = false;
  let nombreArchivo = `Comprobante_${numRad.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;

  if (soporteUrl.startsWith("data:application/pdf") || soporteUrl.toLowerCase().includes(".pdf")) {
    esPdf = true;
  } else if (soporteUrl.startsWith("data:image/") || soporteUrl.match(/\.(jpg|jpeg|png|webp|gif)/i)) {
    esImagen = true;
    nombreArchivo = `Comprobante_${numRad.replace(/[^a-zA-Z0-9_-]/g, "_")}.jpg`;
  }

  if (soporteUrl.startsWith("data:")) {
    const blob = dataUrlToBlob(soporteUrl);
    if (blob) {
      if (comprobanteBlobUrlActual && comprobanteBlobUrlActual.startsWith("blob:")) {
        try { URL.revokeObjectURL(comprobanteBlobUrlActual); } catch (e) {}
      }
      comprobanteBlobUrlActual = URL.createObjectURL(blob);
      urlVisualizacion = comprobanteBlobUrlActual;
    }
  } else {
    comprobanteBlobUrlActual = soporteUrl;
  }

  if (btnDescargar) {
    btnDescargar.href = urlVisualizacion;
    btnDescargar.download = nombreArchivo;
  }

  if (esPdf) {
    elCuerpo.innerHTML = `
      <div class="w-full h-full flex flex-col gap-2">
        <iframe 
          id="visorPdfIframe" 
          src="${urlVisualizacion}#toolbar=1&navpanes=0" 
          class="w-full h-[65vh] sm:h-[70vh] rounded-xl border border-slate-300 shadow-inner bg-slate-100"
        ></iframe>
        <div class="text-center text-xs text-slate-500 py-1 flex flex-wrap items-center justify-center gap-3">
          <span>¿Tu navegador bloquea el visor de PDF?</span>
          <button type="button" onclick="abrirComprobanteEnNuevaPestana()" class="text-[#004884] font-bold underline hover:text-blue-800 cursor-pointer">
            Abrir en pestaña nueva ↗
          </button>
          <span>·</span>
          <a href="${urlVisualizacion}" download="${nombreArchivo}" class="text-purple-700 font-bold underline hover:text-purple-900">
            Descargar archivo PDF 📥
          </a>
        </div>
      </div>
    `;
  } else if (esImagen) {
    elCuerpo.innerHTML = `
      <div class="w-full h-full flex flex-col items-center justify-center p-2">
        <img 
          src="${urlVisualizacion}" 
          alt="Comprobante de radicado" 
          class="max-w-full max-h-[68vh] object-contain rounded-xl shadow-lg border border-slate-200 bg-white"
        />
        <div class="mt-2 text-center text-xs text-slate-500 flex flex-wrap items-center justify-center gap-3">
          <button type="button" onclick="abrirComprobanteEnNuevaPestana()" class="text-[#004884] font-bold underline hover:text-blue-800 cursor-pointer">
            Ver imagen en pantalla completa ↗
          </button>
          <span>·</span>
          <a href="${urlVisualizacion}" download="${nombreArchivo}" class="text-purple-700 font-bold underline hover:text-purple-900">
            Descargar imagen 📥
          </a>
        </div>
      </div>
    `;
  } else {
    elCuerpo.innerHTML = `
      <div class="text-center py-12 px-4">
        <div class="w-16 h-16 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto mb-3">
          <i data-lucide="file-text" class="w-8 h-8"></i>
        </div>
        <h4 class="text-base font-black text-slate-800 mb-1">Comprobante de Radicado Oficial</h4>
        <p class="text-xs text-slate-500 max-w-md mx-auto mb-4">
          La constancia de radicación está registrada en el sistema. Puedes descargarla o abrirla directamente en tu dispositivo.
        </p>
        <a 
          href="${urlVisualizacion}" 
          download="${nombreArchivo}" 
          class="inline-flex items-center gap-2 bg-[#004884] hover:bg-blue-800 text-white font-black text-xs px-5 py-2.5 rounded-xl shadow transition"
        >
          <i data-lucide="download" class="w-4 h-4"></i>
          <span>Descargar Constancia Oficial</span>
        </a>
      </div>
    `;
  }

  const modal = document.getElementById("modalVisorComprobante");
  if (modal) {
    modal.classList.remove("hidden");
    lucide.createIcons();
  }
}

function abrirComprobanteEnNuevaPestana() {
  if (comprobanteBlobUrlActual) {
    window.open(comprobanteBlobUrlActual, "_blank");
  }
}

window.abrirVisorComprobante = abrirVisorComprobante;
window.cerrarModalVisorComprobante = cerrarModalVisorComprobante;
window.abrirComprobanteEnNuevaPestana = abrirComprobanteEnNuevaPestana;
