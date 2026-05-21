import prisma from '../lib/prisma';
import type { PrinterDTO, CreatePrinterInput, UpdatePrinterInput } from '../types/printer.types';
import net from 'net';

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
   * Test printer connectivity by opening a raw TCP socket to the printer's
   * IP and port. If the connection succeeds, send an ESC/POS initialisation
   * command followed by a small test receipt and a paper-cut command.
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
   * Open a raw TCP socket and send ESC/POS commands for a test receipt.
   * The XPrinter XP-80T (and most thermal printers) listen on port 9100
   * and accept standard ESC/POS byte sequences.
   */
  private sendTestPrint(ip: string, port: number, printerName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeoutMs = 5000;
      const client = new net.Socket();

      const timer = setTimeout(() => {
        client.destroy();
        reject(new Error(`Connection timed out after ${timeoutMs / 1000}s — verify IP and port`));
      }, timeoutMs);

      client.connect(port, ip, () => {
        clearTimeout(timer);

        try {
          const now = new Date();
          const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
          const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

          // ESC/POS command bytes
          const ESC = 0x1B;
          const GS = 0x1D;

          const commands: Buffer[] = [];

          // Initialize printer
          commands.push(Buffer.from([ESC, 0x40]));

          // Center alignment
          commands.push(Buffer.from([ESC, 0x61, 0x01]));

          // Bold on
          commands.push(Buffer.from([ESC, 0x45, 0x01]));
          commands.push(Buffer.from('================================\n'));
          commands.push(Buffer.from('     PRINTER TEST\n'));
          commands.push(Buffer.from('================================\n'));
          // Bold off
          commands.push(Buffer.from([ESC, 0x45, 0x00]));

          commands.push(Buffer.from('Tissa Village Bar & Restaurant\n'));
          commands.push(Buffer.from('\n'));

          // Left alignment
          commands.push(Buffer.from([ESC, 0x61, 0x00]));
          commands.push(Buffer.from(`  Printer : ${printerName}\n`));
          commands.push(Buffer.from(`  IP      : ${ip}:${port}\n`));
          commands.push(Buffer.from(`  Date    : ${dateStr}\n`));
          commands.push(Buffer.from(`  Time    : ${timeStr}\n`));
          commands.push(Buffer.from('\n'));

          // Center alignment
          commands.push(Buffer.from([ESC, 0x61, 0x01]));
          // Bold on
          commands.push(Buffer.from([ESC, 0x45, 0x01]));
          commands.push(Buffer.from('Connection Successful!\n'));
          // Bold off
          commands.push(Buffer.from([ESC, 0x45, 0x00]));
          commands.push(Buffer.from('This is a test print.\n'));
          commands.push(Buffer.from('================================\n'));
          commands.push(Buffer.from('\n\n'));

          // Paper cut (partial cut)
          commands.push(Buffer.from([GS, 0x56, 0x41, 0x03]));

          const fullPayload = Buffer.concat(commands);

          client.write(fullPayload, (writeErr) => {
            client.end();
            if (writeErr) {
              reject(new Error(`Failed to send data: ${writeErr.message}`));
            } else {
              resolve();
            }
          });
        } catch (err: any) {
          client.destroy();
          reject(new Error(`Error building print data: ${err.message}`));
        }
      });

      client.on('error', (err) => {
        clearTimeout(timer);
        client.destroy();
        reject(new Error(`TCP connection error: ${err.message}`));
      });
    });
  }
}

export const printerService = new PrinterService();
