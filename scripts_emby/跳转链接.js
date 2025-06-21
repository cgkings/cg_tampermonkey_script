// ==UserScript==
// @name         Emby番号助手-固定位置+竞速获取版
// @namespace    http://tampermonkey.net/
// @version      0.0.2
// @description  固定位置显示，DOM和API竞速获取番号，自定义位置
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
        // 固定位置配置（可自定义）
        position: {
            top: '490px',      // 距离顶部
            left: '450px',     // 距离右边，可改为 left: '20px'或 right: '20px'
            // bottom: '120px', // 如果想要距离底部，注释掉top，启用这行
        },
        // 样式配置
        style: {
            background: 'rgba(0,0,0,0.85)',
            borderRadius: '8px',
            padding: '12px',
            maxWidth: '350px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            zIndex: '10000'
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

    // 方法1：DOM解析获取番号
    function getCodeFromDOM() {
        return new Promise((resolve) => {
            try {
                const titleElement = document.querySelector('.itemName') ||
                    document.querySelector('.detailPagePrimaryTitle') ||
                    document.querySelector('h1') ||
                    document.querySelector('[data-testid="item-name"]');

                if (!titleElement) {
                    resolve(null);
                    return;
                }

                const title = titleElement.textContent || titleElement.innerText;
                const code = extractCode(title);

                if (code) {
                    log.info('DOM方式获取到番号:', code);
                    resolve({ code, method: 'DOM', title });
                } else {
                    resolve(null);
                }
            } catch (error) {
                log.error('DOM获取失败:', error);
                resolve(null);
            }
        });
    }

    // 方法2：API获取番号
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
                    resolve(null);
                    return;
                }

                // 获取媒体信息
                const userId = apiClient._serverInfo ? apiClient._serverInfo.UserId : apiClient.getCurrentUserId();
                const itemInfo = await apiClient.getItem(userId, itemId);

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
                        log.info('API方式获取到番号:', code);
                        resolve({ code, method: 'API', title });
                        return;
                    }
                }

                resolve(null);
            } catch (error) {
                log.error('API获取失败:', error);
                resolve(null);
            }
        });
    }

    // 竞速获取番号（DOM vs API，谁快用谁）
    function getCodeFast() {
        return new Promise((resolve) => {
            let resolved = false;

            // 同时启动两种方法
            getCodeFromDOM().then(result => {
                if (!resolved && result) {
                    resolved = true;
                    resolve(result);
                }
            });

            getCodeFromAPI().then(result => {
                if (!resolved && result) {
                    resolved = true;
                    resolve(result);
                }
            });

            // 5秒超时
            setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    resolve(null);
                }
            }, 5000);
        });
    }

    // 创建跳转链接（固定位置）
    function createJumpLinks(code) {
        const linkContainer = document.createElement('div');
        linkContainer.className = 'custom-code-links';

        // 构建位置样式
        let positionStyle = 'position: fixed;';
        Object.entries(CONFIG.position).forEach(([key, value]) => {
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
                <span style="color: #fff; font-weight: bold; font-size: 13px; margin-right: 8px;">
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
                    " onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'">
                        ${site.name}
                    </a>
                `).join('')}
            </div>
        `;

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
            // 竞速获取番号
            const result = await getCodeFast();

            if (!result) {
                log.info('未获取到番号');
                return;
            }

            log.info(`通过${result.method}方式获取到番号: ${result.code}`);

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
        log.info('Emby番号助手已启动（固定位置+竞速获取版）');
        log.info('显示位置:', CONFIG.position);

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