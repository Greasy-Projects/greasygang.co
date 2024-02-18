export default defineEventHandler(async event => {
	const query = getQuery(event);
	const token = query.token?.toString() ?? null;
	const redirect = query.redirect?.toString() ?? "/";

	if (token) {
		setCookie(event, "auth_session", `${token}`);
	}

	return sendRedirect(event, redirect);
});
