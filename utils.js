/**
 * An utility module for encoding, decoding and timestamp generation.
 * @namespace SecureUtils
*/
const SecureUtils = (() => {
    const encode = (text) => {
        if (typeof text !== 'string') {
            console.error('Encode error: Input must be a string');
            return '';
        }
        try {
            return btoa(encodeURIComponent(text));
        } catch (error) {
            console.error('Encode error:', error.message);
            return '';
        }
    };

    const decode = (encoded) => {
        if (typeof encoded !== 'string') {
            console.error('Decode error: Input must be a string');
            return '';
        }
        try {
            return decodeURIComponent(atob(encoded));
        } catch (error) {
            console.error('Decode error:', error.message);
            return '';
        }
    };

    const nowISO = () => new Date().toISOString();

    return { encode, decode, nowISO };
})();

window.SecureUtils = SecureUtils;