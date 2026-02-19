# Configuration Module - SQL Code Summary

## Quick SQL Setup

Copy and paste the following SQL code into your Supabase SQL Editor to set up the Configuration Module:

```sql
-- ============================================================================
-- CONFIGURATION MODULE SQL SCHEMA FOR DRIVEFLOW CAR RENTAL MANAGEMENT SYSTEM
-- ============================================================================
-- This SQL code creates the database schema for the Configuration module including:
-- - System Configuration (general, penalties, mileage, fuel settings)
-- - Admin Security Settings
-- ============================================================================

-- ============================================================================
-- TABLE 1: SYSTEM_CONFIG (Main Configuration)
-- ============================================================================
-- Stores all system-wide configuration settings
CREATE TABLE IF NOT EXISTS public.system_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- General Information
    store_name TEXT NOT NULL DEFAULT 'DriveFlow Management',
    slogan TEXT DEFAULT 'L''élégance au service de votre mobilité',
    address TEXT DEFAULT '12 Rue Didouche Mourad, Alger Centre',
    logo_url TEXT,
    -- Social Media
    facebook TEXT,
    instagram TEXT,
    whatsapp TEXT,
    -- Penalty Settings
    penalty_calc_type TEXT NOT NULL DEFAULT 'daily' CHECK (penalty_calc_type IN ('daily', 'hourly', 'daily_flat', 'percentage')),
    penalty_amount NUMERIC NOT NULL DEFAULT 1500,
    penalty_tolerance INTEGER NOT NULL DEFAULT 60,  -- in minutes
    -- Fuel Settings
    fuel_missing_price NUMERIC NOT NULL DEFAULT 500,
    -- Mileage Settings
    daily_mileage_limit INTEGER NOT NULL DEFAULT 250,  -- km
    mileage_tolerance INTEGER NOT NULL DEFAULT 20,  -- km
    excess_price NUMERIC NOT NULL DEFAULT 15,  -- per km
    unlimited_price NUMERIC NOT NULL DEFAULT 2000,  -- per day
    -- Status
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- TABLE 2: ADMIN_SECURITY (Admin Account Settings)
-- ============================================================================
-- Stores admin login credentials and security settings
CREATE TABLE IF NOT EXISTS public.admin_security (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT NOT NULL UNIQUE DEFAULT 'admin',
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT,  -- Should be hashed with bcrypt in production
    last_login TIMESTAMPTZ,
    login_attempts INTEGER DEFAULT 0,
    is_locked BOOLEAN DEFAULT false,
    locked_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- TABLE 3: CONFIG_AUDIT_LOG (Configuration Change History)
-- ============================================================================
-- Logs all configuration changes for audit purposes
CREATE TABLE IF NOT EXISTS public.config_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES public.admin_security(id) ON DELETE SET NULL,
    config_field TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_system_config_active ON public.system_config(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_security_username ON public.admin_security(username);
CREATE INDEX IF NOT EXISTS idx_admin_security_email ON public.admin_security(email);
CREATE INDEX IF NOT EXISTS idx_config_audit_log_created_at ON public.config_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_config_audit_log_admin_id ON public.config_audit_log(admin_id);

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC updated_at
-- ============================================================================
CREATE TRIGGER update_system_config_modtime BEFORE UPDATE ON public.system_config FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_security_modtime BEFORE UPDATE ON public.admin_security FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_security ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.config_audit_log ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================
-- Allow authenticated users to read all config
CREATE POLICY "Allow authenticated users to read system config" 
ON public.system_config FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to update system config
CREATE POLICY "Allow authenticated users to update system config" 
ON public.system_config FOR UPDATE TO authenticated USING (true);

-- Allow full access to authenticated users for admin security
CREATE POLICY "Allow authenticated users full access to admin security" 
ON public.admin_security FOR ALL TO authenticated USING (true);

-- Allow authenticated users to view audit logs
CREATE POLICY "Allow authenticated users to view config audit logs" 
ON public.config_audit_log FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to insert audit logs
CREATE POLICY "Allow authenticated users to insert config audit logs" 
ON public.config_audit_log FOR INSERT TO authenticated WITH CHECK (true);

-- ============================================================================
-- SAMPLE INSERT STATEMENTS (FOR TESTING)
-- ============================================================================

-- Insert default configuration
INSERT INTO public.system_config (
    store_name, 
    slogan, 
    address, 
    facebook, 
    instagram, 
    whatsapp,
    penalty_calc_type,
    penalty_amount,
    penalty_tolerance,
    fuel_missing_price,
    daily_mileage_limit,
    mileage_tolerance,
    excess_price,
    unlimited_price
) VALUES (
    'DriveFlow Management',
    'L''élégance au service de votre mobilité',
    '12 Rue Didouche Mourad, Alger Centre',
    'facebook.com/driveflow',
    'instagram.com/driveflow_dz',
    '+213 550 00 00 00',
    'daily',
    1500,
    60,
    500,
    250,
    20,
    15,
    2000
) ON CONFLICT DO NOTHING;

-- Insert admin security settings
INSERT INTO public.admin_security (
    username,
    email,
    password_hash
) VALUES (
    'admin',
    'contact@driveflow.dz',
    'admin123'  -- Replace with hashed password in production
) ON CONFLICT (username) DO NOTHING;

-- ============================================================================
-- FUNCTIONS FOR CONFIG MANAGEMENT
-- ============================================================================

-- Function to get current configuration
CREATE OR REPLACE FUNCTION get_current_config()
RETURNS TABLE (
    id UUID,
    store_name TEXT,
    slogan TEXT,
    address TEXT,
    logo_url TEXT,
    facebook TEXT,
    instagram TEXT,
    whatsapp TEXT,
    penalty_calc_type TEXT,
    penalty_amount NUMERIC,
    penalty_tolerance INTEGER,
    fuel_missing_price NUMERIC,
    daily_mileage_limit INTEGER,
    mileage_tolerance INTEGER,
    excess_price NUMERIC,
    unlimited_price NUMERIC,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sc.id,
        sc.store_name,
        sc.slogan,
        sc.address,
        sc.logo_url,
        sc.facebook,
        sc.instagram,
        sc.whatsapp,
        sc.penalty_calc_type,
        sc.penalty_amount,
        sc.penalty_tolerance,
        sc.fuel_missing_price,
        sc.daily_mileage_limit,
        sc.mileage_tolerance,
        sc.excess_price,
        sc.unlimited_price,
        sc.updated_at
    FROM public.system_config sc
    WHERE sc.is_active = true
    ORDER BY sc.updated_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;
```

## Installation Steps

1. **Open Supabase Console**
   - Go to your Supabase project dashboard
   - Navigate to the "SQL Editor" section

2. **Create New Query**
   - Click "New Query" or "+ New"

3. **Paste SQL Code**
   - Copy all the SQL code above
   - Paste it into the editor

4. **Run the Query**
   - Click "Run" button
   - Wait for success confirmation

5. **Verify Tables Created**
   - Go to "Table Editor"
   - Confirm you see:
     - `system_config`
     - `admin_security`
     - `config_audit_log`

## Default Configuration Values

After running the SQL, your system will have:

| Setting | Value |
|---------|-------|
| Store Name | DriveFlow Management |
| Slogan | L'élégance au service de votre mobilité |
| Address | 12 Rue Didouche Mourad, Alger Centre |
| Penalty Amount | 1500 DZ |
| Penalty Tolerance | 60 minutes |
| Fuel Missing Price | 500 DZ |
| Daily Mileage Limit | 250 km |
| Mileage Tolerance | 20 km |
| Excess Price | 15 DZ/km |
| Unlimited Price | 2000 DZ/day |

## Table Structure Quick Reference

### system_config
```
id (UUID) - Primary Key
store_name (TEXT)
slogan (TEXT)
address (TEXT)
logo_url (TEXT)
facebook (TEXT)
instagram (TEXT)
whatsapp (TEXT)
penalty_calc_type (TEXT)
penalty_amount (NUMERIC)
penalty_tolerance (INTEGER)
fuel_missing_price (NUMERIC)
daily_mileage_limit (INTEGER)
mileage_tolerance (INTEGER)
excess_price (NUMERIC)
unlimited_price (NUMERIC)
is_active (BOOLEAN)
created_at (TIMESTAMPTZ)
updated_at (TIMESTAMPTZ)
```

### admin_security
```
id (UUID) - Primary Key
username (TEXT) - Unique
email (TEXT) - Unique
password_hash (TEXT)
last_login (TIMESTAMPTZ)
login_attempts (INTEGER)
is_locked (BOOLEAN)
locked_until (TIMESTAMPTZ)
created_at (TIMESTAMPTZ)
updated_at (TIMESTAMPTZ)
```

### config_audit_log
```
id (UUID) - Primary Key
admin_id (UUID) - Foreign Key
config_field (TEXT)
old_value (TEXT)
new_value (TEXT)
action (TEXT)
created_at (TIMESTAMPTZ)
```

## Query Examples

### Get Current Configuration
```sql
SELECT * FROM get_current_config();
```

### Update Store Name
```sql
UPDATE public.system_config
SET store_name = 'New Store Name'
WHERE is_active = true;
```

### Get Admin User
```sql
SELECT username, email FROM public.admin_security
WHERE username = 'admin';
```

### View Configuration History
```sql
SELECT * FROM public.config_audit_log
ORDER BY created_at DESC
LIMIT 20;
```

## Notes

- All tables have automatic `updated_at` timestamp triggers
- Row Level Security is enabled for all tables
- Foreign key constraint on `config_audit_log.admin_id` with CASCADE delete
- Indexes created on frequently queried columns for performance
- Password should be hashed with bcrypt before storing in production

