import { Bill } from '@/types/pos';
import { format } from 'date-fns';

export const printBill = (bill: Bill, storeName: string = "VinoPOS Pro") => {
  // Create a hidden iframe for printing
  const printFrame = document.createElement('iframe');
  printFrame.style.position = 'absolute';
  printFrame.style.width = '0';
  printFrame.style.height = '0';
  printFrame.style.border = 'none';
  document.body.appendChild(printFrame);

  const printDocument = printFrame.contentWindow?.document;
  if (!printDocument) return;

  // Generate thermal printer friendly HTML
  const billHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Bill #${bill.id}</title>
      <style>
        @media print {
          @page {
            size: 80mm auto;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
          }
        }
        
        body {
          font-family: 'Courier New', monospace;
          font-size: 12px;
          line-height: 1.4;
          width: 80mm;
          margin: 0 auto;
          padding: 5mm;
        }
        
        .center {
          text-align: center;
        }
        
        .bold {
          font-weight: bold;
        }
        
        .header {
          text-align: center;
          margin-bottom: 10px;
          border-bottom: 1px dashed #000;
          padding-bottom: 10px;
        }
        
        .store-name {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        
        .info-line {
          margin: 3px 0;
        }
        
        .items-table {
          width: 100%;
          margin: 10px 0;
          border-collapse: collapse;
        }
        
        .items-table th {
          text-align: left;
          border-bottom: 1px solid #000;
          padding: 5px 0;
        }
        
        .items-table td {
          padding: 3px 0;
        }
        
        .item-name {
          max-width: 40mm;
          word-wrap: break-word;
        }
        
        .text-right {
          text-align: right;
        }
        
        .totals {
          border-top: 1px dashed #000;
          margin-top: 10px;
          padding-top: 10px;
        }
        
        .total-line {
          display: flex;
          justify-content: space-between;
          margin: 3px 0;
        }
        
        .grand-total {
          font-size: 16px;
          font-weight: bold;
          border-top: 1px solid #000;
          border-bottom: 1px solid #000;
          padding: 5px 0;
          margin: 5px 0;
        }
        
        .footer {
          text-align: center;
          margin-top: 15px;
          border-top: 1px dashed #000;
          padding-top: 10px;
          font-size: 11px;
        }
        
        .payment-info {
          margin: 10px 0;
          border-top: 1px dashed #000;
          border-bottom: 1px dashed #000;
          padding: 5px 0;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="store-name">${storeName}</div>
        <div>Point of Sale System</div>
      </div>
      
      <div class="info-line">
        <strong>Bill #:</strong> ${bill.id}
      </div>
      <div class="info-line">
        <strong>Date:</strong> ${format(bill.createdAt, 'dd/MM/yyyy HH:mm:ss')}
      </div>
      ${bill.customerName ? `<div class="info-line"><strong>Customer:</strong> ${bill.customerName}</div>` : ''}
      ${bill.customerPhone ? `<div class="info-line"><strong>Phone:</strong> ${bill.customerPhone}</div>` : ''}
      
      <table class="items-table">
        <thead>
          <tr>
            <th>Item</th>
            <th class="text-right">Qty</th>
            <th class="text-right">Price</th>
            <th class="text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          ${bill.items.map(item => `
            <tr>
              <td class="item-name">${item.product.name}</td>
              <td class="text-right">${item.quantity}</td>
              <td class="text-right">${item.product.price.toFixed(2)}</td>
              <td class="text-right">${item.subtotal.toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="totals">
        <div class="total-line">
          <span>Subtotal:</span>
          <span>Rs. ${bill.subtotal.toFixed(2)}</span>
        </div>
        <div class="total-line">
          <span>Tax (${bill.taxRate}%):</span>
          <span>Rs. ${bill.tax.toFixed(2)}</span>
        </div>
        ${bill.discount > 0 ? `
          <div class="total-line">
            <span>Discount (${bill.discountRate}%):</span>
            <span>- Rs. ${bill.discount.toFixed(2)}</span>
          </div>
        ` : ''}
        
        <div class="total-line grand-total">
          <span>TOTAL:</span>
          <span>Rs. ${bill.total.toFixed(2)}</span>
        </div>
      </div>
      
      <div class="payment-info">
        <div class="total-line">
          <span>Payment Method:</span>
          <span class="bold">${bill.paymentMethod.toUpperCase()}</span>
        </div>
        <div class="total-line">
          <span>Amount Paid:</span>
          <span>Rs. ${bill.amountPaid.toFixed(2)}</span>
        </div>
        ${bill.change > 0 ? `
          <div class="total-line">
            <span>Change:</span>
            <span>Rs. ${bill.change.toFixed(2)}</span>
          </div>
        ` : ''}
      </div>
      
      <div class="footer">
        <div>Thank you for your business!</div>
        <div>Please come again</div>
        <div style="margin-top: 10px;">---</div>
        <div>Powered by VinoPOS Pro</div>
      </div>
      
      <script>
        window.onload = function() {
          window.print();
          setTimeout(function() {
            window.parent.document.body.removeChild(window.frameElement);
          }, 100);
        };
      </script>
    </body>
    </html>
  `;

  printDocument.open();
  printDocument.write(billHTML);
  printDocument.close();
};

// Alternative: Generate print-friendly content in new window
export const printBillNewWindow = (bill: Bill, storeName: string = "VinoPOS Pro") => {
  const printWindow = window.open('', '_blank', 'width=302,height=500');
  if (!printWindow) return;

  const billHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Bill #${bill.id}</title>
      <style>
        @media print {
          @page {
            size: 80mm auto;
            margin: 0;
          }
        }
        body {
          font-family: 'Courier New', monospace;
          font-size: 12px;
          line-height: 1.4;
          width: 80mm;
          margin: 0 auto;
          padding: 5mm;
        }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .header {
          text-align: center;
          margin-bottom: 10px;
          border-bottom: 1px dashed #000;
          padding-bottom: 10px;
        }
        .store-name {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .info-line { margin: 3px 0; }
        .items-table {
          width: 100%;
          margin: 10px 0;
          border-collapse: collapse;
        }
        .items-table th {
          text-align: left;
          border-bottom: 1px solid #000;
          padding: 5px 0;
        }
        .items-table td { padding: 3px 0; }
        .text-right { text-align: right; }
        .totals {
          border-top: 1px dashed #000;
          margin-top: 10px;
          padding-top: 10px;
        }
        .total-line {
          display: flex;
          justify-content: space-between;
          margin: 3px 0;
        }
        .grand-total {
          font-size: 16px;
          font-weight: bold;
          border-top: 1px solid #000;
          border-bottom: 1px solid #000;
          padding: 5px 0;
          margin: 5px 0;
        }
        .footer {
          text-align: center;
          margin-top: 15px;
          border-top: 1px dashed #000;
          padding-top: 10px;
          font-size: 11px;
        }
        .payment-info {
          margin: 10px 0;
          border-top: 1px dashed #000;
          border-bottom: 1px dashed #000;
          padding: 5px 0;
        }
        .no-print {
          text-align: center;
          margin: 10px 0;
        }
        @media print {
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="store-name">${storeName}</div>
        <div>Point of Sale System</div>
      </div>
      
      <div class="info-line"><strong>Bill #:</strong> ${bill.id}</div>
      <div class="info-line"><strong>Date:</strong> ${format(bill.createdAt, 'dd/MM/yyyy HH:mm:ss')}</div>
      ${bill.customerName ? `<div class="info-line"><strong>Customer:</strong> ${bill.customerName}</div>` : ''}
      ${bill.customerPhone ? `<div class="info-line"><strong>Phone:</strong> ${bill.customerPhone}</div>` : ''}
      
      <table class="items-table">
        <thead>
          <tr>
            <th>Item</th>
            <th class="text-right">Qty</th>
            <th class="text-right">Price</th>
            <th class="text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          ${bill.items.map(item => `
            <tr>
              <td>${item.product.name}</td>
              <td class="text-right">${item.quantity}</td>
              <td class="text-right">${item.product.price.toFixed(2)}</td>
              <td class="text-right">${item.subtotal.toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="totals">
        <div class="total-line">
          <span>Subtotal:</span>
          <span>Rs. ${bill.subtotal.toFixed(2)}</span>
        </div>
        <div class="total-line">
          <span>Tax (${bill.taxRate}%):</span>
          <span>Rs. ${bill.tax.toFixed(2)}</span>
        </div>
        ${bill.discount > 0 ? `
          <div class="total-line">
            <span>Discount (${bill.discountRate}%):</span>
            <span>- Rs. ${bill.discount.toFixed(2)}</span>
          </div>
        ` : ''}
        
        <div class="total-line grand-total">
          <span>TOTAL:</span>
          <span>Rs. ${bill.total.toFixed(2)}</span>
        </div>
      </div>
      
      <div class="payment-info">
        <div class="total-line">
          <span>Payment Method:</span>
          <span class="bold">${bill.paymentMethod.toUpperCase()}</span>
        </div>
        <div class="total-line">
          <span>Amount Paid:</span>
          <span>Rs. ${bill.amountPaid.toFixed(2)}</span>
        </div>
        ${bill.change > 0 ? `
          <div class="total-line">
            <span>Change:</span>
            <span>Rs. ${bill.change.toFixed(2)}</span>
          </div>
        ` : ''}
      </div>
      
      <div class="footer">
        <div>Thank you for your business!</div>
        <div>Please come again</div>
        <div style="margin-top: 10px;">---</div>
        <div>Powered by VinoPOS Pro</div>
      </div>
      
      <div class="no-print">
        <button onclick="window.print()" style="padding: 10px 20px; margin: 10px; cursor: pointer;">Print Bill</button>
        <button onclick="window.close()" style="padding: 10px 20px; margin: 10px; cursor: pointer;">Close</button>
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(billHTML);
  printWindow.document.close();
};
