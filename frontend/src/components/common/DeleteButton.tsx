import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { Trash2 } from "lucide-react";

interface DeleteButtonProps {
  onDelete: () => void | Promise<void>;
  itemName?: string;
  title?: string;
  description?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showIcon?: boolean;
  showText?: boolean;
  buttonText?: string;
  disabled?: boolean;
}

export function DeleteButton({
  onDelete,
  itemName,
  title,
  description,
  variant = "ghost",
  size = "icon",
  className = "",
  showIcon = true,
  showText = false,
  buttonText = "Delete",
  disabled = false,
}: DeleteButtonProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onDelete();
    } finally {
      setIsLoading(false);
      setOpen(false);
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={`text-destructive hover:text-destructive hover:bg-destructive/10 ${className}`}
        onClick={() => setOpen(true)}
        disabled={disabled}
      >
        {showIcon && <Trash2 className={`h-4 w-4 ${showText ? "mr-2" : ""}`} />}
        {showText && buttonText}
      </Button>

      <DeleteConfirmDialog
        open={open}
        onOpenChange={setOpen}
        onConfirm={handleConfirm}
        title={title}
        description={description}
        itemName={itemName}
        isLoading={isLoading}
      />
    </>
  );
}
