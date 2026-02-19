# Configuration Module - Quick Reference Guide

## 🚀 Quick Start (5 Minutes)

### Step 1: Copy SQL Code
Open `SQL_CONFIG_SCHEMA.sql` file

### Step 2: Run in Supabase
1. Go to your Supabase project → SQL Editor
2. Create new query
3. Paste all SQL code
4. Click Run
5. Done! ✅

### Step 3: Test in App
- Navigate to Config page
- You should see all settings loaded from database
- Try editing and saving
- Changes will persist!

---

## 📋 Configuration Tabs Overview

### 🏢 General Tab
**What it does:** Manages store branding and contact info

**Fields:**
- Store Name (e.g., "DriveFlow Management")
- Slogan (e.g., "L'élégance au service de votre mobilité")
- Address (e.g., "12 Rue Didouche Mourad, Alger")
- Logo (upload image)
- Social Media:
  - Facebook URL
  - Instagram URL
  - WhatsApp number

**Example Update:**
```typescript
store_name: "DriveFlow Algerie",
slogan: "Votre mobilité, notre priorité"
```

---

### 📋 Rules & Tariffs Tab
**What it does:** Controls pricing rules for late returns, mileage, and fuel

#### Penalties Section (⚠️)
How much customers pay when returning late.

**Fields:**
- **Type**: Choose calculation method
  - daily: Based on daily rental rate
  - hourly: Fixed hourly amount
  - daily_flat: Fixed daily amount
  - percentage: % of daily rate
- **Amount**: How much to charge (e.g., 1500 DZ)
- **Tolerance**: Grace period before penalty (e.g., 60 minutes)

**Example:**
- If daily rate is 5000 DZ
- Penalty type: "daily"
- Penalty amount: 1500 DZ
- Tolerance: 60 minutes
- Result: 1500 DZ per day after 60 minutes grace

#### Mileage Section (🛣️)
Control how customers are charged for exceeding km limits.

**Fields:**
- **Daily Limit**: Max km allowed (e.g., 250 km/day)
- **Free Tolerance**: How much over limit is free (e.g., 20 km)
- **Excess Price**: Charge per km over limit (e.g., 15 DZ/km)
- **Unlimited Price**: Daily surcharge for unlimited km option (e.g., 2000 DZ)

**Example:**
- Daily limit: 250 km
- Customer drives 300 km
- Free tolerance: 20 km
- Over limit: 300 - 250 - 20 = 30 km
- Charge: 30 × 15 = 450 DZ

#### Fuel Section (⛽)
Price charged for missing fuel on return.

**Fields:**
- **Missing Fuel Price**: Charge per unit (e.g., 500 DZ per liter)

**Example:**
- Customer returns with 1 liter missing
- Charge: 1 × 500 = 500 DZ

---

### 🛡️ Security Tab
**What it does:** Manage admin login credentials

**Fields:**
- **Username**: Admin login name (read-only)
- **Email**: Recovery email address (can change)
- **New Password**: Leave blank to keep current (optional)
- **Confirm Password**: Must match new password

**How to Change Password:**
1. Enter new password in "New Password" field
2. Enter same password in "Confirm Password" field
3. Click Save
4. Password updated! ✅

---

### 💾 Database Tab
**What it does:** Backup and restore functionality (coming soon)

**Features (planned):**
- Download database backup
- Upload backup to restore
- Cloud sync status

---

## 🗄️ Database Tables Quick Reference

### system_config
```
- id: UUID (unique identifier)
- store_name: Text (business name)
- slogan: Text (tagline)
- address: Text (physical location)
- facebook: Text (social link)
- instagram: Text (social link)
- whatsapp: Text (phone number)
- penalty_calc_type: Text (daily/hourly/flat/percent)
- penalty_amount: Number (DZ)
- penalty_tolerance: Number (minutes)
- fuel_missing_price: Number (DZ)
- daily_mileage_limit: Number (km)
- mileage_tolerance: Number (km)
- excess_price: Number (DZ/km)
- unlimited_price: Number (DZ/day)
- is_active: Boolean (true/false)
- created_at: Timestamp
- updated_at: Timestamp (auto-updated)
```

### admin_security
```
- id: UUID (unique identifier)
- username: Text (login name)
- email: Text (recovery email)
- password_hash: Text (encrypted password)
- last_login: Timestamp
- login_attempts: Number (for security)
- is_locked: Boolean (locked status)
- created_at: Timestamp
- updated_at: Timestamp (auto-updated)
```

### config_audit_log
```
- id: UUID (unique identifier)
- admin_id: UUID (which admin made change)
- config_field: Text (which field changed)
- old_value: Text (previous value)
- new_value: Text (new value)
- action: Text (create/update/delete)
- created_at: Timestamp
```

---

## 🔍 Common SQL Queries

### Get Current Configuration
```sql
SELECT * FROM system_config WHERE is_active = true;
```

### Get Configuration Using Function
```sql
SELECT * FROM get_current_config();
```

### Update Store Name
```sql
UPDATE system_config
SET store_name = 'New Name'
WHERE is_active = true;
```

### View Configuration History
```sql
SELECT * FROM config_audit_log
ORDER BY created_at DESC
LIMIT 10;
```

### Get Admin User
```sql
SELECT username, email FROM admin_security
WHERE username = 'admin';
```

### Check Password Hash
```sql
SELECT password_hash FROM admin_security
WHERE username = 'admin';
```

---

## 💻 Using Config in Your App

### Import and Read Config
```typescript
import { supabase } from '../lib/supabase';

async function getConfig() {
  const { data } = await supabase
    .from('system_config')
    .select('*')
    .eq('is_active', true)
    .single();
  
  return data;
}

// Use it
const config = await getConfig();
console.log(config.store_name);        // DriveFlow Management
console.log(config.penalty_amount);    // 1500
console.log(config.daily_mileage_limit); // 250
```

### Update Single Field
```typescript
async function updateStoreName(newName: string) {
  const { error } = await supabase
    .from('system_config')
    .update({ store_name: newName })
    .eq('is_active', true);
  
  if (error) console.error(error);
  return !error;
}
```

### Update Multiple Fields
```typescript
async function updatePenalties(amount: number, type: string) {
  const { error } = await supabase
    .from('system_config')
    .update({
      penalty_amount: amount,
      penalty_calc_type: type
    })
    .eq('is_active', true);
  
  return !error;
}
```

---

## ⚙️ Default Values

When you first run the SQL, these values are set:

| Setting | Value |
|---------|-------|
| Store Name | DriveFlow Management |
| Slogan | L'élégance au service de votre mobilité |
| Address | 12 Rue Didouche Mourad, Alger Centre |
| Facebook | facebook.com/driveflow |
| Instagram | instagram.com/driveflow_dz |
| WhatsApp | +213 550 00 00 00 |
| Penalty Type | daily |
| Penalty Amount | 1500 DZ |
| Penalty Tolerance | 60 minutes |
| Daily Mileage Limit | 250 km |
| Mileage Tolerance | 20 km |
| Excess Price | 15 DZ/km |
| Unlimited Price | 2000 DZ/day |
| Fuel Missing Price | 500 DZ |
| Admin Username | admin |
| Admin Email | contact@driveflow.dz |

---

## 🔐 Security Tips

1. **Change Default Admin Password**
   - Go to Security tab
   - Change from "admin123" to secure password
   - Use mix of uppercase, lowercase, numbers, symbols

2. **Change Admin Email**
   - Go to Security tab
   - Update email for recovery

3. **Review Audit Log**
   - Check who changed what
   - Monitor unauthorized changes

4. **Backup Regularly**
   - Export database backup
   - Store securely

---

## ❌ Troubleshooting

### Config page shows "Loading..."
- **Check:** Is your database running?
- **Fix:** Go to Supabase → check database status

### Can't save changes
- **Check:** Is email format valid?
- **Check:** Do passwords match?
- **Fix:** Review error message in red notification

### See old values after save
- **Fix:** Refresh the page (F5)

### Can't see social media changes
- **Check:** Did you click Save?
- **Check:** Is internet connection active?
- **Fix:** Reload page after saving

---

## 📱 Bilingual Support

The Config page automatically switches between:
- **French (Français)** - FR
- **Arabic (العربية)** - AR

All labels, buttons, and messages translate automatically.

---

## 📞 Support

For detailed information, see:
- `CONFIG_MODULE_DOCUMENTATION.md` - Complete guide
- `CONFIG_SQL_CODE.md` - All SQL code
- `CONFIG_SETUP_COMPLETE.md` - Full setup details

---

## ✅ Checklist

- [ ] SQL code run in Supabase
- [ ] Tables created successfully
- [ ] ConfigPage displays config
- [ ] Can edit and save settings
- [ ] Changes persist after refresh
- [ ] Password change works
- [ ] Email change works
- [ ] Error messages display correctly
- [ ] All fields are visible

Once all checked ✅, you're ready to use the Configuration Module!

