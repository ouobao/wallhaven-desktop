const { app } = require('electron')
const fs = require('node:fs')
const path = require('node:path')
const { execFile } = require('node:child_process')
const { promisify } = require('node:util')

const execFileAsync = promisify(execFile)

/* ============ 桌面壁纸 ============
 * Windows 的显示方式由注册表 HKCU\Control Panel\Desktop 下的
 * WallpaperStyle / TileWallpaper 决定，改完必须再调一次
 * SystemParametersInfo(SPI_SETDESKWALLPAPER) 才会生效。
 * 之前只调了后者，所以系统会沿用上一次的平铺/拉伸设置。
 */
const WALLPAPER_STYLES = [
  { value: 'fill', label: '填充', hint: '裁剪边缘铺满屏幕' },
  { value: 'fit', label: '适应', hint: '完整显示，可能留黑边' },
  { value: 'stretch', label: '拉伸', hint: '拉伸到屏幕比例' },
  { value: 'center', label: '居中', hint: '按原始尺寸居中' },
  { value: 'tile', label: '平铺', hint: '重复平铺填满屏幕' },
  { value: 'span', label: '跨屏铺满', hint: '多显示器拼成一整张' }
]

const STYLE_VALUES = WALLPAPER_STYLES.map((style) => style.value)
const DEFAULT_STYLE = 'fill'

function normalizeStyle(value) {
  return STYLE_VALUES.includes(value) ? value : DEFAULT_STYLE
}

const WALLPAPER_PS = `param(
  [Parameter(Mandatory = $true)][string]$ImagePath,
  [string]$Style = 'fill'
)
$ErrorActionPreference = 'Stop'
if (-not (Test-Path -LiteralPath $ImagePath)) { throw "image not found: $ImagePath" }

$map = @{
  'fill'    = @(10, 0)
  'fit'     = @(6, 0)
  'stretch' = @(2, 0)
  'center'  = @(0, 0)
  'tile'    = @(0, 1)
  'span'    = @(22, 0)
}
$choice = if ($map.ContainsKey($Style)) { $map[$Style] } else { $map['fill'] }

$desktopKey = 'HKCU:\\Control Panel\\Desktop'
Set-ItemProperty -Path $desktopKey -Name 'WallpaperStyle' -Value ([string]$choice[0])
Set-ItemProperty -Path $desktopKey -Name 'TileWallpaper' -Value ([string]$choice[1])

if (-not ([System.Management.Automation.PSTypeName]'Wallhaven.WallpaperNative').Type) {
  Add-Type -Namespace Wallhaven -Name WallpaperNative -MemberDefinition @'
[DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Unicode, EntryPoint = "SystemParametersInfoW")]
public static extern bool SystemParametersInfo(uint action, uint param, string path, uint flags);
'@
}

if (-not [Wallhaven.WallpaperNative]::SystemParametersInfo(20, 0, $ImagePath, 3)) {
  $code = [System.Runtime.InteropServices.Marshal]::GetLastWin32Error()
  throw "SystemParametersInfo failed with Win32 error $code"
}
`

/* 设置 Windows 锁屏图片（WinRT API，无需管理员权限） */
const LOCK_SCREEN_PS = `
param([string]$ImagePath)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Runtime.WindowsRuntime
[Windows.Storage.StorageFile, Windows.Storage, ContentType=WindowsRuntime] | Out-Null
[Windows.System.UserProfile.LockScreen, Windows.System.UserProfile, ContentType=WindowsRuntime] | Out-Null
$methods = [System.WindowsRuntimeSystemExtensions].GetMethods()
$asTaskGeneric = ($methods | Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation\`1' })[0]
$asTaskAction = ($methods | Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncAction' })[0]
$op = [Windows.Storage.StorageFile]::GetFileFromPathAsync($ImagePath)
$asTask = $asTaskGeneric.MakeGenericMethod([Windows.Storage.StorageFile])
$netTask = $asTask.Invoke($null, @($op))
$netTask.Wait(60000) | Out-Null
$file = $netTask.Result
$action = [Windows.System.UserProfile.LockScreen]::SetImageFileAsync($file)
$netTask2 = $asTaskAction.Invoke($null, @($action))
$netTask2.Wait(60000) | Out-Null
`

const scriptCache = new Map()

function scriptPath(name, content) {
  if (scriptCache.has(name)) return scriptCache.get(name)
  const target = path.join(app.getPath('userData'), name)
  try {
    fs.mkdirSync(path.dirname(target), { recursive: true })
    fs.writeFileSync(target, content, 'utf8')
    scriptCache.set(name, target)
    return target
  } catch (_) {
    return null
  }
}

async function setWallpaper(filePath, style = DEFAULT_STYLE) {
  if (!filePath || !fs.existsSync(filePath)) throw new Error('壁纸文件不存在')
  const nextStyle = normalizeStyle(style)

  if (process.platform === 'win32') {
    const script = scriptPath('set-wallpaper.ps1', WALLPAPER_PS)
    if (!script) throw new Error('无法写入壁纸脚本')
    try {
      await execFileAsync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', script, '-ImagePath', filePath, '-Style', nextStyle], { windowsHide: true, timeout: 60000 })
    } catch (error) {
      const detail = String(error?.stderr || error?.message || '').trim()
      throw new Error(detail ? `设置桌面壁纸失败：${detail.split('\n')[0]}` : '设置桌面壁纸失败')
    }
    return { style: nextStyle }
  }

  if (process.platform === 'darwin') {
    await execFileAsync('osascript', ['-e', `tell application "Finder" to set desktop picture to POSIX file "${filePath.replace(/"/g, '\\"')}"`])
    return { style: nextStyle }
  }

  await execFileAsync('gsettings', ['set', 'org.gnome.desktop.background', 'picture-uri', `file://${filePath}`])
  await execFileAsync('gsettings', ['set', 'org.gnome.desktop.background', 'picture-uri-dark', `file://${filePath}`]).catch(() => {})
  return { style: nextStyle }
}

async function setLockScreen(filePath) {
  if (!filePath || !fs.existsSync(filePath)) throw new Error('锁屏文件不存在')
  if (process.platform !== 'win32') throw new Error('当前系统暂不支持设置锁屏')
  const script = scriptPath('set-lockscreen.ps1', LOCK_SCREEN_PS)
  if (!script) throw new Error('无法写入锁屏脚本')
  try {
    await execFileAsync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', script, '-ImagePath', filePath], { windowsHide: true, timeout: 120000 })
  } catch (error) {
    const message = String(error?.stderr || error?.message || '')
    throw new Error(/拒绝|denied|Access/i.test(message) ? '设置锁屏失败：系统拒绝了请求，请确认图片格式受支持（JPG/PNG）' : '设置锁屏失败，请重试')
  }
  return { ok: true }
}

module.exports = {
  WALLPAPER_STYLES,
  STYLE_VALUES,
  DEFAULT_STYLE,
  normalizeStyle,
  setWallpaper,
  setLockScreen
}
