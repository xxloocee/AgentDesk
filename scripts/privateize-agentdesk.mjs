import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const config = JSON.parse(fs.readFileSync(path.join(root, "scripts", "privateize-agentdesk.config.json"), "utf8"));
const args = new Set(process.argv.slice(2));
const apply = args.has("--apply");
const dryRun = args.has("--dry-run") || !apply;
const auditOnly = args.has("--audit");
const verifyUpstream = args.has("--verify-upstream");

const bundledSkinPackThemePaths = new Set([
  "assets/inject/upstream/skin-packs/packs/caishen-lite/theme.json",
  "assets/inject/upstream/skin-packs/packs/caishen-max/theme.json",
  "assets/inject/upstream/skin-packs/packs/caishen-readable/theme.json",
  "assets/inject/upstream/skin-packs/packs/export-night/theme.json",
  "assets/inject/upstream/skin-packs/packs/global-founder-bright/theme.json",
  "assets/inject/upstream/skin-packs/packs/mythic-guardian-noir/theme.json",
]);

const trackedFiles = [
  ".github/ISSUE_TEMPLATE/bug_report.yml",
  ".github/ISSUE_TEMPLATE/config.yml",
  ".github/workflows/pr-build.yml",
  ".github/workflows/release-assets.yml",
  "AGENTS.md",
  "Cargo.toml",
  "README.md",
  "README_EN.md",
  "CONTRIBUTING.md",
  "HANDOVER.md",
  "docs/changelog.html",
  "docs/changelog.js",
  "docs/index.html",
  "docs/site.js",
  "services/share-site/README.md",
  "services/share-site/app.js",
  "services/share-site/index.html",
  "assets/installer/macos/dmg-background.svg",
  "assets/inject/renderer-inject.js",
  "assets/inject/upstream/cidala-tiger/macos/theme.json",
  "assets/inject/upstream/dream-skin/macos/theme.json",
  ...bundledSkinPackThemePaths,
  "assets/inject/stepwise-inject.js",
  "assets/inject/floating-panel/core/appearance-runtime.js",
  "assets/inject/floating-panel/core/views.js",
  "apps/codex-plus-manager/index.html",
  "apps/codex-plus-manager/src/App.tsx",
  "apps/codex-plus-manager/src/dream-skin.ts",
  "apps/codex-plus-manager/src/dream-skin.test.ts",
  "apps/codex-plus-manager/src/i18n-en.ts",
  "apps/codex-plus-manager/src/presets.ts",
  "apps/codex-plus-manager/src/renderer-inject.test.ts",
  "apps/codex-plus-manager/src-tauri/Info.plist",
  "apps/codex-plus-manager/src-tauri/tauri.conf.json",
  "apps/codex-plus-manager/src-tauri/src/lib.rs",
  "apps/codex-plus-manager/src-tauri/src/commands.rs",
  "apps/codex-plus-manager/src-tauri/capabilities/default.json",
  "apps/codex-plus-manager/src-tauri/tests/windows_subsystem.rs",
  "apps/codex-plus-launcher/src/main.rs",
  "apps/codex-plus-mobile-relay/src/main.rs",
  "crates/codex-plus-core/src/ads.rs",
  "crates/codex-plus-core/src/assets.rs",
  "crates/codex-plus-core/src/connect/app_server.rs",
  "crates/codex-plus-core/src/connect/mod.rs",
  "crates/codex-plus-core/src/dream_skin_community.rs",
  "crates/codex-plus-core/src/dream_skin_library.rs",
  "crates/codex-plus-core/src/dream_skin_market.rs",
  "crates/codex-plus-core/src/dream_skin_runtime.rs",
  "crates/codex-plus-core/src/install/mod.rs",
  "crates/codex-plus-core/src/install/macos.rs",
  "crates/codex-plus-core/src/install/windows.rs",
  "crates/codex-plus-core/src/launcher.rs",
  "crates/codex-plus-core/src/paths.rs",
  "crates/codex-plus-core/src/script_market.rs",
  "crates/codex-plus-core/src/session_share.rs",
  "crates/codex-plus-core/src/settings.rs",
  "crates/codex-plus-core/src/share.rs",
  "crates/codex-plus-core/src/update.rs",
  "crates/codex-plus-core/src/user_scripts.rs",
  "crates/codex-plus-core/src/zed_remote.rs",
  "crates/codex-plus-core/tests/ads.rs",
  "crates/codex-plus-core/tests/cdp_bridge.rs",
  "crates/codex-plus-core/tests/cli_wrapper.rs",
  "crates/codex-plus-core/tests/dream_skin.rs",
  "crates/codex-plus-core/tests/dream_skin_market.rs",
  "crates/codex-plus-core/tests/upstream_theme_assets.rs",
  "crates/codex-plus-core/tests/installers.rs",
  "crates/codex-plus-core/tests/updater.rs",
  "scripts/installer/macos/package-dmg.sh",
  "scripts/installer/windows/CodexPlusPlus.nsi",
  "tools/i18n-keys.json",
  "tools/codex-wechat/README.md",
];

// 上游广告与社群图片没有运行时用途。使用显式白名单删除，避免通配符误伤二狗子封面或功能截图。
const obsoleteAssets = [
  "assets/images/rawchat-sponsor.jpg",
  "assets/images/sponsor-alipay.jpg",
  "assets/images/sponsor-wechat.jpg",
  "docs/CNAME",
  "docs/images/discussion-group-qr.jpg",
  "docs/images/sponsor-0029.svg",
  "docs/images/sponsor-aigocode.png",
  "docs/images/sponsor-aihub.jpg",
  "docs/images/sponsor-aihub2api.png",
  "docs/images/sponsor-alipay.jpg",
  "docs/images/sponsor-apikey-fun.png",
  "docs/images/sponsor-apimart.png",
  "docs/images/sponsor-baikewei-ai.jpg",
  "docs/images/sponsor-byteplus.png",
  "docs/images/sponsor-cubence.png",
  "docs/images/sponsor-deepkey.png",
  "docs/images/sponsor-ergou-api.png",
  "docs/images/sponsor-everyapi.png",
  "docs/images/sponsor-fenno-ai.png",
  "docs/images/sponsor-jojocode.png",
  "docs/images/sponsor-jojocode.svg",
  "docs/images/sponsor-maolao-api.jpg",
  "docs/images/sponsor-packycode.png",
  "docs/images/sponsor-qiniu-ai.png",
  "docs/images/sponsor-rawchat.svg",
  "docs/images/sponsor-runapi.png",
  "docs/images/sponsor-smallice.png",
  "docs/images/sponsor-sublyx.png",
  "docs/images/sponsor-sui-xiang-ai-gateway.jpg",
  "docs/images/sponsor-ucloud-compshare.png",
  "docs/images/sponsor-unity2.png",
  "docs/images/sponsor-volcengine.png",
  "docs/images/sponsor-wechat.jpg",
  "docs/images/sponsor-yiyun-tech.jpg",
];

// 上游历史文件可能已被删除；除此之外，缺失目标都应让验证失败，避免错误 ref 也被报告为“验证通过”。
const optionalUpstreamPaths = new Set([
  "assets/inject/stepwise-inject.js",
  "crates/codex-plus-core/tests/cli_wrapper.rs",
]);

// 只在用户可见品牌、发布入口与安装产物中做完整品牌替换。
// 运行命令、协议名、持久化标记和兼容键由上游拥有，避免机械改名破坏兼容性。
const brandReplaceFiles = new Set([
  ".github/ISSUE_TEMPLATE/bug_report.yml",
  ".github/ISSUE_TEMPLATE/config.yml",
  ".github/workflows/pr-build.yml",
  ".github/workflows/release-assets.yml",
  "AGENTS.md",
  "Cargo.toml",
  "README.md",
  "README_EN.md",
  "CONTRIBUTING.md",
  "HANDOVER.md",
  "docs/changelog.html",
  "docs/changelog.js",
  "docs/index.html",
  "docs/site.js",
  "services/share-site/README.md",
  "services/share-site/app.js",
  "services/share-site/index.html",
  "assets/installer/macos/dmg-background.svg",
  "assets/inject/renderer-inject.js",
  "assets/inject/stepwise-inject.js",
  "assets/inject/floating-panel/core/appearance-runtime.js",
  "assets/inject/floating-panel/core/views.js",
  "apps/codex-plus-manager/index.html",
  "apps/codex-plus-manager/src/App.tsx",
  "apps/codex-plus-manager/src/dream-skin.test.ts",
  "apps/codex-plus-manager/src/i18n-en.ts",
  "apps/codex-plus-manager/src/presets.ts",
  "apps/codex-plus-manager/src/renderer-inject.test.ts",
  "apps/codex-plus-manager/src-tauri/Info.plist",
  "apps/codex-plus-manager/src-tauri/tauri.conf.json",
  "apps/codex-plus-manager/src-tauri/src/lib.rs",
  "apps/codex-plus-manager/src-tauri/src/commands.rs",
  "apps/codex-plus-manager/src-tauri/capabilities/default.json",
  "apps/codex-plus-manager/src-tauri/tests/windows_subsystem.rs",
  "apps/codex-plus-launcher/src/main.rs",
  "apps/codex-plus-mobile-relay/src/main.rs",
  "crates/codex-plus-core/src/connect/app_server.rs",
  "crates/codex-plus-core/src/connect/mod.rs",
  "crates/codex-plus-core/src/dream_skin_community.rs",
  "crates/codex-plus-core/src/dream_skin_library.rs",
  "crates/codex-plus-core/src/dream_skin_market.rs",
  "crates/codex-plus-core/src/dream_skin_runtime.rs",
  "crates/codex-plus-core/src/install/mod.rs",
  "crates/codex-plus-core/src/install/macos.rs",
  "crates/codex-plus-core/src/install/windows.rs",
  "crates/codex-plus-core/src/launcher.rs",
  "crates/codex-plus-core/src/session_share.rs",
  "crates/codex-plus-core/src/share.rs",
  "crates/codex-plus-core/src/user_scripts.rs",
  "crates/codex-plus-core/src/zed_remote.rs",
  "crates/codex-plus-core/tests/cdp_bridge.rs",
  "crates/codex-plus-core/tests/installers.rs",
  "crates/codex-plus-core/tests/updater.rs",
  "scripts/installer/macos/package-dmg.sh",
  "scripts/installer/windows/CodexPlusPlus.nsi",
  "tools/codex-wechat/README.md",
]);

const fileRenames = [
  {
    from: "scripts/installer/windows/CodexPlusPlus.nsi",
    to: "scripts/installer/windows/AgentDesk.nsi",
  },
];

// Provider 兼容键属于运行时协议语义，禁止被品牌全局替换改掉。
const LEGACY_FORCE_PATCHES = [
  [
    /const LEGACY_RELAY_PROVIDERS: &\[[\s\S]*?\];/,
    'const LEGACY_RELAY_PROVIDERS: &[&str] = &["CodexPlusPlus", "CodexPP"];',
  ],
];

// 只保护“结构块”，不要把普通用户可见文案里的 Codex++ 也锁死。
const LEGACY_PROTECT_PATTERNS = [
  /const LEGACY_RELAY_PROVIDERS: &\[[\s\S]*?\];/g,
];

const replacers = [
  ["https://github.com/BigPizzaV3/CodexPlusPlus/issues", config.repository.issues],
  ["https://github.com/BigPizzaV3/CodexPlusPlus", config.repository.github],
  ["github.com/BigPizzaV3/CodexPlusPlus", `github.com/${config.repository.owner}/${config.repository.name}`],
  ["BigPizzaV3/CodexPlusPlus", `${config.repository.owner}/${config.repository.name}`],
  // Ad-List 由文件专属补丁删除；未知位置必须留给 audit 报错，不能静默改成 AgentDesk 造成虚假归属。
  ["BigPizzaV3", config.repository.owner],
  ["CodexPlusPlusWatcher", "AgentDeskWatcher"],
  ["CodexPlusPlusManager", "AgentDeskManager"],
  ["CodexPlusPlus", "AgentDesk"],
  ["Codex++ 管理工具.app", `${config.brand.managerNameZh}.app`],
  ["Codex++ 管理工具", config.brand.managerNameZh],
  ["Codex++ 绠＄悊宸ュ叿", config.brand.managerNameZh],
  ["AgentDesk 绠＄悊宸ュ叿", config.brand.managerNameZh],
  ["Codex++.app", "AgentDesk.app"],
  ["Codex++.lnk", "AgentDesk.lnk"],
  ["Codex++", "AgentDesk"],
  [".codex-session-delete", config.brand.stateDir],
  ["com.bigpizzav3.codexplusplus.manager", `${config.brand.bundleBase}.manager`],
  ["com.bigpizzav3.codexplusplus", config.brand.bundleBase],
];

function normalize(text) {
  return text.replace(/\r\n/g, "\n");
}

function read(relativePath) {
  return normalize(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function write(relativePath, contents) {
  fs.writeFileSync(path.join(root, relativePath), contents, "utf8");
}

function existingPath(relativePath) {
  const rename = fileRenames.find((item) => item.from === relativePath);
  if (!rename) return relativePath;
  if (fs.existsSync(path.join(root, relativePath))) return relativePath;
  if (fs.existsSync(path.join(root, rename.to))) return rename.to;
  return relativePath;
}

function outputPath(relativePath) {
  return fileRenames.find((item) => item.from === relativePath)?.to ?? relativePath;
}

function replaceAll(text, pairs) {
  let next = text;
  for (const [from, to] of pairs) next = next.split(from).join(to);
  return next;
}

function protectLegacyLiterals(text) {
  const placeholders = [];
  let next = text;
  for (const pattern of LEGACY_PROTECT_PATTERNS) {
    next = next.replace(pattern, (match) => {
      const token = `__AGENTDESK_LEGACY_PROTECT_${placeholders.length}__`;
      placeholders.push(match);
      return token;
    });
  }
  return { text: next, placeholders };
}

function restoreLegacyLiterals(text, placeholders) {
  let next = text;
  placeholders.forEach((value, index) => {
    next = next.split(`__AGENTDESK_LEGACY_PROTECT_${index}__`).join(value);
  });
  return next;
}

function forceLegacyConstants(text) {
  let next = text;
  for (const [pattern, replacement] of LEGACY_FORCE_PATCHES) {
    next = next.replace(pattern, replacement);
  }
  return next;
}

function brandReplace(text) {
  const protectedBlock = protectLegacyLiterals(text);
  let next = replaceAll(protectedBlock.text, replacers);
  next = restoreLegacyLiterals(next, protectedBlock.placeholders);
  return forceLegacyConstants(next);
}

function removeSection(text, heading) {
  const marker = `## ${heading}`;
  const start = text.indexOf(marker);
  if (start === -1) return text;
  const nextHeading = text.indexOf("\n## ", start + marker.length);
  const end = nextHeading === -1 ? text.length : nextHeading + 1;
  return `${text.slice(0, start)}${text.slice(end)}`.replace(/\n{3,}/g, "\n\n");
}

function removeSubsection(text, heading) {
  const marker = `### ${heading}`;
  const start = text.indexOf(marker);
  if (start === -1) return text;
  const nextHeading = text.slice(start + marker.length).search(/\n#{2,3} /);
  const end = nextHeading === -1
    ? text.length
    : start + marker.length + nextHeading + 1;
  return `${text.slice(0, start)}${text.slice(end)}`.replace(/\n{3,}/g, "\n\n");
}

function removeRepositoryLineage(text) {
  return text
    .replace(
      /^.*基于上游 \[[^\]]+\]\([^)]+\) 维护。?\s*$/gm,
      ""
    )
    .replace(
      /^.*(?:clean|ad-free).*fork.*$/gim,
      ""
    )
    .replace(
      /^AgentDesk 是 .*?(?:纯净|无广告).*$/gm,
      ""
    )
    .replace(
      /^上游 CodexPlusPlus 的版权与贡献.*$/gm,
      ""
    )
    .replace(
      /^Copyright and contributions of upstream CodexPlusPlus.*$/gim,
      ""
    )
    .replace(/\n{3,}/g, "\n\n");
}

function patchReadme(text, language) {
  let next = text
    .replace(/重新启动 AgentDesk/g, "重新启动 Codex")
    .replace(/restarting AgentDesk/g, "restarting Codex");
  // 纯净版直接删除赞助 / 社群 / 友情链接段落，不保留占位说明
  for (const heading of [
    "赞助商",
    "推荐内容",
    "交流与支持",
    "友情链接",
    "Sponsors",
    "Recommendations",
    "Community and Support",
    "Friendly Links",
    "与上游的差异",
    "Differences from Upstream",
    "致谢",
    "Acknowledgements",
  ]) {
    next = removeSection(next, heading);
  }
  next = removeSubsection(next, "Upstream worktree 和 Codex 原生创建有什么区别");
  next = removeSubsection(next, "How is Upstream worktree different from Codex native creation?");
  next = removeRepositoryLineage(next).trimEnd();
  const acknowledgement = language === "zh"
    ? "## 致谢\n\nAgentDesk 基于 [BigPizzaV3/CodexPlusPlus](https://github.com/BigPizzaV3/CodexPlusPlus) 二次开发。感谢原作者及所有贡献者为项目奠定的基础。"
    : "## Acknowledgements\n\nAgentDesk is based on [BigPizzaV3/CodexPlusPlus](https://github.com/BigPizzaV3/CodexPlusPlus). Thanks to the original authors and contributors for their work.";
  return `${next}\n\n${acknowledgement}\n`;
}

function patchAdsRs(text) {
  void text;
  const templatePath = path.join(
    root,
    "scripts",
    "privateize-agentdesk.templates",
    "ads.rs"
  );
  return normalize(fs.readFileSync(templatePath, "utf8"));
}

function patchAssetsRs(text) {
  if (config.support.enabled) return text;
  return text
    .replace(/const SPONSOR_ALIPAY: &\[u8\] = include_bytes!\("[^"]+"\);\n/, "")
    .replace(/const SPONSOR_WECHAT: &\[u8\] = include_bytes!\("[^"]+"\);\n/, "")
    .replace(
      /pub fn sponsor_image_data_uris\(\) -> Value \{\s*json!\(\{\s*"alipay": image_data_uri\("image\/jpeg", SPONSOR_ALIPAY\),\s*"wechat": image_data_uri\("image\/jpeg", SPONSOR_WECHAT\),\s*\}\)\s*\}/,
      "pub fn sponsor_image_data_uris() -> Value {\n    json!({})\n}"
    );
}

function patchUpdateRs(text) {
  let next = text.replace(
    /\nfn is_agentdesk_or_legacy_codex_plus_asset\(name: &str\) -> bool \{\n    name\.contains\("agentdesk"\) \|\| \(name\.contains\("codex"\) && name\.contains\("plus"\)\)\n\}\n/g,
    "\n"
  );
  next = next.replace(
    /pub const DEFAULT_REPOSITORY: &str = "[^"]+";/,
    `pub const DEFAULT_REPOSITORY: &str = "${config.repository.owner}/${config.repository.name}";`
  );
  next = next.replace(
    /pub const DEFAULT_LATEST_JSON_URL: &str =\s*"[^"]+";/,
    `pub const DEFAULT_LATEST_JSON_URL: &str =\n    "${config.repository.latestJson}";`
  );
  next = next.replace(
    /fn is_windows_installer_asset\(name: &str\) -> bool \{[\s\S]*?\n\}/,
    'fn is_windows_installer_asset(name: &str) -> bool {\n    is_agentdesk_or_legacy_codex_plus_asset(name)\n        && (name.ends_with(".msi")\n            || name.ends_with("-setup.exe")\n            || name.ends_with("_setup.exe")\n            || name.ends_with("setup.exe")\n            || name.ends_with("installer.exe"))\n}'
  );
  next = next.replace(
    /fn is_macos_installer_asset\(name: &str\) -> bool \{[\s\S]*?\n\}/,
    'fn is_macos_installer_asset(name: &str) -> bool {\n    is_agentdesk_or_legacy_codex_plus_asset(name) && name.ends_with(".dmg")\n}\n\nfn is_agentdesk_or_legacy_codex_plus_asset(name: &str) -> bool {\n    name.contains("agentdesk") || (name.contains("codex") && name.contains("plus"))\n}'
  );
  next = next.replace(/\n{3,}pub fn launch_installer/, "\n\npub fn launch_installer");
  return next;
}

function patchScriptMarketRs(text) {
  const url = config.scriptMarket.enabled ? config.scriptMarket.indexUrl : "";
  return text.replace(
    /pub const DEFAULT_MARKET_INDEX_URL: &str =\s*"[^"]*"\s*;/,
    `pub const DEFAULT_MARKET_INDEX_URL: &str = "${url}";`
  );
}

function patchPathsRs(text) {
  return text
    .replace(
      /const APP_STATE_DIR: &str = "[^"]+";/,
      `const APP_STATE_DIR: &str = "${config.brand.stateDir}";`
    )
    .replace(/\.codex-session-delete\//g, `${config.brand.stateDir}/`);
}

function patchRendererInject(text) {
  let next = text;
  if (config.recommendations.mode === "builtin-only") {
    next = next.replace(
      /\n  function cacheBustCodexPlusAdUrl\(url, version\) \{[\s\S]*?(?=\n  async function fetchCodexPlusAds\(\))/,
      ""
    );
    next = next.replace(
      /\n\s*if \(!codexPlusAds\.length\) codexPlusAds = normalizeCodexPlusAds\(await directFetchCodexPlusAds\(\)\);/,
      ""
    );
    next = next.replace(
      /function renderCodexPlusAds\(\) \{[\s\S]*?\n  \}/,
      `function renderCodexPlusAds() {
    if (!codexPlusAdsLoaded) return \`<div class="codex-plus-ad-empty">推荐内容加载中…</div>\`;
    if (!codexPlusAds.length) return \`<div class="codex-plus-ad-empty">暂无推荐内容。</div>\`;
    const sponsors = renderCodexPlusAdGroup("sponsor", "暂无中转推荐。");
    return \`
      <section class="codex-plus-ad-section">
        <h3 class="codex-plus-ad-section-title">中转推荐</h3>
        <div class="codex-plus-ad-list">\${sponsors}</div>
      </section>
    \`;
  }`
    );
    next = next.replace(
      /推荐内容分为赞助商推荐和普通推荐。[\s\S]*?服务与信息。/,
      "Ergouzi 二狗子模型中转服务，支持 OpenAI、Claude、Grok 兼容接口。"
    );
    next = next.replace(
      '<div class="codex-plus-row">\n              <div><div class="codex-plus-row-title">Discord 社区</div><div class="codex-plus-row-description">加入 Discord 获取更新消息、反馈问题或交流使用体验。</div></div>\n              <button type="button" class="codex-plus-action-button" data-codex-plus-discord="true">打开 Discord</button>\n            </div>\n',
      ""
    );
    next = next.replace(
      '<div class="codex-plus-row">\n              <div><div class="codex-plus-row-title">Telegram 频道</div><div class="codex-plus-row-description">加入 Telegram 获取更新消息和交流使用体验。</div></div>\n              <button type="button" class="codex-plus-action-button" data-codex-plus-telegram="true">打开 Telegram</button>\n            </div>\n',
      ""
    );
    next = next.replace(
      '      if (target?.closest("[data-codex-plus-discord]")) {\n        window.open("https://discord.gg/y96kX7A76v", "_blank");\n        return;\n      }\n',
      ""
    );
    next = next.replace(
      /      if \(target\?\.closest\("\[data-codex-plus-telegram\]"\)\) \{[\s\S]*?return;\n      \}\n/,
      ""
    );
    next = next.replace(
      /\s*<button type="button" class="codex-plus-tab-button" data-codex-plus-tab="support"[^>]*>[^<]*<\/button>/,
      ""
    );
    next = next.replace(
      /\s*<div class="codex-plus-panel" data-codex-plus-panel="support" hidden>[\s\S]*?<\/div>\s*(?=<\/div>\s*<\/div>\s*`;)/,
      ""
    );
  }
  next = next.replace(
    /<br>Discord: <a href="[^"]+" target="_blank" rel="noreferrer">[^<]+<\/a>/,
    ""
  );
  next = next.replace(
    /<br>Telegram: <a href="[^"]+" target="_blank" rel="noreferrer">[^<]+<\/a>/,
    ""
  );
  if (!config.sessionShare.enabled) {
    next = next
      .replace(/\n\s*installSessionShareImportListener\(\);/g, "")
      .replace(/\n\s*installSessionShareButton\(\);/g, "");
  }
  return next.replace(/重启 AgentDesk/g, "重启 Codex");
}

function localOnlyUserScriptsScreen() {
  return `function UserScriptsScreen({ settings, actions }: { settings: SettingsResult | null; market: ScriptMarketResult | null; actions: Actions }) {
  const inventory = settings?.user_scripts;
  const scripts = inventory?.scripts ?? [];
  return (
    <Panel>
      <CardHead title={t("本地脚本")} detail={inventory?.enabled === false ? t("关闭") : t("开启")} />
      <CardContent>
        <Toolbar>
          <Button onClick={() => void actions.refreshCurrent()} variant="secondary">
            <RefreshCw className="h-4 w-4" />
            {t("刷新本地")}
          </Button>
        </Toolbar>
        <div className="table">
          {scripts.length ? scripts.map((script) => <ScriptRow key={script.key} script={script} actions={actions} />) : <div className="empty">{t("未发现用户脚本。")}</div>}
        </div>
      </CardContent>
    </Panel>
  );
}`;
}

function patchManagerApp(text) {
  const relayDescription = `统一的 AI 模型聚合与分发网关，支持 OpenAI、Claude、Grok 兼容接口。Codex 中转注入默认使用 ${config.officialRelay.baseUrl}。`;
  let next = text.replace(/重启 AgentDesk/g, "重启 Codex");
  if (!config.scriptMarket.enabled) {
    next = next.replace(
      /const SCRIPT_MARKET_REPOSITORY_URL = "[^"]+";/,
      'const SCRIPT_MARKET_REPOSITORY_URL = "";'
    );
    next = next.replace(
      /\s*<Button onClick=\{\(\) => void actions\.openExternalUrl\(SCRIPT_MARKET_REPOSITORY_URL\)\} variant="secondary">[\s\S]*?<\/Button>\s*/g,
      ""
    );
    next = next
      .replace(
        '{ id: "userScripts", label: t("脚本市场"), icon: FileCode2 },',
        '{ id: "userScripts", label: t("本地脚本"), icon: FileCode2 },'
      )
      .replace(/\n\s*await refreshScriptMarket\(true\);/g, "")
      .replace(
        /function UserScriptsScreen\([\s\S]*?\n\}\n\n(?=function SessionsScreen)/,
        `${localOnlyUserScriptsScreen()}\n\n`
      );
  } else {
    next = next.replace(
      /const SCRIPT_MARKET_REPOSITORY_URL = "[^"]*";/,
      `const SCRIPT_MARKET_REPOSITORY_URL = "${config.scriptMarket.repositoryUrl}";`
    );
  }
  if (config.recommendations.mode === "builtin-only") {
    next = next.replace(
      /<CardHead title=\{t\("推荐内容"\)\} detail=\{t\("[^"]*"\)\} \/>/,
      '<CardHead title={t("推荐内容")} detail={t("Ergouzi 二狗子模型中转服务")} />'
    );
    next = next.replace(
      /<span>\{t\("内容来自[^"]*"\)\}<\/span>/,
      '<span>{t("支持 OpenAI、Claude、Grok 兼容接口。")}</span>'
    );
    next = next.replace(
      /recommendations: t\("[^"]*"\),/,
      'recommendations: t("二狗子中转推荐"),'
    );
    next = next
      .replace(
        /\n\s*const sponsors = items\.filter\(\(ad\) => ad\.type === "sponsor"\);\n\s*const normal = items\.filter\(\(ad\) => ad\.type === "normal"\);/,
        '\n  const recommendations = items.filter((ad) => ad.type === "sponsor");'
      )
      .replace(
        /\n\s*<Panel>\n\s*<CardHead title=\{t\("赞助商推荐"\)\}[\s\S]*?<\/Panel>\n\s*<Panel>\n\s*<CardHead title=\{t\("普通推荐"\)\}[\s\S]*?<\/Panel>/,
        `
      <Panel>
        <CardHead title={t("推荐内容")} detail={tf("{0} 条", [recommendations.length])} />
        <CardContent>
          <AdGrid actions={actions} ads={recommendations} empty={t("尚未加载推荐内容")} />
        </CardContent>
      </Panel>`
      );
  }
  if (!config.sessionShare.enabled) {
    next = next.replace(
      /\n\s*<div className="session-share-import">[\s\S]*?<\/div>/,
      ""
    );
  }
  if (!config.dreamSkinSources.enabled) {
    next = next
      .replace(
        'const [themeView, setThemeView] = useState<"market" | "community" | "local">("community");',
        'const [themeView, setThemeView] = useState<"market" | "community" | "local">("local");'
      )
      .replace(/\n\s*await refreshDreamSkinMarket\(true\);/g, "")
      .replace(/\n\s*await refreshDreamSkinCommunity\(true\);/g, "")
      .replace(/\n\s*await refreshPendingDreamSkinCommunity\(\);/g, "")
      .replace(/\n\s*void refreshPendingDreamSkinCommunity\(\);/g, "")
      .replace(
        /\n\s*\{pendingDreamSkinCommunity \? \([\s\S]*?\) : null\}/,
        ""
      )
      .replace(
        /\n\s*<button\n\s*aria-selected=\{themeView === "community"\}[\s\S]*?<\/button>\n\s*<button\n\s*aria-selected=\{themeView === "market"\}[\s\S]*?<\/button>/,
        ""
      )
      .replace(/https:\/\/github\.com\/xxloocee\/AgentDesk-Themes/g, "")
      .replace(/https:\/\/dreamskin\.cc\/(?:gallery|studio)/g, "")
      .replace(/https:\/\/dreamskin\.cc\/preview\?themeVersion=/g, "")
      .replace(/AgentDesk-Themes/g, "未配置的远程主题源")
      .replace(/api\.dreamskin\.cc/g, "community.agentdesk.invalid")
      .replace(/DreamSkin\.cc/g, "远程主题服务");
  }
  next = next.replace(
    /<Button onClick=\{\(\) => void actions\.openExternalUrl\("https:\/\/discord\.gg\/y96kX7A76v"\)\} variant="secondary">[\s\S]*?<\/Button>\s*/g,
    ""
  );
  next = next.replace(
    /<Button onClick=\{\(\) => void actions\.openExternalUrl\("https:\/\/t\.me\/[^"]*"\)\} variant="secondary">[\s\S]*?<\/Button>\s*/g,
    ""
  );
  next = next.replace(
    /<Button onClick=\{\(\) => void actions\.openExternalUrl\("https:\/\/docs\.qq\.com\/doc\/DQ2VOanZTTFZJcUpZ#"\)\} variant="secondary">[\s\S]*?<\/Button>\s*/g,
    ""
  );
  next = next
    .replace(/官方中转站/g, "推荐中转")
    .replace(/项目赞助商/g, "推荐中转")
    .replace(/<h2>JOJO Code<\/h2>/g, `<h2>${config.officialRelay.displayName}</h2>`)
    .replace(/<h2>AgentDesk<\/h2>/g, `<h2>${config.officialRelay.displayName}</h2>`)
    .replace(/JOJO Code 提供[^"\r\n]+。/g, relayDescription)
    .replace(
      /\{t\("Codex\+\+ 官方中转站，主打稳定接入和划算价格，支持 GPT-5\.6 全系列、Fable 5、Sonnet 5、GPT-5\.5、GPT-5\.4、Claude Opus 4\.8、Claude Opus 4\.7、gpt-image-2 等模型与图像能力。"\)\}/g,
      `{t("统一的 AI 模型聚合与分发网关，支持 OpenAI、Claude、Grok 兼容接口。Codex 中转注入默认使用 ${config.officialRelay.baseUrl}。")}`
    )
    .replace(
      /\{t\("AgentDesk 官方中转站，主打稳定接入和划算价格，支持 GPT-5\.6 全系列、Fable 5、Sonnet 5、GPT-5\.5、GPT-5\.4、Claude Opus 4\.8、Claude Opus 4\.7、gpt-image-2 等模型与图像能力。"\)\}/g,
      `{t("统一的 AI 模型聚合与分发网关，支持 OpenAI、Claude、Grok 兼容接口。Codex 中转注入默认使用 ${config.officialRelay.baseUrl}。")}`
    )
    .replace(
      /\{t\("Codex\+\+ 官方中转站，主打稳定接入和划算价格，支持 GPT-5\.5、GPT-5\.4、Claude Opus 4\.8、Claude Opus 4\.7、gpt-image-2 等模型与图像能力。"\)\}/g,
      `{t("统一的 AI 模型聚合与分发网关，支持 OpenAI、Claude、Grok 兼容接口。Codex 中转注入默认使用 ${config.officialRelay.baseUrl}。")}`
    )
    .replace(
      /\{t\("AgentDesk 官方中转站，主打稳定接入和划算价格，支持 GPT-5\.5、GPT-5\.4、Claude Opus 4\.8、Claude Opus 4\.7、gpt-image-2 等模型与图像能力。"\)\}/g,
      `{t("统一的 AI 模型聚合与分发网关，支持 OpenAI、Claude、Grok 兼容接口。Codex 中转注入默认使用 ${config.officialRelay.baseUrl}。")}`
    )
    .replace(
      /<span>GPT-5\.6 全系列<\/span>\s*<span>Fable 5<\/span>\s*<span>Sonnet 5<\/span>\s*/g,
      ""
    )
    .replace(
      /<span>GPT-5\.5<\/span>\s*<span>GPT-5\.4<\/span>\s*<span>Opus 4\.8<\/span>\s*<span>Opus 4\.7<\/span>\s*<span>gpt-image-2<\/span>/g,
      "<span>OpenAI</span>\n                <span>Claude</span>\n                <span>Grok</span>"
    )
    .replace(
      /<span>OpenAI Compatible<\/span>\s*<span>Claude Compatible<\/span>\s*<span>Gemini Compatible<\/span>\s*<span>Codex 接入<\/span>\s*<span>BYOK<\/span>/g,
      "<span>OpenAI</span>\n                <span>Claude</span>\n                <span>Grok</span>"
    )
    .replace(/https:\/\/jojocode\.com\/?/g, config.officialRelay.homeUrl)
    .replace(/打开 JOJO Code/g, "打开二狗子")
    .replace(/打开官方中转/g, "打开二狗子");
  return next;
}

function patchPresets(text) {
  let next = text
    .replace(/id: "jojocode"/g, `id: "${config.officialRelay.id}"`)
    .replace(/name: "JOJO Code"/g, `name: "${config.officialRelay.displayName}"`)
    .replace(/websiteUrl: "https:\/\/jojocode\.com\/?"/g, `websiteUrl: "${config.officialRelay.homeUrl}"`)
    .replace(/apiKeyUrl: "https:\/\/jojocode\.com\/?"/g, `apiKeyUrl: "${config.officialRelay.homeUrl}"`)
    .replace(/baseUrl: "https:\/\/jojocode\.com\/v1"/g, `baseUrl: "${config.officialRelay.baseUrl}"`);
  // 删除上游 JOJO 包月等广告向预设条目
  next = next.replace(
    /\n\s*\{\s*id:\s*"jojocode-max"[\s\S]*?\},\n/,
    "\n"
  );
  next = next.replace(
    /\n\s*\{\s*id:\s*"jojocode"[^}]*websiteUrl:\s*"https:\/\/max\.jojocode\.com\/?"[\s\S]*?\},\n/g,
    "\n"
  );
  // 去掉 SiliconFlow 邀请/推广链，只保留官方入口
  next = next.replace(
    /apiKeyUrl:\s*"https:\/\/cloud\.siliconflow\.cn\/i\/[^"]+"/g,
    'apiKeyUrl: "https://cloud.siliconflow.cn"'
  );
  next = next.replace(
    /websiteUrl:\s*"https:\/\/cloud\.siliconflow\.cn\/i\/[^"]+"/g,
    'websiteUrl: "https://siliconflow.cn"'
  );
  return next;
}

function patchWindowsInstaller(text) {
  let next = text.replace(/(^\s*Delete "[^"]*AgentDesk 管理工具\.lnk"\n)\1/gm, "$1");
  const protocolCleanup = String.raw`  ReadRegStr $0 HKCU "Software\Classes\codexplusplus\shell\open\command" ""
  StrCpy $1 "$\"$INSTDIR\codex-plus-plus-manager.exe$\" $\"%1$\""
  StrCmp $0 $1 0 +2
  DeleteRegKey HKCU "Software\Classes\codexplusplus"

`;
  if (!next.includes('ReadRegStr $0 HKCU "Software\\Classes\\codexplusplus\\shell\\open\\command"')) {
    next = next.replace(
      '  DeleteRegKey HKCU "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\AgentDesk"',
      `${protocolCleanup}  DeleteRegKey HKCU "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\AgentDesk"`
    );
  }
  return next;
}

function patchWindowsInstallRs(text) {
  let next = text
    .replace(/\nconst LEGACY_UNINSTALL_SUBKEYS?:[\s\S]*?;\n/, "\n")
    .replace(/\n\s*pub legacy_uninstall_key: String,/, "")
    .replace(/\n\s*(?:\/\/[^\n]*\n\s*)?legacy_uninstall_key:\s*"[^"]*"\.to_string\(\),/, "")
    .replace(
      /\n\s*for legacy_key in LEGACY_UNINSTALL_SUBKEYS \{\n\s*let _ = crate::windows_integration::delete_current_user_key\(legacy_key\);\n\s*\}/g,
      ""
    )
    .replace(
      /\n\s*let _ = crate::windows_integration::delete_current_user_key\(LEGACY_UNINSTALL_SUBKEY\);/g,
      ""
    );
  next = next.replace(
    /\n\s*let _ = crate::windows_integration::delete_current_user_key\(&format!\(\s*r"\{URL_PROTOCOL_SUBKEY\}\\shell\\open\\command"\s*\)\);[\s\S]*?\n\s*let _ = crate::windows_integration::delete_current_user_key\(URL_PROTOCOL_SUBKEY\);/,
    "\n    unregister_url_protocol_if_owned(&plan.manager_path)?;"
  );
  if (!next.includes("fn unregister_url_protocol_if_owned")) {
    const ownershipHelpers = String.raw`#[cfg(windows)]
fn unregister_url_protocol_if_owned(manager_path: &str) -> anyhow::Result<()> {
    let command_subkey = format!(r"{URL_PROTOCOL_SUBKEY}\shell\open\command");
    let values = crate::windows_integration::read_current_user_string_values(&command_subkey)?;
    if !url_protocol_command_owned_by(manager_path, &values) {
        return Ok(());
    }
    for subkey in [
        command_subkey,
        format!(r"{URL_PROTOCOL_SUBKEY}\shell\open"),
        format!(r"{URL_PROTOCOL_SUBKEY}\shell"),
        URL_PROTOCOL_SUBKEY.to_string(),
    ] {
        let _ = crate::windows_integration::delete_current_user_key(&subkey);
    }
    Ok(())
}

fn url_protocol_command_owned_by(manager_path: &str, values: &[(String, Option<String>)]) -> bool {
    let expected = format!(r#""{manager_path}" "%1""#);
    values.iter().any(|(name, value)| {
        name.is_empty()
            && value
                .as_deref()
                .is_some_and(|value| value.trim().eq_ignore_ascii_case(&expected))
    })
}

#[cfg(test)]
mod tests {
    use super::url_protocol_command_owned_by;

    #[test]
    fn protocol_cleanup_requires_current_manager_command() {
        let own = vec![(
            String::new(),
            Some(r#""C:\Tools\AgentDesk\codex-plus-plus-manager.exe" "%1""#.to_string()),
        )];
        let other = vec![(
            String::new(),
            Some(r#""C:\Tools\OtherTool\manager.exe" "%1""#.to_string()),
        )];

        assert!(url_protocol_command_owned_by(
            r"C:\Tools\AgentDesk\codex-plus-plus-manager.exe",
            &own
        ));
        assert!(!url_protocol_command_owned_by(
            r"C:\Tools\AgentDesk\codex-plus-plus-manager.exe",
            &other
        ));
    }
}

`;
    next = next.replace("fn default_icon_path()", `${ownershipHelpers}fn default_icon_path()`);
  }
  return next;
}

function patchInstallersTest(text) {
  return text.replace(
    /\n\s*(?:\/\/[^\n]*\n\s*)?assert_eq!\(\s*plan\.legacy_uninstall_key,\s*"[^"]*"\s*\);/g,
    ""
  );
}

function patchBugReport(text) {
  return text
    .replace("启动 / 重启 AgentDesk", "启动 AgentDesk / 重启 Codex")
    .replace("点击重启 AgentDesk", "点击重启 Codex")
    .replace(/placeholder: 例如 \d+\.\d+\.\d+/, "placeholder: 例如 1.2.x");
}

function patchWorkflow(text) {
  return text.replace(/npm install --package-lock=false/g, "npm ci");
}

function patchDocsIndex(text) {
  return text
    .replace(
      /content="https:\/\/codexpp\.cc\/images\/codex-plus-plus\.png"/,
      `content="${config.website.imageUrl}"`
    )
    .replace(
      /<meta property="og:url" content="https:\/\/codexpp\.cc\/?">/,
      `<meta property="og:url" content="${config.website.baseUrl}/">`
    )
    .replace(
      /\s*<a href="https:\/\/t\.me\/[^"]+" target="_blank" rel="noreferrer">Telegram<\/a>/,
      ""
    );
}

function patchDocsChangelog(text) {
  return text.replace(
    /<meta property="og:url" content="https:\/\/codexpp\.cc\/changelog\.html">/,
    `<meta property="og:url" content="${config.website.baseUrl}/changelog.html">`
  );
}

function patchShareSiteReadme(text) {
  let next = text
    .replace(/- Pages project: `codexpp-share`/, `- Pages project: \`${config.sessionShare.pagesProject}\``)
    .replace(/- Custom domain: `share\.codexpp\.cc`/, "- Custom domain: not configured")
    .replace(
      "Cloudflare Pages + Workers KV deployment for encrypted session sharing.",
      "Cloudflare Pages + Workers KV reference deployment for encrypted session sharing. AgentDesk does not publish this service by default."
    )
    .replace(
      "The API also allows cross-origin requests from the Codex desktop renderer so\nthe injected session-share button can create links without sending plaintext.",
      "When explicitly enabled, the API allows cross-origin requests from the Codex desktop\nrenderer so clients can create links without sending plaintext."
    );
  const disabledNotice = "The AgentDesk session-share entry remains disabled until a self-owned deployment is configured.";
  if (!next.includes(disabledNotice)) {
    next = next.replace(
      "AgentDesk does not publish this service by default.",
      `AgentDesk does not publish this service by default.\n\n${disabledNotice}`
    );
  }
  return next;
}

function patchShareSiteIndex(text) {
  return text.replace('<span class="brand-mark">C++</span>', '<span class="brand-mark">AD</span>');
}

function patchDreamSkinTs(text) {
  return text.replace(
    /\n\s*promoTitle: "感谢 Passion8 赞助",\n\s*promoSub: "passion8\.cc",\n\s*promoUrl: "https:\/\/passion8\.cc\/register\?aff=TuPe",/,
    ""
  );
}

function patchSettingsRs(text) {
  let next = text;
  for (const key of ["promoTitle", "promoSub", "promoUrl"]) {
    next = next.replace(
      new RegExp(`\\n\\s*extra_fields\\.insert\\(\\n\\s*"${key}"\\.to_string\\(\\),[\\s\\S]*?\\n\\s*\\);`),
      ""
    );
  }
  return next;
}

function patchDreamSkinMarketRs(text) {
  return text
    .replace(
      /pub const DEFAULT_MARKET_INDEX_URL: &str =\s*"[^"]*"\s*;/,
      `pub const DEFAULT_MARKET_INDEX_URL: &str = "${config.dreamSkinSources.marketIndexUrl}";`
    )
    .replace(
      /pub const DEFAULT_MARKET_RAW_BASE_URL: &str =\s*"[^"]*"\s*;/,
      `pub const DEFAULT_MARKET_RAW_BASE_URL: &str = "${config.dreamSkinSources.marketRawBaseUrl}";`
    )
    .replace(
      /pub const DEFAULT_MARKET_REPOSITORY_URL: &str =\s*"[^"]*"\s*;/,
      `pub const DEFAULT_MARKET_REPOSITORY_URL: &str = "${config.dreamSkinSources.marketRepositoryUrl}";`
    )
    .replace(/"AgentDesk-Themes\/\{\}"/, '"AgentDeskThemeMarket/{}"');
}

function patchDreamSkinCommunityRs(text) {
  return text
    .replace(
      /pub const COMMUNITY_API_ORIGIN: &str = "[^"]*";/,
      `pub const COMMUNITY_API_ORIGIN: &str = "${config.dreamSkinSources.communityApiOrigin}";`
    )
    .replace(
      /pub const COMMUNITY_GALLERY_URL: &str = "[^"]*";/,
      `pub const COMMUNITY_GALLERY_URL: &str = "${config.dreamSkinSources.communityGalleryUrl}";`
    )
    .replace(
      /pub const COMMUNITY_STUDIO_URL: &str = "[^"]*";/,
      `pub const COMMUNITY_STUDIO_URL: &str = "${config.dreamSkinSources.communityStudioUrl}";`
    )
    .replace(/https:\/\/api\.dreamskin\.cc/g, config.dreamSkinSources.communityApiOrigin);
}

function patchDreamSkinMarketTestRs(text) {
  return text
    .replace('author: "Codex++".to_string(),', 'author: "Theme Author".to_string(),')
    .replace(
      'source_url: "https://github.com/BigPizzaV3/CodexPlusPlus-Themes".to_string(),',
      'source_url: "https://github.com/example/agentdesk-theme".to_string(),'
    )
    .replace(
      '#[ignore = "requires the public CodexPlusPlus-Themes repository"]',
      '#[ignore = "requires a configured public theme repository"]'
    );
}

function patchBundledDreamSkinTheme(text) {
  const payload = JSON.parse(text);
  delete payload.promoTitle;
  delete payload.promoSub;
  delete payload.promoUrl;
  return `${JSON.stringify(payload, null, 2)}\n`;
}

function patchDreamSkinTestTs(text) {
  let next = text;
  if (!next.includes("assert.equal(theme.promoTitle, undefined);")) {
    next = next.replace(
      '    assert.equal(theme.colors!.accent, "#E25563");',
      '    assert.equal(theme.colors!.accent, "#E25563");\n    assert.equal(theme.promoTitle, undefined);\n    assert.equal(theme.promoSub, undefined);\n    assert.equal(theme.promoUrl, undefined);'
    );
  }
  return next.replace(
    /  it\("(?:separates the remote marketplace from local theme editing|keeps privateized remote asset sources dormant)"[\s\S]*?\n  \}\);/,
    String.raw`  it("keeps privateized remote asset sources dormant", async () => {
    const app = await readFile(new URL("./App.tsx", import.meta.url), "utf8");

    assert.match(app, /useState<"market" \| "community" \| "local">\("local"\)/);
    assert.doesNotMatch(app, /\n\s*await refreshDreamSkinMarket\(true\);/);
    assert.doesNotMatch(app, /\n\s*await refreshDreamSkinCommunity\(true\);/);
    assert.doesNotMatch(app, /\n\s*await refreshScriptMarket\(true\);/);
    assert.doesNotMatch(app, /aria-selected=\{themeView === "community"\}/);
    assert.doesNotMatch(app, /pendingDreamSkinCommunity \? \(/);
    assert.doesNotMatch(app, /Codex(?:Plus){2}ScriptMarket|AgentDesk-?Themes|dreamskin[.]cc/i);
  });`
  );
}

function patchDreamSkinTestRs(text) {
  return text.replace(
    '        assert_eq!(theme.extra_fields["promoSub"], "passion8.cc");',
    '        assert!(!theme.extra_fields.contains_key("promoTitle"));\n        assert!(!theme.extra_fields.contains_key("promoSub"));\n        assert!(!theme.extra_fields.contains_key("promoUrl"));'
  );
}

function patchUpstreamThemeAssetsTestRs(text) {
  return text.replace(
    /#\[test\]\r?\nfn bundled_skin_pack_(?:theme_files_remain_byte_exact|themes_do_not_include_promotional_metadata)\(\) \{[\s\S]*?\r?\n\}\s*$/,
    `#[test]
fn bundled_skin_pack_themes_do_not_include_promotional_metadata() {
    for theme_id in [
        "caishen-lite",
        "caishen-max",
        "caishen-readable",
        "export-night",
        "global-founder-bright",
        "mythic-guardian-noir",
    ] {
        let path = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("../..")
            .join(format!(
                "assets/inject/upstream/skin-packs/packs/{theme_id}/theme.json"
            ));
        let bytes = std::fs::read(&path)
            .unwrap_or_else(|error| panic!("failed to read {}: {error}", path.display()));
        let theme: serde_json::Value = serde_json::from_slice(&bytes)
            .unwrap_or_else(|error| panic!("failed to parse {}: {error}", path.display()));
        for key in ["promoTitle", "promoSub", "promoUrl"] {
            assert!(
                theme.get(key).is_none(),
                "bundled theme still contains {key}: {}",
                path.display()
            );
        }
    }
}
`
  );
}

function patchI18nEn(text) {
  const relayDescription = `统一的 AI 模型聚合与分发网关，支持 OpenAI、Claude、Grok 兼容接口。Codex 中转注入默认使用 ${config.officialRelay.baseUrl}。`;
  return text
    .replace(
      /"JOJO Code 提供[^"\r\n]+。":\s*"JOJO Code provides[^"\r\n]+\.",/,
      `"${relayDescription}": "Unified AI model gateway supporting OpenAI, Claude, and Grok compatible APIs. Codex relay injection uses ${config.officialRelay.baseUrl} by default.",`
    )
    .replace(/"项目赞助商":\s*"Project sponsor",/, '"推荐中转": "Recommended relay",')
    .replace(
      /"仅展示 AgentDesk 内置的二狗子中转推荐，不加载上游远程广告源":\s*"[^"]*",/,
      '"Ergouzi 二狗子模型中转服务": "Ergouzi AI model relay service",'
    )
    .replace(
      /"当前仅保留 Ergouzi 二狗子推荐，其他上游赞助商与远程广告已移除。":\s*"[^"]*",/,
      '"支持 OpenAI、Claude、Grok 兼容接口。": "Supports OpenAI, Claude, and Grok compatible APIs.",'
    )
    .replace(/"打开 JOJO Code":\s*"Open JOJO Code",/, '"打开二狗子": "Open Ergouzi",')
    .replace(/^\s*"与 Codex 内插件菜单使用同一个远端广告源":\s*"[^"]*",\r?\n/m, "")
    .replace(/^\s*"内容来自[^"]*赞助商推荐和普通推荐。":\s*\r?\n\s*"[^"]*",\r?\n/m, "")
    .replace(/^\s*"暂无赞助商推荐。":\s*"[^"]*",\r?\n/m, "")
    .replace(/^\s*"暂无普通推荐。":\s*"[^"]*",\r?\n/m, "")
    .replace(/^\s*"赞助商推荐":\s*"[^"]*",\r?\n/m, "")
    .replace(/^\s*"赞助商推荐与普通推荐":\s*"[^"]*",\r?\n/m, "")
    .replace(/^\s*"从 AgentDesk-Themes 仓库加载可安装主题。":\s*"[^"]*",\r?\n/m, "")
    .replace(/^\s*"普通推荐":\s*"[^"]*",\r?\n/m, "")
    .replace(/^\s*"其他推荐":\s*"[^"]*",\r?\n/m, "")
    .replace(/^\s*"暂无其他推荐。":\s*"[^"]*",\r?\n/m, "")
    .replace(/重启 AgentDesk/g, "重启 Codex")
    .replace(/Restart AgentDesk/g, "Restart Codex");
}

function patchManagerCommands(text) {
  return text.replace(/重启 AgentDesk/g, "重启 Codex");
}

function patchRendererInjectTest(text) {
  let next = text.split(String.raw`Codex\+\+`).join("AgentDesk");
  if (!config.sessionShare.enabled) {
    next = next.replace(
      'it("adds an encrypted session sharing button to the active Codex conversation", async () => {',
      'it("keeps encrypted session sharing implemented but unreachable from the UI", async () => {'
    );
    const disabledShareAssertion = '    assert.doesNotMatch(renderer, /\\n\\s*installSessionShareButton\\(\\);/);';
    if (!next.includes(disabledShareAssertion)) {
      next = next.replace(
        '    assert.doesNotMatch(renderer, /window\\.location\\.(?:href|assign)\\s*=\\s*[^;]*markdown/);',
        `    assert.doesNotMatch(renderer, /window\\.location\\.(?:href|assign)\\s*=\\s*[^;]*markdown/);
${disabledShareAssertion}
    assert.doesNotMatch(renderer, /\\n\\s*installSessionShareImportListener\\(\\);/);`
      );
    }
  }
  return next;
}

function patchI18nKeys(text) {
  const payload = JSON.parse(text);
  const obsoleteNeedles = [
    "Ad-List",
    "远端广告源",
    "赞助商推荐",
    "普通推荐",
    "暂无赞助商",
    "暂无普通推荐",
    "官方中转站",
    "JOJO Code",
    "Discord",
    "Telegram",
    "交流群",
    "赞赏",
    "AgentDesk-Themes",
    "CodexPlusPlus-Themes",
    "CodexPlusPlusScriptMarket",
    "DreamSkin.cc",
  ];
  for (const key of ["plain", "template"]) {
    if (!Array.isArray(payload[key])) continue;
    payload[key] = payload[key]
      .filter((value) => typeof value === "string" && !obsoleteNeedles.some((needle) => value.includes(needle)))
      .map((value) => brandReplace(value).replace(/重启 AgentDesk/g, "重启 Codex"));
  }
  return `${JSON.stringify(payload, null, 2)}\n`;
}

function patchCdpBridgeTest(text) {
  return text.replace(
    '    assert!(script.contains("https://discord.gg/y96kX7A76v"));\n    assert!(script.contains("data-codex-plus-discord"));\n',
    '    let disabled_discord_url = format!("{}{}", "https://discord.gg/", "y96kX7A76v");\n    assert!(!script.contains(&disabled_discord_url));\n'
  ).replace(
    '    assert!(!script.contains("https://discord.gg/y96kX7A76v"));\n    assert!(script.contains("window.__CODEX_PLUS_SPONSOR_IMAGES__"));\n',
    '    let disabled_discord_url = format!("{}{}", "https://discord.gg/", "y96kX7A76v");\n    assert!(!script.contains(&disabled_discord_url));\n'
  ).replace(
    /#\[test\]\nfn injection_script_fetches_ads_without_bridge\(\) \{[\s\S]*?\n\}/,
    `#[test]
fn injection_script_loads_ads_only_from_local_backend() {
    let script = assets::injection_script(57321);

    assert!(script.contains("postJson(codexPlusAdsUrl, {})"));
    assert!(!script.contains("directFetchCodexPlusAds"));
    assert!(!script.contains("cacheBustCodexPlusAdUrl"));
    let disabled_ad_list = concat!("Big", "PizzaV3/", "Ad-List");
    assert!(!script.contains(&disabled_ad_list));
}`
  ).replace(
    '    assert!(!script.contains("BigPizzaV3/Ad-List"));\n',
    '    let disabled_ad_list = concat!("Big", "PizzaV3/", "Ad-List");\n    assert!(!script.contains(&disabled_ad_list));\n'
  ).replace(
    '    assert!(!script.contains("xxloocee/Ad-List"));\n',
    '    let disabled_ad_list = concat!("Big", "PizzaV3/", "Ad-List");\n    assert!(!script.contains(&disabled_ad_list));\n'
  ).replace(
    '    assert!(script.contains("window.__CODEX_PLUS_SPONSOR_IMAGES__"));\n',
    ""
  );
}

function patchAdsTest(text) {
  const templatePath = path.join(
    root,
    "scripts",
    "privateize-agentdesk.templates",
    "ads.test.rs"
  );
  return normalize(fs.readFileSync(templatePath, "utf8"));
}

function transform(relativePath, text) {
  let next = brandReplaceFiles.has(relativePath) ? brandReplace(text) : text;
  if (bundledSkinPackThemePaths.has(relativePath)) {
    next = patchBundledDreamSkinTheme(next);
  }
  switch (relativePath) {
    case ".github/ISSUE_TEMPLATE/bug_report.yml":
      next = patchBugReport(next);
      break;
    case ".github/workflows/pr-build.yml":
    case ".github/workflows/release-assets.yml":
      next = patchWorkflow(next);
      break;
    case "README.md":
      next = patchReadme(next, "zh");
      break;
    case "README_EN.md":
      next = patchReadme(next, "en");
      break;
    case "docs/index.html":
      next = patchDocsIndex(next);
      break;
    case "docs/changelog.html":
      next = patchDocsChangelog(next);
      break;
    case "services/share-site/README.md":
      next = patchShareSiteReadme(next);
      break;
    case "services/share-site/index.html":
      next = patchShareSiteIndex(next);
      break;
    case "CONTRIBUTING.md":
    case "AGENTS.md":
    case "HANDOVER.md":
      next = removeRepositoryLineage(next);
      break;
    case "assets/inject/renderer-inject.js":
      next = patchRendererInject(next);
      break;
    case "assets/inject/upstream/cidala-tiger/macos/theme.json":
    case "assets/inject/upstream/dream-skin/macos/theme.json":
      next = patchBundledDreamSkinTheme(next);
      break;
    case "apps/codex-plus-manager/src/App.tsx":
      next = patchManagerApp(next);
      next = next.replace('<div className="brand-mark">C++</div>', '<div className="brand-mark">AD</div>');
      break;
    case "apps/codex-plus-manager/src/dream-skin.ts":
      next = patchDreamSkinTs(next);
      break;
    case "apps/codex-plus-manager/src/dream-skin.test.ts":
      next = patchDreamSkinTestTs(next);
      break;
    case "apps/codex-plus-manager/src-tauri/src/commands.rs":
      next = patchManagerCommands(next);
      break;
    case "apps/codex-plus-manager/src/presets.ts":
      next = patchPresets(next);
      break;
    case "apps/codex-plus-manager/src/renderer-inject.test.ts":
      next = patchRendererInjectTest(next);
      break;
    case "apps/codex-plus-manager/src/i18n-en.ts":
      next = patchI18nEn(next);
      break;
    case "tools/i18n-keys.json":
      next = patchI18nKeys(next);
      break;
    case "crates/codex-plus-core/src/ads.rs":
      next = patchAdsRs(next);
      break;
    case "crates/codex-plus-core/src/assets.rs":
      next = patchAssetsRs(next);
      break;
    case "crates/codex-plus-core/src/update.rs":
      next = patchUpdateRs(next);
      break;
    case "crates/codex-plus-core/src/script_market.rs":
      next = patchScriptMarketRs(next);
      break;
    case "crates/codex-plus-core/src/dream_skin_community.rs":
      next = patchDreamSkinCommunityRs(next);
      break;
    case "crates/codex-plus-core/src/dream_skin_market.rs":
      next = patchDreamSkinMarketRs(next);
      break;
    case "crates/codex-plus-core/src/settings.rs":
      next = patchSettingsRs(next);
      break;
    case "crates/codex-plus-core/src/paths.rs":
      next = patchPathsRs(next);
      break;
    case "crates/codex-plus-core/src/install/windows.rs":
      next = patchWindowsInstallRs(next);
      break;
    case "crates/codex-plus-core/tests/ads.rs":
      next = patchAdsTest(next);
      break;
    case "crates/codex-plus-core/tests/cdp_bridge.rs":
      next = patchCdpBridgeTest(next);
      next = next.replace(
        '    assert!(script.contains("xxloocee/AgentDesk"));\n',
        '    assert!(script.contains("return { version: 1, ads: [] };"));\n'
      );
      break;
    case "crates/codex-plus-core/tests/dream_skin.rs":
      next = patchDreamSkinTestRs(next);
      break;
    case "crates/codex-plus-core/tests/dream_skin_market.rs":
      next = patchDreamSkinMarketTestRs(next);
      break;
    case "crates/codex-plus-core/tests/upstream_theme_assets.rs":
      next = patchUpstreamThemeAssetsTestRs(next);
      break;
    case "crates/codex-plus-core/tests/installers.rs":
      next = patchInstallersTest(next);
      break;
    case "scripts/installer/windows/CodexPlusPlus.nsi":
      next = patchWindowsInstaller(next);
      break;
    default:
      break;
  }
  // 最后再强制一次，防止文件专属补丁误伤历史兼容常量。
  next = forceLegacyConstants(next);
  return next;
}

function auditEntries(entries) {
  const needles = [
    "Codex++",
    "CodexPlusPlus",
    "BigPizzaV3",
    "BigPizzaV3/Ad-List",
    "discord.gg/y96kX7A76v",
    "data-codex-plus-discord",
    "t.me/CodexPlusPlus",
    "sponsor-alipay",
    "sponsor-wechat",
    "JOJO Code",
    "jojocode.com",
    "max.jojocode.com",
    "max2.jojocode.com",
    "jojocode-max",
    "drGuwc9k",
    "cloud.siliconflow.cn/i/",
    "Passion8",
    "passion8.cc",
    "https://codexpp.cc",
    "share.codexpp.cc",
    "codexpp-share.pages.dev",
    "docs.qq.com/doc/DQ2VOanZTTFZJcUpZ",
    "CodexPlusPlusScriptMarket",
    "AgentDesk-Themes",
    "DreamSkin.cc",
    "dreamskin.cc",
    "codex-theme-gallery.howardhua.chatgpt.site",
    "重启 AgentDesk",
    "restarting AgentDesk",
  ];
  const publicDocumentPaths = new Set([
    "README.md",
    "README_EN.md",
    "CONTRIBUTING.md",
    "AGENTS.md",
    "HANDOVER.md",
  ]);
  const publicDocumentNeedles = [
    "纯净定制",
    "纯净分支",
    "无广告",
    "上游广告",
    "第三方推广",
    "赞助商",
    "赞赏",
    "社群导流",
    "clean fork",
    "ad-free",
    "upstream ads",
    "third-party promotion",
    "Differences from Upstream",
    "与上游的差异",
  ];

  const hits = [];
  const allowedFragmentsByFile = {
    "README.md": ["[BigPizzaV3/CodexPlusPlus](https://github.com/BigPizzaV3/CodexPlusPlus)"],
    "README_EN.md": ["[BigPizzaV3/CodexPlusPlus](https://github.com/BigPizzaV3/CodexPlusPlus)"],
    // User-Agent 属于运行时协议标识，不要求随产品品牌改名。
    "crates/codex-plus-core/src/ads.rs": ['proxied_client("CodexPlusPlus")'],
    "crates/codex-plus-core/src/update.rs": [
      'format!("Codex++/{}", crate::version::VERSION)',
      "`CodexPlusPlus_1.0.9_x64.dmg`",
    ],
    // 分享实现暂时保留，只移除用户可达入口；未来接入自有服务后再替换这些兼容端点。
    "assets/inject/renderer-inject.js": [
      'const codexPlusShareBaseUrl = "https://share.codexpp.cc";',
      'const codexPlusShareFallbackBaseUrl = "https://codexpp-share.pages.dev";',
    ],
    "crates/codex-plus-core/src/session_share.rs": [
      'const SHARE_HOSTS: &[&str] = &["share.codexpp.cc", "codexpp-share.pages.dev"];',
    ],
    "crates/codex-plus-core/src/share.rs": [
      '    "https://share.codexpp.cc/api/shares",',
      '    "https://codexpp-share.pages.dev/api/shares",',
    ],
  };
  const forbiddenFragmentsByFile = {
    "apps/codex-plus-manager/src/App.tsx": [
      'className="session-share-import"',
      "await refreshScriptMarket(true);",
      "await refreshDreamSkinMarket(true);",
      "await refreshDreamSkinCommunity(true);",
      'aria-selected={themeView === "community"}',
      "pendingDreamSkinCommunity ? (",
      "赞助商推荐",
      "普通推荐",
      "暂无赞助商推荐",
      "暂无普通推荐",
    ],
    "apps/codex-plus-manager/src/i18n-en.ts": [
      "赞助商推荐",
      "普通推荐",
      "暂无赞助商推荐",
      "暂无普通推荐",
    ],
    "assets/inject/renderer-inject.js": [
      "installSessionShareButton();",
      "installSessionShareImportListener();",
    ],
    "services/share-site/README.md": ["Pages project: `codexpp-share`"],
    "services/share-site/index.html": ['<span class="brand-mark">C++</span>'],
  };
  for (const { actualPath, contents } of entries) {
    let auditableContents = contents;
    for (const fragment of allowedFragmentsByFile[actualPath] ?? []) {
      auditableContents = auditableContents.split(fragment).join("");
    }
    for (const needle of needles) {
      if (auditableContents.includes(needle)) hits.push({ file: actualPath, needle });
    }
    for (const needle of forbiddenFragmentsByFile[actualPath] ?? []) {
      if (contents.includes(needle)) hits.push({ file: actualPath, needle });
    }
    if (publicDocumentPaths.has(actualPath)) {
      for (const needle of publicDocumentNeedles) {
        if (contents.includes(needle)) hits.push({ file: actualPath, needle });
      }
    }
  }
  return hits;
}

function audit() {
  const entries = [];
  for (const relativePath of trackedFiles) {
    const actualPath = existingPath(relativePath);
    const absolute = path.join(root, actualPath);
    if (!fs.existsSync(absolute)) continue;
    entries.push({
      actualPath,
      contents: normalize(fs.readFileSync(absolute, "utf8")),
    });
  }
  const hits = auditEntries(entries);
  for (const relativePath of obsoleteAssets) {
    if (fs.existsSync(path.join(root, relativePath))) {
      hits.push({ file: relativePath, needle: "obsolete promotional asset" });
    }
  }
  return hits;
}

function readGitFile(ref, relativePath) {
  try {
    return normalize(execFileSync(
      "git",
      ["show", `${ref}:${relativePath}`],
      { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }
    ));
  } catch {
    return null;
  }
}

function verifyUpstreamTransform() {
  const ref = process.env.AGENTDESK_UPSTREAM_REF || "upstream/main";
  const entries = [];
  const nonIdempotent = [];
  const missingOptional = [];
  const missingRequired = [];
  let changed = 0;

  for (const relativePath of trackedFiles) {
    const original = readGitFile(ref, relativePath);
    if (original === null) {
      if (optionalUpstreamPaths.has(relativePath)) missingOptional.push(relativePath);
      else missingRequired.push(relativePath);
      continue;
    }
    const once = transform(relativePath, original);
    const twice = transform(relativePath, once);
    if (once !== original || outputPath(relativePath) !== relativePath) changed += 1;
    if (twice !== once) nonIdempotent.push(relativePath);
    entries.push({ actualPath: outputPath(relativePath), contents: once });
  }

  const hits = auditEntries(entries);
  console.log(`verify upstream transform: ${ref}`);
  console.log(`- transformed files: ${changed}`);
  console.log(`- missing optional paths: ${missingOptional.length}`);
  console.log(`- missing required paths: ${missingRequired.length}`);
  console.log(`- non-idempotent files: ${nonIdempotent.length}`);
  console.log(`- audit hits: ${hits.length}`);
  for (const relativePath of missingOptional) console.log(`  optional missing: ${relativePath}`);
  for (const relativePath of missingRequired) console.log(`  required missing: ${relativePath}`);
  for (const relativePath of nonIdempotent) console.log(`  non-idempotent: ${relativePath}`);
  for (const hit of hits) console.log(`  audit: ${hit.file}: ${hit.needle}`);
  if (missingRequired.length || nonIdempotent.length || hits.length) process.exitCode = 1;
}

if (verifyUpstream) {
  verifyUpstreamTransform();
  process.exit(process.exitCode || 0);
}

if (auditOnly) {
  const hits = audit();
  if (!hits.length) {
    console.log("audit ok: no privateization needles remain in tracked files");
  } else {
    console.log("audit found remaining needles:");
    for (const hit of hits) console.log(`- ${hit.file}: ${hit.needle}`);
  }
  process.exit(hits.length ? 1 : 0);
}

const changed = [];
for (const relativePath of trackedFiles) {
  const actualPath = existingPath(relativePath);
  const absolute = path.join(root, actualPath);
  if (!fs.existsSync(absolute)) continue;
  const original = normalize(fs.readFileSync(absolute, "utf8"));
  const next = transform(relativePath, original);
  const targetPath = outputPath(relativePath);
  if (next !== original || actualPath !== targetPath) {
    changed.push(actualPath === targetPath ? targetPath : `${actualPath} -> ${targetPath}`);
    if (apply) {
      write(targetPath, next);
      if (actualPath !== targetPath && fs.existsSync(path.join(root, actualPath))) {
        fs.rmSync(path.join(root, actualPath), { force: true });
      }
    }
  }
}

for (const relativePath of obsoleteAssets) {
  const absolute = path.join(root, relativePath);
  if (!fs.existsSync(absolute)) continue;
  changed.push(relativePath);
  if (apply) fs.rmSync(absolute, { force: true });
}

console.log(`${dryRun ? "dry-run" : "applied"} privateization changes:`);
for (const relativePath of changed) console.log(`- ${relativePath}`);
if (!changed.length) console.log("- no changes");

if (apply) {
  const hits = audit();
  if (!hits.length) {
    console.log("\naudit ok: no privateization needles remain in tracked files");
  } else {
    console.log("\naudit found remaining needles:");
    for (const hit of hits) console.log(`- ${hit.file}: ${hit.needle}`);
    process.exitCode = 1;
  }
}
