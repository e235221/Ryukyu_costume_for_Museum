import assert from 'node:assert/strict';
import fs from 'node:fs';
import {exhibitSettings} from '../exhibit-settings.mjs';
import {exhibitText} from '../exhibit-text.mjs';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const multiface = fs.readFileSync(new URL('../assets/js/multiface.mjs', import.meta.url), 'utf8');
const background = fs.readFileSync(new URL('../assets/js/background.js', import.meta.url), 'utf8');

for (const [kind, item] of Object.entries(exhibitSettings.outfits)) {
  assert.match(html, new RegExp(`data-costume="${kind}"`));
  assert(fs.existsSync(new URL(`../${item.image}`, import.meta.url)), `outfit image is missing: ${item.image}`);
  for (const language of ['ja', 'en']) assert(item.name[language], `${kind} ${language} name is missing`);
}
for (const [kind, item] of Object.entries(exhibitSettings.backgrounds)) {
  assert.match(html, new RegExp(`data-background="${kind}"`));
  assert(fs.existsSync(new URL(`../${item.image}`, import.meta.url)), `background image is missing: ${item.image}`);
  for (const language of ['ja', 'en']) assert(item.name[language], `${kind} ${language} name is missing`);
}
assert.match(multiface, /image\.src = exhibitSettings\.outfits\[kind\]\.image/);
assert.match(background, /const backgroundOptions = exhibitSettings\.backgrounds/);
assert.doesNotMatch(html, /assets\/images\//, 'image paths must only be edited in exhibit-settings.mjs');

for (const language of ['ja', 'en']) {
  const text = exhibitText[language];
  assert.equal(text.intro.lines.length, 3);
  for (const kind of ['man', 'woman', 'bird']) assert(text.captions[kind].markdown && text.captions[kind].name);
  for (const kind of ['man', 'woman']) {
    for (const detail of Object.values(text.details[kind])) assert(detail.markdown && detail.name);
  }
}

exhibitSettings.outfits.man.name.ja = '試験用の衣装';
exhibitSettings.backgrounds.beach.name.ja = '試験用の海';
exhibitText.ja.intro.lines[0] = '試験用の導入文';
exhibitText.ja.captions.man.name = '試験用のキャプション';
const {uiTranslations} = await import('../assets/js/language.mjs?v=20260922-3');
const {initCaptionPanel} = await import('../assets/js/caption-panel.mjs');
assert.equal(uiTranslations.ja.outfitMan, '試験用の衣装');
assert.equal(uiTranslations.ja.beach, '試験用の海');
assert.equal(uiTranslations.ja.landingLine1, '試験用の導入文');
const elements = new Map();
const element = id => {
  if (!elements.has(id)) elements.set(id, {
    value: '100', textContent: '', style: {}, innerHTML: '',
    classList: {add() {}}, addEventListener() {}
  });
  return elements.get(id);
};
const windowRef = {};
initCaptionPanel({getElementById: element}, windowRef);
windowRef.showCostumeDescription('man');
assert.equal(element('descTitle').textContent, '試験用のキャプション');

console.log('PASS: one visual settings file controls image paths and button names; one text file controls intro and captions.');
