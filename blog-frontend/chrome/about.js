/* ==========================================
   Chrome About
========================================== */

(function initChromeAbout(global) {
  const registry = global.BlogChromeRegistry || (global.BlogChromeRegistry = {});

  const aboutContent = {
    title: '关于',
    paragraphs: [
      '这里是小盖的个人博客，用来记录那些想继续做下去的事情。',
      '如果你想联系我，可以通过邮箱找到我：',
    ],
    email: 'gainubi@gmail.com',
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
