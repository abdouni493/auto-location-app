-- ============================================================================
-- OPERATIONS MODULE SQL SCHEMA FOR DRIVEFLOW CAR RENTAL MANAGEMENT SYSTEM
-- ============================================================================
-- This SQL code creates the database schema for the Operations module including:
-- - Inspections (vehicle condition checks)
-- - Damages (vehicle damage reporting)
-- - Templates (document templates for printing)
-- ============================================================================

-- ============================================================================
-- CREATE TRIGGER FUNCTION (if not exists)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TABLE 1: INSPECTIONS
-- ============================================================================
-- Stores vehicle inspection records (check-in and check-out)
CREATE TABLE IF NOT EXISTS public.inspections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reservation_id UUID REFERENCES public.reservations(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('depart', 'retour')),  -- Check-in or Check-out
    date DATE NOT NULL,                                        -- Inspection date
    mileage INTEGER NOT NULL,                                  -- Odometer reading
    fuel TEXT NOT NULL,                                        -- Fuel level (plein, 1/2, 1/4, 1/8, vide)
    
    -- Checklists stored as JSONB for flexibility
    security JSONB DEFAULT '{"lights": false, "tires": false, "brakes": false, "wipers": false, "mirrors": false, "belts": false, "horn": false}'::jsonb,
    equipment JSONB DEFAULT '{"spareWheel": false, "jack": false, "triangles": false, "firstAid": false, "docs": false}'::jsonb,
    comfort JSONB DEFAULT '{"ac": false}'::jsonb,
    cleanliness JSONB DEFAULT '{"interior": false, "exterior": false}'::jsonb,
    
    -- Photos
    exterior_photos TEXT[] DEFAULT '{}',                       -- Array of photo URLs
    interior_photos TEXT[] DEFAULT '{}',                       -- Array of photo URLs
    
    -- Signature and notes
    signature TEXT,                                            -- Base64 encoded signature
    notes TEXT,                                                -- General observations
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- TABLE 2: DAMAGES
-- ============================================================================
-- Stores vehicle damage reports linked to inspections
CREATE TABLE IF NOT EXISTS public.damages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reservation_id UUID REFERENCES public.reservations(id) ON DELETE CASCADE,
    inspection_id UUID REFERENCES public.inspections(id) ON DELETE CASCADE,
    
    location TEXT NOT NULL,                                    -- Part of vehicle damaged (e.g., "left door", "windshield")
    severity TEXT NOT NULL CHECK (severity IN ('mineur', 'moyen', 'majeur')),
    description TEXT NOT NULL,                                 -- Detailed description
    photo_url TEXT,                                            -- Photo of damage
    
    estimated_cost NUMERIC DEFAULT 0,                          -- Repair cost estimate
    status TEXT DEFAULT 'signale' CHECK (
        status IN ('signale', 'reparation', 'repare')
    ),                                                         -- Status tracking
    
    notes TEXT,                                                -- Additional notes
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- TABLE 3: TEMPLATES
-- ============================================================================
-- Stores document templates for invoices, contracts, quotes, etc.
CREATE TABLE IF NOT EXISTS public.templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,                                        -- Template name (e.g., "Invoice Default")
    category TEXT NOT NULL CHECK (
        category IN ('invoice', 'contract', 'devis', 'checkin', 'checkout')
    ),                                                         -- Document type
    
    -- Canvas dimensions
    canvas_width INTEGER DEFAULT 800,                          -- Template width in pixels
    canvas_height INTEGER DEFAULT 600,                         -- Template height in pixels
    
    -- Elements array containing all text, images, shapes, etc.
    -- Each element has: id, type, x, y, width, height, content, 
    -- fontSize, color, fontFamily, fontWeight, etc.
    elements JSONB DEFAULT '[]'::jsonb,
    
    is_default BOOLEAN DEFAULT false,                          -- Mark as default template
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC updated_at
-- ============================================================================

CREATE TRIGGER update_inspections_modtime BEFORE UPDATE ON public.inspections FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_damages_modtime BEFORE UPDATE ON public.damages FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_templates_modtime BEFORE UPDATE ON public.templates FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.damages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Inspections policies
DROP POLICY IF EXISTS "Allow full access for authenticated users to inspections" ON public.inspections;
CREATE POLICY "Allow full access for authenticated users to inspections" 
ON public.inspections FOR ALL TO authenticated USING (true);

-- Damages policies
DROP POLICY IF EXISTS "Allow full access for authenticated users to damages" ON public.damages;
CREATE POLICY "Allow full access for authenticated users to damages" 
ON public.damages FOR ALL TO authenticated USING (true);

-- Templates policies
DROP POLICY IF EXISTS "Allow full access for authenticated users to templates" ON public.templates;
CREATE POLICY "Allow full access for authenticated users to templates" 
ON public.templates FOR ALL TO authenticated USING (true);

-- ============================================================================
-- SAMPLE INSERT STATEMENTS (FOR TESTING)
-- ============================================================================

-- Note: Sample inspection requires a valid reservation_id from your reservations table
-- Uncomment and replace the UUID with a valid reservation ID when ready:
-- INSERT INTO public.inspections (
--     reservation_id, type, date, mileage, fuel, notes
-- ) VALUES (
--     'VALID-UUID-HERE', 
--     'depart', 
--     NOW()::DATE, 
--     45000, 
--     'plein', 
--     'Vehicle in excellent condition'
-- );

-- Sample template insert
INSERT INTO public.templates (
    name, category, canvas_width, canvas_height, is_default,
    elements
) VALUES (
    'Default Invoice', 
    'invoice', 
    800, 
    600, 
    true,
    '[
        {
            "id": "logo",
            "type": "logo",
            "x": 50,
            "y": 30,
            "width": 150,
            "height": 50,
            "content": "DRIVEFLOW LOGO",
            "fontSize": 14,
            "color": "#000000",
            "fontFamily": "Arial",
            "fontWeight": "bold"
        },
        {
            "id": "title",
            "type": "text",
            "x": 350,
            "y": 40,
            "width": 400,
            "height": 40,
            "content": "FACTURE",
            "fontSize": 24,
            "color": "#0066cc",
            "fontFamily": "Arial",
            "fontWeight": "bold",
            "textAlign": "center"
        },
        {
            "id": "client_name_label",
            "type": "text",
            "x": 50,
            "y": 120,
            "width": 200,
            "height": 20,
            "content": "Client: {{client_name}}",
            "fontSize": 12,
            "color": "#333333",
            "fontFamily": "Arial"
        },
        {
            "id": "client_phone_label",
            "type": "text",
            "x": 50,
            "y": 145,
            "width": 200,
            "height": 20,
            "content": "Téléphone: {{client_phone}}",
            "fontSize": 12,
            "color": "#333333",
            "fontFamily": "Arial"
        },
        {
            "id": "vehicle_label",
            "type": "text",
            "x": 400,
            "y": 120,
            "width": 350,
            "height": 20,
            "content": "Véhicule: {{vehicle_name}} - {{vehicle_plate}}",
            "fontSize": 12,
            "color": "#333333",
            "fontFamily": "Arial"
        },
        {
            "id": "total_amount",
            "type": "text",
            "x": 300,
            "y": 450,
            "width": 400,
            "height": 40,
            "content": "TOTAL: {{total_amount}} DZ",
            "fontSize": 20,
            "color": "#0066cc",
            "fontFamily": "Arial",
            "fontWeight": "bold",
            "textAlign": "right"
        },
        {
            "id": "signature_label",
            "type": "text",
            "x": 50,
            "y": 520,
            "width": 200,
            "height": 20,
            "content": "Signature du client:",
            "fontSize": 11,
            "color": "#666666",
            "fontFamily": "Arial"
        },
        {
            "id": "showroom_info",
            "type": "text",
            "x": 50,
            "y": 550,
            "width": 700,
            "height": 30,
            "content": "DriveFlow - Agence Principale | Tél: +213 XXX XXX XXX | Email: info@driveflow.com",
            "fontSize": 10,
            "color": "#999999",
            "fontFamily": "Arial",
            "textAlign": "center"
        }
    ]'::jsonb
) ON CONFLICT DO NOTHING;

-- ============================================================================
-- REFRESH SCHEMA CACHE
-- ============================================================================
NOTIFY pgrst, 'reload schema';
