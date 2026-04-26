/* ==========================================
   Theme Management
========================================== */

(function initBlogTheme(global) {
  const THEMES = ['day', 'night', 'day-pure', 'night-pure'];
  const THEME_KEY = 'xiaogai-theme';
  const listeners = new Set();
  let currentTheme = null;
  let themeHookUnsubscribe = null;

  function normalizeTheme(mode) {
    return THEMES.includes(mode) ? mode : 'day';
  }

  function syncThemeControls(theme) {
    document.querySelectorAll('.mode-btn').forEach((button) => {
      button.classList.toggle('is-active', button.dataset.mode === theme);
    });
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
    localStorage.setItem(THEME_KEY, theme);
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
    return normalizeTheme(currentTheme || localStorage.getItem(THEME_KEY) || 'day');
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
    THEMES,
  };
})(window);
