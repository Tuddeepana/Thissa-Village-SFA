import prisma from '../lib/prisma';
import type { PrinterDTO, CreatePrinterInput, UpdatePrinterInput } from '../types/printer.types';
import {
  ThermalPrinter,
  PrinterTypes,
  CharacterSet,
  BreakLine,
} from 'node-thermal-printer';

function toPrinterDTO(record: any): PrinterDTO {
  return {
    id: record.id,
    name: record.name,
    ipAddress: record.ipAddress,
    port: record.port,
    type: record.type,
    isActive: record.isActive,
    lastTestedAt: record.lastTestedAt,
    lastTestOk: record.lastTestOk,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

/**
 * Create a ThermalPrinter instance configured for an Xprinter
 * connected via network (TCP).
 */
function createPrinterInstance(ip: string, port: number): ThermalPrinter {
  return new ThermalPrinter({
    type: PrinterTypes.EPSON, // Xprinter uses EPSON-compatible ESC/POS
    interface: `tcp://${ip}:${port}`,
    characterSet: CharacterSet.PC437_USA,
    removeSpecialCharacters: false,
    lineCharacter: '-',
    breakLine: BreakLine.WORD,
    options: {
      timeout: 5000, // 5 second connection timeout
    },
  });
}

class PrinterService {
  /**
   * Get all configured printers
   */
  async getAll(): Promise<PrinterDTO[]> {
    const printers = await (prisma as any).printer.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return printers.map(toPrinterDTO);
  }

  /**
   * Get a single printer by ID
   */
  async getById(id: string): Promise<PrinterDTO | null> {
    const printer = await (prisma as any).printer.findUnique({
      where: { id },
    });
    return printer ? toPrinterDTO(printer) : null;
  }

  /**
   * Create a new printer configuration
   */
  async create(input: CreatePrinterInput): Promise<PrinterDTO> {
    const printer = await (prisma as any).printer.create({
      data: {
        name: input.name,
        ipAddress: input.ipAddress,
        port: input.port ?? 9100,
        type: input.type ?? 'KOT',
      },
    });
    return toPrinterDTO(printer);
  }

  /**
   * Update an existing printer
   */
  async update(id: string, input: UpdatePrinterInput): Promise<PrinterDTO> {
    const data: any = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.ipAddress !== undefined) data.ipAddress = input.ipAddress;
    if (input.port !== undefined) data.port = input.port;
    if (input.isActive !== undefined) data.isActive = input.isActive;

    const printer = await (prisma as any).printer.update({
      where: { id },
      data,
    });
    return toPrinterDTO(printer);
  }

  /**
   * Delete a printer configuration
   */
  async delete(id: string): Promise<PrinterDTO> {
    const printer = await (prisma as any).printer.delete({
      where: { id },
    });
    return toPrinterDTO(printer);
  }

  /**
   * Test printer connectivity using node-thermal-printer.
   * Sends a formatted test receipt to the printer and cuts the paper.
   *
   * Updates lastTestedAt / lastTestOk in the database regardless of outcome.
   */
  async testConnection(id: string): Promise<{ success: boolean; message: string; printer: PrinterDTO }> {
    const record = await (prisma as any).printer.findUnique({ where: { id } });
    if (!record) {
      throw new Error('Printer not found');
    }

    const { ipAddress, port, name } = record;

    try {
      await this.sendTestPrint(ipAddress, port, name);

      // Mark success in DB
      const updated = await (prisma as any).printer.update({
        where: { id },
        data: { lastTestedAt: new Date(), lastTestOk: true },
      });

      return {
        success: true,
        message: `Test print sent successfully to ${name} (${ipAddress}:${port})`,
        printer: toPrinterDTO(updated),
      };
    } catch (error: any) {
      // Mark failure in DB
      const updated = await (prisma as any).printer.update({
        where: { id },
        data: { lastTestedAt: new Date(), lastTestOk: false },
      });

      return {
        success: false,
        message: error.message || `Failed to connect to ${name} (${ipAddress}:${port})`,
        printer: toPrinterDTO(updated),
      };
    }
  }

  /**
   * Send a test print using node-thermal-printer library.
   * Uses EPSON-compatible ESC/POS commands via TCP.
   */
  private async sendTestPrint(ip: string, port: number, printerName: string): Promise<void> {
    const printer = createPrinterInstance(ip, port);

    // Check connectivity first
    const isConnected = await printer.isPrinterConnected();
    if (!isConnected) {
      throw new Error(`Cannot connect to printer at ${ip}:${port} — verify IP, port, and that the printer is powered on and on the same network.`);
    }

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const timeStr = now.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    // Build the test receipt
    printer.alignCenter();
    printer.bold(true);
    printer.setTextSize(1, 1);
    printer.println('================================');
    printer.println('     PRINTER TEST');
    printer.println('================================');
    printer.bold(false);

    printer.println('');
    printer.println('Tissa Village Bar & Restaurant');
    printer.println('');

    printer.alignLeft();
    printer.println(`  Printer : ${printerName}`);
    printer.println(`  IP      : ${ip}:${port}`);
    printer.println(`  Date    : ${dateStr}`);
    printer.println(`  Time    : ${timeStr}`);
    printer.println('');

    printer.alignCenter();
    printer.bold(true);
    printer.println('Connection Successful!');
    printer.bold(false);
    printer.println('This is a test print from SFA.');
    printer.println('================================');

    printer.println('');
    printer.println('');

    // Cut paper
    printer.cut();

    // Execute — send all commands to the printer
    try {
      await printer.execute();
    } catch (execError: any) {
      throw new Error(`Failed to send print data: ${execError.message}`);
    }
  }
}

export const printerService = new PrinterService();
