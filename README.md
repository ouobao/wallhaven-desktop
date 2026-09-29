# Wallhaven Studio

Wallhaven 的 Windows 桌面客户端，使用官方 Wallhaven API 提供实时浏览和下载能力。

## 已实现功能

- 发现、最新上传、热门榜单、随机探索
- 关键词、标签、`@用户名` 搜索
- 分类、纯净度、榜单时间、排序方向、最低/精确分辨率、画面比例、主色调筛选
- 壁纸详情、标签搜索、相似壁纸、上传者与文件信息
- 原图下载、选择下载目录、设置为 Windows 桌面壁纸
- 本地收藏，保存完整壁纸信息，重启后仍可使用
- Wallhaven API Key 连接、官方浏览偏好同步、私有/公开 collections 浏览
- `Ctrl + K` 聚焦搜索框、网格/列表视图、侧栏折叠、高对比度主题
- 无网络或未配置 API 时提供演示预览，并明确显示当前连接状态

## 账号连接

Wallhaven 官方 API 使用 API Key，而不是把站内密码交给第三方客户端。打开应用里的“账户连接”，从 Wallhaven 的 `Account Settings` 生成 API Key 并粘贴即可。

API Key 会通过 Electron 的系统安全存储保存。应用不保存站内密码；NSFW 内容和私有 collections 需要有效 API Key。

## 开发

```bash
pnpm install
pnpm run dev
```

## 构建 Windows 安装程序

```bash
pnpm run dist
```

安装器会输出到 `release/Wallhaven-Studio-Setup-1.0.0.exe`，安装向导默认创建桌面快捷方式。

## API 说明

Wallhaven 官方公开 API 不提供完整的站内登录会话、收藏写入和上传接口，因此客户端将收藏作为本地收藏保存；个人 collections、账户浏览设置和受限内容使用官方 API Key 读取。
