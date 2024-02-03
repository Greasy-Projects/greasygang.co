import { generateState } from "arctic";
import { discord } from "~/server/utils/auth";

export default defineEventHandler(async event => {
	const state = generateState();
	const url = await discord.createAuthorizationURL(state, {
		scopes: ["identify"],
	});

	setCookie(event, "discord_oauth_state", state, {
		path: "/",
		httpOnly: true,
		secure: !process.dev,
		maxAge: 60 * 10,
		sameSite: "lax",
	});
	return sendRedirect(event, url.toString());
});
