// Toast Notification System

export function showToast(message, type = 'success') {
  const container = document.getElementById('modal-root');
  if (!container) return;

  const existingToast = document.getElementById('global-toast');
  if (existingToast) existingToast.remove();

  const icons = {
    success: 'check_circle',
    info: 'info',
    warning: 'warning',
    error: 'error'
  };

  const bgStyles = {
    success: 'bg-primary-container text-on-primary border-secondary-fixed/30',
    info: 'bg-primary text-on-primary border-tertiary-fixed/30',
    warning: 'bg-warning-bg text-warning border-warning/40',
    error: 'bg-error text-on-error border-error-container'
  };

  const iconColors = {
    success: 'text-secondary-fixed',
    info: 'text-tertiary-fixed',
    warning: 'text-warning',
    error: 'text-on-error'
  };

  const toast = document.createElement('div');
  toast.id = 'global-toast';
  toast.className = `fixed bottom-20 lg:bottom-8 right-4 lg:right-8 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border shadow-xl animate-slide-up transition-all ${bgStyles[type] || bgStyles.success}`;
  
  toast.innerHTML = `
    <span class="material-symbols-outlined text-[20px] ${iconColors[type] || iconColors.success}">${icons[type] || 'check_circle'}</span>
    <span class="text-sm font-medium tracking-tight">${message}</span>
    <button class="ml-2 text-outline-variant hover:text-white transition-colors" onclick="this.parentElement.remove()">
      <span class="material-symbols-outlined text-[16px]">close</span>
    </button>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    if (toast && toast.parentElement) {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 250);
    }
  }, 3200);
}
