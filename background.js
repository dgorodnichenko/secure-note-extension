/**
 * Handles incoming messages from content scripts or other parts of the extension.
 * @param {Object} message - The message object received from the sender.
 * @param {Object} sender - The sender of the message.
 * @param {Function} sendResponse - Function to send a response back to the sender.
 * @returns {boolean} True to indicate async response
*/
const handleMessage = (message, sender, sendResponse) => {
    if (!message || !message.action) {
        console.warn('Invalid message received:', message);
        return false;
    }

    switch (message.action) {
        case 'open_popup_for_domain':
            handleOpenPopupAction(message.domain)
                .then(() => sendResponse({ success: true }))
                .catch(error => sendResponse({ success: false, error }));
            break;
        default:
            console.warn('Unknown action:', message.action);
    }

    return true;
};

/**
 * Handles the 'open_popup_for_domain' action
 * @param {string} domain - The domain to be saved for the popup.
*/
const handleOpenPopupAction = async (domain = '') => {
    try {
        const result = await saveDomainToStorage(domain);
        return openPopup(result);
    } catch (error) {
        return console.error('Failed to handle open popup action:', error);
    }
};

/**
 * Saves the domain to chrome.storage.local for use by the popup.
 * @param {string} domain - The domain to save.
 * @returns {Promise<void>} Resolves when the domain is saved.
*/
const saveDomainToStorage = (domain) => {
    return new Promise((resolve, reject) => {
        chrome.storage.local.set({ secureNote_lastDomain: domain }, () => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve();
            }
        });
    });
};

/**
 * @returns {Promise<void>} Resolves when the popup is opened, or rejects on error.
*/
const openPopup = () => {
    return new Promise((resolve, reject) => {
        chrome.action.openPopup().then(resolve).catch(error => {
            console.warn('openPopup failed:', error);
            reject(error);
        });
    });
};

chrome.runtime.onMessage.addListener(handleMessage);