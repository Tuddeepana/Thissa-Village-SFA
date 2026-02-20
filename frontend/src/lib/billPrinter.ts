import { Bill } from '@/types/pos';
import { format } from 'date-fns';

/* ─────────────────────────────────────────────────────────────────
   Shared CSS for both print functions
   Key thermal-printer considerations:
   • font-weight: 500 on body  → slightly heavier strokes so thin
     characters don't "wash out" on thermal heads, without making
     everything look bold
   • letter-spacing on non-bold text → slightly wider strokes read better
   • @page size: 80mm auto   → height follows content, no blank tail
   • All margins/padding kept tight so the paper cut lands right after
     the last line
───────────────────────────────────────────────────────────────── */
const BILL_CSS = `
  @media print {
    @page {
      size: 80mm auto;
      margin: 0;
    }
    body { margin: 0; padding: 0; }
    .no-print { display: none !important; }
  }

  * { box-sizing: border-box; }

  body {
    font-family: 'Courier New', Courier, monospace;
    font-size: 11.5px;
    font-weight: 500;          /* medium weight → better thermal visibility */
    line-height: 1.45;
    letter-spacing: 0.01em;
    width: 80mm;
    max-width: 80mm;
    margin: 0 auto;
    padding: 4mm 4mm 3mm 4mm;
    color: #000;
  }

  /* ── Header ────────────────────────────────────────────── */
  .header {
    text-align: center;
    padding-bottom: 5px;
    margin-bottom: 5px;
    border-bottom: 2px solid #000;
  }
  .store-name {
    font-size: 17px;
    font-weight: 900;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    margin-bottom: 2px;
  }
  .store-tagline {
    font-size: 9.5px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    font-weight: 500;
    margin-bottom: 1px;
  }
  .divider-thick  { border: none; border-top: 2px solid #000; margin: 4px 0; }
  .divider-dashed { border: none; border-top: 1px dashed #000; margin: 4px 0; }
  .divider-thin   { border: none; border-top: 1px solid #000; margin: 4px 0; }

  /* ── Bill meta info ─────────────────────────────────────── */
  .info-row {
    display: flex;
    justify-content: space-between;
    margin: 2px 0;
  }
  .info-label { font-weight: 700; }

  /* ── Items table ────────────────────────────────────────── */
  .items-table {
    width: 100%;
    border-collapse: collapse;
    margin: 4px 0;
  }
  .items-table thead tr {
    border-top: 1px solid #000;
    border-bottom: 1px solid #000;
  }
  .items-table th {
    font-weight: 700;
    font-size: 10.5px;
    letter-spacing: 0.04em;
    padding: 3px 2px;
    text-align: left;
  }
  .items-table th.r { text-align: right; }
  .items-table td {
    font-size: 11px;
    font-weight: 500;
    padding: 2px 2px;
    vertical-align: top;
  }
  .items-table td.r { text-align: right; white-space: nowrap; }
  .col-name  { max-width: 33mm; word-break: break-word; }
  .col-vol   { width: 10mm; }
  .col-qty   { width: 8mm; }
  .col-price { width: 14mm; }
  .col-total { width: 14mm; }

  /* ── Totals ─────────────────────────────────────────────── */
  .totals { margin: 2px 0; }
  .total-row {
    display: flex;
    justify-content: space-between;
    margin: 2px 0;
    font-size: 11px;
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

  /* ── Payment info ───────────────────────────────────────── */
  .payment-section { margin: 3px 0; }
  .payment-row {
    display: flex;
    justify-content: space-between;
    margin: 2px 0;
    font-size: 11px;
  }
  .payment-label  { font-weight: 700; }
  .credit-badge {
    display: inline-block;
    font-weight: 900;
    letter-spacing: 0.06em;
  }
  .credit-note-box {
    margin-top: 3px;
    padding: 3px 4px;
    border: 1px dashed #000;
    font-size: 10px;
  }
  .credit-note-title { font-weight: 700; margin-bottom: 1px; }

  /* ── Footer ─────────────────────────────────────────────── */
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
    font-size: 10px;
    font-weight: 500;
    margin-top: 1px;
    letter-spacing: 0.04em;
  }
  .footer-powered {
    font-size: 9px;
    font-weight: 500;
    letter-spacing: 0.08em;
    margin-top: 5px;
    text-transform: uppercase;
  }
`;

const buildBillBody = (bill: Bill, billNo: string | number, storeName: string) => `
  <div class="header">
    <div class="store-name">${storeName}</div>
    <div class="store-tagline">Point of Sale</div>
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
  ${(bill as any).customerPhone ? `
  <div class="info-row">
    <span class="info-label">Phone</span>
    <span>${(bill as any).customerPhone}</span>
  </div>` : ''}

  <hr class="divider-dashed">

  <table class="items-table">
    <thead>
      <tr>
        <th class="col-name">Item</th>
        <th class="col-vol r">Vol</th>
        <th class="col-qty r">Qty</th>
        <th class="col-price r">Price</th>
        <th class="col-total r">Total</th>
      </tr>
    </thead>
    <tbody>
      ${bill.items.map(item => `
      <tr>
        <td class="col-name">${item.product.name}</td>
        <td class="col-vol r">${(item as any).product?.bottleVolume ?? '-'}</td>
        <td class="col-qty r">${item.quantity}</td>
        <td class="col-price r">${item.product.price.toFixed(2)}</td>
        <td class="col-total r">${item.subtotal.toFixed(2)}</td>
      </tr>`).join('')}
    </tbody>
  </table>

  <hr class="divider-dashed">

  <div class="totals">
    <div class="total-row">
      <span>Subtotal</span>
      <span>Rs. ${bill.subtotal.toFixed(2)}</span>
    </div>
    <div class="total-row">
      <span>Tax (${bill.taxRate}%)</span>
      <span>Rs. ${bill.tax.toFixed(2)}</span>
    </div>
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
      <span class="payment-label">Paid</span>
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
    ${(bill as any).creditDescription ? `
    <div class="credit-note-box">
      <div class="credit-note-title">Credit Note:</div>
      <div>${(bill as any).creditDescription}</div>
    </div>` : ''}`}
  </div>

  <hr class="divider-thick">

  <div class="footer">
    <div class="footer-thanks">Thank You For Your Business!</div>
    <div class="footer-sub">Come Again !</div>
    <hr class="divider-dashed" style="margin: 4px 10px;">
    <div class="footer-powered">Powered by Wrenix Pvt Ltd &nbsp;|&nbsp; v.001</div>
  </div>
`;

export const printBill = (bill: Bill, storeName: string = "Tissa Village") => {
  // Create a hidden iframe for printing
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
      ${buildBillBody(bill, bill.id, storeName)}
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

// Alternative: Generate print-friendly content in new window
export const printBillNewWindow = (bill: Bill, storeName: string = "Thissa Village") => {
  const printWindow = window.open('', '_blank', 'width=320,height=600');
  if (!printWindow) return;

  const billNo = (bill as any).billNumber || bill.id;

  const billHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Bill #${billNo}</title>
      <style>
        ${BILL_CSS}
        /* Screen-only print button bar */
        .no-print {
          text-align: center;
          margin: 8px 0 4px 0;
        }
        .no-print button {
          padding: 8px 18px;
          margin: 4px;
          cursor: pointer;
          font-size: 13px;
          border: 1px solid #000;
          background: #fff;
          font-family: inherit;
        }
        .no-print button:hover { background: #f0f0f0; }
      </style>
    </head>
    <body>
      ${buildBillBody(bill, billNo, storeName)}
      <div class="no-print">
        <button onclick="window.print()">&#128438; Print Bill</button>
        <button onclick="window.close()">&#10005; Close</button>
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(billHTML);
  printWindow.document.close();
};
