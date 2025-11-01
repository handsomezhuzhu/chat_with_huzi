module.exports = {
  apps: [{
    name: 'chat_with_huzi',
    script: 'server.js',
    
    // 实例数量（cluster模式）
    instances: 1,
    exec_mode: 'fork',
    
    // 环境变量
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    
    // 自动重启配置
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    
    // 日志配置
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // 其他配置
    merge_logs: true,
    min_uptime: '10s',
    max_restarts: 10,
    restart_delay: 4000
  }]
};

