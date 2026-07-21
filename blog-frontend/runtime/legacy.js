/* Compatibility redirect for the historical post.html?slug=... route. */
(async function redirectLegacyPost() {
  const title = document.getElementById('legacy-title');
  const message = document.getElementById('legacy-message');
  const slug = new URLSearchParams(window.location.search).get('slug');

  function showMissing() {
    document.title = '文章不存在 · Minliny';
    if (title) title.textContent = '文章不存在';
    if (message) {
      message.textContent = '';
      const paragraph = document.createElement('p');
      paragraph.textContent = '这篇文章不存在，或者链接已经失效。';
      const home = document.createElement('a');
      home.href = 'index.html';
      home.textContent = '返回首页';
      message.append(paragraph, home);
    }
  }

  if (!slug) {
    showMissing();
    return;
  }

  try {
    const response = await fetch('redirects.json', { credentials: 'same-origin' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const redirects = await response.json();
    const route = redirects?.routes?.[slug];
    if (!route) {
      showMissing();
      return;
    }
    window.location.replace(new URL(route, document.baseURI).href);
  } catch (error) {
    console.error('[legacy] redirect lookup failed', error);
    showMissing();
  }
})();
