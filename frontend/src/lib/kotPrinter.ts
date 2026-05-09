import { format } from 'date-fns';
import logoUrl from '@/assets/images/resturent_logo.png';

// Reuse the same logo caching pattern from billPrinter
let cachedLogoDataUrl: string | null = null;

const toDataURL = async (url: string): Promise<string> => {
  if (cachedLogoDataUrl) return cachedLogoDataUrl;
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        cachedLogoDataUrl = result;
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
   KOT Slip CSS — 80mm thermal printer, same base as bill printer
   but simplified for kitchen use (no prices, no totals)
───────────────────────────────────────────────────────────────── */
const KOT_CSS = `
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
    filter: invert(1);
  }
  .logo-fallback {
    font-size: 17px;
    font-weight: 900;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  /* ── KOT Title ───────────────────────────────────────────── */
  .kot-title {
    text-align: center;
    font-size: 16px;
    font-weight: 900;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    padding: 4px 0;
    margin: 3px 0;
    border: 2px solid #000;
  }

  /* ── Dividers ────────────────────────────────────────────── */
  .div-thick  { border: none; border-top: 2px solid #000; margin: 4px 0; }
  .div-dashed { border: none; border-top: 1px dashed #000; margin: 5px 0; }

  /* ── Info rows ──────────────────────────────────────────── */
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
    font-size: 12px;
    font-weight: 700;
    padding: 3px 2px;
    vertical-align: top;
    overflow: hidden;
  }
  .items-table td.r { text-align: right; white-space: nowrap; }
  .col-name  { word-break: break-word; white-space: normal; }
  .col-qty   { width: 12mm; }

  /* ── Remark box ──────────────────────────────────────────── */
  .remark-box {
    margin: 5px 0;
    padding: 4px 5px;
    border: 2px dashed #000;
    font-size: 11.5px;
  }
  .remark-title {
    font-weight: 900;
    font-size: 11px;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    margin-bottom: 2px;
  }
  .remark-text {
    font-weight: 700;
    font-style: italic;
  }

  /* ── Footer ──────────────────────────────────────────────── */
  .footer {
    text-align: center;
    padding-top: 4px;
    margin-top: 2px;
  }
  .footer-label {
    font-size: 13px;
    font-weight: 900;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 3px 0;
    border-top: 2px solid #000;
    border-bottom: 2px solid #000;
  }
`;

export interface KotSlipData {
  tableName: string;
  orderType: string;
  stewardName: string;
  cashierName: string;
  customerName?: string;
  remark?: string;
  items: { product_name: string; quantity: number; unit?: string }[];
}

const buildKotSlipBody = (data: KotSlipData, logoDataUrl: string): string => `
  <div class="header">
    ${logoDataUrl
      ? `<img class="logo-img" src="${logoDataUrl}" alt="Tissa Village Restaurant & Bar" />`
      : `<div class="logo-fallback">Tissa Village</div>`
    }
  </div>

  <div class="kot-title">Kitchen Order Ticket</div>

  <div class="info-row">
    <span class="info-label">Date</span>
    <span>${format(new Date(), 'dd/MM/yyyy')}</span>
  </div>
  <div class="info-row">
    <span class="info-label">Time</span>
    <span>${format(new Date(), 'HH:mm:ss')}</span>
  </div>
  <div class="info-row">
    <span class="info-label">Table</span>
    <span>${data.tableName}</span>
  </div>
  <div class="info-row">
    <span class="info-label">Type</span>
    <span>${data.orderType === 'DINE_IN' ? 'Dine In' : 'Take Away'}</span>
  </div>
  <div class="info-row">
    <span class="info-label">Steward</span>
    <span>${data.stewardName}</span>
  </div>
  <div class="info-row">
    <span class="info-label">Cashier</span>
    <span>${data.cashierName}</span>
  </div>
  ${data.customerName ? `
  <div class="info-row">
    <span class="info-label">Customer</span>
    <span>${data.customerName}</span>
  </div>` : ''}

  <hr class="div-dashed">

  ${data.remark ? `
  <div class="remark-box">
    <div class="remark-title">Kitchen Instructions:</div>
    <div class="remark-text">${data.remark}</div>
  </div>
  <hr class="div-dashed">
  ` : ''}

  <table class="items-table">
    <thead>
      <tr>
        <th class="col-name">Item</th>
        <th class="col-qty r">Qty</th>
      </tr>
    </thead>
    <tbody>
      ${data.items.map(item => {
        const nameWithUnit = item.unit
          ? `${item.product_name} (${item.unit})`
          : item.product_name;
        return `
      <tr>
        <td class="col-name">${nameWithUnit}</td>
        <td class="col-qty r">${item.quantity}</td>
      </tr>`;
      }).join('')}
    </tbody>
  </table>

  <hr class="div-thick">

  <div class="footer">
    <div class="footer-label">*** Kitchen Copy ***</div>
  </div>
`;

export const printKotSlip = async (data: KotSlipData): Promise<void> => {
  const logoDataUrl = await toDataURL(logoUrl);
  const printWindow = window.open('', '_blank', 'width=320,height=520');
  if (!printWindow) return;

  const kotHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>KOT - ${data.tableName}</title>
      <style>${KOT_CSS}</style>
    </head>
    <body>
      ${buildKotSlipBody(data, logoDataUrl)}
      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
            setTimeout(function() {
              window.close();
            }, 500);
          }, 100);
        };
      <\/script>
    </body>
    </html>
  `;

  printWindow.document.write(kotHTML);
  printWindow.document.close();
};
