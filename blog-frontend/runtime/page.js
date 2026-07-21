/* Progressive enhancement for pre-rendered pages. */
(function initPageRuntime(global) {
  global.BlogChrome?.initPage();

  async function copyText(text) {
    if (navigator.clipboard && global.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.readOnly = true;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
  }

  document.querySelectorAll('.copy-btn').forEach((button) => {
    button.addEventListener('click', async () => {
      const code = button.parentElement?.querySelector('code');
      if (!code) return;
      const original = button.textContent;
      try {
        await copyText(code.textContent || '');
        button.textContent = 'Copied';
        button.classList.add('is-copied');
      } catch (error) {
        button.textContent = 'Failed';
        button.classList.add('is-failed');
        console.error('[copy] failed', error);
      }
      global.setTimeout(() => {
        button.textContent = original;
        button.classList.remove('is-copied', 'is-failed');
      }, 1400);
    });
  });
})(window);
