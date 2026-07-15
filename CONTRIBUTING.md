# Contributing to AgentDesk

Thank you for your interest in contributing to AgentDesk.

## Development Setup

1. **Clone the repository**

```bash
git clone https://github.com/xxloocee/AgentDesk.git
cd AgentDesk
```

2. **Install Rust toolchain**

Ensure you have Rust 1.85+ installed:

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustc --version
```

3. **Build the project**

```bash
cargo build --release
```

4. **Run tests**

```bash
cargo test
```

## Project Structure

```text
AgentDesk/
├── apps/
│   ├── codex-plus-launcher/   # Silent launcher
│   └── codex-plus-manager/    # Tauri manager UI
├── crates/
│   ├── codex-plus-core/       # Core launch / inject / config logic
│   └── codex-plus-data/       # Session data and provider sync
└── README.md
```

## Making Changes

1. Create a feature branch:

```bash
git checkout -b feat/your-feature-name
```

2. Make your changes:
   - Prefer small, reviewable diffs
   - Add tests for new behavior
   - Update user-facing documentation when behavior changes

3. Run checks:

```bash
cargo test --all-features
cargo fmt --all -- --check
cargo clippy
```

4. Commit with a clear message:

```bash
git commit -m "feat: add your feature description"
```

## Code Style

- Follow Rust standard formatting (`cargo fmt`)
- Use `clippy` for linting recommendations
- Prefer clear names over clever abstractions
- Add doc comments (`///`) for public APIs

## Pull Request Process

1. Keep the PR focused on one change
2. Include tests when behavior changes
3. Describe the user-visible impact

## Reporting Issues

- Use GitHub Issues for bug reports and feature requests
- Include Rust version (`rustc --version`) and OS information
- For bugs, provide minimal reproduction steps
- Never paste real API keys, `auth.json`, or private config

## License

By contributing, you agree that your contributions will be licensed under the project's [GNU Affero General Public License v3.0](LICENSE), using the SPDX identifier `AGPL-3.0-only`.
