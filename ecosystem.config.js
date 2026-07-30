module.exports = {
  apps: [
    {
      name: 'trx-sweeper',
      script: 'src/index.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_restarts: 50,
      restart_delay: 2000,
      watch: false,
      max_memory_restart: '250M',
      env: {
        NODE_ENV: 'production',
      },
      out_file: 'logs/out.log',
      error_file: 'logs/error.log',
      time: true,
    },
  ],
};
