import { SHARE_TARGETS } from './config.js';

export function activeShareTargets() {
  return SHARE_TARGETS.filter((target) => {
    if (!target.enabled || target.id === 'kakao') return false;
    if (target.id === 'native') return typeof navigator.share === 'function';
    return true;
  });
}

export function sharePageUrl() {
  const url = new URL(location.href);
  url.hash = '';
  url.search = '';
  return url.toString();
}

export async function runShare(id, payload) {
  if (id === 'native' && typeof navigator.share === 'function') {
    await navigator.share({ title: payload.title, text: payload.text, url: payload.url });
    return 'shared';
  }
  if (id === 'x') {
    const intent = new URL('https://twitter.com/intent/tweet');
    intent.searchParams.set('text', payload.text);
    intent.searchParams.set('url', payload.url);
    window.open(intent.toString(), '_blank', 'noopener,noreferrer');
    return 'opened';
  }
  if (id === 'copy') {
    const line = `${payload.text}\n${payload.url}`;
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(line);
    } else {
      const area = document.createElement('textarea');
      area.value = line;
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      area.remove();
    }
    return 'copied';
  }
  return 'unavailable';
}
