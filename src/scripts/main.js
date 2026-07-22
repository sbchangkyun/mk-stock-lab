import { getBrowserSupabaseClient } from '../lib/supabase';

const supabase = getBrowserSupabaseClient();
if (supabase) {
  window.supabase = supabase;
}

const moonIconPath = '<path d="M12 4a8 8 0 1 0 8 8 6 6 0 0 1-8-8Z"></path>';
const sunIconPath = '<circle cx="12" cy="12" r="4"></circle><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"></path>';
let countdownInterval;

function applyTheme(theme) {
  const isDark = theme === 'dark';
  document.body.classList.toggle('dark-mode', isDark);
  localStorage.setItem('theme', theme);

  const icon = document.getElementById('themeIcon');
  if (icon) icon.innerHTML = isDark ? sunIconPath : moonIconPath;

  if (typeof window.renderMarketTicker === 'function') {
    window.renderMarketTicker(theme);
  }
}

function toggleTheme() {
  const nextTheme = document.body.classList.contains('dark-mode') ? 'light' : 'dark';
  applyTheme(nextTheme);
}

function startAdCountdown() {
  const popup = document.getElementById('slidePopup');
  if (!popup || popup.classList.contains('active')) return;

  let seconds = 10;
  popup.classList.add('active');
  clearInterval(countdownInterval);
  countdownInterval = window.setInterval(() => {
    seconds -= 1;
    const timer = document.getElementById('timerText');
    if (timer) timer.textContent = String(seconds);
    if (seconds <= 0) window.closePopup();
  }, 1000);
}

window.closePopup = function closePopup() {
  const popup = document.getElementById('slidePopup');
  const hideToday = document.getElementById('noShowCheckbox');
  if (hideToday?.checked) {
    localStorage.setItem('adPopupExpire', String(Date.now() + 86400000));
  }
  popup?.classList.remove('active');
  clearInterval(countdownInterval);
};

window.closeBottomAd = function closeBottomAd() {
  const banner = document.getElementById('bottomAdBanner');
  if (banner) banner.style.display = 'none';
};

function initShell() {
  applyTheme(localStorage.getItem('theme') || 'light');
  document.getElementById('themeToggle')?.addEventListener('click', toggleTheme);

  const expire = Number(localStorage.getItem('adPopupExpire') || '0');
  if (!expire || Date.now() > expire) {
    window.setTimeout(startAdCountdown, 800);
  }
}

document.addEventListener('astro:page-load', initShell);
initShell();
