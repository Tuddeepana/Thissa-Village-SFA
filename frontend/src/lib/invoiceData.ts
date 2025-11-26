import { Invoice } from '@/types/invoice';

// Generate sample invoices for demonstration
export const generateSampleInvoices = (): Invoice[] => {
  const invoices: Invoice[] = [];
  const categories = ['Beverages', 'Food', 'Snacks', 'Dairy', 'Bakery'];
  const products = [
    { name: 'Coca Cola', category: 'Beverages', price: 150 },
    { name: 'Pepsi', category: 'Beverages', price: 140 },
    { name: 'Bread', category: 'Bakery', price: 80 },
    { name: 'Milk', category: 'Dairy', price: 200 },
    { name: 'Cheese', category: 'Dairy', price: 450 },
    { name: 'Chips', category: 'Snacks', price: 120 },
    { name: 'Cookies', category: 'Bakery', price: 95 },
    { name: 'Rice', category: 'Food', price: 180 },
    { name: 'Pasta', category: 'Food', price: 220 },
    { name: 'Juice', category: 'Beverages', price: 175 },
  ];

  const names = ['John Doe', 'Jane Smith', 'Bob Johnson', 'Alice Williams', 'Charlie Brown'];
  const paymentMethods: ('cash' | 'card' | 'other')[] = ['cash', 'card', 'other'];
  const statuses: ('paid' | 'pending' | 'cancelled')[] = ['paid', 'paid', 'paid', 'pending'];

  // Generate invoices for the past 12 months
  const today = new Date();
  for (let monthOffset = 0; monthOffset < 12; monthOffset++) {
    const monthDate = new Date(today.getFullYear(), today.getMonth() - monthOffset, 1);
    const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
    
    // Generate 5-15 invoices per month
    const invoiceCount = Math.floor(Math.random() * 10) + 5;
    
    for (let i = 0; i < invoiceCount; i++) {
      const day = Math.floor(Math.random() * daysInMonth) + 1;
      const invoiceDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), day);
      
      // Some dates might not have invoices
      if (Math.random() > 0.9) continue;
      
      const itemCount = Math.floor(Math.random() * 5) + 1;
      const items = [];
      let subtotal = 0;
      
      for (let j = 0; j < itemCount; j++) {
        const product = products[Math.floor(Math.random() * products.length)];
        const quantity = Math.floor(Math.random() * 5) + 1;
        const total = product.price * quantity;
        
        items.push({
          productId: `prod-${Math.random().toString(36).substr(2, 9)}`,
          productName: product.name,
          category: product.category,
          quantity,
          unitPrice: product.price,
          total,
        });
        
        subtotal += total;
      }
      
      const tax = subtotal * 0.15; // 15% tax
      const discount = Math.random() > 0.7 ? subtotal * 0.1 : 0; // 10% discount sometimes
      const total = subtotal + tax - discount;
      
      const invoiceNumber = `INV-${monthDate.getFullYear()}${String(monthDate.getMonth() + 1).padStart(2, '0')}${String(invoices.length + 1).padStart(4, '0')}`;
      
      invoices.push({
        id: `inv-${Math.random().toString(36).substr(2, 9)}`,
        invoiceNumber,
        date: invoiceDate,
        customerName: names[Math.floor(Math.random() * names.length)],
        customerPhone: `077${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`,
        items,
        subtotal,
        tax,
        discount,
        total,
        paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        createdAt: invoiceDate,
        updatedAt: invoiceDate,
      });
    }
  }
  
  return invoices.sort((a, b) => b.date.getTime() - a.date.getTime());
};

export const mockInvoices = generateSampleInvoices();
