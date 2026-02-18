# Order Management Quick Start Guide

## 🚀 Quick Setup (3 Steps)

### Step 1: Run Database Migration
```bash
cd backend
npx prisma migrate dev --name add_order_management
npx prisma generate
```

### Step 2: Start Backend
```bash
cd backend
npm run dev
```

### Step 3: Start Frontend
```bash
cd frontend
npm run dev
```

---

## 📋 Feature Checklist

### ✅ What's Implemented

**POS System:**
- ✅ Customer name & phone input (required)
- ✅ Order type selection (Dine In / Take Away)
- ✅ Table selection for dine-in orders
- ✅ "Send to Kitchen" button creates real order in database
- ✅ Order number generated automatically (ORD-12345678)
- ✅ Navigate to Orders page after creation

**Orders Page:**
- ✅ Real-time statistics (Pending/Preparing/Ready/Completed/Cancelled counts)
- ✅ Order list with search and filter
- ✅ View order details dialog
- ✅ Status management (PENDING → PREPARING → READY → COMPLETED)
- ✅ Add items to existing orders (before completion)
- ✅ Payment processing
- ✅ Bill printing
- ✅ Customer and table information display

**API Endpoints:**
- ✅ POST `/api/orders` - Create order
- ✅ GET `/api/orders` - List orders with filters
- ✅ GET `/api/orders/:id` - Get order details
- ✅ PATCH `/api/orders/:id/status` - Update status
- ✅ POST `/api/orders/:id/items` - Add items
- ✅ DELETE `/api/orders/:id` - Cancel order
- ✅ GET `/api/orders/stats` - Get statistics

---

## 🎯 Usage Guide

### Creating an Order (POS)

1. **Enter Customer Info**
   ```
   Customer Name: John Doe ✓ Required
   Customer Phone: 0771234567 ✓ Required
   ```

2. **Select Order Type**
   - Click "Dine In" → Must select table
   - Click "Take Away" → No table needed

3. **Add Products**
   - Search and click products
   - Adjust quantities with +/- buttons
   - HANDMADE products have unlimited stock
   - PURCHASE products validate against stock

4. **Send to Kitchen**
   - Click "Send to Kitchen" button
   - Order created with status = PENDING
   - Auto-navigate to Orders page

### Managing Orders (Kitchen/Cashier)

1. **View Orders**
   ```
   Orders Page → See all active orders
   Stats Cards → Quick status overview
   Search → Find by order#, name, or phone
   Filter → Show only specific status
   ```

2. **Update Status (Kitchen Staff)**
   ```
   Click "View" on order
   ↓
   PENDING → Click "Start Preparing"
   ↓
   PREPARING → Click "Mark Ready"  
   ↓
   READY → (Cashier handles payment)
   ```

3. **Add Items (Before Payment)**
   ```
   Open order details
   ↓
   Click "Add Item" button
   ↓
   Select product + quantity
   ↓
   Totals recalculated automatically
   ```

4. **Complete Payment (Cashier)**
   ```
   Order status = READY
   ↓
   Click "Complete Payment" button
   ↓
   Select payment method (Cash/Card/Credit)
   ↓
   Enter amount paid
   ↓
   Status → COMPLETED + Bill prints
   ```

---

## 🔍 Testing Scenarios

### Test 1: Dine-In Order Flow
```
1. POS → Enter "Alice" / "0771111111"
2. Select "Dine In" + "Table 3"
3. Add: 2x Chicken Rice (Rs.850 each)
4. Click "Send to Kitchen"
5. Orders page → See order in PENDING (yellow)
6. Click "View" → Click "Start Preparing"
7. Status changes to PREPARING (blue)
8. Click "Mark Ready"
9. Status changes to READY (green)
10. Click "Complete Payment" → Cash → Rs.2000
11. Status → COMPLETED (gray) + Bill prints
✓ Test passes if order goes through all statuses
```

### Test 2: Take-Away Order
```
1. POS → Enter "Bob" / "0772222222"
2. Select "Take Away"
3. Add: 1x Burger (Rs.450)
4. Click "Send to Kitchen"
5. Orders page → See order (no table assigned)
✓ Test passes if order created without table info
```

### Test 3: Add Items Feature
```
1. Create order (status = PENDING or PREPARING)
2. Orders page → Click "View" on order
3. Click "Add Item"
4. Select "French Fries" + Quantity: 2
5. Click "Add Item"
6. Check total recalculated correctly
✓ Test passes if item added and totals update
```

### Test 4: Handmade Products
```
1. POS → Add handmade product with 0 stock
2. Should allow adding to cart (unlimited)
3. Increase quantity to 10+
4. Should not show stock warnings
✓ Test passes if no stock validation for handmade
```

---

## 📊 Order Status Colors

| Status | Color | Badge | Meaning |
|--------|-------|-------|---------|
| PENDING | 🟡 Yellow | bg-yellow-100 | Just created, waiting for kitchen |
| PREPARING | 🔵 Blue | bg-blue-100 | Kitchen is cooking |
| READY | 🟢 Green | bg-green-100 | Food ready, awaiting payment |
| COMPLETED | ⚫ Gray | bg-gray-100 | Payment done, order closed |
| CANCELLED | 🔴 Red | bg-red-100 | Order voided |

---

## 🔧 Common Operations

### Search Orders
```typescript
// By order number
Search: "ORD-12345678"

// By customer name
Search: "John"

// By phone
Search: "077"
```

### Filter by Status
```typescript
// Show only pending orders
Filter: PENDING

// Show all orders
Filter: All Status
```

### Refresh Orders
```typescript
// Click "Refresh" button to reload from API
```

---

## 🐛 Troubleshooting Quick Fixes

### Orders not appearing
```bash
# Check backend is running
curl http://localhost:5000/api/orders/stats

# Check authentication
localStorage.getItem('authToken') // Should have value
```

### Cannot create order
```typescript
// Ensure all required fields filled:
✓ Customer Name
✓ Customer Phone
✓ At least 1 item in cart
✓ Table selected (if Dine In)
```

### Cannot update status
```
# Only specific transitions allowed:
PENDING → PREPARING ✓
PREPARING → READY ✓
READY → COMPLETED ✓
PREPARING → PENDING ✗ (not allowed)
```

### Add Item button disabled
```
# Can only add items if status is:
PENDING ✓
PREPARING ✓  
READY ✓
COMPLETED ✗
CANCELLED ✗
```

---

## 📱 UI Component Reference

### POS Page Components
```
CustomerInfoCard
├── Name Input
├── Phone Input
├── Order Type Buttons (Dine In / Take Away / Room)
└── Table Grid (if Dine In)

ProductSearchCard
├── Search Input
├── Category Filter
└── Product Grid

BillCartCard
├── Item List
├── Tax/Discount Inputs
├── Totals Display
└── Action Button (Send to Kitchen / Print & Pay)
```

### Orders Page Components
```
StatsCards (5 cards)
├── Pending Count
├── Preparing Count
├── Ready Count
├── Completed Count
└── Cancelled Count

FiltersCard
├── Search Input
├── Status Dropdown
└── Refresh Button

OrdersTable
├── Order List
└── Actions (View / Print)

OrderDetailsDialog
├── Customer Info
├── Status Management
├── Items List (with Add Item)
├── Totals
└── Actions (Print / Complete Payment)
```

---

## 🎓 Key Concepts

### Order Lifecycle
```
Create (POS) → PENDING → PREPARING → READY → COMPLETED
                    ↓           ↓        ↓
                    └───────> CANCELLED <───┘
```

### Adding Items Logic
```typescript
// When adding items to existing order:
1. Calculate new items subtotal
2. Add to existing subtotal → new subtotal
3. Recalculate tax proportionally
4. Recalculate discount proportionally
5. Update total = subtotal + tax - discount
```

### Table Management
```typescript
// Tables in POS:
- Free tables → Green, clickable
- Occupied tables → Red, disabled
- VIP tables → Amber/gold badge
- Normal tables → No special badge

// Table assignment:
- Dine In → Required
- Take Away → Not needed
```

---

## 🚨 Important Notes

### Security
- All order endpoints require authentication (JWT)
- Only authenticated users can create/view/modify orders
- Cashier role has all permissions

### Data Integrity
- Orders cannot be deleted, only CANCELLED
- Order items cascade delete with parent order
- Customer info and table assignment immutable after creation

### Business Rules
- Cannot modify COMPLETED or CANCELLED orders
- Status transitions are one-way (no backward)
- Payment required to reach COMPLETED status
- Table freed automatically when order COMPLETED (frontend local state)

---

## 📞 Support

### Check Logs
```bash
# Backend logs
cd backend
npm run dev
# Watch console for errors

# Frontend logs
# Open browser DevTools → Console tab
```

### Verify Database
```bash
cd backend
npx prisma studio
# Check orders and order_items tables
```

### API Testing
```bash
# Using curl or Postman
GET http://localhost:5000/api/orders
GET http://localhost:5000/api/orders/stats
```

---

## Status
✅ Implementation Complete  
✅ Documentation Complete  
⏳ **Ready for migration and testing**
