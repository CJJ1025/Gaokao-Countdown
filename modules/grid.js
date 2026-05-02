/**
 * 网格编辑模块 - 界面布局编辑
 * 处理CSS Grid布局、元素拖动、属性编辑等功能
 */

const ClockGrid = (function() {
    'use strict';

    // 可编辑元素定义
    const editableElements = {
        currentTime: {
            selector: '#currentTime',
            label: '当前时间',
            defaultStyles: { fontSize: '8em', gridArea: '1 / 1 / 2 / 2' }
        },
        currentDate: {
            selector: '#currentDate',
            label: '当前日期',
            defaultStyles: { fontSize: '1.5em', gridArea: '1 / 2 / 2 / 3' }
        },
        countdownSection: {
            selector: '#countdownSection',
            label: '倒计时区域',
            defaultStyles: { gridArea: '2 / 1 / 3 / 4' }
        },
        gaokaoSection: {
            selector: '#gaokaoSection',
            label: '高考倒计时',
            defaultStyles: { gridArea: '3 / 1 / 4 / 3' }
        },
        controlBar: {
            selector: '#controlBar',
            label: '控制栏',
            defaultStyles: { position: 'fixed', bottom: '30px', right: '30px' }
        }
    };

    let isEditMode = false;
    let selectedElement = null;
    let gridConfig = {
        enabled: false,
        columns: 3,
        rows: 4,
        gap: '10px'
    };

    /**
     * 初始化网格编辑模块
     */
    function init() {
        loadGridConfig();
        setupEventListeners();
    }

    /**
     * 加载网格配置
     */
    function loadGridConfig() {
        const saved = ClockCore.get('gridLayout');
        if (saved) {
            gridConfig = { ...gridConfig, ...saved };
            if (gridConfig.enabled) {
                applyGridLayout();
            }
        }
    }

    /**
     * 应用网格布局
     */
    function applyGridLayout() {
        const mainDisplay = document.getElementById('mainDisplay');
        if (!mainDisplay) return;

        if (gridConfig.enabled) {
            mainDisplay.style.display = 'grid';
            mainDisplay.style.gridTemplateColumns = `repeat(${gridConfig.columns}, 1fr)`;
            mainDisplay.style.gridTemplateRows = `repeat(${gridConfig.rows}, 1fr)`;
            mainDisplay.style.gap = gridConfig.gap;
        } else {
            mainDisplay.style.display = '';
            mainDisplay.style.gridTemplateColumns = '';
            mainDisplay.style.gridTemplateRows = '';
            mainDisplay.style.gap = '';
        }
    }

    /**
     * 启用编辑模式
     */
    function enableEditMode() {
        isEditMode = true;
        document.body.classList.add('grid-edit-mode');
        setupDraggableElements();
        ClockCore.emit('gridEditModeChanged', { enabled: true });
    }

    /**
     * 禁用编辑模式
     */
    function disableEditMode() {
        isEditMode = false;
        selectedElement = null;
        document.body.classList.remove('grid-edit-mode');
        removeDraggableElements();
        ClockCore.emit('gridEditModeChanged', { enabled: false });
    }

    /**
     * 切换编辑模式
     */
    function toggleEditMode() {
        if (isEditMode) {
            disableEditMode();
        } else {
            enableEditMode();
        }
    }

    /**
     * 设置可拖动元素
     */
    function setupDraggableElements() {
        Object.entries(editableElements).forEach(([key, config]) => {
            const el = document.querySelector(config.selector);
            if (el) {
                el.classList.add('grid-editable');
                el.dataset.elementKey = key;
                el.style.cursor = 'move';

                el.addEventListener('click', (e) => {
                    e.stopPropagation();
                    selectElement(key);
                });
            }
        });

        // 点击空白处取消选择
        document.getElementById('mainDisplay')?.addEventListener('click', (e) => {
            if (e.target.id === 'mainDisplay') {
                deselectElement();
            }
        });
    }

    /**
     * 移除可拖动元素
     */
    function removeDraggableElements() {
        Object.values(editableElements).forEach(config => {
            const el = document.querySelector(config.selector);
            if (el) {
                el.classList.remove('grid-editable', 'selected');
                el.style.cursor = '';
                el.removeEventListener('click', selectElement);
            }
        });
    }

    /**
     * 选择元素
     */
    function selectElement(key) {
        // 移除旧选择
        document.querySelectorAll('.grid-editable.selected').forEach(el => {
            el.classList.remove('selected');
        });

        // 添加新选择
        const config = editableElements[key];
        const el = document.querySelector(config?.selector);
        if (el) {
            el.classList.add('selected');
            selectedElement = key;
            ClockGridUI.showPropertyPanel(key);
            ClockCore.emit('elementSelected', { key, element: el });
        }
    }

    /**
     * 取消选择
     */
    function deselectElement() {
        document.querySelectorAll('.grid-editable.selected').forEach(el => {
            el.classList.remove('selected');
        });
        selectedElement = null;
        ClockGridUI.hidePropertyPanel();
    }

    /**
     * 更新元素样式
     */
    function updateElementStyle(key, styles) {
        const config = editableElements[key];
        const el = document.querySelector(config?.selector);
        if (!el) return;

        Object.entries(styles).forEach(([prop, value]) => {
            el.style[prop] = value;
        });

        ClockCore.emit('elementStyleChanged', { key, styles });
    }

    /**
     * 保存元素样式配置
     */
    function saveElementConfig(key, config) {
        const saved = ClockCore.get('elementConfigs') || {};
        saved[key] = { ...editableElements[key]?.defaultStyles, ...config };
        ClockCore.set('elementConfigs', saved);
    }

    /**
     * 获取元素当前样式
     */
    function getElementComputedStyles(key) {
        const config = editableElements[key];
        const el = document.querySelector(config?.selector);
        if (!el) return {};

        const computed = window.getComputedStyle(el);
        return {
            fontSize: computed.fontSize,
            color: computed.color,
            textAlign: computed.textAlign,
            gridArea: computed.gridArea,
            top: computed.top,
            left: computed.left,
            width: computed.width,
            height: computed.height,
            opacity: computed.opacity,
            transform: computed.transform
        };
    }

    /**
     * 更新网格配置
     */
    function updateGridConfig(config) {
        gridConfig = { ...gridConfig, ...config };
        ClockCore.set('gridLayout', gridConfig);
        applyGridLayout();
    }

    /**
     * 获取网格配置
     */
    function getGridConfig() {
        return gridConfig;
    }

    /**
     * 获取可编辑元素列表
     */
    function getEditableElements() {
        return Object.entries(editableElements).map(([key, config]) => ({
            key,
            label: config.label,
            selector: config.selector
        }));
    }

    /**
     * 导出布局配置
     */
    function exportLayoutConfig() {
        return {
            gridConfig,
            elementConfigs: ClockCore.get('elementConfigs') || {}
        };
    }

    /**
     * 导入布局配置
     */
    function importLayoutConfig(config) {
        if (config.gridConfig) {
            updateGridConfig(config.gridConfig);
        }
        if (config.elementConfigs) {
            Object.entries(config.elementConfigs).forEach(([key, styles]) => {
                updateElementStyle(key, styles);
            });
        }
    }

    /**
     * 设置事件监听
     */
    function setupEventListeners() {
        ClockCore.on('configImported', (config) => {
            if (config.gridLayout) {
                updateGridConfig(config.gridLayout);
            }
            if (config.elementConfigs) {
                importLayoutConfig({ elementConfigs: config.elementConfigs });
            }
        });
    }

    // 公开API
    return {
        init,
        enableEditMode,
        disableEditMode,
        toggleEditMode,
        isEditMode: () => isEditMode,
        selectElement,
        deselectElement,
        updateElementStyle,
        saveElementConfig,
        getElementComputedStyles,
        updateGridConfig,
        getGridConfig,
        getEditableElements,
        exportLayoutConfig,
        importLayoutConfig
    };
})();

/**
 * 网格编辑UI模块 - 处理属性编辑面板
 */
const ClockGridUI = (function() {
    'use strict';

    let propertyPanel = null;

    /**
     * 显示属性面板
     */
    function showPropertyPanel(elementKey) {
        const config = ClockGrid.getEditableElements().find(e => e.key === elementKey);
        if (!config) return;

        const styles = ClockGrid.getElementComputedStyles(elementKey);

        propertyPanel = document.createElement('div');
        propertyPanel.className = 'grid-property-panel';
        propertyPanel.innerHTML = `
            <div class="property-panel-header">
                <h4>${config.label} 属性</h4>
                <button class="property-panel-close">×</button>
            </div>
            <div class="property-panel-body">
                <div class="property-group">
                    <label>字号</label>
                    <input type="text" class="prop-fontSize" value="${styles.fontSize || ''}">
                </div>
                <div class="property-group">
                    <label>颜色</label>
                    <input type="color" class="prop-color" value="${styles.color || '#ffffff'}">
                </div>
                <div class="property-group">
                    <label>透明度</label>
                    <input type="range" class="prop-opacity" min="0" max="1" step="0.1" value="${styles.opacity || 1}">
                </div>
                <div class="property-group">
                    <label>文本对齐</label>
                    <select class="prop-textAlign">
                        <option value="left" ${styles.textAlign === 'left' ? 'selected' : ''}>左对齐</option>
                        <option value="center" ${styles.textAlign === 'center' ? 'selected' : ''}>居中</option>
                        <option value="right" ${styles.textAlign === 'right' ? 'selected' : ''}>右对齐</option>
                    </select>
                </div>
                <button class="property-apply-btn">应用</button>
            </div>
        `;

        document.body.appendChild(propertyPanel);

        // 绑定事件
        propertyPanel.querySelector('.property-panel-close').addEventListener('click', hidePropertyPanel);
        propertyPanel.querySelector('.property-apply-btn').addEventListener('click', () => {
            applyProperties(elementKey);
        });

        // 位置调整
        propertyPanel.style.right = '380px';
        propertyPanel.style.top = '50%';
        propertyPanel.style.transform = 'translateY(-50%)';
    }

    /**
     * 应用属性
     */
    function applyProperties(elementKey) {
        const styles = {
            fontSize: propertyPanel.querySelector('.prop-fontSize').value,
            color: propertyPanel.querySelector('.prop-color').value,
            opacity: propertyPanel.querySelector('.prop-opacity').value,
            textAlign: propertyPanel.querySelector('.prop-textAlign').value
        };

        ClockGrid.updateElementStyle(elementKey, styles);
        ClockGrid.saveElementConfig(elementKey, styles);
    }

    /**
     * 隐藏属性面板
     */
    function hidePropertyPanel() {
        if (propertyPanel) {
            propertyPanel.remove();
            propertyPanel = null;
        }
    }
})();
