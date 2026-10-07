import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createServer } from 'vite';

const outDir = resolve('dist');
const template = await readFile(resolve(outDir, 'index.html'), 'utf8');
const root = '<div id="root"></div>';
if (!template.includes(root)) throw new Error('The prerender root is missing.');

// Reuse the real components, but never snapshot owner-editable prices or specials.
const server = await createServer({
  appType: 'custom',
  server: { middlewareMode: true },
  optimizeDeps: { noDiscovery: true, include: [] },
});
try {
  const { renderPublicPage } = await server.ssrLoadModule('/src/prerender.tsx');
  const content = renderPublicPage();
  if (!content.includes('COLERIDGE MEAT') || !content.includes('18 Tennant Rd')) {
    throw new Error('The business page did not prerender correctly.');
  }
  await writeFile(resolve(outDir, 'index.html'), template.replace(root, `<div id="root">${content}</div>`));
  console.log('Prerendered the existing public business page. Live pricing remains dynamic.');
} finally {
  await server.close();
}

// Owner routes keep their empty app shell and are never public SEO landing pages.
const adminHtml = template
  .replaceAll('index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1', 'noindex, nofollow')
  .replace('<title>Coleridge Meat | Halaal Butchery in Stellenbosch</title>', '<title>Coleridge Meat | Owner Access</title>');
for (const route of ['owner', 'owner/specials', 'owner/price-list', 'admin', 'admin/specials', 'admin/price-list']) {
  const directory = resolve(outDir, route);
  await mkdir(directory, { recursive: true });
  await writeFile(resolve(directory, 'index.html'), adminHtml);
}
