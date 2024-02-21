module.exports = {
  apps: [
    {
      name: "GreasyGang Prod Website",
      port: "5000",
      script: "./.output/server/index.mjs",
      autorestart: true,
      env: {
        NODE_ENV: "production", // Set the NODE_ENV environment variable to production
      },
    },
  ],
};
