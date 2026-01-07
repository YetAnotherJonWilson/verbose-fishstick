/**
 * Completed Meditation View
 * Renders the post-meditation screen with notes and preset saving options
 */

import { storeManager } from '../Store';
import { createButton, clearContainer } from '../UIComponents';
import {
  createMeditationSession,
  updateMeditationSession,
  createPreset,
  getPresets,
} from '../API';

interface CompletedMeditationViewParams {
  durationInSeconds: number;
  intervalsInMinutes: number[];
  presetId: string | null;
}

interface CompletedMeditationViewCallbacks {
  onReturn: () => void;
}

export async function renderCompletedMeditationView(
  container: HTMLElement,
  params: CompletedMeditationViewParams,
  callbacks: CompletedMeditationViewCallbacks
): Promise<void> {
  const { durationInSeconds, intervalsInMinutes, presetId } = params;

  clearContainer(container);

  // Create the meditation session
  let sessionUri: string = '';
  let sessionCreationFailed = false;
  try {
    const response = await createMeditationSession(
      durationInSeconds,
      presetId
    );
    sessionUri = response.uri;
  } catch (error) {
    console.error('Failed to create meditation session:', error);
    sessionCreationFailed = true;
  }

  // Create title
  const title = document.createElement('h2');
  title.textContent = 'Meditation Complete!';
  container.appendChild(title);

  // Show error if session creation failed
  if (sessionCreationFailed) {
    const errorMsg = document.createElement('p');
    errorMsg.textContent = 'Warning: Failed to save this session. You can still save it as a preset.';
    errorMsg.style.color = '#c53030';
    errorMsg.style.marginTop = '12px';
    container.appendChild(errorMsg);
  }

  // Notes label (on separate line)
  const notesLabel = document.createElement('label');
  notesLabel.textContent = 'Notes (optional):';
  notesLabel.style.display = 'block';
  notesLabel.style.marginTop = '20px';
  container.appendChild(notesLabel);

  // Notes textarea
  const notesTextarea = document.createElement('textarea');
  notesTextarea.rows = 5;
  notesTextarea.placeholder = 'How was your meditation session?';
  notesTextarea.style.width = '100%';
  notesTextarea.style.marginTop = '8px';
  container.appendChild(notesTextarea);

  // Button container
  const buttonContainer = document.createElement('div');
  buttonContainer.className = 'button-group';
  buttonContainer.style.marginTop = '20px';

  // Save Notes button
  const saveNotesButton = createButton(
    'Save Notes',
    'secondary',
    async () => {
      const notes = notesTextarea.value.trim();
      if (notes && sessionUri) {
        try {
          await updateMeditationSession(
            sessionUri,
            durationInSeconds,
            presetId,
            notes
          );
          // Provide feedback
          saveNotesButton.textContent = 'Notes Saved!';
          saveNotesButton.disabled = true;
        } catch (error) {
          console.error('Failed to save notes:', error);
          alert('Failed to save notes. Please try again.');
        }
      }
    }
  );

  // Disable Save Notes if session creation failed
  if (sessionCreationFailed) {
    saveNotesButton.disabled = true;
    saveNotesButton.title = 'Cannot save notes - session was not created';
  }

  // Save as Preset button
  const saveAsPresetButton = createButton(
    'Save as Preset',
    'secondary',
    async () => {
      const presetName = prompt('Enter a name for this preset:');
      if (presetName && presetName.trim()) {
        try {
          // Convert intervals to soundIntervals format
          const soundIntervals = intervalsInMinutes.map((min) => ({
            time: min * 60,
            soundType: 'gong',
          }));

          await createPreset(
            presetName.trim(),
            durationInSeconds,
            soundIntervals
          );

          // Provide feedback
          saveAsPresetButton.textContent = 'Preset Saved!';
          saveAsPresetButton.disabled = true;

          // Refresh presets in store
          const presetsResponse = await getPresets();
          storeManager.setPresets(presetsResponse.presets);
        } catch (error) {
          console.error('Failed to save preset:', error);
          alert('Failed to save preset. Please try again.');
        }
      }
    }
  );

  // Return to main menu button
  const returnButton = createButton('Return to Main Menu', 'primary', () => {
    callbacks.onReturn();
  });

  buttonContainer.appendChild(saveNotesButton);
  buttonContainer.appendChild(saveAsPresetButton);
  buttonContainer.appendChild(returnButton);
  container.appendChild(buttonContainer);
}
