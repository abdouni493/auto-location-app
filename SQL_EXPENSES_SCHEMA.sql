-- ============================================================================
-- EXPENSES & MAINTENANCE MODULE SQL SCHEMA FOR DRIVEFLOW CAR RENTAL MANAGEMENT SYSTEM
-- ============================================================================
-- This SQL code creates the database schema for the Expenses & Maintenance module including:
-- - Store Expenses (general business expenses)
-- - Vehicle Maintenance (maintenance records, insurance, technical control, etc.)
-- ============================================================================

-- ============================================================================
-- TABLE 1: EXPENSES (Store/General Expenses)
-- ============================================================================
-- Stores store/general business expenses
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    cost NUMERIC NOT NULL,
    date DATE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- TABLE 2: MAINTENANCE (Vehicle Maintenance Records)
-- ============================================================================
-- Stores vehicle maintenance records, insurance, technical control, etc.
CREATE TABLE IF NOT EXISTS public.maintenance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('vidange', 'assurance', 'ct', 'other')),
    name TEXT NOT NULL,
    cost NUMERIC NOT NULL,
    date DATE NOT NULL,
    expiry_date DATE,
    note TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_is_active ON public.expenses(is_active);
CREATE INDEX IF NOT EXISTS idx_maintenance_vehicle_id ON public.maintenance(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_date ON public.maintenance(date);
CREATE INDEX IF NOT EXISTS idx_maintenance_type ON public.maintenance(type);
CREATE INDEX IF NOT EXISTS idx_maintenance_is_active ON public.maintenance(is_active);

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC updated_at
-- ============================================================================
CREATE TRIGGER update_expenses_modtime BEFORE UPDATE ON public.expenses FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_maintenance_modtime BEFORE UPDATE ON public.maintenance FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================
CREATE POLICY "Allow full access for authenticated users to expenses" 
ON public.expenses FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow full access for authenticated users to maintenance" 
ON public.maintenance FOR ALL TO authenticated USING (true);

-- ============================================================================
-- SAMPLE INSERT STATEMENTS (FOR TESTING)
-- ============================================================================

-- Sample store expenses
INSERT INTO public.expenses (name, cost, date, description) VALUES
    ('Fournitures Bureau', 5000, '2025-01-15', 'Achat de fournitures'),
    ('Loyer Magasin', 50000, '2025-01-01', 'Loyer mensuel du magasin'),
    ('Électricité', 8000, '2025-01-10', 'Facture d''électricité')
ON CONFLICT DO NOTHING;

-- Sample maintenance records (adjust vehicle_id based on your actual vehicle IDs)
-- You may need to get actual vehicle IDs from your vehicles table
INSERT INTO public.maintenance (vehicle_id, type, name, cost, date, expiry_date, note) VALUES
    ((SELECT id FROM public.vehicles LIMIT 1), 'vidange', 'Vidange complète', 3500, '2025-01-20', '2025-07-20', 'Entretien régulier'),
    ((SELECT id FROM public.vehicles LIMIT 1), 'assurance', 'Assurance automobile', 45000, '2025-01-01', '2026-01-01', 'Assurance annuelle'),
    ((SELECT id FROM public.vehicles LIMIT 1), 'ct', 'Contrôle Technique', 2500, '2024-12-15', '2025-12-15', 'Contrôle technique valide')
ON CONFLICT DO NOTHING;
