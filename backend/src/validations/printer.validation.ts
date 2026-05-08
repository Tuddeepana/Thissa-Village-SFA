import { z } from "zod";

const ipv4Regex = /^((25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(25[0-5]|2[0-4]\d|[01]?\d\d?)$/;

export const createPrinterSchema = z.object({
  name: z.string().min(1, "Printer name is required").max(100, "Name too long"),
  ipAddress: z
    .string()
    .min(1, "IP address is required")
    .regex(ipv4Regex, "Invalid IPv4 address"),
  port: z
    .number()
    .int()
    .min(1, "Port must be at least 1")
    .max(65535, "Port must be at most 65535")
    .optional()
    .default(9100),
  type: z.enum(["KOT"]).optional().default("KOT"),
});

export const updatePrinterSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  ipAddress: z.string().regex(ipv4Regex, "Invalid IPv4 address").optional(),
  port: z.number().int().min(1).max(65535).optional(),
  isActive: z.boolean().optional(),
});

export type CreatePrinterInput = z.infer<typeof createPrinterSchema>;
export type UpdatePrinterInput = z.infer<typeof updatePrinterSchema>;
