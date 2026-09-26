module.exports = {
  apps: [
    {
      name: 'eduteam',
      script: './server.js',
      instances: 1,
      exec_mode: 'fork',
      restart_delay: 3000,
      autorestart: true,
      max_memory_restart: '1G',
      min_uptime: '10s',
      max_restarts: 10,
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOST: '127.0.0.1',
        DB_FILE: '/var/lib/eduteam/db.json',
        EDUTEAM_DATA_DIR: '/var/lib/eduteam/data'
      }
    }
  ]
};
