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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { configService } from "@/api/services/configService";
import { printerService, clearAgentConfigCache } from "@/api/services/printerService";
import {
  Printer,
  Wifi,
  WifiOff,
  Loader2,
  CheckCircle2,
  XCircle,
  Save,
  TestTube2,
  RefreshCw,
  Terminal,
  Globe,
  Key,
  Info,
} from "lucide-react";

type AgentStatus = "unknown" | "checking" | "online" | "offline";

const PrinterSetup = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [agentStatus, setAgentStatus] = useState<AgentStatus>("unknown");

  // Form state
  const [agentUrl, setAgentUrl] = useState("");
  const [agentKey, setAgentKey] = useState("");

  // Track saved values to detect changes
  const [savedUrl, setSavedUrl] = useState("");
  const [savedKey, setSavedKey] = useState("");

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const [urlConfig, keyConfig] = await Promise.all([
        configService.get("PRINT_AGENT_URL"),
        configService.get("PRINT_AGENT_KEY"),
      ]);

      setAgentUrl(urlConfig.value || "");
      setAgentKey(keyConfig.value || "");
      setSavedUrl(urlConfig.value || "");
      setSavedKey(keyConfig.value || "");

      // Auto-check agent health if URL is configured
      if (urlConfig.value) {
        checkHealth(urlConfig.value);
      }
    } catch (error: any) {
      console.error("Failed to load config:", error);
      toast.error("Failed to load printer agent configuration");
    } finally {
      setLoading(false);
    }
  };

  const checkHealth = async (url?: string) => {
    const checkUrl = url || agentUrl;
    if (!checkUrl) {
      setAgentStatus("unknown");
      return;
    }

    setAgentStatus("checking");
    try {
      await printerService.checkAgentHealth(checkUrl);
      setAgentStatus("online");
    } catch {
      setAgentStatus("offline");
    }
  };

  const handleSave = async () => {
    if (!agentUrl.trim()) {
      toast.error("Agent URL is required");
      return;
    }
    if (!agentKey.trim()) {
      toast.error("Agent Key is required");
      return;
    }

    try {
      setSaving(true);
      await Promise.all([
        configService.set("PRINT_AGENT_URL", agentUrl.trim()),
        configService.set("PRINT_AGENT_KEY", agentKey.trim()),
      ]);

      setSavedUrl(agentUrl.trim());
      setSavedKey(agentKey.trim());
      clearAgentConfigCache();
      toast.success("Agent configuration saved");

      // Re-check health with new URL
      checkHealth(agentUrl.trim());
    } catch (error: any) {
      console.error("Failed to save config:", error);
      toast.error(error.response?.data?.message || "Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  const handleTestPrint = async () => {
    if (!agentUrl.trim() || !agentKey.trim()) {
      toast.error("Please configure and save the agent URL and key first");
      return;
    }

    setTesting(true);
    try {
      const result = await printerService.testAgentPrint(agentUrl.trim(), agentKey.trim());
      if (result.success) {
        toast.success("Test print sent!", { description: result.message });
        setAgentStatus("online");
      } else {
        toast.error("Test print failed", { description: result.message });
      }
    } catch (error: any) {
      console.error("Test print error:", error);
      toast.error("Test print failed", {
        description: error.message || "Could not reach the print agent",
      });
      setAgentStatus("offline");
    } finally {
      setTesting(false);
    }
  };

  const hasChanges = agentUrl !== savedUrl || agentKey !== savedKey;

  const statusConfig = {
    unknown: { icon: WifiOff, label: "Not Configured", color: "text-muted-foreground", bg: "bg-muted" },
    checking: { icon: Loader2, label: "Checking...", color: "text-yellow-600", bg: "bg-yellow-50 dark:bg-yellow-950" },
    online: { icon: CheckCircle2, label: "Online", color: "text-green-600", bg: "bg-green-50 dark:bg-green-950" },
    offline: { icon: XCircle, label: "Offline", color: "text-red-600", bg: "bg-red-50 dark:bg-red-950" },
  };

  const currentStatus = statusConfig[agentStatus];
  const StatusIcon = currentStatus.icon;

  if (loading) {
    return (
      <div className="space-y-4 md:space-y-6">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-32" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Printer Setup
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Configure the local print agent for KOT printing
          </p>
        </div>

        {/* Agent Status Badge */}
        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${currentStatus.bg}`}
        >
          <StatusIcon
            className={`h-5 w-5 ${currentStatus.color} ${
              agentStatus === "checking" ? "animate-spin" : ""
            }`}
          />
          <span className={`font-medium text-sm ${currentStatus.color}`}>
            Agent: {currentStatus.label}
          </span>
          {agentStatus !== "checking" && savedUrl && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 ml-1"
              onClick={() => checkHealth()}
              title="Refresh status"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Agent Configuration Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Agent Connection</CardTitle>
          </div>
          <CardDescription>
            Enter the ngrok URL and secret key for your locally running print
            agent.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Agent URL */}
          <div className="grid gap-2">
            <Label htmlFor="agent-url" className="flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5" />
              Agent URL
            </Label>
            <Input
              id="agent-url"
              placeholder="https://abc123.ngrok-free.app"
              value={agentUrl}
              onChange={(e) => setAgentUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              The ngrok public URL or local URL (e.g.{" "}
              <code className="bg-muted px-1 rounded">
                http://localhost:4000
              </code>
              )
            </p>
          </div>

          {/* Agent Key */}
          <div className="grid gap-2">
            <Label htmlFor="agent-key" className="flex items-center gap-1.5">
              <Key className="h-3.5 w-3.5" />
              Agent Key
            </Label>
            <Input
              id="agent-key"
              type="password"
              placeholder="Your shared secret key"
              value={agentKey}
              onChange={(e) => setAgentKey(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Must match the{" "}
              <code className="bg-muted px-1 rounded">PRINT_AGENT_KEY</code> in
              the agent's{" "}
              <code className="bg-muted px-1 rounded">.env</code> file
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t">
            <Button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className="flex-1 sm:flex-none"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Configuration
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={handleTestPrint}
              disabled={testing || !savedUrl || !savedKey}
              className="flex-1 sm:flex-none"
            >
              {testing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Printing...
                </>
              ) : (
                <>
                  <TestTube2 className="h-4 w-4 mr-2" />
                  Test Agent Print
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Setup Instructions Card */}
      <Card className="border-dashed">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Terminal className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Setup Guide</CardTitle>
          </div>
          <CardDescription>
            How to start the local print agent on your restaurant PC
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            {/* Step 1 */}
            <div className="flex gap-3">
              <Badge
                variant="outline"
                className="h-6 w-6 rounded-full shrink-0 flex items-center justify-center p-0 text-xs font-bold"
              >
                1
              </Badge>
              <div>
                <p className="font-medium">Install Dependencies</p>
                <code className="block bg-muted rounded px-3 py-2 mt-1 text-xs font-mono">
                  cd print-agent && npm install
                </code>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-3">
              <Badge
                variant="outline"
                className="h-6 w-6 rounded-full shrink-0 flex items-center justify-center p-0 text-xs font-bold"
              >
                2
              </Badge>
              <div>
                <p className="font-medium">Start the Print Agent</p>
                <code className="block bg-muted rounded px-3 py-2 mt-1 text-xs font-mono">
                  npm start
                </code>
                <p className="text-muted-foreground mt-1">
                  Agent runs on{" "}
                  <code className="bg-muted px-1 rounded">
                    http://localhost:4000
                  </code>
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-3">
              <Badge
                variant="outline"
                className="h-6 w-6 rounded-full shrink-0 flex items-center justify-center p-0 text-xs font-bold"
              >
                3
              </Badge>
              <div>
                <p className="font-medium">Start ngrok Tunnel</p>
                <code className="block bg-muted rounded px-3 py-2 mt-1 text-xs font-mono">
                  ngrok http 4000
                </code>
                <p className="text-muted-foreground mt-1">
                  Copy the{" "}
                  <code className="bg-muted px-1 rounded">Forwarding</code> URL
                  (e.g.{" "}
                  <code className="bg-muted px-1 rounded">
                    https://abc123.ngrok-free.app
                  </code>
                  )
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex gap-3">
              <Badge
                variant="outline"
                className="h-6 w-6 rounded-full shrink-0 flex items-center justify-center p-0 text-xs font-bold"
              >
                4
              </Badge>
              <div>
                <p className="font-medium">Paste URL Above & Save</p>
                <p className="text-muted-foreground mt-1">
                  Paste the ngrok URL into the "Agent URL" field above and click
                  Save. The status should turn green.
                </p>
              </div>
            </div>

            {/* Note */}
            <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mt-4">
              <Info className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-amber-800 dark:text-amber-200 text-xs">
                <strong>Free ngrok:</strong> The URL changes every time you restart
                ngrok. Remember to update it here after each restart.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PrinterSetup;
