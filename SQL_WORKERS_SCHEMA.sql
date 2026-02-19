-- ============================================================================
-- WORKERS MODULE SQL SCHEMA FOR DRIVEFLOW CAR RENTAL MANAGEMENT SYSTEM
-- ============================================================================
-- This SQL code creates the database schema for the Workers/Équipe module including:
-- - Workers (team members with roles and salary)
-- - Worker Transactions (payments, advances, absences)
-- ============================================================================

-- ============================================================================
-- TABLE 1: WORKERS
-- ============================================================================
-- Stores worker/team member information
CREATE TABLE IF NOT EXISTS public.workers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name TEXT NOT NULL,
    birthday DATE NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT,
    id_card_number TEXT NOT NULL,
    photo TEXT,
    role TEXT NOT NULL CHECK (role IN ('admin', 'worker', 'driver')),
    payment_type TEXT NOT NULL CHECK (payment_type IN ('day', 'month')),
    amount NUMERIC NOT NULL,  -- Salary per day or month
    username TEXT UNIQUE NOT NULL,
    password TEXT,  -- Should be hashed in production
    absences INTEGER DEFAULT 0,  -- Count of absence days
    total_paid NUMERIC DEFAULT 0,  -- Total amount paid so far
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- TABLE 2: WORKER TRANSACTIONS
-- ============================================================================
-- Stores payment history, advances, and absences for workers
CREATE TABLE IF NOT EXISTS public.worker_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id UUID NOT NULL REFERENCES public.workers(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('payment', 'advance', 'absence')),
    amount NUMERIC NOT NULL,
    date DATE NOT NULL,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_worker_transactions_worker_id ON public.worker_transactions(worker_id);
CREATE INDEX IF NOT EXISTS idx_worker_transactions_date ON public.worker_transactions(date);
CREATE INDEX IF NOT EXISTS idx_workers_role ON public.workers(role);
CREATE INDEX IF NOT EXISTS idx_workers_is_active ON public.workers(is_active);

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC updated_at
-- ============================================================================
CREATE TRIGGER update_workers_modtime BEFORE UPDATE ON public.workers FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_worker_transactions_modtime BEFORE UPDATE ON public.worker_transactions FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_transactions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================
CREATE POLICY "Allow full access for authenticated users to workers" 
ON public.workers FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow full access for authenticated users to worker_transactions" 
ON public.worker_transactions FOR ALL TO authenticated USING (true);

-- ============================================================================
-- SAMPLE INSERT STATEMENTS (FOR TESTING)
-- ============================================================================

-- Sample worker: Admin
INSERT INTO public.workers (
    full_name, birthday, phone, email, address, id_card_number, role, 
    payment_type, amount, username, is_active, absences, total_paid
) VALUES (
    'Ahmed Khaled', '1985-05-15', '+213 555 123456', 'ahmed@driveflow.com', 
    '123 Rue Principal, Alger', '123456789', 'admin', 'month', 50000, 
    'ahmed_admin', true, 0, 150000
) ON CONFLICT (username) DO NOTHING;

-- Sample worker: Driver
INSERT INTO public.workers (
    full_name, birthday, phone, email, address, id_card_number, role, 
    payment_type, amount, username, is_active, absences, total_paid
) VALUES (
    'Fatima Saïdi', '1990-12-20', '+213 555 234567', 'fatima@driveflow.com', 
    '456 Avenue Liberté, Alger', '987654321', 'driver', 'day', 3500, 
    'fatima_driver', true, 2, 105000
) ON CONFLICT (username) DO NOTHING;

-- Sample worker: Staff
INSERT INTO public.workers (
    full_name, birthday, phone, email, address, id_card_number, role, 
    payment_type, amount, username, is_active, absences, total_paid
) VALUES (
    'Mohamed Boukhari', '1992-08-10', '+213 555 345678', 'mohamed@driveflow.com', 
    '789 Boulevard Paix, Alger', '456789123', 'worker', 'month', 35000, 
    'mohamed_worker', true, 1, 105000
) ON CONFLICT (username) DO NOTHING;

-- ============================================================================
-- SAMPLE TRANSACTIONS
-- ============================================================================

-- Payment transaction for Ahmed (Admin)
INSERT INTO public.worker_transactions (
    worker_id, type, amount, date, note
) SELECT id, 'payment', 50000, NOW()::DATE, 'Salaire mensuel - Février 2026'
FROM public.workers WHERE username = 'ahmed_admin' LIMIT 1;

-- Advance transaction for Fatima (Driver)
INSERT INTO public.worker_transactions (
    worker_id, type, amount, date, note
) SELECT id, 'advance', 5000, NOW()::DATE, 'Avance demandée'
FROM public.workers WHERE username = 'fatima_driver' LIMIT 1;

-- Absence transaction for Mohamed (Staff)
INSERT INTO public.worker_transactions (
    worker_id, type, amount, date, note
) SELECT id, 'absence', 3500, (NOW()::DATE - INTERVAL '5 days')::DATE, 'Absence - Jour'
FROM public.workers WHERE username = 'mohamed_worker' LIMIT 1;

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View to get total deductions per worker (advances + absences)
CREATE OR REPLACE VIEW public.worker_deductions AS
SELECT 
    w.id,
    w.full_name,
    SUM(CASE WHEN wt.type IN ('advance', 'absence') THEN wt.amount ELSE 0 END) as total_deductions,
    SUM(CASE WHEN wt.type = 'payment' THEN wt.amount ELSE 0 END) as total_paid,
    COUNT(CASE WHEN wt.type = 'absence' THEN 1 END) as absence_count
FROM public.workers w
LEFT JOIN public.worker_transactions wt ON w.id = wt.worker_id
WHERE w.is_active = true
GROUP BY w.id, w.full_name;

-- ============================================================================
-- REFRESH SCHEMA CACHE
-- ============================================================================
NOTIFY pgrst, 'reload schema';
