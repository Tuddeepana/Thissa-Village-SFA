import { Bill } from '@/types/pos';
import { format } from 'date-fns';
import logoUrl from '@/assets/images/resturent_logo.png';
import pkg from '../../package.json';

// Cache logo data URL to avoid repeated fetches
let cachedLogoDataUrl: string | null = null;

/** Fetches the logo and converts it to a base64 data-URI so it renders
 *  correctly inside the isolated iframe / new-window print context.
 *  Uses caching to improve performance on subsequent calls. */
const toDataURL = async (url: string): Promise<string> => {
  if (cachedLogoDataUrl) {
    return cachedLogoDataUrl;
  }
  
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        cachedLogoDataUrl = result; // Cache the result
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Failed to load logo:', error);
    return '';
  }
};

/* ─────────────────────────────────────────────────────────────────
   Shared CSS — used by both printBill and printBillNewWindow
   Thermal-printer notes:
   • font-weight: 600 base  → semi-bold, prints solid without making
     everything look bold; preserves hierarchy vs 700/900 labels
   • @page size: 80mm auto  → page height follows content exactly,
     no blank paper gap at the bottom
   • Tight margins / padding — paper cuts right after last line
───────────────────────────────────────────────────────────────── */
const BILL_CSS = `
  @media print {
    @page { size: 80mm auto; margin: 0; }
    body  { margin: 0; padding: 0; }
    .no-print { display: none !important; }
  }

  * { box-sizing: border-box; }

  body {
    font-family: 'Courier New', Courier, monospace;
    font-size: 12px;
    font-weight: 600;
    line-height: 1.45;
    letter-spacing: 0.015em;
    width: 80mm;
    max-width: 80mm;
    margin: 0 auto;
    padding: 4mm 4mm 3mm 4mm;
    color: #000;
  }

  /* ── Logo header ─────────────────────────────────────────── */
  .header {
    text-align: center;
    padding-bottom: 5px;
    margin-bottom: 5px;
    border-bottom: 2px solid #000;
  }
  .logo-img {
    display: block;
    width: 100%;
    max-width: 72mm;
    margin: 0 auto 2px auto;
    /* Logo is white-on-black; invert makes it black-on-white for print */
    filter: invert(1);
  }
  .logo-fallback {
    font-size: 17px;
    font-weight: 900;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  /* ── Dividers ────────────────────────────────────────────── */
  .div-thick  { border: none; border-top: 2px solid #000; margin: 4px 0; }
  .div-dashed { border: none; border-top: 1px dashed #000; margin: 5px 0; }

  /* ── Bill meta ───────────────────────────────────────────── */
  .info-row {
    display: flex;
    justify-content: space-between;
    margin: 2px 0;
    font-size: 11.5px;
  }
  .info-label { font-weight: 700; }

  /* ── Items table ─────────────────────────────────────────── */
  .items-table {
    width: 100%;
    table-layout: fixed;
    border-collapse: collapse;
    margin: 4px 0;
  }
  .items-table thead tr {
    border-top: 1px solid #000;
    border-bottom: 1px solid #000;
  }
  .items-table th {
    font-weight: 700;
    font-size: 11px;
    letter-spacing: 0.04em;
    padding: 3px 2px;
    text-align: left;
  }
  .items-table th.r { text-align: right; }
  .items-table td {
    font-size: 11px;
    font-weight: 600;
    padding: 2px 2px;
    vertical-align: top;
    overflow: hidden;
  }
  .items-table td.r { text-align: right; white-space: nowrap; }
  .col-name  { word-break: break-word; white-space: normal; }
  .col-qty   { width: 7mm; }
  .col-price { width: 14mm; }
  .col-total { width: 14mm; }

  /* ── Totals ──────────────────────────────────────────────── */
  .totals { margin: 2px 0; padding-top: 8px; margin-top: 4px; }
  .total-row {
    display: flex;
    justify-content: space-between;
    margin: 2px 0;
    font-size: 11.5px;
    font-weight: 600;
  }
  .grand-total-row {
    display: flex;
    justify-content: space-between;
    font-size: 15px;
    font-weight: 900;
    letter-spacing: 0.04em;
    padding: 4px 0;
    margin: 3px 0;
    border-top: 2px solid #000;
    border-bottom: 2px solid #000;
  }

  /* ── Payment section ─────────────────────────────────────── */
  .payment-section { margin: 3px 0; }
  .payment-row {
    display: flex;
    justify-content: space-between;
    margin: 2px 0;
    font-size: 11.5px;
    font-weight: 600;
  }
  .payment-label { font-weight: 700; }
  .credit-badge  { font-weight: 900; letter-spacing: 0.06em; }
  .credit-note-box {
    margin-top: 3px;
    padding: 3px 4px;
    border: 1px dashed #000;
    font-size: 10.5px;
  }
  .credit-note-title { font-weight: 700; margin-bottom: 1px; }

  /* ── Footer ──────────────────────────────────────────────── */
  .footer {
    text-align: center;
    padding-top: 4px;
    margin-top: 2px;
  }
  .footer-thanks {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.06em;
  }
  .footer-sub {
    font-size: 11px;
    font-weight: 600;
    margin-top: 1px;
    letter-spacing: 0.03em;
  }
  .footer-powered {
    font-size: 9.5px;
    font-weight: 600;
    letter-spacing: 0.06em;
    margin-top: 5px;
    text-transform: uppercase;
  }

  /* ── Screen-only print buttons ───────────────────────────── */
  .no-print { text-align: center; margin: 8px 0 4px 0; }
  .no-print button {
    padding: 8px 18px; margin: 4px; cursor: pointer;
    font-size: 13px; border: 1px solid #000;
    background: #fff; font-family: inherit;
  }
  .no-print button:hover { background: #f0f0f0; }
`;

const buildBillBody = (
  bill: Bill,
  billNo: string | number,
  logoDataUrl: string,
) => `
  <div class="header">
    ${logoDataUrl
      ? `<img class="logo-img" src="${logoDataUrl}" alt="Tissa Village Restaurant & Bar" />`
      : `<div class="logo-fallback">Tissa Village</div>`
    }
  </div>

  <div class="info-row">
    <span class="info-label">Bill #</span>
    <span>${billNo}</span>
  </div>
  <div class="info-row">
    <span class="info-label">Date</span>
    <span>${format(bill.createdAt, 'dd/MM/yyyy HH:mm:ss')}</span>
  </div>
  ${bill.customerName ? `
  <div class="info-row">
    <span class="info-label">Customer</span>
    <span>${bill.customerName}</span>
  </div>` : ''}
  ${bill.cashierName ? `
  <div class="info-row">
    <span class="info-label">Cashier</span>
    <span>${bill.cashierName}</span>
  </div>` : ''}

  <hr class="div-dashed">

  <table class="items-table">
    <thead>
      <tr>
        <th class="col-name">Item</th>
        <th class="col-qty r">Qty</th>
        <th class="col-price r">Price</th>
        <th class="col-total r">Total</th>
      </tr>
    </thead>
    <tbody>
      ${bill.items.map(item => {
        // Derive the unit price actually charged from the stored subtotal
        const unitPrice = item.quantity > 0 ? item.subtotal / item.quantity : 0;
        const nameWithUnit = item.product.unit
          ? `${item.product.name} (${item.product.unit})`
          : item.product.name;
        return `
      <tr>
        <td class="col-name">${nameWithUnit}</td>
        <td class="col-qty r">${item.quantity}</td>
        <td class="col-price r">${unitPrice.toFixed(2)}</td>
        <td class="col-total r">${item.subtotal.toFixed(2)}</td>
      </tr>`;
      }).join('')}
    </tbody>
  </table>

  <hr class="div-dashed">

  <div class="totals">
    <div class="total-row">
      <span>Subtotal</span>
      <span>Rs. ${bill.subtotal.toFixed(2)}</span>
    </div>
    <div class="total-row">
      <span>Tax (${bill.taxRate}%)</span>
      <span>Rs. ${bill.tax.toFixed(2)}</span>
    </div>
    ${bill.serviceCharge && bill.serviceCharge > 0 ? `
    <div class="total-row">
      <span>Service Charge${bill.serviceChargeRate ? ` (${bill.serviceChargeRate}%)` : ''}</span>
      <span>Rs. ${bill.serviceCharge.toFixed(2)}</span>
    </div>` : ''}
    ${bill.discount > 0 ? `
    <div class="total-row">
      <span>Discount (${bill.discountRate}%)</span>
      <span>- Rs. ${bill.discount.toFixed(2)}</span>
    </div>` : ''}
    <div class="grand-total-row">
      <span>TOTAL</span>
      <span>Rs. ${bill.total.toFixed(2)}</span>
    </div>
  </div>

  <div class="payment-section">
    <div class="payment-row">
      <span class="payment-label">Payment</span>
      <span style="font-weight:700;">${bill.paymentMethod.toUpperCase()}</span>
    </div>
    ${bill.paymentMethod !== 'credit' ? `
    <div class="payment-row">
      <span class="payment-label">Amount Paid</span>
      <span>Rs. ${bill.amountPaid.toFixed(2)}</span>
    </div>
    ${bill.change > 0 ? `
    <div class="payment-row">
      <span class="payment-label">Change</span>
      <span>Rs. ${bill.change.toFixed(2)}</span>
    </div>` : ''}` : `
    <div class="payment-row">
      <span class="payment-label">Status</span>
      <span class="credit-badge">*** CREDIT SALE ***</span>
    </div>
    ${bill.creditDescription ? `
    <div class="credit-note-box">
      <div class="credit-note-title">Credit Note:</div>
      <div>${bill.creditDescription}</div>
    </div>` : ''}`}
  </div>

  <hr class="div-thick">

  <div class="footer">
    <div class="footer-thanks">Thank You For Your Business!</div>
    <div class="footer-sub">Come Again !</div>
    <hr class="div-dashed" style="margin:4px 12px;">
    <div class="footer-powered">Powered by Wrenix Pvt Ltd &nbsp;|&nbsp; v${pkg.version.replace(/[^0-9.]/g, '')}</div>
  </div>
`;

export const printBill = async (bill: Bill, _storeName?: string) => {
  const logoDataUrl = await toDataURL(logoUrl);

  const printFrame = document.createElement('iframe');
  printFrame.style.position = 'absolute';
  printFrame.style.width = '0';
  printFrame.style.height = '0';
  printFrame.style.border = 'none';
  document.body.appendChild(printFrame);

  const printDocument = printFrame.contentWindow?.document;
  if (!printDocument) return;

  const billHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Bill #${bill.id}</title>
      <style>${BILL_CSS}</style>
    </head>
    <body>
      ${buildBillBody(bill, bill.id, logoDataUrl)}
      <script>
        window.onload = function() {
          window.print();
          setTimeout(function() {
            window.parent.document.body.removeChild(window.frameElement);
          }, 100);
        };
      <\/script>
    </body>
    </html>
  `;

  printDocument.open();
  printDocument.write(billHTML);
  printDocument.close();
};

// Direct print: open window, auto-print, and close automatically
export const printBillNewWindow = async (bill: Bill, _storeName?: string) => {
  const logoDataUrl = await toDataURL(logoUrl);
  const printWindow = window.open('', '_blank', 'width=320,height=620');
  if (!printWindow) return;

  const billNo = (bill as any).billNumber || bill.id;

  const billHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Bill #${billNo}</title>
      <style>${BILL_CSS}</style>
    </head>
    <body>
      ${buildBillBody(bill, billNo, logoDataUrl)}
      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
            // Close window after print dialog opens
            setTimeout(function() {
              window.close();
            }, 500);
          }, 100);
        };
      <\/script>
    </body>
    </html>
  `;

  printWindow.document.write(billHTML);
  printWindow.document.close();
};
