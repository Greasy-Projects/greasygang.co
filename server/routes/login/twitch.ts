import { generateState } from 'arctic';
import { twitch } from '~/server/utils/auth';

export default defineEventHandler(async (event) => {
    const state = generateState();
    const url = await twitch.createAuthorizationURL(state, {
        scopes: ['channel:read:subscriptions']
    });

    setCookie(event, 'twitch_oauth_state', state, {
        path: '/',
        httpOnly: true,
        secure: !process.dev,
        maxAge: 60 * 10,
        sameSite: 'lax',
    });
    return sendRedirect(event, url.toString());
});

