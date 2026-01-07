/**
 * Presets List View
 * Renders the list of available meditation presets
 */

import Store from '../Store';
import { createButton, clearContainer } from '../UIComponents';

interface PresetsListViewCallbacks {
  onBack: () => void;
}

export function renderPresetsListView(
  container: HTMLElement,
  callbacks: PresetsListViewCallbacks
): void {
  clearContainer(container);

  // Create title
  const title = document.createElement('h2');
  title.textContent = 'Meditation Presets';
  container.appendChild(title);

  // Check if we have presets
  if (Store.presets.length === 0) {
    const noData = document.createElement('p');
    noData.className = 'no-data';
    noData.textContent = 'No presets found. Create one to get started!';
    container.appendChild(noData);
  } else {
    // Create preset list
    const presetList = document.createElement('div');
    presetList.className = 'preset-list';

    Store.presets.forEach((preset) => {
      const presetItem = document.createElement('div');
      presetItem.className = 'preset-item';

      const presetName = document.createElement('strong');
      presetName.textContent = preset.name;

      const presetDuration = document.createElement('span');
      presetDuration.textContent = ` - ${preset.duration} seconds`;

      presetItem.appendChild(presetName);
      presetItem.appendChild(presetDuration);
      presetList.appendChild(presetItem);
    });

    container.appendChild(presetList);
  }

  // Back button
  const backButton = createButton('Back to Menu', 'secondary', () => {
    callbacks.onBack();
  });
  container.appendChild(backButton);
}
