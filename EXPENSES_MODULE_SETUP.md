# Expenses & Maintenance Module - Setup Complete

## What's Been Added

### 1. Database Tables (SQL_EXPENSES_SCHEMA.sql)

Two new tables have been created in your Supabase project:

#### **expenses** table
```sql
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
```

**Fields:**
- `id`: Unique identifier (auto-generated)
- `name`: Name/description of the expense
- `cost`: Amount spent
- `date`: Date of the expense
- `description`: Optional additional notes
- `is_active`: For soft-deletes (not currently used)
- `created_at`: Timestamp when created
- `updated_at`: Timestamp when last updated

#### **maintenance** table
```sql
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
```

**Fields:**
- `id`: Unique identifier (auto-generated)
- `vehicle_id`: Reference to the vehicle
- `type`: Type of maintenance ('vidange', 'assurance', 'ct', 'other')
- `name`: Name of the maintenance
- `cost`: Cost of maintenance
- `date`: Date performed
- `expiry_date`: When maintenance expires (e.g., insurance expiry)
- `note`: Additional notes
- `is_active`: For soft-deletes (not currently used)
- `created_at`: Timestamp when created
- `updated_at`: Timestamp when last updated

### 2. Updated Frontend Components

#### **ExpensesPage.tsx**
- Fully connected to Supabase
- Two tabs: Store Expenses and Vehicle Maintenance
- Features:
  - View all expenses/maintenance records
  - Add new records
  - Edit existing records
  - Delete records
  - Bilingual support (French/Arabic)
  - Beautiful card-based UI

#### **App.tsx**
- Added `fetchExpenses()` and `fetchMaintenances()` functions
- Added state management for expenses and maintenances
- Integrated ExpensesPage into the router
- Added 'expenses' route

## How to Use

### Via SQL (Supabase Console)
1. Go to your Supabase project
2. Open the SQL Editor
3. Copy the entire content of `SQL_EXPENSES_SCHEMA.sql`
4. Run the SQL to create the tables

### Sample Data (Optional)
The schema file includes sample insert statements. To add test data, run:
```sql
-- Sample store expenses
INSERT INTO public.expenses (name, cost, date, description) VALUES
    ('Fournitures Bureau', 5000, '2025-01-15', 'Achat de fournitures'),
    ('Loyer Magasin', 50000, '2025-01-01', 'Loyer mensuel du magasin'),
    ('Électricité', 8000, '2025-01-10', 'Facture d''électricité');

-- Sample maintenance records
INSERT INTO public.maintenance (vehicle_id, type, name, cost, date, expiry_date, note) VALUES
    ((SELECT id FROM public.vehicles LIMIT 1), 'vidange', 'Vidange complète', 3500, '2025-01-20', '2025-07-20', 'Entretien régulier'),
    ((SELECT id FROM public.vehicles LIMIT 1), 'assurance', 'Assurance automobile', 45000, '2025-01-01', '2026-01-01', 'Assurance annuelle'),
    ((SELECT id FROM public.vehicles LIMIT 1), 'ct', 'Contrôle Technique', 2500, '2024-12-15', '2025-12-15', 'Contrôle technique valide');
```

## Features

### Expenses Tab (Store Expenses)
- Add store-wide expenses
- Edit existing expenses
- Delete expenses
- View all store expenses

### Maintenance Tab (Vehicle Maintenance)
- Track vehicle maintenance records
- Manage insurance records
- Track technical control dates
- Store custom maintenance types
- Set expiry dates for insurance/control
- Add maintenance notes
- Filter by vehicle

### UI Features
- Beautiful gradient design matching your app style
- Bilingual support (French/Arabic)
- Responsive grid layout
- Emoji indicators for different maintenance types
  - 🛢️ Vidange (Oil Change)
  - 🛡️ Assurance (Insurance)
  - 🛠️ Control/Other
  - 💰 Store Expenses
- Hover effects and smooth transitions
- Modal forms for adding/editing
- Confirmation dialogs for deletions

## Database Relationships

The maintenance records are linked to your existing vehicles table:
```
maintenance.vehicle_id → vehicles.id
```

This means when a vehicle is deleted, all its maintenance records are automatically deleted (CASCADE).

## Navigation

The Expenses page is accessible via:
- Sidebar menu (expenses link)
- URL: `/expenses` (when integrated with router)

## API Endpoints (Supabase REST)

All operations use Supabase REST API:
- **GET** `/expenses` - Fetch all expenses
- **POST** `/expenses` - Create new expense
- **PATCH** `/expenses?id=...` - Update expense
- **DELETE** `/expenses?id=...` - Delete expense
- **GET** `/maintenance` - Fetch all maintenance records
- **POST** `/maintenance` - Create new maintenance record
- **PATCH** `/maintenance?id=...` - Update maintenance record
- **DELETE** `/maintenance?id=...` - Delete maintenance record

## Notes

1. **Password Hashing**: The current password storage for workers uses plain text (for demo purposes). In production, implement bcrypt or similar.

2. **Row Level Security**: Both tables have RLS enabled with a policy allowing authenticated users full access. Adjust based on your security requirements.

3. **Triggers**: Both tables have `update_updated_at_column` triggers configured to automatically update the `updated_at` timestamp.

4. **Indexes**: Indexes are created on frequently queried columns (`date`, `type`, `is_active`) for better performance.

5. **Currency**: All costs are stored as NUMERIC for precision with financial data. The UI displays them in DZ (Algerian Dinar).

## Troubleshooting

**Issue**: Data not showing up
- Make sure you've run the SQL to create the tables
- Check that RLS policies are set correctly
- Verify Supabase connection in your app

**Issue**: Edit/Delete not working
- Check browser console for errors
- Verify the ID is being passed correctly
- Ensure Row Level Security allows your user to perform the operation

**Issue**: Maintenance records not loading
- Make sure you have vehicles in your database
- Check that foreign key references are valid

