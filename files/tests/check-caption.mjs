import fs from 'node:fs';
import assert from 'node:assert/strict';
import {captionData, detailCaptionData, initCaptionPanel, renderMarkdown} from '../assets/js/caption-panel.mjs';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
assert.match(html, /data-costume="man"[^>]*aria-label="男性の琉装"[^>]*>男性の琉装<\/button>/);
assert.match(html, /data-costume="woman"[^>]*aria-label="女性の琉装"[^>]*>女性の琉装<\/button>/);
assert.match(html, /data-costume="bird"[^>]*aria-label="ヤンバルクイナ"[^>]*>クイナ<\/button>/);
assert.match(html, /id="detailModeLabel">部位解説<\/span>/);
assert.match(html, /id="detailHint"/);
assert.doesNotMatch(html, /琉球男性衣装（オリオン）|琉球女性衣装（オリオン）/);
assert.match(html, /src="assets\/js\/caption-panel\.mjs\?v=[^"]+"/);

const nodes = new Map();
const node = id => {
  if (!nodes.has(id)) nodes.set(id, {
    textContent: '',
    innerHTML: '',
    value: id === 'captionFontSize' ? '100' : '',
    style: {},
    events: {},
    classList: {add() {}, remove() {}, contains() {return false;}},
    addEventListener(type, listener) {this.events[type] = listener;}
  });
  return nodes.get(id);
};
const windowRef = {};
initCaptionPanel({getElementById: node}, windowRef);

windowRef.showCostumeDescription('man');
const man = node('descBody').innerHTML;
assert.equal(node('descTitle').textContent, '琉球の装い　琉装');
assert.match(man, /<h2>琉球の装い　琉装<\/h2>/);
assert.match(man, /<h3>女性の着方　ウシンチー<\/h3>/);
assert.match(man, /<h3>男性の着方<\/h3>/);
assert.match(man, /<h2>歴史<\/h2>/);
assert.match(man, /href="https:\/\/kogeijapan\.com\/locale\/ja_JP\/list\/\?category=1&amp;pref=47"/);

windowRef.showCostumeDescription('woman');
assert.equal(node('descBody').innerHTML, man, 'men and women must share exactly the same caption');
windowRef.showCostumeDescription('bird');
const bird = node('descBody').innerHTML;
assert.doesNotMatch(bird, /顔の置き換え|顔の位置・大きさ・傾き/);
assert.match(bird, /<h3>飛べない鳥が，森を走る。<\/h3>/);
assert.match(bird, /<strong>沖縄島北部だけに生息する固有種\(こゆうしゅ\)<\/strong>/);
assert.match(bird, /1981年に新しい鳥の種として発表されました。/);
assert.match(bird, /さまざまな保全活動\(ほぜんかつどう\)が続けられています。/);
assert.equal(node('descBody').style.fontSize, '100%');
node('captionFontSize').events.input({target: {value: '140'}});
assert.equal(node('descBody').style.fontSize, '140%');
assert.equal(node('captionFontSizeValue').textContent, '140%');
node('captionFontSize').events.input({target: {value: '999'}});
assert.equal(node('descBody').style.fontSize, '160%', 'font size must be clamped to the maximum');

assert.equal(captionData.man.markdown, captionData.woman.markdown);
assert.equal(windowRef.showCostumeDetail('man', 'sleeve'), true);
assert.match(node('descBody').innerHTML, /<h2>袖<\/h2>/);
assert.match(node('descBody').innerHTML, /袖口から内側が見えるため/);
assert.equal(windowRef.showCostumeDetail('man', 'waist'), true);
assert.match(node('descBody').innerHTML, /男性は，腰のあたりを帯で固定し/);
assert.equal(windowRef.showCostumeDetail('woman', 'waist'), true);
assert.match(node('descBody').innerHTML, /ウシンチー/);
assert.equal(windowRef.showCostumeDetail('man', 'head'), true);
assert.match(node('descBody').innerHTML, /ハチマチ/);
assert.equal(windowRef.showCostumeDetail('woman', 'hair'), true);
assert.match(node('descBody').innerHTML, /ウチナーカンプー/);
assert.equal(windowRef.showCostumeDetail('woman', 'head'), false, 'head caption is male-only');
assert.equal(windowRef.showCostumeDetail('man', 'hair'), false, 'hair caption is female-only');
assert.deepEqual(Object.keys(detailCaptionData.man), ['sleeve', 'waist', 'head']);
assert.deepEqual(Object.keys(detailCaptionData.woman), ['sleeve', 'waist', 'hair']);
assert.match(renderMarkdown('## 見出し\n\n本文'), /<h2>見出し<\/h2><p>本文<\/p>/);
assert.doesNotMatch(renderMarkdown('<script>alert(1)</script>'), /<script>/);

console.log('PASS: shared Ryuso caption, safe Markdown link/bold, expanded Yanbaru Kuina caption, 80–160% font-size control.');
