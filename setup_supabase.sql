-- ==============================================================================
-- BASE DE DATOS SUPABASE - VEEDURÍA JAC BARRIO PANAMÁ II Y III (VALLEDUPAR)
-- ==============================================================================

-- 1. CREAR TABLA DE RECLAMOS COMUNITARIOS
CREATE TABLE IF NOT EXISTS public.reclamos (
    id TEXT PRIMARY KEY,
    titulo TEXT NOT NULL,
    categoria TEXT NOT NULL,
    ubicacion TEXT NOT NULL,
    sector TEXT DEFAULT 'Panamá II',
    tiempo TEXT NOT NULL,
    dias_numero INTEGER DEFAULT 1,
    descripcion TEXT NOT NULL,
    foto TEXT NOT NULL,
    estado TEXT DEFAULT 'Ignorado',
    afectados TEXT DEFAULT 'Comunidad Panamá',
    fecha TEXT NOT NULL,
    solicitante TEXT DEFAULT 'Habitante Panamá',
    lat DOUBLE PRECISION DEFAULT 10.4468,
    lng DOUBLE PRECISION DEFAULT -73.2402,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar seguridad de nivel de fila (Row Level Security)
ALTER TABLE public.reclamos ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso para que los vecinos puedan ver, registrar y actualizar reclamos
CREATE POLICY "Lectura pública de reclamos" 
ON public.reclamos FOR SELECT 
USING (true);

CREATE POLICY "Inserción pública de reclamos" 
ON public.reclamos FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Actualización de estado comunitaria" 
ON public.reclamos FOR UPDATE 
USING (true);

-- 2. INSERTAR CASOS EMBLEMÁTICOS INICIALES (Poste de luz en Mz 14, alcantarilla, vía)
INSERT INTO public.reclamos (id, titulo, categoria, ubicacion, sector, tiempo, dias_numero, descripcion, foto, estado, afectados, fecha, solicitante, lat, lng)
VALUES 
(
  'RAD-PANAMA-2026-0001',
  'Poste de alumbrado público a punto de colapsar sobre viviendas',
  'Alumbrado Público',
  'Manzana 14 Casa 8 (Callejón peatonal)',
  'Panamá II',
  '38 días',
  38,
  'El poste de concreto presenta fractura severa en la base y se encuentra inclinado, sostenido únicamente por el cableado de energía. Se radicó petición formal a ESTIV y a la Alcaldía pero fuimos totalmente ignorados. Niños juegan a diario en la zona y el riesgo de electrocución o colapso es crítico.',
  'https://images.unsplash.com/photo-1544717302-de2939b7ef71?auto=format&fit=crop&w=800&q=80',
  'Ignorado',
  '45 familias',
  '18 de Septiembre, 2026',
  'JAC Panamá II / Comité de Veeduría',
  10.4496,
  -73.2348
),
(
  'RAD-PANAMA-2026-0002',
  'Alcantarilla rebosada de aguas servidas frente a la cancha sintética',
  'Emdupar',
  'Carrera 6B frente a la Cancha Sintética',
  'Panamá III',
  '22 días',
  22,
  'Aguas negras corriendo por la calle, olores nauseabundos e invasión de mosquitos. Emdupar no ha enviado el carro vactor a pesar de los constantes llamados de la comunidad.',
  'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80',
  'En espera',
  '120 familias',
  '03 de Octubre, 2026',
  'Comunidad Vecinal Mz 9 y 10',
  10.4480,
  -73.2305
),
(
  'RAD-PANAMA-2026-0003',
  'Cráter peligroso en la vía de acceso Calle 44 con Carrera 6',
  'Malla Vial',
  'Entrada principal Calle 44 con Carrera 6',
  'Panamá II',
  '60 días',
  60,
  'Hueco profundo que abarca media calzada y ha provocado caídas de motociclistas y daños en vehículos. La Secretaría de Obras Públicas de Valledupar no ha intervenido.',
  'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
  'Ignorado',
  'Todo el sector',
  '25 de Agosto, 2026',
  'Gremio de Transportadores y Vecinos',
  10.4505,
  -73.2330
)
ON CONFLICT (id) DO NOTHING;

-- 3. CREAR BUCKET DE ALMACENAMIENTO PARA SUBIR FOTOS (1GB GRATIS DE SUPABASE STORAGE)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('evidencias', 'evidencias', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de Storage para ver y subir fotos libremente
CREATE POLICY "Fotos públicas lectura libre" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'evidencias');

CREATE POLICY "Permitir subir fotos de denuncias" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'evidencias');
