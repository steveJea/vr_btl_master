/* Site footer. The unreleased main game is intentionally not linked. */
(function () {
  var script = document.currentScript;
  var current = script.getAttribute('data-current') || '';
  var mode = script.getAttribute('data-mode') || 'flow';
  var show = script.getAttribute('data-show');
  var games = [
    ['shoot', 'Shooting Masters', 'https://shoot.mbbs.kr/'],
    ['wcup', '이상형 월드컵', 'https://wcup.mbbs.kr/'],
    ['battle', 'Battle Masters', 'https://battle.mbbs.kr/'],
    ['home', 'mbbs.kr', 'https://www.mbbs.kr/'],
  ];
  var css = '#mbbs-footer{font:12px/1.5 system-ui,"Malgun Gothic",sans-serif;color:rgba(255,255,255,.55);text-align:center;padding:18px 12px calc(18px + env(safe-area-inset-bottom));}'
    + '#mbbs-footer.mf-flow{background:#09080d;border-top:1px solid rgba(255,255,255,.08)}'
    + '#mbbs-footer nav{display:flex;flex-wrap:wrap;justify-content:center;gap:4px 14px;margin-bottom:3px}'
    + '#mbbs-footer a{color:rgba(255,255,255,.75);text-decoration:none}'
    + '#mbbs-footer a:hover{color:#f5c16c}'
    + '#mbbs-footer .mf-cur{color:#f5c16c;font-weight:700}'
    + '#mbbs-footer .mf-copy{font-size:11px;opacity:.8}'
    + '#mbbs-footer .mf-copy a{color:inherit}';
  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
  var footer = document.createElement('footer');
  footer.id = 'mbbs-footer';
  footer.className = 'mf-' + mode;
  var nav = '<nav aria-label="다른 게임">' + games.map(function (game) {
    return game[0] === current
      ? '<span class="mf-cur" aria-current="page">' + game[1] + '</span>'
      : '<a href="' + game[2] + '">' + game[1] + '</a>';
  }).join('') + '</nav>';
  footer.innerHTML = nav + '<div class="mf-copy">Copyright © ' + new Date().getFullYear() + ' <a href="https://www.mbbs.kr/">MBBS Inc.</a> All Rights Reserved.</div>';
  function visible(el) {
    return el && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';
  }
  function update() {
    if (!show) return;
    var ok = show.split(',').some(function (query) { return visible(document.querySelector(query.trim())); });
    footer.style.display = ok ? '' : 'none';
  }
  function init() {
    document.body.appendChild(footer);
    if (show) {
      update();
      new MutationObserver(update).observe(document.body, {
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'style', 'hidden'],
      });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
