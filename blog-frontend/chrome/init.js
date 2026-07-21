/* ==========================================
   Chrome Init
========================================== */

(function initChrome(global) {
  const registry = global.BlogChromeRegistry || (global.BlogChromeRegistry = {});

  function mountChrome() {
    registry.background?.mountBackground();
    registry.nav?.mountThemeToggle();
  }

  function initPage(options = {}) {
    const {
      mountChrome: shouldMountChrome = true,
      themeOptions = undefined,
    } = options;

    if (shouldMountChrome) {
      mountChrome();
    }
    if (global.BlogTheme) {
      registry.nav?.initThemeToggle();
    }
    if (global.BlogTheme) {
      global.BlogTheme.initTheme(themeOptions);
    }
  }

  global.BlogChrome = {
    mount: mountChrome,
    initPage,
  };
})(window);
