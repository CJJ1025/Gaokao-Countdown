/**
 * 个性化模块 - 导入导出管理
 * 支持文件夹导入、自定义主题、模板下载
 */

const ClockPersonalize = (function() {
    'use strict';

    let hasAutoCreatedTheme = false;

    /**
     * 初始化个性化模块
     */
    function init() {
        setupEventListeners();
        setupAutoCreateThemeListeners();
        renderCustomThemesList();
        renderLayoutPresets();
    }

    /**
     * 设置自动创建主题的事件监听
     */
    function setupAutoCreateThemeListeners() {
        ClockCore.on('layoutChanged', () => {
            autoCreateThemeIfNeeded();
        });

        ClockCore.on('elementStyleChanged', () => {
            autoCreateThemeIfNeeded();
        });

        ClockCore.on('themeApplied', () => {
            hasAutoCreatedTheme = false;
        });
    }

    /**
     * 检查是否需要自动创建主题
     */
    function autoCreateThemeIfNeeded() {
        const currentTheme = ClockCore.get('currentTheme');
        
        if (!ClockCore.isPresetTheme(currentTheme) || hasAutoCreatedTheme) {
            return;
        }

        createUntitledTheme();
        hasAutoCreatedTheme = true;
    }

    /**
     * 创建未命名主题
     */
    function createUntitledTheme() {
        const themeName = ClockCore.getNextUntitledThemeName();
        const currentThemeData = ClockTheme.getCurrentTheme();
        
        ClockTheme.saveCustomTheme(themeName, {
            variables: currentThemeData?.variables || {},
            customCss: currentThemeData?.customCss || ''
        });

        ClockTheme.applyTheme(themeName);
        renderCustomThemesList();
        
        ClockCore.emit('customThemeCreated', { name: themeName, auto: true });
    }

    /**
     * 渲染自定义主题列表
     */
    function renderCustomThemesList() {
        const container = document.getElementById('customThemesContainer');
        if (!container) return;

        const customThemes = ClockCore.get('customThemes') || [];
        const folderThemes = ClockTheme.getFolderThemes();
        const currentTheme = ClockCore.get('currentTheme');

        let html = '';

        customThemes.forEach(theme => {
            const isActive = theme.name === currentTheme;
            html += `
                <div class="custom-theme-item ${isActive ? 'active' : ''}" data-theme="${theme.name}">
                    <div class="custom-theme-preview" style="background: ${theme.variables?.['--bg-primary'] || '#333'}"></div>
                    <span class="custom-theme-name">${theme.name}</span>
                    <button class="custom-theme-apply" data-theme="${theme.name}" title="应用">✓</button>
                    <button class="custom-theme-delete" data-theme="${theme.name}" title="删除">×</button>
                </div>
            `;
        });

        folderThemes.forEach(theme => {
            const isActive = theme.name === currentTheme;
            html += `
                <div class="custom-theme-item folder-theme ${isActive ? 'active' : ''}" data-theme="${theme.name}">
                    <div class="custom-theme-preview" style="background: ${theme.config?.styles?.global?.['--bg-primary'] || '#333'}"></div>
                    <span class="custom-theme-name">${theme.name} <span class="folder-badge">📁</span></span>
                    <button class="custom-theme-apply" data-theme="${theme.name}" title="应用">✓</button>
                    <button class="custom-theme-delete" data-theme="${theme.name}" title="删除">×</button>
                </div>
            `;
        });

        if (html === '') {
            html = '<div class="no-custom-themes">暂无自定义主题</div>';
        }

        container.innerHTML = html;

        container.querySelectorAll('.custom-theme-apply').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const themeName = btn.dataset.theme;
                await ClockTheme.applyTheme(themeName);
            });
        });

        container.querySelectorAll('.custom-theme-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const themeName = btn.dataset.theme;
                if (confirm(`确定要删除主题「${themeName}」吗？`)) {
                    ClockTheme.deleteCustomTheme(themeName);
                    renderCustomThemesList();
                }
            });
        });
    }

    /**
     * 渲染布局预设
     */
    function renderLayoutPresets() {
        const presets = document.querySelectorAll('.layout-btn');
        const currentLayout = ClockCore.get('currentLayout') || 'default';

        presets.forEach(preset => {
            const isActive = preset.dataset.layout === currentLayout;
            preset.classList.toggle('active', isActive);

            preset.addEventListener('click', () => {
                ClockGrid.applyPresetLayout(preset.dataset.layout);
            });
        });
    }

    /**
     * 导入文件夹主题
     */
    async function importFolderTheme() {
        try {
            const dirHandle = await window.showDirectoryPicker({
                mode: 'read',
                startIn: 'documents'
            });

            const theme = await ClockTheme.importFolderTheme(dirHandle);
            await ClockTheme.applyTheme(theme.name);
            
            alert(`主题「${theme.name}」导入成功！`);
            renderCustomThemesList();
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('导入失败:', error);
                alert('导入失败: ' + error.message);
            }
        }
    }

    /**
     * 导出配置
     */
    function exportConfig() {
        const config = ClockCore.exportConfig();
        const dataStr = JSON.stringify(config, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'clock-config.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    /**
     * 下载主题模板
     */
    async function downloadThemeTemplate() {
        try {
            const examplesTopicPath = 'assets/themes/ExamplesTopic';
            
            const [configRes, readmeRes] = await Promise.all([
                fetch(`${examplesTopicPath}/config.json`),
                fetch(`${examplesTopicPath}/README.md`)
            ]);
            
            const configJson = await configRes.text();
            const readmeMd = await readmeRes.text();
            
            if (window.showSaveFilePicker) {
                alert('提示：请手动下载 ExamplesTopic 文件夹，或参考以下内容创建主题。');
            } else {
                alert('请从以下位置获取模板：' + window.location.href.replace(window.location.hash, '') + 'assets/themes/ExamplesTopic');
            }

            const previewWindow = window.open('', '_blank');
            previewWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>ExamplesTopic 模板说明</title>
                    <style>
                        body { font-family: Arial, sans-serif; max-width: 800px; margin: 20px auto; padding: 0 20px; background: #1a1a1a; color: #ddd; }
                        pre { background: #2d2d2d; padding: 15px; border-radius: 8px; overflow: auto; }
                        code { color: #9cdcfe; }
                        h1, h2 { color: #0078d4; }
                    </style>
                </head>
                <body>
                    <h1>📁 ExamplesTopic 自定义主题模板</h1>
                    <h2>config.json</h2>
                    <pre><code>${configJson.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>
                    <h2>README.md</h2>
                    <pre><code>${readmeMd.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>
                    <h2>获取方式</h2>
                    <p>访问：${window.location.href.replace(window.location.hash, '')}assets/themes/ExamplesTopic/</p>
                    <p>或者在项目目录的 assets/themes/ExamplesTopic 文件夹中找到模板文件</p>
                </body>
                </html>
            `);
            previewWindow.document.close();
        } catch (error) {
            console.error('下载模板失败:', error);
            alert('下载模板失败，请检查网络或从项目文件夹中直接获取。');
        }
    }

    /**
     * 元素选择变化
     */
    function handleElementSelect(e) {
        const elementKey = e.target.value;

        if (elementKey) {
            ClockGrid.selectElement(elementKey);
            autoCreateThemeIfNeeded();
        } else {
            ClockGrid.deselectElement();
        }
    }

    /**
     * 元素微调
     */
    function handleElementAdjust(direction) {
        const selectedElement = ClockGrid.getSelectedElement();
        if (!selectedElement) return;
        
        ClockGrid.adjustElement(selectedElement, direction);
        autoCreateThemeIfNeeded();
    }

    /**
     * Z轴调整
     */
    function handleZIndexAdjust(direction) {
        const selectedElement = ClockGrid.getSelectedElement();
        if (!selectedElement) return;
        
        ClockGrid.adjustZIndex(selectedElement, direction);
        autoCreateThemeIfNeeded();
    }

    /**
     * 重置元素位置
     */
    function handleResetElement() {
        const selectedElement = ClockGrid.getSelectedElement();
        if (!selectedElement) return;
        
        ClockGrid.resetElementPosition(selectedElement);
        autoCreateThemeIfNeeded();
    }

    /**
     * 设置事件监听
     */
    function setupEventListeners() {
        // 打开/关闭个性化面板
        document.getElementById('personalizeBtn')?.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const panel = document.getElementById('personalizeSidePanel');
            panel?.classList.toggle('active');
            if (panel?.classList.contains('active')) {
                renderCustomThemesList();
                renderLayoutPresets();
            }
        });

        document.getElementById('closePersonalizeSide')?.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            document.getElementById('personalizeSidePanel')?.classList.remove('active');
        });

        // 新建主题（使用prompt简单输入）
        document.getElementById('newThemeBtn')?.addEventListener('click', () => {
            const name = prompt('输入主题名称：');
            if (!name || !name.trim()) return;

            let finalName = name.trim();
            const customThemes = ClockCore.get('customThemes') || [];
            while (customThemes.some(t => t.name === finalName)) {
                finalName += 'c';
            }

            const currentTheme = ClockTheme.getCurrentTheme();
            ClockTheme.saveCustomTheme(finalName, {
                variables: currentTheme?.variables || {},
                customCss: currentTheme?.customCss || ''
            });

            ClockTheme.applyTheme(finalName);
            renderCustomThemesList();
        });

        // 导入主题文件夹
        document.getElementById('importThemeFolderBtn')?.addEventListener('click', importFolderTheme);

        // 元素调整
        document.getElementById('adjustElementSelect')?.addEventListener('change', handleElementSelect);

        document.querySelectorAll('.adjust-btn[data-dir]').forEach(btn => {
            btn.addEventListener('click', () => handleElementAdjust(btn.dataset.dir));
        });

        document.getElementById('resetElementBtn')?.addEventListener('click', handleResetElement);

        document.addEventListener('click', (e) => {
            const panel = document.getElementById('personalizeSidePanel');
            const btn = document.getElementById('personalizeBtn');
            if (panel?.classList.contains('active')) {
                if (!panel.contains(e.target) && !btn?.contains(e.target)) {
                    panel.classList.remove('active');
                }
            }
        });

        ClockCore.on('customThemeCreated', () => {
            renderCustomThemesList();
        });

        ClockCore.on('folderThemeImported', () => {
            renderCustomThemesList();
        });

        ClockCore.on('customThemeDeleted', () => {
            renderCustomThemesList();
        });

        ClockCore.on('layoutChanged', () => {
            renderLayoutPresets();
        });
    }

    return {
        init,
        renderCustomThemesList,
        importFolderTheme,
        downloadThemeTemplate,
        exportConfig
    };
})();
