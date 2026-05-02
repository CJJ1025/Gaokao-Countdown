/**
 * 主题模块 - 主题系统管理
 * 处理预设主题、自定义主题、导入导出等功能
 */

const ClockTheme = (function() {
    'use strict';

    // 预设主题定义
    const presetThemes = {
        vscode: {
            name: 'VS Code',
            type: 'preset',
            variables: {
                '--bg-primary': '#1e1e1e',
                '--bg-secondary': '#252526',
                '--bg-tertiary': '#3c3c3c',
                '--text-primary': '#cccccc',
                '--text-secondary': '#858585',
                '--accent-color': '#007acc',
                '--accent-color-rgb': '0, 122, 204',
                '--border-color': '#3c3c3c',
                '--font-family': "'Segoe WPC', 'Segoe UI', sans-serif",
                '--font-size-time': '8em',
                '--font-size-date': '1.5em',
                '--font-size-countdown': '10em',
                '--font-size-gaokao': '2em'
            }
        },
        cyberpunk: {
            name: '赛博朋克',
            type: 'preset',
            variables: {
                '--bg-primary': '#0a0a0f',
                '--bg-secondary': '#12121a',
                '--bg-tertiary': '#1a1a2e',
                '--text-primary': '#00ffff',
                '--text-secondary': '#ff00ff',
                '--accent-color': '#00ffff',
                '--accent-color-rgb': '0, 255, 255',
                '--border-color': '#00ffff',
                '--font-family': "'Consolas', monospace",
                '--font-size-time': '8em',
                '--font-size-date': '1.5em',
                '--font-size-countdown': '10em',
                '--font-size-gaokao': '2em'
            }
        },
        ink: {
            name: '水墨古风',
            type: 'preset',
            variables: {
                '--bg-primary': '#f5f5dc',
                '--bg-secondary': '#e8e8d0',
                '--bg-tertiary': '#d4d4b8',
                '--text-primary': '#2c2c2c',
                '--text-secondary': '#5a5a5a',
                '--accent-color': '#8b0000',
                '--accent-color-rgb': '139, 0, 0',
                '--border-color': '#8b7355',
                '--font-family': "'STKaiti', 'KaiTi', serif",
                '--font-size-time': '8em',
                '--font-size-date': '1.5em',
                '--font-size-countdown': '9em',
                '--font-size-gaokao': '2em'
            }
        },
        mahiro: {
            name: '绪山真寻',
            type: 'preset',
            variables: {
                '--bg-primary': '#fff0f5',
                '--bg-secondary': '#ffe4e1',
                '--bg-tertiary': '#ffb6c1',
                '--text-primary': '#ff69b4',
                '--text-secondary': '#db7093',
                '--accent-color': '#ff1493',
                '--accent-color-rgb': '255, 20, 147',
                '--border-color': '#ffb6c1',
                '--font-family': "'Comic Sans MS', cursive",
                '--font-size-time': '8em',
                '--font-size-date': '1.5em',
                '--font-size-countdown': '9em',
                '--font-size-gaokao': '2em'
            }
        }
    };

    let currentThemeName = 'vscode';
    let customStyleEl = null;

    /**
     * 初始化主题模块
     */
    function init() {
        createCustomStyleElement();
        loadCurrentTheme();
        setupEventListeners();
    }

    /**
     * 创建自定义样式元素
     */
    function createCustomStyleElement() {
        customStyleEl = document.getElementById('custom-theme-style') || document.createElement('style');
        customStyleEl.id = 'custom-theme-style';
        document.head.appendChild(customStyleEl);
    }

    /**
     * 加载当前主题
     */
    function loadCurrentTheme() {
        const savedTheme = ClockCore.get('currentTheme') || 'vscode';
        applyTheme(savedTheme);
    }

    /**
     * 应用主题
     */
    function applyTheme(themeName) {
        const theme = presetThemes[themeName] || getCustomTheme(themeName);
        if (!theme) {
            console.warn('Theme not found:', themeName);
            return false;
        }

        // 移除旧的主题类
        document.body.classList.remove('theme-cyberpunk', 'theme-ink', 'theme-mahiro');

        // 添加新主题类（如果需要）
        if (themeName === 'cyberpunk') {
            document.body.classList.add('theme-cyberpunk');
        } else if (themeName === 'ink') {
            document.body.classList.add('theme-ink');
        } else if (themeName === 'mahiro') {
            document.body.classList.add('theme-mahiro');
        }

        // 应用CSS变量
        applyVariables(theme.variables);

        // 应用自定义CSS（如果有）
        if (theme.customCss) {
            applyCustomCss(theme.customCss);
        }

        currentThemeName = themeName;
        ClockCore.set('currentTheme', themeName);

        // 更新主题按钮状态
        updateThemeButtons(themeName);

        ClockCore.emit('themeChanged', { themeName, theme });
        return true;
    }

    /**
     * 应用CSS变量
     */
    function applyVariables(variables) {
        const root = document.documentElement;
        Object.entries(variables).forEach(([key, value]) => {
            root.style.setProperty(key, value);
        });
    }

    /**
     * 应用自定义CSS
     */
    function applyCustomCss(css) {
        if (customStyleEl) {
            customStyleEl.textContent = css;
        }
    }

    /**
     * 获取自定义主题
     */
    function getCustomTheme(name) {
        const customThemes = ClockCore.get('customThemes') || [];
        return customThemes.find(t => t.name === name);
    }

    /**
     * 获取所有主题列表
     */
    function getAllThemes() {
        const customThemes = ClockCore.get('customThemes') || [];
        const presets = Object.entries(presetThemes).map(([key, value]) => ({
            key,
            ...value
        }));
        const customs = customThemes.map(t => ({
            key: t.name,
            ...t,
            type: 'custom'
        }));
        return [...presets, ...customs];
    }

    /**
     * 获取当前主题
     */
    function getCurrentTheme() {
        return presetThemes[currentThemeName] || getCustomTheme(currentThemeName);
    }

    /**
     * 保存自定义主题
     */
    function saveCustomTheme(name, themeData) {
        const customThemes = ClockCore.get('customThemes') || [];
        const existingIndex = customThemes.findIndex(t => t.name === name);

        const newTheme = {
            name,
            type: 'custom',
            variables: themeData.variables || getCurrentTheme()?.variables || {},
            customCss: themeData.customCss || '',
            savedAt: new Date().toISOString()
        };

        if (existingIndex >= 0) {
            customThemes[existingIndex] = newTheme;
        } else {
            customThemes.push(newTheme);
        }

        ClockCore.set('customThemes', customThemes);
        ClockCore.emit('customThemeSaved', newTheme);
        return newTheme;
    }

    /**
     * 删除自定义主题
     */
    function deleteCustomTheme(name) {
        const customThemes = ClockCore.get('customThemes') || [];
        const filtered = customThemes.filter(t => t.name !== name);
        ClockCore.set('customThemes', filtered);
        ClockCore.emit('customThemeDeleted', { name });
    }

    /**
     * 更新主题按钮状态
     */
    function updateThemeButtons(activeTheme) {
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === activeTheme);
        });
    }

    /**
     * 导出主题配置
     */
    function exportTheme(themeName) {
        const theme = presetThemes[themeName] || getCustomTheme(themeName);
        if (!theme) return null;

        return {
            name: theme.name,
            version: '1.0',
            type: theme.type,
            variables: theme.variables,
            customCss: theme.customCss || '',
            exportedAt: new Date().toISOString()
        };
    }

    /**
     * 导入主题配置
     */
    function importTheme(config) {
        if (!config || !config.name || !config.variables) {
            throw new Error('Invalid theme config');
        }

        const theme = saveCustomTheme(config.name, config);
        ClockCore.emit('themeImported', theme);
        return theme;
    }

    /**
     * 重置为默认主题
     */
    function resetToDefault() {
        applyTheme('vscode');
        ClockCore.emit('themeReset');
    }

    /**
     * 设置事件监听
     */
    function setupEventListeners() {
        // 监听配置导入
        ClockCore.on('configImported', (config) => {
            if (config.currentTheme) {
                applyTheme(config.currentTheme);
            }
        });

        // 监听主题按钮点击
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const theme = btn.dataset.theme;
                if (theme) {
                    applyTheme(theme);
                }
            });
        });
    }

    // 公开API
    return {
        init,
        applyTheme,
        getCurrentTheme,
        getAllThemes,
        getPresetThemes: () => presetThemes,
        saveCustomTheme,
        deleteCustomTheme,
        exportTheme,
        importTheme,
        resetToDefault
    };
})();
