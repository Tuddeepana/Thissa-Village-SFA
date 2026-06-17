import { useState } from "react";
import { POSBetaHeader } from "./POSBetaHeader";
import { ProductGrid } from "./ProductGrid";
import { OrderPanel } from "./OrderPanel";
import { usePOSLogic } from "./usePOSLogic";
import { PaymentDialog } from "../PaymentDialog";
import { RoomBookingDialog } from "../RoomBookingDialog";
import { toast } from "sonner";
import "./pos-beta.css"; // The new premium CSS

interface POSBetaProps {
  onToggleBeta: (isBeta: boolean) => void;
}

export function POSBeta({ onToggleBeta }: POSBetaProps) {
  const logic = usePOSLogic();
  
  // Mobile tabs state: 'products' | 'cart'
  const [mobileTab, setMobileTab] = useState<"products" | "cart">("products");

  return (
    <div className="pos-beta">
      <POSBetaHeader 
        terminalId={logic.currentUser.terminalId}
        cashierName={logic.currentUser.name}
        agentStatus={logic.agentStatus}
        isTestingPrinter={logic.isTestingPrinter}
        customerType={logic.customerType}
        isBeta={true}
        onCustomerTypeChange={logic.setCustomerType}
        onRefreshPrinter={logic.checkAgentHealth}
        onTestPrint={logic.handleTestPrint}
        onToggleBeta={onToggleBeta}
      />

      {/* Mobile Tabs */}
      <div className="pos-mobile-tabs bg-surface">
        <button 
          className={`pos-mobile-tab ${mobileTab === 'products' ? 'active' : ''}`}
          onClick={() => setMobileTab('products')}
        >
          Products
        </button>
        <button 
          className={`pos-mobile-tab ${mobileTab === 'cart' ? 'active' : ''} flex items-center justify-center gap-2`}
          onClick={() => setMobileTab('cart')}
        >
          Cart
          {logic.billItems.length > 0 && (
            <span className="bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {logic.billItems.length}
            </span>
          )}
        </button>
      </div>

      <div className="pos-beta-body">
        {/* Left Side: Products (Hidden on mobile if cart tab is active) */}
        <div className={`min-h-0 overflow-hidden flex flex-col h-full ${mobileTab === 'cart' ? 'hidden lg:flex' : 'flex'}`}>
          <ProductGrid 
            onAddProduct={(p) => {
              logic.handleAddProduct(p);
              // On mobile, automatically switch to cart when adding an item if cart was empty
              if (window.innerWidth < 1024 && logic.billItems.length === 0) {
                setMobileTab('cart');
              }
            }}
            customerType={logic.customerType}
          />
        </div>

        {/* Right Side: Order Panel (Hidden on mobile if products tab is active) */}
        <div className={`min-h-0 overflow-hidden flex flex-col h-full ${mobileTab === 'products' ? 'hidden lg:flex' : 'flex'}`}>
          <OrderPanel 
            orderType={logic.orderType}
            setOrderType={logic.setOrderType}
            selectedTable={logic.selectedTable}
            setSelectedTable={logic.setSelectedTable}
            tables={logic.tables}
            stewards={logic.stewards}
            selectedSteward={logic.selectedSteward}
            setSelectedSteward={logic.setSelectedSteward}
            customerName={logic.customerName}
            setCustomerName={logic.setCustomerName}
            customerPhone={logic.customerPhone}
            setCustomerPhone={logic.setCustomerPhone}
            kotRemark={logic.kotRemark}
            setKotRemark={logic.setKotRemark}
            billItems={logic.billItems}
            kotSentItemIds={logic.kotSentItemIds}
            onUpdateQuantity={logic.handleUpdateQuantity}
            onRemoveItem={logic.handleRemoveItem}
            subtotal={logic.subtotal}
            tax={logic.tax}
            taxRate={logic.taxRate}
            setTaxRate={logic.setTaxRate}
            discount={logic.discount}
            discountRate={logic.discountRate}
            setDiscountRate={logic.setDiscountRate}
            serviceChargeAmount={logic.serviceChargeAmount}
            serviceChargeActive={logic.serviceCharge?.isActive ?? false}
            serviceChargePercentage={logic.serviceCharge?.percentage ?? 0}
            total={logic.total}
            hasUnsentItems={logic.hasUnsentItems}
            allKotSent={logic.allKotSent}
            isSendingKot={logic.isSendingKot}
            isSending={logic.isSending}
            isPrinting={logic.isPrinting}
            onSendKot={logic.handleSendKot}
            onCreateOrder={logic.handleCreateOrder}
            onPayment={() => logic.orderType === "dine_in" ? logic.handleDineInPayment() : logic.handleTakeAwayPayment()}
            onClearOrder={() => logic.handleClearOrder(true)}
            stockWarnings={logic.stockWarnings}
            onOpenRoomBooking={() => logic.setIsRoomBookingDialogOpen(true)}
          />
        </div>
      </div>

      {/* Reusing existing Dialogs for consistent behavior */}
      <PaymentDialog
        open={logic.isPaymentDialogOpen}
        onOpenChange={logic.setIsPaymentDialogOpen}
        total={logic.total}
        onConfirmPayment={logic.handleConfirmPayment}
        isPrinting={logic.isPrinting}
      />

      <RoomBookingDialog
        open={logic.isRoomBookingDialogOpen}
        onOpenChange={logic.setIsRoomBookingDialogOpen}
        cashierName={logic.currentUser.name}
        onBookingSuccess={() => {
          toast.success("Room booking completed successfully!");
        }}
      />
    </div>
  );
}
