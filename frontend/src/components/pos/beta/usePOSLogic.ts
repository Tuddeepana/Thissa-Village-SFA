import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/api/client";
import { tableService } from "@/api/services/tableService";
import { orderService } from "@/api/services/orderService";
import { serviceChargeService } from "@/api/services/serviceChargeService";
import { kotService } from "@/api/services/kotService";
import { userService } from "@/api/services/userService";
import { printerService } from "@/api/services/printerService";
import { configService } from "@/api/services/configService";
import type { User as AppUser } from "@/types/user.types";
import { Product, BillItem, Bill, StockWarning } from "@/types/pos";
import { OrderType } from "@/types/order.types";
import { printBillNewWindow } from "@/lib/billPrinter";
import { printKotSlip } from "@/lib/kotPrinter";
import { toast } from "sonner";
import type { ExpandedTableItem } from "@/types/table.types";

type AgentStatus = "unknown" | "checking" | "online" | "offline";

export interface TableInfo {
  id: string;
  displayName: string;
  baseName: string;
  tableNumber: number;
  table_type: 'VIP' | 'NORMAL';
  status: "free" | "occupied";
  orderId?: string;
}

export interface UsePOSLogicReturn {
  // Navigation
  navigate: ReturnType<typeof useNavigate>;

  // Customer Info
  customerName: string;
  setCustomerName: (v: string) => void;
  customerPhone: string;
  setCustomerPhone: (v: string) => void;
  customerType: "local" | "foreigner";
  setCustomerType: (v: "local" | "foreigner") => void;
  orderType: "dine_in" | "take_away";
  setOrderType: (v: "dine_in" | "take_away") => void;
  selectedTable: string | null;
  setSelectedTable: (v: string | null) => void;
  selectedSteward: string;
  setSelectedSteward: (v: string) => void;
  kotRemark: string;
  setKotRemark: (v: string) => void;

  // Data
  tables: TableInfo[];
  stewards: AppUser[];
  freeTables: TableInfo[];

  // Printer
  agentStatus: AgentStatus;
  isTestingPrinter: boolean;
  checkAgentHealth: () => Promise<void>;
  handleTestPrint: () => Promise<void>;

  // Cart
  billItems: BillItem[];
  kotSentItemIds: Set<string>;

  // Calculated values
  subtotal: number;
  tax: number;
  taxRate: number;
  setTaxRate: (v: number) => void;
  discount: number;
  discountRate: number;
  setDiscountRate: (v: number) => void;
  serviceCharge: { percentage: number; isActive: boolean } | null;
  serviceChargeAmount: number;
  total: number;

  // KOT Status
  hasUnsentItems: boolean;
  allKotSent: boolean;

  // Stock
  stockWarnings: StockWarning[];

  // Loading states
  isPrinting: boolean;
  isSending: boolean;
  isSendingKot: boolean;

  // Dialogs
  isPaymentDialogOpen: boolean;
  setIsPaymentDialogOpen: (v: boolean) => void;
  isRoomBookingDialogOpen: boolean;
  setIsRoomBookingDialogOpen: (v: boolean) => void;

  // Current user
  currentUser: { name: string; terminalId: string };

  // Handlers
  handleAddProduct: (product: Product) => void;
  handleUpdateQuantity: (productId: string, newQuantity: number) => void;
  handleRemoveItem: (productId: string) => void;
  handleClearOrder: (showToast?: boolean) => void;
  handleSendKot: () => Promise<void>;
  handleCreateOrder: () => Promise<void>;
  handleTakeAwayPayment: () => void;
  handleDineInPayment: () => void;
  handleConfirmPayment: (
    paymentMethod: 'cash' | 'card' | 'credit',
    amountPaid: number,
    creditDescription?: string
  ) => void;
}

export function usePOSLogic(): UsePOSLogicReturn {
  const navigate = useNavigate();

  // Customer Info State
  const [customerName, setCustomerName] = useState(() => localStorage.getItem("pos_customerName") || "");
  const [customerPhone, setCustomerPhone] = useState(() => localStorage.getItem("pos_customerPhone") || "");
  const [customerType, setCustomerType] = useState<"local" | "foreigner">(() => (localStorage.getItem("pos_customerType") as "local" | "foreigner") || "local");
  const [orderType, setOrderType] = useState<"dine_in" | "take_away">(() => (localStorage.getItem("pos_orderType") as "dine_in" | "take_away") || "dine_in");
  const [selectedTable, setSelectedTable] = useState<string | null>(() => localStorage.getItem("pos_selectedTable") || null);
  const [selectedSteward, setSelectedSteward] = useState<string>(() => localStorage.getItem("pos_selectedSteward") || "");
  const [kotRemark, setKotRemark] = useState<string>(() => localStorage.getItem("pos_kotRemark") || "");
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [stewards, setStewards] = useState<AppUser[]>([]);
  const [isTestingPrinter, setIsTestingPrinter] = useState(false);
  const [agentStatus, setAgentStatus] = useState<AgentStatus>("unknown");

  // Products and Cart
  const [billItems, setBillItems] = useState<BillItem[]>(() => {
    try {
      const saved = localStorage.getItem("pos_billItems");
      if (!saved) return [];
      const items = JSON.parse(saved);
      return items.map((item: any) => ({
        ...item,
        product: {
          ...item.product,
          createdAt: new Date(item.product.createdAt),
          updatedAt: new Date(item.product.updatedAt),
        }
      }));
    } catch { return []; }
  });
  const [kotSentItemIds, setKotSentItemIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem("pos_kotSentItemIds");
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });
  const [unlinkedKotIds, setUnlinkedKotIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem("pos_unlinkedKotIds");
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });
  const [taxRate, setTaxRate] = useState(() => {
    const saved = localStorage.getItem("pos_taxRate");
    return saved ? parseFloat(saved) : 0;
  });
  const [discountRate, setDiscountRate] = useState(() => {
    const saved = localStorage.getItem("pos_discountRate");
    return saved ? parseFloat(saved) : 0;
  });
  const [serviceCharge, setServiceCharge] = useState<{ percentage: number; isActive: boolean } | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isRoomBookingDialogOpen, setIsRoomBookingDialogOpen] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSendingKot, setIsSendingKot] = useState(false);

  // Refs
  const tableAbortRef = useRef<AbortController | null>(null);
  const tableFetchInProgressRef = useRef(false);

  // Current user
  const currentUser = {
    name: (() => {
      try {
        const raw = localStorage.getItem("authUser");
        if (!raw) return "Cashier";
        const user = JSON.parse(raw);
        return user?.name ?? "Cashier";
      } catch {
        return "Cashier";
      }
    })(),
    terminalId: "T-001",
  };

  // Persist cart data immediately
  useEffect(() => {
    localStorage.setItem("pos_billItems", JSON.stringify(billItems));
    localStorage.setItem("pos_kotSentItemIds", JSON.stringify(Array.from(kotSentItemIds)));
    localStorage.setItem("pos_unlinkedKotIds", JSON.stringify(Array.from(unlinkedKotIds)));
  }, [billItems, kotSentItemIds, unlinkedKotIds]);

  // Persist form fields with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem("pos_customerName", customerName);
      localStorage.setItem("pos_customerPhone", customerPhone);
      localStorage.setItem("pos_customerType", customerType);
      localStorage.setItem("pos_orderType", orderType);
      if (selectedTable) {
        localStorage.setItem("pos_selectedTable", selectedTable);
      } else {
        localStorage.removeItem("pos_selectedTable");
      }
      localStorage.setItem("pos_taxRate", taxRate.toString());
      localStorage.setItem("pos_discountRate", discountRate.toString());
      localStorage.setItem("pos_selectedSteward", selectedSteward);
      localStorage.setItem("pos_kotRemark", kotRemark);
    }, 500);
    return () => clearTimeout(timer);
  }, [customerName, customerPhone, customerType, orderType, selectedTable, taxRate, discountRate, selectedSteward, kotRemark]);

  // Check agent health
  const checkAgentHealth = useCallback(async () => {
    setAgentStatus("checking");
    try {
      const urlConfig = await configService.get("PRINT_AGENT_URL");
      if (urlConfig?.value) {
        await printerService.checkAgentHealth(urlConfig.value);
        setAgentStatus("online");
      } else {
        setAgentStatus("unknown");
      }
    } catch {
      setAgentStatus("offline");
    }
  }, []);

  useEffect(() => {
    checkAgentHealth();
  }, [checkAgentHealth]);

  // Fetch stewards
  useEffect(() => {
    let cancelled = false;
    const fetchStewards = async () => {
      try {
        const { users } = await userService.listUsers({ role: 'STEWARD' as any });
        if (!cancelled) setStewards(users);
      } catch (err) {
        console.error("Failed to load stewards", err);
      }
    };
    fetchStewards();
    return () => { cancelled = true; };
  }, []);

  // Unified table fetch
  const fetchTables = useCallback(async (showErrorToast = false) => {
    if (tableFetchInProgressRef.current) return;
    tableFetchInProgressRef.current = true;

    if (tableAbortRef.current) {
      tableAbortRef.current.abort();
    }
    const abortController = new AbortController();
    tableAbortRef.current = abortController;

    try {
      const statusResponse = await orderService.getTableStatus({ status: 'all' });
      if (abortController.signal.aborted) return;

      const tableStatusMap = new Map(
        (statusResponse.tables || []).map((t: any) => [t.table_id, t.status])
      );

      const baseResponse = await tableService.getExpanded();
      if (abortController.signal.aborted) return;

      const expandedTables: ExpandedTableItem[] = baseResponse.tables || [];
      const mappedTables: TableInfo[] = expandedTables.map((t) => ({
        id: t.id,
        displayName: t.displayName,
        baseName: t.baseName,
        tableNumber: t.tableNumber,
        table_type: t.table_type,
        status: (tableStatusMap.get(t.id) === 'occupied' ? 'occupied' : 'free') as 'free' | 'occupied',
        orderId: undefined,
      }));
      setTables(mappedTables);
    } catch (err: any) {
      if (err?.name === 'AbortError' || abortController.signal.aborted) return;
      console.error("Failed to load tables", err);
      if (showErrorToast) toast.error("Failed to load tables");
    } finally {
      tableFetchInProgressRef.current = false;
    }
  }, []);

  // Fetch tables on mount + poll
  useEffect(() => {
    fetchTables(true);
    let interval = setInterval(() => fetchTables(), 60000);

    const handleVisibility = () => {
      if (document.hidden) {
        clearInterval(interval);
      } else {
        fetchTables();
        interval = setInterval(() => fetchTables(), 60000);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
      if (tableAbortRef.current) tableAbortRef.current.abort();
    };
  }, [fetchTables]);

  // Fetch service charge
  useEffect(() => {
    let cancelled = false;
    const fetchServiceCharge = async () => {
      try {
        const sc = await serviceChargeService.get();
        if (cancelled) return;
        setServiceCharge({ percentage: Number(sc.percentage || 0), isActive: !!sc.isActive });
      } catch {
        if (!cancelled) setServiceCharge(null);
      }
    };
    fetchServiceCharge();
    return () => { cancelled = true; };
  }, []);

  // Calculate totals
  const subtotal = useMemo(() => billItems.reduce((sum, item) => sum + item.subtotal, 0), [billItems]);
  const tax = useMemo(() => (subtotal * taxRate) / 100, [subtotal, taxRate]);
  const discount = useMemo(() => (subtotal * discountRate) / 100, [subtotal, discountRate]);

  const serviceChargeAmount = useMemo(() => {
    if (orderType !== "dine_in") return 0;
    if (!serviceCharge?.isActive) return 0;
    const pct = Number(serviceCharge.percentage || 0);
    if (!pct) return 0;
    const base = Math.max(0, subtotal - discount);
    return (base * pct) / 100;
  }, [serviceCharge, subtotal, discount, orderType]);

  const total = useMemo(() => subtotal + tax + serviceChargeAmount - discount, [subtotal, tax, discount, serviceChargeAmount]);

  // KOT Status
  const hasUnsentItems = useMemo(() => billItems.some((item) => !kotSentItemIds.has(item.product.id)), [billItems, kotSentItemIds]);
  const allKotSent = billItems.length > 0 && !hasUnsentItems;

  // Stock warnings
  const stockWarnings = useMemo(() => {
    const warnings: StockWarning[] = [];
    for (const item of billItems) {
      if (item.product.product_type === 'HANDMADE') continue;
      if (item.product.stock <= item.product.minStock) {
        warnings.push({
          product: item.product,
          currentStock: item.product.stock,
          minStock: item.product.minStock,
          requestedQuantity: item.quantity,
        });
      }
    }
    return warnings;
  }, [billItems]);

  useEffect(() => {
    if (stockWarnings.length > 0) {
      toast.warning(`${stockWarnings.length} item(s) have low stock!`, {
        description: stockWarnings.map((w) => `${w.product.name}: ${w.currentStock} units`).join(", "),
      });
    }
  }, [stockWarnings]);

  // Free tables
  const freeTables = useMemo(() => tables.filter((t) => t.status === "free"), [tables]);

  // Update cart prices when customer type changes
  useEffect(() => {
    if (billItems.length > 0) {
      setBillItems(prevItems =>
        prevItems.map(item => {
          const localPrice = Number(item.product.localPrice) || 0;
          const foreignerPrice = Number(item.product.foreignerPrice) || 0;
          const priceToUse = customerType === "local" ? localPrice : foreignerPrice;
          return { ...item, subtotal: priceToUse * item.quantity };
        })
      );
    }
  }, [customerType]);

  // Handlers
  const handleAddProduct = (product: Product) => {
    const isHandmade = product.product_type === 'HANDMADE';
    if (!isHandmade && product.stock === 0) {
      toast.error("Product is out of stock!");
      return;
    }

    const existingItem = billItems.find((item) => item.product.id === product.id);
    const localPrice = Number(product.localPrice) || 0;
    const foreignerPrice = Number(product.foreignerPrice) || 0;
    const priceToUse = customerType === "local" ? localPrice : foreignerPrice;

    if (existingItem) {
      if (kotSentItemIds.has(product.id)) {
        toast.error("Cannot modify item after KOT is sent");
        return;
      }
      if (!isHandmade && existingItem.quantity >= product.stock) {
        toast.error("Cannot add more than available stock!");
        return;
      }
      handleUpdateQuantity(product.id, existingItem.quantity + 1);
    } else {
      if (kotSentItemIds.size > 0) {
        toast.error("Cannot add new items after KOT is sent");
        return;
      }
      const newItem: BillItem = { product, quantity: 1, subtotal: priceToUse };
      setBillItems([...billItems, newItem]);
      toast.success(`${product.name} added to order`);
    }
  };

  const handleUpdateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    if (kotSentItemIds.has(productId)) {
      toast.error("Cannot modify item after KOT is sent");
      return;
    }

    const item = billItems.find((item) => item.product.id === productId);
    if (!item) return;

    const isHandmade = item.product.product_type === 'HANDMADE';
    if (!isHandmade && newQuantity > item.product.stock) {
      toast.error("Cannot exceed available stock!");
      return;
    }

    const localPrice = Number(item.product.localPrice) || 0;
    const foreignerPrice = Number(item.product.foreignerPrice) || 0;
    const priceToUse = customerType === "local" ? localPrice : foreignerPrice;

    setBillItems(
      billItems.map((item) =>
        item.product.id === productId
          ? { ...item, quantity: newQuantity, subtotal: priceToUse * newQuantity }
          : item
      )
    );
  };

  const handleRemoveItem = (productId: string) => {
    if (kotSentItemIds.has(productId)) {
      toast.error("Cannot remove item after KOT is sent");
      return;
    }
    setBillItems(billItems.filter((item) => item.product.id !== productId));
    setKotSentItemIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(productId);
      return newSet;
    });
    toast.info("Item removed from order");
  };

  const handleClearOrder = (showToast = true) => {
    setBillItems([]);
    setKotSentItemIds(new Set());
    setUnlinkedKotIds(new Set());
    setCustomerName("");
    setCustomerPhone("");
    setCustomerType("local");
    setOrderType("dine_in");
    setSelectedTable(null);
    setSelectedSteward("");
    setKotRemark("");
    setDiscountRate(0);

    localStorage.removeItem("pos_billItems");
    localStorage.removeItem("pos_kotSentItemIds");
    localStorage.removeItem("pos_unlinkedKotIds");
    localStorage.removeItem("pos_customerName");
    localStorage.removeItem("pos_customerPhone");
    localStorage.setItem("pos_customerType", "local");
    localStorage.setItem("pos_orderType", "dine_in");
    localStorage.removeItem("pos_selectedTable");
    localStorage.removeItem("pos_selectedSteward");
    localStorage.removeItem("pos_kotRemark");
    localStorage.removeItem("pos_taxRate");
    localStorage.removeItem("pos_discountRate");

    if (showToast) toast.info("Order cleared");
  };

  const validateOrder = () => {
    if (billItems.length === 0) {
      toast.error("Please add items to the order");
      return false;
    }
    if (orderType === "take_away" && !customerName.trim()) {
      toast.error("Please enter a customer name for Take Away orders");
      return false;
    }
    if (orderType === "dine_in" && !selectedTable) {
      toast.error("Please select a table for dine-in order");
      return false;
    }
    if (!selectedSteward) {
      toast.error("Please select a steward");
      return false;
    }
    return true;
  };

  const handleSendKot = async () => {
    if (billItems.length === 0) {
      toast.error("Please add items to the order first");
      return;
    }
    if (!selectedSteward) {
      toast.error("Please select a steward before sending KOT");
      return;
    }
    if (orderType === "dine_in" && !selectedTable) {
      toast.error("Please select a table before sending KOT");
      return;
    }

    const unsentItems = billItems.filter(item => !kotSentItemIds.has(item.product.id));
    if (unsentItems.length === 0) return;

    try {
      setIsSendingKot(true);
      const selectedTableInfo = orderType === "dine_in" ? tables.find(t => t.id === selectedTable) : null;
      const stewardObj = stewards.find(s => s.id === selectedSteward);
      const stewardName = stewardObj?.name || selectedSteward || currentUser.name;
      const tableName = selectedTableInfo?.displayName || "Take Away";
      const kotOrderType = orderType === "dine_in" ? OrderType.DINE_IN : OrderType.TAKE_AWAY;

      const kotLogResponse = await kotService.createKotLog({
        steward: stewardName,
        table_name: tableName,
        order_type: kotOrderType,
        total_amount: Number(total.toFixed(2)),
        remark: kotRemark || undefined,
        items: unsentItems.map(item => ({
          product_name: item.product.name,
          quantity: item.quantity,
          unit: item.product.unit || undefined
        }))
      });

      await printKotSlip({
        kotId: kotLogResponse.kotLog?.kot_number || undefined,
        tableName,
        orderType: kotOrderType,
        stewardName,
        cashierName: currentUser.name,
        customerName: customerName || undefined,
        remark: kotRemark || undefined,
        items: unsentItems.map(item => ({
          product_name: item.product.name,
          quantity: item.quantity,
          unit: item.product.unit || undefined
        }))
      });

      setKotSentItemIds(prev => {
        const newSet = new Set(prev);
        unsentItems.forEach(item => newSet.add(item.product.id));
        return newSet;
      });

      if (kotLogResponse.kotLog?.id) {
        setUnlinkedKotIds(prev => {
          const newSet = new Set(prev);
          newSet.add(kotLogResponse.kotLog.id);
          return newSet;
        });
      }

      toast.success("KOT sent to kitchen successfully");
    } catch (err) {
      console.error("Failed to send KOT", err);
      toast.error("Failed to send KOT");
    } finally {
      setIsSendingKot(false);
    }
  };

  const handleCreateOrder = async () => {
    if (!validateOrder()) return;

    try {
      setIsSending(true);
      const selectedTableInfo = orderType === "dine_in" ? tables.find(t => t.id === selectedTable) : null;
      const stewardObj = stewards.find(s => s.id === selectedSteward);

      const order = await orderService.createOrder({
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_type: customerType,
        order_type: orderType === "dine_in" ? OrderType.DINE_IN : OrderType.TAKE_AWAY,
        table_id: selectedTableInfo?.id ?? null,
        table_name: selectedTableInfo?.displayName ?? null,
        table_number: selectedTableInfo?.tableNumber ?? null,
        steward_name: stewardObj?.name || selectedSteward,
        tax: taxRate,
        discount: discountRate,
        terminal_id: currentUser.terminalId,
        cashier_name: currentUser.name,
        items: billItems.map(item => {
          const localPrice = Number(item.product.localPrice) || 0;
          const foreignerPrice = Number(item.product.foreignerPrice) || 0;
          return {
            productId: item.product.id,
            product_name: item.product.name,
            quantity: item.quantity,
            unit_price: customerType === "local" ? localPrice : foreignerPrice,
            kot_sent: kotSentItemIds.has(item.product.id),
          };
        }),
        unlinkedKotIds: Array.from(unlinkedKotIds),
      });

      if (orderType === "dine_in" && selectedTable && selectedTableInfo) {
        setTables(
          tables.map((t) =>
            t.id === selectedTable ? { ...t, status: "occupied" as const, orderId: order.order_number } : t
          )
        );
        toast.success(`Order ${order.order_number} created successfully!`, {
          description: `${selectedTableInfo.displayName} - ${customerName}. Sent to kitchen.`,
        });
      } else {
        toast.success(`Order ${order.order_number} created successfully!`, {
          description: `Take Away - ${customerName}. Sent to kitchen.`,
        });
      }

      setTimeout(() => fetchTables(), 500);
      handleClearOrder(false);
      navigate("/orders");
    } catch (error: any) {
      console.error('Failed to create order', error);
      const msg = error?.response?.data?.message ?? 'Failed to create order';
      toast.error(msg);
    } finally {
      setIsSending(false);
    }
  };

  const handleTakeAwayPayment = () => {
    if (!validateOrder()) return;
    setIsPaymentDialogOpen(true);
  };

  const handleDineInPayment = () => {
    if (!validateOrder()) return;
    setIsPaymentDialogOpen(true);
  };

  const handleConfirmPayment = (
    paymentMethod: 'cash' | 'card' | 'credit',
    amountPaid: number,
    creditDescription?: string
  ) => {
    const now = new Date();
    const change = paymentMethod === 'credit' ? 0 : amountPaid - total;
    const billNumber = '';

    const payload = {
      date: now.toISOString(),
      payment_method: paymentMethod.toUpperCase(),
      customer_name: customerName,
      customer_type: customerType,
      service_charge_percentage: serviceCharge?.isActive ? Number(serviceCharge.percentage || 0) : 0,
      service_charge_amount: Number(serviceChargeAmount.toFixed(2)),
      total: Number(total.toFixed(2)),
      cashier_name: currentUser.name,
      terminal_id: currentUser.terminalId,
      order_type: orderType,
      table_number: orderType === "dine_in" ? selectedTable : null,
      item_count: billItems.length,
      credit_note: creditDescription ?? null,
      cash_given: Number(amountPaid.toFixed(2)),
      balance_given: Number(change.toFixed(2)),
      tax: Number(tax.toFixed(2)),
      items: billItems.map((bi) => ({
        productId: bi.product.id,
        quantityMoved: bi.quantity,
      })),
    };

    setIsPrinting(true);
    api
      .post('/bills', payload)
      .then((res) => {
        const createdBillNumber = res?.data?.data?.bill?.bill_number || res?.data?.data?.billNumber || res?.data?.data?.bill_number || billNumber;
        const selectedTableInfo = orderType === "dine_in" ? tables.find(t => t.id === selectedTable) : null;

        const bill: Bill = {
          id: createdBillNumber,
          items: billItems,
          subtotal,
          tax,
          taxRate,
          discount,
          discountRate,
          // @ts-ignore - optional extra fields used by printer/UI
          serviceCharge: serviceChargeAmount,
          serviceChargeRate: orderType === "dine_in" && serviceCharge?.isActive ? Number(serviceCharge.percentage || 0) : 0,
          total,
          customerName: customerName.trim() || undefined,
          cashierName: currentUser.name,
          customerPhone,
          paymentMethod,
          amountPaid,
          change,
          creditDescription,
          tableNumber: selectedTableInfo?.displayName,
          orderType: orderType,
          createdAt: now,
        };
        printBillNewWindow(bill);

        handleClearOrder();
        setIsPaymentDialogOpen(false);

        toast.success('Bill completed successfully!', {
          description: `Bill #${createdBillNumber} - Total: Rs. ${total.toFixed(2)}`,
        });
      })
      .catch((err) => {
        console.error('Failed to complete bill', err);
        const msg = err?.response?.data?.message ?? 'Failed to complete bill';
        toast.error(msg);
      })
      .finally(() => {
        setIsPrinting(false);
      });
  };

  const handleTestPrint = async () => {
    setIsTestingPrinter(true);
    try {
      const result = await printerService.testAgentPrint();
      if (result.success) {
        toast.success("Test print sent!", { description: result.message });
        setAgentStatus("online");
      } else {
        toast.error("Test print failed", { description: result.message });
      }
    } catch (error: any) {
      console.error("Test print error:", error);
      toast.error("Test print failed", {
        description: error.message || "Could not reach the print agent. Make sure it is configured in Printer Setup.",
      });
      setAgentStatus("offline");
    } finally {
      setIsTestingPrinter(false);
    }
  };

  return {
    navigate,
    customerName, setCustomerName,
    customerPhone, setCustomerPhone,
    customerType, setCustomerType,
    orderType, setOrderType,
    selectedTable, setSelectedTable,
    selectedSteward, setSelectedSteward,
    kotRemark, setKotRemark,
    tables, stewards, freeTables,
    agentStatus, isTestingPrinter, checkAgentHealth, handleTestPrint,
    billItems, kotSentItemIds,
    subtotal, tax, taxRate, setTaxRate,
    discount, discountRate, setDiscountRate,
    serviceCharge, serviceChargeAmount, total,
    hasUnsentItems, allKotSent,
    stockWarnings,
    isPrinting, isSending, isSendingKot,
    isPaymentDialogOpen, setIsPaymentDialogOpen,
    isRoomBookingDialogOpen, setIsRoomBookingDialogOpen,
    currentUser,
    handleAddProduct, handleUpdateQuantity, handleRemoveItem, handleClearOrder,
    handleSendKot, handleCreateOrder,
    handleTakeAwayPayment, handleDineInPayment, handleConfirmPayment,
  };
}
