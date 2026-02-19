# Workers/Équipe Module - SQL Schema Documentation

## Overview
This document describes the SQL schema for the Workers (Équipe) module in DriveFlow. The system manages team members, their roles, salaries, and transaction history (payments, advances, absences).

## Database Tables

### 1. Workers Table
**Table Name:** `public.workers`

Stores information about team members.

#### Columns:
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique worker identifier |
| full_name | TEXT | NOT NULL | Full name of the worker |
| birthday | DATE | NOT NULL | Date of birth |
| phone | TEXT | NOT NULL | Contact phone number |
| email | TEXT | NULLABLE | Email address |
| address | TEXT | NULLABLE | Home address |
| id_card_number | TEXT | NOT NULL | National ID card number |
| photo | TEXT | NULLABLE | Photo URL (profile picture) |
| role | TEXT | NOT NULL, CHECK (admin/worker/driver) | Worker role/position |
| payment_type | TEXT | NOT NULL, CHECK (day/month) | Salary payment frequency |
| amount | NUMERIC | NOT NULL | Salary per day or month |
| username | TEXT | UNIQUE NOT NULL | Login username |
| password | TEXT | NULLABLE | Hashed password (use bcrypt in production) |
| absences | INTEGER | DEFAULT 0 | Number of absence days |
| total_paid | NUMERIC | DEFAULT 0 | Total amount paid to date |
| is_active | BOOLEAN | DEFAULT true | Active/inactive status |
| created_at | TIMESTAMPTZ | DEFAULT now() | Record creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT now() | Record update timestamp |

#### Indexes:
- `idx_workers_role` - For filtering by role
- `idx_workers_is_active` - For finding active workers

---

### 2. Worker Transactions Table
**Table Name:** `public.worker_transactions`

Records all financial transactions for workers (payments, advances, absences).

#### Columns:
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Transaction ID |
| worker_id | UUID | NOT NULL, FK → workers(id) ON DELETE CASCADE | Associated worker |
| type | TEXT | NOT NULL, CHECK (payment/advance/absence) | Transaction type |
| amount | NUMERIC | NOT NULL | Transaction amount |
| date | DATE | NOT NULL | Transaction date |
| note | TEXT | NULLABLE | Additional notes/memo |
| created_at | TIMESTAMPTZ | DEFAULT now() | Creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT now() | Update timestamp |

#### Indexes:
- `idx_worker_transactions_worker_id` - For finding transactions by worker
- `idx_worker_transactions_date` - For filtering by date range

---

## Views

### Worker Deductions View
**View Name:** `public.worker_deductions`

Provides summary information about worker deductions and payments.

**Columns:**
- `id` - Worker ID
- `full_name` - Worker name
- `total_deductions` - Sum of advances + absences
- `total_paid` - Sum of all payments
- `absence_count` - Number of absence records

**Example Query:**
```sql
SELECT * FROM public.worker_deductions WHERE id = 'worker-uuid';
```

---

## Triggers

### Automatic Updated Timestamp
- `update_workers_modtime` - Automatically sets `updated_at` when worker record is modified
- `update_worker_transactions_modtime` - Automatically sets `updated_at` when transaction is modified

---

## Row Level Security (RLS)

Both tables have RLS enabled with policies allowing authenticated users full access:
- `Allow full access for authenticated users to workers`
- `Allow full access for authenticated users to worker_transactions`

---

## Sample Data

### Example Worker (Admin):
```sql
INSERT INTO public.workers (
    full_name, birthday, phone, email, address, id_card_number, role, 
    payment_type, amount, username, is_active, absences, total_paid
) VALUES (
    'Ahmed Khaled', '1985-05-15', '+213 555 123456', 'ahmed@driveflow.com', 
    '123 Rue Principal, Alger', '123456789', 'admin', 'month', 50000, 
    'ahmed_admin', true, 0, 150000
);
```

### Example Transaction (Payment):
```sql
INSERT INTO public.worker_transactions (
    worker_id, type, amount, date, note
) VALUES (
    'worker-uuid', 'payment', 50000, NOW()::DATE, 'Salaire mensuel - Février 2026'
);
```

---

## API Integration

### Fetch All Active Workers
```sql
SELECT * FROM public.workers WHERE is_active = true ORDER BY created_at DESC;
```

### Fetch Worker with Transactions
```sql
SELECT 
    w.*,
    json_agg(
        json_build_object(
            'id', wt.id,
            'type', wt.type,
            'amount', wt.amount,
            'date', wt.date,
            'note', wt.note
        ) ORDER BY wt.date DESC
    ) as history
FROM public.workers w
LEFT JOIN public.worker_transactions wt ON w.id = wt.worker_id
WHERE w.id = 'worker-uuid'
GROUP BY w.id;
```

### Add Worker Transaction
```sql
INSERT INTO public.worker_transactions (worker_id, type, amount, date, note)
VALUES ('worker-uuid', 'payment', 50000, NOW()::DATE, 'Monthly salary');
```

### Calculate Worker Balance
```sql
SELECT 
    w.full_name,
    w.amount as salary,
    w.payment_type,
    COALESCE(SUM(CASE WHEN wt.type = 'payment' THEN wt.amount ELSE 0 END), 0) as total_paid,
    COALESCE(SUM(CASE WHEN wt.type IN ('advance', 'absence') THEN wt.amount ELSE 0 END), 0) as total_deductions,
    w.total_paid - COALESCE(SUM(CASE WHEN wt.type IN ('advance', 'absence') THEN wt.amount ELSE 0 END), 0) as balance
FROM public.workers w
LEFT JOIN public.worker_transactions wt ON w.id = wt.worker_id
WHERE w.id = 'worker-uuid'
GROUP BY w.id, w.full_name, w.amount, w.payment_type, w.total_paid;
```

---

## Transaction Types

1. **Payment** - Regular salary payment
2. **Advance** - Early salary advance given to worker
3. **Absence** - Deduction for missed workdays

---

## Best Practices

1. **Password Security**: Always hash passwords using bcrypt before inserting
2. **Salary Calculation**: Use the views to calculate final payments
3. **Audit Trail**: All transactions are recorded with timestamps
4. **Soft Deletes**: Use `is_active = false` to deactivate workers instead of hard deletes
5. **Transaction History**: Keep complete history for accounting purposes

---

## Setup Instructions

1. Run the SQL file in your Supabase SQL Editor:
   ```
   Execute: SQL_WORKERS_SCHEMA.sql
   ```

2. Verify tables are created:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' AND table_name IN ('workers', 'worker_transactions');
   ```

3. Check sample data was inserted:
   ```sql
   SELECT * FROM public.workers;
   SELECT * FROM public.worker_transactions;
   ```

4. The App.tsx will automatically connect and fetch workers on app initialization

---

## Frontend Integration

The WorkersPage component automatically connects to:
- Fetches workers on app load via `fetchWorkers()`
- Creates new workers via `handleAddWorker()`
- Updates workers via `handleUpdateWorker()`
- Soft deletes workers via `handleDeleteWorker()` (sets `is_active = false`)
- Adds transactions via `handleAddTransaction()`

All data is automatically refreshed after operations.
