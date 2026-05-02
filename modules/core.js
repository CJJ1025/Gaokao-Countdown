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

    // 全局状态
    let state = {};

    // 事件监听器
    const listeners = {};

    /**
     * 初始化核心模块
     */
    function init() {
        loadState();
        setupEventListeners();
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
        defaultState
    };
})();

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', () => ClockCore.init());
