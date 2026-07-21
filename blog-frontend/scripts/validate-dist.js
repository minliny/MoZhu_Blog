const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');

function parseOutput(argv) {
  if (argv.length === 0) return process.env.DIST_DIR || 'dist';
  if (argv.length === 2 && argv[0] === '--output') return argv[1];
  throw new Error('Usage: node scripts/validate-dist.js [--output <directory>]');
}

function walkFiles(directory, root = directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) return walkFiles(absolute, root);
    return [path.relative(root, absolute).split(path.sep).join('/')];
  });
}

function assert(condition, message, errors) {
  if (!condition) errors.push(message);
}

function localReferenceTarget(outputDir, htmlPath, reference) {
  const clean = reference.split('#')[0].split('?')[0];
  if (!clean || clean.startsWith('#')) return null;
  if (/^(?:https?:|mailto:|tel:|data:)/i.test(clean) || clean.startsWith('//')) return null;
  const decoded = decodeURIComponent(clean);
  const candidate = decoded.startsWith('/')
    ? path.resolve(outputDir, `.${decoded}`)
    : path.resolve(path.dirname(path.join(outputDir, htmlPath)), decoded);
  const normalizedOutput = `${path.resolve(outputDir)}${path.sep}`;
  if (candidate !== path.resolve(outputDir) && !candidate.startsWith(normalizedOutput)) {
    return { candidate, escapes: true };
  }
  return { candidate, escapes: false };
}

function existsAsPage(target) {
  if (fs.existsSync(target) && fs.statSync(target).isFile()) return true;
  if (fs.existsSync(target) && fs.statSync(target).isDirectory()) {
    return fs.existsSync(path.join(target, 'index.html'));
  }
  if (target.endsWith(path.sep)) return fs.existsSync(path.join(target, 'index.html'));
  return false;
}

function main() {
  const outputArg = parseOutput(process.argv.slice(2));
  const outputDir = path.isAbsolute(outputArg) ? outputArg : path.resolve(ROOT_DIR, outputArg);
  const errors = [];
  if (!fs.existsSync(outputDir) || !fs.statSync(outputDir).isDirectory()) {
    throw new Error(`Output directory does not exist: ${outputDir}`);
  }

  const files = walkFiles(outputDir).sort();
  const fileSet = new Set(files);
  const required = [
    'index.html', 'about.html', 'post.html', '404.html', 'feed.xml', 'sitemap.xml',
    'posts.json', 'redirects.json', 'content-manifest.json', 'style.css', 'theme.js',
    'chrome/background.js', 'chrome/nav.js', 'chrome/init.js', 'runtime/page.js', 'runtime/legacy.js',
  ];
  required.forEach((name) => assert(fileSet.has(name), `Missing required output: ${name}`, errors));

  const forbiddenPatterns = [
    /(^|\/)node_modules\//,
    /(^|\/)\.env(?:\.|$)/,
    /(^|\/)package(?:-lock)?\.json$/,
    /(^|\/)scripts\//,
    /\.md$/,
  ];
  files.forEach((name) => {
    forbiddenPatterns.forEach((pattern) => {
      assert(!pattern.test(name), `Source/private file leaked into output: ${name}`, errors);
    });
  });

  const htmlFiles = files.filter((name) => name.endsWith('.html'));
  htmlFiles.forEach((name) => {
    const html = fs.readFileSync(path.join(outputDir, name), 'utf8');
    assert(/<main(?:\s|>)/i.test(html), `Missing <main> landmark: ${name}`, errors);
    assert(/meta name="description"/i.test(html), `Missing meta description: ${name}`, errors);
    assert(/Content-Security-Policy/i.test(html), `Missing CSP: ${name}`, errors);
    assert(!/<script(?![^>]*\ssrc=)[^>]*>/i.test(html), `Inline script found: ${name}`, errors);
    assert(!/<[^>]+\son[a-z]+\s*=/i.test(html), `Inline event handler found: ${name}`, errors);
    assert(!/(?:href|src)\s*=\s*["']\s*javascript:/i.test(html), `javascript: URL found: ${name}`, errors);

    const references = [...html.matchAll(/\b(?:href|src)\s*=\s*["']([^"']+)["']/gi)].map((match) => match[1]);
    references.forEach((reference) => {
      const target = localReferenceTarget(outputDir, name, reference);
      if (!target) return;
      assert(!target.escapes, `Reference escapes output in ${name}: ${reference}`, errors);
      if (!target.escapes) {
        assert(existsAsPage(target.candidate), `Broken local reference in ${name}: ${reference}`, errors);
      }
    });
  });

  if (fileSet.has('posts.json') && fileSet.has('content-manifest.json') && fileSet.has('redirects.json')) {
    const posts = JSON.parse(fs.readFileSync(path.join(outputDir, 'posts.json'), 'utf8'));
    const manifest = JSON.parse(fs.readFileSync(path.join(outputDir, 'content-manifest.json'), 'utf8'));
    const redirects = JSON.parse(fs.readFileSync(path.join(outputDir, 'redirects.json'), 'utf8'));
    assert(Array.isArray(posts), 'posts.json must contain an array', errors);
    assert(manifest.schemaVersion === 1, 'content-manifest.json schemaVersion must be 1', errors);
    assert(manifest.articleCount === posts.length, 'Manifest articleCount does not match posts.json', errors);
    assert(['fixtures', 'notion'].includes(manifest.source), `Unknown manifest source: ${manifest.source}`, errors);

    const slugs = new Set();
    posts.forEach((post) => {
      assert(typeof post.slug === 'string' && post.slug.length > 0, 'Post is missing slug', errors);
      assert(!slugs.has(post.slug), `Duplicate post slug: ${post.slug}`, errors);
      slugs.add(post.slug);
      assert(fileSet.has(`posts/${post.slug}/index.html`), `Missing rendered article: ${post.slug}`, errors);
      assert(redirects.routes?.[post.slug] === `posts/${post.slug}/`, `Missing canonical redirect route: ${post.slug}`, errors);
      (post.aliases || []).forEach((alias) => {
        assert(fileSet.has(`posts/${alias}/index.html`), `Missing alias redirect page: ${alias}`, errors);
        assert(redirects.routes?.[alias] === `posts/${post.slug}/`, `Alias route mismatch: ${alias}`, errors);
      });
    });
  }

  const mediaFiles = files.filter((name) => name.startsWith('media/'));
  mediaFiles.forEach((name) => {
    assert(/^media\/[a-f0-9]{64}\.[a-z0-9]+$/i.test(name), `Media is not content-addressed: ${name}`, errors);
  });

  if (errors.length > 0) {
    console.error(`Output validation failed with ${errors.length} error(s):`);
    errors.forEach((error) => console.error(`- ${error}`));
    process.exitCode = 1;
    return;
  }

  console.log(`Output validation passed: ${outputDir}`);
  console.log(`Validated ${files.length} files, ${htmlFiles.length} HTML pages, ${mediaFiles.length} media files.`);
}

try {
  main();
} catch (error) {
  console.error(`[validate] ${error.message}`);
  process.exitCode = 1;
}
