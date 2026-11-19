import { SHARE_PROVIDERS } from './config.js';
import { buildShareText, buildShareUrl } from './rank-core.js';
import { fmtNum } from './utils.js';

function sharePayload(record) {
  const href = typeof location !== 'undefined' ? location.href : 'https://battle.mbbs.kr/';
  const url = buildShareUrl(href, record);
  const text = buildShareText({
    mode: record.mode,
    wins: record.wins,
    loses: record.loses,
    draws: record.draws,
    name: record.name,
    power: record.power,
    fmt: fmtNum
  });
  return { url, text, title: 'VR Battle Masters' };
}

async function copyText(value) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const area = document.createElement('textarea');
  area.value = value;
  area.setAttribute('readonly', '');
  area.style.position = 'fixed';
  area.style.left = '-999px';
  document.body.appendChild(area);
  area.select();
  document.execCommand('copy');
  area.remove();
}

async function runShare(id, record) {
  const payload = sharePayload(record);
  if (id === 'x') {
    const intent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(payload.text)}&url=${encodeURIComponent(payload.url)}`;
    window.open(intent, '_blank', 'noopener,noreferrer');
    return;
  }
  if (id === 'copy') {
    await copyText(`${payload.text}\n${payload.url}`);
    return;
  }
  if (id === 'native' && typeof navigator.share === 'function') {
    await navigator.share({ title: payload.title, text: payload.text, url: payload.url });
    return;
  }
  if (id === 'kakao') {
    // 전용 버튼은 enabled가 켜진 뒤에만 도달한다. 키 없이 공유를 가장하지 않는다.
    console.log(JSON.stringify({ message: 'kakao share slot armed, template key not set' }));
  }
}

export function renderShareBar(container, record) {
  if (!container) return;
  container.replaceChildren();
  SHARE_PROVIDERS.forEach((provider) => {
    if (!provider.enabled) return;
    if (provider.id === 'native' && typeof navigator.share !== 'function') return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `share-btn share-${provider.id}`;
    button.textContent = provider.label;
    button.addEventListener('click', async () => {
      const original = button.textContent;
      try {
        await runShare(provider.id, record);
        if (provider.id === 'copy') {
          button.textContent = '복사됨';
          setTimeout(() => { button.textContent = original; }, 1600);
        }
      } catch (error) {
        if (error?.name === 'AbortError') return;
        button.textContent = '다시 시도';
        setTimeout(() => { button.textContent = original; }, 1600);
      }
    });
    container.appendChild(button);
  });
}
