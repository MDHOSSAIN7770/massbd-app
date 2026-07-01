// MASSBD PWA App
let deferredInstallPrompt = null;
const webviewContainer = document.getElementById('webview-container');
const webviewFrame = document.getElementById('webview-frame');
const webviewTitle = document.getElementById('webview-title');
const webviewLoader = document.getElementById('webview-loader');
const homeContent = document.getElementById('home-content');
const splashScreen = document.getElementById('splash-screen');
const offlineIndicator = document.getElementById('offline-indicator');
const installBanner = document.getElementById('install-banner');

// ========== CHECK IF USER CAME FROM "INSTALL" BUTTON (WordPress/Google Sites) ==========
const urlParams = new URLSearchParams(window.location.search);
const wantsAutoInstall = urlParams.get('install') === '1';

// ========== SPLASH SCREEN ==========
window.addEventListener('load', () => {
  setTimeout(() => {
    splashScreen.classList.add('hidden');
  }, 2000);
});

// ========== SERVICE WORKER ==========
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js')
    .then(reg => console.log('Service Worker registered:', reg.scope))
    .catch(err => console.log('Service Worker registration failed:', err));
}

// ========== OFFLINE DETECTION ==========
function updateOnlineStatus() {
  if (navigator.onLine) {
    offlineIndicator.classList.remove('active');
  } else {
    offlineIndicator.classList.add('active');
  }
}
window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);
updateOnlineStatus();

// ========== WEBVIEW ==========
function openWebview(url, title) {
  webviewTitle.textContent = title || 'Loading...';
  webviewLoader.classList.add('active');
  webviewContainer.classList.add('active');
  homeContent.style.display = 'none';
  document.querySelector('.bottom-nav').style.display = 'none';
  document.querySelector('.app-header').style.display = 'none';

  if (url.startsWith('mailto:') || url.startsWith('https://wa.me/')) {
    window.open(url, '_blank');
    closeWebview();
    return;
  }

  webviewFrame.src = url;

  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
  if (title === 'Training') document.getElementById('nav-training').classList.add('active');
  if (title === 'Income') document.getElementById('nav-income').classList.add('active');
  if (title === 'Contact') document.getElementById('nav-contact').classList.add('active');
}

webviewFrame.addEventListener('load', () => {
  webviewLoader.classList.remove('active');
});

function closeWebview() {
  webviewContainer.classList.remove('active');
  homeContent.style.display = 'block';
  document.querySelector('.bottom-nav').style.display = 'flex';
  document.querySelector('.app-header').style.display = 'flex';
  webviewFrame.src = '';

  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
  document.getElementById('nav-home').classList.add('active');
}

function goHome() {
  closeWebview();
}

document.getElementById('back-btn').addEventListener('click', closeWebview);

// ========== REFRESH ==========
document.getElementById('refresh-btn').addEventListener('click', () => {
  if (webviewContainer.classList.contains('active')) {
    webviewFrame.src = webviewFrame.src;
    webviewLoader.classList.add('active');
  } else {
    location.reload();
  }
});

// ========== SHARE ==========
document.getElementById('share-btn').addEventListener('click', async () => {
  const shareData = {
    title: 'MASSBD Job Training',
    text: 'Learn job skills and earn money online with MASSBD!',
    url: 'https://massbd.org/job-training/'
  };

  if (navigator.share) {
    try {
      await navigator.share(shareData);
    } catch (err) {
      console.log('Share cancelled');
    }
  } else {
    const text = `${shareData.title}\n${shareData.text}\n${shareData.url}`;
    navigator.clipboard.writeText(text).then(() => {
      alert('Link copied to clipboard!');
    });
  }
});

// ========== INSTALL PROMPT ==========
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;

  if (wantsAutoInstall) {
    // ব্যবহারকারী WordPress/Google Sites-এর বাটন থেকে এসেছে -> সাথে সাথে দেখাও, দেরি না করে
    installBanner.classList.add('active');
    // চেষ্টা করো সরাসরি native install dialog auto-trigger করতে
    tryAutoPrompt();
  } else {
    // Normal visitor -> ৩ সেকেন্ড পর দেখাও (আগের মতোই)
    setTimeout(() => {
      installBanner.classList.add('active');
    }, 3000);
  }
});

async function tryAutoPrompt() {
  if (!deferredInstallPrompt) return;
  try {
    deferredInstallPrompt.prompt();
    const { outcome } = await deferredInstallPrompt.userChoice;
    if (outcome === 'accepted') {
      installBanner.classList.remove('active');
    }
    deferredInstallPrompt = null;
  } catch (err) {
    // ব্রাউজার auto-prompt ব্লক করলে, banner-ই দেখা থাকবে,
    // ব্যবহারকারী নিজে "Install" বাটনে ট্যাপ করলে নিচের handler কাজ করবে
    console.log('Auto prompt blocked, waiting for manual tap:', err);
  }
}

document.getElementById('install-btn').addEventListener('click', async () => {
  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    const { outcome } = await deferredInstallPrompt.userChoice;
    if (outcome === 'accepted') {
      installBanner.classList.remove('active');
    }
    deferredInstallPrompt = null;
  } else {
    // iOS manual instructions
    showIOSInstallInstructions();
  }
});

document.getElementById('install-close').addEventListener('click', () => {
  installBanner.classList.remove('active');
});

// Check if already installed
window.addEventListener('appinstalled', () => {
  installBanner.classList.remove('active');
  deferredInstallPrompt = null;
  console.log('App installed!');
});

// Hide install banner if in standalone mode
const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;

if (isStandalone) {
  installBanner.classList.remove('active');
  console.log('Running in standalone mode');
}

window.matchMedia('(display-mode: standalone)').addEventListener('change', (e) => {
  if (e.matches) {
    installBanner.classList.remove('active');
  }
});

// ========== iOS INSTALL INSTRUCTIONS (nicer popup instead of plain alert) ==========
function showIOSInstallInstructions() {
  if (document.getElementById('ios-install-overlay')) return; // already shown

  const overlay = document.createElement('div');
  overlay.id = 'ios-install-overlay';
  overlay.style.cssText = `
    position:fixed; inset:0; background:rgba(0,0,0,0.6);
    display:flex; align-items:flex-end; justify-content:center; z-index:99999;
  `;
  overlay.innerHTML = `
    <div style="background:#fff; border-radius:16px 16px 0 0; padding:24px;
                text-align:center; width:100%; max-width:420px;
                box-shadow:0 -10px 40px rgba(0,0,0,0.3); font-family:sans-serif;">
      <div style="font-size:36px; margin-bottom:8px;">📲</div>
      <h3 style="margin:0 0 12px; color:#1e2937;">Home Screen-এ যোগ করুন</h3>
      <p style="color:#555; font-size:14px; line-height:1.6; text-align:left;">
        ১. নিচের <strong>Share</strong> বাটনে (⬆️) ট্যাপ করুন<br>
        ২. <strong>"Add to Home Screen"</strong> সিলেক্ট করুন<br>
        ৩. <strong>"Add"</strong>-এ ট্যাপ করে কনফার্ম করুন
      </p>
      <button id="closeIosOverlay" style="
        margin-top:16px; background:#1e88e5; color:#fff; border:none;
        padding:12px 28px; border-radius:8px; font-weight:bold; width:100%;">
        বুঝেছি
      </button>
    </div>`;
  document.body.appendChild(overlay);
  document.getElementById('closeIosOverlay').addEventListener('click', () => {
    overlay.remove();
  });
}

// যদি iOS হয় এবং ?install=1 দিয়ে এসেছে -> সাথে সাথে instructions দেখাও
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
if (isIOS && !isStandalone && wantsAutoInstall) {
  setTimeout(() => {
    showIOSInstallInstructions();
  }, 1200);
}

// ========== SWIPE BACK GESTURE ==========
let touchStartX = 0;
let touchEndX = 0;

webviewContainer.addEventListener('touchstart', (e) => {
  touchStartX = e.changedTouches[0].screenX;
}, { passive: true });

webviewContainer.addEventListener('touchend', (e) => {
  touchEndX = e.changedTouches[0].screenX;
  handleSwipe();
}, { passive: true });

function handleSwipe() {
  if (touchEndX - touchStartX > 100 && touchStartX < 30) {
    closeWebview();
  }
}

// ========== PULL-TO-REFRESH PREVENTION (home screen) ==========
let startY = 0;
homeContent.addEventListener('touchstart', (e) => {
  startY = e.touches[0].pageY;
}, { passive: true });

homeContent.addEventListener('touchmove', (e) => {
  const y = e.touches[0].pageY;
  if (homeContent.scrollTop === 0 && y > startY) {
    e.preventDefault();
  }
}, { passive: false });

console.log('MASSBD App initialized');
