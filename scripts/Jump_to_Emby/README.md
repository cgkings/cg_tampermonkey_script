# Jump to Emby（跳转到Emby播放）

## 功能介绍

这是一个强大的油猴脚本，可以帮助您在浏览JavBus、JavDB、Supjav和色花堂网站时，自动检测这些网站上的视频是否存在于您的Emby媒体库中。脚本提供以下功能：

- 在列表页中自动高亮显示Emby中已有的视频
- 在详情页中提供一键跳转到Emby的按钮
- 支持多个主流网站（JavBus、JavDB、Supjav、色花堂）
- 完全可自定义的配置选项
- 优化的并发请求，快速检测大量视频

## 安装方法

1. 首先，您需要安装一个用户脚本管理器：
   - [Tampermonkey](https://www.tampermonkey.net/)（推荐）
   - Violentmonkey
   - Greasemonkey
2. 安装完成后，[点击此处安装脚本](https://greasyfork.org/scripts/你的脚本ID/跳转到Emby播放)

## 配置说明

首次使用时，您需要设置Emby服务器信息：

1. 在脚本启用的页面上，点击Tampermonkey图标
2. 在弹出菜单中选择"Emby 设置"
3. 填写以下信息：
   - **Emby 服务器地址**：您的Emby服务器URL，例如`http://192.168.1.100:8096/`（确保包含http://前缀和最后的斜杠）
   - **Emby API密钥**：在Emby设置中获取的API密钥
   - **高亮颜色**：用于高亮显示的颜色
   - **最大并发请求数**：同时进行的最大请求数量（因为是本地请求，可以设置较大值）
   - **徽章大小**：用于设置徽章大小
   - **徽章背景颜色**：用于徽章背景显示的颜色
   - **徽章文字颜色**：用于徽章文字显示的颜色
4. 点击"保存"按钮完成设置

## 如何获取Emby API密钥

1. 登录您的Emby管理界面
2. 点击左侧菜单的"管理"
3. 选择"API密钥"
4. 点击"+"添加新的API密钥
5. 输入一个名称（如"Jump to Emby脚本"）
6. 复制生成的API密钥

## 使用技巧

- 脚本会自动在支持的网站上运行，无需手动激活
- 在列表页面上，Emby中已有的视频会被绿色边框高亮显示
- 在详情页面上，如果视频在Emby中存在，会显示一个"跳转到emby👉"的绿色按钮
- 点击该按钮将直接打开Emby并播放对应视频

## 支持的网站

- JavBus（[www.javbus.com）](http://www.javbus.com）)
- JavDB（javdb.com及其镜像站）
- 色花堂论坛（sehuatang.net及其镜像站）
- Supjav.com
- 其他使用类似URL结构的论坛（支持thread-*和forum.php?mod=viewthread&tid=*格式的URL）

## 隐私说明

- 所有请求仅在您的本地网络中进行，不会将您的观看偏好发送到任何第三方服务器
- 脚本仅在支持的网站上运行，不会影响其他网站
- 所有配置信息存储在您的浏览器本地

## 常见问题

**Q: 设置后脚本不工作怎么办？** A: 请检查以下几点：

- 确保Emby服务器地址格式正确，包含http://前缀和最后的斜杠
- 确保API密钥正确无误
- 确保您的浏览器能够访问Emby服务器
- 刷新页面重试

**Q: 为什么只有部分视频被高亮？** A: 脚本只会高亮在您Emby库中存在的视频。如果视频未被高亮，表示您的Emby库中没有该视频，或者番号格式不匹配。

**Q: 脚本会影响网站加载速度吗？** A: 脚本使用了优化的并发请求和缓存机制，对网站加载速度的影响很小。您可以通过调整最大并发请求数来平衡速度和性能。

## 反馈与贡献

如果您遇到任何问题或有改进建议，请通过以下方式联系：

- [提交Issue](https://github.com/cgkings/tampermonkey_scripts/issues)
- [贡献代码](https://github.com/cgkings/tampermonkey_scripts)

## 许可证

本脚本基于MIT许可证发布。

------

## 技术细节

脚本使用了现代JavaScript特性，包括：

- 异步/等待（Async/Await）模式处理API请求
- Promise队列控制并发请求
- DOM变化观察器（MutationObserver）处理动态加载内容
- 单例模式状态指示器
- 工厂模式处理不同站点的策略

## 更新日志

### v0.0.8

- 增加自定义徽章大小、背景和文字颜色

### v0.0.7

- 增加supjav网站支持
- 清单页修改标识为圆角黑底白字彩虹边框徽章

### v0.0.6

- 删除缓存设置
- 重构代码逻辑，优化查询效率

### v0.0.5

- 修复sehuatang标注显示

### v0.0.3

- 重构代码结构，精简冗余代码
- 兼容性处理
- 状态指示默认关闭自动隐藏


### v0.0.2

- 增加状态指示器
- 表页修改优化emby api批量查询接口

### v0.0.1

- 首次发布
- 支持JavBus、JavDB和色花堂等网站
- 添加自定义配置选项
- 实现列表页高亮和详情页跳转功能