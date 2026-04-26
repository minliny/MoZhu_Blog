/* ==========================================
   Chrome Navigation
========================================== */

(function initChromeNav(global) {
  const registry = global.BlogChromeRegistry || (global.BlogChromeRegistry = {});
  let themeToggleUnsubscribe = null;

  const modeMarkup = `
  <nav class="mode-indicator" aria-label="主题切换">
    <span class="subtle-link mode-label" aria-hidden="true">MODE</span>

    <button class="mode-btn" data-mode="day" data-label="日间·墨竹" title="日间·墨竹" aria-label="日间墨竹">
      <svg class="bamboo-icon" viewBox="0 0 20 28" width="16" height="22" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path class="bamboo-culm" d="M 10,27 C 9.7,21 10,16 10.3,10 C 10.6,6 11,3 11.2,1"/>
        <line class="bamboo-ring" x1="7" y1="20" x2="13" y2="20"/>
        <line class="bamboo-ring" x1="7" y1="21.3" x2="13" y2="21.3"/>
        <line class="bamboo-ring" x1="7.5" y1="11" x2="13.5" y2="11"/>
        <line class="bamboo-ring" x1="7.5" y1="12.3" x2="13.5" y2="12.3"/>
        <line class="bamboo-branch" x1="10.3" y1="20.6" x2="13.5" y2="20.6"/>
        <line class="bamboo-branch" x1="10.1" y1="11.6" x2="6.5" y2="11.6"/>
        <path class="bamboo-leaf" transform="translate(13.5,20.6) rotate(10)" d="M 0,0 C 1,-2 1,-5 0,-7 C -1,-5 -1,-2 0,0 Z"/>
        <path class="bamboo-leaf" transform="translate(13.5,20.6) rotate(48)" d="M 0,0 C 1,-2 1,-5 0,-7 C -1,-5 -1,-2 0,0 Z"/>
        <path class="bamboo-leaf" transform="translate(6.5,11.6) rotate(-55)" d="M 0,0 C 1,-2 1,-5 0,-7 C -1,-5 -1,-2 0,0 Z"/>
        <path class="bamboo-leaf" transform="translate(6.5,11.6) rotate(-15)" d="M 0,0 C 1,-2 1,-5 0,-7 C -1,-5 -1,-2 0,0 Z"/>
      </svg>
    </button>

    <button class="mode-btn" data-mode="night" data-label="夜间·墨竹" title="夜间·墨竹" aria-label="夜间墨竹">
      <svg class="bamboo-icon" viewBox="0 0 20 28" width="16" height="22" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path class="bamboo-culm" d="M 10,27 C 9.7,21 10,16 10.3,10 C 10.6,6 11,3 11.2,1"/>
        <line class="bamboo-ring" x1="7" y1="20" x2="13" y2="20"/>
        <line class="bamboo-ring" x1="7" y1="21.3" x2="13" y2="21.3"/>
        <line class="bamboo-ring" x1="7.5" y1="11" x2="13.5" y2="11"/>
        <line class="bamboo-ring" x1="7.5" y1="12.3" x2="13.5" y2="12.3"/>
        <line class="bamboo-branch" x1="10.3" y1="20.6" x2="13.5" y2="20.6"/>
        <line class="bamboo-branch" x1="10.1" y1="11.6" x2="6.5" y2="11.6"/>
        <path class="bamboo-leaf" transform="translate(13.5,20.6) rotate(10)" d="M 0,0 C 1.5,-2 1.5,-5 0,-7 C -1.5,-5 -1.5,-2 0,0 Z"/>
        <path class="bamboo-leaf" transform="translate(13.5,20.6) rotate(48)" d="M 0,0 C 1.5,-2 1.5,-5 0,-7 C -1.5,-5 -1.5,-2 0,0 Z"/>
        <path class="bamboo-leaf" transform="translate(6.5,11.6) rotate(-55)" d="M 0,0 C 1.5,-2 1.5,-5 0,-7 C -1.5,-5 -1.5,-2 0,0 Z"/>
        <path class="bamboo-leaf" transform="translate(6.5,11.6) rotate(-15)" d="M 0,0 C 1.5,-2 1.5,-5 0,-7 C -1.5,-5 -1.5,-2 0,0 Z"/>
      </svg>
    </button>

    <button class="mode-btn" data-mode="day-pure" data-label="日间·普通" title="日间·普通" aria-label="日间普通">
      <svg class="theme-icon theme-icon-sun" viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <circle class="theme-icon-stroke" cx="12" cy="12" r="4.25"/>
        <path class="theme-icon-stroke" d="M12 2.75v3.1M12 18.15v3.1M21.25 12h-3.1M5.85 12h-3.1M18.54 5.46l-2.2 2.2M7.66 16.34l-2.2 2.2M18.54 18.54l-2.2-2.2M7.66 7.66l-2.2-2.2"/>
      </svg>
    </button>

    <button class="mode-btn" data-mode="night-pure" data-label="夜间·普通" title="夜间·普通" aria-label="夜间普通">
      <svg class="theme-icon theme-icon-moon" viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path class="theme-icon-stroke" d="M15.4 3.4a8.5 8.5 0 1 0 5.2 15.2A9.2 9.2 0 1 1 15.4 3.4z"/>
      </svg>
    </button>
  </nav>`;

  const backLinkMarkup = `
  <a class="post-back" href="index.html">← 返回</a>`;

  function mountThemeToggle() {
    if (document.querySelector('.mode-indicator')) {
      return;
    }

    document.body.insertAdjacentHTML('afterbegin', modeMarkup);
  }

  function syncThemeControls(theme) {
    document.querySelectorAll('.mode-btn').forEach((button) => {
      button.classList.toggle('is-active', button.dataset.mode === theme);
    });
  }

  function initThemeToggle() {
    if (themeToggleUnsubscribe) {
      themeToggleUnsubscribe();
      themeToggleUnsubscribe = null;
    }

    document.querySelectorAll('.mode-btn').forEach((button) => {
      if (!button.dataset.themeBound) {
        button.dataset.themeBound = 'true';
        button.addEventListener('click', () => {
          global.BlogTheme?.setTheme(button.dataset.mode);
          button.classList.remove('leaf-spring');
          void button.offsetWidth;
          button.classList.add('leaf-spring');
        });
        button.addEventListener('animationend', (event) => {
          if (event.animationName === 'leafSpring') {
            button.classList.remove('leaf-spring');
          }
        });
      }
    });

    if (global.BlogTheme?.onThemeChange) {
      themeToggleUnsubscribe = global.BlogTheme.onThemeChange((theme) => {
        syncThemeControls(theme);
      });
      syncThemeControls(global.BlogTheme.getTheme());
    }
  }

  function mountBackLink(selector = '.page') {
    if (document.querySelector('.post-back')) {
      return;
    }

    const container = document.querySelector(selector);
    if (!container) {
      return;
    }

    container.insertAdjacentHTML('afterbegin', backLinkMarkup);
  }

  registry.nav = {
    mountThemeToggle,
    initThemeToggle,
    mountBackLink,
  };
})(window);
