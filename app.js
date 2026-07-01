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
  
  // Use a proxy approach or direct iframe
  // For external sites, we may need to handle differently
  if (url.startsWith('mailto:') || url.startsWith('https://wa.me/')) {
    window.open(url, '_blank');
    closeWebview();
    return;
  }
  
  webviewFrame.src = url;
  
  // Update nav active state
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
    // Fallback: copy to clipboard
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
  
  // Show install banner after a delay
  setTimeout(() => {
    installBanner.classList.add('active');
  }, 3000);
});

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
    alert('To install:\n\n1. Tap the Share button in Safari\n2. Scroll down and tap "Add to Home Screen"\n3. Tap "Add"');
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
if (window.matchMedia('(display-mode: standalone)').matches || 
    window.navigator.standalone === true) {
  installBanner.classList.remove('active');
  console.log('Running in standalone mode');
}

// Listen for display mode changes
window.matchMedia('(display-mode: standalone)').addEventListener('change', (e) => {
  if (e.matches) {
    installBanner.classList.remove('active');
  }
});

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
  // Swipe from left edge to go back
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
  // Prevent pull-to-refresh when at top
  if (homeContent.scrollTop === 0 && y > startY) {
    e.preventDefault();
  }
}, { passive: false });

console.log('MASSBD App initialized');
