import { useState } from "react";
import { 
  UtensilsCrossed, 
  Package, 
  Hotel, 
  Minus, 
  Plus, 
  Trash2, 
  Send, 
  Printer, 
  User, 
  Phone,
  ShoppingCart,
  Crown,
  ChevronDown,
  ChevronUp,
  AlertTriangle
} from "lucide-react";
import { BillItem, StockWarning } from "@/types/pos";
import { TableInfo } from "./usePOSLogic";
import { User as AppUser } from "@/types/user.types";

interface OrderPanelProps {
  orderType: "dine_in" | "take_away";
  setOrderType: (v: "dine_in" | "take_away") => void;
  selectedTable: string | null;
  setSelectedTable: (v: string | null) => void;
  tables: TableInfo[];
  stewards: AppUser[];
  selectedSteward: string;
  setSelectedSteward: (v: string) => void;
  customerName: string;
  setCustomerName: (v: string) => void;
  customerPhone: string;
  setCustomerPhone: (v: string) => void;
  kotRemark: string;
  setKotRemark: (v: string) => void;
  billItems: BillItem[];
  kotSentItemIds: Set<string>;
  onUpdateQuantity: (id: string, qty: number) => void;
  onRemoveItem: (id: string) => void;
  subtotal: number;
  tax: number;
  taxRate: number;
  setTaxRate: (v: number) => void;
  discount: number;
  discountRate: number;
  setDiscountRate: (v: number) => void;
  serviceChargeAmount: number;
  serviceChargeActive: boolean;
  serviceChargePercentage: number;
  total: number;
  hasUnsentItems: boolean;
  allKotSent: boolean;
  isSendingKot: boolean;
  isSending: boolean;
  isPrinting: boolean;
  onSendKot: () => void;
  onCreateOrder: () => void;
  onPayment: () => void;
  onClearOrder: () => void;
  stockWarnings: StockWarning[];
  onOpenRoomBooking: () => void;
}

export function OrderPanel(props: OrderPanelProps) {
  const [isCustomerInfoExpanded, setIsCustomerInfoExpanded] = useState(true);

  return (
    <div className="pos-order-panel h-full flex flex-col w-full">
      {/* Header: Order Type & Table Selection */}
      <div className="pos-order-header space-y-4">
        <div className="pos-segmented w-full">
          <button 
            className={`flex-1 justify-center ${props.orderType === 'dine_in' ? 'active' : ''}`}
            onClick={() => props.setOrderType('dine_in')}
          >
            <UtensilsCrossed className="h-4 w-4" /> Dine In
          </button>
          <button 
            className={`flex-1 justify-center ${props.orderType === 'take_away' ? 'active' : ''}`}
            onClick={() => {
              props.setOrderType('take_away');
              props.setSelectedTable(null);
            }}
          >
            <Package className="h-4 w-4" /> Take Away
          </button>
          <button 
            className="flex-1 justify-center"
            onClick={props.onOpenRoomBooking}
          >
            <Hotel className="h-4 w-4" /> Room
          </button>
        </div>

        {props.orderType === 'dine_in' && (
          <div className="pos-table-grid max-h-[140px] overflow-y-auto pr-1">
            {props.tables.length === 0 ? (
              <div className="col-span-full text-xs text-muted-foreground text-center py-4">
                No tables available.
              </div>
            ) : (
              props.tables.map((table) => {
                const isOccupied = table.status === 'occupied';
                const isSelected = props.selectedTable === table.id;
                return (
                  <button
                    key={table.id}
                    className={`pos-table-btn ${isSelected ? 'selected' : ''} ${isOccupied ? 'occupied' : ''}`}
                    disabled={isOccupied}
                    onClick={() => props.setSelectedTable(table.id)}
                  >
                    <span className="table-name">{table.displayName}</span>
                    <span className={`table-status-dot ${isOccupied ? 'occupied' : 'free'}`} />
                    {table.table_type === 'VIP' && (
                      <span className="pos-vip-badge mt-1">VIP</span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Customer & Steward Form (Collapsible) */}
      <div className="border-b border-border bg-surface-elevated flex-shrink-0">
        <div 
          className="pos-collapsible-header px-5"
          onClick={() => setIsCustomerInfoExpanded(!isCustomerInfoExpanded)}
        >
          <span>Customer & Order Details</span>
          {isCustomerInfoExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
        
        {isCustomerInfoExpanded && (
          <div className="pos-order-form pt-0">
            <div className="pos-form-field">
              <label className="pos-form-label">
                <Crown className="h-3 w-3" /> Steward <span className="required">*</span>
              </label>
              <select 
                className="w-full h-[34px] px-3 rounded-md border border-border bg-surface text-[13px] text-foreground focus:border-primary focus:outline-none disabled:opacity-50"
                value={props.selectedSteward}
                onChange={(e) => props.setSelectedSteward(e.target.value)}
                disabled={props.kotSentItemIds.size > 0}
              >
                <option value="" disabled>Select Steward</option>
                {props.stewards.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="pos-form-field">
                <label className="pos-form-label">
                  <User className="h-3 w-3" /> Name {props.orderType === 'take_away' && <span className="required">*</span>}
                </label>
                <input 
                  type="text"
                  placeholder="Customer Name"
                  className="w-full h-[34px] px-3 rounded-md border border-border bg-surface text-[13px] text-foreground focus:border-primary focus:outline-none disabled:opacity-50"
                  value={props.customerName}
                  onChange={(e) => props.setCustomerName(e.target.value)}
                  disabled={props.kotSentItemIds.size > 0}
                />
              </div>
              <div className="pos-form-field">
                <label className="pos-form-label">
                  <Phone className="h-3 w-3" /> Phone
                </label>
                <input 
                  type="text"
                  placeholder="10 digits"
                  maxLength={10}
                  className="w-full h-[34px] px-3 rounded-md border border-border bg-surface text-[13px] text-foreground focus:border-primary focus:outline-none disabled:opacity-50"
                  value={props.customerPhone}
                  onChange={(e) => props.setCustomerPhone(e.target.value.replace(/\D/g, ""))}
                  disabled={props.kotSentItemIds.size > 0}
                />
              </div>
            </div>

            <div className="pos-form-field">
              <label className="pos-form-label">Kitchen Remark</label>
              <input 
                type="text"
                placeholder="E.g., Less spicy"
                className="w-full h-[34px] px-3 rounded-md border border-border bg-surface text-[13px] text-foreground focus:border-primary focus:outline-none disabled:opacity-50"
                value={props.kotRemark}
                onChange={(e) => props.setKotRemark(e.target.value)}
                disabled={props.kotSentItemIds.size > 0}
              />
            </div>
          </div>
        )}
      </div>

      {/* Cart Items Area */}
      <div className="pos-order-items">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" /> 
            Cart Items
            {props.billItems.length > 0 && (
              <span className="pos-item-count">{props.billItems.length}</span>
            )}
          </h3>
          {props.billItems.length > 0 && (
            <button 
              onClick={props.onClearOrder}
              className="text-xs text-danger hover:text-danger/80 font-medium bg-danger/10 px-2 py-1 rounded"
            >
              Clear
            </button>
          )}
        </div>

        {/* Stock Warnings Banner */}
        {props.stockWarnings.length > 0 && (
          <div className="pos-stock-warning">
            <div className="warning-title">
              <AlertTriangle className="h-3.5 w-3.5" /> Low Stock Items
            </div>
            {props.stockWarnings.map((w, i) => (
              <div key={i} className="warning-item">
                {w.product.name} ({w.currentStock} left)
              </div>
            ))}
          </div>
        )}

        {props.billItems.length === 0 ? (
          <div className="pos-empty-cart">
            <div className="empty-icon">
              <ShoppingCart className="h-8 w-8" />
            </div>
            <p className="empty-text">Cart is empty</p>
            <p className="empty-hint">Select products from the grid to add them to your order.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {props.billItems.map(item => {
              const isSent = props.kotSentItemIds.has(item.product.id);
              return (
                <div key={item.product.id} className="pos-cart-item">
                  <div className="cart-item-info">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="cart-item-name" title={item.product.name}>{item.product.name}</span>
                      <span className={`pos-kot-badge ${isSent ? 'sent' : 'pending'}`}>
                        {isSent ? 'Sent' : 'Pending'}
                      </span>
                    </div>
                    <div className="cart-item-price">Rs. {(item.subtotal / item.quantity).toFixed(2)} each</div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="pos-qty-stepper">
                      <button 
                        onClick={() => props.onUpdateQuantity(item.product.id, item.quantity - 1)}
                        disabled={item.quantity <= 1 || isSent}
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="qty-value">{item.quantity}</span>
                      <button 
                        onClick={() => props.onUpdateQuantity(item.product.id, item.quantity + 1)}
                        disabled={
                          isSent || 
                          (item.product.product_type !== 'HANDMADE' && item.quantity >= item.product.stock)
                        }
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="cart-item-total w-[80px] text-right">
                      Rs. {item.subtotal.toFixed(2)}
                    </div>
                    <button 
                      className="pos-delete-btn"
                      onClick={() => props.onRemoveItem(item.product.id)}
                      disabled={isSent}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer: Summary & Actions */}
      <div className="pos-order-footer shadow-[0_-10px_20px_rgba(0,0,0,0.05)] z-10 relative">
        <div className="pos-summary">
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-border/50">
            <div className="pos-rate-input">
              <label>Tax %</label>
              <input 
                type="number" 
                min="0" max="100" step="0.1"
                value={props.taxRate || ''} 
                onChange={(e) => props.setTaxRate(parseFloat(e.target.value) || 0)} 
                placeholder="0"
              />
            </div>
            <div className="pos-rate-input">
              <label>Disc %</label>
              <input 
                type="number" 
                min="0" max="100" step="0.1"
                value={props.discountRate || ''} 
                onChange={(e) => props.setDiscountRate(parseFloat(e.target.value) || 0)} 
                placeholder="0"
              />
            </div>
          </div>

          <div className="pos-summary-row">
            <span className="label">Subtotal</span>
            <span className="value">Rs. {props.subtotal.toFixed(2)}</span>
          </div>
          {props.tax > 0 && (
            <div className="pos-summary-row">
              <span className="label">Tax</span>
              <span className="value">Rs. {props.tax.toFixed(2)}</span>
            </div>
          )}
          {props.serviceChargeActive && props.serviceChargeAmount > 0 && (
            <div className="pos-summary-row">
              <span className="label">Service Charge ({props.serviceChargePercentage}%)</span>
              <span className="value">Rs. {props.serviceChargeAmount.toFixed(2)}</span>
            </div>
          )}
          {props.discount > 0 && (
            <div className="pos-summary-row discount">
              <span className="label">Discount</span>
              <span className="value">- Rs. {props.discount.toFixed(2)}</span>
            </div>
          )}
          <div className="pos-summary-row total">
            <span className="label">Total</span>
            <span className="value">Rs. {props.total.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex flex-col gap-2 mt-4">
          <button 
            className={`pos-action-btn ${props.hasUnsentItems ? 'primary' : 'kot-sent'}`}
            onClick={props.onSendKot}
            disabled={props.isSendingKot || !props.hasUnsentItems || props.billItems.length === 0 || (props.orderType === "take_away" && !props.customerName.trim())}
          >
            <UtensilsCrossed className="h-4 w-4" />
            {props.isSendingKot ? "Sending..." : (props.hasUnsentItems ? "Send KOT" : (props.billItems.length > 0 ? "KOT Sent ✓" : "Send KOT"))}
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button 
              className="pos-action-btn outline"
              onClick={props.onCreateOrder}
              disabled={props.isPrinting || props.isSending || !props.allKotSent}
              title={!props.allKotSent ? "Send KOT first" : undefined}
            >
              <Send className="h-4 w-4" />
              {props.isSending ? "Sending..." : "Send"}
            </button>
            <button 
              className="pos-action-btn success"
              onClick={props.onPayment}
              disabled={props.isPrinting || !props.allKotSent}
              title={!props.allKotSent ? "Send KOT first" : undefined}
            >
              <Printer className="h-4 w-4" />
              {props.isPrinting ? "Printing..." : "Print & Pay"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
