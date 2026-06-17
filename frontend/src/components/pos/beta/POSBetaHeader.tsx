import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  WifiOff, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Users, 
  Globe, 
  TestTube2,
  Clock,
  Terminal,
  User
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

type AgentStatus = "unknown" | "checking" | "online" | "offline";

interface POSBetaHeaderProps {
  terminalId: string;
  cashierName: string;
  agentStatus: AgentStatus;
  isTestingPrinter: boolean;
  customerType: "local" | "foreigner";
  isBeta: boolean;
  onCustomerTypeChange: (type: "local" | "foreigner") => void;
  onRefreshPrinter: () => void;
  onTestPrint: () => void;
  onToggleBeta: (isBeta: boolean) => void;
}

export function POSBetaHeader({
  terminalId,
  cashierName,
  agentStatus,
  isTestingPrinter,
  customerType,
  isBeta,
  onCustomerTypeChange,
  onRefreshPrinter,
  onTestPrint,
  onToggleBeta,
}: POSBetaHeaderProps) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const statusConfig = {
    unknown: { icon: WifiOff, label: "Printer Unconfigured", className: "unknown" },
    checking: { icon: Loader2, label: "Checking Printer...", className: "checking" },
    online: { icon: CheckCircle2, label: "Printer Online", className: "online" },
    offline: { icon: XCircle, label: "Printer Offline", className: "offline" },
  };

  const currentStatus = statusConfig[agentStatus];
  const StatusIcon = currentStatus.icon;

  return (
    <div className="pos-beta-header flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      {/* Left: Branding & Info */}
      <div className="flex items-center gap-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
            POS Terminal
            <Badge variant="outline" className="text-[10px] uppercase font-bold px-1.5 py-0 border-blue-500/30 text-blue-500 bg-blue-500/10">BETA</Badge>
          </h1>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
            <span className="flex items-center gap-1">
              <Terminal className="h-3.5 w-3.5" />
              {terminalId}
            </span>
            <span className="w-1 h-1 rounded-full bg-border" />
            <span className="flex items-center gap-1">
              <User className="h-3.5 w-3.5" />
              {cashierName}
            </span>
            <span className="w-1 h-1 rounded-full bg-border" />
            <span className="flex items-center gap-1 font-medium text-foreground">
              <Clock className="h-3.5 w-3.5" />
              {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
        </div>
      </div>

      {/* Right: Actions & Toggles */}
      <div className="flex items-center gap-3 md:gap-4 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 hide-scrollbar">
        
        {/* Beta Toggle */}
        <div className="flex items-center gap-2 bg-secondary/50 border border-border px-3 py-1.5 rounded-full">
          <Label htmlFor="beta-toggle" className="text-xs font-semibold cursor-pointer">Beta UI</Label>
          <Switch 
            id="beta-toggle" 
            checked={isBeta} 
            onCheckedChange={onToggleBeta} 
            className="data-[state=checked]:bg-blue-600"
          />
        </div>

        {/* Customer Type Toggle */}
        <div className="pos-segmented">
          <button
            className={customerType === "local" ? "active" : ""}
            onClick={() => onCustomerTypeChange("local")}
          >
            <Users className="h-3.5 w-3.5" />
            Local
          </button>
          <button
            className={customerType === "foreigner" ? "active" : ""}
            onClick={() => onCustomerTypeChange("foreigner")}
          >
            <Globe className="h-3.5 w-3.5" />
            Foreigner
          </button>
        </div>

        {/* Printer Status */}
        <div className="flex items-center gap-2 border-l border-border pl-3 md:pl-4">
          <div className={`pos-printer-status ${currentStatus.className}`}>
            <span className={`pos-printer-dot ${currentStatus.className}`} />
            <span className="hidden sm:inline">{currentStatus.label}</span>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full bg-secondary/50 border border-border"
            onClick={onRefreshPrinter}
            title="Refresh printer status"
            disabled={agentStatus === "checking"}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${agentStatus === "checking" ? "animate-spin text-blue-500" : "text-muted-foreground"}`} />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full bg-secondary/50 border border-border"
            onClick={onTestPrint}
            title="Test Print"
            disabled={isTestingPrinter}
          >
            <TestTube2 className={`h-3.5 w-3.5 ${isTestingPrinter ? "text-blue-500" : "text-muted-foreground"}`} />
          </Button>
        </div>
      </div>
    </div>
  );
}
