import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const config = JSON.parse(fs.readFileSync(path.join(root, "scripts", "privateize-agentdesk.config.json"), "utf8"));
const args = new Set(process.argv.slice(2));
const apply = args.has("--apply");
const dryRun = args.has("--dry-run") || !apply;
const auditOnly = args.has("--audit");

const trackedFiles = [
  "Cargo.toml",
  "README.md",
  "README_EN.md",
  "CONTRIBUTING.md",
  "CHANGELOG.md",
  "assets/inject/renderer-inject.js",
  "apps/codex-plus-manager/index.html",
  "apps/codex-plus-manager/src/App.tsx",
  "apps/codex-plus-manager/src/presets.ts",
  "apps/codex-plus-manager/src/styles.css",
  "apps/codex-plus-manager/src-tauri/tauri.conf.json",
  "apps/codex-plus-manager/src-tauri/src/lib.rs",
  "apps/codex-plus-manager/src-tauri/src/commands.rs",
  "apps/codex-plus-manager/src-tauri/capabilities/default.json",
  "apps/codex-plus-manager/src-tauri/tests/windows_subsystem.rs",
  "apps/codex-plus-launcher/src/main.rs",
  "crates/codex-plus-core/src/ads.rs",
  "crates/codex-plus-core/src/assets.rs",
  "crates/codex-plus-core/src/http_client.rs",
  "crates/codex-plus-core/src/install/mod.rs",
  "crates/codex-plus-core/src/install/macos.rs",
  "crates/codex-plus-core/src/install/windows.rs",
  "crates/codex-plus-core/src/launcher.rs",
  "crates/codex-plus-core/src/model_catalog.rs",
  "crates/codex-plus-core/src/paths.rs",
  "crates/codex-plus-core/src/relay_config.rs",
  "crates/codex-plus-core/src/script_market.rs",
  "crates/codex-plus-core/src/update.rs",
  "crates/codex-plus-core/src/watcher.rs",
  "crates/codex-plus-core/src/zed_remote.rs",
  "crates/codex-plus-core/tests/ads.rs",
  "crates/codex-plus-core/tests/cdp_bridge.rs",
  "crates/codex-plus-core/tests/cli_wrapper.rs",
  "crates/codex-plus-core/tests/installers.rs",
  "crates/codex-plus-core/tests/updater.rs",
  "crates/codex-plus-core/tests/watcher.rs",
  "crates/codex-plus-data/src/provider_sync.rs",
  "crates/codex-plus-data/tests/provider_sync.rs",
  "scripts/installer/macos/package-dmg.sh",
  "scripts/installer/windows/CodexPlusPlus.nsi",
];

const fileRenames = [
  {
    from: "scripts/installer/windows/CodexPlusPlus.nsi",
    to: "scripts/installer/windows/AgentDesk.nsi",
  },
];

const replacers = [
  ["https://github.com/BigPizzaV3/CodexPlusPlus/issues", config.repository.issues],
  ["https://github.com/BigPizzaV3/CodexPlusPlus", config.repository.github],
  ["github.com/BigPizzaV3/CodexPlusPlus", `github.com/${config.repository.owner}/${config.repository.name}`],
  ["BigPizzaV3/CodexPlusPlus", `${config.repository.owner}/${config.repository.name}`],
  ["BigPizzaV3/Ad-List", `${config.repository.owner}/${config.repository.name}`],
  ["BigPizzaV3", config.repository.owner],
  ["CodexPlusPlusWatcher", "AgentDeskWatcher"],
  ["CodexPlusPlusManager", "AgentDeskManager"],
  ["CodexPlusPlus", "AgentDesk"],
  ["Codex++", "AgentDesk"],
  ["Codex++ 管理工具", config.brand.managerNameZh],
  ["Codex++ 绠＄悊宸ュ叿", config.brand.managerNameZh],
  ["Codex++ 管理工具.app", `${config.brand.managerNameZh}.app`],
  ["Codex++.app", "AgentDesk.app"],
  ["Codex++.lnk", "AgentDesk.lnk"],
  [".codex-session-delete", config.brand.stateDir],
  ["com.bigpizzav3.codexplusplus.manager", `${config.brand.bundleBase}.manager`],
  ["com.bigpizzav3.codexplusplus", config.brand.bundleBase],
  ["CodexPlusPlus", "AgentDesk"],
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

function replaceSection(text, heading, replacement, stopHeadings = []) {
  const marker = `## ${heading}`;
  const start = text.indexOf(marker);
  if (start === -1) return text;
  const stops = stopHeadings
    .map((item) => text.indexOf(`## ${item}`, start + marker.length))
    .filter((index) => index !== -1);
  const fallback = text.indexOf("\n## ", start + marker.length);
  if (fallback !== -1) stops.push(fallback + 1);
  const end = stops.length ? Math.min(...stops) : text.length;
  return `${text.slice(0, start)}${replacement.trimEnd()}\n\n${text.slice(end)}`;
}

function patchReadme(text) {
  let next = text;
  next = replaceSection(next, "赞助商", "## 赞助商\n\nAgentDesk 是私有工具分支，默认移除上游赞助商展示。", ["交流与支持", "主要功能"]);
  next = replaceSection(next, "推荐内容", "## 推荐内容\n\nAgentDesk 默认禁用上游远程推荐源。如需接入私有推荐 JSON，修改 `scripts/privateize-agentdesk.config.json` 后重新运行私有化脚本。", ["更新与安装包", "主要功能"]);
  next = replaceSection(next, "交流与支持", "## 交流与支持\n\nAgentDesk 是私有工具分支，默认移除公开社群和赞赏入口。", ["主要功能", "友情链接"]);
  next = replaceSection(next, "Sponsors", "## Sponsors\n\nAgentDesk is maintained as a private internal tool. Sponsor and donation sections are disabled in this fork.", ["Highlights", "Recommendations"]);
  next = replaceSection(next, "Recommendations", "## Recommendations\n\nAgentDesk disables the upstream remote recommendation feed by default. Configure `scripts/privateize-agentdesk.config.json` if you want to use a private recommendation JSON source.", ["Updates and Packages", "Data Locations"]);
  next = replaceSection(next, "Community and Support", "## Community and Support\n\nAgentDesk is maintained as a private internal tool. Public community and donation links are disabled in this fork.", ["Friendly Links", "Notes"]);
  next = replaceSection(next, "Friendly Links", "## Friendly Links\n\nNo public community links are published in the private AgentDesk fork.", ["Notes"]);
  return next;
}

function patchAdsRs(text) {
  let next = text;
  if (config.recommendations.mode === "disabled") {
    next = next.replace(
      /pub const DEFAULT_AD_LIST_URLS: \[&str; 2\] = \[[\s\S]*?\];/,
      "pub const DEFAULT_AD_LIST_URLS: [&str; 0] = [];"
    );
    next = next.replace(
      /pub async fn fetch_ad_list\(\) -> anyhow::Result<Value> \{\s*fetch_ad_list_from_urls\(&DEFAULT_AD_LIST_URLS\)\.await\s*\}/,
      'pub async fn fetch_ad_list() -> anyhow::Result<Value> {\n    Ok(json!({ "version": 1, "ads": [] }))\n}'
    );
    return next;
  }
  const urls = config.recommendations.urls.map((url) => `    ${JSON.stringify(url)},`).join("\n");
  return next.replace(
    /pub const DEFAULT_AD_LIST_URLS: \[&str; \d+\] = \[[\s\S]*?\];/,
    `pub const DEFAULT_AD_LIST_URLS: [&str; ${config.recommendations.urls.length}] = [\n${urls}\n];`
  );
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
    /pub const DEFAULT_MARKET_INDEX_URL: &str =\s*"[^"]+";/,
    `pub const DEFAULT_MARKET_INDEX_URL: &str =\n    "${url}";`
  ).replace(
    /pub const DEFAULT_MARKET_INDEX_URL: &str =\s*"[^"]+"\s*;/,
    `pub const DEFAULT_MARKET_INDEX_URL: &str =\n    "${url}";`
  );
}

function patchPathsRs(text) {
  return text.replace(
    /const APP_STATE_DIR: &str = "[^"]+";/,
    `const APP_STATE_DIR: &str = "${config.brand.stateDir}";`
  );
}

function patchRendererInject(text) {
  let next = text;
  if (config.recommendations.mode === "disabled") {
    next = next.replace(
      /async function directFetchCodexPlusAds\(\) \{[\s\S]*?\n  \}/,
      'async function directFetchCodexPlusAds() {\n    return { version: 1, ads: [] };\n  }'
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
      '      if (target?.closest("[data-codex-plus-telegram]")) {\n        \n        return;\n      }\n',
      ""
    );
    next = next.replace(
      /<div class="codex-plus-panel" data-codex-plus-panel="support" hidden>[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*`;/,
      '<div class="codex-plus-panel" data-codex-plus-panel="support" hidden>\n            <div class="codex-plus-sponsor-text">AgentDesk 私有版未启用赞赏入口。</div>\n          </div>\n        </div>\n      </div>\n    `;'
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
  return next;
}

function patchManagerApp(text) {
  let next = text;
  if (!config.scriptMarket.enabled) {
    next = next.replace(
      /const SCRIPT_MARKET_REPOSITORY_URL = "[^"]+";/,
      'const SCRIPT_MARKET_REPOSITORY_URL = "";'
    );
    next = next.replace(
      /\s*<Button onClick=\{\(\) => void actions\.openExternalUrl\(SCRIPT_MARKET_REPOSITORY_URL\)\} variant="secondary">[\s\S]*?<\/Button>\s*/g,
      ""
    );
  } else {
    next = next.replace(
      /const SCRIPT_MARKET_REPOSITORY_URL = "[^"]*";/,
      `const SCRIPT_MARKET_REPOSITORY_URL = "${config.scriptMarket.repositoryUrl}";`
    );
  }
  if (config.recommendations.mode === "disabled") {
    next = next.replace(/\s*\{ id: "recommendations", label: "推荐内容", icon: ExternalLink \},\n/, "");
    next = next.replace(
      /<CardHead title="推荐内容" detail="与 Codex 内插件菜单使用同一个远端广告源" \/>/,
      '<CardHead title="推荐内容" detail="AgentDesk 私有版默认不加载远程推荐内容" />'
    );
    next = next.replace(
      /<span>内容来自 BigPizzaV3\/Ad-List，分为赞助商推荐和普通推荐。<\/span>/,
      "<span>AgentDesk 私有版默认禁用远程推荐源。</span>"
    );
    next = next.replace(
      /recommendations: "赞助商推荐与普通推荐",/,
      'recommendations: "私有推荐内容",'
    );
  }
  next = next.replace(
    /<Button onClick=\{\(\) => void actions\.openExternalUrl\("https:\/\/discord\.gg\/y96kX7A76v"\)\} variant="secondary">[\s\S]*?<\/Button>\s*/g,
    ""
  );
  next = next.replace(
    /<Button onClick=\{\(\) => void actions\.openExternalUrl\("https:\/\/t\.me\/AgentDesk"\)\} variant="secondary">[\s\S]*?<\/Button>\s*/g,
    ""
  );
  next = next.replace(
    /<Button onClick=\{\(\) => void actions\.openExternalUrl\("https:\/\/docs\.qq\.com\/doc\/DQ2VOanZTTFZJcUpZ#"\)\} variant="secondary">[\s\S]*?<\/Button>\s*/g,
    ""
  );
  next = next.replace(
    /Codex\+\+ 官方中转站，主打稳定接入和划算价格，支持 GPT-5\.5、GPT-5\.4、Claude Opus 4\.8、Claude Opus 4\.7、gpt-image-2 等模型与图像能力\./,
    `统一的 AI 模型聚合与分发网关，支持 OpenAI、Claude、Gemini 兼容接口。Codex 中转注入默认使用 ${config.officialRelay.baseUrl}。`
  );
  next = next
    .replace(/jojocode-/g, "relay-")
    .replace(/<h2>JOJO Code<\/h2>/g, `<h2>${config.officialRelay.displayName}</h2>`)
    .replace(
      /AgentDesk 官方中转站，主打稳定接入和划算价格，支持 GPT-5\.5、GPT-5\.4、Claude Opus 4\.8、Claude Opus 4\.7、gpt-image-2 等模型与图像能力。/g,
      `统一的 AI 模型聚合与分发网关，支持 OpenAI、Claude、Gemini 兼容接口。Codex 中转注入默认使用 ${config.officialRelay.baseUrl}。`
    )
    .replace(
      /<span>GPT-5\.5<\/span>\s*<span>GPT-5\.4<\/span>\s*<span>Opus 4\.8<\/span>\s*<span>Opus 4\.7<\/span>\s*<span>gpt-image-2<\/span>/g,
      "<span>OpenAI Compatible</span>\n                <span>Claude Compatible</span>\n                <span>Gemini Compatible</span>\n                <span>Codex 接入</span>\n                <span>BYOK</span>"
    )
    .replace(/https:\/\/jojocode\.com\/?/g, config.officialRelay.homeUrl)
    .replace(/打开 JOJO Code/g, "打开二狗子")
    .replace(/打开官方中转/g, "打开二狗子");
  return next;
}

function patchPresets(text) {
  return text
    .replace(/id: "jojocode"/g, `id: "${config.officialRelay.id}"`)
    .replace(/name: "JOJO Code"/g, `name: "${config.officialRelay.displayName}"`)
    .replace(/websiteUrl: "https:\/\/jojocode\.com\/?"/g, `websiteUrl: "${config.officialRelay.homeUrl}"`)
    .replace(/apiKeyUrl: "https:\/\/jojocode\.com\/?"/g, `apiKeyUrl: "${config.officialRelay.homeUrl}"`)
    .replace(/baseUrl: "https:\/\/jojocode\.com\/v1"/g, `baseUrl: "${config.officialRelay.baseUrl}"`);
}

function patchStyles(text) {
  return text.replace(/jojocode-/g, "relay-");
}

function patchCdpBridgeTest(text) {
  return text.replace(
    '    assert!(script.contains("https://discord.gg/y96kX7A76v"));\n    assert!(script.contains("data-codex-plus-discord"));\n',
    '    let disabled_discord_url = format!("{}{}", "https://discord.gg/", "y96kX7A76v");\n    assert!(!script.contains(&disabled_discord_url));\n    assert!(script.contains("window.__CODEX_PLUS_SPONSOR_IMAGES__"));\n'
  ).replace(
    '    assert!(!script.contains("https://discord.gg/y96kX7A76v"));\n    assert!(script.contains("window.__CODEX_PLUS_SPONSOR_IMAGES__"));\n',
    '    let disabled_discord_url = format!("{}{}", "https://discord.gg/", "y96kX7A76v");\n    assert!(!script.contains(&disabled_discord_url));\n    assert!(script.contains("window.__CODEX_PLUS_SPONSOR_IMAGES__"));\n'
  );
}

function patchAdsTest(text) {
  return text.replace(
    /assert_eq!\(\s*DEFAULT_AD_LIST_URLS,\s*\[\s*"https:\/\/raw\.githubusercontent\.com\/BigPizzaV3\/Ad-List\/main\/ads\.json",\s*"https:\/\/cdn\.jsdelivr\.net\/gh\/BigPizzaV3\/Ad-List@main\/ads\.json",\s*\]\s*\);/,
    "assert!(DEFAULT_AD_LIST_URLS.is_empty());"
  ).replace(
    "assert_eq!(DEFAULT_AD_LIST_URLS, []);",
    "assert!(DEFAULT_AD_LIST_URLS.is_empty());"
  );
}

function transform(relativePath, text) {
  let next = replaceAll(text, replacers);
  switch (relativePath) {
    case "README.md":
    case "README_EN.md":
      next = patchReadme(next);
      break;
    case "assets/inject/renderer-inject.js":
      next = patchRendererInject(next);
      break;
    case "apps/codex-plus-manager/src/App.tsx":
      next = patchManagerApp(next);
      break;
    case "apps/codex-plus-manager/src/presets.ts":
      next = patchPresets(next);
      break;
    case "apps/codex-plus-manager/src/styles.css":
      next = patchStyles(next);
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
    case "crates/codex-plus-core/src/paths.rs":
      next = patchPathsRs(next);
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
    default:
      break;
  }
  return next;
}

function audit() {
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
    "max2.jojocode.com",
  ];

  const hits = [];
  const allowedByFile = {
    "apps/codex-plus-manager/src/App.tsx": [
      "BigPizzaV3",
      "CodexPlusPlus",
      "CodexPlusPlusScriptMarket",
    ],
    "crates/codex-plus-core/src/script_market.rs": [
      "BigPizzaV3",
      "CodexPlusPlus",
      "CodexPlusPlusScriptMarket",
    ],
  };
  for (const relativePath of trackedFiles) {
    const actualPath = existingPath(relativePath);
    const absolute = path.join(root, actualPath);
    if (!fs.existsSync(absolute)) continue;
    const contents = normalize(fs.readFileSync(absolute, "utf8"));
    for (const needle of needles) {
      if (allowedByFile[actualPath]?.includes(needle)) continue;
      if (contents.includes(needle)) hits.push({ file: actualPath, needle });
    }
  }
  return hits;
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
  }
}
