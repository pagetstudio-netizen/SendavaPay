module.exports = {
  apps: [
    {
      name: "sendavapay",
      script: "dist/index.cjs",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: 5000,
      },
    },
  ],
};
