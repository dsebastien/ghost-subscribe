/**
 * Ghost Newsletter Subscription with Integrity Token
 * Compatible with Ghost 5.91.0+ and Ghost 6+
 *
 * This script implements the complete Ghost newsletter subscription flow:
 * 1. Fetches an integrity token (required for Ghost 6+)
 * 2. Sends the subscription request with the integrity token
 * 3. Manages subscription state with sessionStorage and localStorage
 */

// Storage keys
const NEWSLETTER_SESSION_KEY = 'newsletter_subscribed_session';  // sessionStorage - current session
const NEWSLETTER_NEVER_SHOW_KEY = 'newsletter_never_show';       // localStorage - permanent dismissal

// Message display duration in milliseconds
const MESSAGE_DISPLAY_DURATION = 5000;

/**
 * Check if user has subscribed during this browser session
 * @returns {boolean}
 */
function hasSubscribedThisSession() {
    return sessionStorage.getItem(NEWSLETTER_SESSION_KEY) === 'true';
}

/**
 * Mark user as subscribed for this session
 */
function markSubscribedThisSession() {
    sessionStorage.setItem(NEWSLETTER_SESSION_KEY, 'true');
    console.log('[Ghost Subscribe] Subscription stored in sessionStorage');
}

/**
 * Check if user has permanently dismissed the newsletter form
 * @returns {boolean}
 */
function hasUserDismissedPermanently() {
    return localStorage.getItem(NEWSLETTER_NEVER_SHOW_KEY) === 'true';
}

/**
 * Permanently dismiss the newsletter form
 */
function dismissNewsletter() {
    localStorage.setItem(NEWSLETTER_NEVER_SHOW_KEY, 'true');
    console.log('[Ghost Subscribe] Newsletter permanently dismissed');

    const wrapperElement = document.getElementById('subscription-form-wrapper');
    if (wrapperElement) {
        wrapperElement.classList.add('hidden');
    }
}

/**
 * Clear permanent dismissal (for testing)
 */
function clearDismissal() {
    localStorage.removeItem(NEWSLETTER_NEVER_SHOW_KEY);
    console.log('[Ghost Subscribe] Dismissal cleared from localStorage');
}

/**
 * Clear session subscription status (for testing)
 */
function clearSessionSubscription() {
    sessionStorage.removeItem(NEWSLETTER_SESSION_KEY);
    console.log('[Ghost Subscribe] Session subscription cleared');
}

/**
 * Determine if the newsletter form should be shown
 * @returns {boolean}
 */
function shouldShowForm() {
    return !hasSubscribedThisSession() && !hasUserDismissedPermanently();
}

/**
 * Hide the entire newsletter wrapper
 */
function hideNewsletterWrapper() {
    const wrapperElement = document.getElementById('subscription-form-wrapper');
    if (wrapperElement) {
        wrapperElement.classList.add('hidden');
    }
}

/**
 * Show a message temporarily, then execute a callback
 * @param {HTMLElement} messageElement - Element to show
 * @param {Function} callback - Function to call after duration
 */
function showTemporaryMessage(messageElement, callback) {
    if (messageElement) {
        messageElement.classList.remove('hidden');
    }

    setTimeout(() => {
        if (messageElement) {
            messageElement.classList.add('hidden');
        }
        if (callback) {
            callback();
        }
    }, MESSAGE_DISPLAY_DURATION);
}

/**
 * Fetch integrity token from Ghost
 * Required for Ghost 5.91.0+ and Ghost 6+
 *
 * @param {string} ghostSiteBaseUrl - Base URL of Ghost site (e.g., 'https://www.dsebastien.net')
 * @returns {Promise<string>} Integrity token
 */
async function getIntegrityToken(ghostSiteBaseUrl) {
    const endpoint = `${ghostSiteBaseUrl}/members/api/integrity-token/`;

    console.log('[Ghost Subscribe] Fetching integrity token:', endpoint);

    const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
            'app-pragma': 'no-cache',
            'x-ghost-version': '6.0'
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch integrity token: ${response.status}`);
    }

    const token = await response.text();
    console.log('[Ghost Subscribe] Integrity token received:', token.substring(0, 20) + '...');

    return token;
}

/**
 * Subscribe email address to Ghost newsletter
 *
 * @param {string} email - Email address to subscribe
 * @param {string} ghostSiteBaseUrl - Base URL of Ghost site (e.g., 'https://www.dsebastien.net')
 * @param {Object} options - Optional configuration
 * @param {string} options.name - Subscriber name (optional)
 * @param {string[]} options.newsletters - Array of newsletter IDs to subscribe to (optional, empty = all)
 * @returns {Promise<{success: boolean, message?: string, error?: string}>}
 */
async function subscribeToGhost(email, ghostSiteBaseUrl, options = {}) {
    const wrapperElement = document.getElementById('subscription-form-wrapper');
    const emailSentElement = document.getElementById('subscription-mail-sent');
    const subscriptionFormElement = document.getElementById('subscription-form');
    const errorElement = document.getElementById('subscription-error');
    const dismissElement = document.getElementById('dismiss-newsletter');

    // Validate email
    if (!email || !email.includes('@')) {
        console.error('[Ghost Subscribe] Invalid email address');
        if (errorElement) {
            const errorParagraph = errorElement.querySelector('p');
            if (errorParagraph) {
                errorParagraph.textContent = 'Please enter a valid email address';
            }
            showTemporaryMessage(errorElement, null);
        }
        return { success: false, error: 'Invalid email address' };
    }

    try {
        console.log('[Ghost Subscribe] Starting subscription for:', email);

        // Step 1: Get integrity token
        const integrityToken = await getIntegrityToken(ghostSiteBaseUrl);

        // Step 2: Send magic link with integrity token
        const endpoint = `${ghostSiteBaseUrl}/members/api/send-magic-link`;

        const payload = {
            email,
            emailType: 'subscribe',
            integrityToken
        };

        // Add optional fields
        if (options.name) {
            payload.name = options.name;
        }

        if (options.newsletters && options.newsletters.length > 0) {
            payload.newsletters = options.newsletters.map(id => ({ id }));
        }

        console.log('[Ghost Subscribe] Sending subscription request:', { email, ...options });

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8'
            },
            body: JSON.stringify(payload)
        });

        console.log('[Ghost Subscribe] Response status:', response.status);

        // Ghost returns 201 for successful subscription
        if (response.status === 201) {
            console.log('[Ghost Subscribe] Success - magic link sent');

            // Mark as subscribed for this session
            markSubscribedThisSession();

            // Hide form and dismiss link
            if (subscriptionFormElement) {
                subscriptionFormElement.classList.add('hidden');
            }
            if (dismissElement) {
                dismissElement.classList.add('hidden');
            }
            if (errorElement) {
                errorElement.classList.add('hidden');
            }

            // Show success message temporarily, then hide the entire wrapper
            showTemporaryMessage(emailSentElement, () => {
                hideNewsletterWrapper();
            });

            return {
                success: true,
                message: 'Success! Please check your email to confirm your subscription.'
            };
        }

        // Handle error responses
        const errorData = await response.json().catch(() => ({}));
        console.error('[Ghost Subscribe] Error response:', errorData);

        const errorMessage = errorData.errors?.[0]?.message || 'Subscription failed. Please try again.';

        if (errorElement) {
            const errorParagraph = errorElement.querySelector('p');
            if (errorParagraph) {
                errorParagraph.textContent = errorMessage;
            }

            // Hide form temporarily while showing error
            if (subscriptionFormElement) {
                subscriptionFormElement.classList.add('hidden');
            }
            if (dismissElement) {
                dismissElement.classList.add('hidden');
            }

            // Show error message temporarily, then show form again
            showTemporaryMessage(errorElement, () => {
                if (subscriptionFormElement) {
                    subscriptionFormElement.classList.remove('hidden');
                }
                if (dismissElement) {
                    dismissElement.classList.remove('hidden');
                }
            });
        }

        return { success: false, error: errorMessage };

    } catch (error) {
        console.error('[Ghost Subscribe] Error:', error);

        const errorMessage = 'Network error. Please check your connection and try again.';

        if (errorElement) {
            const errorParagraph = errorElement.querySelector('p');
            if (errorParagraph) {
                errorParagraph.textContent = errorMessage;
            }

            // Hide form temporarily while showing error
            if (subscriptionFormElement) {
                subscriptionFormElement.classList.add('hidden');
            }
            if (dismissElement) {
                dismissElement.classList.add('hidden');
            }

            // Show error message temporarily, then show form again
            showTemporaryMessage(errorElement, () => {
                if (subscriptionFormElement) {
                    subscriptionFormElement.classList.remove('hidden');
                }
                if (dismissElement) {
                    dismissElement.classList.remove('hidden');
                }
            });
        }

        return { success: false, error: errorMessage };
    }
}

/**
 * Initialize newsletter form
 * Hides form if user has already subscribed this session or dismissed permanently
 */
function initNewsletterForm() {
    if (!shouldShowForm()) {
        console.log('[Ghost Subscribe] Form hidden - subscribed this session or permanently dismissed');
        hideNewsletterWrapper();
    } else {
        console.log('[Ghost Subscribe] Showing newsletter form');
    }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNewsletterForm);
} else {
    initNewsletterForm();
}
