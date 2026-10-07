const PUBLIC_HOST = 'coleridgemeatstellenbosch.co.za';
const ALTERNATE_HOSTS = new Set([`www.${PUBLIC_HOST}`, 'coleridge.pages.dev']);

export const onRequest: PagesFunction = async ({ request, next }) => {
  const url = new URL(request.url);
  if (ALTERNATE_HOSTS.has(url.hostname)) {
    url.protocol = 'https:';
    url.hostname = PUBLIC_HOST;
    url.port = '';
    // Preserve paths, specials query strings and non-GET request methods.
    return Response.redirect(url.toString(), ['GET', 'HEAD'].includes(request.method) ? 301 : 308);
  }

  const response = await next();
  if (!url.pathname.startsWith('/owner') && !url.pathname.startsWith('/admin')) return response;

  const headers = new Headers(response.headers);
  headers.set('X-Robots-Tag', 'noindex, nofollow');
  headers.set('Cache-Control', 'no-store');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('Referrer-Policy', 'no-referrer');
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
};
