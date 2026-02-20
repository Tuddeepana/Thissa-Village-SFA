# Order to Bill Integration

## Overview
When an order status is updated to `COMPLETED`, the system automatically creates a bill record with inventory movements.

## Changes Made

### 1. Updated Order Service (`backend/src/services/order.service.ts`)

#### Added Imports
```typescript
import { billService } from './bill.service';
import type { BillCreateWithItemsInput } from '../types/bill.types';
```

#### Enhanced `updateOrderStatus` Method
The method now:
1. Fetches the existing order with items before updating
2. Updates the order status
3. **If status is `COMPLETED`:** Automatically creates a bill with:
   - Unique bill number (format: `BILL-{timestamp}`)
   - Customer name from order
   - Total amount from order
   - Cashier name from order
   - Item count (sum of all item quantities)
   - Tax amount from order
   - Default payment method: `CASH`
   - Cash given equals total (exact payment)
   - Balance given: 0
   - All order items mapped to bill items
   - Inventory movements created for each item

## How It Works

### Workflow
```
Order Created (PENDING) 
    ↓
User Adds Items (Optional)
    ↓
User Clicks "Complete Order"
    ↓
Order Status → COMPLETED
    ↓
Bill Automatically Created
    ↓
Inventory Reduced for Each Item
```

### Bill Creation Details

When order is completed, the following bill data is created:

| Field | Source | Notes |
|-------|--------|-------|
| `bill_number` | Generated | Format: `BILL-{timestamp}` |
| `date` | Current time | When order completed |
| `payment_method` | Default: `'CASH'` | Can be updated later if needed |
| `customer_name` | Order's `customer_name` | Can be null |
| `total` | Order's `total` | Final amount |
| `cashier_name` | Order's `cashier_name` | Who created the order |
| `item_count` | Sum of item quantities | Total items sold |
| `tax` | Order's `tax` | Tax amount |
| `cash_given` | Order's `total` | Assumes exact payment |
| `balance_given` | `0` | Assumes exact payment |
| `items` | Order's items | Mapped to bill items |

### Inventory Impact

For each order item:
- Inventory movement is created
- Quantity is deducted from stock
- Movement is linked to the bill

Example:
```
Order Item: 2x Product A
↓
Bill Item: 2x Product A
↓
Inventory: -2 units of Product A
```

## API Usage

### Complete an Order
```http
PATCH /api/orders/:orderId/status
Content-Type: application/json

{
  "status": "COMPLETED"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "order-uuid",
    "order_number": "ORD-12345678",
    "status": "COMPLETED",
    ...
  }
}
```

**Side Effect:**
- Bill created in `bills` table
- Inventory movements created in `inventory` table
- Stock quantities updated in `my_stock` table

## Database Schema

### Tables Affected

1. **orders**: Status updated to `COMPLETED`
2. **bills**: New bill record created
3. **inventory**: Movement records created for each item
4. **my_stock**: Stock quantities reduced

### Relationships
```
Order (1) ──has many──> OrderItems (N)
                             ↓
                        (copied to)
                             ↓
Bill (1) ──has many──> Inventory (N)
                             ↓
                      (references)
                             ↓
                        Products (N)
```

## Testing Checklist

### Test Case 1: Complete Order with Items
1. ✅ Create an order with items from POS
2. ✅ Verify order status is `PENDING`
3. ✅ Navigate to Orders page
4. ✅ Click "Complete Order" button
5. ✅ Verify order status changes to `COMPLETED`
6. ✅ Check Bills page - new bill should appear
7. ✅ Verify bill number format: `BILL-{timestamp}`
8. ✅ Verify bill customer name matches order
9. ✅ Verify bill total matches order total
10. ✅ Verify bill cashier matches order cashier
11. ✅ Check inventory movements for each item
12. ✅ Verify stock quantities decreased

### Test Case 2: Multiple Order Completions
1. ✅ Create 3 orders
2. ✅ Complete all 3 orders
3. ✅ Verify 3 bills created with unique bill numbers
4. ✅ Verify all have correct timestamps
5. ✅ Verify inventory movements are separate

### Test Case 3: Cancel Order (No Bill)
1. ✅ Create an order
2. ✅ Click "Cancel Order"
3. ✅ Verify order status is `CANCELLED`
4. ✅ Verify NO bill is created
5. ✅ Verify NO inventory movements

## Future Enhancements

### 1. Payment Method Selection
Currently defaults to `CASH`. Could be enhanced to:
- Accept payment method in the complete order request
- Show payment dialog before completion
- Support multiple payment methods (CASH, CARD, CREDIT)

**Implementation:**
```typescript
// Update UpdateOrderStatusInput to include payment details
export interface UpdateOrderStatusInput {
  status: OrderStatus;
  payment_method?: 'CASH' | 'CARD' | 'CREDIT';
  cash_given?: number;
  balance_given?: number;
}
```

### 2. Partial Payments
Currently assumes exact payment. Could support:
- Cash given > total (calculate change)
- Credit notes for partial payments
- Split payments (multiple payment methods)

### 3. Bill Editing
After order completion, cashier might need to:
- Update payment method
- Adjust cash given/balance
- Add credit notes
- Update customer information

**Endpoint:**
```http
PATCH /api/bills/:billId
```

### 4. Order-Bill Relationship
Add explicit relationship in schema:
```prisma
model Order {
  // ...existing fields
  billId String? @unique
  bill   Bill?   @relation(fields: [billId], references: [id])
}

model Bill {
  // ...existing fields
  orderId String? @unique
  order   Order?
}
```

**Benefits:**
- Easy lookup: "Which bill was created for this order?"
- Audit trail: "Which order generated this bill?"
- Validation: Prevent duplicate bills for same order

### 5. Bill Cancellation/Reversal
If order is cancelled after bill creation:
- Create reverse inventory movements
- Mark bill as cancelled
- Update stock quantities back

## Error Handling

### Current Behavior
- If bill creation fails, order status is still updated to `COMPLETED`
- Transaction is not rolled back

### Recommended Improvement
Wrap in transaction:
```typescript
await prisma.$transaction(async (tx) => {
  // Update order status
  const order = await tx.order.update(...);
  
  // Create bill if completed
  if (input.status === OrderStatus.COMPLETED) {
    await billService.createBillWithItems(billInput);
  }
  
  return order;
});
```

This ensures:
- Either both succeed or both fail
- Data consistency maintained
- No orphaned orders without bills

## Summary

✅ **Automatic Bill Creation**: No manual step needed after order completion
✅ **Inventory Sync**: Stock automatically reduced when order completed
✅ **Audit Trail**: Bills link back to orders through timestamps and customer info
✅ **Seamless Integration**: Works with existing POS and Orders workflow

⚠️ **Payment Method**: Currently defaults to CASH - may need enhancement
⚠️ **Transaction Safety**: Consider wrapping in database transaction
⚠️ **Bill Editing**: No direct link between order and bill yet

## Deployment Steps

1. **Backend Changes**
   ```powershell
   cd backend
   npm install
   npm run build
   ```

2. **No Migration Needed**
   - No schema changes required
   - Existing tables are sufficient

3. **Restart Backend**
   ```powershell
   npm run dev  # or production start command
   ```

4. **Test Workflow**
   - Create order from POS
   - Complete order from Orders page
   - Verify bill created in Bills page
   - Check inventory movements

5. **Monitor Logs**
   - Watch for any bill creation errors
   - Verify inventory updates are correct

## Rollback Plan

If issues occur:

1. **Revert Code Changes**
   ```bash
   git revert <commit-hash>
   ```

2. **Manual Bill Cleanup** (if needed)
   ```sql
   -- Delete bills created from orders (last 24 hours)
   DELETE FROM bills 
   WHERE bill_number LIKE 'BILL-%' 
   AND created_at > NOW() - INTERVAL '24 HOURS';
   
   -- Reverse inventory movements
   DELETE FROM inventory 
   WHERE bill_id IN (
     SELECT id FROM bills 
     WHERE bill_number LIKE 'BILL-%'
   );
   ```

3. **Restart Services**
   ```powershell
   cd backend
   npm run dev
   ```

## Questions & Answers

**Q: What happens if order is completed multiple times?**
A: Each status update to `COMPLETED` will create a new bill. Consider adding a check to prevent duplicate bills.

**Q: Can I edit the bill after order completion?**
A: Yes, use the existing bill editing endpoints to update payment method, amounts, etc.

**Q: What if I want to cancel an order after it's completed?**
A: Currently, status can change to `CANCELLED` but the bill remains. Consider implementing bill reversal.

**Q: How do I know which bill was created for which order?**
A: Match by customer name, timestamp, and total amount. Consider adding explicit relationship in schema.

**Q: Can I complete an order without creating a bill?**
A: Currently, no. Bill creation is automatic. If needed, add a flag to control this behavior.
