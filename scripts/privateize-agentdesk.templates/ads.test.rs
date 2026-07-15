use std::io::{Read, Write};
use std::net::TcpListener;
use std::thread;

use codex_plus_core::ads::{
    DEFAULT_AD_LIST_URLS, cache_busted_ad_url, fetch_ad_list, fetch_ad_list_from_urls,
    normalize_ad_payload,
};
use serde_json::json;

#[test]
fn default_ad_urls_are_disabled_in_clean_fork() {
    assert!(DEFAULT_AD_LIST_URLS.is_empty());
}

#[test]
fn cache_busted_ad_url_appends_version_query_to_plain_url() {
    assert_eq!(
        cache_busted_ad_url("https://example.test/ads.json", 1779035222758),
        "https://example.test/ads.json?v=1779035222758"
    );
}

#[test]
fn cache_busted_ad_url_preserves_existing_query() {
    assert_eq!(
        cache_busted_ad_url("https://example.test/ads.json?source=cdn", 1779035222758),
        "https://example.test/ads.json?source=cdn&v=1779035222758"
    );
}

#[test]
fn normalize_ad_payload_only_keeps_ergouzi_builtin() {
    let payload = normalize_ad_payload(json!({
        "version": 1,
        "ads": [
            {
                "id": "sponsor",
                "type": "sponsor",
                "title": "赞助商",
                "description": "推荐内容",
                "url": "https://example.test",
                "highlights": ["稳定"]
            },
            {
                "id": "normal",
                "type": "normal",
                "title": "普通推荐",
                "description": "推荐内容",
                "url": "https://example.org"
            },
            {
                "id": "cubence",
                "type": "sponsor",
                "title": "Cubence",
                "description": "应被过滤",
                "url": "https://cubence.com"
            }
        ]
    }));

    assert_eq!(payload["version"], json!(1));
    let ads = payload["ads"].as_array().unwrap();
    assert_eq!(ads.len(), 1);
    assert_eq!(ads[0]["id"], json!("ergouzi"));
    assert_eq!(ads[0]["title"], json!("Ergouzi 二狗子"));
    assert_eq!(ads[0]["url"], json!("https://ergouzi.life"));
    assert_eq!(ads[0]["highlights"], json!(["OpenAI", "Claude", "Grok"]));
    assert!(
        ads[0]["image"]
            .as_str()
            .unwrap()
            .starts_with("data:image/png;base64,")
    );
}

#[tokio::test]
async fn fetch_ad_list_returns_only_ergouzi() {
    let payload = fetch_ad_list().await.unwrap();
    let ads = payload["ads"].as_array().unwrap();
    assert_eq!(ads.len(), 1);
    assert_eq!(ads[0]["id"], json!("ergouzi"));
}

#[tokio::test]
async fn fetch_ad_list_from_urls_still_collapses_to_ergouzi() {
    let listener = TcpListener::bind("127.0.0.1:0").unwrap();
    let port = listener.local_addr().unwrap().port();
    let thread = thread::spawn(move || {
        let (mut stream, _) = listener.accept().unwrap();
        let mut request = Vec::new();
        let mut buffer = [0; 1024];
        while !request.windows(4).any(|window| window == b"\r\n\r\n") {
            let read = stream.read(&mut buffer).unwrap();
            assert!(read > 0, "client closed before sending complete headers");
            request.extend_from_slice(&buffer[..read]);
        }
        let body = r#"{"version":1,"ads":[{"id":"remote","type":"sponsor","title":"Remote","description":"x","url":"https://example.test"}]}"#;
        let response = format!(
            "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{body}",
            body.len()
        );
        stream.write_all(response.as_bytes()).unwrap();
    });

    let payload = fetch_ad_list_from_urls(&[format!("http://127.0.0.1:{port}/ads.json")])
        .await
        .unwrap();
    let ads = payload["ads"].as_array().unwrap();
    assert_eq!(ads.len(), 1);
    assert_eq!(ads[0]["id"], json!("ergouzi"));
    thread.join().unwrap();
}
