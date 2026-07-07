require('dotenv').config();
const express = require('express');
const cors = require('cors');
const net = require('net');

const app = express();

const AGENT_PORT = parseInt(process.env.AGENT_PORT || '4000', 10);
const PRINTER_IP = process.env.PRINTER_IP || '192.168.100.50';
const PRINTER_PORT = parseInt(process.env.PRINTER_PORT || '9100', 10);
const PRINT_AGENT_KEY = process.env.PRINT_AGENT_KEY || 'thissa-kot-agent-2026';

// ── Middleware ────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Auth middleware — validate shared secret key
function validateKey(req, res, next) {
  const key = req.headers['x-print-agent-key'];
  if (key !== PRINT_AGENT_KEY) {
    return res.status(401).json({ success: false, message: 'Invalid or missing agent key' });
  }
  next();
}

// ── TCP Print Helper ─────────────────────────────────────────────────
function sendToPrinter(payload) {
  return new Promise((resolve, reject) => {
    const timeoutMs = 5000;
    const client = new net.Socket();
    let settled = false;

    const finish = (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      client.removeAllListeners();
      client.destroy();
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    };

    const timer = setTimeout(() => {
      finish(new Error(`Connection timed out after ${timeoutMs / 1000}s — verify printer IP and port`));
    }, timeoutMs);

    client.connect(PRINTER_PORT, PRINTER_IP, () => {
      const flushed = client.write(payload, (writeErr) => {
        if (writeErr) {
          finish(new Error(`Failed to send data: ${writeErr.message}`));
        } else if (flushed) {
          // Data was fully flushed to the OS buffer
          finish(null);
        }
        // else: wait for 'drain' event below
      });

      if (!flushed) {
        client.once('drain', () => finish(null));
      }
    });

    client.on('error', (err) => {
      finish(new Error(`TCP connection error: ${err.message}`));
    });
  });
}

// ── ESC/POS Builders ─────────────────────────────────────────────────
const ESC = 0x1B;
const GS = 0x1D;

function buildTestPayload() {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const commands = [];

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
  commands.push(Buffer.from(`  Printer : KOT Printer\n`));
  commands.push(Buffer.from(`  IP      : ${PRINTER_IP}:${PRINTER_PORT}\n`));
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
  commands.push(Buffer.from('Print Agent Test\n'));
  commands.push(Buffer.from('================================\n'));
  commands.push(Buffer.from('\n\n'));
  // Paper cut (partial cut)
  commands.push(Buffer.from([GS, 0x56, 0x41, 0x03]));

  return Buffer.concat(commands);
}

function buildKotPayload(kotData) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const commands = [];
  const lineDashed = '-'.repeat(48) + '\n';
  const lineThick = '='.repeat(48) + '\n';

  const justifyRow = (left, right) => {
    const spaces = 48 - left.length - right.length;
    return left + ' '.repeat(Math.max(0, spaces)) + right + '\n';
  };

  // Init
  commands.push(Buffer.from([ESC, 0x40]));
  // Set Font A (standard)
  commands.push(Buffer.from([ESC, 0x4D, 0x00]));

  // Center for header
  commands.push(Buffer.from([ESC, 0x61, 0x01]));
  // Bold On
  commands.push(Buffer.from([ESC, 0x45, 0x01]));
  // Tissa Village - Double height/width
  commands.push(Buffer.from([GS, 0x21, 0x11]));
  commands.push(Buffer.from('TISSA VILLAGE\n'));
  commands.push(Buffer.from([GS, 0x21, 0x00])); // Normal size

  commands.push(Buffer.from(lineDashed));

  // Print Title - Double height
  commands.push(Buffer.from([GS, 0x21, 0x01]));
  commands.push(Buffer.from('KOT - RESTAURANT\n'));
  commands.push(Buffer.from([GS, 0x21, 0x00])); // Normal size

  commands.push(Buffer.from([ESC, 0x45, 0x00])); // Bold Off
  commands.push(Buffer.from('\n'));

  // Left alignment for info
  commands.push(Buffer.from([ESC, 0x61, 0x00]));

  if (kotData.kotId) {
    commands.push(Buffer.from(justifyRow('KOT ID', kotData.kotId)));
  }
  commands.push(Buffer.from(justifyRow('Date', dateStr)));
  commands.push(Buffer.from(justifyRow('Time', timeStr)));
  commands.push(Buffer.from(justifyRow('Table', kotData.tableName || '')));
  commands.push(Buffer.from(justifyRow('Type', kotData.orderType === 'DINE_IN' ? 'Dine In' : 'Take Away')));
  commands.push(Buffer.from(justifyRow('Steward', kotData.stewardName || '')));
  commands.push(Buffer.from(justifyRow('Cashier', kotData.cashierName || '')));
  if (kotData.customerName) {
    commands.push(Buffer.from(justifyRow('Customer', kotData.customerName)));
  }

  commands.push(Buffer.from(lineDashed));

  if (kotData.remark) {
    commands.push(Buffer.from([ESC, 0x45, 0x01])); // Bold
    commands.push(Buffer.from('Kitchen Instructions:\n'));
    commands.push(Buffer.from([ESC, 0x45, 0x00])); // Bold Off
    commands.push(Buffer.from(`${kotData.remark}\n`));
    commands.push(Buffer.from(lineDashed));
  }

  // Items Header
  commands.push(Buffer.from([ESC, 0x45, 0x01])); // Bold
  commands.push(Buffer.from(justifyRow('Item', 'Qty')));
  commands.push(Buffer.from(lineDashed));

  for (const item of (kotData.items || [])) {
    let itemName = item.product_name || '';
    if (item.unit) itemName += ` (${item.unit})`;

    const maxItemLen = 42;
    const firstLineName = itemName.length > maxItemLen ? itemName.substring(0, maxItemLen) : itemName;
    const qtyStr = item.quantity.toString().padStart(4, ' ');
    const line = firstLineName + ' '.repeat(48 - firstLineName.length - qtyStr.length) + qtyStr + '\n';

    commands.push(Buffer.from(line));

    // Wrap long item names
    if (itemName.length > maxItemLen) {
      let restName = itemName.substring(maxItemLen);
      while (restName.length > 0) {
        const chunk = restName.substring(0, maxItemLen);
        restName = restName.substring(maxItemLen);
        commands.push(Buffer.from(chunk + '\n'));
      }
    }
  }

  commands.push(Buffer.from([ESC, 0x45, 0x00])); // Bold Off
  commands.push(Buffer.from('\n' + lineThick));

  commands.push(Buffer.from([ESC, 0x61, 0x01])); // Center
  commands.push(Buffer.from('*** Kitchen Copy ***\n\n\n\n\n'));

  // Cut
  commands.push(Buffer.from([GS, 0x56, 0x41, 0x03]));

  return Buffer.concat(commands);
}

// ── Routes ───────────────────────────────────────────────────────────

// Health check — no auth required
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    agent: 'KOT Print Agent',
    printer: { ip: PRINTER_IP, port: PRINTER_PORT },
    timestamp: new Date().toISOString(),
  });
});

// Test print — sends a simple test receipt
app.post('/print-test', validateKey, async (_req, res) => {
  try {
    console.log(`🖨️  Sending test print to ${PRINTER_IP}:${PRINTER_PORT}...`);
    const payload = buildTestPayload();
    await sendToPrinter(payload);
    console.log('✅ Test print sent successfully');
    res.json({ success: true, message: `Test print sent to ${PRINTER_IP}:${PRINTER_PORT}` });
  } catch (err) {
    console.error('❌ Test print failed:', err.message);
    res.status(422).json({ success: false, message: err.message });
  }
});

// Print KOT — receives full KOT data
app.post('/print', validateKey, async (req, res) => {
  try {
    const kotData = req.body;
    if (!kotData || !kotData.items || kotData.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid KOT data — items required' });
    }

    console.log(`🖨️  Printing KOT for table "${kotData.tableName}" (${kotData.items.length} items)...`);
    const payload = buildKotPayload(kotData);
    await sendToPrinter(payload);
    console.log('✅ KOT printed successfully');
    res.json({ success: true, message: `KOT printed for table ${kotData.tableName}` });
  } catch (err) {
    console.error('❌ KOT print failed:', err.message);
    res.status(422).json({ success: false, message: err.message });
  }
});

// ── Start Server ─────────────────────────────────────────────────────
app.listen(AGENT_PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║        KOT PRINT AGENT — STARTED            ║');
  console.log('╠══════════════════════════════════════════════╣');
  console.log(`║  Agent URL  : http://localhost:${AGENT_PORT}          ║`);
  console.log(`║  Printer    : ${PRINTER_IP}:${PRINTER_PORT}       ║`);
  console.log('╠══════════════════════════════════════════════╣');
  console.log('║  Endpoints:                                  ║');
  console.log('║    GET  /health      — Agent status           ║');
  console.log('║    POST /print-test  — Test print             ║');
  console.log('║    POST /print       — Print KOT              ║');
  console.log('╠══════════════════════════════════════════════╣');
  console.log('║  Next: Run ngrok to expose this agent:       ║');
  console.log(`║    ngrok http ${AGENT_PORT}                          ║`);
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');
});
