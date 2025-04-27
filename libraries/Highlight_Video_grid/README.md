# 视频网格标注工具库使用说明

## 简介

视频网格标注工具库是一个专为 JavDB、JavBus、SupJav 等成人视频网站设计的油猴脚本工具库，能够统一处理这些网站的网格列表页面，提供丰富的视觉标注功能。通过这个库，你可以轻松实现以下效果：

- 根据评分淡化或高亮视频条目
- 为特定条目添加自定义边框（普通或彩虹边框）
- 设置自定义背景颜色或渐变
- 高亮显示标题中的特定关键词
- 为条目添加自定义徽章
- 以及更多视觉增强效果

## 安装方法

有两种方式使用这个库：

### 1. 直接在油猴脚本中引用

javascript

```javascript
// ==UserScript==
// @name         我的视频网站增强脚本
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  增强视频网站的浏览体验
// @author       你的名字
// @match        *://javdb*.com/*
// @match        *://www.javbus.com/*
// @match        *://supjav.com/*
// @require      https://raw.githubusercontent.com/cgkings/cg_tampermonkey_script/main/Highlight_Video_grid.js
// @grant        none
// ==/UserScript==
```

### 2. 复制库代码到自己的脚本中

将视频网格标注工具库的代码复制到你的脚本开头，然后使用 `AVGridMarker` 对象进行操作。

## 基本用法

### 初始化

首先需要初始化标记器：

javascript

```javascript
// 初始化标记器
const marker = AVGridMarker.init();
if (!marker) return; // 如果不是支持的网站，直接退出
```

### 淡化低评分视频

javascript

```javascript
// 淡化评分低于7.0的视频
marker.fade(null, {
    level: 'strong',  // 可选: strong, medium, light 或具体数值
    condition: (item) => {
        const rating = marker.extractRating(item);
        return rating && rating.score < 7.0;
    },
    hover: true  // 鼠标悬停时恢复不透明度
});
```

### 高亮高评分视频

javascript

```javascript
// 高亮评分高于9.0且评价数超过1000的视频
marker.highlight(null, {
    color: '#4CAF50',  // 边框颜色
    backgroundColor: 'rgba(76, 175, 80, 0.1)',  // 背景颜色（可选）
    condition: (item) => {
        const rating = marker.extractRating(item);
        return rating && rating.score > 9.0 && rating.count > 1000;
    }
});
```

### 添加彩虹边框

javascript

```javascript
// 为无码视频添加彩虹边框
marker.border(null, {
    rainbow: true,
    condition: (item) => {
        const title = item.querySelector(marker.site.selectors.title)?.textContent;
        return title && (title.includes('无码') || title.includes('破解'));
    }
});
```

### 添加徽章标识

javascript

```javascript
// 为特定番号添加徽章
marker.addBadge(null, 'HD', {
    backgroundColor: '#FF5722',
    textColor: '#FFFFFF',
    position: 'top-right',  // 可选: top-right, top-left, bottom-right, bottom-left
    size: 'medium',  // 可选: small, medium, large
    rainbow: true,  // 是否使用彩虹边框
    condition: (item) => {
        const code = marker.extractCode(item);
        return code && ['ABC-123', 'XYZ-789'].includes(code);
    }
});
```

### 文本关键词高亮

javascript

```javascript
// 高亮标题中的关键词
marker.textHighlight(null, {
    text: ['无码', '破解', 'uncensored'],
    backgroundColor: '#FF9800',
    color: '#FFFFFF'
});
```

### 自定义样式集

javascript

```javascript
// 定义自定义样式集
marker.styleSet('premium', {
    borderWidth: '3px',
    borderStyle: 'solid',
    borderColor: 'gold',
    boxShadow: '0 0 10px rgba(255, 215, 0, 0.5)'
});

// 应用自定义样式集
marker.mark(null, (item) => {
    const code = marker.extractCode(item);
    if (code && ['ABC-123', 'XYZ-789'].includes(code)) {
        return 'premium';  // 返回样式名称
    }
    return false;  // 不应用样式
});
```

## 高级功能

### 自定义背景色

javascript

```javascript
// 设置渐变背景
marker.background(null, {
    gradient: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
    condition: (item) => {
        // 条件判断
        return true;
    }
});
```

### 组合多种效果

可以链式调用多个方法，组合多种视觉效果：

javascript

```javascript
marker
    .fade(null, { 
        level: 'medium',
        condition: item => /* 条件 */
    })
    .highlight(null, {
        color: '#E91E63',
        condition: item => /* 条件 */
    })
    .addBadge(null, '喜欢', {
        backgroundColor: '#9C27B0',
        condition: item => /* 条件 */
    });
```

## 注册新站点

如果你需要支持其他类似网站，可以注册新的站点配置：

javascript

```javascript
AVGridMarker.registerSite({
    name: 'mysite',
    domains: ['mysite.com'],
    selectors: {
        grid: '.video-grid .item',
        title: '.video-title',
        code: '.video-code',
        cover: '.video-cover',
        rating: '.video-rating'
    },
    extractors: {
        code: el => el.querySelector('.video-code')?.textContent?.trim(),
        rating: el => {
            const text = el.querySelector('.video-rating')?.textContent;
            if (!text) return null;
            const match = text.match(/(\d+\.\d+)/);
            return match ? { score: parseFloat(match[1]) } : null;
        }
    }
});
```

## API 参考

### 主要方法

```
方法说明
init()初始化标记器
mark(selector, condition, styles)核心标记方法
fade(selector, options)淡化元素
border(selector, options)添加边框
background(selector, options)设置背景
highlight(selector, options)高亮元素
textHighlight(selector, options)高亮文本关键词
addBadge(selector, text, options)添加徽章
styleSet(name, styles)定义样式集
extractCode(element)提取番号
extractRating(element)提取评分
stop()停止所有观察
```

### 条件函数

所有标记方法都支持条件函数 `condition`，用于决定是否应用样式：

javascript

```javascript
condition: (element) => {
    // 返回 true/false 决定是否应用样式
    // 或者返回样式名称字符串
}
```

## 实际应用示例

以下是一个完整的使用示例：

javascript

```javascript
// ==UserScript==
// @name         JavDB增强
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  增强JavDB浏览体验
// @author       你的名字
// @match        *://javdb*.com/*
// @require      https://raw.githubusercontent.com/cgkings/cg_tampermonkey_script/main/Highlight_Video_grid.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    
    // 初始化标记器
    const marker = AVGridMarker.init();
    if (!marker) return;
    
    // 定义偏好关键词
    const favoriteKeywords = ['无码', '破解', '高清'];
    
    // 淡化低评分视频
    marker.fade(null, {
        level: 'strong',
        condition: (item) => {
            const rating = marker.extractRating(item);
            return rating && (rating.score < 7.0 || rating.count < 30);
        },
        hover: true
    });
    
    // 高亮高评分视频
    marker.highlight(null, {
        color: '#4CAF50',
        backgroundColor: 'rgba(76, 175, 80, 0.05)',
        condition: (item) => {
            const rating = marker.extractRating(item);
            return rating && rating.score > 9.0 && rating.count > 500;
        }
    });
    
    // 为包含特定关键词的标题添加彩虹边框
    marker.border(null, {
        rainbow: true,
        width: '3px',
        condition: (item) => {
            const title = item.querySelector(marker.site.selectors.title)?.textContent;
            if (!title) return false;
            return favoriteKeywords.some(keyword => title.includes(keyword));
        }
    });
    
    // 高亮标题中的关键词
    marker.textHighlight(null, {
        text: favoriteKeywords,
        backgroundColor: '#FF9800',
        color: '#FFFFFF'
    });
    
    // 为特定喜欢的番号添加收藏徽章
    const favoriteCodes = ['IPX-123', 'SSNI-456', 'MIDE-789'];
    marker.addBadge(null, '⭐', {
        backgroundColor: '#FFC107',
        textColor: '#000000',
        position: 'top-right',
        size: 'medium',
        rainbow: true,
        condition: (item) => {
            const code = marker.extractCode(item);
            return code && favoriteCodes.includes(code);
        }
    });
})();
```

## 注意事项

1. 所有方法的 `selector` 参数可以传 `null`，会自动使用站点默认的网格选择器
2. 库会自动处理元素复用问题，避免重复处理同一元素
3. 库已内置对动态加载内容的支持，无需额外处理
4. 当前支持的网站有 JavDB、JavBus、SupJav，可以通过 `registerSite` 方法扩展

## 问题排查

如果遇到标记不生效的问题，请检查：

1. 确认当前网站是否被支持
2. 检查条件函数是否正确返回 `true` 或样式名
3. 使用浏览器控制台查看是否有错误信息
4. 确认网站布局是否有变化，可能需要更新选择器

## 贡献与反馈

如需报告问题或贡献代码，请访问 GitHub 仓库： https://github.com/cgkings/cg_tampermonkey_script

## 许可证

MIT 许可证