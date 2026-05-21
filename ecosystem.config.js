module.exports = {
  apps: [
    {
      name: "sendavapay",
      script: "dist/index.cjs",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      min_uptime: "10s",
      max_restarts: 20,
      restart_delay: 3000,
      env: {
        NODE_ENV: "production",
        PORT: 5000,
      },
      error_file: "logs/pm2-error.log",
      out_file: "logs/pm2-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      kill_timeout: 5000,
    },
  ],
};
