import type { Handle } from '@sveltejs/kit';
import csrf from 'edge-csrf';

https://kit.svelte.dev/docs/hooks

// initalize protection function
const csrfProtect = csrf({
    cookie: {
        secure: process.env.NODE_ENV === 'production',
    },
});

export const handle: Handle = async ({ event, resolve }) => {
    // Middleware logic
    console.log('Running on Vercel edge!');

    const response = await resolve(event);

    // Modify the response, e.g., add a custom header
    response.headers.set('x-custom-header', 'Processed at the edge');

    return response;
};
