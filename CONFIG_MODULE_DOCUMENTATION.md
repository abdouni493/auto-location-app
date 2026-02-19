# Configuration Module - Setup Guide

## Overview

The Configuration Module allows administrators to manage all system settings, including store information, pricing rules, mileage limits, penalty settings, and security credentials.

## Database Schema

### Tables Created

#### 1. **system_config**
Stores all system-wide configuration settings.

```sql
CREATE TABLE public.system_config (
    id UUID PRIMARY KEY,
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
    penalty_calc_type TEXT NOT NULL DEFAULT 'daily',
    penalty_amount NUMERIC NOT NULL DEFAULT 1500,
    penalty_tolerance INTEGER NOT NULL DEFAULT 60,  -- minutes
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
```

**Fields Explanation:**
- `store_name`: Business name displayed throughout the app
- `slogan`: Company tagline/motto
- `address`: Physical location of the agency
- `logo_url`: Path to company logo image
- `facebook`, `instagram`, `whatsapp`: Social media contacts
- `penalty_calc_type`: How late return fees are calculated
  - `daily`: Based on daily rate
  - `hourly`: Flat hourly rate
  - `daily_flat`: Fixed daily amount
  - `percentage`: Percentage of daily rate
- `penalty_amount`: Amount charged per period
- `penalty_tolerance`: Grace period in minutes before penalties apply
- `fuel_missing_price`: Cost per unit of fuel missing on return
- `daily_mileage_limit`: Maximum km allowed per day
- `mileage_tolerance`: Free km overage allowed
- `excess_price`: Cost per km over limit
- `unlimited_price`: Daily surcharge for unlimited mileage option

#### 2. **admin_security**
Stores admin credentials and login security settings.

```sql
CREATE TABLE public.admin_security (
    id UUID PRIMARY KEY,
    username TEXT NOT NULL UNIQUE DEFAULT 'admin',
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT,
    last_login TIMESTAMPTZ,
    login_attempts INTEGER DEFAULT 0,
    is_locked BOOLEAN DEFAULT false,
    locked_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Fields Explanation:**
- `username`: Admin login username
- `email`: Email for password recovery
- `password_hash`: Hashed password (use bcrypt in production)
- `last_login`: Timestamp of last successful login
- `login_attempts`: Number of failed login attempts
- `is_locked`: Account locked status
- `locked_until`: When account lock expires

#### 3. **config_audit_log**
Logs all configuration changes for audit purposes.

```sql
CREATE TABLE public.config_audit_log (
    id UUID PRIMARY KEY,
    admin_id UUID REFERENCES public.admin_security(id),
    config_field TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    action TEXT NOT NULL,  -- 'create', 'update', 'delete'
    created_at TIMESTAMPTZ DEFAULT now()
);
```

## Frontend Components

### ConfigPage.tsx

The main configuration interface with 4 tabs:

#### **1. General Tab** 🏢
Manage store information and branding:
- Store name
- Company slogan
- Physical address
- Logo upload
- Social media links (Facebook, Instagram, WhatsApp)

#### **2. Rules & Tariffs Tab** 📋
Configure pricing and penalty rules:

**Penalties Section:**
- Calculation type (daily, hourly, flat, percentage)
- Penalty amount
- Grace period tolerance (minutes)

**Mileage Section:**
- Daily limit (km)
- Free tolerance (km)
- Excess price per km
- Unlimited mileage surcharge

**Fuel Section:**
- Price per unit of missing fuel

#### **3. Security Tab** 🛡️
Manage admin account:
- Username (read-only)
- Email address
- Change password (optional)
- Password confirmation

#### **4. Database Tab** 💾
Data management (future features):
- Backup database
- Restore from backup
- Cloud sync status

## Features

### ✅ Real-time Database Sync
- All changes automatically saved to Supabase
- Loading states for better UX
- Error handling with user feedback
- Success notifications

### ✅ Bilingual Support
- Full French (fr) and Arabic (ar) translations
- RTL layout support for Arabic

### ✅ Data Validation
- Password confirmation matching
- Type validation for numeric fields
- Email format validation

### ✅ Security
- Row Level Security (RLS) enabled
- Audit logging for all changes
- Admin-only access to sensitive settings

### ✅ Modern UI
- Beautiful gradient design
- Color-coded sections
- Smooth animations
- Responsive layout
- Loading indicators

## API Integration

### Supabase Tables

**Reading Configuration:**
```typescript
const { data } = await supabase
  .from('system_config')
  .select('*')
  .eq('is_active', true)
  .single();
```

**Updating Configuration:**
```typescript
const { error } = await supabase
  .from('system_config')
  .update({
    store_name: 'New Name',
    slogan: 'New Slogan',
    // ... other fields
  })
  .eq('id', configId);
```

**Updating Admin Security:**
```typescript
const { error } = await supabase
  .from('admin_security')
  .update({
    email: 'newemail@example.com',
    password_hash: 'hashed_password'
  })
  .eq('username', 'admin');
```

## SQL Installation

1. Go to your Supabase project SQL Editor
2. Copy the entire content of `SQL_CONFIG_SCHEMA.sql`
3. Run the SQL to create all tables, indexes, triggers, and functions
4. The default configuration and admin account will be created automatically

## Data Types & Limits

| Field | Type | Min | Max | Notes |
|-------|------|-----|-----|-------|
| store_name | TEXT | 1 | 255 | Required |
| penalty_amount | NUMERIC | 0 | ∞ | Daily/Hourly charge |
| penalty_tolerance | INTEGER | 0 | 1440 | Minutes (0-1440) |
| daily_mileage_limit | INTEGER | 1 | ∞ | Kilometers |
| excess_price | NUMERIC | 0 | ∞ | Per km |
| fuel_missing_price | NUMERIC | 0 | ∞ | Per unit |

## Security Considerations

### Production Checklist

1. **Password Hashing**
   - Currently uses plain text for demo
   - Implement bcrypt in production:
   ```typescript
   import bcrypt from 'bcryptjs';
   const hashedPassword = await bcrypt.hash(password, 10);
   ```

2. **Row Level Security**
   - Verify RLS policies match your requirements
   - Currently allows authenticated users full access
   - Consider adding role-based policies for multi-admin scenarios

3. **Audit Logging**
   - All config changes are logged
   - Review audit logs regularly
   - Implement log retention policies

4. **Admin Credentials**
   - Change default password immediately
   - Use strong, unique passwords
   - Enable two-factor authentication (if using auth.users)

## Usage Examples

### Accessing Configuration in Components

```typescript
import { supabase } from '../lib/supabase';

// Fetch current config
const { data: config } = await supabase
  .from('system_config')
  .select('*')
  .eq('is_active', true)
  .single();

// Use values in your app
console.log(config.daily_mileage_limit); // 250
console.log(config.penalty_amount); // 1500
```

### Updating Specific Settings

```typescript
const updatePenalties = async (amount: number, tolerance: number) => {
  const { error } = await supabase
    .from('system_config')
    .update({
      penalty_amount: amount,
      penalty_tolerance: tolerance
    })
    .eq('is_active', true);
  
  if (error) console.error(error);
};
```

## Troubleshooting

### Configuration Not Loading
- Check that RLS policies are enabled
- Verify user is authenticated
- Check browser console for API errors
- Confirm system_config table exists

### Save Not Working
- Verify email format is valid
- Check password confirmation matches
- Ensure no RLS conflicts
- Check database has available quota

### Changes Not Persisting
- Verify the update query completed without error
- Check that `is_active = true` for the config record
- Confirm network connection is stable

### Password Update Issues
- Ensure new password ≠ confirm password error message appears
- Implement bcrypt hashing before storing
- Add password strength validation

## Future Enhancements

1. **Backup & Restore**
   - Implement database backup functionality
   - Add restore from backup feature
   - Schedule automated backups

2. **Advanced Settings**
   - Tax configuration (VAT, GST)
   - Currency settings
   - Date format preferences
   - Business hours configuration

3. **Multi-Admin Support**
   - Multiple admin accounts
   - Role-based access control
   - Admin action logging with user attribution

4. **Settings Profiles**
   - Save multiple configuration sets
   - Quick-switch between configurations
   - Version history and rollback

5. **Email Templates**
   - Configure email notifications
   - Customize invoice templates
   - Set auto-reply messages

## API Endpoints (Supabase REST)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/system_config?is_active=eq.true` | Fetch active config |
| POST | `/system_config` | Create new config |
| PATCH | `/system_config?id=eq.{id}` | Update config |
| GET | `/admin_security?username=eq.admin` | Fetch admin account |
| PATCH | `/admin_security?username=eq.admin` | Update admin account |
| GET | `/config_audit_log` | View audit logs |

## Support & Documentation

For more information:
- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- React State Management patterns

