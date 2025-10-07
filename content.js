/**
 * @returns {boolean} True if the script is already injected, false otherwise.
*/
const isAlreadyInjected = () => {
    if (window.__secureNoteInjected) return true;
    window.__secureNoteInjected = true;
    return false;
};

/**
 * Creates a button for adding notes on 3rd party web pages
 * @returns {HTMLElement} The created button DOM element.
 */
const createPopupButton = () => {
    const btn = document.createElement('div');
    btn.className = 'secure-note-floating-btn';
    btn.title = 'Додати нотатку (Secure Note Taker)';
    btn.innerHTML = '<span class="plus">+</span>';
    btn.addEventListener('click', onPopupButtonClick);
    return btn;
};

/**
 * Handles the click event on the popup button.
 * @param {Event} event - The click event object.
 * @returns {Promise<void>} A promise that resolves when the popup is opened.
 */
const onPopupButtonClick = async (event) => {
    event.stopPropagation();
    event.preventDefault();
    
    const domain = getCurrentDomain();
    await openPopupForDomain(domain);
};

/**
 * Retrieves the hostname of the current page's URL.
 * @returns {string} The hostname of the current page or the full URL if parsing fails.
 */
const getCurrentDomain = () => {
    const url = window.location.href;
    try {
        return new URL(url).hostname;
    } catch (error) {
        console.error('Failed to parse URL:', error);
        return url;
    }
};

/**
 * Sends a message to the Chrome extension background script to open a popup for the specified domain.
 * @param {string} domain - The domain for which to open the popup.
 * @returns {Promise<void>} A promise that resolves when the message is sent or rejects on error.
 */
const openPopupForDomain = async (domain) => {
    try {
        await chrome.runtime.sendMessage({ 
            action: 'open_popup_for_domain', 
            domain 
        });
    } catch (error) {
        console.error('Failed to send message to background:', error);
    }
};

/**
 * Initializes the button for adding notes on 3rd party websites
 */
const initPopupButton = () => {
    if (isAlreadyInjected()) return;
    const btn = createPopupButton();
    document.body.appendChild(btn);
};

initPopupButton();