import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductSearch } from "@/components/pos/ProductSearch";
import { PaymentDialog } from "@/components/pos/PaymentDialog";
import { RoomBookingDialog } from "@/components/pos/RoomBookingDialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import {
  User,
  Phone,
  UtensilsCrossed,
  Package,
  Hotel,
  Minus,
  Plus,
  Trash2,
  ShoppingCart,
  Send,
  Printer,
  AlertTriangle,
  Crown,
  Globe,
  Users,
  TestTube2,
  WifiOff,
  Loader2,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { usePOSLogic } from "@/components/pos/beta/usePOSLogic";
import { toast } from "sonner";

interface POSClassicProps {
  onToggleBeta: (checked: boolean) => void;
  isBeta: boolean;
}

export function POSClassic({ onToggleBeta, isBeta }: POSClassicProps) {
  const {
    customerName, setCustomerName,
    customerPhone, setCustomerPhone,
    customerType, setCustomerType,
    orderType, setOrderType,
    selectedTable, setSelectedTable,
    selectedSteward, setSelectedSteward,
    kotRemark, setKotRemark,
    tables, stewards,
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
  } = usePOSLogic();

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">POS System</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Terminal: {currentUser.terminalId} • Cashier: {currentUser.name}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-secondary/50 border border-border px-3 py-1.5 rounded-full mr-2">
            <Label htmlFor="beta-toggle-classic" className="text-xs font-semibold cursor-pointer">Beta UI</Label>
            <Switch 
              id="beta-toggle-classic" 
              checked={isBeta} 
              onCheckedChange={onToggleBeta} 
              className="data-[state=checked]:bg-blue-600"
            />
          </div>
          {(() => {
            const statusConfig = {
              unknown: { icon: WifiOff, label: "Printer Unconfigured", color: "text-muted-foreground", bg: "bg-muted" },
              checking: { icon: Loader2, label: "Checking Printer...", color: "text-yellow-600", bg: "bg-yellow-50 dark:bg-yellow-950" },
              online: { icon: CheckCircle2, label: "Printer Online", color: "text-green-600", bg: "bg-green-50 dark:bg-green-950" },
              offline: { icon: XCircle, label: "Printer Offline", color: "text-red-600", bg: "bg-red-50 dark:bg-red-950" },
            };
            const currentStatus = statusConfig[agentStatus];
            const StatusIcon = currentStatus.icon;
            return (
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded border ${currentStatus.bg}`}
              >
                <StatusIcon
                  className={`h-4 w-4 ${currentStatus.color} ${
                    agentStatus === "checking" ? "animate-spin" : ""
                  }`}
                />
                <span className={`font-medium text-xs ${currentStatus.color}`}>
                  {currentStatus.label}
                </span>
                {agentStatus !== "checking" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 ml-1"
                    onClick={checkAgentHealth}
                    title="Refresh printer status"
                  >
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                )}
              </div>
            );
          })()}
          <Button
            variant="outline"
            size="sm"
            onClick={handleTestPrint}
            disabled={isTestingPrinter}
            className="text-muted-foreground h-8"
          >
            <TestTube2 className="h-4 w-4 mr-2" />
            {isTestingPrinter ? "Testing..." : "Test"}
          </Button>
          <Badge
            variant="outline"
            className={`text-sm px-3 py-1 ${customerType === "local"
              ? "bg-green-100 text-green-700 border-green-300"
              : "bg-blue-100 text-blue-700 border-blue-300"
              }`}
          >
            {customerType === "local" ? (
              <><Users className="h-4 w-4 mr-1.5" /> Local Pricing</>
            ) : (
              <><Globe className="h-4 w-4 mr-1.5" /> Foreigner Pricing</>
            )}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Section - Order Type Selection & Products */}
        <div className="lg:col-span-2 space-y-4">
          {/* Order Type Selection Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Order Type & Table Selection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">

              {/* Customer Type Selection */}
              <div className="space-y-2">
                <Label>Customer Type</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={customerType === "local" ? "default" : "outline"}
                    className={customerType === "local" ? "bg-green-600 hover:bg-green-700" : ""}
                    onClick={() => setCustomerType("local")}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Local
                  </Button>
                  <Button
                    variant={customerType === "foreigner" ? "default" : "outline"}
                    className={customerType === "foreigner" ? "bg-blue-600 hover:bg-blue-700" : ""}
                    onClick={() => setCustomerType("foreigner")}
                  >
                    <Globe className="h-4 w-4 mr-2" />
                    Foreigner
                  </Button>
                </div>
              </div>

              {/* Order Type Selection */}
              <div className="space-y-2">
                <Label>Order Type</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant={orderType === "dine_in" ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => setOrderType("dine_in")}
                  >
                    <UtensilsCrossed className="h-4 w-4 mr-2" />
                    Dine In
                  </Button>
                  <Button
                    variant={orderType === "take_away" ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => {
                      setOrderType("take_away");
                      setSelectedTable(null);
                    }}
                  >
                    <Package className="h-4 w-4 mr-2" />
                    Take Away
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setIsRoomBookingDialogOpen(true)}
                  >
                    <Hotel className="h-4 w-4 mr-2" />
                    Room
                  </Button>
                </div>
              </div>

              {/* Table Selection (for Dine In) */}
              {orderType === "dine_in" && (
               <div className="space-y-2">
                  <Label>Select Table</Label>
                  {tables.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No tables available. Please create tables in Table Management.</p>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
                      {tables.map((table) => (
                        <Button
                          key={table.id}
                          variant={selectedTable === table.id ? "default" : "outline"}
                          className={`h-20 ${table.status === "occupied"
                            ? "opacity-50 cursor-not-allowed bg-red-50 border-red-200"
                            : selectedTable === table.id
                              ? table.table_type === "VIP"
                                ? "bg-amber-600 hover:bg-amber-700"
                                : ""
                              : table.table_type === "VIP"
                                ? "hover:bg-amber-50 hover:border-amber-300 border-amber-200"
                                : "hover:bg-green-50 hover:border-green-200"
                            }`}
                          disabled={table.status === "occupied"}
                          onClick={() => setSelectedTable(table.id)}
                        >
                          <div className="text-center">
                            <div className="font-bold text-sm">{table.displayName}</div>
                            <div className="flex flex-col gap-1 mt-1">
                              {table.table_type === "VIP" && (
                                <Badge className="text-xs bg-amber-100 text-amber-800 border-amber-300">
                                  <Crown className="h-3 w-3 mr-1" />
                                  VIP
                                </Badge>
                              )}
                              {table.status === "occupied" ? (
                                <Badge variant="destructive" className="text-xs">Occupied</Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">Free</Badge>
                              )}
                            </div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Product Search */}
          <Card>
            <CardContent className="p-4">
              <ProductSearch
                onAddProduct={handleAddProduct}
                customerType={customerType}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Section - Order Cart */}
        <div className="lg:col-span-1">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Current Order
                </span>
                {billItems.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={() => handleClearOrder(true)}>
                    Clear All
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col overflow-y-auto">
              {/* Customer & Steward Information */}
              <div className="space-y-3 border-b pb-4 mb-4">
                <h3 className="font-semibold text-sm">Customer & Steward</h3>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="flex items-center gap-2 text-xs">
                      <Crown className="h-3 w-3" /> Steward <span className="text-red-500">*</span>
                    </Label>
                    <Select value={selectedSteward} onValueChange={setSelectedSteward} disabled={kotSentItemIds.size > 0}>
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Select Steward" />
                      </SelectTrigger>
                      <SelectContent>
                        {stewards.map(steward => (
                          <SelectItem key={steward.id} value={steward.id}>
                            {steward.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="kot-remark" className="flex items-center gap-2 text-xs">
                      Remark for Kitchen
                    </Label>
                    <Input
                      id="kot-remark"
                      placeholder="E.g., Less spicy, no onions"
                      value={kotRemark}
                      onChange={(e) => setKotRemark(e.target.value)}
                      disabled={kotSentItemIds.size > 0}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="customer-name" className="flex items-center gap-2 text-xs">
                      <User className="h-3 w-3" /> Name {orderType === "take_away" && <span className="text-red-500">*</span>}
                    </Label>
                    <Input
                      id="customer-name"
                      placeholder="Enter customer name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="h-8"
                      disabled={kotSentItemIds.size > 0}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="customer-phone" className="flex items-center gap-2 text-xs">
                      <Phone className="h-3 w-3" /> Phone
                    </Label>
                    <Input
                      id="customer-phone"
                      placeholder="Enter phone number"
                      value={customerPhone}
                      onChange={(e) => {
                        // Only allow digits
                        const digits = e.target.value.replace(/\D/g, "");
                        setCustomerPhone(digits);
                      }}
                      onBlur={() => {
                        if (customerPhone && customerPhone.length !== 10) {
                          toast.error("Phone number must be exactly 10 digits");
                        }
                      }}
                      maxLength={10}
                      className={`h-8 ${customerPhone && customerPhone.length !== 10 ? "border-red-400 focus-visible:ring-red-400" : ""}`}
                      disabled={kotSentItemIds.size > 0}
                    />
                    {customerPhone && customerPhone.length !== 10 && (
                      <p className="text-xs text-red-500">Must be 10 digits ({customerPhone.length}/10)</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Stock Warnings */}
              {stockWarnings.length > 0 && (
                <Alert variant="destructive" className="mb-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Low Stock Warning:</strong>
                    <ul className="mt-2 space-y-1">
                      {stockWarnings.map((warning, index) => (
                        <li key={index} className="text-sm">
                          {warning.product.name}: Only {warning.currentStock} units
                        </li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Order Items */}
              <div className="flex-1 overflow-y-auto space-y-2 mb-4 max-h-[300px]">
                {billItems.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    No items added yet
                  </div>
                ) : (
                  billItems.map((item) => (
                    <div
                      key={item.product.id}
                      className="border rounded-lg p-3 space-y-2"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">
                            {item.product.name}
                            <span className={`ml-2 text-[10px] uppercase font-bold ${kotSentItemIds.has(item.product.id) ? 'text-green-500' : 'text-orange-500'}`}>
                              {kotSentItemIds.has(item.product.id) ? '✓ Sent' : 'Pending'}
                            </span>
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            Rs. {(customerType === "local" ? (Number(item.product.localPrice) || 0) : (Number(item.product.foreignerPrice) || 0)).toFixed(2)} each
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(item.product.id)}
                          disabled={kotSentItemIds.has(item.product.id)}
                        >
                          <Trash2 className={`h-4 w-4 ${kotSentItemIds.has(item.product.id) ? 'text-muted-foreground' : 'text-red-500'}`} />
                        </Button>
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleUpdateQuantity(item.product.id, item.quantity - 1)
                            }
                            disabled={item.quantity <= 1 || kotSentItemIds.has(item.product.id)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-12 text-center font-medium">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleUpdateQuantity(item.product.id, item.quantity + 1)
                            }
                            disabled={
                              kotSentItemIds.has(item.product.id) ||
                              (item.product.product_type !== 'HANDMADE' && item.quantity >= item.product.stock)
                            }
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <span className="font-bold">Rs. {item.subtotal.toFixed(2)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Calculation Section */}
              {billItems.length > 0 && (
                <div className="space-y-4 border-t pt-4">
                  {/* Tax Rate */}
                  <div className="flex items-center gap-2">
                    <Label htmlFor="taxRate" className="text-sm w-20">
                      Tax %:
                    </Label>
                    <Input
                      id="taxRate"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={taxRate === 0 ? "" : taxRate}
                      placeholder="0"
                      onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                      className="w-20"
                    />
                    <span className="text-sm text-muted-foreground flex-1 text-right">
                      Rs. {tax.toFixed(2)}
                    </span>
                  </div>

                  {/* Discount Rate */}
                  <div className="flex items-center gap-2">
                    <Label htmlFor="discountRate" className="text-sm w-20">
                      Discount %:
                    </Label>
                    <Input
                      id="discountRate"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={discountRate === 0 ? "" : discountRate}
                      placeholder="0"
                      onChange={(e) => setDiscountRate(parseFloat(e.target.value) || 0)}
                      className="w-20"
                    />
                    <span className="text-sm text-muted-foreground flex-1 text-right">
                      Rs. {discount.toFixed(2)}
                    </span>
                  </div>

                  <Separator />

                  {/* Totals */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <span>Rs. {subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tax:</span>
                      <span>Rs. {tax.toFixed(2)}</span>
                    </div>
                    {serviceCharge?.isActive && serviceChargeAmount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Service Charge ({Number(serviceCharge.percentage || 0).toFixed(2)}%):
                        </span>
                        <span>Rs. {serviceChargeAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Discount:</span>
                      <span className="text-green-600">- Rs. {discount.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span>Rs. {total.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2 pt-2">
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700 text-white disabled:bg-orange-500 disabled:opacity-100"
                      size="lg"
                      onClick={handleSendKot}
                      disabled={isSendingKot || !hasUnsentItems || billItems.length === 0 || (orderType === "take_away" && !customerName.trim())}
                    >
                      <UtensilsCrossed className="h-4 w-4 mr-2" />
                      {isSendingKot ? "Sending..." : (hasUnsentItems ? "Send KOT" : (billItems.length > 0 ? "KOT Sent ✓" : "Send KOT"))}
                    </Button>

                    {orderType === "dine_in" ? (
                      <div className="grid grid-cols-2 gap-2">
                        <Button className="w-full" size="lg" variant="outline" onClick={handleCreateOrder} disabled={isPrinting || isSending || !allKotSent} title={!allKotSent ? "Send KOT first" : undefined}>
                          <Send className="h-4 w-4 mr-2" />
                          {isSending ? "Sending..." : "Send"}
                        </Button>
                        <Button className="w-full" size="lg" onClick={handleDineInPayment} disabled={isPrinting || !allKotSent} title={!allKotSent ? "Send KOT first" : undefined}>
                          <Printer className="h-4 w-4 mr-2" />
                          {isPrinting ? "Printing..." : "Print & Pay"}
                        </Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        <Button className="w-full" size="lg" variant="outline" onClick={handleCreateOrder} disabled={isPrinting || isSending || !allKotSent} title={!allKotSent ? "Send KOT first" : undefined}>
                          <Send className="h-4 w-4 mr-2" />
                          {isSending ? "Sending..." : "Send"}
                        </Button>
                        <Button className="w-full" size="lg" onClick={handleTakeAwayPayment} disabled={isPrinting || !allKotSent} title={!allKotSent ? "Send KOT first" : undefined}>
                          <Printer className="h-4 w-4 mr-2" />
                          {isPrinting ? "Printing..." : "Print & Pay"}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Payment Dialog for Take Away */}
      <PaymentDialog
        open={isPaymentDialogOpen}
        onOpenChange={setIsPaymentDialogOpen}
        total={total}
        onConfirmPayment={handleConfirmPayment}
        isPrinting={isPrinting}
      />

      {/* Room Booking Dialog */}
      <RoomBookingDialog
        open={isRoomBookingDialogOpen}
        onOpenChange={setIsRoomBookingDialogOpen}
        cashierName={currentUser.name}
        onBookingSuccess={() => {
          toast.success("Room booking completed successfully!");
        }}
      />
    </div>
  );
}
