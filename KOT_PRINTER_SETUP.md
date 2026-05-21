# KOT Printer IP Address Update Guide

The KOT (Kitchen Order Ticket) printer configuration is **dynamic** and its settings are stored securely in the database. You **do not** need to edit any code files or source scripts if the printer's IP address changes!

## How to Update the Printer IP Address

If your router assigns a new IP address to your Xprinter Thermal Printer (or you change the static network configuration), simply follow these steps to update it via the application interface:

### Method 1: Using the Application UI (Recommended)
1. Log in to the Thissa-Village-SFA system as an Administrator.
2. Navigate to the **Tools** (or Settings/Configuration) page from the main menu.
3. Locate the **KOT Printers** management section.
4. Click **Edit** (pencil icon) next to your existing KOT Printer.
5. Change the **IP Address** field to the new IP (e.g., `192.168.100.51`).
6. Save the changes.
7. Click the **Test** button to ensure the application can reach the printer on its new IP.

### Method 2: Resetting via Script (If UI is inaccessible)
If you need to quickly re-add the printer directly into the database from the server terminal without using the User Interface:

1. Open your terminal in the backend directory.
2. Run the interactive un-commented commands to seed a new printer:
```powershell
# Open Prisma Studio to manually edit the entries
npx prisma studio
```
Then navigate to the `Printer` table, find your active KOT printer, change the `ipAddress` field, and click **Save**.

### Why no file edits?
The backend service (`backend/src/services/printer.service.ts`) fetches the IP address automatically from the active `Printer` configurations stored in your Prisma database on every print request:
```typescript
const activePrinters = await prisma.printer.findMany({
  where: { isActive: true, type: 'KOT' },
});
```
This guarantees maximum flexibility without needing to recompile the application!

