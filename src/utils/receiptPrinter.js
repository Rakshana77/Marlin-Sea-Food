// receiptPrinter.js - Reliable, Isolated 80mm ESC/POS Thermal Receipt Printing

export function printThermalReceipt(elementOrId = 'thermal-receipt-print-area') {
  const element = typeof elementOrId === 'string'
    ? document.getElementById(elementOrId)
    : elementOrId;

  if (!element) {
    console.warn(`Receipt element not found for printing (${elementOrId}), using window.print()`);
    window.print();
    return;
  }

  // Remove existing print iframe if present
  let printFrame = document.getElementById('thermal-print-frame');
  if (printFrame) {
    printFrame.remove();
  }

  // Create an invisible iframe to isolate the receipt for clean 1-page 80mm printing
  printFrame = document.createElement('iframe');
  printFrame.id = 'thermal-print-frame';
  printFrame.style.position = 'fixed';
  printFrame.style.right = '0';
  printFrame.style.bottom = '0';
  printFrame.style.width = '0';
  printFrame.style.height = '0';
  printFrame.style.border = '0';
  printFrame.style.opacity = '0';
  printFrame.style.pointerEvents = 'none';
  document.body.appendChild(printFrame);

  const doc = printFrame.contentWindow.document;
  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8" />
      <title>Thermal Receipt</title>
      <style>
        @page {
          size: 80mm auto;
          margin: 0;
        }
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        html, body {
          width: 80mm;
          max-width: 80mm;
          margin: 0 auto;
          padding: 3mm 2mm;
          background: #ffffff;
          color: #000000;
          font-family: 'Courier New', Courier, monospace;
          font-size: 11px;
          line-height: 1.3;
        }
        .text-center { text-align: center; }
        .text-left { text-align: left; }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }
        .border-b { border-bottom: 1px solid #000000; }
        .border-t { border-top: 1px solid #000000; }
        .border-dashed { border-style: dashed; }
        .flex { display: flex; }
        .justify-between { justify-content: space-between; }
        .items-center { align-items: center; }
        .gap-1 { gap: 4px; }
        .gap-0\\.5 { gap: 2px; }
        .mt-1 { margin-top: 4px; }
        .mt-2 { margin-top: 8px; }
        .mt-3 { margin-top: 12px; }
        .mb-1 { margin-bottom: 4px; }
        .mb-2 { margin-bottom: 8px; }
        .pt-1 { padding-top: 4px; }
        .pt-2 { padding-top: 8px; }
        .pt-4 { padding-top: 16px; }
        .pb-1 { padding-bottom: 4px; }
        .pb-2 { padding-bottom: 8px; }
        .py-0\\.5 { padding-top: 2px; padding-bottom: 2px; }
        .py-1 { padding-top: 4px; padding-bottom: 4px; }
        .text-\\[9px\\] { font-size: 9px; }
        .text-\\[10px\\] { font-size: 10px; }
        .text-\\[11px\\] { font-size: 11px; }
        .text-xs { font-size: 12px; }
        .text-sm { font-size: 14px; }
        .text-base { font-size: 16px; }
        .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .tabular-nums { font-variant-numeric: tabular-nums; }
        .italic { font-style: italic; }
        .uppercase { text-transform: uppercase; }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 8px;
        }
        th, td {
          font-family: inherit;
        }
      </style>
    </head>
    <body>
      ${element.innerHTML}
    </body>
    </html>
  `);
  doc.close();

  // Give the browser time to layout the iframe DOM before calling print
  setTimeout(() => {
    try {
      printFrame.contentWindow.focus();
      printFrame.contentWindow.print();
    } catch (err) {
      console.warn('Iframe print failed, falling back to window.print():', err);
      window.print();
    }
  }, 200);
}
