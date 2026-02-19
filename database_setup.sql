
-- 1. SETUP EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. CREATE ROLES ENUM
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'worker', 'driver');
    END IF;
END $$;

-- 3. HELPER FUNCTION FOR UPDATED_AT
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 4. CREATE PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL, 
    role user_role DEFAULT 'worker' NOT NULL,
    full_name TEXT,
    phone TEXT,
    photo_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. CREATE VEHICLES TABLE
CREATE TABLE IF NOT EXISTS public.vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    year INTEGER NOT NULL,
    immatriculation TEXT UNIQUE NOT NULL,
    color TEXT,
    chassis_number TEXT,
    fuel_type TEXT NOT NULL,
    transmission TEXT NOT NULL,
    seats INTEGER DEFAULT 5,
    doors INTEGER DEFAULT 5,
    daily_rate NUMERIC NOT NULL,
    weekly_rate NUMERIC,
    monthly_rate NUMERIC,
    deposit NUMERIC,
    status TEXT DEFAULT 'disponible',
    current_location TEXT,
    mileage INTEGER DEFAULT 0,
    insurance_expiry DATE,
    tech_control_date DATE,
    insurance_info TEXT,
    main_image TEXT,
    secondary_images TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. CREATE AGENCIES TABLE
CREATE TABLE IF NOT EXISTS public.agencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. CREATE CUSTOMERS TABLE
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    id_card_number TEXT,
    wilaya TEXT,
    address TEXT,
    license_number TEXT,
    license_expiry DATE,
    profile_picture TEXT,
    document_images TEXT[] DEFAULT '{}',
    document_left_at_store TEXT DEFAULT 'Aucun',
    total_reservations INTEGER DEFAULT 0,
    total_spent NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 8. CREATE RESERVATIONS TABLE
CREATE TABLE IF NOT EXISTS public.reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reservation_number TEXT UNIQUE NOT NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'confermer',
    total_amount NUMERIC DEFAULT 0,
    paid_amount NUMERIC DEFAULT 0,
    pickup_agency_id UUID REFERENCES public.agencies(id) ON DELETE SET NULL,
    return_agency_id UUID REFERENCES public.agencies(id) ON DELETE SET NULL,
    driver_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    caution_amount NUMERIC DEFAULT 0,
    discount NUMERIC DEFAULT 0,
    with_tva BOOLEAN DEFAULT false,
    options JSONB DEFAULT '[]'::jsonb,
    activation_log JSONB,
    termination_log JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ENSURE COLUMNS EXIST (IN CASE TABLES WERE CREATED MANUALLY OR WITHOUT UPDATED_AT)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.agencies ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 9. APPLY UPDATED_AT TRIGGERS
DROP TRIGGER IF EXISTS update_profiles_modtime ON public.profiles;
CREATE TRIGGER update_profiles_modtime BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_vehicles_modtime ON public.vehicles;
CREATE TRIGGER update_vehicles_modtime BEFORE UPDATE ON public.vehicles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_agencies_modtime ON public.agencies;
CREATE TRIGGER update_agencies_modtime BEFORE UPDATE ON public.agencies FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_customers_modtime ON public.customers;
CREATE TRIGGER update_customers_modtime BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_reservations_modtime ON public.reservations;
CREATE TRIGGER update_reservations_modtime BEFORE UPDATE ON public.reservations FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 10. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- 11. POLICIES
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Allow full access for authenticated users to vehicles" ON public.vehicles;
CREATE POLICY "Allow full access for authenticated users to vehicles" ON public.vehicles FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow full access for authenticated users to agencies" ON public.agencies;
CREATE POLICY "Allow full access for authenticated users to agencies" ON public.agencies FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow full access for authenticated users to customers" ON public.customers;
CREATE POLICY "Allow full access for authenticated users to customers" ON public.customers FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow full access for authenticated users to reservations" ON public.reservations;
CREATE POLICY "Allow full access for authenticated users to reservations" ON public.reservations FOR ALL TO authenticated USING (true);

-- 12. TRIGGER FOR AUTO-CREATING PROFILES
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email, role)
  VALUES (
    new.id, 
    split_part(new.email, '@', 1), 
    new.email, 
    CASE 
      WHEN new.email = 'admin@admin.com' THEN 'admin'::user_role 
      ELSE 'worker'::user_role 
    END
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 13. CREATE INSPECTIONS TABLE
CREATE TABLE IF NOT EXISTS public.inspections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reservation_id UUID REFERENCES public.reservations(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('depart', 'retour')),
    date DATE NOT NULL,
    mileage INTEGER NOT NULL,
    fuel TEXT NOT NULL,
    security JSONB DEFAULT '{"lights": false, "tires": false, "brakes": false, "wipers": false, "mirrors": false, "belts": false, "horn": false}'::jsonb,
    equipment JSONB DEFAULT '{"spareWheel": false, "jack": false, "triangles": false, "firstAid": false, "docs": false}'::jsonb,
    comfort JSONB DEFAULT '{"ac": false}'::jsonb,
    cleanliness JSONB DEFAULT '{"interior": false, "exterior": false}'::jsonb,
    exterior_photos TEXT[] DEFAULT '{}',
    interior_photos TEXT[] DEFAULT '{}',
    signature TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 14. CREATE DAMAGES TABLE
CREATE TABLE IF NOT EXISTS public.damages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reservation_id UUID REFERENCES public.reservations(id) ON DELETE CASCADE,
    inspection_id UUID REFERENCES public.inspections(id) ON DELETE CASCADE,
    location TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('mineur', 'moyen', 'majeur')),
    description TEXT NOT NULL,
    photo_url TEXT,
    estimated_cost NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'signale' CHECK (status IN ('signale', 'reparation', 'repare')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 15. CREATE TEMPLATES TABLE
CREATE TABLE IF NOT EXISTS public.templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('invoice', 'contract', 'devis', 'checkin', 'checkout')),
    canvas_width INTEGER DEFAULT 800,
    canvas_height INTEGER DEFAULT 600,
    elements JSONB DEFAULT '[]'::jsonb,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 16. CREATE TRIGGERS FOR NEW TABLES
DROP TRIGGER IF EXISTS update_inspections_modtime ON public.inspections;
CREATE TRIGGER update_inspections_modtime BEFORE UPDATE ON public.inspections FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_damages_modtime ON public.damages;
CREATE TRIGGER update_damages_modtime BEFORE UPDATE ON public.damages FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_templates_modtime ON public.templates;
CREATE TRIGGER update_templates_modtime BEFORE UPDATE ON public.templates FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 17. ENABLE RLS FOR NEW TABLES
ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.damages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

-- 18. RLS POLICIES FOR NEW TABLES
DROP POLICY IF EXISTS "Allow full access for authenticated users to inspections" ON public.inspections;
CREATE POLICY "Allow full access for authenticated users to inspections" ON public.inspections FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow full access for authenticated users to damages" ON public.damages;
CREATE POLICY "Allow full access for authenticated users to damages" ON public.damages FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow full access for authenticated users to templates" ON public.templates;
CREATE POLICY "Allow full access for authenticated users to templates" ON public.templates FOR ALL TO authenticated USING (true);

-- 19. REFRESH CACHE
NOTIFY pgrst, 'reload schema';
