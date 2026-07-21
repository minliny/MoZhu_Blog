const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');

const ROOT_DIR = path.resolve(__dirname, '..');
const BUILD_SCRIPT = path.join(ROOT_DIR, 'scripts', 'build-site.js');

test('build sanitizes article HTML and keeps the publishing boundary clean', (t) => {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'mozhu-build-test-'));
  t.after(() => fs.rmSync(temporaryRoot, { recursive: true, force: true }));
  const contentDir = path.join(temporaryRoot, 'content');
  const outputDir = path.join(temporaryRoot, 'dist');
  fs.cpSync(path.join(ROOT_DIR, 'content', 'fixtures'), contentDir, { recursive: true });
  fs.writeFileSync(path.join(contentDir, 'posts', 'unsafe-html.md'), `---
notionId: fixture-unsafe-html
title: Unsafe HTML test
date: 2026-04-27
updatedAt: 2026-04-27T00:00:00.000Z
excerpt: Security regression fixture
group: tech
tags: []
cover: ""
aliases: []
---

<script>alert('xss')</script>

[unsafe](javascript:alert(1))

![unsafe](data:image/svg+xml,<svg onload=alert(1)>)
`, 'utf8');

  const build = spawnSync(process.execPath, [BUILD_SCRIPT, '--content', contentDir, '--output', outputDir], {
    cwd: ROOT_DIR,
    encoding: 'utf8',
  });
  assert.equal(build.status, 0, build.stderr || build.stdout);
  const article = fs.readFileSync(path.join(outputDir, 'posts', 'unsafe-html', 'index.html'), 'utf8');
  const content = article.match(/<div class="post-content">([\s\S]*?)<\/div>/)?.[1] || '';
  assert.doesNotMatch(content, /<script/i);
  assert.doesNotMatch(content, /javascript:/i);
  assert.doesNotMatch(content, /onload=/i);
  assert.doesNotMatch(article, /node_modules|package-lock\.json|\.env/);
});
