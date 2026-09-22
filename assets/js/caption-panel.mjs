import {exhibitText} from '../../exhibit-text.mjs';
import {getLanguage, onLanguageChange} from './language.mjs?v=20260922-3';

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

function renderInlineMarkdown(value) {
  const pattern = /\[([^\]]+)\]\((https:\/\/[^\s)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*/g;
  let html = '';
  let lastIndex = 0;
  let match;
  while ((match = pattern.exec(value))) {
    html += escapeHtml(value.slice(lastIndex, match.index));
    html += match[3]
      ? `<strong>${escapeHtml(match[3])}</strong>`
      : match[4]
        ? `<em>${escapeHtml(match[4])}</em>`
        : `<a href="${escapeHtml(match[2])}" target="_blank" rel="noopener noreferrer">${escapeHtml(match[1])}</a>`;
    lastIndex = pattern.lastIndex;
  }
  return html + escapeHtml(value.slice(lastIndex));
}

export function renderMarkdown(markdown) {
  const blocks = markdown.trim().split(/\n\s*\n/).map(block => {
    if (block.startsWith('### ')) return `<h3>${escapeHtml(block.slice(4))}</h3>`;
    if (block.startsWith('## ')) return `<h2>${escapeHtml(block.slice(3))}</h2>`;
    return `<p>${renderInlineMarkdown(block.replace(/\n/g, ' '))}</p>`;
  });
  return `<div class="desc-markdown">${blocks.join('')}</div>`;
}

export function initCaptionPanel(documentRef = document, windowRef = window) {
  const fontSize = documentRef.getElementById('captionFontSize');
  const fontSizeValue = documentRef.getElementById('captionFontSizeValue');
  const body = documentRef.getElementById('descBody');
  const panel = documentRef.getElementById('descPanel');
  let currentSelection = null;

  const applyFontSize = value => {
    const percent = Math.min(160, Math.max(80, Number(value) || 100));
    fontSize.value = String(percent);
    fontSizeValue.textContent = `${percent}%`;
    body.style.fontSize = `${percent}%`;
  };

  fontSize.addEventListener('input', event => applyFontSize(event.target.value));
  documentRef.getElementById('closeDesc').addEventListener('click', () => panel.classList.remove('open'));
  applyFontSize(fontSize.value);

  const showCaption = data => {
    documentRef.getElementById('descTitle').textContent = data.name;
    body.innerHTML = renderMarkdown(data.markdown);
    panel.classList.add('open');
  };

  const showSelection = () => {
    const {captions: main, details: detail} = exhibitText[getLanguage()];
    if (currentSelection.type === 'main') showCaption(main[currentSelection.name] || main.man);
    else showCaption(detail[currentSelection.costume][currentSelection.region]);
  };

  windowRef.showCostumeDescription = name => {
    currentSelection = {type: 'main', name};
    showSelection();
  };
  windowRef.showCostumeDetail = (costume, region) => {
    const data = exhibitText[getLanguage()].details[costume]?.[region];
    if (!data) return false;
    currentSelection = {type: 'detail', costume, region};
    showSelection();
    return true;
  };
  windowRef.isCostumeDescriptionOpen = () => panel.classList.contains('open');
  onLanguageChange(() => {
    if (currentSelection && panel.classList.contains('open')) showSelection();
  });

  return {
    show: windowRef.showCostumeDescription,
    showDetail: windowRef.showCostumeDetail,
    applyFontSize
  };
}

if (typeof document !== 'undefined') initCaptionPanel();
