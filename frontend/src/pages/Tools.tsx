import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { printerService } from "@/api/services/printerService";
import type { Printer, CreatePrinterInput } from "@/types/printer.types";
import {
  Printer as PrinterIcon,
  Plus,
  TestTube2,
  Pencil,
  Trash2,
  Loader2,
  CheckCircle2,
  XCircle,
  Wifi,
  WifiOff,
  Clock,
} from "lucide-react";

const Tools = () => {
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPrinter, setEditingPrinter] = useState<Printer | null>(null);
  const [testingIds, setTestingIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formIp, setFormIp] = useState("");
  const [formPort, setFormPort] = useState("9100");

  useEffect(() => {
    fetchPrinters();
  }, []);

  const fetchPrinters = async () => {
    try {
      setLoading(true);
      const data = await printerService.getAll();
      setPrinters(data);
    } catch (error: any) {
      console.error("Failed to fetch printers:", error);
      toast.error("Failed to load printers");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormName("");
    setFormIp("");
    setFormPort("9100");
    setEditingPrinter(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (printer: Printer) => {
    setEditingPrinter(printer);
    setFormName(printer.name);
    setFormIp(printer.ipAddress);
    setFormPort(String(printer.port));
    setDialogOpen(true);
  };

  const handleSave = async () => {
    // Basic validation
    if (!formName.trim()) {
      toast.error("Printer name is required");
      return;
    }
    const ipv4Regex =
      /^((25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(25[0-5]|2[0-4]\d|[01]?\d\d?)$/;
    if (!ipv4Regex.test(formIp.trim())) {
      toast.error("Please enter a valid IPv4 address");
      return;
    }
    const portNum = parseInt(formPort, 10);
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
      toast.error("Port must be between 1 and 65535");
      return;
    }

    try {
      setSaving(true);
      if (editingPrinter) {
        const updated = await printerService.update(editingPrinter.id, {
          name: formName.trim(),
          ipAddress: formIp.trim(),
          port: portNum,
        });
        setPrinters((prev) =>
          prev.map((p) => (p.id === updated.id ? updated : p))
        );
        toast.success("Printer updated successfully");
      } else {
        const input: CreatePrinterInput = {
          name: formName.trim(),
          ipAddress: formIp.trim(),
          port: portNum,
          type: "KOT",
        };
        const created = await printerService.create(input);
        setPrinters((prev) => [created, ...prev]);
        toast.success("Printer added successfully");
      }
      setDialogOpen(false);
      resetForm();
    } catch (error: any) {
      console.error("Failed to save printer:", error);
      toast.error(
        error.response?.data?.message || "Failed to save printer"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await printerService.delete(id);
      setPrinters((prev) => prev.filter((p) => p.id !== id));
      toast.success("Printer removed successfully");
    } catch (error: any) {
      console.error("Failed to delete printer:", error);
      toast.error(
        error.response?.data?.message || "Failed to delete printer"
      );
    }
  };

  const handleToggleActive = async (printer: Printer) => {
    try {
      const updated = await printerService.update(printer.id, {
        isActive: !printer.isActive,
      });
      setPrinters((prev) =>
        prev.map((p) => (p.id === updated.id ? updated : p))
      );
      toast.success(
        `Printer ${updated.isActive ? "enabled" : "disabled"}`
      );
    } catch (error: any) {
      console.error("Failed to toggle printer:", error);
      toast.error("Failed to update printer status");
    }
  };

  const handleTestPrint = async (id: string) => {
    setTestingIds((prev) => new Set(prev).add(id));
    try {
      const result = await printerService.testPrint(id);
      // Update the printer in local state with the test result
      setPrinters((prev) =>
        prev.map((p) => (p.id === result.data.id ? result.data : p))
      );
      if (result.success) {
        toast.success("Test print successful!", {
          description: result.message,
        });
      } else {
        toast.error("Test print failed", {
          description: result.message,
        });
      }
    } catch (error: any) {
      console.error("Test print error:", error);
      // If the backend returned a structured error (422), handle it
      if (error.response?.data) {
        const errData = error.response.data;
        if (errData.data) {
          setPrinters((prev) =>
            prev.map((p) => (p.id === errData.data.id ? errData.data : p))
          );
        }
        toast.error("Test print failed", {
          description: errData.message || "Could not reach the printer",
        });
      } else {
        toast.error("Test print failed", {
          description: "Network error — check your connection",
        });
      }
    } finally {
      setTestingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const formatRelativeTime = (dateStr: string | null) => {
    if (!dateStr) return "Never tested";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Printer Configuration
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Configure and manage KOT printers for your kitchen
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add Printer
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingPrinter ? "Edit Printer" : "Add New Printer"}
              </DialogTitle>
              <DialogDescription>
                {editingPrinter
                  ? "Update the printer configuration details."
                  : "Configure a new KOT printer. Make sure the printer is connected to the same network."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="printer-name">Printer Name</Label>
                <Input
                  id="printer-name"
                  placeholder="e.g. Kitchen Printer"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="printer-ip">IP Address</Label>
                <Input
                  id="printer-ip"
                  placeholder="e.g. 192.168.1.110"
                  value={formIp}
                  onChange={(e) => setFormIp(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  The static LAN IP assigned to the printer
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="printer-port">Port</Label>
                <Input
                  id="printer-port"
                  type="number"
                  placeholder="9100"
                  value={formPort}
                  onChange={(e) => setFormPort(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Default ESC/POS port is 9100
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setDialogOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : editingPrinter ? (
                  "Update Printer"
                ) : (
                  "Add Printer"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Printers Grid */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-32 mt-1" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-9 w-full mt-4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : printers.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <PrinterIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">No Printers Configured</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm">
              Add a KOT printer to start sending kitchen order tickets. Make sure your
              printer is connected to the same LAN network.
            </p>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Printer
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {printers.map((printer) => {
            const isTesting = testingIds.has(printer.id);
            return (
              <Card
                key={printer.id}
                className={`transition-all duration-200 ${
                  !printer.isActive ? "opacity-60" : ""
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <PrinterIcon className="h-5 w-5 text-primary" />
                      <CardTitle className="text-base">{printer.name}</CardTitle>
                    </div>
                    <Badge variant={printer.isActive ? "default" : "secondary"}>
                      {printer.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <CardDescription className="font-mono text-xs">
                    {printer.ipAddress}:{printer.port}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Test Status */}
                  <div className="flex items-center gap-2 text-sm">
                    {printer.lastTestedAt ? (
                      printer.lastTestOk ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <span className="text-green-600 dark:text-green-400 font-medium">
                            Connected
                          </span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 text-red-500" />
                          <span className="text-red-600 dark:text-red-400 font-medium">
                            Failed
                          </span>
                        </>
                      )
                    ) : (
                      <>
                        <WifiOff className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Not tested</span>
                      </>
                    )}
                    <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatRelativeTime(printer.lastTestedAt)}
                    </span>
                  </div>

                  {/* Active Toggle */}
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor={`active-${printer.id}`}
                      className="text-sm cursor-pointer"
                    >
                      Enabled
                    </Label>
                    <Switch
                      id={`active-${printer.id}`}
                      checked={printer.isActive}
                      onCheckedChange={() => handleToggleActive(printer)}
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleTestPrint(printer.id)}
                      disabled={isTesting || !printer.isActive}
                    >
                      {isTesting ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                          Testing...
                        </>
                      ) : (
                        <>
                          <TestTube2 className="h-3.5 w-3.5 mr-1.5" />
                          Test Print
                        </>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(printer)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Printer</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to remove "{printer.name}"?
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(printer.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Tools;
