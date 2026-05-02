# Custom Theme Template

> 自定义主题开发模板 - 按照此结构创建您自己的主题

## 📦 使用说明

### 快速开始

1. **下载此模板**
   - 在个性化面板中点击「下载自定义主题模板」
   - 获取完整的 `ExamplesTopic` 文件夹

2. **重命名文件夹**
   - 将文件夹重命名为您的主题名称（如 `MyNeonTheme`）

3. **修改配置**
   - 编辑 `config.json` 修改主题颜色、字体等
   - 修改 `README.md` 添加主题说明

4. **添加资源**（可选）
   - 将背景图片放入文件夹
   - 在 `config.json` 中引用

5. **导入主题**
   - 回到网站，点击「导入主题」
   - 选择您的主题文件夹

## 📂 主题目录结构

```
YourThemeName/              # 文件夹名称 = 主题名称
├── config.json            # 必需 - 主题配置文件
├── README.md              # 推荐 - 使用说明文档
├── preview.png            # 推荐 - 主题预览图 (可选)
└── images/                # 可选 - 背景图片文件夹
    └── background.jpg     # 背景图片示例
```

### 文件说明

| 文件 | 必须 | 说明 |
|------|------|------|
| `config.json` | ✓ | 主题配置文件，定义所有样式 |
| `README.md` | ✗ | 主题说明文档 |
| `preview.png` | ✗ | 主题预览缩略图 |
| `images/` | ✗ | 存放背景图片等资源 |

## 🎨 config.json 配置指南

### 1. 基本信息

```json
{
  "version": "1.0",
  "name": "My Theme",
  "description": "我的自定义主题",
  "author": "Your Name",
  "createdAt": "2026-01-01"
}
```

### 2. 全局样式变量

```json
"styles": {
  "global": {
    "--bg-primary": "#1a1a1a",      // 主背景色
    "--bg-secondary": "#252525",    // 次背景色
    "--text-primary": "#ffffff",     // 主要文字颜色
    "--text-secondary": "#a0a0a0",   // 次要文字颜色
    "--accent-color": "#0078d4",     // 强调色（按钮等）
    "--font-family": "Segoe UI",     // 字体
    "--font-size-time": "8em",       // 时间字体大小
    "--border-radius": "8px"         // 圆角大小
  }
}
```

### 3. 元素样式配置

每个元素可以单独配置：

```json
"elements": {
  "appContainer": {
    "backgroundColor": "var(--bg-primary)",
    "backgroundImage": null           // 或 "bg.jpg" 或 "images/bg.jpg"
  },
  "timeSection": {
    "backgroundColor": "rgba(0,0,0,0.8)",
    "border": "1px solid #333",
    "borderRadius": "12px",
    "padding": "20px"
  }
}
```

### 支持的元素

| 元素名称 | 说明 |
|----------|------|
| `appContainer` | 整个应用容器 |
| `mainDisplay` | 主显示区域 |
| `timeSection` | 当前时间区域 |
| `currentTime` | 时间文字 |
| `currentDate` | 日期文字 |
| `countdownSection` | 倒计时区域 |
| `countdownTime` | 倒计时数字 |
| `countdownLabel` | 倒计时标签 |
| `gaokaoSection` | 高考倒计时区域 |
| `gaokaoCountdown` | 高考倒计时文字 |
| `controlBar` | 底部控制栏 |
| `controlBtn` | 控制按钮 |
| `countdownControlBtn` | 倒计时控制按钮 |
| `sidePanel` | 侧边面板 |
| `modal` | 弹窗 |
| `modalBtn` | 弹窗按钮 |
| `themeBtn` | 主题选择按钮 |
| `layoutPresetItem` | 布局预设项 |
| `customThemeItem` | 自定义主题项 |

### 4. 背景图片设置

#### 无背景
```json
"backgroundImage": null
```

#### 使用文件夹内图片
```json
"backgroundImage": "background.jpg"
```

#### 使用子文件夹图片
```json
"backgroundImage": "images/bg.png"
```

### 5. 按钮图标配置

```json
"buttons": {
  "personalizeBtn": { "icon": null },
  "scheduleBtn": { "icon": null },
  "settingsBtn": { "icon": null },
  "countdownBtn": { "icon": null },
  "fullscreenBtn": { "icon": null }
}
```

### 6. 动画设置

```json
"animations": {
  "enable": true,
  "type": "fade",
  "duration": "300ms",
  "timingFunction": "ease"
}
```

## 🎯 自定义示例

### 示例1：修改主题颜色

```json
{
  "styles": {
    "global": {
      "--bg-primary": "#0f0f0f",
      "--accent-color": "#ff6b6b",
      "--text-primary": "#f0f0f0"
    }
  }
}
```

### 示例2：添加背景图片

1. 将 `my-bg.jpg` 放入主题文件夹
2. 修改配置：

```json
{
  "elements": {
    "appContainer": {
      "backgroundImage": "my-bg.jpg",
      "backgroundSize": "cover",
      "backgroundPosition": "center"
    }
  }
}
```

### 示例3：自定义按钮样式

```json
{
  "elements": {
    "modalBtn": {
      "background": "#4ecdc4",
      "color": "#ffffff",
      "borderRadius": "20px",
      "padding": "12px 30px"
    }
  }
}
```

## 📝 README.md 编写指南

建议包含以下内容：

1. **主题名称和版本**
2. **设计风格描述**
3. **色彩方案说明**
4. **使用方式**
5. **自定义说明**

## 📄 主题发布指南

### 分享您的主题

1. 完成主题开发
2. 将文件夹打包为 ZIP
3. 分享给其他用户
4. 用户解压后导入即可使用

### 注意事项

- 图片文件名不要使用中文
- 路径使用 `/` 分隔（不要用 `\`）
- 配置文件必须是有效的 JSON 格式
- 文件夹名称不能包含特殊字符

---

**Happy Theming! 🎨**
