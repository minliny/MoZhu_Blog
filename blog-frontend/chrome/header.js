/* ==========================================
   Chrome Header
========================================== */

(function initChromeHeader(global) {
  const registry = global.BlogChromeRegistry || (global.BlogChromeRegistry = {});

  const homeHeaderMarkup = `
  <header class="site-header">
    <a class="logo" href="about.html" aria-label="回到首页">
      <span class="logo-letter">Minliny</span>
      <span class="logo-hint">notion-powered static blog</span>
    </a>
    <p class="bio">Publish from Notion to a static site.</p>
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
