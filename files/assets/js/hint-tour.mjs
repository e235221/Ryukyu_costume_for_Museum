import {getLanguage, onLanguageChange} from './language.mjs?v=20260922-2';

const copy = Object.freeze({
  ja: Object.freeze({
    button: '操作のヒントを表示', label: 'ヒント', close: 'ヒントを閉じる', previous: '戻る', next: '次へ', finish: '完了',
    steps: [
      {title: '人物', body: '顔が映ると番号が使えます。衣装を変えたい人物の番号を選んでください。'},
      {title: '衣装', body: '選んだ人物に男性の琉装・女性の琉装・ヤンバルクイナを重ねます。「なし」で外せます。'},
      {title: '背景', body: '海・石畳・首里城などの背景を選べます。「なし」で元のカメラ映像に戻ります。'},
      {title: '部位解説', body: '琉装を選んでオンにすると、額付近・手首や袖・腰を指先で約1秒示すか画面をタッチして、その部分の解説を読めます。'},
      {title: '撮影', body: 'カメラ・衣装・背景を合成した写真をPNGで保存します。操作ボタンや指先の印は写真に入りません。'},
      {title: '人物設定', body: '人物の番号が入れ替わったとき、ここから左側の人を1番として振り直せます。'},
      {title: '展示解説', body: '衣装やヤンバルクイナの解説を開きます。解説の文字サイズも変更できます。'},
      {title: '終了', body: 'AR体験を終えて最初の画面へ戻ります。カメラも停止します。'}
    ]
  }),
  en: Object.freeze({
    button: 'Show feature hints', label: 'Hints', close: 'Close hints', previous: 'Back', next: 'Next', finish: 'Done',
    steps: [
      {title: 'People', body: 'When a face appears, its number becomes available. Choose the person whose outfit you want to change.'},
      {title: 'Outfits', body: 'Dress the selected person in men’s or women’s Ryūsō, or show a Yanbaru rail. Choose “None” to remove it.'},
      {title: 'Background', body: 'Choose a beach, stone path, or Shuri Castle scene. Choose “None” to return to the camera view.'},
      {title: 'Explore details', body: 'Choose Ryūsō and turn this on. Point at the forehead, wrist or sleeve, or waist for about one second, or tap the screen, to read about that part.'},
      {title: 'Take a photo', body: 'Save a PNG combining the camera, outfit, and background. Controls and fingertip markers stay out of the photo.'},
      {title: 'Person settings', body: 'If person numbers change unexpectedly, renumber everyone from left to right here.'},
      {title: 'Exhibit information', body: 'Read about the outfits or Yanbaru rail. You can adjust the text size in the information panel.'},
      {title: 'Exit', body: 'Return to the first screen and stop the camera.'}
    ]
  })
});

const steps = [
  {target: documentRef => documentRef.querySelector('.person-picker')},
  {target: (documentRef, windowRef) => documentRef.querySelector(windowRef.matchMedia('(min-width: 900px)').matches ? '.outfit-options' : '#outfitSummary')},
  {target: documentRef => documentRef.getElementById('backgroundSummary')},
  {target: documentRef => documentRef.getElementById('detailModeBtn')},
  {target: documentRef => documentRef.getElementById('photoBtn')},
  {target: documentRef => documentRef.querySelector('.person-settings summary')},
  {target: documentRef => documentRef.getElementById('infoBtn')},
  {target: documentRef => documentRef.getElementById('backBtn')}
];

export function initHintTour(documentRef = document, windowRef = window) {
  const button = documentRef.getElementById('hintBtn');
  const bubble = documentRef.getElementById('hintBubble');
  const title = documentRef.getElementById('hintTitle');
  const body = documentRef.getElementById('hintBody');
  const progress = documentRef.getElementById('hintProgress');
  const previous = documentRef.getElementById('hintPrev');
  const next = documentRef.getElementById('hintNext');
  const closeButton = documentRef.getElementById('hintClose');
  let index = 0;
  let target = null;

  function position() {
    if (bubble.hidden || !target) return;
    const rect = target.getBoundingClientRect();
    const width = bubble.offsetWidth;
    const height = bubble.offsetHeight;
    const viewportWidth = windowRef.innerWidth;
    const viewportHeight = windowRef.innerHeight;
    const margin = 12;
    const gap = 14;
    const above = rect.top - margin;
    const below = viewportHeight - rect.bottom - margin;
    const side = above >= height + gap || above >= below ? 'above' : 'below';
    const desiredTop = side === 'above' ? rect.top - height - gap : rect.bottom + gap;
    const top = Math.max(margin, Math.min(desiredTop, viewportHeight - height - margin));
    const left = Math.max(margin, Math.min(rect.left + rect.width / 2 - width / 2, viewportWidth - width - margin));
    bubble.style.top = `${top}px`;
    bubble.style.left = `${left}px`;
    bubble.style.setProperty('--hint-arrow-x', `${Math.max(18, Math.min(rect.left + rect.width / 2 - left, width - 18))}px`);
    bubble.dataset.side = side;
  }

  function render() {
    target?.classList.remove('hint-highlight');
    target = steps[index].target(documentRef, windowRef);
    target?.classList.add('hint-highlight');
    const language = copy[getLanguage()] || copy.ja;
    const content = language.steps[index];
    title.textContent = content.title;
    body.textContent = content.body;
    progress.textContent = `${index + 1} / ${steps.length}`;
    previous.hidden = index === 0;
    previous.textContent = language.previous;
    next.textContent = index === steps.length - 1 ? language.finish : language.next;
    position();
  }

  function close(restoreFocus = true) {
    if (bubble.hidden) return;
    bubble.hidden = true;
    target?.classList.remove('hint-highlight');
    target = null;
    button.setAttribute('aria-expanded', 'false');
    if (restoreFocus) button.focus();
  }

  function open() {
    index = 0;
    bubble.hidden = false;
    button.setAttribute('aria-expanded', 'true');
    render();
    next.focus();
  }

  function translateControls() {
    const language = copy[getLanguage()] || copy.ja;
    button.setAttribute('aria-label', language.button);
    button.querySelector('.hint-text').textContent = language.label;
    closeButton.setAttribute('aria-label', language.close);
    if (!bubble.hidden) render();
  }

  button.addEventListener('click', () => bubble.hidden ? open() : close());
  closeButton.addEventListener('click', () => close());
  previous.addEventListener('click', () => {
    if (index > 0) { index -= 1; render(); }
  });
  next.addEventListener('click', () => {
    if (index === steps.length - 1) close();
    else { index += 1; render(); }
  });
  documentRef.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !bubble.hidden) { event.preventDefault(); close(); }
  });
  documentRef.addEventListener('pointerdown', event => {
    if (!bubble.hidden && !bubble.contains(event.target) && !button.contains(event.target)) close(false);
  });
  documentRef.getElementById('backBtn').addEventListener('click', () => close(false));
  documentRef.getElementById('infoBtn').addEventListener('click', () => close(false));
  windowRef.addEventListener('resize', position);
  documentRef.addEventListener('scroll', position, true);
  onLanguageChange(translateControls);
  translateControls();
  return {open, close};
}

if (typeof document !== 'undefined') initHintTour();
