-- Script para crear tablas de cuentas personales
-- Ejecutar este script en tu base de datos Supabase

-- Tabla de cuentas personales
CREATE TABLE personal_accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de útiles de cuentas personales
CREATE TABLE personal_supplies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    personal_account_id UUID NOT NULL REFERENCES personal_accounts(id) ON DELETE CASCADE,
    product_name VARCHAR(200) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    quantity INTEGER DEFAULT 1,
    supply_date DATE NOT NULL,
    paid BOOLEAN DEFAULT FALSE,
    paid_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejor rendimiento
CREATE INDEX idx_personal_accounts_teacher_id ON personal_accounts(teacher_id);
CREATE INDEX idx_personal_supplies_account_id ON personal_supplies(personal_account_id);
CREATE INDEX idx_personal_supplies_paid ON personal_supplies(paid);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_personal_accounts_updated_at BEFORE UPDATE ON personal_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_personal_supplies_updated_at BEFORE UPDATE ON personal_supplies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
