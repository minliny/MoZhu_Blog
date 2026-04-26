/* ==========================================
   Chrome Header
========================================== */

(function initChromeHeader(global) {
  const registry = global.BlogChromeRegistry || (global.BlogChromeRegistry = {});

  const homeHeaderMarkup = `
  <header class="site-header">
    <a class="logo" href="index.html" aria-label="回到首页">
      <span class="logo-letter">小盖</span>
      <span class="logo-hint">xiaogai · doing interesting things</span>
    </a>
    <p class="bio">做有意思的事情</p>
  </header>

  <hr class="divider">`;

  function mountHomeHeader(selector = '.page') {
    if (document.querySelector('.site-header')) {
      return;
    }

    const container = document.querySelector(selector);
    if (!container) {
      return;
    }

    container.insertAdjacentHTML('afterbegin', homeHeaderMarkup);
  }

  registry.header = {
    mountHomeHeader,
  };
})(window);
