const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const html = fs.readFileSync(__dirname + '/index.html', 'utf8');
assert.match(html, /data-costume="man"[^>]*>男性の琉装<\/button>/);
assert.match(html, /data-costume="woman"[^>]*>女性の琉装<\/button>/);
assert.doesNotMatch(html, /琉球男性衣装（オリオン）|琉球女性衣装（オリオン）/);

const script = html.match(/<script>\s*(\/\/ ===== COSTUME DATA =====[\s\S]*?)<\/script>/)[1];
const nodes = new Map();
const node = id => {
  if (!nodes.has(id)) nodes.set(id, {
    textContent:'',innerHTML:'',value:id === 'captionFontSize' ? '100' : '',style:{},events:{},
    classList:{add(){},remove(){}},
    addEventListener(type, listener){this.events[type]=listener;}
  });
  return nodes.get(id);
};
const context = {window:{},document:{getElementById:node}};
vm.runInNewContext(script, context);

context.window.showCostumeDescription('man');
const man = node('descBody').innerHTML;
assert.equal(node('descTitle').textContent, '琉球の装い　琉装');
assert.match(man, /<h2>琉球の装い　琉装<\/h2>/);
assert.match(man, /<h3>女性の着方　ウシンチー<\/h3>/);
assert.match(man, /<h3>男性の着方<\/h3>/);
assert.match(man, /<h2>歴史<\/h2>/);
assert.match(man, /href="https:\/\/kogeijapan\.com\/locale\/ja_JP\/list\/\?category=1&amp;pref=47"/);

context.window.showCostumeDescription('woman');
assert.equal(node('descBody').innerHTML, man, 'men and women must share exactly the same caption');
context.window.showCostumeDescription('bird');
const bird = node('descBody').innerHTML;
assert.doesNotMatch(bird, /顔の置き換え|顔の位置・大きさ・傾き/);
assert.match(bird, /<h3>飛べない鳥が，森を走る。<\/h3>/);
assert.match(bird, /<strong>沖縄島北部だけに生息する固有種\(こゆうしゅ\)<\/strong>/);
assert.match(bird, /1981年に新しい鳥の種として発表されました。/);
assert.match(bird, /さまざまな保全活動\(ほぜんかつどう\)が続けられています。/);
assert.equal(node('descBody').style.fontSize,'100%');
node('captionFontSize').events.input({target:{value:'140'}});
assert.equal(node('descBody').style.fontSize,'140%');
assert.equal(node('captionFontSizeValue').textContent,'140%');
node('captionFontSize').events.input({target:{value:'999'}});
assert.equal(node('descBody').style.fontSize,'160%','font size must be clamped to the maximum');
console.log('PASS: shared Ryuso caption, safe Markdown link/bold, expanded Yanbaru Kuina caption, 80–160% font-size control.');
