/* Castford Shell v1 — Universal Brand & Geometry Injector
   Drop this script into ANY page to get:
   1. Hex grid background on body
   2. Raindrop geometry cascade (via rain.js)
   3. localStorage theme persistence
   4. Favicon injection
   5. Castford → Castford text rebrand
   
   Usage: <script src="/site/castford-shell.js" defer></script>
   Respects: data-no-rain, data-no-grid, prefers-reduced-motion */

(function(){
  'use strict';
  var doc = document;
  var html = doc.documentElement;
  var body = doc.body;
  if (!body) return;

  // 1. Theme persistence (read from localStorage)
  var saved = localStorage.getItem('cf-theme');
  if (saved) html.dataset.theme = saved;

  // 2. Favicon injection (if missing)
  if (!doc.querySelector('link[rel="icon"]')) {
    var fav = doc.createElement('link');
    fav.rel = 'icon';
    fav.type = 'image/svg+xml';
    fav.href = '/favicon.svg';
    doc.head.appendChild(fav);
  }

  // 3. Hex grid background on body (if not already set by theme.css and not disabled)
  if (!html.hasAttribute('data-no-grid')) {
    var existing = getComputedStyle(body).backgroundImage;
    if (!existing || existing === 'none' || existing.indexOf('svg') === -1) {
      var isDark = html.dataset.theme === 'night';
      var dayGrid = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='48.5'%3E%3Cpath d='M28 0L56 14L56 34.5L28 48.5L0 34.5L0 14Z' fill='none' stroke='%231A3F7A' stroke-width='0.6' opacity='0.12'/%3E%3C/svg%3E\")";
      var nightGrid = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='48.5'%3E%3Cpath d='M28 0L56 14L56 34.5L28 48.5L0 34.5L0 14Z' fill='none' stroke='%239B8AFF' stroke-width='0.6' opacity='0.14'/%3E%3C/svg%3E\")";
      body.style.backgroundImage = isDark ? nightGrid : dayGrid;
      body.style.backgroundSize = '56px 48.5px';
      body.style.backgroundRepeat = 'repeat';
      body.style.backgroundAttachment = 'fixed';
      
      // Update grid on theme change
      var observer = new MutationObserver(function(muts) {
        muts.forEach(function(m) {
          if (m.attributeName === 'data-theme') {
            body.style.backgroundImage = html.dataset.theme === 'night' ? nightGrid : dayGrid;
          }
        });
      });
      observer.observe(html, { attributes: true, attributeFilter: ['data-theme'] });
    }
  }

  // 4. Load rain.js if not already loaded and not disabled
  if (!html.hasAttribute('data-no-rain') && !doc.querySelector('script[src*="rain.js"]')) {
    var rain = doc.createElement('script');
    rain.src = '/site/rain.js';
    rain.defer = true;
    doc.head.appendChild(rain);
  }

  // 4b. Load consent banner if not already loaded
  if (!doc.querySelector('script[src*="consent-banner"]')) {
    var consent = doc.createElement('script');
    consent.src = '/site/consent-banner.js';
    consent.defer = true;
    doc.head.appendChild(consent);
  }

  // 5. Text rebrand: Castford → Castford (DOM walk)
  var walker = doc.createTreeWalker(body, NodeFilter.SHOW_TEXT, null, false);
  var node;
  while (node = walker.nextNode()) {
    if (node.nodeValue.indexOf('Castford') !== -1) {
      node.nodeValue = node.nodeValue.replace(/Castford/g, 'Castford');
    }
    if (node.nodeValue.indexOf('Finance OS') !== -1) {
      node.nodeValue = node.nodeValue.replace(/Finance OS/g, 'Castford');
    }
  }
  // Also fix title
  if (doc.title.indexOf('Castford') !== -1) {
    doc.title = doc.title.replace(/Castford/g, 'Castford');
  }
  if (doc.title.indexOf('Finance OS') !== -1) {
    doc.title = doc.title.replace(/Finance OS/g, 'Castford');
  }

  // 6. CCPA: Inject "Do Not Sell" link in footer if missing
  var footer = doc.querySelector('.cf-ft-bottom, footer');
  if (footer && !doc.querySelector('[href*="ccpa"], [href*="do-not-sell"]')) {
    var dnsLink = doc.createElement('a');
    dnsLink.href = '/privacy#ccpa';
    dnsLink.textContent = 'Do Not Sell My Info';
    dnsLink.style.cssText = 'color:var(--t3,#6E738F);font-size:13px;text-decoration:none;margin-left:16px';
    var bottomRow = footer.querySelector('div[style*="flex"]') || footer;
    if (bottomRow) bottomRow.appendChild(dnsLink);
  }

})();
