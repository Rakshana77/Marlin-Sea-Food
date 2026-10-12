// LoginView Component - Marine Seafoods Authentication Terminal
import { store } from '../state/store.js';
import { showToast } from '../components/Toast.js';

export function renderLoginView() {
  const companyName = store.getCompanyName();

  return `
    <div class="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-primary via-primary-container to-[#001428] relative overflow-hidden select-none">
      
      <!-- Background Ambient Glow & Waves -->
      <div class="absolute -top-32 -left-32 w-96 h-96 bg-secondary-marine/20 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute -bottom-32 -right-32 w-96 h-96 bg-primary-fixed/15 rounded-full blur-3xl pointer-events-none"></div>

      <!-- Main Login Card -->
      <div class="w-full max-w-md bg-surface-container-lowest/95 backdrop-blur-md rounded-2xl border border-outline-variant/60 shadow-2xl p-8 flex flex-col gap-6 relative z-10 animate-fade-in">
        
        <!-- Header Branding -->
        <div class="flex flex-col items-center text-center">
          <div class="w-14 h-14 rounded-2xl bg-primary text-secondary-fixed flex items-center justify-center shadow-lg border border-secondary-fixed/30 mb-3">
            <span class="material-symbols-outlined text-[32px]">anchor</span>
          </div>
          <h1 class="font-headline-md text-headline-md text-primary font-bold tracking-tight">
            ${companyName}
          </h1>
          <p class="text-xs text-on-surface-variant font-medium mt-1">
            Seafood Procurement, Cold Chain & Wholesale ERP Terminal
          </p>
          <div class="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary-container/40 text-secondary-marine text-[11px] font-mono font-bold">
            <span class="w-2 h-2 rounded-full bg-profit animate-pulse"></span>
            <span>LIVE B2B TERMINAL</span>
          </div>
        </div>

        <!-- Login Form -->
        <form id="login-form" class="flex flex-col gap-4">
          <div id="login-error-banner" class="hidden p-3 rounded-lg bg-error-container text-on-error-container text-xs font-medium flex items-center gap-2">
            <span class="material-symbols-outlined text-[18px]">error</span>
            <span id="login-error-text">Invalid email or password</span>
          </div>

          <div>
            <label class="block text-xs font-semibold text-primary mb-1">Email / Username</label>
            <div class="relative">
              <span class="material-symbols-outlined absolute left-3 top-2.5 text-outline text-[18px]">person</span>
              <input 
                type="text" 
                id="login-email" 
                required 
                placeholder="admin@marineseafoods.com" 
                class="w-full h-10 pl-9 pr-3 rounded-lg bg-surface border border-outline-variant text-xs text-primary font-mono focus:outline-none focus:ring-2 focus:ring-secondary-marine"
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-primary mb-1">Password</label>
            <div class="relative">
              <span class="material-symbols-outlined absolute left-3 top-2.5 text-outline text-[18px]">lock</span>
              <input 
                type="password" 
                id="login-password" 
                required 
                placeholder="••••••••" 
                class="w-full h-10 pl-9 pr-3 rounded-lg bg-surface border border-outline-variant text-xs text-primary font-mono focus:outline-none focus:ring-2 focus:ring-secondary-marine"
              />
            </div>
          </div>

          <button 
            type="submit" 
            id="login-submit-btn" 
            class="w-full py-3 rounded-lg bg-primary hover:bg-primary-container text-white font-bold text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 mt-1"
          >
            <span class="material-symbols-outlined text-[18px] text-secondary-fixed">login</span>
            <span id="login-btn-text">SIGN IN TO TERMINAL</span>
          </button>
        </form>

        <!-- Fast 1-Click Role Login Quickfill Buttons -->
        <div class="border-t border-outline-variant/60 pt-4 flex flex-col gap-2">
          <span class="text-[11px] text-outline text-center uppercase tracking-wider font-bold">1-Click Fast Role Sign In</span>
          <div class="grid grid-cols-2 gap-2">
            <button 
              type="button" 
              id="quick-login-admin" 
              class="p-2.5 rounded-lg border border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary font-bold text-xs flex flex-col items-center gap-1 transition-all"
            >
              <div class="flex items-center gap-1">
                <span class="material-symbols-outlined text-[16px] text-primary">admin_panel_settings</span>
                <span>ADMIN ROLE</span>
              </div>
              <span class="text-[10px] text-outline font-normal">Full Modules Access</span>
            </button>

            <button 
              type="button" 
              id="quick-login-worker" 
              class="p-2.5 rounded-lg border border-secondary-marine/30 bg-secondary-marine/5 hover:bg-secondary-marine/10 text-secondary-marine font-bold text-xs flex flex-col items-center gap-1 transition-all"
            >
              <div class="flex items-center gap-1">
                <span class="material-symbols-outlined text-[16px]">badge</span>
                <span>WORKER ROLE</span>
              </div>
              <span class="text-[10px] text-outline font-normal">Billing & Rates Only</span>
            </button>
          </div>
        </div>

        <!-- Security Footer -->
        <div class="pt-2 text-center text-[10px] text-outline flex items-center justify-center gap-1">
          <span class="material-symbols-outlined text-[14px] text-profit">verified_user</span>
          <span>Role-Based Access Control • Cryptographically Signed Session</span>
        </div>

      </div>
    </div>
  `;
}

export function bindLoginEvents() {
  const form = document.getElementById('login-form');
  const submitBtn = document.getElementById('login-submit-btn');
  const btnText = document.getElementById('login-btn-text');
  const errorBanner = document.getElementById('login-error-banner');
  const errorText = document.getElementById('login-error-text');

  const emailInput = document.getElementById('login-email');
  const passInput = document.getElementById('login-password');

  const handleLogin = async (email, password) => {
    if (!email || !password) return;

    // Double submission protection
    submitBtn.disabled = true;
    submitBtn.classList.add('opacity-75', 'cursor-not-allowed');
    btnText.textContent = 'AUTHENTICATING...';
    errorBanner.classList.add('hidden');

    try {
      await store.login(email, password);
      showToast(`Welcome, logged in as ${store.state.user?.name} (${store.state.user?.role})`, 'success');
    } catch (err) {
      errorText.textContent = err.message || 'Authentication failed. Please verify credentials.';
      errorBanner.classList.remove('hidden');
    } finally {
      submitBtn.disabled = false;
      submitBtn.classList.remove('opacity-75', 'cursor-not-allowed');
      btnText.textContent = 'SIGN IN TO TERMINAL';
    }
  };

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      handleLogin(emailInput.value.trim(), passInput.value.trim());
    });
  }

  // Quick Login Admin
  const adminBtn = document.getElementById('quick-login-admin');
  if (adminBtn) {
    adminBtn.addEventListener('click', () => {
      if (emailInput && passInput) {
        emailInput.value = 'admin@marineseafoods.com';
        passInput.value = 'admin123';
      }
      handleLogin('admin@marineseafoods.com', 'admin123');
    });
  }

  // Quick Login Worker
  const workerBtn = document.getElementById('quick-login-worker');
  if (workerBtn) {
    workerBtn.addEventListener('click', () => {
      if (emailInput && passInput) {
        emailInput.value = 'worker@marineseafoods.com';
        passInput.value = 'worker123';
      }
      handleLogin('worker@marineseafoods.com', 'worker123');
    });
  }
}
