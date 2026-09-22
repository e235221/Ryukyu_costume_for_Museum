import {t} from './language.mjs?v=20260922-2';

export function drawCover(context, image, width, height, mirror = false) {
  const sourceWidth = image.videoWidth || image.naturalWidth || image.width;
  const sourceHeight = image.videoHeight || image.naturalHeight || image.height;
  if (!sourceWidth || !sourceHeight || !width || !height) {
    throw new Error(t('photoVideoSizeError'));
  }
  const scale = Math.max(width / sourceWidth, height / sourceHeight);
  const drawWidth = sourceWidth * scale;
  const drawHeight = sourceHeight * scale;
  context.save();
  if (mirror) {
    context.translate(width, 0);
    context.scale(-1, 1);
  }
  context.drawImage(
    image,
    (width - drawWidth) / 2,
    (height - drawHeight) / 2,
    drawWidth,
    drawHeight
  );
  context.restore();
}

export function composePhoto(output, {video, backgroundCanvas, costumeCanvas, width, height}) {
  if (!video || video.readyState < 2) throw new Error(t('photoVideoNotReady'));
  output.width = width;
  output.height = height;
  const context = output.getContext('2d');
  context.clearRect(0, 0, width, height);

  if (backgroundCanvas) {
    context.drawImage(backgroundCanvas, 0, 0, width, height);
  } else {
    drawCover(context, video, width, height, true);
  }
  context.drawImage(costumeCanvas, 0, 0, width, height);
  return output;
}

export function photoFilename(date = new Date()) {
  const pad = value => String(value).padStart(2, '0');
  return `ryukyu-ar-${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}.png`;
}
