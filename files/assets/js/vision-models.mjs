const VISION_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.9';
const FACE_MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';
const HAND_MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

export function createVisionModelLoader({
  loadModule = url => import(url),
  cdn = VISION_CDN
} = {}) {
  let runtimePromise;
  let facePromise;
  let handsPromise;

  async function runtime() {
    if (!runtimePromise) runtimePromise = (async () => {
      const vision = await loadModule(`${cdn}/vision_bundle.mjs`);
      const files = await vision.FilesetResolver.forVisionTasks(`${cdn}/wasm`);
      return {...vision, files};
    })().catch(error => {
      runtimePromise = null;
      throw error;
    });
    return runtimePromise;
  }

  async function createModel(Model, files, options) {
    try {
      return await Model.createFromOptions(files, options);
    } catch {
      options.baseOptions.delegate = 'CPU';
      return Model.createFromOptions(files, options);
    }
  }

  return Object.freeze({
    face() {
      if (!facePromise) facePromise = (async () => {
        const {FaceLandmarker, files} = await runtime();
        return createModel(FaceLandmarker, files, {
          baseOptions: {modelAssetPath: FACE_MODEL_URL, delegate: 'GPU'},
          runningMode: 'VIDEO',
          numFaces: 3,
          outputFaceBlendshapes: false,
          outputFacialTransformationMatrixes: false
        });
      })().catch(error => {
        facePromise = null;
        throw error;
      });
      return facePromise;
    },

    hands() {
      if (!handsPromise) handsPromise = (async () => {
        const {HandLandmarker, files} = await runtime();
        return createModel(HandLandmarker, files, {
          baseOptions: {modelAssetPath: HAND_MODEL_URL, delegate: 'GPU'},
          runningMode: 'VIDEO',
          numHands: 2,
          minHandDetectionConfidence: 0.55,
          minHandPresenceConfidence: 0.55,
          minTrackingConfidence: 0.5
        });
      })().catch(error => {
        handsPromise = null;
        throw error;
      });
      return handsPromise;
    }
  });
}

export const visionModels = createVisionModelLoader();
