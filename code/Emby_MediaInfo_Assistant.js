// ==UserScript==
// @name         Emby媒体信息获取助手
// @namespace    http://tampermonkey.net/
// @version      0.0.2
// @description  支持全站高效获取EMBY媒体信息，无需API KEY，支持电影和电视节目
// @license      MIT
// @author       优化版
// @match        *://*/web/index.html*
// @grant        GM.xmlHttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';

    // 配置与工具函数
    const CONFIG = {
        // 缓存过期时间（毫秒）
        cacheExpiry: 24 * 60 * 60 * 1000, // 24小时
        // 请求限流配置
        throttle: {
            interval: 700, // 请求间隔（毫秒）
            maxRequests: 5 // 最大连续请求数
        },
        // 重试配置
        retry: {
            maxRetries: 3,
            delay: 1000
        },
        // 调试级别
        logLevel: 2 // 1: 错误, 2: 信息, 3: 调试
    };

    // 日志工具
    const logger = {
        error: function (...args) {
            if (CONFIG.logLevel >= 1) {
                console.log('%c[错误]', 'color: red;', ...args);
            }
        },
        info: function (...args) {
            if (CONFIG.logLevel >= 2) {
                console.log('%c[信息]', 'color: blue;', ...args);
            }
        },
        debug: function (...args) {
            if (CONFIG.logLevel >= 3) {
                console.log('%c[调试]', 'color: gray;', ...args);
            }
        }
    };

    // 缓存工具
    const cache = {
        get: function (key) {
            try {
                const item = localStorage.getItem(key);
                if (!item) return null;

                const parsedItem = JSON.parse(item);
                if (parsedItem.expiry && parsedItem.expiry < Date.now()) {
                    localStorage.removeItem(key);
                    return null;
                }

                return parsedItem.value;
            } catch (error) {
                logger.error('缓存读取错误:', error);
                return null;
            }
        },
        set: function (key, value, expiry = CONFIG.cacheExpiry) {
            try {
                const item = {
                    value: value,
                    expiry: Date.now() + expiry
                };
                localStorage.setItem(key, JSON.stringify(item));
                return true;
            } catch (error) {
                logger.error('缓存写入错误:', error);
                return false;
            }
        },
        remove: function (key) {
            localStorage.removeItem(key);
        }
    };

    // DOM 工具
    const domUtils = {
        // 获取可见元素
        getVisibleElement: function (selector) {
            const elements = document.querySelectorAll(selector);
            if (!elements || elements.length === 0) return null;

            for (let i = 0; i < elements.length; i++) {
                if (elements[i].offsetParent !== null) { // 元素可见
                    return elements[i];
                }
            }

            return null;
        },

        // 检查元素是否存在
        elementExists: function (selector) {
            return this.getVisibleElement(selector) !== null;
        },

        // 等待元素出现
        waitForElement: function (selector, callback, maxAttempts = 10, interval = 300) {
            let attempts = 0;

            const checkElement = () => {
                const element = this.getVisibleElement(selector);
                if (element) {
                    callback(element);
                    return true;
                } else if (attempts < maxAttempts) {
                    attempts++;
                    setTimeout(checkElement, interval);
                    return false;
                } else {
                    logger.debug(`等待元素超时: ${selector}`);
                    return false;
                }
            };

            return checkElement();
        }
    };

    // 工具函数
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function getHashParams() {
        try {
            const hash = window.location.hash.substring(1);
            const result = {};
            const regex = /([^&=]+)=([^&]*)/g;
            let match;
            while (match = regex.exec(hash)) {
                result[decodeURIComponent(match[1])] = decodeURIComponent(match[2]);
            }
            return result;
        } catch (error) {
            logger.error('URL参数解析错误:', error);
            return {};
        }
    }

    // 提取ItemID
    function extractItemId() {
        try {
            const params = getHashParams();
            return params.id;
        } catch (error) {
            logger.error('提取ItemID失败:', error);
            return null;
        }
    }

    // 检测页面类型
    function detectPageType() {
        const hash = window.location.hash;
        if (hash.includes('#!/item?id=')) {
            // 检查是否为电视节目的季或集页面
            if (domUtils.elementExists('.itemName-secondary')) {
                return 'tvshow';
            }
            return 'movie';
        }
        return 'other';
    }

    // 检测Emby版本和API路径
    function getEmbyApiBaseUrl() {
        // 从URL构建API基础URL
        const url = new URL(window.location.href);
        return `${url.protocol}//${url.host}`;
    }

    // 获取媒体信息核心函数
    async function getMediaInfo(itemId, mediaType = 'movie') {
        // 检查缓存
        const cacheKey = `media_info_${itemId}`;
        const cachedData = cache.get(cacheKey);

        if (cachedData) {
            logger.info('使用缓存的媒体信息:', itemId);
            return cachedData;
        }

        // 构建请求URL
        const baseUrl = getEmbyApiBaseUrl();
        const apiUrl = `${baseUrl}/Items/${itemId}/PlaybackInfo`;

        // 添加状态提示
        showStatusMessage(`正在获取媒体信息...`);

        // 尝试获取数据
        try {
            const data = await fetchWithRetry(apiUrl);

            if (data) {
                // 缓存结果
                cache.set(cacheKey, data);

                // 处理媒体信息
                handleMediaInfo(data, itemId);
                return data;
            } else {
                throw new Error('获取媒体信息失败');
            }
        } catch (error) {
            logger.error('获取媒体信息出错:', error);
            showStatusMessage(`获取媒体信息失败: ${error.message}`, 'error');
            return null;
        }
    }

    // 使用GM.xmlHttpRequest进行请求
    function fetchData(url) {
        return new Promise((resolve, reject) => {
            GM.xmlHttpRequest({
                method: "GET",
                url: url,
                timeout: 10000, // 10秒超时
                onload: function (response) {
                    if (response.status >= 200 && response.status < 400) {
                        try {
                            const data = JSON.parse(response.responseText);
                            resolve(data);
                        } catch (error) {
                            reject(new Error(`JSON解析错误: ${error.message}`));
                        }
                    } else {
                        reject(new Error(`请求失败: ${response.status} ${response.statusText}`));
                    }
                },
                onerror: function (error) {
                    reject(new Error(`请求错误: ${error}`));
                },
                ontimeout: function () {
                    reject(new Error('请求超时'));
                }
            });
        });
    }

    // 带重试的获取数据
    async function fetchWithRetry(url, maxRetries = CONFIG.retry.maxRetries, delay = CONFIG.retry.delay) {
        let retries = 0;

        while (true) {
            try {
                return await fetchData(url);
            } catch (error) {
                if (retries < maxRetries) {
                    retries++;
                    logger.info(`请求失败，正在重试 (${retries}/${maxRetries})...`);
                    showStatusMessage(`获取失败，正在重试 (${retries}/${maxRetries})...`);
                    await sleep(delay);
                } else {
                    throw error;
                }
            }
        }
    }

    // 获取电视节目的季和集信息
    async function getTvShowEpisodes(itemId) {
        try {
            const baseUrl = getEmbyApiBaseUrl();
            const apiUrl = `${baseUrl}/Items?ParentId=${itemId}&IncludeItemTypes=Season&SortBy=SortName&SortOrder=Ascending`;

            showStatusMessage(`正在获取季信息...`);
            const seasons = await fetchWithRetry(apiUrl);

            if (!seasons || !seasons.Items || seasons.Items.length === 0) {
                throw new Error('无法获取季信息');
            }

            logger.info(`找到 ${seasons.Items.length} 个季`);

            // 创建进度显示
            const totalSeasons = seasons.Items.length;
            let currentSeason = 0;

            // 获取每个季的剧集
            const allEpisodes = [];
            for (const season of seasons.Items) {
                currentSeason++;
                showStatusMessage(`正在获取剧集信息 (季 ${currentSeason}/${totalSeasons})...`);

                const episodesUrl = `${baseUrl}/Items?ParentId=${season.Id}&IncludeItemTypes=Episode&SortBy=SortName&SortOrder=Ascending`;
                const episodes = await fetchWithRetry(episodesUrl);

                if (episodes && episodes.Items) {
                    allEpisodes.push(...episodes.Items);
                }

                // 限流
                if (currentSeason < totalSeasons) {
                    await sleep(300);
                }
            }

            logger.info(`找到 ${allEpisodes.length} 个剧集`);
            return allEpisodes;

        } catch (error) {
            logger.error('获取电视节目信息出错:', error);
            showStatusMessage(`获取电视节目信息失败: ${error.message}`, 'error');
            return [];
        }
    }

    // 处理获取到的媒体信息
    function handleMediaInfo(data, itemId) {
        if (!data || !data.MediaSources || data.MediaSources.length === 0) {
            logger.error('无效的媒体信息');
            return;
        }

        const mediaSource = data.MediaSources[0];
        logger.info("媒体信息获取成功:", data);
        logger.info("媒体源路径:", mediaSource.Path);

        // 显示结果
        showMediaInfoResult(data);
    }

    // 显示状态消息
    function showStatusMessage(message, type = 'info') {
        let statusDiv = document.getElementById('emby-status-info');

        if (!statusDiv) {
            statusDiv = document.createElement('div');
            statusDiv.id = 'emby-status-info';
            statusDiv.style.cssText = 'position: fixed; top: 10px; right: 10px; padding: 10px; background: rgba(0,0,0,0.7); color: white; z-index: 9999; border-radius: 5px; max-width: 300px;';
            document.body.appendChild(statusDiv);
        }

        const bgColor = type === 'error' ? 'rgba(180,0,0,0.8)' : 'rgba(0,0,0,0.7)';
        statusDiv.style.background = bgColor;
        statusDiv.textContent = message;

        // 自动隐藏错误消息
        if (type === 'error') {
            setTimeout(() => {
                if (statusDiv && statusDiv.parentNode) {
                    document.body.removeChild(statusDiv);
                }
            }, 5000);
        }
    }

    // 显示媒体信息结果
    function showMediaInfoResult(data) {
        let statusDiv = document.getElementById('emby-status-info');

        if (!statusDiv) {
            statusDiv = document.createElement('div');
            statusDiv.id = 'emby-status-info';
            statusDiv.style.cssText = 'position: fixed; top: 10px; right: 10px; padding: 10px; background: rgba(0,0,0,0.7); color: white; z-index: 9999; border-radius: 5px; max-width: 80%; max-height: 80vh; overflow-y: auto;';
            document.body.appendChild(statusDiv);
        }

        // 提取重要信息
        const mediaSource = data.MediaSources[0];
        const mediaPath = mediaSource.Path || '未知路径';
        const mediaContainer = mediaSource.Container || '未知容器';
        const mediaFormat = mediaSource.MediaStreams && mediaSource.MediaStreams.length > 0
            ? `${mediaSource.MediaStreams[0].Codec || '未知'} (${mediaSource.MediaStreams[0].DisplayTitle || '未知'})`
            : '未知格式';

        statusDiv.innerHTML = `
            <div>
                <h3 style="margin-top: 0;">媒体信息获取成功</h3>
                <p><strong>路径:</strong> ${mediaPath}</p>
                <p><strong>容器格式:</strong> ${mediaContainer}</p>
                <p><strong>媒体格式:</strong> ${mediaFormat}</p>
                <details>
                    <summary>详细信息</summary>
                    <div style="max-height: 40vh; overflow-y: auto;">
                        <pre style="white-space: pre-wrap; word-break: break-all; font-size: 12px;">${JSON.stringify(data, null, 2)}</pre>
                    </div>
                </details>
                <button id="close-emby-info" style="margin-top: 10px; padding: 5px 10px;">关闭</button>
            </div>
        `;

        document.getElementById('close-emby-info').addEventListener('click', function () {
            if (statusDiv && statusDiv.parentNode) {
                document.body.removeChild(statusDiv);
            }
        });
    }

    // 添加刷新按钮
    function addActionButtons() {
        // 移除现有按钮（如果存在）
        const existingButtons = document.querySelectorAll('.emby-custom-button');
        existingButtons.forEach(button => {
            if (button && button.parentNode) {
                button.parentNode.removeChild(button);
            }
        });

        // 添加刷新按钮
        const refreshButton = document.createElement('button');
        refreshButton.textContent = '获取媒体信息';
        refreshButton.className = 'emby-custom-button';
        refreshButton.style.cssText = 'position: fixed; bottom: 20px; right: 20px; padding: 10px; background: #00a8ff; color: white; border: none; border-radius: 5px; cursor: pointer; z-index: 9999;';

        refreshButton.addEventListener('click', async function () {
            const pageType = detectPageType();

            if (pageType === 'movie' || pageType === 'tvshow') {
                const itemId = extractItemId();
                if (itemId) {
                    if (pageType === 'movie') {
                        await getMediaInfo(itemId, 'movie');
                    } else {
                        // 对于电视节目，先获取季和集
                        showStatusMessage('正在分析电视节目...');
                        const episodes = await getTvShowEpisodes(itemId);

                        if (episodes.length > 0) {
                            showMediaInfoSummary(episodes);
                        } else {
                            showStatusMessage('没有找到剧集信息', 'error');
                        }
                    }
                } else {
                    showStatusMessage('无法识别当前项目ID', 'error');
                }
            } else {
                showStatusMessage('请在媒体详情页面使用此功能', 'error');
            }
        });

        document.body.appendChild(refreshButton);

        // 添加清除缓存按钮
        const clearCacheButton = document.createElement('button');
        clearCacheButton.textContent = '清除缓存';
        clearCacheButton.className = 'emby-custom-button';
        clearCacheButton.style.cssText = 'position: fixed; bottom: 20px; right: 150px; padding: 10px; background: #f44336; color: white; border: none; border-radius: 5px; cursor: pointer; z-index: 9999;';

        clearCacheButton.addEventListener('click', function () {
            clearMediaInfoCache();
            showStatusMessage('媒体信息缓存已清除');
        });

        document.body.appendChild(clearCacheButton);
    }

    // 显示电视节目剧集信息摘要
    function showMediaInfoSummary(episodes) {
        if (!episodes || episodes.length === 0) return;

        let statusDiv = document.getElementById('emby-status-info');

        if (!statusDiv) {
            statusDiv = document.createElement('div');
            statusDiv.id = 'emby-status-info';
            statusDiv.style.cssText = 'position: fixed; top: 10px; right: 10px; padding: 10px; background: rgba(0,0,0,0.8); color: white; z-index: 9999; border-radius: 5px; max-width: 80%; max-height: 80vh; overflow-y: auto;';
            document.body.appendChild(statusDiv);
        }

        // 构建HTML
        let episodesHtml = '';
        episodes.slice(0, 20).forEach((episode, index) => {
            episodesHtml += `
                <div style="margin-bottom: 8px; padding: 5px; background: rgba(255,255,255,0.1); border-radius: 3px;">
                    <div><strong>${episode.IndexNumber || '?'}.${episode.Name || '未知'}</strong></div>
                    <div style="font-size: 12px;">${episode.Id}</div>
                    <button class="get-episode-info" data-id="${episode.Id}" style="margin-top: 5px; padding: 3px 8px; background: #2196F3; border: none; border-radius: 3px; color: white; cursor: pointer;">获取信息</button>
                </div>
            `;
        });

        if (episodes.length > 20) {
            episodesHtml += `<div>... 还有 ${episodes.length - 20} 集未显示</div>`;
        }

        statusDiv.innerHTML = `
            <div>
                <h3 style="margin-top: 0;">电视节目信息 (共 ${episodes.length} 集)</h3>
                <div style="max-height: 60vh; overflow-y: auto; margin: 10px 0;">
                    ${episodesHtml}
                </div>
                <div style="margin-top: 10px;">
                    <button id="get-all-episodes" style="padding: 5px 10px; margin-right: 10px; background: #4CAF50; border: none; border-radius: 3px; color: white; cursor: pointer;">获取所有剧集信息</button>
                    <button id="close-emby-info" style="padding: 5px 10px; background: #607D8B; border: none; border-radius: 3px; color: white; cursor: pointer;">关闭</button>
                </div>
            </div>
        `;

        // 绑定事件
        document.getElementById('close-emby-info').addEventListener('click', function () {
            if (statusDiv && statusDiv.parentNode) {
                document.body.removeChild(statusDiv);
            }
        });

        // 获取单个剧集信息
        document.querySelectorAll('.get-episode-info').forEach(button => {
            button.addEventListener('click', async function () {
                const episodeId = this.getAttribute('data-id');
                if (episodeId) {
                    await getMediaInfo(episodeId, 'episode');
                }
            });
        });

        // 获取所有剧集信息
        document.getElementById('get-all-episodes').addEventListener('click', async function () {
            this.disabled = true;
            this.textContent = '处理中...';

            let processed = 0;
            const totalEpisodes = episodes.length;

            for (const episode of episodes) {
                processed++;
                showStatusMessage(`处理剧集 ${processed}/${totalEpisodes}...`);

                try {
                    await getMediaInfo(episode.Id, 'episode');
                    // 适当延迟，防止请求过快
                    await sleep(300);
                } catch (error) {
                    logger.error(`处理剧集 ${episode.Name} 出错:`, error);
                }

                // 每处理5个剧集暂停一下，防止请求过多
                if (processed % 5 === 0 && processed < totalEpisodes) {
                    await sleep(1000);
                }
            }

            showStatusMessage(`所有剧集处理完成 (${processed}/${totalEpisodes})`);
            this.textContent = '已完成';
        });
    }

    // 清除媒体信息缓存
    function clearMediaInfoCache() {
        const prefix = 'media_info_';
        let count = 0;

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(prefix)) {
                localStorage.removeItem(key);
                count++;
            }
        }

        logger.info(`已清除 ${count} 条媒体信息缓存`);
    }

    // 主函数
    function main() {
        // 检测页面类型
        const pageType = detectPageType();
        logger.debug('当前页面类型:', pageType);

        // 更新UI
        addActionButtons();

        // 如果是媒体详情页，自动执行获取
        if ((pageType === 'movie' || pageType === 'tvshow') && domUtils.elementExists('.detailPageContent')) {
            const itemId = extractItemId();
            if (itemId) {
                // 避免页面加载时就立即执行，给用户一些反应时间
                setTimeout(async () => {
                    // 检查是否已经有缓存，如果有则不自动触发
                    const cacheKey = `media_info_${itemId}`;
                    const cachedData = cache.get(cacheKey);

                    if (!cachedData) {
                        logger.debug('自动获取媒体信息:', itemId);
                        if (pageType === 'movie') {
                            await getMediaInfo(itemId, 'movie');
                        }
                        // 电视节目不自动获取，因为可能有很多集
                    }
                }, 1500);
            }
        }
    }

    // 监听URL变化
    function setupURLChangeListener() {
        let lastUrl = window.location.href;

        // 定期检查URL变化
        setInterval(() => {
            const currentUrl = window.location.href;
            if (currentUrl !== lastUrl) {
                lastUrl = currentUrl;
                logger.debug('URL已变化:', currentUrl);
                main();
            }
        }, 1000);
    }

    // 初始化
    function init() {
        // 等待页面加载
        setTimeout(() => {
            logger.info('Emby媒体信息获取助手已启动');
            main();
            setupURLChangeListener();
        }, 1500);
    }

    // 启动脚本
    init();
})();