import fs from 'node:fs';
import assert from 'node:assert/strict';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../assets/css/app.css', import.meta.url), 'utf8');
const js = fs.readFileSync(new URL('../assets/js/multiface.mjs', import.meta.url), 'utf8');
const barStart = html.indexOf('<div class="costume-bar"');
const barEnd = html.indexOf('</section>', barStart);
assert(barStart > 0 && barEnd > barStart, '操作ドックがAR画面内にある');
const bar = html.slice(barStart, barEnd);

for (const id of ['resetPeople', 'photoBtn', 'detailModeBtn', 'backgroundSummary', 'outfitSummary']) {
  assert.equal((html.match(new RegExp(`id="${id}"`, 'g')) || []).length, 1, `${id}は1個だけ`);
}
assert.match(html, /class="info-btn"[^>]*>[\s\S]*class="info-text"[^>]*>解説<\/span>/);
assert.match(bar, /class="dock-section person-section"[\s\S]*class="person-picker"[\s\S]*data-person="0"[\s\S]*data-person="2"/);
assert.match(bar, /class="dock-section outfit-section"[\s\S]*class="outfit-picker" open>[\s\S]*data-costume="man"[\s\S]*data-costume="none"/);
assert.match(bar, /class="dock-section tools-section"[\s\S]*class="background-picker"[\s\S]*id="detailModeBtn"/);
assert.match(bar, /class="capture-section"[\s\S]*id="photoBtn"/);
assert.match(bar, /class="person-settings"[\s\S]*id="resetPeople"/);
assert.match(bar, /id="assignmentLabel" class="sr-only"/);
assert.match(css, /@media\s*\(min-width:\s*900px\)\s*\{[\s\S]*grid-template-columns:\s*minmax\(155px,[^;]+minmax\(145px,[^;]+;/);
assert.match(css, /\.outfit-options\s*\{[^}]*display:\s*flex;[^}]*overflow-x:\s*auto/);
assert.match(js, /matchMedia\('\(min-width: 900px\)'\)/);

console.log('PASS: desktop dock matches the four-section reference, compact picker remains responsive, and top-right info is labeled.');
