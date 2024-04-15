# Edge-CSRF SvelteKit Integration

This is the documentation for the Edge-CSRF SvelteKit integration.

## Quickstart

First, add Edge-CSRF as a dependency to your app:

```console
npm install edge-csrf
# or
pnpm add edge-csrf
# or
yarn add edge-csrf
```

Next, create a server-side hooks file (`hooks.server.ts`) for your project and add the Edge-CSRF handle:

```typescript
// src/hooks.server.ts

import { createHandle } from 'edge-csrf/sveltekit';

// initalize csrf protection handle
const csrfHandle = createHandle({
  cookie: {
    secure: process.env.NODE_ENV === 'production',
  },
});

export const handle = csrfHandle;
```

Now, all HTTP submission requests (e.g. POST, PUT, DELETE, PATCH) will be rejected if they do not include a valid CSRF token. To add the CSRF token to your forms, you can fetch it from the event's `locals` data object server-side. For example:

```typescript
// src/routes/+page.server.ts
export async function load({ locals }) {
	return {
		csrfToken: locals.csrfToken,
	};
}

export const actions = {
	default: async () => {
		return { success: true };
	},
};
```

```svelte
<!-- src/routes/+page.svelte -->
<script lang="ts">
	export let data;

  export let form;
</script>
{#if form?.success}
<span>success</span>
{:else}
<form method="post">
  <input type="hidden" value={data.csrfToken}>
  <input type="text" name="my-input">
  <input type="submit">
</form>
{/if}
```

Finally, to make typescript aware of the new `locals` attributes you can add Edge-CSRF types to your app's types:

```typescript
// src/app.d.ts

import type { EdgeCsrfLocals } from 'edge-csrf/sveltekit';

declare global {
	namespace App {
    // ...
		interface Locals extends EdgeCsrfLocals {}
    // ...
	}
}

export {};
```

## Configuration

```javascript
// default config

{
  cookie: {
    name: '_csrfSecret',
    path: '/',
    maxAge: undefined,
    domain: '',
    secure: true,
    httpOnly: true,
    sameSite: 'strict'
  },
  excludePathPrefixes: [],
  ignoreMethods: ['GET', 'HEAD', 'OPTIONS'],
  saltByteLength: 8,
  secretByteLength: 18,
  token: {
    value: undefined
  }
}
```
