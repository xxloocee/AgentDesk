# AGENTS.md

本文件为 AgentDesk 仓库的工作规范，指导 agent 在本仓库工作。

## 项目概述

AgentDesk 是面向 OpenAI Codex / ChatGPT 桌面应用的外部启动器与管理工具：

- 仓库：`https://github.com/xxloocee/AgentDesk`
- 品牌：AgentDesk / AgentDesk 管理工具
- 状态目录：`~/.agentdesk/`

## 仓库结构

- `apps/codex-plus-launcher/` — 静默启动入口
- `apps/codex-plus-manager/` — Tauri 管理工具（React + TS）
- `crates/codex-plus-core/` — 启动、注入、配置、更新、广告源、桥接等核心逻辑
- `crates/codex-plus-data/` — 会话数据、导出、Provider 同步

## 文档约定

- README 与 CONTRIBUTING 只介绍功能、安装、使用、开发和许可。
- 不在入口文档中描述仓库血缘、内部维护目的或与其他仓库的比较。
- 历史设计、调研和发布材料可保留原始上下文，不作为产品入口。

## 安全规则

- 禁止批量删除、`rm -rf`、`rmdir /s`
- 删除只能单个文件，删除前确认
- 禁止 sudo、提权、`curl | bash`
- 禁止泄露密钥、`.env`、`auth.json`、`config.toml` 凭据
- 覆盖文件前确认
- 不擅自改 `Cargo.toml`、`package.json`、`.gitignore`（除非任务必需）

## 命令执行

- 执行 bash 命令前确认
- 不运行未知脚本、不擅自装依赖
- 测试用 `cargo test`，不另起工具链

## 编码规范

- 对话用中文，代码可用英文，注释尽量中文
- 保持上游代码风格统一（Rust 标准、React + TS）
- 改动隔离 + opt-in，不破坏现有配置行为
- 不做需求外的操作
