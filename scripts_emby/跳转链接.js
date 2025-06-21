(function () {
    'use strict';

    // 番号提取逻辑
    var codePatterns = [
        /([a-zA-Z]{2,15})[-\s]?(\d{2,15})/i,
        /(FC2)[-\s]?(PPV)[-\s]?(\d{6,7})/i,
        /(\d{3,4}[a-zA-Z]{2,15}[-\s]?\d{2,15})/i,
        /([a-zA-Z0-9]+_\d+)/i,
        /([a-zA-Z0-9]+-\d+)/i,
        /([A-Z]{3,6}\d{3,4})/,
        /([a-zA-Z]{2,15}\d{3,5})/i
    ];

    // 提取番号函数
    function extractCode(title) {
        if (!title) return null;

        for (var i = 0; i < codePatterns.length; i++) {
            var match = title.match(codePatterns[i]);
            if (match) {
                if (match[0].toLowerCase().includes('fc2')) {
                    return 'FC2-PPV-' + match[3];
                }
                return match[0].replace(/\s+/g, '-').toUpperCase();
            }
        }
        return null;
    }

    // 创建跳转链接
    function createJumpLinks(code) {
        var linkContainer = document.createElement('div');
        linkContainer.style.cssText = `
            margin: 10px 0;
            padding: 10px;
            background: rgba(0,0,0,0.3);
            border-radius: 5px;
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
        `;

        // 定义跳转站点
        var sites = [
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

        // 添加标题
        var title = document.createElement('span');
        title.textContent = '番号: ' + code;
        title.style.cssText = `
            color: #fff;
            font-weight: bold;
            margin-right: 15px;
            line-height: 32px;
        `;
        linkContainer.appendChild(title);

        // 创建链接按钮
        sites.forEach(function (site) {
            var link = document.createElement('a');
            link.href = site.url;
            link.target = '_blank';
            link.textContent = site.name;
            link.style.cssText = `
                display: inline-block;
                padding: 6px 12px;
                background: ${site.color};
                color: white;
                text-decoration: none;
                border-radius: 4px;
                font-size: 12px;
                transition: opacity 0.3s;
            `;

            link.onmouseover = function () { this.style.opacity = '0.8'; };
            link.onmouseout = function () { this.style.opacity = '1'; };

            linkContainer.appendChild(link);
        });

        return linkContainer;
    }

    // 主函数
    function addCodeLinks() {
        // 尝试多种方式获取标题
        var titleElement = document.querySelector('.itemName') ||
            document.querySelector('.detailPagePrimaryTitle') ||
            document.querySelector('h1') ||
            document.querySelector('[data-testid="item-name"]');

        if (!titleElement) {
            console.log('未找到标题元素');
            return;
        }

        var title = titleElement.textContent || titleElement.innerText;
        var code = extractCode(title);

        if (!code) {
            console.log('未提取到番号:', title);
            return;
        }

        console.log('提取到番号:', code);

        // 检查是否已经添加过链接
        if (document.querySelector('.custom-code-links')) {
            return;
        }

        // 创建链接容器
        var linkContainer = createJumpLinks(code);
        linkContainer.className = 'custom-code-links';

        // 找到合适的位置插入链接
        var insertTarget = document.querySelector('.itemDetailPage .detailPageContent') ||
            document.querySelector('.itemDetail') ||
            document.querySelector('.detailPagePrimaryContainer') ||
            titleElement.parentNode;

        if (insertTarget) {
            // 插入到标题后面
            if (titleElement.parentNode === insertTarget) {
                titleElement.parentNode.insertBefore(linkContainer, titleElement.nextSibling);
            } else {
                insertTarget.insertBefore(linkContainer, insertTarget.firstChild);
            }
        }
    }

    // 等待页面加载
    function waitForPage() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function () {
                setTimeout(addCodeLinks, 1000);
            });
        } else {
            setTimeout(addCodeLinks, 1000);
        }
    }

    // 监听页面变化（SPA应用）
    var observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
            if (mutation.addedNodes.length > 0) {
                setTimeout(addCodeLinks, 500);
            }
        });
    });

    // 开始观察
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // 初始执行
    waitForPage();

    // 路由变化监听
    window.addEventListener('popstate', function () {
        setTimeout(addCodeLinks, 1000);
    });

})();
