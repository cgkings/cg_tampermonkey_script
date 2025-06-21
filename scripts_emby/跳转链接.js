// ==UserScript==
// @name         Emby番号助手-纯API版
// @namespace    http://tampermonkey.net/
// @version      0.0.3
// @description  纯API获取番号，可拖动固定位置，准确性优先
// @author       You
// @match        *://*/web/index.html*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';

    // 配置项
    const CONFIG = {
        logEnabled: true,
        // 默认位置配置（首次使用时的位置）
        defaultPosition: {
            top: '120px',
            right: '20px',
        },
        // 样式配置
        style: {
            background: 'rgba(0,0,0,0.85)',
            borderRadius: '8px',
            padding: '12px',
            maxWidth: '350px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            zIndex: '10000',
            cursor: 'move', // 添加拖动指针
            userSelect: 'none' // 防止拖动时选中文本
        }
    };

    // 位置管理
    const PositionManager = {
        // 保存位置到localStorage
        savePosition(position) {
            try {
                localStorage.setItem('emby-code-helper-position', JSON.stringify(position));
            } catch (error) {
                log.error('保存位置失败:', error);
            }
        },

        // 从localStorage读取位置
        loadPosition() {
            try {
                const saved = localStorage.getItem('emby-code-helper-position');
                return saved ? JSON.parse(saved) : CONFIG.defaultPosition;
            } catch (error) {
                log.error('读取位置失败:', error);
                return CONFIG.defaultPosition;
            }
        },

        // 添加拖动功能
        makeDraggable(element) {
            let isDragging = false;
            let startX, startY, startLeft, startTop;

            // 鼠标按下
            element.addEventListener('mousedown', (e) => {
                // 如果点击的是链接，不启动拖动
                if (e.target.tagName === 'A') return;

                isDragging = true;
                startX = e.clientX;
                startY = e.clientY;

                const rect = element.getBoundingClientRect();
                startLeft = rect.left;
                startTop = rect.top;

                element.style.transition = 'none'; // 拖动时禁用过渡动画
                e.preventDefault();
            });

            // 鼠标移动
            document.addEventListener('mousemove', (e) => {
                if (!isDragging) return;

                const deltaX = e.clientX - startX;
                const deltaY = e.clientY - startY;

                const newLeft = startLeft + deltaX;
                const newTop = startTop + deltaY;

                // 限制在视窗内
                const maxLeft = window.innerWidth - element.offsetWidth;
                const maxTop = window.innerHeight - element.offsetHeight;

                const clampedLeft = Math.max(0, Math.min(newLeft, maxLeft));
                const clampedTop = Math.max(0, Math.min(newTop, maxTop));

                element.style.left = clampedLeft + 'px';
                element.style.top = clampedTop + 'px';
                element.style.right = 'auto';
                element.style.bottom = 'auto';
            });

            // 鼠标松开
            document.addEventListener('mouseup', () => {
                if (!isDragging) return;

                isDragging = false;
                element.style.transition = ''; // 恢复过渡动画

                // 保存新位置
                const rect = element.getBoundingClientRect();
                const position = {
                    left: rect.left + 'px',
                    top: rect.top + 'px'
                };

                this.savePosition(position);
                log.info('位置已保存:', position);
            });

            // 添加视觉反馈
            element.addEventListener('mouseenter', () => {
                if (!isDragging) {
                    element.style.opacity = '0.9';
                }
            });

            element.addEventListener('mouseleave', () => {
                if (!isDragging) {
                    element.style.opacity = '1';
                }
            });
        }
    };

    // 番号提取规则
    const codePatterns = [
        /([a-zA-Z]{2,15})[-\s]?(\d{2,15})/i,
        /(FC2)[-\s]?(PPV)[-\s]?(\d{6,7})/i,
        /(\d{3,4}[a-zA-Z]{2,15}[-\s]?\d{2,15})/i,
        /([a-zA-Z0-9]+_\d+)/i,
        /([a-zA-Z0-9]+-\d+)/i,
        /([A-Z]{3,6}\d{3,4})/,
        /([a-zA-Z]{2,15}\d{3,5})/i
    ];

    // 日志工具
    const log = {
        info: (...args) => CONFIG.logEnabled && console.log('%c[番号助手]', 'color: blue;', ...args),
        error: (...args) => CONFIG.logEnabled && console.log('%c[番号助手]', 'color: red;', ...args)
    };

    // 提取番号
    function extractCode(title) {
        if (!title) return null;
        for (const pattern of codePatterns) {
            const match = title.match(pattern);
            if (match) {
                if (match[0].toLowerCase().includes('fc2')) {
                    return 'FC2-PPV-' + match[3];
                }
                return match[0].replace(/\s+/g, '-').toUpperCase();
            }
        }
        return null;
    }

    // 使用API获取番号（优化版：只请求需要的字段）
    function getCodeFromAPI() {
        return new Promise(async (resolve) => {
            try {
                // 提取ItemID
                const hash = window.location.hash;
                const idMatch = /id=([^&]+)/.exec(hash);
                const itemId = idMatch ? idMatch[1] : null;

                if (!itemId) {
                    resolve(null);
                    return;
                }

                // 获取API客户端
                const apiClient = (typeof ApiClient !== 'undefined') ? ApiClient : window.ApiClient;
                if (!apiClient) {
                    log.error('无法获取Emby API客户端');
                    resolve(null);
                    return;
                }

                const userId = apiClient._serverInfo ? apiClient._serverInfo.UserId : apiClient.getCurrentUserId();

                // 方法1：尝试使用优化的字段请求（更快）
                try {
                    const optimizedUrl = `${apiClient.serverAddress()}/emby/Users/${userId}/Items/${itemId}?Fields=Name`;
                    const response = await fetch(optimizedUrl, {
                        headers: {
                            'X-Emby-Token': apiClient.accessToken()
                        }
                    });

                    if (response.ok) {
                        const itemInfo = await response.json();
                        log.info('使用优化API获取媒体信息:', itemInfo.Name);

                        // 尝试从指定字段提取番号
                        const titleSources = [
                            itemInfo.Name,
                            itemInfo.OriginalTitle,
                            itemInfo.SortName,
                            itemInfo.ForcedSortName
                        ].filter(Boolean);

                        for (const title of titleSources) {
                            const code = extractCode(title);
                            if (code) {
                                log.info('优化API方式获取到番号:', code);
                                resolve({ code, method: 'OptimizedAPI', title });
                                return;
                            }
                        }
                    }
                } catch (optimizedError) {
                    log.info('优化API调用失败，回退到标准API:', optimizedError.message);
                }

                // 方法2：回退到标准API（兼容性保证）
                const itemInfo = await apiClient.getItem(userId, itemId);
                log.info('使用标准API获取媒体信息:', itemInfo.Name);

                // 尝试从多个字段提取番号
                const titleSources = [
                    itemInfo.Name,
                    itemInfo.OriginalTitle,
                    itemInfo.SortName,
                    itemInfo.ForcedSortName
                ].filter(Boolean);

                for (const title of titleSources) {
                    const code = extractCode(title);
                    if (code) {
                        log.info('标准API方式获取到番号:', code);
                        resolve({ code, method: 'StandardAPI', title });
                        return;
                    }
                }

                log.info('未在API数据中检测到番号格式');
                resolve(null);
            } catch (error) {
                log.error('API获取失败:', error);
                resolve(null);
            }
        });
    }

    // 创建跳转链接（可拖动）
    function createJumpLinks(code) {
        const linkContainer = document.createElement('div');
        linkContainer.className = 'custom-code-links';

        // 获取保存的位置或使用默认位置
        const savedPosition = PositionManager.loadPosition();

        // 构建位置样式
        let positionStyle = 'position: fixed;';
        Object.entries(savedPosition).forEach(([key, value]) => {
            positionStyle += `${key}: ${value};`;
        });

        // 构建完整样式
        let fullStyle = positionStyle;
        Object.entries(CONFIG.style).forEach(([key, value]) => {
            const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
            fullStyle += `${cssKey}: ${value};`;
        });

        linkContainer.style.cssText = fullStyle;

        // 站点配置
        const sites = [
            {
                name: 'JavDB',
                url: 'https://javdb.com/search?q=' + encodeURIComponent(code),
                color: '#96ceb4'
            },
            {
                name: 'SupJAV',
                url: 'https://supjav.com/zh/?s=' + encodeURIComponent(code),
                color: '#ff6b6b'
            },
            {
                name: 'SubtitleCat',
                url: 'https://www.subtitlecat.com/index.php?search=' + encodeURIComponent(code),
                color: '#45b7d1'
            }
        ];

        // 容器内容
        linkContainer.innerHTML = `
            <div style="display: flex; flex-wrap: wrap; gap: 8px; align-items: center;">
                <span style="color: #fff; font-weight: bold; font-size: 13px; margin-right: 8px; pointer-events: none;">
                    番号: ${code}
                </span>
                ${sites.map(site => `
                    <a href="${site.url}" target="_blank" style="
                        display: inline-block;
                        padding: 5px 10px;
                        background: ${site.color};
                        color: white;
                        text-decoration: none;
                        border-radius: 4px;
                        font-size: 11px;
                        transition: opacity 0.3s;
                        cursor: pointer;
                    " onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'">
                        ${site.name}
                    </a>
                `).join('')}
            </div>
        `;

        // 添加拖动功能
        PositionManager.makeDraggable(linkContainer);

        return linkContainer;
    }

    // 添加番号链接
    async function addCodeLinks() {
        // 检查是否已存在
        if (document.querySelector('.custom-code-links')) {
            return;
        }

        // 检查是否在详情页
        if (!window.location.hash.includes('id=')) {
            return;
        }

        try {
            // 使用API获取番号
            const result = await getCodeFromAPI();

            if (!result) {
                log.info('未获取到番号');
                return;
            }

            log.info(`获取到番号: ${result.code} (来源: ${result.title})`);

            // 创建并添加链接
            const linkContainer = createJumpLinks(result.code);
            document.body.appendChild(linkContainer);

            log.info('番号链接已添加');

        } catch (error) {
            log.error('添加番号链接失败:', error);
        }
    }

    // 页面变化处理
    let lastUrl = window.location.href;

    function handlePageChange() {
        const currentUrl = window.location.href;

        if (currentUrl !== lastUrl) {
            lastUrl = currentUrl;

            // 清理旧链接
            const existing = document.querySelector('.custom-code-links');
            if (existing) existing.remove();

            // 如果是详情页，添加链接
            if (window.location.hash.includes('id=')) {
                log.info('页面变化，开始获取番号');
                setTimeout(addCodeLinks, 800);
            }
        }
    }

    // 初始化
    function init() {
        log.info('Emby番号助手已启动（纯API版+可拖动）');
        log.info('当前位置:', PositionManager.loadPosition());

        // 监听URL变化
        new MutationObserver(() => {
            if (location.href !== lastUrl) {
                setTimeout(handlePageChange, 100);
            }
        }).observe(document, { subtree: true, childList: true });

        // 定期检查（备用，对付emby的间隔限制）
        setInterval(() => {
            if (window.location.hash.includes('id=') && !document.querySelector('.custom-code-links')) {
                log.info('定期检查：发现详情页无番号链接，尝试添加');
                addCodeLinks();
            }
        }, 3000);

        // 初始执行
        setTimeout(addCodeLinks, 1500);
    }

    // 启动
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        setTimeout(init, 1000);
    }

})();