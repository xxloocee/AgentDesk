fn main() {
    #[cfg(windows)]
    {
        let mut resource = winresource::WindowsResource::new();
        resource.set_icon("../codex-plus-manager/src-tauri/icons/icon.ico");
        let manifest = if std::env::var("PROFILE").as_deref() == Ok("release") {
            include_str!("../codex-plus-manager/src-tauri/windows-app-manifest.xml")
        } else {
            include_str!("../codex-plus-manager/src-tauri/windows-app-manifest-dev.xml")
        };
        resource.set_manifest(manifest);
        resource.compile().expect("compile launcher icon resource");
    }
}
