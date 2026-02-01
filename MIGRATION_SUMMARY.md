# Product Schema Migration Summary
**Date:** January 25, 2026  
**Migration:** Remove Barcode, Bottle Size fields and Add Foreigner/Local Prices

## Overview
This migration updates the Product model to replace the single `selling_price` with separate `foreigner_price` and `local_price` fields, removes barcode and bottle size fields, and makes the low stock alert optional.

## Database Changes

### Removed Fields
- `barcode` (String, unique) - Product barcode field
- `litres` (Decimal) - Bottle size in litres
- `bottle_volume` (Enum: L/ML) - Bottle volume unit
- `selling_price` (Decimal) - Single selling price

### Added Fields
- `foreigner_price` (Decimal, required) - Selling price for foreign customers
- `local_price` (Decimal, required) - Selling price for local customers

### Modified Fields
- `low_stock` (Int) - Changed from required to optional (nullable)

### Removed Enums
- `BottleVolume` enum (no longer needed)

## Migration Files
- **Location:** `backend/prisma/migrations/20260125102037_remove_barcode_bottle_add_foreigner_local_prices/`
- **Status:** ✅ Successfully applied to local database

## Backend Changes

### 1. Type Definitions Updated
- `backend/src/types/product.types.ts`
  - `ProductDTO`: Uses `foreigner_price`, `local_price` instead of `selling_price`
  - Removed `barcode`, `litres`, `bottle_volume` fields
  
- `backend/src/types/mystock.types.ts`
  - `MyStockTableRow`: Uses `foreignerPrice`, `localPrice` instead of `sellingPrice`
  - Removed `bottle_size` field

- `backend/src/types/invoice.types.ts`
  - `InvoiceProductDetail`: Updated to use new price fields

- `backend/src/types/sales-summary.types.ts`
  - `SalesSummaryTableRow`: Uses price fields instead of volume
  - `VolumeWiseSummaryRow`: Now shows product-wise summary with prices

### 2. Services Updated
- `backend/src/services/product.service.ts` - Create/update using new fields
- `backend/src/services/mystock.service.ts` - Updated price display logic
- `backend/src/services/bill.service.ts` - Uses foreigner_price as default
- `backend/src/services/invoice.service.ts` - Updated product mapping
- `backend/src/services/sales-summary.service.ts` - Removed volume calculations, uses prices

### 3. Validations Updated
- `backend/src/validations/product.validation.ts`
  - `createProductSchema`: Validates new price fields
  - `updateProductSchema`: Updated field validations
  - Made `low_stock` optional

## Frontend Changes

### 1. Type Definitions Updated
- `frontend/src/types/product.types.ts`
  - `Product`: Uses `foreigner_price`, `local_price`
  - Removed barcode and bottle fields

- `frontend/src/types/pos.ts`
  - `Product`: Updated with `foreignerPrice` and `localPrice`
  - Removed `bottleVolume` and `barcode`

- `frontend/src/types/sales-summary.types.ts`
  - Updated to use price fields instead of volume

### 2. Pages Updated

#### Products Page (`frontend/src/pages/Products.tsx`)
**Complete rewrite with:**
- Form fields for Foreigner Price and Local Price
- Removed Barcode scanner component
- Removed Bottle Size input fields
- Low Stock Alert is now optional
- Updated table columns to show both prices
- Inline editing supports both price fields

#### Invoices Page (`frontend/src/pages/Invoices.tsx`)
- Updated CSV export to show foreigner/local prices
- Removed bottle volume from exports
- Updated product mapping

#### Bills Page (`frontend/src/pages/Bills.tsx`)
- Updated item mapping to use new price structure
- Removed bottle volume display

#### Sales Summary Page (`frontend/src/pages/SalesSummary.tsx`)
- Removed "Total Volume" card
- Updated table to show Foreigner Price and Local Price columns
- Updated CSV export headers
- Product-wise summary instead of volume-wise

### 3. Components Updated

#### ProductSearch Component (`frontend/src/components/pos/ProductSearch.tsx`)
- Displays both Foreigner Price and Local Price
- Removed bottle volume badge
- Updated search to remove barcode filtering

#### AddInvoiceDialog Component (`frontend/src/components/invoices/AddInvoiceDialog.tsx`)
- Removed barcode scanner
- Removed bottle volume from product selection dropdown
- Uses cost_price as default unit price

## Testing Checklist

### Backend API Endpoints
- ✅ POST `/api/products` - Create product with new price fields
- ✅ PUT `/api/products/:id` - Update product prices
- ✅ GET `/api/products` - List products with new schema
- ✅ GET `/api/mystock` - Stock display with prices
- ✅ GET `/api/sales-summary` - Sales reports with prices

### Frontend Pages
- ✅ Products page - Add/edit products with new fields
- ✅ POS page - Product search with both prices
- ✅ Invoices page - Create invoices
- ✅ Bills page - View bills with products
- ✅ Sales Summary - View reports with new structure

## Database Credentials
**Default Admin User:**
- Email: `admin@vinopos.com`
- Password: `admin123`

**Default Cashier User:**
- Email: `cashier@vinopos.com`
- Password: `cashier123`

## Setup Instructions

### If You Need to Re-run Migration:

1. **Stop all Node processes:**
   ```powershell
   Stop-Process -Name "node" -Force
   ```

2. **Navigate to backend:**
   ```powershell
   cd "E:\Achintha\Wrenix\Navoda System\backend"
   ```

3. **Run migration:**
   ```powershell
   npx prisma migrate deploy
   ```

4. **Seed database:**
   ```powershell
   npx prisma db seed
   ```

5. **Start backend:**
   ```powershell
   npm run dev
   ```

6. **Start frontend (in new terminal):**
   ```powershell
   cd "E:\Achintha\Wrenix\Navoda System\frontend"
   npm run dev
   ```

## Configuration Files Updated
- `backend/prisma/schema.prisma` - Product model definition
- `backend/.env` - Removed DIRECT_URL to use local database only

## Notes
- The migration preserves existing data structure for bills and invoices
- Old bills/invoices will need data migration if they exist (current: fresh database)
- POS system now requires selecting customer type (foreigner/local) for correct pricing
- All volume-based calculations have been removed from reports

## Breaking Changes
⚠️ **API Breaking Changes:**
- Product API responses no longer include: `barcode`, `litres`, `bottle_volume`, `selling_price`
- Product API now requires: `foreigner_price`, `local_price` in create/update requests
- `low_stock` is now optional in product creation

## Migration Status
✅ Database schema migrated successfully  
✅ Backend types and services updated  
✅ Frontend types and components updated  
✅ Database seeded with default users  
✅ All errors resolved  
✅ Servers started successfully

---
**Migration completed successfully!** 🎉

