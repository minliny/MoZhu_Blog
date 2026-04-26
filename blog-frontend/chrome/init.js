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
      homeHeader = false,
      backLink = false,
      footer = false,
      about = false,
      themeOptions = undefined,
    } = options;

    if (shouldMountChrome) {
      mountChrome();
    }
    if (homeHeader) {
      registry.header?.mountHomeHeader();
    }
    if (backLink) {
      registry.nav?.mountBackLink();
    }
    if (footer) {
      registry.footer?.mountFooter();
    }
    if (about) {
      registry.about?.renderAboutContent();
    }

    if (global.BlogTheme) {
      global.BlogTheme.initTheme(themeOptions);
    }
  }

  global.BlogChrome = {
    mount: mountChrome,
    mountFooter: (...args) => registry.footer?.mountFooter(...args),
    mountHomeHeader: (...args) => registry.header?.mountHomeHeader(...args),
    renderAboutContent: (...args) => registry.about?.renderAboutContent(...args),
    mountBackLink: (...args) => registry.nav?.mountBackLink(...args),
    initPage,
  };
})(window);
