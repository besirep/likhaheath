/**
 * PM2 Ecosystem Configuration — LikhaHealth
 *
 * Usage:
 *   pm2 start ecosystem.config.js --env production
 *   pm2 stop likhahealth-api
 *   pm2 restart likhahealth-api
 *   pm2 logs likhahealth-api
 *   pm2 save                    ← persists across reboots
 *   pm2 startup                 ← enables auto-start on Windows boot
 */

module.exports = {
  apps: [
    {
      name: 'likhahealth-api',
      script: 'server.js',
      cwd: './server',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',

      // Production environment variables
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
      },

      // Development environment variables (for pm2 dev use)
      env_development: {
        NODE_ENV: 'development',
        PORT: 5000,
      },

      // Logging
      out_file: './logs/pm2-out.log',
      error_file: './logs/pm2-error.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',

      // Restart policy
      restart_delay: 3000,
      min_uptime: '5s',
      max_restarts: 10,
    },
  ],
};
