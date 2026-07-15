# HANDOVER — AgentDesk

## 当前状态

- 提供静默启动入口和 Tauri 管理工具。
- 支持供应商切换、协议转换、会话管理、Codex 增强、脚本管理、诊断与更新。
- Windows 重启命令会在旧进程退出并检测到新 Codex 进程后才返回成功。
- 应用状态保存在 `~/.agentdesk/`。

## 关键模块

| 路径 | 作用 |
| --- | --- |
| `apps/codex-plus-launcher/` | 静默启动 Codex 并加载配置 |
| `apps/codex-plus-manager/` | 管理供应商、会话、增强功能和维护工具 |
| `crates/codex-plus-core/` | 启动、注入、配置、更新、安装与桥接逻辑 |
| `crates/codex-plus-data/` | 会话数据、导出与 Provider 同步 |

## 常用验证

```bash
cargo fmt --all -- --check
cargo test

cd apps/codex-plus-manager
npm run check
npm run vite:build
```

## 本地打包

Windows 安装包与便携包输出到 `dist/windows/`；安装器未签名时，SmartScreen 可能显示未知发布者。
