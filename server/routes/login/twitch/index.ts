import { generateState } from "arctic";
import { twitch } from "~/server/utils/auth";

export default defineEventHandler(async event => {
	const state = generateState();
	// const extraScopes = new URLSearchParams(event.node.req.url?.split("?")[1]).get(
	// 	"scopes"
	// );
	const url = await twitch.createAuthorizationURL(state, {
		scopes: [
			"bits:read",
			"channel:read:editors",
			"channel:read:redemptions",
			"channel:read:subscriptions",
			"user:read:email",
		],
	});

	setCookie(event, "twitch_oauth_state", state, {
		path: "/",
		httpOnly: true,
		secure: !process.dev,
		maxAge: 60 * 10,
		sameSite: "lax",
	});
	return sendRedirect(event, url.toString());
});
