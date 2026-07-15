use std::path::{Path, PathBuf};

use super::{
    InstallOptions, MANAGER_BINARY, MANAGER_NAME, SILENT_BINARY, SILENT_NAME,
    install_root_or_default, option_or_current_exe,
};

const UNINSTALL_SUBKEY: &str = r"Software\Microsoft\Windows\CurrentVersion\Uninstall\AgentDesk";
const URL_PROTOCOL_SUBKEY: &str = r"Software\Classes\codexplusplus";

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct WindowsEntrypointPlan {
    pub install_root: String,
    pub silent_shortcut: String,
    pub manager_shortcut: String,
    pub launcher_path: String,
    pub manager_path: String,
    pub icon_path: String,
    pub silent_icon_path: String,
    pub manager_icon_path: String,
    pub uninstaller_path: String,
    pub uninstall_command: String,
    pub quiet_uninstall_command: String,
    pub uninstall_key: String,
    pub remove_owned_data: bool,
}

pub fn build_windows_entrypoint_plan(options: &InstallOptions) -> WindowsEntrypointPlan {
    let install_root = install_root_or_default(options);
    let launcher_path = option_or_current_exe(&options.launcher_path, SILENT_BINARY);
    let manager_path = option_or_current_exe(&options.manager_path, MANAGER_BINARY);
    let icon_path = default_icon_path();
    let install_location = manager_path
        .parent()
        .map(Path::to_path_buf)
        .unwrap_or_else(|| install_root.clone());
    let uninstaller_path = install_location.join("uninstall.exe");
    let uninstall_command = format!("\"{}\"", uninstaller_path.to_string_lossy());
    let quiet_uninstall_command = format!("{uninstall_command} /S");
    WindowsEntrypointPlan {
        silent_shortcut: install_root
            .join("AgentDesk.lnk")
            .to_string_lossy()
            .to_string(),
        manager_shortcut: install_root
            .join("AgentDesk 管理工具.lnk")
            .to_string_lossy()
            .to_string(),
        install_root: install_root.to_string_lossy().to_string(),
        launcher_path: launcher_path.to_string_lossy().to_string(),
        manager_path: manager_path.to_string_lossy().to_string(),
        icon_path: icon_path.to_string_lossy().to_string(),
        silent_icon_path: launcher_path.to_string_lossy().to_string(),
        manager_icon_path: manager_path.to_string_lossy().to_string(),
        uninstaller_path: uninstaller_path.to_string_lossy().to_string(),
        uninstall_command,
        quiet_uninstall_command,
        uninstall_key: "AgentDesk".to_string(),
        remove_owned_data: options.remove_owned_data,
    }
}

#[cfg(windows)]
pub fn install_shortcuts(options: &InstallOptions) -> anyhow::Result<()> {
    let plan = build_windows_entrypoint_plan(options);
    let install_root = PathBuf::from(&plan.install_root);
    std::fs::create_dir_all(&install_root)?;
    create_entrypoint_shortcut(
        PathBuf::from(&plan.silent_shortcut),
        PathBuf::from(&plan.launcher_path),
        "Launch AgentDesk silently",
        PathBuf::from(&plan.silent_icon_path),
    )?;
    create_entrypoint_shortcut(
        PathBuf::from(&plan.manager_shortcut),
        PathBuf::from(&plan.manager_path),
        "Open AgentDesk management tool",
        PathBuf::from(&plan.manager_icon_path),
    )?;
    register_url_protocol(&plan.manager_path)?;
    write_uninstall_registration(&plan)?;
    Ok(())
}

#[cfg(windows)]
pub fn uninstall_shortcuts(options: &InstallOptions) -> anyhow::Result<()> {
    let plan = build_windows_entrypoint_plan(options);
    let _ = std::fs::remove_file(&plan.silent_shortcut);
    let _ = std::fs::remove_file(&plan.manager_shortcut);
    unregister_url_protocol_if_owned(&plan.manager_path)?;
    let _ = crate::windows_integration::delete_current_user_key(UNINSTALL_SUBKEY);
    Ok(())
}

#[cfg(not(windows))]
pub fn install_shortcuts(_options: &InstallOptions) -> anyhow::Result<()> {
    anyhow::bail!("Windows shortcuts are only supported on Windows")
}

#[cfg(not(windows))]
pub fn uninstall_shortcuts(_options: &InstallOptions) -> anyhow::Result<()> {
    anyhow::bail!("Windows shortcuts are only supported on Windows")
}

#[cfg(windows)]
fn create_entrypoint_shortcut(
    path: PathBuf,
    target: PathBuf,
    description: &str,
    icon: PathBuf,
) -> anyhow::Result<()> {
    crate::windows_integration::create_shortcut(&crate::windows_integration::ShortcutSpec {
        working_directory: target.parent().map(Path::to_path_buf),
        path,
        target,
        arguments: String::new(),
        description: description.to_string(),
        icon: Some(icon),
        show_minimized: false,
    })
}

#[cfg(windows)]
fn write_uninstall_registration(plan: &WindowsEntrypointPlan) -> anyhow::Result<()> {
    let install_location = Path::new(&plan.manager_path)
        .parent()
        .map(Path::to_path_buf)
        .unwrap_or_else(|| PathBuf::from(&plan.install_root))
        .to_string_lossy()
        .to_string();
    for (name, value) in [
        ("DisplayName", "AgentDesk".to_string()),
        ("DisplayVersion", crate::version::VERSION.to_string()),
        ("Publisher", "xxloocee".to_string()),
        ("DisplayIcon", plan.manager_icon_path.clone()),
        ("InstallLocation", install_location),
        ("UninstallString", plan.uninstall_command.clone()),
        ("QuietUninstallString", plan.quiet_uninstall_command.clone()),
    ] {
        crate::windows_integration::set_current_user_string_value(UNINSTALL_SUBKEY, name, &value)?;
    }
    Ok(())
}

#[cfg(windows)]
fn register_url_protocol(manager_path: &str) -> anyhow::Result<()> {
    crate::windows_integration::set_current_user_string_value(
        URL_PROTOCOL_SUBKEY,
        "",
        "URL:AgentDesk Import Protocol",
    )?;
    crate::windows_integration::set_current_user_string_value(
        URL_PROTOCOL_SUBKEY,
        "URL Protocol",
        "",
    )?;
    crate::windows_integration::set_current_user_string_value(
        &format!(r"{URL_PROTOCOL_SUBKEY}\shell\open\command"),
        "",
        &format!("\"{manager_path}\" \"%1\""),
    )?;
    Ok(())
}

#[cfg(windows)]
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

fn default_icon_path() -> PathBuf {
    std::env::current_exe()
        .ok()
        .and_then(|path| path.parent().map(Path::to_path_buf))
        .map(|path| path.join("codex-plus-plus.ico"))
        .unwrap_or_else(|| PathBuf::from("codex-plus-plus.ico"))
}

#[allow(dead_code)]
fn _entrypoint_names() -> (&'static str, &'static str) {
    (SILENT_NAME, MANAGER_NAME)
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
