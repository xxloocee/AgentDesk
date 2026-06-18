fn main() {
    let manifest = if std::env::var("PROFILE").as_deref() == Ok("release") {
        include_str!("windows-app-manifest.xml")
    } else {
        include_str!("windows-app-manifest-dev.xml")
    };
    let windows = tauri_build::WindowsAttributes::new().app_manifest(manifest);
    let attrs = tauri_build::Attributes::new().windows_attributes(windows);
    tauri_build::try_build(attrs).expect("failed to run Tauri build script");
}
