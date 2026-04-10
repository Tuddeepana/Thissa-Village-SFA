import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { serviceChargeService } from "@/api/services/serviceChargeService";
import type { ServiceCharge } from "@/types/service-charge";
import { Percent, Save, Loader2, Printer } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";

const Settings = () => {
  const [serviceCharge, setServiceCharge] = useState<ServiceCharge | null>(null);
  const [percentage, setPercentage] = useState<number>(10);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [isKitchenPrintEnabled, setIsKitchenPrintEnabled] = useState<boolean>(false);
  const [kitchenPrinterIp, setKitchenPrinterIp] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch current service charge configuration
  useEffect(() => {
    const fetchServiceCharge = async () => {
      try {
        setLoading(true);
        const data = await serviceChargeService.get();
        setServiceCharge(data);
        setPercentage(data.percentage);
        setIsActive(data.isActive);
        setIsKitchenPrintEnabled(data.isKitchenPrintEnabled);
        setKitchenPrinterIp(data.kitchenPrinterIp || "");
      } catch (error: any) {
        console.error("Failed to fetch service charge:", error);
        toast.error("Failed to load service charge configuration");
      } finally {
        setLoading(false);
      }
    };

    fetchServiceCharge();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      const updated = await serviceChargeService.update({
        percentage,
        isActive,
        isKitchenPrintEnabled,
        kitchenPrinterIp,
      });
      setServiceCharge(updated);
      toast.success("Settings updated successfully!");
    } catch (error: any) {
      console.error("Failed to update service charge:", error);
      toast.error(error.response?.data?.message || "Failed to update service charge");
    } finally {
      setSaving(false);
    }
  };

  const hasChanges =
    serviceCharge &&
    (serviceCharge.percentage !== percentage ||
     serviceCharge.isActive !== isActive ||
     serviceCharge.isKitchenPrintEnabled !== isKitchenPrintEnabled ||
     serviceCharge.kitchenPrinterIp !== kitchenPrinterIp);

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Config Service Fees</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Configure service charge settings for your business
        </p>
      </div>

      {/* Service Charge Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg md:text-xl flex items-center gap-2">
            <Percent className="h-5 w-5" />
            Service Charge Configuration
          </CardTitle>
          <CardDescription>
            Set the default service charge percentage that will be applied to bills
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-10 w-32" />
            </div>
          ) : (
            <>
              {/* Active Toggle */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="service-charge-active" className="text-base font-medium">
                    Enable Service Charge
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically apply service charge to all bills
                  </p>
                </div>
                <Switch
                  id="service-charge-active"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
              </div>

              {/* Percentage Slider */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="service-charge-percentage" className="text-base font-medium">
                    Service Charge Percentage
                  </Label>
                  <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-md">
                    <span className="text-2xl font-bold text-primary">{percentage}%</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Slider
                    id="service-charge-percentage"
                    min={0}
                    max={100}
                    step={0.5}
                    value={[percentage]}
                    onValueChange={(value) => setPercentage(value[0])}
                    className="w-full"
                    disabled={!isActive}
                  />

                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0%</span>
                    <span>25%</span>
                    <span>50%</span>
                    <span>75%</span>
                    <span>100%</span>
                  </div>
                </div>

                {/* Example Calculation */}
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <p className="text-sm font-medium">Example:</p>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>Rs. 1,000.00</span>
                    </div>
                    <div className="flex justify-between font-medium text-foreground">
                      <span>Service Charge ({percentage}%):</span>
                      <span>Rs. {((1000 * percentage) / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t font-bold text-foreground">
                      <span>Total:</span>
                      <span>Rs. {(1000 + (1000 * percentage) / 100).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex items-center gap-3 pt-4">
                <Button
                  onClick={handleSave}
                  disabled={!hasChanges || saving}
                  className="w-full sm:w-auto"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>

                {hasChanges && (
                  <p className="text-sm text-muted-foreground">
                    You have unsaved changes
                  </p>
                )}
              </div>

              {/* Last Updated Info */}
              {serviceCharge && (
                <div className="text-xs text-muted-foreground pt-2 border-t">
                  Last updated: {new Date(serviceCharge.updatedAt).toLocaleString()}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Kitchen Printer Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg md:text-xl flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Kitchen Printer Configuration
          </CardTitle>
          <CardDescription>
            Configure the automated kitchen printout settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : (
            <>
              {/* Kitchen Print Toggle */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="kitchen-print-active" className="text-base font-medium">
                    Enable Kitchen Printing
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically print orders to the kitchen when "Print & Pay" is clicked
                  </p>
                </div>
                <Switch
                  id="kitchen-print-active"
                  checked={isKitchenPrintEnabled}
                  onCheckedChange={setIsKitchenPrintEnabled}
                />
              </div>

              {/* Printer IP/Name */}
              <div className="space-y-2">
                <Label htmlFor="kitchen-printer-ip" className="text-base font-medium">
                  Kitchen Printer (IP / Device Name)
                </Label>
                <Input
                  id="kitchen-printer-ip"
                  placeholder="e.g., 192.168.1.100 or Kitchen-Printer"
                  value={kitchenPrinterIp}
                  onChange={(e) => setKitchenPrinterIp(e.target.value)}
                  disabled={!isKitchenPrintEnabled}
                />
                <p className="text-xs text-muted-foreground">
                  The system will attempt to send kitchen-only receipts to this printer.
                </p>
              </div>

              {/* Save Button */}
              <div className="flex items-center gap-3 pt-4">
                <Button
                  onClick={handleSave}
                  disabled={!hasChanges || saving}
                  className="w-full sm:w-auto"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;

