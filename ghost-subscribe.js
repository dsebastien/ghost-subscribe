/**
 * Ghost Newsletter Subscription with Integrity Token
 * Compatible with Ghost 5.91.0+ and Ghost 6+
 *
 * This script implements the complete Ghost newsletter subscription flow:
 * 1. Fetches an integrity token (required for Ghost 6+)
 * 2. Sends the subscription request with the integrity token
 * 3. Stores subscription status in localStorage to prevent re-display
 */

const NEWSLETTER_STORAGE_KEY = 'newsletter_subscribed';

/**
 * Check if user has already subscribed (from localStorage)
 * @returns {boolean} True if user has subscribed
 */
function hasUserSubscribed() {
    return localStorage.getItem(NEWSLETTER_STORAGE_KEY) === 'true';
}

/**
 * Mark user as subscribed in localStorage
 */
function markUserAsSubscribed() {
    localStorage.setItem(NEWSLETTER_STORAGE_KEY, 'true');
    console.log('[Ghost Subscribe] Subscription stored in localStorage');
}

/**
 * Clear subscription status from localStorage (for testing)
 */
function clearSubscriptionStatus() {
    localStorage.removeItem(NEWSLETTER_STORAGE_KEY);
    console.log('[Ghost Subscribe] Subscription cleared from localStorage');
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
    const emailSentElement = document.getElementById('subscription-mail-sent');
    const subscriptionFormElement = document.getElementById('subscription-form');
    const errorElement = document.getElementById('subscription-error');

    // Validate email
    if (!email || !email.includes('@')) {
        console.error('[Ghost Subscribe] Invalid email address');
        if (errorElement) {
            errorElement.textContent = 'Please enter a valid email address';
            errorElement.classList.remove('hidden');
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

            // Store subscription in localStorage
            markUserAsSubscribed();

            // Show success message
            if (emailSentElement && subscriptionFormElement) {
                subscriptionFormElement.classList.add('hidden');
                emailSentElement.classList.remove('hidden');
            }

            if (errorElement) {
                errorElement.classList.add('hidden');
            }

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
            errorElement.textContent = errorMessage;
            errorElement.classList.remove('hidden');
        }

        return { success: false, error: errorMessage };

    } catch (error) {
        console.error('[Ghost Subscribe] Error:', error);

        const errorMessage = 'Network error. Please check your connection and try again.';

        if (errorElement) {
            errorElement.textContent = errorMessage;
            errorElement.classList.remove('hidden');
        }

        return { success: false, error: errorMessage };
    }
}

/**
 * Initialize newsletter form
 * Hides form if user has already subscribed
 */
function initNewsletterForm() {
    const subscriptionFormElement = document.getElementById('subscription-form');
    const alreadySubscribedElement = document.getElementById('already-subscribed');

    if (hasUserSubscribed()) {
        console.log('[Ghost Subscribe] User has already subscribed (from localStorage)');

        if (subscriptionFormElement) {
            subscriptionFormElement.classList.add('hidden');
        }

        if (alreadySubscribedElement) {
            alreadySubscribedElement.classList.remove('hidden');
        }
    }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNewsletterForm);
} else {
    initNewsletterForm();
}
