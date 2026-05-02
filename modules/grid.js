/**
 * 布局管理模块 - 简单高效的界面布局
 * 提供预设布局模板 + 元素微调功能
 */

const ClockGrid = (function() {
    'use strict';

    // 预设布局模板
    const layoutPresets = {
        default: {
            name: '默认布局',
            description: '标准居中布局'
        },
        compact: {
            name: '紧凑布局',
            description: '元素更紧凑'
        },
        spaced: {
            name: '宽松布局',
            description: '元素有更多间距'
        }
    };

    // 可微调的元素定义
    const adjustableElements = {
        timeSection: {
            selector: '#timeSection',
            label: '当前时间区域'
        },
        countdownSection: {
            selector: '#countdownSection',
            label: '倒计时区域'
        },
        gaokaoSection: {
            selector: '#gaokaoSection',
            label: '高考倒计时'
        }
    };

    let selectedElement = null;

    /**
     * 初始化布局模块
     */
    function init() {
        loadLayoutConfig();
        setupEventListeners();
        applyCurrentLayout();
    }

    /**
     * 加载布局配置
     */
    function loadLayoutConfig() {
        const currentLayout = ClockCore.get('currentLayout') || 'default';
        ClockCore.set('currentLayout', currentLayout);
    }

    /**
     * 保存布局配置
     */
    function saveLayoutConfig() {
    }

    /**
     * 应用当前布局
     */
    function applyCurrentLayout() {
        const currentLayout = ClockCore.get('currentLayout') || 'default';
        const gap = getLayoutGap(currentLayout);
        
        // 使用CSS变量控制间距
        document.documentElement.style.setProperty('--layout-gap', gap);
        
        // 应用保存的元素样式
        const savedStyles = ClockCore.get('elementStyles') || {};
        Object.entries(savedStyles).forEach(([key, styles]) => {
            applyElementStyles(key, styles);
        });
    }

    /**
     * 根据布局类型获取间距
     */
    function getLayoutGap(layout) {
        switch(layout) {
            case 'compact': return '5px';
            case 'spaced': return '30px';
            default: return '15px';
        }
    }

    /**
     * 应用元素样式
     */
    function applyElementStyles(elementKey, styles) {
        const config = adjustableElements[elementKey];
        const el = document.querySelector(config?.selector);
        if (!el) return;

        Object.entries(styles).forEach(([prop, value]) => {
            if (value === null || value === undefined || value === '') {
                el.style.removeProperty(prop);
            } else {
                try {
                    el.style[prop] = value;
                } catch (e) {
                    console.warn('无法应用样式:', prop, value, e);
                }
            }
        });

        saveElementStyles(elementKey, styles);
    }

    /**
     * 保存元素样式
     */
    function saveElementStyles(elementKey, styles) {
        const elementStyles = ClockCore.get('elementStyles') || {};
        elementStyles[elementKey] = { ...elementStyles[elementKey], ...styles };
        ClockCore.set('elementStyles', elementStyles);
        ClockCore.emit('elementStyleChanged', { elementKey, styles });
    }

    /**
     * 获取元素当前样式
     */
    function getElementStyles(elementKey) {
        const config = adjustableElements[elementKey];
        const el = document.querySelector(config?.selector);
        if (!el) return {};

        return {
            marginTop: el.style.marginTop,
            marginBottom: el.style.marginBottom,
            padding: el.style.padding
        };
    }

    /**
     * 应用预设布局
     */
    function applyPresetLayout(presetName) {
        if (!layoutPresets[presetName]) {
            console.warn('Layout preset not found:', presetName);
            return;
        }

        ClockCore.set('currentLayout', presetName);
        applyCurrentLayout();
        ClockCore.emit('layoutChanged', { presetName });
    }

    /**
     * 元素微调：上下间距
     */
    function adjustElement(elementKey, direction, step = 5) {
        const config = adjustableElements[elementKey];
        const el = document.querySelector(config?.selector);
        if (!el) return;

        const currentValue = parseFloat(el.style.marginTop) || 0;
        let newValue;

        switch (direction) {
            case 'up':
                newValue = Math.max(0, currentValue - step);
                break;
            case 'down':
                newValue = currentValue + step;
                break;
            default:
                return;
        }

        el.style.marginTop = newValue + 'px';
        saveElementStyles(elementKey, { marginTop: newValue + 'px' });
    }

    /**
     * Z轴调整（暂时简化为透明度调整）
     */
    function adjustZIndex(elementKey, direction) {
        const config = adjustableElements[elementKey];
        const el = document.querySelector(config?.selector);
        if (!el) return;
        
        let opacity = parseFloat(el.style.opacity) || 1;
        if (direction === 'up') {
            opacity = Math.min(1, opacity + 0.1);
        } else {
            opacity = Math.max(0.5, opacity - 0.1);
        }
        el.style.opacity = opacity;
        saveElementStyles(elementKey, { opacity: el.style.opacity });
    }

    /**
     * 重置元素位置
     */
    function resetElementPosition(elementKey) {
        const config = adjustableElements[elementKey];
        const el = document.querySelector(config?.selector);
        if (!el) return;
        
        el.style.removeProperty('marginTop');
        el.style.removeProperty('opacity');
        el.style.removeProperty('padding');
        
        const savedStyles = ClockCore.get('elementStyles') || {};
        delete savedStyles[elementKey];
        ClockCore.set('elementStyles', savedStyles);
        ClockCore.emit('elementStyleChanged', { elementKey, styles: {} });
    }

    /**
     * 获取预设布局列表
     */
    function getPresetLayouts() {
        return Object.entries(layoutPresets).map(([key, config]) => ({
            key,
            name: config.name,
            description: config.description
        }));
    }

    /**
     * 获取可调整元素列表
     */
    function getAdjustableElements() {
        return Object.entries(adjustableElements).map(([key, config]) => ({
            key,
            label: config.label,
            selector: config.selector
        }));
    }

    /**
     * 选择元素进行调整
     */
    function selectElement(elementKey) {
        deselectElement();
        selectedElement = elementKey;
        const el = document.querySelector(adjustableElements[elementKey]?.selector);
        if (el) {
            el.classList.add('adjusting');
        }
        ClockCore.emit('elementSelectedForAdjust', { key: elementKey });
    }

    /**
     * 取消选择元素
     */
    function deselectElement() {
        if (!selectedElement) return;
        const el = document.querySelector(adjustableElements[selectedElement]?.selector);
        if (el) {
            el.classList.remove('adjusting');
        }
        selectedElement = null;
        ClockCore.emit('elementDeselected');
    }

    /**
     * 获取当前选择的元素
     */
    function getSelectedElement() {
        return selectedElement;
    }

    /**
     * 导出布局配置
     */
    function exportLayoutConfig() {
        return {
            currentLayout: ClockCore.get('currentLayout'),
            elementStyles: ClockCore.get('elementStyles') || {}
        };
    }

    /**
     * 导入布局配置
     */
    function importLayoutConfig(config) {
        if (config.currentLayout) {
            ClockCore.set('currentLayout', config.currentLayout);
            applyCurrentLayout();
        }
        if (config.elementStyles) {
            Object.entries(config.elementStyles).forEach(([key, styles]) => {
                applyElementStyles(key, styles);
            });
        }
    }

    /**
     * 设置事件监听
     */
    function setupEventListeners() {
        ClockCore.on('configImported', (config) => {
            if (config.gridLayout?.currentLayout || config.elementStyles) {
                importLayoutConfig({
                    currentLayout: config.gridLayout?.currentLayout || config.currentLayout,
                    elementStyles: config.elementStyles
                });
            }
        });
    }

    // 公开API
    return {
        init,
        applyPresetLayout,
        adjustElement,
        adjustZIndex,
        resetElementPosition,
        getPresetLayouts,
        getAdjustableElements,
        selectElement,
        deselectElement,
        getSelectedElement,
        getElementStyles,
        exportLayoutConfig,
        importLayoutConfig
    };
})();
