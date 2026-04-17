-- Crear tabla de profesores
CREATE TABLE teachers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Crear tabla de tipos de copia
CREATE TABLE copy_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Crear tabla de copias
CREATE TABLE copies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID REFERENCES teachers(id),
  copy_type_id UUID REFERENCES copy_types(id),
  date DATE NOT NULL,
  quantity INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);