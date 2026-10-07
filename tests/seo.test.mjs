import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { onRequest } from '../functions/_middleware.ts';

const host = 'coleridgemeatstellenbosch.co.za';
const title = 'Coleridge Meat | Halaal Butchery in Stellenbosch';

test('built homepage contains the real business content without running JavaScript', async () => {
  const html = await readFile('dist/index.html', 'utf8');
  assert.ok(html.includes(`<title>${title}</title>`));
  assert.ok(html.includes(`<link rel="canonical" href="https://${host}/"`));
  assert.ok(!html.includes('<div id="root"></div>'));
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  assert.match(html, /<h1[^>]*>COLERIDGE MEAT<\/h1>/);
  assert.ok(html.includes('The finest cuts for'));
  for (const section of ['about', 'selection', 'spitbraai', 'shop', 'faq', 'contact']) {
    assert.ok(html.includes(`id="${section}"`), section);
  }
  assert.ok(html.includes('18 Tennant Rd, Cloetesville, Stellenbosch, 7599'));
  assert.ok(html.includes('061 127 5756'));
  assert.ok(html.includes('info@coleridgemeat.co.za'));
  assert.ok(!html.includes('opacity:0'), 'prerendered content must not be hidden by entrance animations');
  assert.ok(!html.includes('View details'), 'editable spit package prices must not be baked into HTML');
  assert.ok(!html.includes('Add to cart'), 'editable products must not be baked into HTML');
  const schemas = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .map((match) => JSON.parse(match[1]));
  assert.equal(schemas.length, 5);
  assert.deepEqual(schemas[0]['@type'], ['Store', 'LocalBusiness']);
  assert.equal(schemas[0].url, `https://${host}/`);
  assert.equal(schemas[0].telephone, '+27611275756');
  assert.equal(schemas[0].geo, undefined, 'unverified coordinates must not be asserted');
});

test('all owner tool entry points stay unindexed and do not show the public prerender', async () => {
  for (const route of ['owner', 'owner/specials', 'owner/price-list', 'admin', 'admin/specials', 'admin/price-list']) {
    const html = await readFile(`dist/${route}/index.html`, 'utf8');
    assert.ok(html.includes('content="noindex, nofollow"'), route);
    assert.ok(html.includes('<div id="root"></div>'), route);
    assert.ok(!html.includes('id="contact"'), route);
    assert.match(html, /\/assets\/index-[\w-]+\.js/);
  }
});

test('static images and bundles stay outside Functions to preserve free static delivery', async () => {
  const routes = JSON.parse(await readFile('public/_routes.json', 'utf8'));
  assert.equal(routes.version, 1);
  assert.deepEqual(routes.include, ['/*']);
  assert.ok(routes.exclude.includes('/assets/*'));
  assert.ok(routes.exclude.includes('/images/*'));
  for (const route of ['/', '/api/products', '/owner-api/products']) {
    assert.ok(!routes.exclude.includes(route));
  }
});

test('alternate hosts permanently redirect while preserving paths and campaign parameters', async () => {
  for (const alias of [`www.${host}`, 'coleridge.pages.dev']) {
    for (const path of ['/', '/?view=specials', '/owner/specials/', '/api/products?v=123']) {
      let called = false;
      const response = await onRequest({
        request: new Request(`https://${alias}${path}`),
        next: async () => { called = true; return new Response('should not render'); },
      });
      assert.equal(response.status, 301);
      assert.equal(response.headers.get('location'), `https://${host}${path}`);
      assert.equal(called, false);
    }
  }
  const response = await onRequest({ request: new Request(`https://www.${host}/owner-api/login`, { method: 'POST' }) });
  assert.equal(response.status, 308);
});

test('canonical, preview and local requests keep their original handlers', async () => {
  for (const origin of [`https://${host}`, 'https://123.coleridge.pages.dev', 'http://127.0.0.1:8788']) {
    const expected = new Response('public catalogue', { headers: { 'Content-Type': 'application/json' } });
    const response = await onRequest({ request: new Request(`${origin}/api/products`), next: async () => expected });
    assert.equal(response, expected);
  }
});

test('owner responses remain private and preserve authentication and cookies', async () => {
  const response = await onRequest({
    request: new Request(`https://${host}/owner-api/session`),
    next: async () => new Response('Unauthorized', { status: 401, headers: { 'Set-Cookie': 'session=; HttpOnly; Secure' } }),
  });
  assert.equal(response.status, 401);
  assert.equal(response.headers.get('x-robots-tag'), 'noindex, nofollow');
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(response.headers.get('x-frame-options'), 'DENY');
  assert.equal(response.headers.get('set-cookie'), 'session=; HttpOnly; Secure');
  assert.equal(await response.text(), 'Unauthorized');
});
