import {exhibitSettings} from '../../exhibit-settings.mjs';
import {exhibitText} from '../../exhibit-text.mjs';

const baseTranslations = Object.freeze({
  ja: Object.freeze({
    chooseLanguage: '表示言語', start: 'AR体験を始める',
    cameraNote: '※ カメラへのアクセス許可が必要です。', portraitNote: '※ スマートフォンでは縦向きを推奨します。',
    arArea: 'AR体験画面', loading: 'カメラを起動中...', back: 'AR体験を終了', info: '解説を表示', infoShort: '解説',
    dock: '人物ごとの衣装', people: '人物', personGroup: '衣装を変更する人物', outfit: '衣装',
    outfitGroup: '選択した人物の衣装・顔。横にスクロールできます',
    none: 'なし',
    backgroundChange: '背景変更', background: '背景', backgroundGroup: '背景の選択', backgroundSummary: '背景：{background}', backgroundChoice: '：{background}',
    detailMode: '部位解説', capture: '撮影', settings: '設定', personSettings: '人物設定', resetPeople: '番号を左から振り直す',
    descriptionPanel: '展示解説', captionTitle: '衣装解説', closeDescription: '解説を閉じる', fontSize: '文字サイズ', fontSizeInput: 'キャプションの文字サイズ',
    person: '人物{number}', personUndetected: '人物{number}（未検出）', assignmentFor: '人物{number} の衣装・顔',
    noPerson: '人物を検出すると衣装を選べます', outfitFor: '人物{number}の衣装：{outfit}', outfitChoice: '：{outfit}', noPersonOutfit: '衣装：人物未検出',
    detailOn: '部位解説：オン', detailOff: '部位解説：オフ',
    detailUnavailable: '衣装の袖・腰・頭／髪を画面でタッチしてください',
    detailLoading: '手の認識を準備中です。衣装は画面タッチでも読めます',
    detailReady: '袖・腰・頭／髪を指先で約1秒示すか、画面をタッチしてください',
    backgroundPreparing: '背景を準備中...', backgroundError: '背景を読み込めません。「なし」に戻すか、もう一度選んでください。',
    backgroundProcessingError: '背景処理に失敗しました。「なし」で通常のカメラに戻せます。',
    backgroundLoadTimeout: '背景処理の読込がタイムアウトしました', backgroundScriptError: '背景処理を読み込めません',
    photoBlobError: '写真データを作成できません', photoCameraNotReady: 'カメラと顔認識の準備が完了してから撮影してください',
    photoBackgroundNotReady: '背景の準備が完了してから撮影してください', photoSaved: '写真を保存しました',
    photoSaveError: '写真を保存できません：{reason}', photoVideoSizeError: '撮影する映像のサイズを取得できません',
    photoVideoNotReady: 'カメラ映像の準備ができていません',
    startError: '起動できません：{reason}。左上の矢印で戻って再試行してください。',
    trackingCount: '{count}人を認識中（最大3人）', facePrompt: '顔をカメラに向けてください',
    startTimeout: '準備がタイムアウトしました', fileProtocolError: 'ARを起動.commandからlocalhostで開いてください',
    secureContextError: 'localhostまたはHTTPSが必要です', facePreparing: '複数人の顔認識を準備中...',
    regionSleeve: '袖', regionWaist: '腰', regionHead: '頭', regionHair: '髪'
  }),
  en: Object.freeze({
    chooseLanguage: 'Language', start: 'Start AR experience',
    cameraNote: '※ Camera access is required.', portraitNote: '※ Portrait orientation is recommended on phones.',
    arArea: 'AR experience', loading: 'Starting camera...', back: 'Exit AR experience', info: 'Open information', infoShort: 'Info',
    dock: 'Costume for each person', people: 'People', personGroup: 'Choose a person to dress', outfit: 'Outfit',
    outfitGroup: 'Choose an outfit or face. Scroll horizontally for more options',
    none: 'None',
    backgroundChange: 'Background', background: 'Backdrop', backgroundGroup: 'Choose a background', backgroundSummary: 'Background: {background}', backgroundChoice: ': {background}',
    detailMode: 'Explore details', capture: 'Take photo', settings: 'Settings', personSettings: 'Person settings', resetPeople: 'Renumber from left',
    descriptionPanel: 'Exhibit information', captionTitle: 'Costume information', closeDescription: 'Close information', fontSize: 'Text size', fontSizeInput: 'Caption text size',
    person: 'Person {number}', personUndetected: 'Person {number} (not detected)', assignmentFor: 'Person {number} — outfit and face',
    noPerson: 'Detect a person to choose an outfit', outfitFor: 'Person {number} outfit: {outfit}', outfitChoice: ': {outfit}', noPersonOutfit: 'Outfit: no person detected',
    detailOn: 'Explore details: on', detailOff: 'Explore details: off',
    detailUnavailable: 'Tap a sleeve, waist, head, or hairstyle on the outfit.',
    detailLoading: 'Preparing hand tracking. You can also tap the outfit.',
    detailReady: 'Point at a sleeve, waist, head, or hairstyle for about one second, or tap it.',
    backgroundPreparing: 'Preparing background...', backgroundError: 'Could not load the background. Choose “None” or try again.',
    backgroundProcessingError: 'Background processing failed. Choose “None” to return to the camera.',
    backgroundLoadTimeout: 'Background processing timed out', backgroundScriptError: 'Could not load background processing',
    photoBlobError: 'Could not create photo data', photoCameraNotReady: 'Wait until the camera and face tracking are ready.',
    photoBackgroundNotReady: 'Wait until the background is ready.', photoSaved: 'Photo saved',
    photoSaveError: 'Could not save the photo: {reason}', photoVideoSizeError: 'Could not determine the video size',
    photoVideoNotReady: 'Camera video is not ready',
    startError: 'Could not start: {reason}. Use the arrow at top left to return and try again.',
    trackingCount: 'Tracking {count} of 3 people', facePrompt: 'Face the camera',
    startTimeout: 'Setup timed out', fileProtocolError: 'Open the app from localhost using ARを起動.command',
    secureContextError: 'localhost or HTTPS is required', facePreparing: 'Preparing multi-person face tracking...',
    regionSleeve: 'Sleeve', regionWaist: 'Waist', regionHead: 'Headwear', regionHair: 'Hair'
  })
});

function configuredLabels(language) {
  const intro = exhibitText[language].intro;
  const outfits = exhibitSettings.outfits;
  const backgrounds = exhibitSettings.backgrounds;
  return {
    appTitle: intro.title,
    subtitle: intro.subtitle,
    landingLine1: intro.lines[0],
    landingLine2: intro.lines[1],
    landingLine3: intro.lines[2],
    outfitMan: outfits.man.name[language],
    outfitWoman: outfits.woman.name[language],
    birdShort: outfits.bird.shortName[language],
    birdFull: outfits.bird.name[language],
    beach: backgrounds.beach.name[language],
    stone: backgrounds.stone.name[language],
    castleBefore: backgrounds['castle-before'].name[language],
    castleAfter: backgrounds['castle-after'].name[language]
  };
}

export const uiTranslations = Object.freeze(Object.fromEntries(
  Object.entries(baseTranslations).map(([language, strings]) => [
    language, Object.freeze({...strings, ...configuredLabels(language)})
  ])
));

let currentLanguage = 'ja';
const listeners = new Set();

export function getLanguage() { return currentLanguage; }

export function t(key, values = {}) {
  const template = uiTranslations[currentLanguage][key] ?? uiTranslations.ja[key] ?? key;
  return template.replace(/\{(\w+)\}/g, (_, name) => String(values[name] ?? ''));
}

export function onLanguageChange(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setLanguage(language, documentRef = typeof document === 'undefined' ? null : document) {
  if (!Object.prototype.hasOwnProperty.call(uiTranslations, language)) return false;
  currentLanguage = language;
  if (documentRef) {
    documentRef.documentElement.lang = language;
    documentRef.title = t('appTitle');
    documentRef.querySelectorAll('[data-i18n]').forEach(node => { node.textContent = t(node.dataset.i18n); });
    documentRef.querySelectorAll('[data-i18n-aria-label]').forEach(node => {
      node.setAttribute('aria-label', t(node.dataset.i18nAriaLabel));
    });
    documentRef.querySelectorAll('[data-language]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.language === language));
    });
  }
  if (typeof window !== 'undefined') window.costumeBackground?.refreshLanguage?.();
  listeners.forEach(listener => listener(language));
  return true;
}

export function initLanguage(documentRef = document) {
  documentRef.querySelectorAll('[data-language]').forEach(button => {
    button.addEventListener('click', () => setLanguage(button.dataset.language, documentRef));
  });
  setLanguage('ja', documentRef);
}

if (typeof window !== 'undefined') window.appLanguage = {getLanguage, setLanguage, t, onLanguageChange};
if (typeof document !== 'undefined') initLanguage();
