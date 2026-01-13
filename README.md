# Ghost Newsletter Subscribe

A simple, production-ready JavaScript implementation for subscribing users to a Ghost 6+ newsletter with integrity token authentication and localStorage persistence.

## Features

✅ **Ghost 6+ Compatible** - Uses integrity token authentication (required for Ghost 5.91.0+)
✅ **localStorage Persistence** - Remembers subscription status across sessions
✅ **Auto-hide Form** - Hides form after successful subscription
✅ **Error Handling** - User-friendly error messages
✅ **No Dependencies** - Pure JavaScript, no frameworks required
✅ **TypeScript Version** - Available in the store-website implementation
✅ **Comprehensive Logging** - Console logging for debugging

## Quick Start

### 1. Include the Script

```html
<script src="ghost-subscribe.js"></script>
```

### 2. Create Your HTML

```html
<!-- Newsletter Form -->
<form id="subscription-form" onsubmit="event.preventDefault(); subscribeToGhost(document.getElementById('email').value, 'https://your-ghost-site.com');">
    <input type="email" id="email" placeholder="Your email" required>
    <button type="submit">Subscribe</button>
</form>

<!-- Error Message (optional) -->
<div id="subscription-error" class="hidden"></div>

<!-- Success Message -->
<div id="subscription-mail-sent" class="invisible">
    ✓ Success! Check your email to confirm.
</div>

<!-- Already Subscribed Message (optional) -->
<div id="already-subscribed" class="hidden">
    ✓ You're already subscribed!
</div>
```

### 3. Replace Ghost Site URL

Update `'https://your-ghost-site.com'` with your actual Ghost site URL.

## How It Works

### Two-Step Process

1. **Fetch Integrity Token**
   ```javascript
   GET https://your-ghost-site.com/members/api/integrity-token/
   ```

2. **Send Subscription Request**
   ```javascript
   POST https://your-ghost-site.com/members/api/send-magic-link
   {
       "email": "user@example.com",
       "emailType": "subscribe",
       "integrityToken": "..."
   }
   ```

### localStorage Persistence

#### How Subscription Status is Stored

When a user successfully subscribes, the script stores `newsletter_subscribed: 'true'` in localStorage:

```javascript
localStorage.setItem('newsletter_subscribed', 'true');
```

#### How Subscription Status is Checked

On page load, the script checks if the user has already subscribed:

```javascript
function hasUserSubscribed() {
    return localStorage.getItem('newsletter_subscribed') === 'true';
}
```

If `true`, the form is automatically hidden and the "Already Subscribed" message is shown.

#### Clearing Subscription Status (for Testing)

```javascript
// Method 1: Use the helper function
clearSubscriptionStatus();

// Method 2: Manual removal
localStorage.removeItem('newsletter_subscribed');

// Method 3: Clear all localStorage
localStorage.clear();
```

#### localStorage Persistence Benefits

- **No Re-subscriptions**: Users won't see the form again after subscribing
- **Cross-session**: Persists across browser sessions
- **Cross-page**: Works across your entire domain
- **No Server Required**: Client-side only, no backend needed
- **Privacy-friendly**: Stored locally, not sent to servers

#### localStorage Limitations

- **Per-domain**: Only works on the same domain where it was set
- **Per-browser**: Not synced across different browsers
- **Can be Cleared**: Users can clear their browser data
- **~5-10MB Limit**: Sufficient for this use case

## API Reference

### `subscribeToGhost(email, ghostSiteBaseUrl, options)`

Subscribe an email address to Ghost newsletter.

**Parameters:**
- `email` (string, required): Email address to subscribe
- `ghostSiteBaseUrl` (string, required): Base URL of your Ghost site (e.g., `'https://www.dsebastien.net'`)
- `options` (object, optional): Configuration options
  - `name` (string): Subscriber name
  - `newsletters` (array): Array of newsletter IDs to subscribe to (empty = all newsletters)

**Returns:** `Promise<{success: boolean, message?: string, error?: string}>`

**Example:**
```javascript
// Basic usage
await subscribeToGhost('user@example.com', 'https://your-ghost-site.com');

// With name
await subscribeToGhost(
    'user@example.com',
    'https://your-ghost-site.com',
    { name: 'John Doe' }
);

// Subscribe to specific newsletters
await subscribeToGhost(
    'user@example.com',
    'https://your-ghost-site.com',
    { newsletters: ['newsletter-id-1', 'newsletter-id-2'] }
);
```

### `hasUserSubscribed()`

Check if user has already subscribed (from localStorage).

**Returns:** `boolean`

**Example:**
```javascript
if (hasUserSubscribed()) {
    console.log('User already subscribed!');
    // Hide form, show thank you message
}
```

### `markUserAsSubscribed()`

Mark user as subscribed in localStorage.

**Example:**
```javascript
markUserAsSubscribed();
// Form will be hidden on next page load
```

### `clearSubscriptionStatus()`

Clear subscription status from localStorage (useful for testing).

**Example:**
```javascript
clearSubscriptionStatus();
location.reload(); // Show form again
```

### `getIntegrityToken(ghostSiteBaseUrl)`

Fetch integrity token from Ghost (internal function).

**Parameters:**
- `ghostSiteBaseUrl` (string): Base URL of your Ghost site

**Returns:** `Promise<string>`

## Console Logging

The script provides detailed console logging for debugging:

```
[Ghost Subscribe] Starting subscription for: user@example.com
[Ghost Subscribe] Fetching integrity token: https://...
[Ghost Subscribe] Integrity token received: 1768286695362...
[Ghost Subscribe] Sending subscription request: {...}
[Ghost Subscribe] Response status: 201
[Ghost Subscribe] Success - magic link sent
[Ghost Subscribe] Subscription stored in localStorage
```

## Required HTML Elements

The script expects these elements (IDs are configurable):

| Element ID | Purpose | Required |
|------------|---------|----------|
| `subscription-form` | Newsletter form | ✅ Yes |
| `subscription-mail-sent` | Success message | ✅ Yes |
| `subscription-error` | Error message | ⚠️ Recommended |
| `already-subscribed` | Already subscribed message | ⚠️ Recommended |

## Error Handling

The script handles:
- Invalid email addresses
- Network errors
- Ghost API errors (e.g., "Member already exists")
- Integrity token fetch failures

Errors are displayed in the `#subscription-error` element if present.

## Ghost Version Compatibility

| Ghost Version | Compatible | Notes |
|---------------|------------|-------|
| 6.0+ | ✅ Yes | Full support with integrity token |
| 5.91.0 - 5.x | ✅ Yes | Integrity token required |
| < 5.91.0 | ❌ No | Missing integrity token requirement |

## TypeScript Version

A TypeScript implementation is available in the [store-website](../store-website/src/lib/ghost-api.ts) project:

```typescript
import { subscribeToNewsletter } from '@/lib/ghost-api';

const result = await subscribeToNewsletter('https://your-ghost-site.com', {
    email: 'user@example.com',
    newsletters: [] // optional
});

if (result.success) {
    console.log(result.message);
} else {
    console.error(result.error);
}
```

## Production Checklist

- [ ] Replace Ghost site URL with your actual URL
- [ ] Remove debug tools from HTML
- [ ] Test subscription flow end-to-end
- [ ] Test localStorage persistence (subscribe → reload → verify form hidden)
- [ ] Test error handling (invalid email, network issues)
- [ ] Verify console logging is acceptable for production
- [ ] Test on mobile devices
- [ ] Test across different browsers

## Integration Examples

### React Component

```tsx
import { subscribeToNewsletter } from '@/lib/ghost-api';

export function NewsletterForm() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [hasSubscribed, setHasSubscribed] = useState(false);

    useEffect(() => {
        setHasSubscribed(localStorage.getItem('newsletter_subscribed') === 'true');
    }, []);

    if (hasSubscribed) {
        return <div>✓ You're already subscribed!</div>;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');

        const result = await subscribeToNewsletter('https://your-ghost-site.com', { email });

        if (result.success) {
            setStatus('success');
            localStorage.setItem('newsletter_subscribed', 'true');
            setHasSubscribed(true);
        } else {
            setStatus('error');
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            {/* Form implementation */}
        </form>
    );
}
```

### Vue Component

```vue
<template>
  <div v-if="!hasSubscribed">
    <form @submit.prevent="handleSubmit">
      <input v-model="email" type="email" required>
      <button type="submit">Subscribe</button>
    </form>
  </div>
  <div v-else>✓ You're already subscribed!</div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const email = ref('');
const hasSubscribed = ref(false);

onMounted(() => {
  hasSubscribed.value = localStorage.getItem('newsletter_subscribed') === 'true';
});

async function handleSubmit() {
  // Use subscribeToGhost function
  const result = await window.subscribeToGhost(email.value, 'https://your-ghost-site.com');
  if (result.success) {
    localStorage.setItem('newsletter_subscribed', 'true');
    hasSubscribed.value = true;
  }
}
</script>
```

## Troubleshooting

### Form doesn't submit
- Check console for errors
- Verify Ghost site URL is correct
- Check network tab for failed requests

### "BadRequestError" or 400 response
- Integrity token missing or invalid
- Check Ghost version (must be 5.91.0+)
- Verify request payload format

### Form still shows after subscription
- Check localStorage: `localStorage.getItem('newsletter_subscribed')`
- Verify `#already-subscribed` element exists
- Check console for initialization logs

### "Member already exists" error
- User email is already subscribed in Ghost
- This is expected behavior, show success message

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Modern mobile browsers

Requires: `fetch`, `localStorage`, `async/await`

## License

MIT License - See LICENSE file

## Credits

Created by [Sébastien Dubois](https://www.dsebastien.net) for the [Knowledge Forge](https://store.dsebastien.net) store website.

## Related Projects

- [Store Website](../store-website) - Full implementation with TypeScript and React
- [Ghost Documentation](https://docs.ghost.org) - Official Ghost API docs

## Resources

- [Getting Members into Ghost](https://www.spectralwebservices.com/blog/getting-members-into-ghost/) - Comprehensive guide
- [Ghost Members API](https://forum.ghost.org/t/subscribing-users-to-newsletter-from-sign-up-form/43807) - Forum discussion
- [Ghost 6.0 Release Notes](https://ghost.org/changelog/6/) - What's new in Ghost 6

## Support

For issues or questions:
- Open an issue on GitHub
- Check the Ghost forum
- Review console logs for debugging information
