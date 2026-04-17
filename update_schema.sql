-- Script para actualizar la tabla copies y agregar campos de pago
-- Ejecutar este script en tu base de datos Supabase para habilitar el sistema de pagos

-- Agregar campos de pago a la tabla copies
ALTER TABLE copies 
ADD COLUMN IF NOT EXISTS paid BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS paid_date TIMESTAMP;

-- Opcional: Crear un índice para mejorar el rendimiento de las consultas de pago
CREATE INDEX IF NOT EXISTS idx_copies_paid ON copies(paid);

-- Opcional: Crear un índice compuesto para consultas más eficientes
CREATE INDEX IF NOT EXISTS idx_copies_teacher_paid ON copies(teacher_id, paid);
