const isRyuso = kind => kind === 'man' || kind === 'woman';

export class AssignmentController {
  constructor({
    slots,
    peopleButtons,
    costumeButtons,
    detailButton,
    detailHint,
    assignmentLabel,
    resetButton,
    onChange = () => {}
  }) {
    this.slots = slots;
    this.peopleButtons = peopleButtons;
    this.costumeButtons = costumeButtons;
    this.detailButton = detailButton;
    this.detailHint = detailHint;
    this.assignmentLabel = assignmentLabel;
    this.onChange = onChange;
    this.selectedPerson = 0;
    this.outfits = ['man', 'woman', 'man'];
    this.detailMode = false;
    this.handState = 'idle';

    peopleButtons.forEach(button => button.addEventListener('click', () => {
      if (button.disabled) return;
      this.selectedPerson = Number(button.dataset.person);
      this.refresh();
      this.onChange('person');
    }));
    costumeButtons.forEach(button => button.addEventListener('click', () => {
      if (button.disabled) return;
      this.outfits[this.selectedPerson] = button.dataset.costume;
      this.refresh();
      this.onChange('costume');
    }));
    resetButton.addEventListener('click', () => {
      this.slots.reset();
      this.refresh();
      this.onChange('reset');
    });
    detailButton.addEventListener('click', () => {
      if (detailButton.disabled) return;
      this.detailMode = !this.detailMode;
      this.refresh();
      this.onChange('detail');
    });
    this.refresh();
  }

  snapshot() {
    return {
      selectedPerson: this.selectedPerson,
      outfits: [...this.outfits],
      detailMode: this.detailMode
    };
  }

  focus(personId) {
    if (!this.slots.slots[personId]?.visible) return false;
    this.selectedPerson = personId;
    this.refresh();
    return true;
  }

  setHandState(state) {
    this.handState = state;
    this.refresh();
  }

  stopDetailMode() {
    this.detailMode = false;
    this.handState = 'idle';
    this.refresh();
  }

  refresh() {
    const firstVisible = this.slots.slots.findIndex(slot => slot.visible);
    if (!this.slots.slots[this.selectedPerson].visible && firstVisible >= 0) {
      this.selectedPerson = firstVisible;
    }
    const hasSelectedPerson = firstVisible >= 0 && this.slots.slots[this.selectedPerson].visible;

    this.peopleButtons.forEach((button, index) => {
      const visible = this.slots.slots[index].visible;
      button.disabled = !visible;
      button.setAttribute('aria-disabled', String(!visible));
      button.setAttribute('aria-pressed', String(visible && index === this.selectedPerson));
      button.textContent = `人物${index + 1}${visible ? ' ✓' : '（未検出）'}`;
    });
    this.costumeButtons.forEach(button => {
      button.disabled = !hasSelectedPerson;
      button.setAttribute('aria-disabled', String(!hasSelectedPerson));
      button.setAttribute('aria-pressed', String(button.dataset.costume === this.outfits[this.selectedPerson]));
    });
    this.assignmentLabel.textContent = hasSelectedPerson
      ? `人物${this.selectedPerson + 1} の衣装・顔`
      : '人物を検出すると衣装を選べます';

    const canInspect = hasSelectedPerson && isRyuso(this.outfits[this.selectedPerson]);
    if (!canInspect) this.detailMode = false;
    this.detailButton.disabled = !canInspect;
    this.detailButton.setAttribute('aria-disabled', String(!canInspect));
    this.detailButton.setAttribute('aria-pressed', String(this.detailMode));
    this.detailButton.textContent = this.detailMode ? '部位解説：オン' : '資料を体で読む';
    this.detailHint.hidden = !this.detailMode;
    if (!this.detailMode) return;
    if (this.handState === 'unavailable') {
      this.detailHint.textContent = '衣装の袖・腰・頭／髪を画面でタッチしてください';
    } else if (this.handState !== 'ready') {
      this.detailHint.textContent = '手の認識を準備中です。衣装は画面タッチでも読めます';
    } else {
      this.detailHint.textContent = '袖・腰・頭／髪を指先で約1秒示すか、画面をタッチしてください';
    }
  }
}
