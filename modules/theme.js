/**
 * 主题模块 - 主题系统管理
 * 支持文件夹导入主题、自定义主题、示例模板
 */

const ClockTheme = (function() {
    'use strict';

    // 预设主题定义
    const presetThemes = {
        vscode: {
            name: 'VS Code',
            type: 'preset',
            isFolderTheme: false,
            variables: {
                '--bg-primary': '#1e1e1e',
                '--bg-secondary': '#252525',
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
                '--font-size-gaokao': '2em',
                '--border-radius': '8px',
                '--border-width': '1px',
                '--opacity-primary': '1',
                '--opacity-secondary': '0.8'
            }
        },
        cyberpunk: {
            name: '赛博朋克',
            type: 'preset',
            isFolderTheme: false,
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
                '--font-size-gaokao': '2em',
                '--border-radius': '8px',
                '--border-width': '1px',
                '--opacity-primary': '1',
                '--opacity-secondary': '0.8'
            }
        },
        ink: {
            name: '水墨古风',
            type: 'preset',
            isFolderTheme: false,
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
                '--font-size-gaokao': '2em',
                '--border-radius': '8px',
                '--border-width': '1px',
                '--opacity-primary': '1',
                '--opacity-secondary': '0.8'
            }
        },
        mahiro: {
            name: '绪山真寻',
            type: 'preset',
            isFolderTheme: false,
            variables: {
                '--bg-primary': '#fff0f5',
                '--bg-secondary': '#ffe4e1',
                '--bg-tertiary': '#ffb6c1',
                '--text-primary': '#ff6b9b',
                '--text-secondary': '#db7093',
                '--accent-color': '#ff1493',
                '--accent-color-rgb': '255, 20, 147',
                '--border-color': '#ffb6c1',
                '--font-family': "'Comic Sans MS', cursive",
                '--font-size-time': '8em',
                '--font-size-date': '1.5em',
                '--font-size-countdown': '9em',
                '--font-size-gaokao': '2em',
                '--border-radius': '8px',
                '--border-width': '1px',
                '--opacity-primary': '1',
                '--opacity-secondary': '0.8'
            }
        }
    };

    let currentThemeName = 'vscode';
    let customStyleEl = null;
    let loadedFolderThemes = new Map();
    let fileHandles = new Map();

    /**
     * 初始化主题模块
     */
    function init() {
        createCustomStyleElement();
        loadCurrentTheme();
        loadSavedFolderThemes();
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
     * 从 localStorage 加载保存的文件夹主题
     */
    function loadSavedFolderThemes() {
        const savedThemes = ClockCore.get('folderThemes') || {};
        Object.entries(savedThemes).forEach(([name, data]) => {
            loadedFolderThemes.set(name, {
                ...data,
                isFolderTheme: true
            });
        });
    }

    /**
     * 保存文件夹主题到 localStorage
     */
    function saveFolderThemes() {
        const themes = {};
        loadedFolderThemes.forEach((data, name) => {
            themes[name] = {
                name: data.name,
                config: data.config,
                loadedAt: new Date().toISOString()
            };
        });
        ClockCore.set('folderThemes', themes);
    }

    /**
     * 导入文件夹主题
     */
    async function importFolderTheme(dirHandle) {
        try {
            // 读取 config.json
            let configHandle = null;
            try {
                configHandle = await dirHandle.getFileHandle('config.json');
            } catch {
                throw new Error('找不到 config.json');
            }
            
            const configFile = await configHandle.getFile();
            const configText = await configFile.text();
            const config = JSON.parse(configText);

            const themeName = dirHandle.name;

            // 读取文件夹内所有图片文件并转为 base64
            const images = {};
            for await (const [name, entry] of dirHandle.entries()) {
                if (entry.kind === 'file') {
                    if (/\.(png|jpg|jpeg|gif|webp|svg)$/i.test(name)) {
                        const file = await entry.getFile();
                        const base64 = await fileToBase64(file);
                        images[name] = base64;
                    }
                }
            }

            const theme = {
                name: themeName,
                type: 'custom',
                isFolderTheme: true,
                config: config,
                images: images,
                folderName: dirHandle.name,
                loadedAt: new Date().toISOString()
            };

            loadedFolderThemes.set(themeName, theme);
            saveFolderThemes();
            ClockCore.emit('folderThemeImported', theme);

            return theme;
        } catch (error) {
            console.error('导入文件夹主题失败:', error);
            throw error;
        }
    }

    /**
     * 转换文件为 base64
     */
    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    /**
     * 应用主题
     */
    function applyTheme(themeName) {
        let theme = presetThemes[themeName];

        if (!theme) {
            theme = getCustomTheme(themeName);
        }

        if (!theme && loadedFolderThemes.has(themeName)) {
            theme = loadedFolderThemes.get(themeName);
        }

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

        if (theme.isFolderTheme && theme.config) {
            applyFolderThemeConfig(theme);
        } else if (theme.variables) {
            applyVariables(theme.variables);
        }

        if (theme.customCss) {
            applyCustomCss(theme.customCss);
        }

        currentThemeName = themeName;
        ClockCore.set('currentTheme', themeName);

        updateThemeButtons(themeName);
        updateCustomThemesList(themeName);

        ClockCore.emit('themeApplied', { themeName, theme });
        ClockCore.emit('themeChanged', { themeName, theme });
        
        return true;
    }

    /**
     * 应用文件夹主题配置
     */
    function applyFolderThemeConfig(theme) {
        const config = theme.config;
        const images = theme.images || {};

        if (config.styles?.global) {
            applyVariables(config.styles.global);
        }

        if (config.styles?.elements) {
            applyElementStyles(config.styles.elements, images);
        }

        if (config.styles?.animations?.enable) {
            applyAnimations(config.styles.animations);
        }
    }

    /**
     * 应用 CSS 变量
     */
    function applyVariables(variables) {
        const root = document.documentElement;
        Object.entries(variables).forEach(([key, value]) => {
            root.style.setProperty(key, value);
        });
    }

    /**
     * 应用元素样式
     */
    function applyElementStyles(elements, images) {
        const elementMap = {
            appContainer: document.getElementById('appContainer'),
            mainDisplay: document.getElementById('mainDisplay'),
            timeSection: document.getElementById('timeSection'),
            currentTime: document.getElementById('currentTime'),
            currentDate: document.getElementById('currentDate'),
            countdownSection: document.getElementById('countdownSection'),
            countdownTime: document.getElementById('countdownTime'),
            countdownLabel: document.getElementById('countdownLabel'),
            gaokaoSection: document.getElementById('gaokaoSection'),
            gaokaoCountdown: document.getElementById('gaokaoCountdown'),
            controlBar: document.getElementById('controlBar'),
            sidePanel: document.getElementById('personalizeSidePanel')
        };

        Object.entries(elements).forEach(([key, styles]) => {
            const el = elementMap[key];
            if (!el) return;

            Object.entries(styles).forEach(([prop, value]) => {
                if (value === null || value === undefined) {
                    el.style.removeProperty(prop);
                    return;
                }

                if (prop === 'backgroundImage' && value) {
                    // 处理背景图片
                    if (value !== 'none') {
                        if (images && images[value]) {
                            el.style.backgroundImage = `url('${images[value]}')`;
                        } else {
                            el.style.backgroundImage = `url('${value}')`;
                        }
                    }
                } else {
                    try {
                        el.style[prop] = value;
                    } catch (e) {
                        console.warn('无法应用样式:', prop, value, e);
                    }
                }
            });
        });
    }

    /**
     * 应用动画配置
     */
    function applyAnimations(animations) {
        if (!animations.enable) return;
    }

    /**
     * 应用自定义 CSS
     */
    function applyCustomCss(css) {
        if (customStyleEl) {
            customStyleEl.textContent = css;
        }
    }

    /**
     * 获取自定义主题（旧格式）
     */
    function getCustomTheme(name) {
        const customThemes = ClockCore.get('customThemes') || [];
        return customThemes.find(t => t.name === name);
    }

    /**
     * 获取所有主题列表
     */
    function getAllThemes() {
        const themes = [];
        const customThemes = ClockCore.get('customThemes') || [];

        Object.entries(presetThemes).forEach(([key, value]) => {
            themes.push({ key, ...value, type: 'preset' });
        });

        customThemes.forEach(theme => {
            themes.push({
                key: theme.name,
                ...theme,
                type: 'custom'
            });
        });

        loadedFolderThemes.forEach((theme, name) => {
            themes.push({
                key: name,
                ...theme,
                type: 'custom',
                isFolderTheme: true
            });
        });

        return themes;
    }

    /**
     * 获取当前主题
     */
    function getCurrentTheme() {
        if (presetThemes[currentThemeName]) {
            return presetThemes[currentThemeName];
        }
        if (loadedFolderThemes.has(currentThemeName)) {
            return loadedFolderThemes.get(currentThemeName);
        }
        return getCustomTheme(currentThemeName);
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
            isFolderTheme: false,
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

        if (loadedFolderThemes.has(name)) {
            loadedFolderThemes.delete(name);
            saveFolderThemes();
        }

        if (currentThemeName === name) {
            applyTheme('vscode');
        }

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
     * 更新自定义主题列表
     */
    function updateCustomThemesList(activeTheme) {
        ClockCore.emit('customThemesNeedUpdate', activeTheme);
    }

    /**
     * 导出主题配置
     */
    function exportTheme(themeName) {
        let theme = presetThemes[themeName];

        if (!theme) {
            theme = getCustomTheme(themeName);
        }

        if (!theme && loadedFolderThemes.has(themeName)) {
            theme = loadedFolderThemes.get(themeName);
        }

        if (!theme) return null;

        return {
            name: theme.name,
            version: '1.0',
            type: theme.type,
            variables: theme.variables || theme.config?.styles?.global,
            customCss: theme.customCss || '',
            exportedAt: new Date().toISOString()
        };
    }

    /**
     * 导入主题配置
     */
    function importTheme(config) {
        if (!config || !config.name) {
            throw new Error('Invalid theme config');
        }

        const theme = saveCustomTheme(config.name, config);
        ClockCore.emit('themeImported', theme);
        return theme;
    }

    /**
     * 获取文件夹主题
     */
    function getFolderTheme(name) {
        return loadedFolderThemes.get(name);
    }

    /**
     * 获取所有文件夹主题
     */
    function getFolderThemes() {
        return Array.from(loadedFolderThemes.values());
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
        ClockCore.on('configImported', (config) => {
            if (config.currentTheme) {
                applyTheme(config.currentTheme);
            }
        });

        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const theme = btn.dataset.theme;
                if (theme) {
                    applyTheme(theme);
                }
            });
        });
    }

    return {
        init,
        applyTheme,
        getCurrentTheme,
        getAllThemes,
        getFolderTheme,
        getFolderThemes,
        importFolderTheme,
        saveCustomTheme,
        deleteCustomTheme,
        exportTheme,
        importTheme,
        resetToDefault,
        getPresetThemes: () => presetThemes
    };
})();
