/**
 * Navigation manager for handling view transitions in the meditation app
 */

import Store from './Store';
import {
  createButton,
  formatSessionDate,
  clearContainer,
} from './UIComponents';
import {
  createMeditationSession,
  updateMeditationSession,
  createPreset,
  getPresets,
  getMeditationSessions,
} from './API';
import { playGong } from './Audio';

type ViewName =
  | 'mainMenu'
  | 'newMeditation'
  | 'presets'
  | 'sessions'
  | 'meditating'
  | 'completedMeditation';

export class NavigationManager {
  private currentView: ViewName = 'mainMenu';

  constructor() {
    // Initialize view event listeners if needed
  }

  /**
   * Returns the currently active view
   */
  getCurrentView(): ViewName {
    return this.currentView;
  }

  /**
   * Helper to toggle view visibility
   */
  private activateView(viewId: string): void {
    // Hide all views
    const views = [
      'mainMenuView',
      'newMeditationFormView',
      'presetsView',
      'sessionsView',
      'meditatingView',
      'completedMeditationView',
    ];
    views.forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.classList.remove('active');
    });

    if (viewId !== 'mainMenuView') {
      let appStatusEl = document.getElementById('appStatus');
      if (appStatusEl) appStatusEl.remove();
    }

    // Show the requested view
    const targetView = document.getElementById(viewId);
    if (targetView) targetView.classList.add('active');
  }

  /**
   * Show the main menu with three action buttons
   */
  showMainMenu(): void {
    this.currentView = 'mainMenu';
    this.activateView('mainMenuView');
  }

  /**
   * Show the new meditation session form
   */
  showNewMeditationForm(): void {
    this.currentView = 'newMeditation';
    this.activateView('newMeditationFormView');

    const container = document.getElementById('newMeditationFormView');
    if (!container) return;

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

        this.showMeditatingView(
          duration,
          intervals,
          presetSelect.value || null
        );
      }
    );

    // Cancel button
    const cancelButton = createButton('Cancel', 'secondary', () => {
      this.showMainMenu();
    });

    buttonContainer.appendChild(startMeditationNowButton);
    buttonContainer.appendChild(cancelButton);
    form.appendChild(buttonContainer);

    container.appendChild(form);
  }

  /**
   * Show the meditating view with countdown timer
   */
  showMeditatingView(
    durationInSeconds: number,
    intervalsInMinutes: number[] = [],
    presetId: string | null = null
  ): void {
    this.currentView = 'meditating';
    this.activateView('meditatingView');

    const container = document.getElementById('meditatingView');
    if (!container) return;

    clearContainer(container);

    // Create title
    const title = document.createElement('h2');
    title.textContent = 'Meditating...';
    container.appendChild(title);

    // Create countdown display
    const countdown = document.createElement('div');
    countdown.className = 'countdown-timer';
    countdown.style.fontSize = '48px';
    countdown.style.fontWeight = 'bold';
    countdown.style.margin = '40px 0';
    countdown.style.textAlign = 'center';

    // Function to format seconds as MM:SS
    const formatTime = (totalSeconds: number): string => {
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return `${minutes.toString().padStart(2, '0')}:${seconds
        .toString()
        .padStart(2, '0')}`;
    };

    // Initialize countdown display
    let remainingTime = durationInSeconds;
    countdown.textContent = formatTime(remainingTime);
    container.appendChild(countdown);

    // Play gong sound to start meditation
    playGong();

    // Convert interval minutes to seconds and track which have been played
    const intervalSeconds = intervalsInMinutes.map((min) => min * 60);
    const playedIntervals = new Set<number>();

    // Start the countdown
    const intervalId = setInterval(() => {
      remainingTime--;
      countdown.textContent = formatTime(remainingTime);

      // Check if we've reached an interval time
      const elapsedTime = durationInSeconds - remainingTime;
      for (const intervalTime of intervalSeconds) {
        if (elapsedTime >= intervalTime && !playedIntervals.has(intervalTime)) {
          playGong();
          playedIntervals.add(intervalTime);
        }
      }

      if (remainingTime <= 0) {
        clearInterval(intervalId);
        // Play gong sound on completion
        playGong();
        // Meditation complete - transition to completion view with full duration
        this.showCompletedMeditationView(
          durationInSeconds,
          intervalsInMinutes,
          presetId
        );
      }
    }, 1000);

    // Add a stop button
    const stopButton = createButton('Stop Meditation', 'secondary', () => {
      clearInterval(intervalId);
      // Play gong sound on stop
      playGong();
      // Calculate elapsed time (what was completed before stopping)
      const elapsedTime = durationInSeconds - remainingTime;
      this.showCompletedMeditationView(
        elapsedTime,
        intervalsInMinutes,
        presetId
      );
    });
    container.appendChild(stopButton);
  }

  /**
   * Show the completed meditation view
   */
  async showCompletedMeditationView(
    durationInSeconds: number,
    intervalsInMinutes: number[] = [],
    presetId: string | null = null
  ): Promise<void> {
    this.currentView = 'completedMeditation';
    this.activateView('completedMeditationView');

    const container = document.getElementById('completedMeditationView');
    if (!container) return;

    clearContainer(container);

    // Create the meditation session
    let sessionUri: string = '';
    try {
      const response = await createMeditationSession(
        durationInSeconds,
        presetId
      );
      sessionUri = response.uri;
    } catch (error) {
      console.error('Failed to create meditation session:', error);
    }

    // Create title
    const title = document.createElement('h2');
    title.textContent = 'Meditation Complete!';
    container.appendChild(title);

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
            Store.presets = presetsResponse.presets;
          } catch (error) {
            console.error('Failed to save preset:', error);
            alert('Failed to save preset. Please try again.');
          }
        }
      }
    );

    // Return to main menu button
    const returnButton = createButton('Return to Main Menu', 'primary', () => {
      this.showMainMenu();
    });

    buttonContainer.appendChild(saveNotesButton);
    buttonContainer.appendChild(saveAsPresetButton);
    buttonContainer.appendChild(returnButton);
    container.appendChild(buttonContainer);
  }

  /**
   * Show the list of available presets
   */
  async showPresetsList(): Promise<void> {
    this.currentView = 'presets';
    this.activateView('presetsView');

    const container = document.getElementById('presetsView');
    if (!container) return;

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
      this.showMainMenu();
    });
    container.appendChild(backButton);
  }

  /**
   * Show the list of past meditation sessions (10 most recent)
   */
  showPastSessions(): void {
    this.currentView = 'sessions';
    this.activateView('sessionsView');

    const container = document.getElementById('sessionsView');
    if (!container) return;

    clearContainer(container);

    // Create title
    const title = document.createElement('h2');
    title.textContent = 'Past Meditation Sessions';
    container.appendChild(title);

    // Check if we have sessions
    if (Store.meditationSessions.length === 0) {
      const noData = document.createElement('p');
      noData.className = 'no-data';
      noData.textContent = 'No meditation sessions yet. Start your first one!';
      container.appendChild(noData);
    } else {
      // Get the 10 most recent sessions
      const recentSessions = Store.meditationSessions.slice(0, 10);

      // Create session list
      const sessionList = document.createElement('div');
      sessionList.className = 'session-list';

      recentSessions.forEach((session) => {
        const sessionItem = document.createElement('div');
        sessionItem.className = 'session-item';

        const formattedDate = formatSessionDate(session.createdAt);
        const durationMinutes = Math.round(session.duration / 60);

        sessionItem.textContent = `${formattedDate} - ${durationMinutes} minutes`;

        sessionList.appendChild(sessionItem);
      });

      container.appendChild(sessionList);
    }

    // Back button
    const backButton = createButton('Back to Menu', 'secondary', () => {
      this.showMainMenu();
    });
    container.appendChild(backButton);
  }
}
