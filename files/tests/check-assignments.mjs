import assert from 'node:assert/strict';
import {FaceSlots} from '../assets/js/face-slots.mjs';
import {AssignmentController} from '../assets/js/assignment-controller.mjs';

class Element {
  constructor(dataset = {}) {
    this.dataset = dataset;
    this.attributes = {};
    this.events = {};
    this.disabled = false;
    this.hidden = false;
    this.textContent = '';
  }
  setAttribute(key, value) {this.attributes[key] = value;}
  addEventListener(type, listener) {this.events[type] = listener;}
  click() {if (!this.disabled) this.events.click();}
}

const slots = new FaceSlots(3);
const people = [0, 1, 2].map(person => new Element({person: String(person)}));
const costumes = ['man', 'woman', 'none', 'bird'].map(costume => new Element({costume}));
const detailButton = new Element();
const detailHint = new Element();
const assignmentLabel = new Element();
const resetButton = new Element();
const changes = [];
const controller = new AssignmentController({
  slots,
  peopleButtons: people,
  costumeButtons: costumes,
  detailButton,
  detailHint,
  assignmentLabel,
  resetButton,
  onChange: reason => changes.push(reason)
});

assert(people.every(button => button.disabled));
assert(costumes.every(button => button.disabled));
assert.equal(detailButton.disabled, true);
assert.equal(assignmentLabel.textContent, '人物を検出すると衣装を選べます');

slots.update([{x: .2, y: .4, size: .1}, {x: .5, y: .4, size: .1}, {x: .8, y: .4, size: .1}], 0);
controller.refresh();
assert(people.every(button => !button.disabled));
assert(costumes.every(button => !button.disabled));
assert.equal(detailButton.disabled, false);

detailButton.click();
assert.equal(controller.snapshot().detailMode, true);
assert.equal(detailButton.attributes['aria-pressed'], 'true');
assert.equal(detailHint.hidden, false);
controller.setHandState('ready');
assert.match(detailHint.textContent, /指先で約1秒/);

people[0].click(); costumes[1].click();
people[1].click(); costumes[0].click();
people[2].click(); costumes[2].click();
assert.equal(detailButton.disabled, true);
assert.equal(controller.snapshot().detailMode, false);
assert.deepEqual(controller.snapshot().outfits, ['woman', 'man', 'none']);

for (const [person, choice] of [[0, 1], [1, 0], [2, 2]]) {
  people[person].click();
  assert.equal(costumes[choice].attributes['aria-pressed'], 'true');
  assert.equal(costumes.filter(button => button.attributes['aria-pressed'] === 'true').length, 1);
}

resetButton.click();
assert(people.every(button => button.disabled));
assert(costumes.every(button => button.disabled));
assert.equal(detailButton.disabled, true);

slots.update([{x: .4, y: .4, size: .1}], 100);
controller.refresh();
assert.equal(people[0].disabled, false);
assert.equal(people[1].disabled, true);
people[1].click();
assert.equal(controller.snapshot().selectedPerson, 0);
assert.equal(controller.focus(1), false);
assert.equal(controller.focus(0), true);
assert(changes.includes('detail') && changes.includes('costume') && changes.includes('reset'));

console.log('PASS: detected-only selection, independent assignments, explicit detail mode and hand-state guidance.');
