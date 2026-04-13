/**
 * Castford Visual Energy System v1
 * Injected into every dashboard page to add life, motion, and polish.
 * 
 * Features:
 * 1. Intersection Observer scroll-reveal animations
 * 2. KPI number counting animations
 * 3. Chart bar entrance animations  
 * 4. Cursor glow on cards
 * 5. Ambient gradient orb
 * 6. Smooth page load orchestration
 * 7. Active pulse on live indicators
 * 8. Parallax depth on scroll
 */

(function CastfordEnergy() {
  'use strict';

  // === INJECT ENERGY CSS ===
  const css = document.createElement('style');
  css.id = 'castford-energy-css';
  css.textContent = `
    /* Scroll reveal */
    [data-energy] {
      opacity: 0;
      transform: translateY(18px);
      transition: opacity 0.7s cubic-bezier(0.22, 1, 0.36, 1),
                  transform 0.7s cubic-bezier(0.22, 1, 0.36, 1);
    }
    [data-energy].revealed {
      opacity: 1;
      transform: translateY(0);
    }
    [data-energy="left"] {
      transform: translateX(-24px) translateY(0);
    }
    [data-energy="left"].revealed {
      transform: translateX(0);
    }
    [data-energy="right"] {
      transform: translateX(24px) translateY(0);
    }
    [data-energy="right"].revealed {
      transform: translateX(0);
    }
    [data-energy="scale"] {
      transform: scale(0.95);
    }
    [data-energy="scale"].revealed {
      transform: scale(1);
    }

    /* Stagger children */
    [data-stagger] > * {
      opacity: 0;
      transform: translateY(14px);
      transition: opacity 0.5s cubic-bezier(0.22, 1, 0.36, 1),
                  transform 0.5s cubic-bezier(0.22, 1, 0.36, 1);
    }
    [data-stagger].revealed > * {
      opacity: 1;
      transform: translateY(0);
    }
    [data-stagger].revealed > *:nth-child(1) { transition-delay: 0.05s }
    [data-stagger].revealed > *:nth-child(2) { transition-delay: 0.10s }
    [data-stagger].revealed > *:nth-child(3) { transition-delay: 0.15s }
    [data-stagger].revealed > *:nth-child(4) { transition-delay: 0.20s }
    [data-stagger].revealed > *:nth-child(5) { transition-delay: 0.25s }
    [data-stagger].revealed > *:nth-child(6) { transition-delay: 0.30s }
    [data-stagger].revealed > *:nth-child(7) { transition-delay: 0.35s }
    [data-stagger].revealed > *:nth-child(8) { transition-delay: 0.40s }

    /* Cursor glow on cards */
    .energy-glow {
      position: relative;
      overflow: hidden;
    }
    .energy-glow::after {
      content: '';
      position: absolute;
      width: 300px;
      height: 300px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%);
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.4s;
      transform: translate(-50%, -50%);
      z-index: 0;
    }
    .energy-glow:hover::after {
      opacity: 1;
    }

    /* Ambient orb */
    .energy-ambient {
      position: fixed;
      width: 600px;
      height: 600px;
      border-radius: 50%;
      pointer-events: none;
      z-index: 0;
      filter: blur(120px);
      opacity: 0.04;
      animation: energy-drift 25s ease-in-out infinite;
    }
    .energy-ambient-1 {
      background: linear-gradient(135deg, #3b82f6, #8b5cf6);
      top: -200px;
      right: -100px;
    }
    .energy-ambient-2 {
      background: linear-gradient(135deg, #06b6d4, #10b981);
      bottom: -200px;
      left: -100px;
      animation-delay: -12s;
      animation-direction: reverse;
    }
    @keyframes energy-drift {
      0%, 100% { transform: translate(0, 0) scale(1); }
      25% { transform: translate(30px, -20px) scale(1.05); }
      50% { transform: translate(-20px, 30px) scale(0.95); }
      75% { transform: translate(20px, 20px) scale(1.02); }
    }

    /* Live pulse */
    .energy-live {
      position: relative;
    }
    .energy-live::before {
      content: '';
      display: inline-block;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #10b981;
      margin-right: 6px;
      vertical-align: middle;
      box-shadow: 0 0 8px rgba(16, 185, 129, 0.5);
      animation: energy-pulse 2.5s ease-in-out infinite;
    }
    @keyframes energy-pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(1.4); }
    }

    /* Number count animation */
    .energy-counting {
      display: inline-block;
      font-variant-numeric: tabular-nums;
    }

    /* Smooth chart bars */
    .energy-bar {
      transition: height 1s cubic-bezier(0.22, 1, 0.36, 1) !important;
    }
    .energy-bar-initial {
      height: 0 !important;
    }

    /* Page load overlay */
    .energy-loader {
      position: fixed;
      inset: 0;
      background: var(--bg, #f8f7f4);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: opacity 0.5s, visibility 0.5s;
    }
    .energy-loader.done {
      opacity: 0;
      visibility: hidden;
    }
    .energy-loader-bar {
      width: 48px;
      height: 3px;
      background: rgba(0,0,0,0.08);
      border-radius: 3px;
      overflow: hidden;
    }
    .energy-loader-bar::after {
      content: '';
      display: block;
      width: 50%;
      height: 100%;
      background: linear-gradient(90deg, #3b82f6, #8b5cf6);
      border-radius: 3px;
      animation: energy-load-slide 0.8s ease-in-out infinite alternate;
    }
    @keyframes energy-load-slide {
      from { transform: translateX(-100%); }
      to { transform: translateX(200%); }
    }

    /* Card hover lift */
    .energy-lift {
      transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1),
                  box-shadow 0.5s cubic-bezier(0.22, 1, 0.36, 1) !important;
    }
    .energy-lift:hover {
      transform: translateY(-3px) !important;
    }

    /* Gradient border on focus */
    .energy-focus-ring:focus-within {
      outline: none;
      box-shadow: 0 0 0 2px rgba(59,130,246,0.3) !important;
    }

    /* Skeleton shimmer for loading states */
    .energy-skeleton {
      background: linear-gradient(90deg, rgba(0,0,0,0.04) 25%, rgba(0,0,0,0.08) 50%, rgba(0,0,0,0.04) 75%);
      background-size: 200% 100%;
      animation: energy-shimmer 1.5s ease-in-out infinite;
      border-radius: 8px;
    }
    @keyframes energy-shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    /* Scroll progress bar enhancement */
    .scroll-progress {
      transition: width 0.1s linear;
    }

    /* Smooth scrollbar */
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.12); border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.2); }

    /* Reduced motion */
    @media (prefers-reduced-motion: reduce) {
      [data-energy], [data-stagger] > *, .energy-bar, .energy-ambient {
        animation: none !important;
        transition-duration: 0.01s !important;
      }
    }
  `;
  document.head.appendChild(css);

  // === PAGE LOAD ORCHESTRATION ===
  const loader = document.createElement('div');
  loader.className = 'energy-loader';
  loader.innerHTML = '<div class="energy-loader-bar"></div>';
  document.body.prepend(loader);

  // === AMBIENT ORBS ===
  const orb1 = document.createElement('div');
  orb1.className = 'energy-ambient energy-ambient-1';
  document.body.appendChild(orb1);
  const orb2 = document.createElement('div');
  orb2.className = 'energy-ambient energy-ambient-2';
  document.body.appendChild(orb2);

  // === AUTO-TAG ELEMENTS ===
  function autoTag() {
    // Tag KPI cards for scroll reveal + glow + lift
    document.querySelectorAll('.kpi-card, .kpi').forEach((el, i) => {
      if (!el.hasAttribute('data-energy')) {
        el.setAttribute('data-energy', '');
        el.style.transitionDelay = (i * 0.06) + 's';
      }
      el.classList.add('energy-glow', 'energy-lift');
    });

    // Tag panels for scroll reveal
    document.querySelectorAll('.panel, .chart-card, .data-table, .ai-card, .ai-strip, .feature-banner').forEach((el, i) => {
      if (!el.hasAttribute('data-energy')) {
        el.setAttribute('data-energy', '');
        el.style.transitionDelay = (0.1 + i * 0.08) + 's';
      }
    });

    // Tag grids for stagger
    document.querySelectorAll('.kpi-grid, .chart-row, .team-row, .ai-strip, .member-list').forEach(el => {
      if (!el.hasAttribute('data-stagger')) {
        el.setAttribute('data-stagger', '');
      }
    });

    // Tag chart bars
    document.querySelectorAll('.chart-bar, .bar, .kpi-spark .bar').forEach(el => {
      el.classList.add('energy-bar');
      const h = el.style.height;
      if (h) {
        el.dataset.targetHeight = h;
        el.classList.add('energy-bar-initial');
      }
    });

    // Tag panel titles with live indicator
    document.querySelectorAll('.panel-badge, .live-tag').forEach(el => {
      el.classList.add('energy-live');
    });
  }

  // === SCROLL REVEAL OBSERVER ===
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        // Animate chart bars within this element
        entry.target.querySelectorAll('.energy-bar-initial').forEach((bar, i) => {
          setTimeout(() => {
            bar.style.height = bar.dataset.targetHeight || '50%';
            bar.classList.remove('energy-bar-initial');
          }, i * 50);
        });
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  // === KPI NUMBER COUNTING ===
  function animateNumbers() {
    document.querySelectorAll('.kpi-value, .kpi-val, .metric-val, .cash-stat-val, .pl-val').forEach(el => {
      if (el.dataset.energyCounted) return;
      el.dataset.energyCounted = 'true';
      const text = el.textContent || '';
      const match = text.match(/([\$]?)([\d,]+\.?\d*)(.*)/);
      if (!match) return;
      const prefix = match[1];
      const target = parseFloat(match[2].replace(/,/g, ''));
      const suffix = match[3];
      if (isNaN(target) || target === 0) return;

      const duration = 1200;
      const start = performance.now();
      const hasDecimal = match[2].includes('.');
      const decimalPlaces = hasDecimal ? (match[2].split('.')[1] || '').length : 0;
      const hasCommas = match[2].includes(',');

      function formatNum(n) {
        let s = hasDecimal ? n.toFixed(decimalPlaces) : Math.round(n).toString();
        if (hasCommas) {
          const parts = s.split('.');
          parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
          s = parts.join('.');
        }
        return prefix + s + suffix;
      }

      el.classList.add('energy-counting');
      function tick(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 4); // ease-out quart
        el.textContent = formatNum(target * eased);
        if (progress < 1) requestAnimationFrame(tick);
      }
      // Only count when visible
      const numObserver = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          requestAnimationFrame(tick);
          numObserver.unobserve(el);
        }
      }, { threshold: 0.5 });
      numObserver.observe(el);
    });
  }

  // === CURSOR GLOW TRACKING ===
  function trackCursorGlow() {
    document.querySelectorAll('.energy-glow').forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--glow-x', x + 'px');
        card.style.setProperty('--glow-y', y + 'px');
        if (card.querySelector('::after') || true) {
          // Use CSS custom properties for glow position
          const after = card.style;
          after.setProperty('--glow-x', x + 'px');
          after.setProperty('--glow-y', y + 'px');
        }
      });
    });
    // Update the glow CSS to use custom properties
    const glowPatch = document.createElement('style');
    glowPatch.textContent = `.energy-glow::after { left: var(--glow-x, 50%); top: var(--glow-y, 50%); }`;
    document.head.appendChild(glowPatch);
  }

  // === SCROLL PROGRESS BAR ===
  function updateScrollProgress() {
    const bar = document.querySelector('.scroll-progress');
    if (!bar) return;
    window.addEventListener('scroll', () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      bar.style.width = progress + '%';
    }, { passive: true });
  }

  // === INIT ===
  function init() {
    autoTag();
    // Observe all tagged elements
    document.querySelectorAll('[data-energy], [data-stagger]').forEach(el => {
      revealObserver.observe(el);
    });
    animateNumbers();
    trackCursorGlow();
    updateScrollProgress();
    // Remove loader
    requestAnimationFrame(() => {
      setTimeout(() => {
        loader.classList.add('done');
        setTimeout(() => loader.remove(), 600);
      }, 300);
    });
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Re-run after dynamic content loads (for dashboard-brain.js updates)
  const mo = new MutationObserver(() => {
    autoTag();
    document.querySelectorAll('[data-energy]:not(.revealed), [data-stagger]:not(.revealed)').forEach(el => {
      revealObserver.observe(el);
    });
    animateNumbers();
  });
  mo.observe(document.body, { childList: true, subtree: true });

})();
