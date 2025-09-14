module.exports = {
  apps: [
    {
      name: "catering-app",
      script: "dist/index.js",
      watch: true,
      env: {
        NODE_ENV: "development",
        PORT: 5000
      },
      max_memory_restart: "1G",
      exp_backoff_restart_delay: 100,
      max_restarts: 10,
      restart_delay: 4000,
      error_file: "logs/err.log",
      out_file: "logs/out.log",
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z"
    }
  ]
}
