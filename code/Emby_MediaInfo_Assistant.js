// ==UserScript==
// @name         Emby媒体信息获取助手
// @namespace    http://tampermonkey.net/
// @version      0.0.3
// @description  高效获取Emby媒体信息，直接使用Emby用户内置API，支持电影和电视节目，无需额外认证
// @license      MIT
// @author       优化版
// @match        *://*/web/index.html*
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
            const hash = window.location.hash;
            const idMatch = /id=([^&]+)/.exec(hash);

            if (idMatch && idMatch[1]) {
                return idMatch[1];
            }

            // 兼容其他格式
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

        // 首先检查URL是否包含项目ID
        if (hash.includes('#!/item?id=') || hash.includes('#!/details?id=')) {
            // 尝试从DOM确定媒体类型
            const mediaType = determineMediaTypeFromDOM();
            logger.debug('从DOM确定的媒体类型:', mediaType);
            return mediaType;
        }
        return 'other';
    }

    // 从DOM元素判断媒体类型
    function determineMediaTypeFromDOM() {
        try {
            const apiClient = getApiClient();
            if (apiClient) {
                // 尝试从URL获取ItemId
                const itemId = extractItemId();

                // 如果能从URL中提取到ID，检查这是电影页面还是电视节目页面的元素特征

                // 查找更可靠的电视节目标记
                if (document.querySelector('.itemName-secondary') ||
                    document.querySelector('.itemMiscInfo-primary') ||
                    document.querySelector('.tvshowInfo')) {
                    return 'tvshow';
                }

                // 查找电影标记
                if (document.querySelector('.mediaInfoItem') &&
                    document.body.innerText.match(/电影|Movie/i)) {
                    return 'movie';
                }

                // 检查项目卡片
                const cards = document.querySelectorAll('.card');
                for (const card of cards) {
                    if (card.classList.contains('backdropCard') ||
                        card.classList.contains('portraitCard')) {
                        const cardText = card.innerText || '';
                        if (cardText.match(/季|集|Season|Episode/i)) {
                            return 'tvshow';
                        }
                    }
                }

                // 查找播放按钮
                const playButton = document.querySelector('.detailButton-play');
                if (playButton) {
                    return 'movie'; // 默认视为电影，因为大多数有直接播放按钮的是电影
                }
            }

            // 没有足够标记，默认为电影
            return 'movie';
        } catch (e) {
            logger.error('媒体类型判断错误:', e);
            return 'movie'; // 出错时默认为电影
        }
    }

    // 获取Emby客户端API实例
    function getApiClient() {
        if (typeof ApiClient !== 'undefined') {
            return ApiClient;
        }

        if (typeof window.ApiClient !== 'undefined') {
            return window.ApiClient;
        }

        logger.error('无法获取Emby API客户端');
        return null;
    }

    // 使用Emby内置API获取媒体信息
    async function getMediaInfo(itemId, mediaType = 'movie') {
        // 检查缓存
        const cacheKey = `media_info_${itemId}`;
        const cachedData = cache.get(cacheKey);

        if (cachedData) {
            logger.info('使用缓存的媒体信息:', itemId);
            return cachedData;
        }

        // 添加状态提示
        showStatusMessage(`正在获取媒体信息...`);

        // 获取API客户端
        const apiClient = getApiClient();
        if (!apiClient) {
            showStatusMessage('无法获取Emby API客户端', 'error');
            return null;
        }

        try {
            // 使用Emby内置API获取媒体信息
            const playbackInfo = await apiClient.getPlaybackInfo(itemId, {});
            logger.info('媒体信息获取成功:', playbackInfo);

            // 获取更详细的项目信息
            const userId = apiClient._serverInfo ? apiClient._serverInfo.UserId : apiClient.getCurrentUserId();
            const itemInfo = await apiClient.getItem(userId, itemId);

            // 合并所有信息
            const fullInfo = {
                playbackInfo: playbackInfo,
                itemInfo: itemInfo
            };

            // 缓存结果
            cache.set(cacheKey, fullInfo);

            // 处理媒体信息
            handleMediaInfo(fullInfo, itemId);
            return fullInfo;

        } catch (error) {
            logger.error('获取媒体信息出错:', error);
            showStatusMessage(`获取媒体信息失败: ${error.message}`, 'error');
            return null;
        }
    }

    // 获取电视节目的季和集信息
    async function getTvShowEpisodes(itemId) {
        try {
            const apiClient = getApiClient();
            if (!apiClient) {
                throw new Error('无法获取Emby API客户端');
            }

            const userId = apiClient._serverInfo ? apiClient._serverInfo.UserId : apiClient.getCurrentUserId();

            // 获取电视节目详情
            showStatusMessage(`正在获取电视节目信息...`);

            try {
                const tvShowInfo = await apiClient.getItem(userId, itemId);
                logger.debug('获取到的项目信息:', tvShowInfo);

                // 检查项目类型
                if (tvShowInfo && tvShowInfo.Type !== 'Series' && tvShowInfo.Type !== 'Season') {
                    // 如果不是电视剧，使用电影处理方式
                    logger.info('检测到项目不是电视剧，而是:', tvShowInfo.Type);
                    await getMediaInfo(itemId, 'movie');
                    return [];
                }

                // 获取季信息 - 使用通用API
                showStatusMessage(`正在获取季信息...`);

                const seasonOptions = {
                    userId: userId,
                    parentId: itemId,
                    includeItemTypes: 'Season'
                };

                // 尝试使用Items API
                const seasons = await apiClient.getItems(userId, seasonOptions);

                if (!seasons || !seasons.Items || seasons.Items.length === 0) {
                    if (tvShowInfo.Type === 'Season') {
                        // 如果项目本身就是季，直接获取其中的剧集
                        const episodes = await apiClient.getItems(userId, {
                            parentId: itemId,
                            includeItemTypes: 'Episode'
                        });

                        if (episodes && episodes.Items && episodes.Items.length > 0) {
                            logger.info(`找到 ${episodes.Items.length} 个剧集`);
                            return episodes.Items;
                        }
                    }

                    throw new Error('无法获取季信息，或者该剧集没有季');
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

                    try {
                        // 使用通用Items API获取剧集
                        const episodes = await apiClient.getItems(userId, {
                            parentId: season.Id,
                            includeItemTypes: 'Episode'
                        });

                        if (episodes && episodes.Items) {
                            allEpisodes.push(...episodes.Items);
                        }
                    } catch (error) {
                        logger.error(`获取季 ${season.Name} 的剧集失败:`, error);
                    }

                    // 限流
                    if (currentSeason < totalSeasons) {
                        await sleep(300);
                    }
                }

                logger.info(`找到 ${allEpisodes.length} 个剧集`);
                return allEpisodes;
            } catch (error) {
                logger.error('获取项目详情失败:', error);
                // 如果获取详情失败，尝试作为电影处理
                await getMediaInfo(itemId, 'movie');
                return [];
            }

        } catch (error) {
            logger.error('获取电视节目信息出错:', error);
            showStatusMessage(`获取电视节目信息失败: ${error.message}`, 'error');
            return [];
        }
    }

    // 处理获取到的媒体信息
    function handleMediaInfo(data, itemId) {
        if (!data || !data.playbackInfo || !data.playbackInfo.MediaSources || data.playbackInfo.MediaSources.length === 0) {
            logger.error('无效的媒体信息');
            return;
        }

        const mediaSource = data.playbackInfo.MediaSources[0];
        const itemInfo = data.itemInfo || {};

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
        if (type === 'error' || message.includes('完成')) {
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
        const mediaSource = data.playbackInfo.MediaSources[0];
        const itemInfo = data.itemInfo || {};
        const mediaPath = mediaSource.Path || '未知路径';
        const mediaContainer = mediaSource.Container || '未知容器';

        // 获取媒体流信息
        let videoInfo = '未知';
        let audioInfo = '未知';
        let subtitleInfo = '';

        if (mediaSource.MediaStreams && mediaSource.MediaStreams.length > 0) {
            for (const stream of mediaSource.MediaStreams) {
                if (stream.Type === 'Video') {
                    videoInfo = `${stream.Codec || '未知'} (${stream.Width || '?'}x${stream.Height || '?'})`;
                    if (stream.BitRate) {
                        videoInfo += `, ${Math.round(stream.BitRate / 1000)} kbps`;
                    }
                } else if (stream.Type === 'Audio') {
                    audioInfo = `${stream.Codec || '未知'} (${stream.ChannelLayout || stream.Channels || '?'} 声道)`;
                    if (stream.Language) {
                        audioInfo += `, ${stream.Language}`;
                    }
                } else if (stream.Type === 'Subtitle') {
                    subtitleInfo += `${subtitleInfo ? '<br>' : ''}· ${stream.Language || '未知语言'} (${stream.Codec || '未知格式'})`;
                }
            }
        }

        // 构建基本信息HTML
        let infoHtml = `
            <div>
                <h3 style="margin-top: 0;">媒体信息获取成功</h3>
                <p><strong>名称:</strong> ${itemInfo.Name || '未知'}</p>
                <p><strong>路径:</strong> ${mediaPath}</p>
                <p><strong>容器格式:</strong> ${mediaContainer}</p>
                <p><strong>视频:</strong> ${videoInfo}</p>
                <p><strong>音频:</strong> ${audioInfo}</p>
        `;

        // 如果有字幕，添加字幕信息
        if (subtitleInfo) {
            infoHtml += `<p><strong>字幕:</strong><br>${subtitleInfo}</p>`;
        }

        // 添加详细信息和关闭按钮
        infoHtml += `
                <details>
                    <summary>详细信息</summary>
                    <div style="max-height: 40vh; overflow-y: auto;">
                        <pre style="white-space: pre-wrap; word-break: break-all; font-size: 12px;">${JSON.stringify(data, null, 2)}</pre>
                    </div>
                </details>
                <button id="close-emby-info" style="margin-top: 10px; padding: 5px 10px;">关闭</button>
            </div>
        `;

        statusDiv.innerHTML = infoHtml;

        document.getElementById('close-emby-info').addEventListener('click', function () {
            if (statusDiv && statusDiv.parentNode) {
                document.body.removeChild(statusDiv);
            }
        });
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

    // 检查页面是否已经显示了媒体信息
    function hasExistingMediaInfo() {
        // 检查是否已经显示了媒体信息元素
        return domUtils.elementExists('#emby-status-info') || domUtils.elementExists('.mediaFileInfo');
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
            // 移除现有的媒体信息显示
            const existingInfo = document.getElementById('emby-status-info');
            if (existingInfo && existingInfo.parentNode) {
                existingInfo.parentNode.removeChild(existingInfo);
            }

            const itemId = extractItemId();
            logger.debug('提取的项目ID:', itemId);

            if (!itemId) {
                logger.error('无法提取项目ID，URL哈希:', window.location.hash);
                showStatusMessage('无法识别当前项目ID，请确保您在媒体详情页面', 'error');
                return;
            }

            // 清除此项目的缓存
            const cacheKey = `media_info_${itemId}`;
            cache.remove(cacheKey);

            try {
                // 获取API客户端
                const apiClient = getApiClient();
                if (!apiClient) {
                    showStatusMessage('无法获取Emby API客户端', 'error');
                    return;
                }

                const userId = apiClient._serverInfo ? apiClient._serverInfo.UserId : apiClient.getCurrentUserId();

                // 先获取项目信息，判断类型
                showStatusMessage('正在获取项目信息...');
                const itemInfo = await apiClient.getItem(userId, itemId);

                logger.debug('获取到的项目信息:', itemInfo);

                // 根据项目类型决定处理方式
                if (itemInfo.Type === 'Series') {
                    // 电视剧系列
                    showStatusMessage('正在分析电视节目...');
                    const episodes = await getTvShowEpisodes(itemId);

                    if (episodes.length > 0) {
                        showMediaInfoSummary(episodes);
                    } else {
                        showStatusMessage('没有找到剧集信息，或者该剧没有分季', 'error');
                    }
                } else if (itemInfo.Type === 'Season') {
                    // 季
                    showStatusMessage('正在获取季信息...');
                    const episodes = await getTvShowEpisodes(itemId);

                    if (episodes.length > 0) {
                        showMediaInfoSummary(episodes);
                    } else {
                        showStatusMessage('没有找到剧集信息', 'error');
                    }
                } else if (itemInfo.Type === 'Episode') {
                    // 单集
                    await getMediaInfo(itemId, 'episode');
                } else {
                    // 电影或其他
                    await getMediaInfo(itemId, 'movie');
                }
            } catch (error) {
                logger.error('处理媒体信息出错:', error);
                showStatusMessage(`处理媒体信息失败: ${error.message}`, 'error');

                // 出错时尝试直接获取媒体信息
                try {
                    await getMediaInfo(itemId, 'movie');
                } catch (fallbackError) {
                    logger.error('备用方法也失败:', fallbackError);
                }
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
        // 更新UI，只添加按钮，不自动获取
        addActionButtons();

        // 日志显示当前环境
        const envInfo = getEnvironmentInfo();
        logger.debug('当前环境信息:', envInfo);
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

    // 获取脚本运行环境信息
    function getEnvironmentInfo() {
        let info = {
            url: window.location.href,
            hash: window.location.hash,
            apiAvailable: typeof ApiClient !== 'undefined',
            browser: navigator.userAgent
        };

        return info;
    }

    // 检查Emby API是否可用
    function checkEmbyApi() {
        // 等待API可用
        const waitForApi = (maxTries = 20, interval = 150) => {
            return new Promise((resolve) => {
                let tries = 0;

                const check = () => {
                    if (typeof ApiClient !== 'undefined') {
                        logger.info('找到Emby API客户端');
                        resolve(true);
                        return;
                    }

                    if (typeof window.ApiClient !== 'undefined') {
                        logger.info('找到window.ApiClient');
                        resolve(true);
                        return;
                    }

                    tries++;
                    if (tries < maxTries) {
                        setTimeout(check, interval);
                    } else {
                        logger.error('等待Emby API超时');
                        resolve(false);
                    }
                };

                check();
            });
        };

        return waitForApi();
    }

    // 初始化
    async function init() {
        // 等待页面加载
        await sleep(1000);

        const envInfo = getEnvironmentInfo();
        logger.info('Emby媒体信息获取助手启动中...', envInfo);
        logger.info('脚本版本: 3.2 (已修复API访问方式)');

        // 等待Emby API可用
        const apiAvailable = await checkEmbyApi();

        if (apiAvailable) {
            logger.info('Emby API可用，脚本初始化完成');
            main();
            setupURLChangeListener();
        } else {
            logger.error('Emby API不可用，将使用有限功能');
            // 仍然尝试初始化，但功能可能受限
            main();
            setupURLChangeListener();
        }
    }

    // 启动脚本
    init();
})();