import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Barcode, X } from "lucide-react";

interface BarcodeScannerProps {
  value: string;
  onChange: (barcode: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
}

export const BarcodeScanner = ({
  value,
  onChange,
  label = "Barcode",
  placeholder = "Scan or enter barcode",
  className = "",
}: BarcodeScannerProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scanBufferRef = useRef<string>("");
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Auto-focus when scanning mode is active
    if (isScanning && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isScanning]);

  useEffect(() => {
    // Handle barcode scanner input (typically scans very fast)
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isScanning) return;

      // Ignore if user is typing in other inputs
      const target = e.target as HTMLElement;
      if (target !== inputRef.current && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) {
        return;
      }

      // Clear existing timeout
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }

      // Enter key signals end of barcode scan
      if (e.key === "Enter") {
        e.preventDefault();
        if (scanBufferRef.current) {
          onChange(scanBufferRef.current);
          scanBufferRef.current = "";
          setIsScanning(false);
        }
        return;
      }

      // Accumulate characters
      if (e.key.length === 1) {
        scanBufferRef.current += e.key;
      }

      // Auto-complete after brief pause (barcode scanners type very fast)
      scanTimeoutRef.current = setTimeout(() => {
        if (scanBufferRef.current) {
          onChange(scanBufferRef.current);
          scanBufferRef.current = "";
          setIsScanning(false);
        }
      }, 100); // 100ms pause indicates end of scan
    };

    if (isScanning) {
      window.addEventListener("keypress", handleKeyPress);
      return () => {
        window.removeEventListener("keypress", handleKeyPress);
        if (scanTimeoutRef.current) {
          clearTimeout(scanTimeoutRef.current);
        }
      };
    }
  }, [isScanning, onChange]);

  const handleClear = () => {
    onChange("");
    scanBufferRef.current = "";
  };

  const toggleScanning = () => {
    if (isScanning) {
      scanBufferRef.current = "";
    }
    setIsScanning(!isScanning);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor="barcode">{label}</Label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            ref={inputRef}
            id="barcode"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={isScanning ? "border-green-500 bg-green-50 dark:bg-green-950" : ""}
          />
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={handleClear}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <Button
          type="button"
          variant={isScanning ? "destructive" : "outline"}
          onClick={toggleScanning}
          className="flex-shrink-0"
        >
          <Barcode className="h-4 w-4 mr-2" />
          {isScanning ? "Stop Scan" : "Scan"}
        </Button>
      </div>
      {isScanning && (
        <p className="text-xs text-green-600 dark:text-green-400 animate-pulse">
          Ready to scan... Use your barcode scanner or type manually
        </p>
      )}
    </div>
  );
};

