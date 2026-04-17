# Sistema de Reporte de Copias

Este proyecto es una aplicación web para gestionar y reportar copias realizadas por profesores.

## Características

- Registro de profesores
- Registro de tipos de copia con precios
- Registro de copias realizadas por día
- Reportes diarios, semanales y mensuales

## Tecnologías

- Next.js
- TypeScript
- Tailwind CSS
- Supabase

## Configuración

1. Instala las dependencias:
   ```
   npm install
   ```

2. Configura Supabase:
   - Crea un proyecto en [Supabase](https://supabase.com)
   - Crea las siguientes tablas:

   **teachers**
   ```sql
   CREATE TABLE teachers (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     name TEXT NOT NULL,
     created_at TIMESTAMP DEFAULT NOW()
   );
   ```

   **copy_types**
   ```sql
   CREATE TABLE copy_types (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     name TEXT NOT NULL,
     price DECIMAL NOT NULL,
     created_at TIMESTAMP DEFAULT NOW()
   );
   ```

   **copies**
   ```sql
   CREATE TABLE copies (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     teacher_id UUID REFERENCES teachers(id),
     copy_type_id UUID REFERENCES copy_types(id),
     date DATE NOT NULL,
     quantity INTEGER NOT NULL,
     created_at TIMESTAMP DEFAULT NOW()
   );
   ```

3. Actualiza `.env.local` con tus credenciales de Supabase:
   ```
   NEXT_PUBLIC_SUPABASE_URL=tu_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave
   ```

4. Ejecuta el servidor de desarrollo:
   ```
   npm run dev
   ```

## Uso

- Ve a `/teachers` para registrar profesores
- Ve a `/copy-types` para registrar tipos de copia
- Ve a `/copies` para registrar copias
- Ve a `/reports` para ver reportes