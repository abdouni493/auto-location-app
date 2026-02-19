# Operations Module - DriveFlow Car Rental Management System

## Overview

The Operations module manages vehicle inspections, damage reporting, and document templates for the DriveFlow car rental system. It provides a complete interface for vehicle condition tracking and document generation.

## Module Components

### 1. **Inspections Interface** (`OperationsPage.tsx`)

#### Features:
- **3-Step Inspection Form:**
  - **Step 1:** Search and select reservation, choose inspection type (check-in/check-out), enter mileage and fuel level
  - **Step 2:** Complete security, equipment, comfort, and cleanliness checklists
  - **Step 3:** Capture signature, upload exterior and interior photos

- **Inspection Management:**
  - Create new inspections
  - View inspection history with vehicle and client details
  - Delete inspections
  - Print inspection reports

#### State Management:
```typescript
[activeTab, setActiveTab]           // 'inspection' | 'dommages'
[isCreatingInsp, setIsCreatingInsp] // Form visibility
[stepInsp, setStepInsp]             // Step 1-3 navigation
[searchResQuery, setSearchResQuery] // Reservation search
[inspFormData, setInspFormData]     // Form data
[viewingInsp, setViewingInsp]       // Selected inspection detail
```

### 2. **Database Schema**

#### Inspections Table
```sql
CREATE TABLE public.inspections (
    id UUID PRIMARY KEY,
    reservation_id UUID (FK),
    type TEXT ('depart' | 'retour'),
    date DATE,
    mileage INTEGER,
    fuel TEXT,
    security JSONB,          -- {lights, tires, brakes, wipers, mirrors, belts, horn}
    equipment JSONB,         -- {spareWheel, jack, triangles, firstAid, docs}
    comfort JSONB,           -- {ac}
    cleanliness JSONB,       -- {interior, exterior}
    exterior_photos TEXT[],
    interior_photos TEXT[],
    signature TEXT,          -- Base64
    notes TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);
```

#### Damages Table
```sql
CREATE TABLE public.damages (
    id UUID PRIMARY KEY,
    reservation_id UUID (FK),
    inspection_id UUID (FK),
    location TEXT,
    severity TEXT ('mineur' | 'moyen' | 'majeur'),
    description TEXT,
    photo_url TEXT,
    estimated_cost NUMERIC,
    status TEXT ('signale' | 'reparation' | 'repare'),
    notes TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);
```

#### Templates Table
```sql
CREATE TABLE public.templates (
    id UUID PRIMARY KEY,
    name TEXT,
    category TEXT ('invoice' | 'contract' | 'devis' | 'checkin' | 'checkout'),
    canvas_width INTEGER,
    canvas_height INTEGER,
    elements JSONB,          -- Array of design elements
    is_default BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);
```

### 3. **Document Templates**

Templates use a canvas-based system with elements containing:
- **Type:** text, logo, qr_code, divider, image
- **Position:** x, y coordinates
- **Style:** fontSize, color, fontFamily, fontWeight, textAlign, borderRadius, padding
- **Content:** Static text or template variables

#### Template Variables
- `{{client_name}}` - Full name of client
- `{{client_phone}}` - Client phone number
- `{{res_number}}` - Reservation number
- `{{total_amount}}` - Total reservation amount
- `{{vehicle_name}}` - Vehicle brand and model
- `{{vehicle_plate}}` - Vehicle registration plate
- `{{current_date}}` - Current date

#### Document Categories
1. **Invoice (invoice)** - Payment receipt showing all charges
2. **Contract (contract)** - Rental agreement
3. **Quote (devis)** - Pre-rental quote
4. **Check-in (checkin)** - Initial inspection report
5. **Check-out (checkout)** - Final inspection report

## Installation Steps

### 1. Run SQL Schema
```bash
# Execute the database schema to create tables
# Run the SQL_OPERATIONS_SCHEMA.sql file in your Supabase SQL editor
# Or paste the contents into your database setup
```

### 2. Update App.tsx Props
```typescript
<OperationsPage
  lang={lang}
  vehicles={vehicles}
  inspections={inspections}
  damages={damages}
  templates={templates}
  onAddInspection={handleAddInspection}
  onUpdateInspection={handleUpdateInspection}
  onDeleteInspection={handleDeleteInspection}
  onUpdateVehicleMileage={handleUpdateVehicleMileage}
  onAddDamage={handleAddDamage}
  onUpdateDamage={handleUpdateDamage}
  onDeleteDamage={handleDeleteDamage}
/>
```

### 3. Connect to Database (in App.tsx or service file)
```typescript
import { supabase } from './lib/supabase';

// Fetch inspections
const fetchInspections = async () => {
  const { data, error } = await supabase
    .from('inspections')
    .select('*');
  if (!error) setInspections(data);
};

// Add inspection
const handleAddInspection = async (insp: Inspection) => {
  const { error } = await supabase
    .from('inspections')
    .insert([insp]);
  if (!error) fetchInspections();
};

// Update inspection
const handleUpdateInspection = async (insp: Inspection) => {
  const { error } = await supabase
    .from('inspections')
    .update(insp)
    .eq('id', insp.id);
  if (!error) fetchInspections();
};

// Delete inspection
const handleDeleteInspection = async (id: string) => {
  const { error } = await supabase
    .from('inspections')
    .delete()
    .eq('id', id);
  if (!error) fetchInspections();
};
```

## Usage Guide

### Creating an Inspection

1. Click "+ Nouvelle Inspection" button
2. **Step 1:** Search and select a reservation, choose check-in or check-out type, enter mileage and fuel level
3. **Step 2:** Complete security, equipment, comfort, and cleanliness checklists
4. **Step 3:** Add vehicle signature, upload photos of exterior and interior
5. Click "✅ Valider l'inspection" to save

### Viewing Inspection Details

- Click the "👁️" (eye) icon on an inspection card to view full details
- View vehicle and client information
- See all checkbox responses and notes

### Generating Documents

- Click "Facture", "Contrat", or "Devis" buttons on inspection cards
- Review the preview window
- Click "Imprimer" to print or save as PDF

### Damages Module (Future)

The damages module is ready for implementation. Click the "💥 Dommages" tab to access it when ready.

## Component Props

```typescript
interface OperationsPageProps {
  lang: Language;                           // 'fr' | 'ar'
  vehicles: Vehicle[];                      // List of vehicles
  inspections: Inspection[];                // List of inspections
  damages: Damage[];                        // List of damage reports
  templates: any[];                         // Document templates
  onAddInspection: (insp: Inspection) => void;
  onUpdateInspection: (insp: Inspection) => void;
  onDeleteInspection: (id: string) => void;
  onUpdateVehicleMileage: (vehicleId: string, newMileage: number) => void;
  onAddDamage: (dmg: Damage) => void;
  onUpdateDamage: (dmg: Damage) => void;
  onDeleteDamage: (id: string) => void;
}
```

## Supported Languages

- **French (fr):** Complete French UI with French translations
- **Arabic (ar):** Full Arabic UI with RTL support

## Styling

The module uses:
- **Tailwind CSS** for responsive design
- **Rounded corners:** `rounded-[2rem]`, `rounded-[3rem]`, `rounded-[4rem]`
- **Custom animations:** `animate-fade-in`, `animate-scale-in`
- **Color scheme:** Blue primary (#0066cc), with status-specific colors

## API Reference

### Inspection Object
```typescript
interface Inspection {
  id: string;
  reservationId: string;
  type: 'depart' | 'retour';
  date: string;
  mileage: number;
  fuel: string;
  security: Record<string, boolean>;
  equipment: Record<string, boolean>;
  comfort: Record<string, boolean>;
  cleanliness: Record<string, boolean>;
  exteriorPhotos: string[];
  interiorPhotos: string[];
  signature: string;
  notes: string;
}
```

## Troubleshooting

### Module doesn't load
- Verify all props are passed from App.tsx
- Check browser console for errors
- Ensure database tables are created

### Photos not uploading
- Check file size limits
- Verify browser file API support
- Check Supabase storage permissions

### Print preview not showing
- Verify template exists in database
- Check that template elements have valid coordinates
- Ensure resolution is sufficient for preview

## Future Enhancements

1. **Damages Module:** Full damage reporting interface
2. **Template Editor:** Visual template designer
3. **Export:** Excel/CSV export of inspections
4. **Analytics:** Inspection completion rates and damage statistics
5. **Mobile App:** Mobile inspection capture with offline support
6. **AI Analysis:** Vehicle condition assessment using computer vision

## SQL Setup Commands

```sql
-- Create tables
\i SQL_OPERATIONS_SCHEMA.sql

-- Or manually run the three CREATE TABLE statements:
-- 1. Inspections table
-- 2. Damages table
-- 3. Templates table

-- Verify tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name IN ('inspections', 'damages', 'templates');
```

## Support

For issues or questions, refer to the main DriveFlow documentation or contact support.
