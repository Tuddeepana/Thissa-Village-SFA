import { format, differenceInHours, differenceInDays } from 'date-fns';
import logoUrl from '@/assets/images/resturent_logo.png';
import pkg from '../../package.json';

// Re-use cached logo data URL (shared cache)
let cachedLogoDataUrl: string | null = null;

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

/* ─────────────────────────────────────────────────────────────
   Same CSS as POS bill – 80mm thermal receipt format
───────────────────────────────────────────────────────────── */
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
    filter: invert(1);
  }
  .logo-fallback {
    font-size: 17px;
    font-weight: 900;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }
  .bill-type-label {
    font-size: 13px;
    font-weight: 900;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-top: 3px;
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

  /* ── Section heading ─────────────────────────────────────── */
  .section-title {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    margin: 5px 0 2px 0;
    border-bottom: 1px solid #000;
    padding-bottom: 2px;
  }

  /* ── Rooms table ─────────────────────────────────────────── */
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
  .col-room  { word-break: break-word; white-space: normal; }
  .col-price { width: 18mm; }

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

  .no-print { text-align: center; margin: 8px 0 4px 0; }
  .no-print button {
    padding: 8px 18px; margin: 4px; cursor: pointer;
    font-size: 13px; border: 1px solid #000;
    background: #fff; font-family: inherit;
  }
  .no-print button:hover { background: #f0f0f0; }
`;

export interface RoomBillData {
  billNumber?: string;
  bookingId: string;
  customerName: string;
  customerPhone?: string;
  customerNic?: string;
  customerAddress?: string;
  cashierName?: string;
  checkInDate: string;    // ISO string
  checkOutDate: string;   // ISO string
  bookedRooms: {
    roomName: string;
    pricePerNight: number;
  }[];
  totalAmount: number;
  paidAmount: number;
  paymentType: 'FULL_PAYMENT' | 'ADVANCE_PAYMENT' | 'ON_CALL';
  paymentMethod?: string; // e.g. CASH, CARD, CREDIT
  cashGiven?: number;
  balanceGiven?: number;
  createdAt?: string;     // booking date ISO string
}

const getBookingTypeLabel = (checkIn: Date, checkOut: Date) => {
  const hours = differenceInHours(checkOut, checkIn);
  const days  = differenceInDays(checkOut, checkIn);
  if (hours <= 6 && days === 0) {
    return { type: 'Short Time', duration: `${hours} hour${hours !== 1 ? 's' : ''}` };
  }
  const nights = days > 0 ? days : 1;
  return { type: 'Full Time', duration: `${nights} night${nights !== 1 ? 's' : ''}` };
};

const buildRoomBillBody = (data: RoomBillData, logoDataUrl: string) => {
  const checkIn  = new Date(data.checkInDate);
  const checkOut = new Date(data.checkOutDate);
  const bookingInfo = getBookingTypeLabel(checkIn, checkOut);
  const billRef = data.billNumber || data.bookingId;
  const printDate = format(new Date(), 'dd/MM/yyyy HH:mm:ss');
  const dueAmount = data.totalAmount - data.paidAmount;

  const paymentTypeLabel =
    data.paymentType === 'FULL_PAYMENT'    ? 'Full Payment' :
    data.paymentType === 'ADVANCE_PAYMENT' ? 'Advance Payment' :
                                              'On-Call Booking';

  const paymentMethodLabel = data.paymentMethod
    ? data.paymentMethod.toUpperCase()
    : '-';

  return `
  <div class="header">
    ${logoDataUrl
      ? `<img class="logo-img" src="${logoDataUrl}" alt="Tissa Village" />`
      : `<div class="logo-fallback">Tissa Village</div>`
    }
    <div class="bill-type-label">Room Booking Bill</div>
  </div>

  <div class="info-row">
    <span class="info-label">Bill #</span>
    <span>${billRef}</span>
  </div>
  <div class="info-row">
    <span class="info-label">Printed</span>
    <span>${printDate}</span>
  </div>
  ${data.createdAt ? `
  <div class="info-row">
    <span class="info-label">Booked On</span>
    <span>${format(new Date(data.createdAt), 'dd/MM/yyyy HH:mm')}</span>
  </div>` : ''}

  <hr class="div-dashed">

  <div class="section-title">Customer</div>
  <div class="info-row">
    <span class="info-label">Name</span>
    <span>${data.customerName}</span>
  </div>
  ${data.customerPhone ? `
  <div class="info-row">
    <span class="info-label">Phone</span>
    <span>${data.customerPhone}</span>
  </div>` : ''}
  ${data.customerNic ? `
  <div class="info-row">
    <span class="info-label">NIC</span>
    <span>${data.customerNic}</span>
  </div>` : ''}
  ${data.customerAddress ? `
  <div class="info-row">
    <span class="info-label">Address</span>
    <span style="max-width:52mm;text-align:right;word-break:break-word;">${data.customerAddress}</span>
  </div>` : ''}
  ${data.cashierName ? `
  <div class="info-row">
    <span class="info-label">Cashier</span>
    <span>${data.cashierName}</span>
  </div>` : ''}

  <hr class="div-dashed">

  <div class="section-title">Stay Details</div>
  <div class="info-row">
    <span class="info-label">Check-In</span>
    <span>${format(checkIn, 'dd/MM/yyyy HH:mm')}</span>
  </div>
  <div class="info-row">
    <span class="info-label">Check-Out</span>
    <span>${format(checkOut, 'dd/MM/yyyy HH:mm')}</span>
  </div>
  <div class="info-row">
    <span class="info-label">Duration</span>
    <span>${bookingInfo.type} (${bookingInfo.duration})</span>
  </div>

  <hr class="div-dashed">

  <div class="section-title">Rooms</div>
  <table class="items-table">
    <thead>
      <tr>
        <th class="col-room">Room</th>
        <th class="col-price r">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${data.bookedRooms.map(room => `
      <tr>
        <td class="col-room">${room.roomName}</td>
        <td class="col-price r">Rs. ${Number(room.pricePerNight).toFixed(2)}</td>
      </tr>`).join('')}
    </tbody>
  </table>

  <hr class="div-dashed">

  <div class="totals">
    <div class="grand-total-row">
      <span>TOTAL</span>
      <span>Rs. ${Number(data.totalAmount).toFixed(2)}</span>
    </div>
    ${data.paidAmount > 0 ? `
    <div class="total-row">
      <span>Paid Amount</span>
      <span>Rs. ${Number(data.paidAmount).toFixed(2)}</span>
    </div>` : ''}
    ${dueAmount > 0.009 ? `
    <div class="total-row" style="font-weight:700;">
      <span>Balance Due</span>
      <span>Rs. ${dueAmount.toFixed(2)}</span>
    </div>` : ''}
  </div>

  <div class="payment-section">
    <div class="payment-row">
      <span class="payment-label">Payment Type</span>
      <span>${paymentTypeLabel}</span>
    </div>
    ${data.paymentMethod ? `
    <div class="payment-row">
      <span class="payment-label">Method</span>
      <span>${paymentMethodLabel}</span>
    </div>` : ''}
    ${data.cashGiven != null && data.cashGiven > 0 ? `
    <div class="payment-row">
      <span class="payment-label">Cash Given</span>
      <span>Rs. ${Number(data.cashGiven).toFixed(2)}</span>
    </div>` : ''}
    ${data.balanceGiven != null && data.balanceGiven > 0 ? `
    <div class="payment-row">
      <span class="payment-label">Change</span>
      <span>Rs. ${Number(data.balanceGiven).toFixed(2)}</span>
    </div>` : ''}
  </div>

  <hr class="div-thick">

  <div class="footer">
    <div class="footer-thanks">Thank You For Staying!</div>
    <div class="footer-sub">Come Again!</div>
    <hr class="div-dashed" style="margin:4px 12px;">
    <div class="footer-powered">Powered by Wrenix Pvt Ltd &nbsp;|&nbsp; v${pkg.version.replace(/[^0-9.]/g, '')}</div>
  </div>
`;
};

/** Print room booking bill in a new window (auto-prints and closes) */
export const printRoomBill = async (data: RoomBillData): Promise<void> => {
  const logoDataUrl = await toDataURL(logoUrl);
  const printWindow = window.open('', '_blank', 'width=320,height=700');
  if (!printWindow) return;

  const billRef = data.billNumber || data.bookingId;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Room Bill #${billRef}</title>
      <style>${BILL_CSS}</style>
    </head>
    <body>
      ${buildRoomBillBody(data, logoDataUrl)}
      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          }, 100);
        };
      <\/script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};
