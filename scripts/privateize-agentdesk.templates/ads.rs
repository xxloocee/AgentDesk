use serde_json::{Map, Value, json};
use std::time::{SystemTime, UNIX_EPOCH};

/// AgentDesk 纯净版只保留二狗子推荐，不再拉取上游远程 Ad-List。
const ERGOUZI_IMAGE: &[u8] = include_bytes!("../../../docs/images/sponsor-ergouzi.png");
const BUILTIN_SPONSOR_EXPIRES_AT: &str = "2099-12-31T23:59:59+08:00";

pub const DEFAULT_AD_LIST_URLS: [&str; 0] = [];

/// 规范化广告 payload。
/// 纯净版忽略远端列表，只返回内置的二狗子推荐。
pub fn normalize_ad_payload(payload: Value) -> Value {
    let version = payload.get("version").and_then(Value::as_u64).unwrap_or(1);
    let mut ads = Vec::new();
    append_builtin_sponsors(&mut ads);
    json!({ "version": version, "ads": ads })
}

fn append_builtin_sponsors(ads: &mut Vec<Value>) {
    let sponsor = builtin_sponsor(
        "ergouzi",
        "Ergouzi 二狗子",
        "统一的 AI 模型聚合与分发网关，支持 OpenAI、Claude、Grok 兼容接口。适合 Codex 中转接入与日常开发使用。",
        "https://ergouzi.life",
        ERGOUZI_IMAGE,
        &["OpenAI", "Claude", "Grok"],
    );
    let id = sponsor.get("id").and_then(Value::as_str);
    if id.is_some_and(|id| {
        ads.iter()
            .any(|ad| ad.get("id").and_then(Value::as_str) == Some(id))
    }) {
        return;
    }
    ads.push(sponsor);
}

fn builtin_sponsor(
    id: &str,
    title: &str,
    description: &str,
    url: &str,
    image: &[u8],
    highlights: &[&str],
) -> Value {
    let mut sponsor = Map::new();
    sponsor.insert("id".to_string(), json!(id));
    sponsor.insert("type".to_string(), json!("sponsor"));
    sponsor.insert("title".to_string(), json!(title));
    sponsor.insert("description".to_string(), json!(description));
    sponsor.insert("url".to_string(), json!(url));
    sponsor.insert("expires_at".to_string(), json!(BUILTIN_SPONSOR_EXPIRES_AT));
    sponsor.insert("image".to_string(), json!(data_uri("image/png", image)));
    sponsor.insert("highlights".to_string(), json!(highlights));
    Value::Object(sponsor)
}

fn data_uri(mime: &str, bytes: &[u8]) -> String {
    format!("data:{mime};base64,{}", base64_encode(bytes))
}

fn base64_encode(bytes: &[u8]) -> String {
    const TABLE: &[u8; 64] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let mut encoded = String::with_capacity(bytes.len().div_ceil(3) * 4);
    for chunk in bytes.chunks(3) {
        let first = chunk[0];
        let second = *chunk.get(1).unwrap_or(&0);
        let third = *chunk.get(2).unwrap_or(&0);
        encoded.push(TABLE[(first >> 2) as usize] as char);
        encoded.push(TABLE[(((first & 0b0000_0011) << 4) | (second >> 4)) as usize] as char);
        if chunk.len() > 1 {
            encoded.push(TABLE[(((second & 0b0000_1111) << 2) | (third >> 6)) as usize] as char);
        } else {
            encoded.push('=');
        }
        if chunk.len() > 2 {
            encoded.push(TABLE[(third & 0b0011_1111) as usize] as char);
        } else {
            encoded.push('=');
        }
    }
    encoded
}

pub async fn fetch_ad_list() -> anyhow::Result<Value> {
    Ok(normalize_ad_payload(json!({ "version": 1, "ads": [] })))
}

pub fn cache_busted_ad_url(url: &str, version: u128) -> String {
    let separator = if url.contains('?') { '&' } else { '?' };
    format!("{url}{separator}v={version}")
}

/// 保留给测试与可选私有源；AgentDesk 默认不使用远程列表。
pub async fn fetch_ad_list_from_urls<S>(urls: &[S]) -> anyhow::Result<Value>
where
    S: AsRef<str>,
{
    if urls.is_empty() {
        return Ok(normalize_ad_payload(json!({ "version": 1, "ads": [] })));
    }
    let client = crate::http_client::proxied_client("CodexPlusPlus")?;
    let cache_bust = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_millis())
        .unwrap_or_default();
    let mut last_error = None;
    for url in urls {
        let url = cache_busted_ad_url(url.as_ref(), cache_bust);
        let result = async {
            let response = client.get(url).send().await?.error_for_status()?;
            let payload = response.json::<Value>().await?;
            Ok::<_, anyhow::Error>(normalize_ad_payload(payload))
        }
        .await;
        match result {
            Ok(payload) => return Ok(payload),
            Err(error) => last_error = Some(error),
        }
    }
    Err(last_error.unwrap_or_else(|| anyhow::anyhow!("ad list unavailable")))
}
