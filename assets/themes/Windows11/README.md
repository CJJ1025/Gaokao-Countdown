# Windows 11 Theme

> 基于微软 Fluent Design 设计语言打造的现代化时钟主题

## 📦 主题信息

- **主题名称**: Windows 11
- **版本**: 1.0
- **作者**: Clock Team
- **创建日期**: 2026-05-02
- **设计风格**: Fluent Design, 半透明, 毛玻璃效果

## 🎨 设计特点

### 视觉特色
- 半透明毛玻璃背景效果 (`backdrop-filter: blur()`)
- Windows 11 经典蓝色主题色 (#0078d4)
- 圆润的边角设计 (8-16px)
- 流畅的交互动画

### 色彩规范
| 用途 | 颜色值 |
|------|--------|
| 主背景 | `#1a1a1a` |
| 次背景 | `#252525` |
| 强调色 | `#0078d4` |
| 主文字 | `#ffffff` |
| 次文字 | `#b0b0b0` |

### 字体规范
- 主要字体: `Segoe UI` / `Segoe WP`
- 时间显示: 8em (300字重)
- 倒计时: 10em (400字重)

## 📂 文件结构

```
Windows11/
├── config.json       # 主配置文件
├── README.md         # 说明文档
└── preview.png       # 主题预览
```

## 💾 使用方式

### 导入主题
1. 点击个性化按钮
2. 选择「导入主题」
3. 选择此文件夹
4. 等待加载完成

### 预览
首次加载会生成主题预览，请刷新页面查看。

## 🎯 自定义修改指南

### 修改主题颜色
打开 `config.json`，找到 `styles.global` 区域

```json
{
  "styles": {
    "global": {
      "--accent-color": "#0078d4" // 在此修改强调色
    }
  }
}
```

### 添加背景图片
1. 将图片放入当前文件夹
2. 在 config.json 中修改对应元素的 `backgroundImage`

```json
{
  "appContainer": {
    "backgroundImage": "background.png"
  }
}
```

### 修改圆角和边框
```json
{
  "--border-radius": "12px",
  "--border-width": "1px"
}
```

## 🔧 配置字段说明

### 全局变量 (`styles.global`)
- `--bg-primary`: 主背景色
- `--bg-secondary`: 次背景色
- `--accent-color`: 强调按钮色
- `--text-primary`: 主要文字颜色
- `--font-family`: 主题字体
- `--border-radius`: 全局圆角大小

### 元素样式 (`styles.elements`)
每个界面元素可单独设置:
- `backgroundColor`: 背景色
- `backgroundImage`: 背景图 (相对路径或 none)
- `border`: 边框样式
- `padding`: 内边距
- `color`: 文字颜色
- `fontSize`: 字体大小

### 按钮样式 (`styles.buttons`)
每个按钮支持自定义图标

### 动画设置 (`styles.animations`)
控制界面元素出现动画

## 📝 更新日志

### v1.0 (2026-05-02)
- 首次发布
- 完整 Fluent Design 风格
- 支持所有自定义元素

## 📄 许可证

此主题仅供学习和个人使用。

---
制作于 ❤️ 2026
