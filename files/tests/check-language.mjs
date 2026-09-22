import fs from 'node:fs';
import assert from 'node:assert/strict';
import {getLanguage, initLanguage, setLanguage, uiTranslations} from '../assets/js/language.mjs?v=20260922-2';
import {initCaptionPanel, renderMarkdown} from '../assets/js/caption-panel.mjs';
import {captionDataEn, detailCaptionDataEn} from '../assets/js/caption-data-en.mjs?v=20260922-1';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const keys = [...html.matchAll(/data-i18n(?:-aria-label)?="([^"]+)"/g)].map(match => match[1]);
for (const key of keys) {
  assert.equal(typeof uiTranslations.ja[key], 'string', `Japanese translation missing: ${key}`);
  assert.equal(typeof uiTranslations.en[key], 'string', `English translation missing: ${key}`);
}
assert.deepEqual(Object.keys(uiTranslations.en).sort(), Object.keys(uiTranslations.ja).sort());
for (const data of [...Object.values(captionDataEn), ...Object.values(detailCaptionDataEn.man), ...Object.values(detailCaptionDataEn.woman)]) {
  assert.doesNotMatch(data.name + data.markdown, /[ぁ-んァ-ヶ一-龯]/, 'English caption must not contain untranslated Japanese text');
}

function element(dataset = {}) {
  return {
    dataset, textContent: '', attributes: {}, events: {},
    setAttribute(name, value) {this.attributes[name] = value;},
    addEventListener(name, listener) {this.events[name] = listener;}
  };
}
const label = element({i18n: 'chooseLanguage'});
const start = element({i18n: 'start'});
const info = element({i18nAriaLabel: 'info'});
const buttons = [element({language: 'ja'}), element({language: 'en'})];
const documentRef = {
  documentElement: {lang: ''}, title: '',
  querySelectorAll(selector) {
    return ({'[data-i18n]': [label, start], '[data-i18n-aria-label]': [info], '[data-language]': buttons})[selector] || [];
  }
};
initLanguage(documentRef);
assert.equal(getLanguage(), 'ja');
assert.equal(start.textContent, 'AR体験を始める');
buttons[1].events.click();
assert.equal(getLanguage(), 'en');
assert.equal(documentRef.documentElement.lang, 'en');
assert.equal(label.textContent, 'Language');
assert.equal(start.textContent, 'Start AR experience');
assert.equal(info.attributes['aria-label'], 'Open information');
assert.equal(buttons[1].attributes['aria-pressed'], 'true');
assert.equal(buttons[0].attributes['aria-pressed'], 'false');
assert.equal(setLanguage('fr', documentRef), false);

const nodes = new Map();
const node = id => {
  if (!nodes.has(id)) nodes.set(id, {
    textContent: '', innerHTML: '', value: id === 'captionFontSize' ? '100' : '',
    style: {}, events: {}, classList: {
      open: false, add() {this.open = true;}, remove() {this.open = false;}, contains() {return this.open;}
    },
    addEventListener(type, listener) {this.events[type] = listener;}
  });
  return nodes.get(id);
};
const windowRef = {};
initCaptionPanel({getElementById: node}, windowRef);
windowRef.showCostumeDescription('man');
assert.equal(node('descTitle').textContent, 'Ryukyuan Dress: Ryūsō');
assert.match(node('descBody').innerHTML, /<h2>History<\/h2>/);
assert.match(node('descBody').innerHTML, /<em>ushinchī<\/em>/);
windowRef.showCostumeDescription('bird');
assert.match(node('descBody').innerHTML, /flightless bird/i);
windowRef.showCostumeDetail('woman', 'hair');
assert.match(node('descBody').innerHTML, /Uchina-kanpū/);
setLanguage('ja', documentRef);
assert.equal(node('descTitle').textContent, '女性の琉装：髪', 'open caption re-renders when language changes');
assert.match(renderMarkdown('**bold** and *italic*'), /<strong>bold<\/strong> and <em>italic<\/em>/);

console.log('PASS: landing language buttons, translated UI keys, English captions and live language switching.');
