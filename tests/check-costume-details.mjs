import assert from 'node:assert/strict';
import {CostumeDetailExplorer, findCostumeDetail} from '../assets/js/costume-details.mjs';
import {exhibitSettings} from '../exhibit-settings.mjs';

const placement = (kind, personId = 0) => ({
  personId,
  kind,
  center: {x: 500, y: 300},
  angle: 0,
  factor: 1,
  hole: kind === 'man'
    ? {x: 338.5, y: 228.5}
    : {x: 344, y: 277}
});
const screenPoint = (imagePoint, costume) => ({
  x: costume.center.x + imagePoint.x - costume.hole.x,
  y: costume.center.y + imagePoint.y - costume.hole.y
});

const man = placement('man');
const woman = placement('woman', 1);

assert.equal(findCostumeDetail(screenPoint({x: 180, y: 350}, man), [man]).region, 'sleeve');
assert.equal(findCostumeDetail(screenPoint({x: 260, y: 510}, man), [man]).region, 'sleeve', 'left wrist must open the sleeve caption');
assert.equal(findCostumeDetail(screenPoint({x: 400, y: 510}, man), [man]).region, 'sleeve', 'right wrist must open the sleeve caption');
assert.equal(findCostumeDetail(screenPoint({x: 330, y: 520}, man), [man]).region, 'waist');
assert.equal(findCostumeDetail(screenPoint({x: 340, y: 160}, man), [man]).region, 'head');
assert.equal(findCostumeDetail(screenPoint({x: 180, y: 420}, woman), [woman]).region, 'sleeve');
assert.equal(findCostumeDetail(screenPoint({x: 330, y: 570}, woman), [woman]).region, 'waist');
assert.equal(findCostumeDetail(screenPoint({x: 340, y: 190}, woman), [woman]).region, 'hair');
assert.equal(findCostumeDetail(screenPoint({x: 340, y: 750}, woman), [woman]), null);

const explorer = new CostumeDetailExplorer({dwellMs: 900, cooldownMs: 1200});
const sleevePoint = screenPoint({x: 180, y: 350}, man);
let state = explorer.update([sleevePoint], [man], 1000);
assert.equal(state.progress, 0);
assert.equal(state.activated, null);
state = explorer.update([sleevePoint], [man], 1450);
assert.equal(state.progress, 0.5);
state = explorer.update([sleevePoint], [man], 1900);
assert.equal(state.activated.region, 'sleeve');
state = explorer.update([sleevePoint], [man], 2000);
assert.equal(state.activated, null, 'cooldown prevents repeated activation');

const touched = explorer.activate(screenPoint({x: 330, y: 520}, man), [man], 4000);
assert.equal(touched.region, 'waist', 'touch activates a region immediately');

const headBox = exhibitSettings.alignment.man.regions[0].boxes[0];
const originalHeadX = headBox.x;
headBox.x = 0;
assert.equal(findCostumeDetail(screenPoint({x: 10, y: 160}, man), [man]).region, 'head', 'edited region coordinates must be used');
headBox.x = originalHeadX;

console.log('PASS: gender-specific costume regions, transformed hit testing, dwell activation, cooldown and touch activation.');
