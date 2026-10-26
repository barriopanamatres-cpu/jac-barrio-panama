-- ==============================================================================
-- BASE DE DATOS SUPABASE OFICIAL - JAC BARRIO PANAMÁ II Y III (VALLEDUPAR)
-- Proyecto: Veeduría Comunitaria y Auditoría Social (Ley 1757 de 2015)
-- ==============================================================================

-- 1. LIMPIAR DATOS DE PRUEBA PREVIOS (DEJAR EN CERO)
DELETE FROM public.reclamos;

-- 2. TABLA PRINCIPAL DE RECLAMOS Y REPORTES CIUDADANOS
CREATE TABLE IF NOT EXISTS public.reclamos (
    id TEXT PRIMARY KEY,                                      -- Código único: RAD-PANAMA-2026-XXXX
    titulo TEXT NOT NULL,                                     -- Título del daño reportado
    categoria TEXT NOT NULL,                                  -- Alumbrado, Vías, Emdupar, Parques, etc.
    ubicacion TEXT NOT NULL,                                  -- Manzana, Casa, Calle, Carrera
    sector TEXT DEFAULT 'Panamá II',                          -- Panamá II o Panamá III
    tiempo TEXT NOT NULL,                                     -- Ej: "3 semanas", "2 meses"
    dias_numero INTEGER DEFAULT 1,                            -- Días transcurridos sin solución
    descripcion TEXT NOT NULL,                                -- Descripción detallada de los hechos
    foto TEXT NOT NULL,                                       -- URL de la evidencia fotográfica
    estado TEXT DEFAULT 'En revisión',                        -- 'En revisión' (inicial), 'En espera', 'Solucionado', 'Rechazado', 'Archivado'
    afectados TEXT DEFAULT 'Comunidad Panamá',                 -- Número de familias o personas afectadas
    fecha TEXT NOT NULL,                                      -- Fecha de radicación
    solicitante TEXT DEFAULT 'Habitante Panamá',               -- Nombre del vecino o "Vecino Anónimo"
    lat DOUBLE PRECISION DEFAULT 10.4495,                     -- Coordenada GPS Latitud
    lng DOUBLE PRECISION DEFAULT -73.2325,                    -- Coordenada GPS Longitud
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar seguridad de nivel de fila (Row Level Security)
ALTER TABLE public.reclamos ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas previas para evitar duplicados
DROP POLICY IF EXISTS "Lectura pública de reclamos" ON public.reclamos;
DROP POLICY IF EXISTS "Inserción pública de reclamos" ON public.reclamos;
DROP POLICY IF EXISTS "Actualización de estado comunitaria" ON public.reclamos;
DROP POLICY IF EXISTS "Eliminación de reclamos" ON public.reclamos;

-- Políticas de acceso para la tabla reclamos
CREATE POLICY "Lectura pública de reclamos" 
ON public.reclamos FOR SELECT 
USING (true);

CREATE POLICY "Inserción pública de reclamos" 
ON public.reclamos FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Actualización de estado comunitaria" 
ON public.reclamos FOR UPDATE 
USING (true);

CREATE POLICY "Eliminación de reclamos" 
ON public.reclamos FOR DELETE 
USING (true);


-- 3. TABLA DE CENSO COMUNITARIO Y RED DE VEEDORES (REGISTRO DE USUARIOS)
CREATE TABLE IF NOT EXISTS public.censo_vecinos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre TEXT NOT NULL,
    cedula TEXT NOT NULL UNIQUE,
    telefono TEXT NOT NULL,
    sector TEXT NOT NULL,                                     -- Panamá II o Panamá III
    direccion TEXT NOT NULL,                                  -- Manzana y Casa
    condicion TEXT DEFAULT 'Propietario',                     -- Propietario / Arrendatario / Familiar
    es_veedor BOOLEAN DEFAULT true,                           -- Pertenece a la red de veeduría
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.censo_vecinos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir registro de vecinos" ON public.censo_vecinos;
DROP POLICY IF EXISTS "Lectura de censo para JAC" ON public.censo_vecinos;

CREATE POLICY "Permitir registro de vecinos" 
ON public.censo_vecinos FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Lectura de censo para JAC" 
ON public.censo_vecinos FOR SELECT 
USING (true);


-- 4. BUCKET DE ALMACENAMIENTO DE EVIDENCIAS FOTOGRÁFICAS (SUPABASE STORAGE)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('evidencias', 'evidencias', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Políticas para Supabase Storage
DROP POLICY IF EXISTS "Fotos públicas lectura libre" ON storage.objects;
DROP POLICY IF EXISTS "Permitir subir fotos de denuncias" ON storage.objects;
DROP POLICY IF EXISTS "Permitir actualizar fotos" ON storage.objects;

CREATE POLICY "Fotos públicas lectura libre" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'evidencias');

CREATE POLICY "Permitir subir fotos de denuncias" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'evidencias');

CREATE POLICY "Permitir actualizar fotos" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'evidencias');


-- 5. CREAR Y CONFIRMAR USUARIO ADMINISTRADOR EN SUPABASE AUTH
-- Puedes cambiar el correo y contraseña aquí abajo según tu preferencia
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  new_user_id uuid := gen_random_uuid();
  admin_email text := 'jacbarriopanama@gmail.com';     -- Correo del administrador
  admin_pass text := 'JACPanama2026*';                 -- Contraseña del administrador
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = admin_email) THEN
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      role,
      aud,
      confirmation_token
    ) VALUES (
      new_user_id,
      '00000000-0000-0000-0000-000000000000',
      admin_email,
      crypt(admin_pass, gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"role":"admin_jac"}',
      now(),
      now(),
      'authenticated',
      'authenticated',
      ''
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      new_user_id,
      format('{"sub":"%s","email":"%s"}', new_user_id, admin_email)::jsonb,
      'email',
      new_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    -- Si el usuario ya existe, actualizar contraseña y confirmar correo automáticamente
    UPDATE auth.users 
    SET encrypted_password = crypt(admin_pass, gen_salt('bf')),
        email_confirmed_at = now()
    WHERE email = admin_email;
  END IF;
END $$;
