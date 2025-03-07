// ==UserScript==
// @name         Emby助手-获取emby媒体信息
// @namespace    http://tampermonkey.net/
// @version      0.0.1
// @description  支持全站使用的Emby助手，高效获取媒体信息并支持API KEY安全存储
// @license      MIT
// @author       优化版
// @match        *://*/web/index.html*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';

    // 存储设置
    const CONFIG = {
        apiKey: GM_getValue('emby_api_key', ''),
        serverUrl: GM_getValue('emby_server_url', '')
    };

    // 添加设置菜单
    GM_registerMenuCommand('设置Emby API令牌', setApiKey);
    GM_registerMenuCommand('设置Emby服务器地址', setServerUrl);

    // 设置API KEY
    function setApiKey() {
        const newApiKey = prompt('请输入你的Emby API令牌:', CONFIG.apiKey);
        if (newApiKey !== null) {
            GM_setValue('emby_api_key', newApiKey);
            CONFIG.apiKey = newApiKey;
            alert('API令牌已保存!');
        }
    }

    // 设置服务器地址
    function setServerUrl() {
        const newServerUrl = prompt('请输入Emby服务器地址 (例如: http://192.168.31.150:8090):', CONFIG.serverUrl);
        if (newServerUrl !== null) {
            GM_setValue('emby_server_url', newServerUrl);
            CONFIG.serverUrl = newServerUrl;
            alert('服务器地址已保存!');
        }
    }

    // 检查配置
    function checkConfig() {
        if (!CONFIG.apiKey) {
            if (confirm('未设置Emby API令牌，是否现在设置?')) {
                setApiKey();
                return false;
            }
            return false;
        }

        if (!CONFIG.serverUrl) {
            if (confirm('未设置Emby服务器地址，是否现在设置?')) {
                setServerUrl();
                return false;
            }
            return false;
        }

        return true;
    }

    // 从URL中提取参数
    function extractIdFromHash() {
        const hash = window.location.hash;
        const idMatch = hash.match(/id=([^&]+)/);
        const serverIdMatch = hash.match(/serverId=([^&]+)/);

        if (idMatch && serverIdMatch) {
            return {
                itemId: idMatch[1],
                serverId: serverIdMatch[1]
            };
        }
        return null;
    }

    // 主函数 - 获取媒体信息
    function getMediaInfo() {
        if (!checkConfig()) {
            return;
        }

        const ids = extractIdFromHash();

        if (!ids) {
            console.error("无法从URL获取必要的参数");
            return;
        }

        const { itemId } = ids;
        const apiUrl = `${CONFIG.serverUrl}/Items/${itemId}/PlaybackInfo`;

        // 添加状态提示
        const statusDiv = document.createElement('div');
        statusDiv.id = 'emby-status-info';
        statusDiv.style.cssText = 'position: fixed; top: 10px; right: 10px; padding: 10px; background: rgba(0,0,0,0.7); color: white; z-index: 9999; border-radius: 5px;';
        statusDiv.textContent = '正在获取媒体信息...';
        document.body.appendChild(statusDiv);

        // 使用Promise进行请求
        const fetchMediaInfo = () => {
            return new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: "GET",
                    url: apiUrl,
                    headers: {
                        "X-Emby-Token": CONFIG.apiKey,
                        "Content-Type": "application/json"
                    },
                    timeout: 10000, // 10秒超时
                    onload: function (response) {
                        if (response.status === 200) {
                            resolve(JSON.parse(response.responseText));
                        } else {
                            reject(`请求失败: ${response.status} ${response.statusText}`);
                        }
                    },
                    onerror: function (error) {
                        reject(`请求错误: ${error}`);
                    },
                    ontimeout: function () {
                        reject('请求超时');
                    }
                });
            });
        };

        // 使用Fetch API并添加重试机制
        const fetchWithRetry = (maxRetries = 3, delay = 1000) => {
            let retries = 0;

            const attempt = () => {
                return fetchMediaInfo().catch(error => {
                    if (retries < maxRetries) {
                        retries++;
                        statusDiv.textContent = `获取失败，正在重试 (${retries}/${maxRetries})...`;
                        return new Promise(resolve => setTimeout(resolve, delay))
                            .then(attempt);
                    }
                    throw error;
                });
            };

            return attempt();
        };

        // 执行请求
        fetchWithRetry()
            .then(data => {
                console.log("媒体信息获取成功:", data);

                // 显示结果
                statusDiv.innerHTML = `
                    <div style="max-height: 80vh; overflow-y: auto;">
                        <h3 style="margin-top: 0;">媒体信息获取成功</h3>
                        <div style="max-height: 60vh; overflow-y: auto;">
                            <pre style="white-space: pre-wrap; word-break: break-all;">${JSON.stringify(data, null, 2)}</pre>
                        </div>
                        <button id="close-emby-info" style="margin-top: 10px; padding: 5px 10px;">关闭</button>
                    </div>
                `;

                document.getElementById('close-emby-info').addEventListener('click', function () {
                    document.body.removeChild(statusDiv);
                });

                // 获取媒体源信息
                if (data && data.MediaSources && data.MediaSources.length > 0) {
                    // 可以在这里添加更多处理，例如请求获取元数据或刷新元数据
                    const mediaSource = data.MediaSources[0];
                    console.log("媒体源路径:", mediaSource.Path);

                    // 可以添加对元数据的进一步处理
                }
            })
            .catch(error => {
                statusDiv.innerHTML = `
                    <div>
                        <h3 style="margin-top: 0; color: #ff6b6b;">获取媒体信息失败</h3>
                        <p>${error}</p>
                        <button id="close-emby-info" style="margin-top: 10px; padding: 5px 10px;">关闭</button>
                    </div>
                `;

                document.getElementById('close-emby-info').addEventListener('click', function () {
                    document.body.removeChild(statusDiv);
                });

                console.error("获取媒体信息失败:", error);
            });
    }

    // 监听URL变化
    function setupURLChangeListener() {
        let lastURL = window.location.href;

        // 定义轮询函数
        const checkURLChange = () => {
            if (lastURL !== window.location.href) {
                lastURL = window.location.href;
                if (window.location.hash.includes('#!/item?id=')) {
                    // 等待页面加载完成
                    setTimeout(getMediaInfo, 1500);
                }
            }
        };

        // 设置轮询间隔
        setInterval(checkURLChange, 1000);
    }

    // 添加手动刷新按钮
    function addRefreshButton() {
        const refreshButton = document.createElement('button');
        refreshButton.textContent = '刷新媒体信息';
        refreshButton.style.cssText = 'position: fixed; bottom: 20px; right: 20px; padding: 10px; background: #00a8ff; color: white; border: none; border-radius: 5px; cursor: pointer; z-index: 9999;';

        refreshButton.addEventListener('click', function () {
            if (window.location.hash.includes('#!/item?id=')) {
                getMediaInfo();
            } else {
                // 显示提示
                const noticeDiv = document.createElement('div');
                noticeDiv.style.cssText = 'position: fixed; top: 10px; right: 10px; padding: 10px; background: rgba(0,0,0,0.7); color: white; z-index: 9999; border-radius: 5px;';
                noticeDiv.innerHTML = `
                    <div>
                        <h3 style="margin-top: 0;">提示</h3>
                        <p>请在媒体详情页面使用此功能</p>
                        <button id="close-notice" style="margin-top: 10px; padding: 5px 10px;">知道了</button>
                    </div>
                `;
                document.body.appendChild(noticeDiv);

                document.getElementById('close-notice').addEventListener('click', function () {
                    document.body.removeChild(noticeDiv);
                });
            }
        });

        document.body.appendChild(refreshButton);
    }

    // 添加跳转到媒体库按钮
    function addLibraryButton() {
        const libraryButton = document.createElement('button');
        libraryButton.textContent = '前往媒体库';
        libraryButton.style.cssText = 'position: fixed; bottom: 20px; right: 160px; padding: 10px; background: #4caf50; color: white; border: none; border-radius: 5px; cursor: pointer; z-index: 9999;';

        libraryButton.addEventListener('click', function () {
            window.location.hash = '#!/library.html';
        });

        document.body.appendChild(libraryButton);
    }

    // 初始化
    function init() {
        // 等待页面完全加载
        setTimeout(() => {
            // 只在媒体详情页执行获取媒体信息
            if (window.location.hash.includes('#!/item?id=')) {
                getMediaInfo();
            }

            // 无论在哪个页面都设置监听器和添加按钮
            setupURLChangeListener();
            addRefreshButton();
            addLibraryButton();
        }, 2000);
    }

    // 启动脚本
    init();
})();