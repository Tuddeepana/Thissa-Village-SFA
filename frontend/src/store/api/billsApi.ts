import { apiSlice } from './apiSlice';
import type { Bill } from '@/types/pos';

interface CreateBillPayload {
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  tax: number;
  taxRate: number;
  discount: number;
  discountRate: number;
  total: number;
  customerName?: string;
  customerPhone?: string;
  customerType?: 'local' | 'foreign';
  paymentMethod: 'cash' | 'card' | 'credit' | 'other';
  amountPaid: number;
  change: number;
  creditDescription?: string;
}

interface BillListQuery {
  page?: number;
  pageSize?: number; // Changed from 'limit' to match backend
  dateFrom?: string; // Changed from 'startDate' to match backend
  dateTo?: string; // Changed from 'endDate' to match backend
  paymentMethod?: string;
  search?: string;
  today?: boolean; // Added to match backend
}

interface BillApiResponse {
  id: string;
  bill_number?: string;
  billNo?: string;
  total: string | number;
  tax?: string | number;
  customer_name?: string;
  payment_method?: string;
  cash_given?: string | number;
  balance_given?: string | number;
  credit_note?: string;
  date?: string;
  createdAt?: string;
  item_count?: number; // Added to match backend response
}

interface PaginationResponse {
  currentPage?: number;
  pageSize?: number;
  totalRecords?: number;
  totalPages?: number;
}

export const billsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getBills: builder.query<{
      items: Bill[];
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    }, BillListQuery>({
      query: (params = {}) => ({
        url: '/bills',
        params,
      }),
      providesTags: ['Bill'],
      transformResponse: (response: { billsResponse?: { data?: BillApiResponse[]; pagination?: PaginationResponse }; data?: BillApiResponse[] }) => {
        // Backend returns: { success: true, card: {...}, billsResponse: { data: [...], pagination: {...} } }
        const billsResponse = response?.billsResponse || { data: response?.data || [], pagination: {} };
        const items = billsResponse.data || [];
        const pagination = billsResponse.pagination || {};

        // Debug logging
        console.log('=== BILLS TRANSFORM DEBUG ===');
        console.log('Raw response:', response);
        console.log('Items count:', items.length);
        if (items.length > 0) {
          console.log('First item:', items[0]);
          console.log('First item_count:', items[0].item_count);
        }

        // Map backend bill format to frontend Bill interface
        const mappedItems: Bill[] = items.map((b: BillApiResponse) => {
          // Create placeholder items array with correct count from item_count
          const itemCount = Number(b.item_count || 0);
          console.log(`Bill ${b.bill_number || b.id}: item_count=${b.item_count}, parsed=${itemCount}`);

          const placeholderItems = Array(itemCount).fill(null).map((_, index) => ({
            product: {
              id: `placeholder-${index}`,
              name: '',
              category: '',
              price: 0,
              cost: 0,
              stock: 0,
              minStock: 0,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            quantity: 0,
            subtotal: 0,
          }));

          console.log(`Created ${placeholderItems.length} placeholder items for bill ${b.bill_number || b.id}`);

          return {
            id: b.id,
            billNumber: b.bill_number || b.billNo,
            items: placeholderItems, // Placeholder array with correct count
            subtotal: Number(b.total || 0) - Number(b.tax || 0),
            tax: Number(b.tax || 0),
            taxRate: 0,
            discount: 0,
            discountRate: 0,
            total: Number(b.total || 0),
            customerName: b.customer_name,
            customerPhone: undefined,
            paymentMethod: String(b.payment_method || 'other').toLowerCase() as 'cash' | 'card' | 'credit' | 'other',
            amountPaid: Number(b.cash_given || b.total || 0),
            change: Number(b.balance_given || 0),
            creditDescription: b.credit_note,
            createdAt: new Date(b.date || b.createdAt || Date.now()),
          };
        });

        console.log('Mapped items:', mappedItems.length);
        if (mappedItems.length > 0) {
          console.log('First mapped bill items.length:', mappedItems[0].items.length);
        }
        console.log('============================');

        return {
          items: mappedItems,
          page: pagination.currentPage || 1,
          limit: pagination.pageSize || 10,
          total: pagination.totalRecords || mappedItems.length,
          totalPages: pagination.totalPages || Math.max(1, Math.ceil((pagination.totalRecords || mappedItems.length) / (pagination.pageSize || 10)))
        };
      },
    }),

    getBillById: builder.query<Bill, string>({
      query: (id) => `/bills/${id}`,
      providesTags: (result, error, id) => [{ type: 'Bill', id }],
      transformResponse: (response: unknown): Bill => {
        const resp = response as { success: boolean; data: any } | any;
        const data = (resp && typeof resp === 'object' && 'data' in resp) ? resp.data : resp;

        // Backend returns detailed shape with Items array
        if (data.Items && Array.isArray(data.Items)) {
          const items = data.Items.map((it: {
            productId?: string;
            name?: string;
            categoryName?: string;
            litres?: string | number;
            bottle_volume?: string;
            selling_price?: string | number;
            cost_price?: string | number;
            quantity_moved?: string | number;
          }) => {
            const qty = Math.abs(Number(it.quantity_moved || 0));
            const price = it.selling_price !== undefined && it.selling_price !== null ? Number(it.selling_price) : 0;

            // Build bottle volume label from litres and unit
            const litresRaw = it.litres !== undefined && it.litres !== null ? Number(it.litres) : undefined;
            const unitKey = String(it.bottle_volume ?? '').toUpperCase();
            const bottleVolume = litresRaw !== undefined && !isNaN(litresRaw)
              ? `${litresRaw} ${unitKey.toLowerCase()}`
              : undefined;

            return {
              product: {
                id: it.productId || 'unknown',
                name: it.name || 'Unknown Product',
                category: it.categoryName || 'General',
                price: price,
                cost: it.cost_price !== undefined && it.cost_price !== null ? Number(it.cost_price) : price * 0.7,
                stock: 0,
                minStock: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
                bottleVolume,
              },
              quantity: qty,
              subtotal: price * qty,
            };
          });

          const subtotalNum = Number(data.Subtotal ?? items.reduce((s: number, it) => s + it.subtotal, 0));
          const taxNum = Number(data.Tax ?? 0);
          const totalNum = Number(data.Total ?? (subtotalNum + taxNum));

          return {
            id: data.id,
            billNumber: data.bill_number || data.billNo,
            items,
            subtotal: subtotalNum,
            tax: taxNum,
            taxRate: items.length ? Math.round((taxNum / (subtotalNum || 1)) * 100) : 0,
            discount: 0,
            discountRate: 0,
            total: totalNum,
            customerName: data.customer,
            customerPhone: undefined,
            paymentMethod: String(data.PaymentMethod || 'other').toLowerCase() as 'cash' | 'card' | 'credit' | 'other',
            amountPaid: data.PaymentMethod && String(data.PaymentMethod).toLowerCase() === 'credit' ? 0 : totalNum,
            change: 0,
            creditDescription: data.creditNote,
            createdAt: new Date(data.dateTime || Date.now()),
          };
        }

        // Fallback to basic data
        return data as Bill;
      },
    }),

    createBill: builder.mutation<Bill, CreateBillPayload>({
      query: (billData) => ({
        url: '/bills',
        method: 'POST',
        body: billData,
      }),
      invalidatesTags: ['Bill', 'Product', 'Inventory', 'SalesSummary'],
      transformResponse: (response: unknown): Bill => {
        const resp = response as { data?: Bill } | Bill;
        return (resp && typeof resp === 'object' && 'data' in resp && resp.data) ? resp.data : resp as Bill;
      },
    }),

    updateBillPayment: builder.mutation<Bill, {
      id: string;
      paymentMethod: string;
      amountPaid: number;
      creditDescription?: string;
    }>({
      query: ({ id, paymentMethod, amountPaid, creditDescription }) => ({
        url: `/bills/${id}/payment`,
        method: 'PATCH',
        body: {
          payment_method: paymentMethod.toUpperCase(),
          cash_given: amountPaid,
          balance_given: amountPaid > 0 ? Math.max(0, amountPaid - (amountPaid || 0)) : 0, // Will be calculated properly in backend
          credit_note: paymentMethod === 'credit' ? creditDescription : null,
        },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Bill', id },
        'Bill',
        'SalesSummary',
      ],
      transformResponse: (response: unknown): Bill => {
        const resp = response as { data?: Bill } | Bill;
        return (resp && typeof resp === 'object' && 'data' in resp && resp.data) ? resp.data : resp as Bill;
      },
    }),

    deleteBill: builder.mutation<void, string>({
      query: (id) => ({
        url: `/bills/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Bill', id },
        'Bill',
        'Product',
        'Inventory',
        'SalesSummary',
      ],
    }),
  }),
});

export const {
  useGetBillsQuery,
  useGetBillByIdQuery,
  useUpdateBillPaymentMutation,
  // Keep these available for future use
  useCreateBillMutation,
  useDeleteBillMutation,
} = billsApiSlice;
