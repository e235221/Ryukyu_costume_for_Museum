import {onLanguageChange, t} from './language.mjs?v=20260922-3';

const isRyuso = kind => kind === 'man' || kind === 'woman';
const outfitNameKeys = {man: 'outfitMan', woman: 'outfitWoman', bird: 'birdFull', none: 'none'};

export class AssignmentController {
  constructor({
    slots,
    peopleButtons,
    costumeButtons,
    outfitPicker,
    outfitSummary,
    outfitChoice,
    closeOutfitPickerOnSelect = () => true,
    detailButton,
    detailModeLabel,
    detailHint,
    assignmentLabel,
    resetButton,
    onChange = () => {}
  }) {
    this.slots = slots;
    this.peopleButtons = peopleButtons;
    this.costumeButtons = costumeButtons;
    this.outfitPicker = outfitPicker;
    this.outfitSummary = outfitSummary;
    this.outfitChoice = outfitChoice;
    this.closeOutfitPickerOnSelect = closeOutfitPickerOnSelect;
    this.detailButton = detailButton;
    this.detailModeLabel = detailModeLabel;
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
      if (this.closeOutfitPickerOnSelect()) this.outfitPicker.open = false;
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
    onLanguageChange(() => this.refresh());
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
      button.textContent = String(index + 1);
      button.setAttribute('aria-label', t(visible ? 'person' : 'personUndetected', {number: index + 1}));
    });
    this.costumeButtons.forEach(button => {
      button.disabled = !hasSelectedPerson;
      button.setAttribute('aria-disabled', String(!hasSelectedPerson));
      button.setAttribute('aria-pressed', String(button.dataset.costume === this.outfits[this.selectedPerson]));
    });
    this.assignmentLabel.textContent = hasSelectedPerson
      ? t('assignmentFor', {number: this.selectedPerson + 1})
      : t('noPerson');
    const chosenOutfit = t(outfitNameKeys[this.outfits[this.selectedPerson]]);
    this.outfitChoice.textContent = hasSelectedPerson ? t('outfitChoice', {outfit: chosenOutfit}) : '';
    this.outfitSummary.setAttribute('aria-label', hasSelectedPerson
      ? t('outfitFor', {number: this.selectedPerson + 1, outfit: chosenOutfit})
      : t('noPersonOutfit'));

    const canInspect = hasSelectedPerson && isRyuso(this.outfits[this.selectedPerson]);
    if (!canInspect) this.detailMode = false;
    this.detailButton.disabled = !canInspect;
    this.detailButton.setAttribute('aria-disabled', String(!canInspect));
    this.detailButton.setAttribute('aria-pressed', String(this.detailMode));
    this.detailModeLabel.textContent = t('detailMode');
    this.detailButton.setAttribute('aria-label', t(this.detailMode ? 'detailOn' : 'detailOff'));
    this.detailHint.hidden = !this.detailMode;
    if (!this.detailMode) return;
    if (this.handState === 'unavailable') {
      this.detailHint.textContent = t('detailUnavailable');
    } else if (this.handState !== 'ready') {
      this.detailHint.textContent = t('detailLoading');
    } else {
      this.detailHint.textContent = t('detailReady');
    }
  }
}
