// ==UserScript==
// @name         Javdb评分筛选
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  突出显示好评番号，淡化评价的的
// @author       Uka
// @match        https://javdb.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=javdb.com
// @grant        none
// @license MIT
// @downloadURL https://update.greasyfork.org/scripts/451530/Javdb%E8%AF%84%E5%88%86%E7%AD%9B%E9%80%89.user.js
// @updateURL https://update.greasyfork.org/scripts/451530/Javdb%E8%AF%84%E5%88%86%E7%AD%9B%E9%80%89.meta.js
// ==/UserScript==

(function () {
    'use strict';
    // 获取所有番号元素
    let items = document.getElementsByClassName("item");
    // 遍历每个番号元素
    for (let i = 0; i < items.length; i++) {
        // 获取评分和评价数量
        let scores = items[i].getElementsByClassName("value")[0].textContent.match(/\d+(.\d+)?/g);
        // 如果评分和评价数量都存在
        if (scores.length == 2) {
            // 如果评分小于 4.0 或者 (评分小于等于 4.3 且评价数量小于 50)，则淡化显示
            if (parseFloat(scores[0]) < 4.0 || (parseFloat(scores[0]) <= 4.3 && parseInt(scores[1]) < 50)) {
                items[i].setAttribute("style", "opacity:30%");
            }
            // 如果评分大于 4.0 且评价数量大于 300，则加粗边框显示为红色
            if (parseFloat(scores[0]) > 4.0 && parseInt(scores[1]) > 300) {
                items[i].setAttribute("style", "border-width: 5px;border-style:solid;border-color:red;");
            }
            // 如果评分大于 4.2 且评价数量大于 1000，则添加渐变背景色为橙色至绿色
            if (parseFloat(scores[0]) > 4.2 && parseInt(scores[1]) > 1000) {
                items[i].children[0].setAttribute("style", "background:linear-gradient(orange 70%, yellow 85%, green 100%)");
            }
        }
    }
})();
