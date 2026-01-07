/**
 * New Meditation Form View
 * Renders the form for starting a new meditation session
 */

import Store from '../Store';
import { createButton, clearContainer } from '../UIComponents';

interface NewMeditationFormCallbacks {
  onStart: (
    durationInSeconds: number,
    intervalsInMinutes: number[],
    presetId: string | null
  ) => void;
  onCancel: () => void;
}

export function renderNewMeditationForm(
  container: HTMLElement,
  callbacks: NewMeditationFormCallbacks
): void {
  clearContainer(container);

  // Create form title
  const title = document.createElement('h2');
  title.textContent = 'Start New Meditation';
  container.appendChild(title);

  // Create form
  const form = document.createElement('form');
  form.className = 'meditation-form';

  // Section 1: Manual duration and intervals
  const manualSection = document.createElement('div');
  manualSection.style.marginBottom = '24px';

  const manualTitle = document.createElement('h3');
  manualTitle.textContent = 'Select a duration and sound intervals';
  manualTitle.style.marginBottom = '12px';
  manualSection.appendChild(manualTitle);

  // Duration input
  const durationLabel = document.createElement('label');
  durationLabel.textContent = 'Duration (minutes):';
  durationLabel.style.display = 'block';
  durationLabel.style.marginBottom = '8px';
  const durationInput = document.createElement('input');
  durationInput.type = 'number';
  durationInput.min = '1';
  durationInput.value = '10';
  durationInput.style.width = '100%';
  durationInput.style.marginBottom = '12px';
  manualSection.appendChild(durationLabel);
  manualSection.appendChild(durationInput);

  // Intervals input
  const intervalsLabel = document.createElement('label');
  intervalsLabel.textContent =
    'Intervals (optional - minutes, comma-separated):';
  intervalsLabel.style.display = 'block';
  intervalsLabel.style.marginBottom = '8px';
  const intervalsInput = document.createElement('input');
  intervalsInput.type = 'text';
  intervalsInput.placeholder = 'e.g., 5,10,15';
  intervalsInput.style.width = '100%';
  manualSection.appendChild(intervalsLabel);
  manualSection.appendChild(intervalsInput);

  form.appendChild(manualSection);

  // Divider
  const divider = document.createElement('div');
  divider.textContent = '— or —';
  divider.style.textAlign = 'center';
  divider.style.margin = '20px 0';
  divider.style.color = '#666';
  form.appendChild(divider);

  // Section 2: Preset selector
  const presetSection = document.createElement('div');
  presetSection.style.marginBottom = '24px';

  const presetTitle = document.createElement('h3');
  presetTitle.textContent = 'Use a preset instead';
  presetTitle.style.marginBottom = '12px';
  presetSection.appendChild(presetTitle);

  const presetSelect = document.createElement('select');
  presetSelect.style.width = '100%';
  const noneOption = document.createElement('option');
  noneOption.value = '';
  noneOption.textContent = 'None';
  presetSelect.appendChild(noneOption);

  // Add presets from store
  Store.presets.forEach((preset) => {
    const option = document.createElement('option');
    option.value = preset.uri;

    // Format intervals for display
    const intervalsText =
      preset.soundIntervals && preset.soundIntervals.length > 0
        ? ` • Intervals: ${preset.soundIntervals
            .map((si) => Math.floor(si.time / 60))
            .join(',')}`
        : '';

    option.textContent = `${preset.name} (${Math.floor(
      preset.duration / 60
    )} min${intervalsText})`;
    presetSelect.appendChild(option);
  });

  // Handle preset selection
  presetSelect.addEventListener('change', () => {
    if (presetSelect.value) {
      const selectedPreset = Store.presets.find(
        (p) => p.uri === presetSelect.value
      );
      if (selectedPreset) {
        durationInput.value = String(
          Math.floor(selectedPreset.duration / 60)
        );
        if (
          selectedPreset.soundIntervals &&
          selectedPreset.soundIntervals.length > 0
        ) {
          intervalsInput.value = selectedPreset.soundIntervals
            .map((si) => Math.floor(si.time / 60))
            .join(',');
        } else {
          intervalsInput.value = '';
        }
      }
    }
  });

  presetSection.appendChild(presetSelect);
  form.appendChild(presetSection);

  // Button container
  const buttonContainer = document.createElement('div');
  buttonContainer.className = 'button-group';

  // Start button
  const startMeditationNowButton = createButton(
    'Start Meditation',
    'primary',
    async () => {
      const duration = parseInt(durationInput.value) * 60; // Convert to seconds

      // Parse intervals (comma-separated minutes)
      const intervals: number[] = [];
      if (intervalsInput.value.trim()) {
        const parsed = intervalsInput.value
          .split(',')
          .map((s) => parseInt(s.trim()))
          .filter((n) => !isNaN(n) && n > 0);
        intervals.push(...parsed);
      }

      callbacks.onStart(duration, intervals, presetSelect.value || null);
    }
  );

  // Cancel button
  const cancelButton = createButton('Cancel', 'secondary', () => {
    callbacks.onCancel();
  });

  buttonContainer.appendChild(startMeditationNowButton);
  buttonContainer.appendChild(cancelButton);
  form.appendChild(buttonContainer);

  container.appendChild(form);
}
