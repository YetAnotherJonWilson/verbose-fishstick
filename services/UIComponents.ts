/**
 * UI Component helpers for creating consistent UI elements
 */

/**
 * Creates a button element with consistent styling
 * @param label - Button text
 * @param variant - Button style variant ('primary' or 'secondary')
 * @param onClick - Click handler function
 * @returns HTMLButtonElement
 */
export function createButton(
  label: string,
  variant: 'primary' | 'secondary',
  onClick: () => void
): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button'; // Prevent form submission
  button.textContent = label;
  button.className = variant === 'secondary' ? 'secondary' : '';
  button.addEventListener('click', onClick);
  return button;
}

/**
 * Formats an ISO date string to "Day of Week, Month Day" format
 * @param isoString - ISO 8601 date string
 * @returns Formatted date string (e.g., "Monday, January 2")
 */
export function formatSessionDate(isoString: string): string {
  const date = new Date(isoString);
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  };
  return date.toLocaleDateString('en-US', options);
}

/**
 * Clears all child elements from a container
 * @param container - HTML element to clear
 */
export function clearContainer(container: HTMLElement): void {
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
}
