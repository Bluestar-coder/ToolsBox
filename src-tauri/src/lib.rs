use std::env;
use std::fs;
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::command;
use tauri::Manager;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::process::Command;

#[derive(Deserialize)]
struct IpResponse {
    ip: String,
}

#[derive(Serialize)]
pub struct IpInfo {
    /// 本机真实 IP（通过国内服务获取，不走代理）
    pub real_ip: String,
    /// 代理 IP（通过国外服务获取，走代理）
    pub proxy_ip: Option<String>,
    /// 是否使用了代理
    pub using_proxy: bool,
}

#[derive(Serialize)]
pub struct RuntimeInfo {
    pub platform: String,
    pub arch: String,
    pub app_version: String,
    pub debug: bool,
    pub desktop: bool,
    pub native_http: bool,
    pub window_state: bool,
    pub native_fs: bool,
    pub path_opener: bool,
    pub hostname: Option<String>,
    pub app_data_dir: Option<String>,
    pub app_config_dir: Option<String>,
    pub temp_dir: Option<String>,
    pub recipe_snapshots_dir: Option<String>,
}

#[derive(Serialize)]
pub struct NativeRecipeSnapshot {
    pub name: String,
    pub path: String,
    pub size_bytes: u64,
    pub modified_unix_ms: Option<u64>,
}

fn sanitize_recipe_snapshot_name(name: &str) -> String {
    let trimmed = name.trim();
    let base = if trimmed.is_empty() { "recipe" } else { trimmed };
    let sanitized: String = base
        .chars()
        .map(|ch| {
            if ch.is_ascii_alphanumeric() || matches!(ch, '-' | '_' | ' ') {
                ch
            } else {
                '_'
            }
        })
        .collect();

    let collapsed = sanitized
        .split_whitespace()
        .filter(|part| !part.is_empty())
        .collect::<Vec<_>>()
        .join("_");

    if collapsed.is_empty() {
        "recipe".to_string()
    } else {
        collapsed
    }
}

fn system_time_to_unix_ms(time: SystemTime) -> Option<u64> {
    time.duration_since(UNIX_EPOCH)
        .ok()
        .and_then(|duration| u64::try_from(duration.as_millis()).ok())
}

fn recipe_snapshots_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let base_dir = app
        .path()
        .app_data_dir()
        .map_err(|error| format!("Failed to resolve app data dir: {error}"))?;
    let snapshots_dir = base_dir.join("recipe-snapshots");
    fs::create_dir_all(&snapshots_dir)
        .map_err(|error| format!("Failed to create recipe snapshots dir: {error}"))?;
    Ok(snapshots_dir)
}

fn ensure_snapshot_path_within_dir(path: &Path, dir: &Path) -> Result<(), String> {
    let canonical_path = path
        .canonicalize()
        .map_err(|error| format!("Failed to resolve recipe snapshot path: {error}"))?;
    let canonical_dir = dir
        .canonicalize()
        .map_err(|error| format!("Failed to resolve recipe snapshots dir: {error}"))?;

    if canonical_path.starts_with(&canonical_dir) {
        Ok(())
    } else {
        Err("Snapshot path is outside the recipe snapshots directory".to_string())
    }
}

/// 从文本中提取 IP 地址
fn extract_ip_from_text(text: &str) -> Option<String> {
    let ip_regex = regex::Regex::new(r"\b(\d{1,3}\.){3}\d{1,3}\b").ok()?;
    
    if let Some(mat) = ip_regex.find(text) {
        let ip = mat.as_str();
        let parts: Vec<&str> = ip.split('.').collect();
        if parts.len() == 4 {
            let valid = parts.iter().all(|part| part.parse::<u8>().is_ok());
            if valid {
                return Some(ip.to_string());
            }
        }
    }
    None
}

/// 从服务获取 IP
async fn fetch_ip_from_service(client: &reqwest::Client, service_url: &str) -> Option<String> {
    match client.get(service_url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                match response.text().await {
                    Ok(text) => {
                        // 尝试解析 JSON 格式
                        if let Ok(data) = serde_json::from_str::<IpResponse>(&text) {
                            return Some(data.ip);
                        } else if let Ok(data) = serde_json::from_str::<serde_json::Value>(&text) {
                            if let Some(ip) = data.get("ip").and_then(|v| v.as_str()) {
                                return Some(ip.to_string());
                            } else if let Some(ip) = data.get("origin").and_then(|v| v.as_str()) {
                                return Some(ip.to_string());
                            }
                        }
                        
                        // 如果不是 JSON，尝试从文本中提取 IP
                        return extract_ip_from_text(&text);
                    }
                    Err(_) => None,
                }
            } else {
                None
            }
        }
        Err(_) => None,
    }
}

/// 获取本机公网 IP 地址（区分真实 IP 和代理 IP）
#[command]
async fn get_public_ip() -> Result<IpInfo, String> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(10))
        .build()
        .map_err(|e| e.to_string())?;

    // 国内服务（不走代理，获取真实 IP）
    let domestic_services = [
        "http://cip.cc",
        "http://members.3322.org/dyndns/getip",
    ];

    // 国外服务（走代理，获取代理 IP）
    let foreign_services = [
        "https://api.ipify.org?format=json",
        "https://httpbin.org/ip",
    ];

    // 获取真实 IP（通过国内服务）
    let mut real_ip: Option<String> = None;
    let mut real_ip_votes: HashMap<String, u32> = HashMap::new();

    for service_url in &domestic_services {
        if let Some(ip) = fetch_ip_from_service(&client, service_url).await {
            *real_ip_votes.entry(ip.clone()).or_insert(0) += 1;
        }
    }

    // 选择出现次数最多的真实 IP
    if let Some((ip, _)) = real_ip_votes.iter().max_by_key(|&(_, count)| count) {
        real_ip = Some(ip.clone());
    }

    // 获取代理 IP（通过国外服务）
    let mut proxy_ip: Option<String> = None;
    let mut proxy_ip_votes: HashMap<String, u32> = HashMap::new();

    for service_url in &foreign_services {
        if let Some(ip) = fetch_ip_from_service(&client, service_url).await {
            *proxy_ip_votes.entry(ip.clone()).or_insert(0) += 1;
        }
    }

    // 选择出现次数最多的代理 IP
    if let Some((ip, _)) = proxy_ip_votes.iter().max_by_key(|&(_, count)| count) {
        proxy_ip = Some(ip.clone());
    }

    // 判断是否使用了代理
    let using_proxy = match (&real_ip, &proxy_ip) {
        (Some(real), Some(proxy)) => real != proxy,
        _ => false,
    };

    if let Some(real) = real_ip {
        Ok(IpInfo {
            real_ip: real,
            proxy_ip,
            using_proxy,
        })
    } else {
        Err("Failed to get public IP from all services".to_string())
    }
}

#[command]
fn get_runtime_info(app: tauri::AppHandle) -> RuntimeInfo {
    let path_resolver = app.path();
    let recipe_snapshots_dir = recipe_snapshots_dir(&app)
        .ok()
        .map(|path| path.display().to_string());
    let hostname = env::var("HOSTNAME")
        .ok()
        .or_else(|| env::var("COMPUTERNAME").ok());

    RuntimeInfo {
        platform: std::env::consts::OS.to_string(),
        arch: std::env::consts::ARCH.to_string(),
        app_version: app.package_info().version.to_string(),
        debug: cfg!(debug_assertions),
        desktop: !cfg!(any(target_os = "android", target_os = "ios")),
        native_http: true,
        window_state: true,
        native_fs: true,
        path_opener: true,
        hostname,
        app_data_dir: path_resolver
            .app_data_dir()
            .ok()
            .map(|path| path.display().to_string()),
        app_config_dir: path_resolver
            .app_config_dir()
            .ok()
            .map(|path| path.display().to_string()),
        temp_dir: path_resolver
            .temp_dir()
            .ok()
            .map(|path| path.display().to_string()),
        recipe_snapshots_dir,
    }
}

#[command]
fn open_path_in_system(path: String) -> Result<(), String> {
    if path.trim().is_empty() {
        return Err("Path cannot be empty".to_string());
    }

    #[cfg(target_os = "macos")]
    let mut command = {
        let mut cmd = Command::new("open");
        cmd.arg(&path);
        cmd
    };

    #[cfg(target_os = "windows")]
    let mut command = {
        let mut cmd = Command::new("explorer");
        cmd.arg(&path);
        cmd
    };

    #[cfg(all(unix, not(target_os = "macos")))]
    let mut command = {
        let mut cmd = Command::new("xdg-open");
        cmd.arg(&path);
        cmd
    };

    command
        .spawn()
        .map(|_| ())
        .map_err(|error| format!("Failed to open path: {error}"))
}

#[command]
fn save_recipe_snapshot(app: tauri::AppHandle, recipe_name: String, content: String) -> Result<String, String> {
    if content.trim().is_empty() {
        return Err("Recipe content cannot be empty".to_string());
    }

    let snapshots_dir = recipe_snapshots_dir(&app)?;
    let file_name = format!("{}.json", sanitize_recipe_snapshot_name(&recipe_name));
    let snapshot_path = snapshots_dir.join(file_name);

    fs::write(&snapshot_path, content)
        .map_err(|error| format!("Failed to save recipe snapshot: {error}"))?;

    Ok(snapshot_path.display().to_string())
}

#[command]
fn list_recipe_snapshots(app: tauri::AppHandle) -> Result<Vec<NativeRecipeSnapshot>, String> {
    let snapshots_dir = recipe_snapshots_dir(&app)?;
    let mut snapshots = Vec::new();

    for entry in fs::read_dir(&snapshots_dir)
        .map_err(|error| format!("Failed to read recipe snapshots directory: {error}"))?
    {
        let entry = entry.map_err(|error| format!("Failed to access recipe snapshot entry: {error}"))?;
        let path = entry.path();

        if path.extension().and_then(|ext| ext.to_str()) != Some("json") {
            continue;
        }

        let metadata = entry
            .metadata()
            .map_err(|error| format!("Failed to read recipe snapshot metadata: {error}"))?;

        snapshots.push(NativeRecipeSnapshot {
            name: path
                .file_stem()
                .and_then(|value| value.to_str())
                .unwrap_or("recipe")
                .to_string(),
            path: path.display().to_string(),
            size_bytes: metadata.len(),
            modified_unix_ms: metadata.modified().ok().and_then(system_time_to_unix_ms),
        });
    }

    snapshots.sort_by(|left, right| right.modified_unix_ms.cmp(&left.modified_unix_ms));

    Ok(snapshots)
}

#[command]
fn read_recipe_snapshot(app: tauri::AppHandle, path: String) -> Result<String, String> {
    if path.trim().is_empty() {
        return Err("Snapshot path cannot be empty".to_string());
    }

    let snapshots_dir = recipe_snapshots_dir(&app)?;
    let snapshot_path = PathBuf::from(&path);
    ensure_snapshot_path_within_dir(&snapshot_path, &snapshots_dir)?;

    fs::read_to_string(&snapshot_path)
        .map_err(|error| format!("Failed to read recipe snapshot: {error}"))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_window_state::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            get_public_ip,
            get_runtime_info,
            open_path_in_system,
            save_recipe_snapshot,
            list_recipe_snapshots,
            read_recipe_snapshot
        ])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
