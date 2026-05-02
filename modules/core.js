/**
 * 核心模块 - 状态管理和工具函数
 * 管理全局状态、事件系统、本地存储等核心功能
 */

const ClockCore = (function() {
    'use strict';

    // 默认状态
    const defaultState = {
        timerInterval: null,
        timerRemaining: 0,
        timerInitialDuration: 0,
        currentPeriod: null,
        isRunning: false,
        schedule: [],
        isManualTimer: false,
        hideControlsTimer: null,
        currentTheme: 'vscode',
        customThemes: [],
        settings: {
            gaokaoDate: '2026-06-07',
            showTimeWithCountdown: false,
            currentTheme: 'vscode',
            customCss: {}
        },
        currentLayout: 'default',
        elementStyles: {},
        gridLayout: {
            enabled: false,
            columns: 3,
            rows: 4,
            gap: '10px'
        },
        animation: {
            enabled: false,
            type: 'fade',
            trigger: 'load',
            duration: 1000
        }
    };

    // 预设主题列表（这些主题不能修改）
    const presetThemeNames = ['vscode', 'cyberpunk', 'ink', 'mahiro'];

    // 全局状态
    let state = {};

    // 事件监听器
    const listeners = {};

    /**
     * 初始化核心模块
     */
    function init() {
        loadState();
        cleanupOldStyles();
        setupEventListeners();
    }

    /**
     * 清理旧的绝对定位样式
     */
    function cleanupOldStyles() {
        const elements = ['#timeSection', '#countdownSection', '#gaokaoSection'];
        
        elements.forEach(selector => {
            const el = document.querySelector(selector);
            if (el) {
                el.style.removeProperty('position');
                el.style.removeProperty('top');
                el.style.removeProperty('left');
                el.style.removeProperty('right');
                el.style.removeProperty('transform');
            }
        });

        // 重置旧的 elementStyles
        const oldStyles = state.elementStyles || {};
        let cleaned = false;
        
        Object.entries(oldStyles).forEach(([key, styles]) => {
            if (styles.position || styles.top || styles.left || styles.right || styles.transform) {
                delete oldStyles[key];
                cleaned = true;
            }
        });
        
        if (cleaned) {
            state.elementStyles = oldStyles;
            saveState();
        }
    }

    /**
     * 加载保存的状态
     */
    function loadState() {
        try {
            const saved = localStorage.getItem('clockState');
            if (saved) {
                state = { ...defaultState, ...JSON.parse(saved) };
            } else {
                state = { ...defaultState };
            }
        } catch (e) {
            console.error('Failed to load state:', e);
            state = { ...defaultState };
        }
    }

    /**
     * 保存状态到本地存储
     */
    function saveState() {
        try {
            const toSave = {
                settings: state.settings,
                schedule: state.schedule,
                currentTheme: state.currentTheme,
                customThemes: state.customThemes,
                currentLayout: state.currentLayout,
                elementStyles: state.elementStyles,
                gridLayout: state.gridLayout,
                animation: state.animation
            };
            localStorage.setItem('clockState', JSON.stringify(toSave));
        } catch (e) {
            console.error('Failed to save state:', e);
        }
    }

    /**
     * 获取状态值
     */
    function get(key) {
        return key ? state[key] : state;
    }

    /**
     * 设置状态值
     */
    function set(key, value) {
        state[key] = value;
        saveState();
        emit('stateChange', { key, value });
    }

    /**
     * 批量设置状态
     */
    function setMultiple(updates) {
        Object.assign(state, updates);
        saveState();
        emit('stateChange', updates);
    }

    /**
     * 订阅事件
     */
    function on(event, callback) {
        if (!listeners[event]) {
            listeners[event] = [];
        }
        listeners[event].push(callback);
        return () => off(event, callback);
    }

    /**
     * 取消订阅
     */
    function off(event, callback) {
        if (!listeners[event]) return;
        listeners[event] = listeners[event].filter(cb => cb !== callback);
    }

    /**
     * 触发事件
     */
    function emit(event, data) {
        if (!listeners[event]) return;
        listeners[event].forEach(callback => callback(data));
    }

    /**
     * 工具函数：格式化时间
     */
    function formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return {
            hours: String(hours).padStart(2, '0'),
            mins: String(mins).padStart(2, '0'),
            secs: String(secs).padStart(2, '0')
        };
    }

    /**
     * 工具函数：解析时间为分钟
     */
    function parseTimeToMinutes(timeStr) {
        const [h, m] = timeStr.split(':').map(Number);
        return h * 60 + m;
    }

    /**
     * 工具函数：获取当前时间的分钟数
     */
    function getCurrentMinutes() {
        const now = new Date();
        return now.getHours() * 60 + now.getMinutes();
    }

    /**
     * 工具函数：深拷贝对象
     */
    function deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    /**
     * 检查是否是预设主题
     */
    function isPresetTheme(themeName) {
        return presetThemeNames.includes(themeName);
    }

    /**
     * 生成下一个未命名主题名称
     */
    function getNextUntitledThemeName() {
        const customThemes = get('customThemes') || [];
        let index = 1;
        while (customThemes.some(t => t.name === `未命名-${index}`)) {
            index++;
        }
        return `未命名-${index}`;
    }

    /**
     * 设置基础事件监听
     */
    function setupEventListeners() {
        // 页面卸载前保存状态
        window.addEventListener('beforeunload', saveState);

        // 监听可见性变化
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                saveState();
            }
        });

        // 初始化控制栏自动隐藏
        initControlBarAutoHide();
    }

    /**
     * 初始化控制栏自动隐藏
     */
    function initControlBarAutoHide() {
        const controlBar = document.getElementById('controlBar');
        if (!controlBar) return;

        let hideTimer = null;
        const HIDE_DELAY = 5000; // 5秒

        function showControlBar() {
            controlBar.classList.remove('hidden');
            resetHideTimer();
        }

        function hideControlBar() {
            controlBar.classList.add('hidden');
        }

        function resetHideTimer() {
            clearTimeout(hideTimer);
            hideTimer = setTimeout(hideControlBar, HIDE_DELAY);
        }

        // 监听用户操作
        const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
        events.forEach(event => {
            document.addEventListener(event, showControlBar, { passive: true });
        });

        // 侧边栏活动时不隐藏
        const sidePanel = document.getElementById('personalizeSidePanel');
        if (sidePanel) {
            sidePanel.addEventListener('mouseenter', () => {
                clearTimeout(hideTimer);
                controlBar.classList.remove('hidden');
            });
            sidePanel.addEventListener('mouseleave', () => {
                resetHideTimer();
            });
        }

        // 启动计时器
        resetHideTimer();
    }

    /**
     * 导出配置为JSON
     */
    function exportConfig() {
        return {
            version: '1.0',
            settings: state.settings,
            currentTheme: state.currentTheme,
            customThemes: state.customThemes,
            schedule: state.schedule,
            currentLayout: state.currentLayout,
            elementStyles: state.elementStyles,
            gridLayout: state.gridLayout,
            animation: state.animation,
            exportedAt: new Date().toISOString()
        };
    }

    /**
     * 导入配置
     */
    function importConfig(config) {
        if (config.settings) state.settings = { ...state.settings, ...config.settings };
        if (config.currentTheme) state.currentTheme = config.currentTheme;
        if (config.customThemes) state.customThemes = config.customThemes;
        if (config.schedule) state.schedule = config.schedule;
        if (config.currentLayout) state.currentLayout = config.currentLayout;
        if (config.elementStyles) state.elementStyles = { ...state.elementStyles, ...config.elementStyles };
        if (config.gridLayout) state.gridLayout = { ...state.gridLayout, ...config.gridLayout };
        if (config.animation) state.animation = { ...state.animation, ...config.animation };
        saveState();
        emit('configImported', config);
    }

    // 公开API
    return {
        init,
        get,
        set,
        setMultiple,
        on,
        off,
        emit,
        saveState,
        formatTime,
        parseTimeToMinutes,
        getCurrentMinutes,
        deepClone,
        exportConfig,
        importConfig,
        isPresetTheme,
        getNextUntitledThemeName,
        defaultState
    };
})();

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', () => ClockCore.init());
