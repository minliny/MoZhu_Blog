/* ==========================================
   Chrome About
========================================== */

(function initChromeAbout(global) {
  const registry = global.BlogChromeRegistry || (global.BlogChromeRegistry = {});

  const aboutContent = {
    title: '关于',
    paragraphs: [
      '这是一个基于 Notion 作为内容源的静态博客模板。',
      '你可以把这里替换成自己的站点介绍、作者信息或联系方式。',
    ],
    email: 'your-email@example.com',
  };

  function renderAboutContent(selector = '.about-content') {
    const container = document.querySelector(selector);
    if (!container) {
      return;
    }

    const paragraphs = aboutContent.paragraphs
      .map((text) => `<p>${text}</p>`)
      .join('\n');

    container.innerHTML = `
      <h1 class="post-title">${aboutContent.title}</h1>
      <div class="post-content">
        ${paragraphs}
        <p><a href="mailto:${aboutContent.email}">${aboutContent.email}</a></p>
      </div>
    `;
  }

  registry.about = {
    renderAboutContent,
  };
})(window);
