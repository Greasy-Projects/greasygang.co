module.exports = {
	apps: [
		{
			name: "GreasyGang Beta Website",
			port: "5001",
			script: "./.output/server/index.mjs",
			autorestart: true,
			env: {
				NODE_ENV: "production",
				// CONTENT_BRANCH: "beta"
			},
		},
	],
};
