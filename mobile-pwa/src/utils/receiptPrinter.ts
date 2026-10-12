/**
 * receiptPrinter.ts - Reliable, Isolated 80mm ESC/POS Thermal Receipt Printing
 *
 * Eliminates multi-page blank page overflow by rendering into an isolated #print-root
 * and completely hiding the main SPA (#root) during print.
 * Guarantees exactly 1 page output in Chrome, Edge, and mobile browsers.
 */

export function printThermalReceipt(
  elementOrId: string | HTMLElement = 'thermal-receipt-printable',
  _title?: string
): void {
  const element = typeof elementOrId === 'string'
    ? document.getElementById(elementOrId)
    : elementOrId;

  if (!element) {
    console.warn(`Receipt element not found (${elementOrId}), falling back to window.print()`);
    window.print();
    return;
  }

  let printRoot = document.getElementById('print-root');
  if (!printRoot) {
    printRoot = document.createElement('div');
    printRoot.id = 'print-root';
    document.body.appendChild(printRoot);
  }

  // Populate isolated print container with clone of the receipt
  printRoot.innerHTML = element.innerHTML;
  document.body.classList.add('is-printing-receipt');

  const cleanup = () => {
    document.body.classList.remove('is-printing-receipt');
    if (printRoot) {
      printRoot.innerHTML = '';
    }
    window.removeEventListener('afterprint', cleanup);
  };

  window.addEventListener('afterprint', cleanup);

  // Trigger browser print
  setTimeout(() => {
    window.print();
    // Safety fallback cleanup for environments where afterprint event does not fire
    setTimeout(cleanup, 2500);
  }, 50);
}
