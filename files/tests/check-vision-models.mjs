import assert from 'node:assert/strict';
import {createVisionModelLoader} from '../assets/js/vision-models.mjs';

let moduleLoads = 0;
let filesetLoads = 0;
const calls = [];
const model = name => class {
  static async createFromOptions(files, options) {
    calls.push({name, files, delegate: options.baseOptions.delegate, options});
    if (name === 'face' && options.baseOptions.delegate === 'GPU') throw new Error('GPU unavailable');
    return {name, delegate: options.baseOptions.delegate};
  }
};
const loader = createVisionModelLoader({
  cdn: 'https://example.test/vision',
  async loadModule(url) {
    moduleLoads += 1;
    assert.equal(url, 'https://example.test/vision/vision_bundle.mjs');
    return {
      FilesetResolver: {async forVisionTasks(wasm) {filesetLoads += 1; assert.equal(wasm, 'https://example.test/vision/wasm'); return {wasm};}},
      FaceLandmarker: model('face'),
      HandLandmarker: model('hands')
    };
  }
});

const face = await loader.face();
assert.equal(face.delegate, 'CPU', 'face model falls back from GPU to CPU');
assert.equal(await loader.face(), face, 'face model is cached');
const hands = await loader.hands();
assert.equal(hands.delegate, 'GPU');
assert.equal(moduleLoads, 1, 'face and hand models share one MediaPipe runtime');
assert.equal(filesetLoads, 1);
assert.equal(calls.find(call => call.name === 'hands').options.numHands, 2);

console.log('PASS: shared runtime, cached models, GPU/CPU fallback and hand model options.');
