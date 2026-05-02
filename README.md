# Gaokao-Countdown

高考倒计时网页，有晚自习倒计时功能，有课表倒计时功能，支持个性化。

Clock/
├── index.html              # 主入口页面
├── style.css              # 全局样式
├── script.js              # 主入口脚本
│
├── modules/               # 功能模块
│   ├── core.js           # 核心模块（状态管理、工具函数）
│   ├── theme.js          # 主题系统
│   ├── countdown.js      # 倒计时核心
│   ├── schedule.js       # 课表管理
│   ├── animation.js      # 动画系统
│   ├── grid.js          # 网格编辑
│   ├── modal.js         # 模态框管理
│   └── personalize.js    # 个性化/导入导出
│
└── assets/
    └── themes/           # 预设主题包
        ├── vscode.json
        ├── cyberpunk.json
        ├── ink.json
        └── mahiro.json
