/* MindAR 1.2.5: align the measured transparent opening to face landmarks. */
if (window.AFRAME) AFRAME.registerComponent('costume-fit', {
  schema: {kind: {default: 'man'}},
  init() {
    const T = AFRAME.THREE;
    this.inverse = new T.Matrix4();
    this.matrix = new T.Matrix4();
    this.points = [new T.Vector3(), new T.Vector3(), new T.Vector3(), new T.Vector3()];
  },
  tick() {
    const controller = this.el.sceneEl.systems['mindar-face-system']?.controller;
    if (!controller?.lastEstimateResult || !this.el.getAttribute('visible')) return;
    this.inverse.set(...controller.getLandmarkMatrix(1)).invert();
    // Cheeks, forehead and chin, expressed relative to the nose anchor.
    [234, 454, 10, 152].forEach((id, i) => {
      this.matrix.set(...controller.getLandmarkMatrix(id));
      this.points[i].setFromMatrixPosition(this.matrix).applyMatrix4(this.inverse);
    });
    const [left, right, top, bottom] = this.points;
    const hole = this.data.kind === 'man'
      ? {x: 338.5, y: 228.5, w: 65, h: 79}
      : {x: 344, y: 277, w: 62, h: 76};
    // Fit the whole face into the opening without stretching the photograph.
    const factor = Math.max(Math.abs(right.x-left.x)/hole.w, Math.abs(top.y-bottom.y)/hole.h);
    if (!Number.isFinite(factor) || factor <= 0) return;
    const width = factor * 683, height = factor * 1024;
    this.el.object3D.scale.set(width, height, 1);
    this.el.object3D.position.set(
      (left.x+right.x)/2 + (683/2-hole.x)*factor,
      (top.y+bottom.y)/2 + (hole.y-1024/2)*factor,
      0.02
    );
  }
});
