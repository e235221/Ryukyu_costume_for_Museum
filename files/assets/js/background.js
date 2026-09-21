// Local compositing; camera frames are processed on this device.
(() => {
  const CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation@0.1.1675465747/';
  const images = {
    beach: 'assets/images/backgrounds/beach.jpg',
    stone: 'assets/images/backgrounds/ishidatami.jpg',
    'castle-before': 'assets/images/backgrounds/shurijo-before.jpg',
    'castle-after': 'assets/images/backgrounds/shurijo-after.jpg'
  };
  let video, model, modelPromise, selected = 'none', background, timer, busy = false, generation = 0, job;
  const canvas = document.getElementById('backgroundCanvas');
  const context = canvas.getContext('2d');
  const message = document.getElementById('backgroundStatus');
  const summary = document.getElementById('backgroundSummary');
  const choice = document.getElementById('backgroundChoice');
  const buttons = [...document.querySelectorAll('[data-background]')];
  const labels = {none: 'なし', beach: '海', stone: '石畳', 'castle-before': '首里城（復元前）', 'castle-after': '首里城（復元後）'};
  function cover(ctx, image, width, height) {
    const iw = image.videoWidth || image.naturalWidth || image.width;
    const ih = image.videoHeight || image.naturalHeight || image.height;
    const scale = Math.max(width / iw, height / ih);
    ctx.drawImage(image, (width-iw*scale)/2, (height-ih*scale)/2, iw*scale, ih*scale);
  }
  function hide() { canvas.hidden = true; }
  function loadModel() {
    if (!modelPromise) modelPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = CDN + 'selfie_segmentation.js';
      const timeout = setTimeout(() => reject(new Error('背景処理の読込がタイムアウトしました')), 30000);
      script.onerror = () => { clearTimeout(timeout); reject(new Error('背景処理を読み込めません')); };
      script.onload = () => {
        clearTimeout(timeout);
        try {
          model = new SelfieSegmentation({locateFile: file => CDN + file});
          model.setOptions({modelSelection: 1});
          model.onResults(results => {
            if (!job || job.generation !== generation || !video || selected === 'none') return;
            const parent = canvas.parentElement;
            const w = Math.min(960, parent.clientWidth), h = Math.round(w * parent.clientHeight / parent.clientWidth);
            if (!w || !h) return;
            if (canvas.width !== w || canvas.height !== h) {canvas.width = w; canvas.height = h;}
            context.save();
            context.clearRect(0, 0, w, h);
            context.translate(w, 0); context.scale(-1, 1);
            cover(context, results.segmentationMask, w, h);
            context.globalCompositeOperation = 'source-in';
            cover(context, results.image, w, h);
            context.restore();
            context.save();
            context.globalCompositeOperation = 'destination-over';
            cover(context, background, w, h);
            context.restore();
            canvas.hidden = false;
            message.textContent = '';
          });
          resolve(model);
        } catch (error) {reject(error);}
      };
      document.head.appendChild(script);
    }).catch(error => { modelPromise = null; throw error; });
    return modelPromise;
  }
  function run() {
    clearInterval(timer);
    if (!video || selected === 'none' || !model || !background) return;
    // At most 10 segmentation frames/sec, with no overlapping inference.
    timer = setInterval(async () => {
      if (busy || !video || video.readyState < 2 || document.hidden) return;
      busy = true;
      const token = generation;
      job = {generation: token};
      try { await model.send({image: video}); }
      catch (error) {
        if (token === generation) {
          clearInterval(timer); hide();
          message.textContent = '背景処理に失敗しました。「なし」で通常のカメラに戻せます。';
          console.error('Background:', error);
        }
      } finally {busy = false;}
    }, 100);
  }
  async function select(name) {
    const token = ++generation;
    selected = name; clearInterval(timer); hide();
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.background === name)));
    summary.setAttribute('aria-label', `背景：${labels[name] || 'なし'}`);
    choice.textContent = `：${labels[name] || 'なし'}`;
    message.textContent = name === 'none' ? '' : '背景を準備中...';
    if (name === 'none') return;
    try {
      const image = new Image(); image.src = images[name];
      await Promise.all([image.decode(), loadModel()]);
      if (token !== generation) return;
      background = image; run();
    } catch (error) {
      if (token === generation) message.textContent = '背景を読み込めません。「なし」に戻すか、もう一度選んでください。';
      console.error('Background:', error);
    }
  }
  buttons.forEach(button => button.addEventListener('click', () => select(button.dataset.background)));
  window.costumeBackground = {
    start(input) {video = input; if (selected !== 'none') select(selected);},
    stop() {generation++; video = null; clearInterval(timer); hide(); message.textContent = '';}
  };
})();
