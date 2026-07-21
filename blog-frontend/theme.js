/* ==========================================
   Theme Management
========================================== */

(function initBlogTheme(global) {
  const THEMES = ['day', 'night', 'day-pure', 'night-pure'];
  const THEME_KEY = 'mozhu-theme';
  const LEGACY_THEME_KEYS = ['xiaogai-theme'];
  const listeners = new Set();
  let currentTheme = null;
  let themeHookUnsubscribe = null;

  function normalizeTheme(mode) {
    return THEMES.includes(mode) ? mode : 'day';
  }

  function syncThemeControls(theme) {
    document.querySelectorAll('.mode-btn').forEach((button) => {
      const active = button.dataset.mode === theme;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  }

  function readStoredTheme() {
    try {
      const current = localStorage.getItem(THEME_KEY);
      if (THEMES.includes(current)) return current;
      for (const key of LEGACY_THEME_KEYS) {
        const legacy = localStorage.getItem(key);
        if (THEMES.includes(legacy)) {
          localStorage.setItem(THEME_KEY, legacy);
          return legacy;
        }
      }
    } catch (error) {
      console.warn('[theme] storage unavailable', error);
    }
    return 'day';
  }

  function emitThemeChange(theme, previousTheme) {
    listeners.forEach((listener) => {
      try {
        listener(theme, previousTheme);
      } catch (error) {
        console.error('[theme] listener failed', error);
      }
    });
  }

  function applyTheme(mode) {
    const theme = normalizeTheme(mode);
    document.body.classList.remove(...THEMES);
    document.body.classList.add(theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (error) {
      console.warn('[theme] could not persist preference', error);
    }
    syncThemeControls(theme);
    return theme;
  }

  function setTheme(nextTheme) {
    const theme = applyTheme(nextTheme);
    const previousTheme = currentTheme;

    if (theme === previousTheme) {
      return theme;
    }

    currentTheme = theme;
    emitThemeChange(theme, previousTheme);
    return theme;
  }

  function getTheme() {
    return normalizeTheme(currentTheme || readStoredTheme());
  }

  function onThemeChange(listener) {
    listeners.add(listener);
    return () => offThemeChange(listener);
  }

  function offThemeChange(listener) {
    listeners.delete(listener);
  }

  function initTheme(options = {}) {
    if (themeHookUnsubscribe) {
      themeHookUnsubscribe();
      themeHookUnsubscribe = null;
    }

    if (typeof options.onApply === 'function') {
      themeHookUnsubscribe = onThemeChange((theme) => {
        options.onApply(theme);
      });
    }

    setTheme(getTheme());
  }

  global.BlogTheme = {
    initTheme,
    setTheme,
    getTheme,
    normalizeTheme,
    onThemeChange,
    offThemeChange,
    applyTheme,
    THEME_KEY,
    LEGACY_THEME_KEYS,
    THEMES,
  };
})(window);
