import {t} from './language.mjs?v=20260922-3';
import {exhibitSettings} from '../../exhibit-settings.mjs';

const REGION_LABEL_KEYS = Object.freeze({sleeve: 'regionSleeve', waist: 'regionWaist', head: 'regionHead', hair: 'regionHair'});

function pointInBox(point, box) {
  return point.x >= box.x && point.x <= box.x + box.width
    && point.y >= box.y && point.y <= box.y + box.height;
}

function toCostumePoint(point, placement) {
  const dx = point.x - placement.center.x;
  const dy = point.y - placement.center.y;
  const cosine = Math.cos(placement.angle);
  const sine = Math.sin(placement.angle);
  return {
    x: (cosine * dx + sine * dy) / placement.factor + placement.hole.x,
    y: (-sine * dx + cosine * dy) / placement.factor + placement.hole.y
  };
}

export function findCostumeDetail(point, placements) {
  for (let index = placements.length - 1; index >= 0; index -= 1) {
    const placement = placements[index];
    const regions = exhibitSettings.alignment[placement.kind]?.regions;
    if (!regions) continue;
    const costumePoint = toCostumePoint(point, placement);
    const region = regions.find(candidate => candidate.boxes.some(box => pointInBox(costumePoint, box)));
    if (region) {
      return {
        personId: placement.personId,
        costume: placement.kind,
        region: region.id,
        label: t(REGION_LABEL_KEYS[region.id])
      };
    }
  }
  return null;
}

export class CostumeDetailExplorer {
  constructor({dwellMs = 900, cooldownMs = 1200} = {}) {
    this.dwellMs = dwellMs;
    this.cooldownMs = cooldownMs;
    this.reset();
  }

  reset() {
    this.key = null;
    this.since = 0;
    this.blockedUntil = 0;
  }

  activate(point, placements, now = 0) {
    const hit = findCostumeDetail(point, placements);
    if (hit) {
      this.blockedUntil = now + this.cooldownMs;
      this.key = null;
    }
    return hit;
  }

  update(points, placements, now) {
    const candidate = points
      .map(point => ({point, hit: findCostumeDetail(point, placements)}))
      .find(item => item.hit);

    if (!candidate || now < this.blockedUntil) {
      this.key = null;
      return {point: candidate?.point || null, hit: candidate?.hit || null, progress: 0, activated: null};
    }

    const key = `${candidate.hit.personId}:${candidate.hit.costume}:${candidate.hit.region}`;
    if (key !== this.key) {
      this.key = key;
      this.since = now;
    }

    const progress = Math.min(1, Math.max(0, (now - this.since) / this.dwellMs));
    if (progress < 1) return {...candidate, progress, activated: null};

    this.key = null;
    this.blockedUntil = now + this.cooldownMs;
    return {...candidate, progress: 1, activated: candidate.hit};
  }
}
