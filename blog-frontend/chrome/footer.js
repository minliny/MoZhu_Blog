/* ==========================================
   Chrome Footer
========================================== */

(function initChromeFooter(global) {
  const registry = global.BlogChromeRegistry || (global.BlogChromeRegistry = {});

  const footerMarkup = `
  <footer class="footer">
    <div class="footer-label">Connect</div>
    <div class="links-connect">
      <a href="feed.xml">RSS</a>
      <a href="mailto:gainubi@gmail.com">邮箱</a>
      <a href="about.html">关于</a>
    </div>
  </footer>`;

  function mountFooter(selector = '.page') {
    if (document.querySelector('.footer')) {
      return;
    }

    const container = document.querySelector(selector);
    if (!container) {
      return;
    }

    container.insertAdjacentHTML('beforeend', footerMarkup);
  }

  registry.footer = {
    mountFooter,
  };
})(window);
