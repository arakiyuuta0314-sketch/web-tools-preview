/* Search operates locally on the already rendered catalog. No tracking requests. */
(() => {
  'use strict';
  const input = document.getElementById('appSearch');
  const status = document.getElementById('searchStatus');
  const empty = document.getElementById('noResults');
  const cards = [...document.querySelectorAll('.card[data-app-id]')];
  const groups = [...document.querySelectorAll('.group[data-group]')];
  if (!input || !status || !empty) return;
  function refresh() {
    const q = input.value.trim().toLocaleLowerCase('ja-JP');
    let visible = 0;
    for (const card of cards) {
      const matches = !q || (card.dataset.search || '').includes(q);
      card.hidden = !matches;
      if (matches) visible++;
    }
    for (const group of groups) {
      const inGroup = group.querySelectorAll('.card:not([hidden])').length;
      group.hidden = inGroup === 0;
      const count = group.querySelector('.group-count');
      if (count) count.textContent = inGroup + '作品';
    }
    status.textContent = visible + ' / ' + cards.length + '作品を表示中';
    empty.hidden = visible !== 0;
  }
  input.addEventListener('input', refresh);
  refresh();
})();
