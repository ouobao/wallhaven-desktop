import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { createRoot } from 'react-dom/client'
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Contrast,
  Copy,
  Download,
  ExternalLink,
  FolderOpen,
  Grid2X2,
  Heart,
  ImageDown,
  Images,
  Info,
  KeyRound,
  Layers3,
  LayoutDashboard,
  ListFilter,
  LoaderCircle,
  Lock,
  LogIn,
  Minus,
  Monitor,
  MonitorDown,
  MonitorSmartphone,
  Moon,
  Palette,
  PanelLeftClose,
  PanelLeftOpen,
  Play,
  RefreshCw,
  Search,
  Settings,
  SlidersHorizontal,
  Sparkles,
  Square,
  Star,
  Sun,
  Tag,
  Trash2,
  TriangleAlert,
  UserRound,
  X,
  Zap
} from 'lucide-react'
import './styles.css'

const DEMO_WALLPAPERS = [
  { id: 'demo-aurora', title: 'Aurora over the mountains', category: 'general', purity: 'sfw', resolution: '3840x2160', ratio: '1.78', views: 18240, favorites: 1294, created_at: '2026-09-28 08:40:00', path: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1920&q=85', thumbs: { large: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=900&q=80', small: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=500&q=75' }, colors: ['#172b4d', '#5b8db8', '#dbe6ed'], tags: [{ id: 1, name: 'mountains' }, { id: 2, name: 'night' }, { id: 3, name: 'nature' }] },
  { id: 'demo-coast', title: 'Quiet blue coast', category: 'general', purity: 'sfw', resolution: '2560x1600', ratio: '1.6', views: 9650, favorites: 806, created_at: '2026-09-27 16:20:00', path: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1920&q=85', thumbs: { large: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80', small: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=500&q=75' }, colors: ['#1b4965', '#5fa8d3', '#cae9ff'], tags: [{ id: 4, name: 'ocean' }, { id: 5, name: 'beach' }, { id: 6, name: 'blue' }] },
  { id: 'demo-forest', title: 'Misty forest road', category: 'general', purity: 'sfw', resolution: '3840x2160', ratio: '1.78', views: 11780, favorites: 1045, created_at: '2026-09-26 11:10:00', path: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1920&q=85', thumbs: { large: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=900&q=80', small: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=500&q=75' }, colors: ['#21352d', '#5f8068', '#d6decf'], tags: [{ id: 7, name: 'forest' }, { id: 8, name: 'fog' }, { id: 9, name: 'road' }] },
  { id: 'demo-desert', title: 'Dunes at golden hour', category: 'general', purity: 'sfw', resolution: '3200x1800', ratio: '1.78', views: 13420, favorites: 987, created_at: '2026-09-25 19:40:00', path: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?auto=format&fit=crop&w=1920&q=85', thumbs: { large: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?auto=format&fit=crop&w=900&q=80', small: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?auto=format&fit=crop&w=500&q=75' }, colors: ['#784f28', '#c49158', '#f4dbb0'], tags: [{ id: 10, name: 'desert' }, { id: 11, name: 'dunes' }, { id: 12, name: 'minimalism' }] },
  { id: 'demo-city', title: 'Rainy city lights', category: 'general', purity: 'sfw', resolution: '2560x1440', ratio: '1.78', views: 20350, favorites: 1584, created_at: '2026-09-24 22:15:00', path: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1920&q=85', thumbs: { large: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=900&q=80', small: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=500&q=75' }, colors: ['#17202a', '#5a6c7d', '#d3a373'], tags: [{ id: 13, name: 'city' }, { id: 14, name: 'architecture' }, { id: 15, name: 'rain' }] },
  { id: 'demo-lake', title: 'Alpine lake reflection', category: 'general', purity: 'sfw', resolution: '3840x2160', ratio: '1.78', views: 15720, favorites: 1228, created_at: '2026-09-24 09:30:00', path: 'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1920&q=85', thumbs: { large: 'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=900&q=80', small: 'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=500&q=75' }, colors: ['#223b51', '#7198a2', '#e4e7db'], tags: [{ id: 16, name: 'lake' }, { id: 17, name: 'alps' }, { id: 18, name: 'reflection' }] },
  { id: 'demo-sakura', title: 'Sakura in soft light', category: 'anime', purity: 'sfw', resolution: '2560x1440', ratio: '1.78', views: 8450, favorites: 621, created_at: '2026-09-23 14:20:00', path: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?auto=format&fit=crop&w=1920&q=85', thumbs: { large: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?auto=format&fit=crop&w=900&q=80', small: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?auto=format&fit=crop&w=500&q=75' }, colors: ['#56445a', '#ca7892', '#f4d8d2'], tags: [{ id: 19, name: 'sakura' }, { id: 20, name: 'pink' }, { id: 21, name: 'spring' }] },
  { id: 'demo-architecture', title: 'Lines and concrete', category: 'general', purity: 'sfw', resolution: '2400x1600', ratio: '1.5', views: 6790, favorites: 502, created_at: '2026-09-22 08:05:00', path: 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=1920&q=85', thumbs: { large: 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=900&q=80', small: 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=500&q=75' }, colors: ['#263238', '#85929e', '#eceff1'], tags: [{ id: 22, name: 'architecture' }, { id: 23, name: 'minimal' }, { id: 24, name: 'geometry' }] }
]

const DEFAULT_FILTERS = {
  q: '',
  categories: '111',
  purity: '100',
  sorting: 'date_added',
  order: 'desc',
  topRange: '1M',
  atleast: '',
  resolution: '',
  ratio: '',
  color: '',
  queryType: 'all'
}

/* 需要持久化的筛选字段（搜索关键词 q 不持久化，避免启动时自动套用旧搜索） */
const PERSISTED_FILTER_KEYS = ['categories', 'purity', 'sorting', 'order', 'topRange', 'atleast', 'resolution', 'ratio', 'color', 'queryType']

const NAV_ITEMS = [
  { id: 'discover', label: '发现', icon: LayoutDashboard },
  { id: 'latest', label: '最新上传', icon: Zap },
  { id: 'toplist', label: '热门榜单', icon: Star },
  { id: 'random', label: '随机探索', icon: Sparkles },
  { id: 'favorites', label: '本地收藏', icon: Heart },
  { id: 'collections', label: '我的合集', icon: Layers3 }
]

const CATEGORIES = [
  { index: 0, label: '通用' },
  { index: 1, label: '动漫' },
  { index: 2, label: '人物' }
]

const PURITIES = [
  { index: 0, label: 'SFW' },
  { index: 1, label: 'Sketchy' },
  { index: 2, label: 'NSFW' }
]

const SORT_OPTIONS = [
  { value: 'date_added', label: '最新上传' },
  { value: 'relevance', label: '相关性' },
  { value: 'random', label: '随机' },
  { value: 'views', label: '浏览量' },
  { value: 'favorites', label: '收藏数' },
  { value: 'toplist', label: '热门榜单' }
]

const RESOLUTIONS = [
  { value: '', label: '不限' },
  { value: '1920x1080', label: 'Full HD · 1920×1080' },
  { value: '2560x1440', label: '2K · 2560×1440' },
  { value: '3840x2160', label: '4K · 3840×2160' },
  { value: '7680x4320', label: '8K · 7680×4320' }
]

const EXACT_RESOLUTIONS = [
  { value: '', label: '不限' },
  { value: '1920x1080', label: '1920×1080' },
  { value: '2560x1440', label: '2560×1440' },
  { value: '3840x2160', label: '3840×2160' },
  { value: '7680x4320', label: '7680×4320' },
  { value: '1080x1920', label: '1080×1920 竖屏' }
]

const RATIOS = [
  { value: '', label: '不限比例' },
  { value: '16x9', label: '16:9 宽屏' },
  { value: '16x10', label: '16:10 宽屏' },
  { value: '21x9', label: '21:9 超宽' },
  { value: '9x16', label: '9:16 竖屏' },
  { value: '1x1', label: '1:1 方形' },
  { value: '4x3', label: '4:3' }
]

const TOP_RANGES = [
  { value: '1d', label: '最近一天' },
  { value: '3d', label: '最近三天' },
  { value: '1w', label: '最近一周' },
  { value: '1M', label: '最近一个月' },
  { value: '3M', label: '最近三个月' },
  { value: '6M', label: '最近六个月' },
  { value: '1y', label: '最近一年' }
]

const ORDER_OPTIONS = [
  { value: 'desc', label: '降序' },
  { value: 'asc', label: '升序' }
]

const COLORS = ['660000', '990000', 'cc0000', 'cc3333', 'ea4c88', '993399', '663399', '333399', '0066cc', '0099cc', '66cccc', '77cc33', '669900', '336600', '666600', '999900', 'cccc33', 'ffff00', 'ffcc33', 'ff9900', 'ff6600', 'cc6633', '996633', '663300', '000000', '999999', 'cccccc', 'ffffff', '424153']

const THEME_OPTIONS = [
  { value: 'system', label: '跟随系统', hint: '自动匹配 Windows 主题', icon: Monitor },
  { value: 'light', label: '浅色', hint: '云雾白', icon: Sun },
  { value: 'dark', label: '深色', hint: '午夜蓝', icon: Moon },
  { value: 'contrast', label: '高对比度', hint: '增强可读性', icon: Contrast }
]

const THEME_LABELS = Object.fromEntries(THEME_OPTIONS.map((option) => [option.value, option.label]))

const formatNumber = (value = 0) => new Intl.NumberFormat('zh-CN', { notation: value > 9999 ? 'compact' : 'standard', maximumFractionDigits: 1 }).format(value)
const formatDate = (value = '') => value ? value.split(' ')[0].replaceAll('-', '.') : '刚刚'
const formatBytes = (value = 0) => {
  if (!value) return '原图'
  const units = ['B', 'KB', 'MB', 'GB']
  let size = value
  let unit = 0
  while (size >= 1024 && unit < units.length - 1) { size /= 1024; unit += 1 }
  return `${size.toFixed(size >= 10 || unit === 0 ? 0 : 1)} ${units[unit]}`
}

function buildQuery(filters, page = 1, username = '', seed = '') {
  const query = {
    q: filters.q || undefined,
    categories: filters.categories,
    purity: filters.purity,
    sorting: filters.sorting,
    order: filters.order,
    topRange: filters.sorting === 'toplist' ? filters.topRange : undefined,
    atleast: filters.atleast || undefined,
    resolutions: filters.resolution || undefined,
    ratios: filters.ratio || undefined,
    colors: filters.color || undefined,
    seed: filters.sorting === 'random' && page > 1 ? seed || undefined : undefined,
    page
  }
  if (filters.queryType === 'user' && username) query.q = `@${username}`
  return Object.fromEntries(Object.entries(query).filter(([, value]) => value !== undefined && value !== ''))
}

function getThumb(wallpaper) {
  return wallpaper?.thumbs?.large || wallpaper?.thumbs?.original || wallpaper?.path
}

function getImageUrl(wallpaper) {
  return wallpaper?.path || wallpaper?.thumbs?.original || getThumb(wallpaper)
}

function getStoredFavoriteItems() {
  try {
    const value = JSON.parse(localStorage.getItem('wallhaven-favorites') || '[]')
    return Array.isArray(value) ? value.filter((item) => item && typeof item === 'object' && item.id) : []
  } catch (_) { return [] }
}

/* 读取上次保存的筛选条件，只接受已知字段，避免脏数据 */
function getStoredFilters() {
  const next = { ...DEFAULT_FILTERS }
  try {
    const raw = JSON.parse(localStorage.getItem('wallhaven-filters') || '{}')
    if (raw && typeof raw === 'object') {
      for (const key of PERSISTED_FILTER_KEYS) {
        if (typeof raw[key] === 'string') next[key] = raw[key]
      }
    }
  } catch (_) {}
  return next
}

function buildSimilarQuery(wallpaper) {
  const tags = (wallpaper?.tags || [])
    .map((tag) => String(tag?.name || '').replace(/"/g, '').trim())
    .filter(Boolean)
    .slice(0, 3)
  return tags.map((name) => `+"${name}"`).join(' ')
}

/* 智能图片：加载中显示模糊骨架，加载完成淡入清晰 */
function AppLogo({ size = 34 }) {
  return (
    <svg className="app-logo" width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="whLogoBg" x1="4" y1="2" x2="44" y2="46" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6cc8ff" />
          <stop offset="0.52" stopColor="#4a86f0" />
          <stop offset="1" stopColor="#6f5cf2" />
        </linearGradient>
        <linearGradient id="whLogoSun" x1="12" y1="11" x2="21" y2="20" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fffaf0" />
          <stop offset="1" stopColor="#ffd489" />
        </linearGradient>
        <linearGradient id="whLogoPeak" x1="22" y1="19" x2="22" y2="39" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffffff" />
          <stop offset="1" stopColor="#dfeaff" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="46" height="46" rx="12.5" fill="url(#whLogoBg)" />
      <circle cx="16" cy="15" r="4.6" fill="url(#whLogoSun)" />
      <path d="M7 38.5 L22 19 L35 38.5 Z" fill="url(#whLogoPeak)" />
      <path d="M26 38.5 L34 26 L43 38.5 Z" fill="#ffffff" fillOpacity="0.7" />
      <rect x="1" y="1" width="46" height="46" rx="12.5" stroke="#ffffff" strokeOpacity="0.24" strokeWidth="1.2" />
    </svg>
  )
}

function SmartImage({ src, alt, className = '', eager = false, onLoaded, onFailed }) {
  const [status, setStatus] = useState('loading')
  const ref = useRef(null)

  useEffect(() => {
    setStatus('loading')
    const node = ref.current
    if (node?.complete && node.naturalWidth > 0) {
      setStatus('loaded')
      onLoaded?.()
    }
  }, [src])

  const handleLoad = () => {
    setStatus('loaded')
    onLoaded?.()
  }
  const handleError = () => {
    setStatus('error')
    onFailed?.()
  }

  return (
    <img
      ref={ref}
      src={src}
      alt={alt}
      className={`smart-image ${status === 'loaded' ? 'loaded' : ''} ${status === 'error' ? 'broken' : ''} ${className}`.trim()}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      onLoad={handleLoad}
      onError={handleError}
      draggable={false}
    />
  )
}

/* 关闭动画：延迟卸载，让退场动画播放完（带重复调用保护） */
function useClosing(duration = 240) {
  const [closing, setClosing] = useState(false)
  const lockedRef = useRef(false)
  const close = useCallback((after) => {
    if (lockedRef.current) return
    lockedRef.current = true
    setClosing(true)
    window.setTimeout(() => after?.(), duration)
  }, [duration])
  return { closing, close }
}

function App() {
  const [config, setConfig] = useState({ apiKeySet: false, username: '', downloadPath: '' })
  const [configLoaded, setConfigLoaded] = useState(false)
  const [activeNav, setActiveNav] = useState('discover')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [wallpapers, setWallpapers] = useState(DEMO_WALLPAPERS)
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: DEMO_WALLPAPERS.length })
  const [randomSeed, setRandomSeed] = useState('')
  const [filters, setFilters] = useState(getStoredFilters)
  const [draftSearch, setDraftSearch] = useState('')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState({ kind: 'demo', text: '演示预览 · 配置 API Key 后连接实时内容' })
  const [selected, setSelected] = useState(null)
  const [favoriteItems, setFavoriteItems] = useState(getStoredFavoriteItems)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [isCollectionsLoading, setIsCollectionsLoading] = useState(false)
  const [collections, setCollections] = useState([])
  const [collectionItems, setCollectionItems] = useState([])
  const [activeCollection, setActiveCollection] = useState(null)
  const [toast, setToast] = useState(null)
  const [viewMode, setViewMode] = useState('grid')
  const [isMaximized, setIsMaximized] = useState(false)
  const [isFilterClosing, setIsFilterClosing] = useState(false)
  const [downloadTasks, setDownloadTasks] = useState([])
  const [isDownloadsOpen, setIsDownloadsOpen] = useState(false)
  const [isDownloadsClosing, setIsDownloadsClosing] = useState(false)
  const [duplicatePrompt, setDuplicatePrompt] = useState(null)
  const [isDuplicateClosing, setIsDuplicateClosing] = useState(false)
  const [previewFile, setPreviewFile] = useState(null)
  const [isPreviewClosing, setIsPreviewClosing] = useState(false)
  const [removePrompt, setRemovePrompt] = useState(null)
  const [isRemoveClosing, setIsRemoveClosing] = useState(false)
  const searchInputRef = useRef(null)
  const mainScrollRef = useRef(null)

  const isConnected = config.apiKeySet
  const favoriteIds = useMemo(() => favoriteItems.map((wallpaper) => wallpaper.id), [favoriteItems])
  const favoriteWallpapers = favoriteItems
  const activeDownloadCount = useMemo(() => downloadTasks.filter((task) => task.status === 'downloading' || task.status === 'queued').length, [downloadTasks])

  useEffect(() => {
    window.wallhaven?.config.get().then(setConfig).catch(() => {}).finally(() => setConfigLoaded(true))
  }, [])

  useEffect(() => {
    const api = window.wallhaven?.download
    if (!api?.onUpdate) return undefined
    api.list?.().then((tasks) => { if (Array.isArray(tasks)) setDownloadTasks(tasks) }).catch(() => {})
    const unsubscribe = api.onUpdate((task) => {
      setDownloadTasks((current) => {
        const index = current.findIndex((item) => item.taskId === task.taskId)
        if (index === -1) return [task, ...current]
        const next = [...current]
        next[index] = task
        return next
      })
      if (task.status === 'completed') {
        const parts = []
        if (task.wallpaperSet) parts.push('桌面壁纸')
        if (task.lockScreenSet) parts.push('锁屏')
        const expectsApply = task.applyTarget && task.applyTarget !== 'none'
        if (task.error) notify(parts.length ? `已设为${parts.join('与')}；${task.error}` : task.error, 'warning')
        else if (parts.length) notify(`下载完成，已设为${parts.join('与')}`)
        else if (!expectsApply) notify('下载完成')
      }
      else if (task.status === 'error') notify(task.error || '下载失败', 'warning')
    })
    return () => { try { unsubscribe?.() } catch (_) {} }
  }, [])

  useEffect(() => {
    localStorage.setItem('wallhaven-favorites', JSON.stringify(favoriteItems))
  }, [favoriteItems])

  useEffect(() => {
    try {
      const snapshot = {}
      for (const key of PERSISTED_FILTER_KEYS) snapshot[key] = filters[key]
      localStorage.setItem('wallhaven-filters', JSON.stringify(snapshot))
    } catch (_) {}
  }, [filters])

  useEffect(() => {
    const resolved = config.resolvedTheme || (config.theme === 'system' ? 'dark' : config.theme) || 'dark'
    document.documentElement.dataset.theme = resolved
    try { localStorage.setItem('wallhaven-theme-resolved', resolved) } catch (_) {}
  }, [config.theme, config.resolvedTheme])

  /* 统一的主题应用：优先使用 View Transitions 做整屏交叉淡入，避免逐节点颜色补间掉帧 */
  const applyThemeWithTransition = useCallback((updater) => {
    if (typeof document.startViewTransition === 'function' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.documentElement.classList.add('theme-switching')
      const transition = document.startViewTransition(() => setConfig(updater))
      transition.finished.finally(() => document.documentElement.classList.remove('theme-switching'))
      return
    }
    setConfig(updater)
  }, [])

  useEffect(() => {
    const api = window.wallhaven?.theme
    if (!api?.onSystemChange) return undefined
    const unsubscribe = api.onSystemChange((payload) => {
      applyThemeWithTransition((current) => ({
        ...current,
        theme: payload?.mode || current.theme,
        resolvedTheme: payload?.resolved || current.resolvedTheme,
        systemTheme: payload?.system || current.systemTheme
      }))
    })
    return () => { try { unsubscribe?.() } catch (_) {} }
  }, [applyThemeWithTransition])

  async function changeTheme(mode) {
    try {
      const result = await window.wallhaven.theme.set(mode)
      applyThemeWithTransition((current) => ({
        ...current,
        theme: result?.mode || mode,
        resolvedTheme: result?.resolved,
        systemTheme: result?.system
      }))
      notify(`已切换到${THEME_LABELS[result?.mode || mode] || '主题'}`)
    } catch (error) {
      notify(error?.message || '切换主题失败', 'warning')
    }
  }

  useEffect(() => {
    function handleShortcut(event) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [])

  useEffect(() => {
    const api = window.wallhaven?.window
    if (!api?.isMaximized) return undefined
    let mounted = true
    const sync = () => api.isMaximized().then((value) => { if (mounted) setIsMaximized(Boolean(value)) }).catch(() => {})
    sync()
    window.addEventListener('resize', sync)
    return () => { mounted = false; window.removeEventListener('resize', sync) }
  }, [])

  useEffect(() => {
    const timeout = setTimeout(() => setToast(null), 3600)
    return () => clearTimeout(timeout)
  }, [toast])

  useEffect(() => {
    if (configLoaded) loadWallpapers(filters, 1)
  }, [configLoaded])

  async function loadWallpapers(nextFilters = filters, page = 1) {
    setIsLoading(true)
    setStatus({ kind: 'loading', text: '正在同步 Wallhaven 内容…' })
    try {
      const data = await window.wallhaven.api.request('/search', buildQuery(nextFilters, page, config.username, randomSeed))
      setWallpapers(data?.data || [])
      setMeta(data?.meta || { current_page: page, last_page: page, total: data?.data?.length || 0 })
      if (nextFilters.sorting === 'random' && data?.meta?.seed) setRandomSeed(data.meta.seed)
      setStatus({ kind: 'connected', text: config.apiKeySet ? '已连接 Wallhaven API' : '公开内容 · Wallhaven API' })
    } catch (error) {
      setWallpapers(DEMO_WALLPAPERS)
      setMeta({ current_page: 1, last_page: 1, total: DEMO_WALLPAPERS.length })
      setStatus({ kind: 'demo', text: '无法连接实时 API · 当前显示演示内容' })
      notify(error?.message || '连接失败，已切换至演示内容', 'warning')
    } finally {
      setIsLoading(false)
    }
  }

  async function loadCollections() {
    if (!config.apiKeySet) {
      setCollections([])
      setCollectionItems([])
      setStatus({ kind: 'auth', text: '登录后可读取你的私有合集' })
      return
    }
    setIsCollectionsLoading(true)
    try {
      const data = await window.wallhaven.api.request('/collections')
      setCollections(data?.data || [])
      setStatus({ kind: 'connected', text: '已同步个人合集' })
    } catch (error) {
      setStatus({ kind: 'auth', text: '合集同步失败，请检查 API Key 和用户名' })
      notify(error?.message || '无法读取合集', 'warning')
    } finally {
      setIsCollectionsLoading(false)
    }
  }

  async function openCollection(collection) {
    if (!collection || !config.username) {
      notify('请先在设置中填写你的 Wallhaven 用户名', 'warning')
      setIsSettingsOpen(true)
      return
    }
    setActiveCollection(collection)
    setIsCollectionsLoading(true)
    try {
      const data = await window.wallhaven.api.request(`/collections/${encodeURIComponent(config.username)}/${collection.id}`)
      setCollectionItems(data?.data || [])
    } catch (error) {
      notify(error?.message || '无法读取该合集', 'warning')
    } finally {
      setIsCollectionsLoading(false)
    }
  }

  async function syncWallhavenSettings() {
    if (!config.apiKeySet) {
      notify('请先连接 Wallhaven API Key', 'warning')
      return
    }
    try {
      const response = await window.wallhaven.api.request('/settings')
      const settings = response?.data || {}
      const categoryValues = ['general', 'anime', 'people']
      const purityValues = ['sfw', 'sketchy', 'nsfw']
      const categories = Array.isArray(settings.categories)
        ? categoryValues.map((value) => settings.categories.map((item) => String(item).toLowerCase()).includes(value) ? '1' : '0').join('')
        : filters.categories
      const purity = Array.isArray(settings.purity)
        ? purityValues.map((value) => settings.purity.map((item) => String(item).toLowerCase()).includes(value) ? '1' : '0').join('')
        : filters.purity
      const next = {
        ...filters,
        categories: categories === '000' ? '111' : categories,
        purity: purity === '000' ? '100' : purity,
        topRange: settings.toplist_range || filters.topRange,
        resolution: Array.isArray(settings.resolutions) ? settings.resolutions[0] || '' : filters.resolution,
        ratio: Array.isArray(settings.aspect_ratios) ? settings.aspect_ratios[0]?.replace(':', 'x') || '' : filters.ratio
      }
      setFilters(next)
      loadWallpapers(next, 1)
      notify('已导入 Wallhaven 官方浏览偏好')
    } catch (error) {
      notify(error?.message || '无法读取官方浏览设置', 'warning')
    }
  }

  function notify(message, type = 'info') {
    setToast({ message, type })
  }

  function updateFilter(key, value) {
    setFilters((current) => ({ ...current, [key]: value }))
  }

  function toggleMask(key, index, allowEmpty = false) {
    const current = filters[key].padEnd(3, '0').slice(0, 3).split('')
    const next = current[index] === '1' ? '0' : '1'
    if (!allowEmpty && next === '0' && current.filter((bit) => bit === '1').length === 1) return
    current[index] = next
    updateFilter(key, current.join(''))
  }

  async function openWallpaper(wallpaper) {
    setSelected({ ...wallpaper, detailLoading: true })
    try {
      const response = await window.wallhaven.api.request(`/w/${encodeURIComponent(wallpaper.id)}`)
      setSelected(response?.data ? { ...response.data, detailLoading: false } : { ...wallpaper, detailLoading: false })
    } catch (_) {
      setSelected({ ...wallpaper, detailLoading: false })
    }
  }

  function submitSearch(event) {
    event?.preventDefault()
    const next = { ...filters, q: draftSearch.trim() }
    setFilters(next)
    setActiveNav('discover')
    loadWallpapers(next, 1)
  }

  function handleNav(id) {
    setActiveNav(id)
    setActiveCollection(null)
    mainScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
    if (id === 'latest') {
      const next = { ...filters, q: '', sorting: 'date_added', queryType: 'all' }
      setFilters(next)
      loadWallpapers(next, 1)
    } else if (id === 'toplist') {
      const next = { ...filters, q: '', sorting: 'toplist', topRange: '1M', queryType: 'all' }
      setFilters(next)
      loadWallpapers(next, 1)
    } else if (id === 'random') {
      const next = { ...filters, q: '', sorting: 'random', queryType: 'all' }
      setRandomSeed('')
      setFilters(next)
      loadWallpapers(next, 1)
    } else if (id === 'favorites') {
      setWallpapers(favoriteWallpapers)
      setMeta({ current_page: 1, last_page: 1, total: favoriteWallpapers.length })
    } else if (id === 'collections') {
      loadCollections()
    } else if (id === 'discover') {
      loadWallpapers(filters, 1)
    }
  }

  function toggleFavorite(wallpaper) {
    setFavoriteItems((current) => current.some((item) => item.id === wallpaper.id) ? current.filter((item) => item.id !== wallpaper.id) : [...current, wallpaper])
    notify(favoriteIds.includes(wallpaper.id) ? '已从本地收藏移除' : '已加入本地收藏')
  }

  function buildDownloadPayload(wallpaper) {
    return {
      id: wallpaper.id,
      imageUrl: getImageUrl(wallpaper),
      extension: wallpaper.file_type?.split('/')[1] || 'jpg',
      title: wallpaper.title || `Wallhaven ${wallpaper.id}`,
      thumb: getThumb(wallpaper)
    }
  }

  function applyTargetMessage(target, result) {
    const wallpaperDone = result ? result.wallpaper : false
    const lockDone = result ? result.lockscreen : false
    if (target === 'both') return wallpaperDone && lockDone ? '已设为桌面壁纸与锁屏' : wallpaperDone ? '已设为桌面壁纸（锁屏设置失败）' : '已设为锁屏（壁纸设置失败）'
    if (target === 'lockscreen') return '已设为锁屏'
    return '已设为桌面壁纸'
  }

  async function startDownload(payload, target = 'none') {
    try {
      const api = window.wallhaven.download
      await (target === 'wallpaper' ? api.setWallpaper(payload)
        : target === 'lockscreen' ? api.setLockScreen(payload)
          : target === 'both' ? api.setBoth(payload)
            : api.wallpaper(payload))
      setIsDownloadsOpen(true)
      // 完成通知统一由 download:update 监听器处理
    } catch (error) {
      notify(error?.message || '下载失败', 'warning')
    }
  }

  async function downloadWallpaper(wallpaper, target = 'none') {
    const payload = buildDownloadPayload(wallpaper)
    try {
      const check = await window.wallhaven.download.check(payload)
      if (check?.active) {
        // 已有任务进行中：若本次意图是设置壁纸/锁屏，更新该任务的目标
        if (target !== 'none') {
          const api = window.wallhaven.download
          if (target === 'wallpaper') await api.setWallpaper(payload)
          else if (target === 'lockscreen') await api.setLockScreen(payload)
          else if (target === 'both') await api.setBoth(payload)
        }
        setIsDownloadsOpen(true)
        return
      }
      if (check?.exists) {
        // 已下载过：直接应用，不再弹重复提示
        if (target !== 'none') {
          await applyFile(check.filePath, target)
          return
        }
        setDuplicatePrompt({ wallpaper, payload, filePath: check.filePath })
        return
      }
    } catch (_) {}
    await startDownload(payload, target)
  }

  function closeDuplicatePrompt() {
    if (!duplicatePrompt || isDuplicateClosing) return
    setIsDuplicateClosing(true)
    window.setTimeout(() => { setDuplicatePrompt(null); setIsDuplicateClosing(false) }, 220)
  }

  async function applyFile(filePath, target) {
    if (!filePath) return
    try {
      const result = await window.wallhaven.system.apply({ filePath, target })
      setDownloadTasks((current) => current.map((task) => (task.filePath === filePath
        ? { ...task, wallpaperSet: task.wallpaperSet || result.wallpaper, lockScreenSet: task.lockScreenSet || result.lockscreen }
        : task)))
      notify(applyTargetMessage(target, result))
    } catch (error) {
      notify(error?.message || '设置失败', 'warning')
    }
  }

  function openDownloadPreview(filePath, title) {
    setPreviewFile({ filePath, title: title || '预览' })
  }

  function closeDownloadPreview() {
    if (!previewFile || isPreviewClosing) return
    setIsPreviewClosing(true)
    window.setTimeout(() => { setPreviewFile(null); setIsPreviewClosing(false) }, 220)
  }

  function redownloadDuplicate() {
    if (!duplicatePrompt) return
    const { payload } = duplicatePrompt
    closeDuplicatePrompt()
    window.setTimeout(() => startDownload(payload), 230)
  }

  function previewDuplicate() {
    if (!duplicatePrompt) return
    const { filePath, wallpaper } = duplicatePrompt
    closeDuplicatePrompt()
    window.setTimeout(() => openDownloadPreview(filePath, wallpaper.title || `Wallhaven · ${wallpaper.id}`), 230)
  }

  function setDuplicateTarget(target) {
    if (!duplicatePrompt) return
    const filePath = duplicatePrompt.filePath
    closeDuplicatePrompt()
    window.setTimeout(() => applyFile(filePath, target), 230)
  }

  async function cancelDownload(taskId) {
    try { await window.wallhaven.download.cancel(taskId) } catch (_) {}
  }

  async function retryDownload(taskId) {
    try { await window.wallhaven.download.retry(taskId) } catch (error) { notify(error?.message || '重试失败', 'warning') }
  }

  async function removeDownload(taskId, deleteFile = false) {
    setDownloadTasks((current) => current.filter((task) => task.taskId !== taskId))
    try {
      const result = await window.wallhaven.download.remove(taskId, { deleteFile })
      if (result?.fileDeleted) notify('已移除记录并删除本地文件')
      else if (result?.error) notify(result.error, 'warning')
      else if (deleteFile) notify('已移除记录')
    } catch (error) {
      notify(error?.message || '移除失败', 'warning')
    }
  }

  function closeRemovePrompt() {
    if (!removePrompt || isRemoveClosing) return
    setIsRemoveClosing(true)
    window.setTimeout(() => { setRemovePrompt(null); setIsRemoveClosing(false) }, 220)
  }

  async function requestRemove(task) {
    let info = { exists: false, size: 0 }
    try { info = await window.wallhaven.download.fileInfo(task.filePath) } catch (_) {}
    // 本地文件不存在时没有可选项，直接移除记录
    if (!info?.exists) { removeDownload(task.taskId, false); return }
    setRemovePrompt({
      taskId: task.taskId,
      title: task.title,
      filePath: task.filePath,
      fileSize: info.size
    })
  }

  function confirmRemove(deleteFile) {
    if (!removePrompt) return
    const taskId = removePrompt.taskId
    closeRemovePrompt()
    window.setTimeout(() => removeDownload(taskId, deleteFile), 230)
  }

  async function clearFinishedDownloads() {
    setDownloadTasks((current) => current.filter((task) => task.status === 'downloading' || task.status === 'queued'))
    try { await window.wallhaven.download.clearFinished() } catch (_) {}
  }

  function closeDownloads() {
    if (!isDownloadsOpen || isDownloadsClosing) return
    setIsDownloadsClosing(true)
    window.setTimeout(() => { setIsDownloadsOpen(false); setIsDownloadsClosing(false) }, 220)
  }

  async function chooseDownloadFolder() {
    const folder = await window.wallhaven.download.chooseFolder()
    if (folder) {
      setConfig((current) => ({ ...current, downloadPath: folder }))
      notify('下载目录已更新')
    }
  }

  function minimizeWindow() { window.wallhaven?.window?.minimize() }
  function toggleMaximizeWindow() { window.wallhaven?.window?.maximize() }
  function closeWindow() { window.wallhaven?.window?.close() }

  function closeFilter() {
    if (!isFilterOpen || isFilterClosing) return
    setIsFilterClosing(true)
    window.setTimeout(() => { setIsFilterOpen(false); setIsFilterClosing(false) }, 200)
  }

  function applyFilter() {
    setIsFilterOpen(false)
    setIsFilterClosing(false)
    loadWallpapers(filters, 1)
  }

  function changePage(page) {
    if (page < 1 || page > (meta.last_page || 1) || isLoading) return
    loadWallpapers(filters, page)
    mainScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const displayWallpapers = activeNav === 'favorites' ? favoriteWallpapers : activeNav === 'collections' && activeCollection ? collectionItems : wallpapers
  const activeLabel = activeNav === 'discover' ? (filters.q ? `搜索：${filters.q}` : '精选推荐') : NAV_ITEMS.find((item) => item.id === activeNav)?.label || '精选推荐'

  return (
    <div className="app-frame">
      <header className="titlebar">
        <div className="titlebar-title"><span className="titlebar-dot" />Wallhaven Studio</div>
        <div className="window-controls">
          <button className="window-button" onClick={minimizeWindow} aria-label="最小化" title="最小化"><Minus size={14} /></button>
          <button className="window-button" onClick={toggleMaximizeWindow} aria-label={isMaximized ? '向下还原' : '最大化'} title={isMaximized ? '向下还原' : '最大化'}>{isMaximized ? <Copy size={12} /> : <Square size={12} />}</button>
          <button className="window-button close" onClick={closeWindow} aria-label="关闭" title="关闭"><X size={15} /></button>
        </div>
      </header>

      <div className={`app-shell ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <aside className="sidebar">
        <div className="brand-lockup">
          <div className="brand-mark"><AppLogo size={34} /></div>
          <div className="brand-copy"><strong>Wallhaven</strong><span>STUDIO</span></div>
        </div>

        <nav className="primary-nav" aria-label="主导航">
          <div className="nav-heading">浏览</div>
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button key={id} className={`nav-item ${activeNav === id ? 'active' : ''}`} onClick={() => handleNav(id)} title={sidebarCollapsed ? label : undefined}>
              <span className="nav-icon"><Icon size={16} strokeWidth={2.2} /></span>
              <span className="nav-label">{label}</span>
              {id === 'favorites' && favoriteIds.length > 0 && <small>{favoriteIds.length}</small>}
            </button>
          ))}
        </nav>

        <div className="nav-heading nav-heading-secondary">工作区</div>
        <div className="primary-nav">
          <button className={`nav-item ${isDownloadsOpen ? 'active' : ''}`} onClick={() => setIsDownloadsOpen(true)} title={sidebarCollapsed ? '下载管理' : undefined}>
            <span className="nav-icon"><Download size={16} strokeWidth={2.2} /></span>
            <span className="nav-label">下载管理</span>
            {activeDownloadCount > 0 && <small>{activeDownloadCount}</small>}
          </button>
          <button className="nav-item" onClick={() => setIsSettingsOpen(true)} title={sidebarCollapsed ? '偏好设置' : undefined}>
            <span className="nav-icon"><Settings size={16} strokeWidth={2.2} /></span>
            <span className="nav-label">偏好设置</span>
          </button>
          <button className="nav-item" onClick={() => setIsLoginOpen(true)} title={sidebarCollapsed ? '账户连接' : undefined}>
            <span className="nav-icon"><KeyRound size={16} strokeWidth={2.2} /></span>
            <span className="nav-label">账户连接</span>
            {isConnected && <i className="status-dot" />}
          </button>
        </div>

        <div className="sidebar-bottom">
          <div className={`account-card ${isConnected ? 'connected' : ''}`} onClick={() => setIsLoginOpen(true)} role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') setIsLoginOpen(true) }}>
            <div className="account-avatar">{isConnected ? <UserRound size={16} /> : <LogIn size={16} />}</div>
            {!sidebarCollapsed && <div className="account-copy"><strong>{isConnected ? (config.username || '已连接账户') : '未连接账户'}</strong><span>{isConnected ? 'API Key 已启用' : '点击连接账户'}</span></div>}
            {!sidebarCollapsed && <ChevronRight size={15} className="account-chevron" />}
          </div>
          <button className="collapse-button" onClick={() => setSidebarCollapsed((current) => !current)} aria-label={sidebarCollapsed ? '展开侧栏' : '收起侧栏'}>
            {sidebarCollapsed ? <PanelLeftOpen size={17} /> : <><PanelLeftClose size={17} /><span>收起侧栏</span></>}
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <form className="search-bar" onSubmit={submitSearch}>
            <Search size={18} />
            <input ref={searchInputRef} value={draftSearch} onChange={(event) => setDraftSearch(event.target.value)} placeholder="搜索标签、主题或 @用户名…" aria-label="搜索壁纸" />
            {draftSearch && <button type="button" className="clear-search" onClick={() => setDraftSearch('')} aria-label="清空搜索"><X size={15} /></button>}
            <kbd>Ctrl K</kbd>
          </form>
          <div className="topbar-actions">
            <button className="icon-button" onClick={() => loadWallpapers(filters, 1)} aria-label="刷新内容" title="刷新内容"><RefreshCw size={18} className={isLoading ? 'spin' : ''} /></button>
            <ThemeSwitcher mode={config.theme || 'system'} resolved={config.resolvedTheme} systemTheme={config.systemTheme} onChange={changeTheme} />
            <button className={`icon-button download-indicator ${activeDownloadCount > 0 ? 'busy' : ''}`} onClick={() => setIsDownloadsOpen(true)} aria-label="下载管理" title="下载管理">
              <ArrowDownToLine size={18} />
              {activeDownloadCount > 0 && <span className="download-badge">{activeDownloadCount}</span>}
            </button>
            <button className="user-trigger" onClick={() => setIsLoginOpen(true)}><span className={`user-status ${isConnected ? 'online' : ''}`} /><span>{isConnected ? (config.username || '我的账户') : '连接账户'}</span><ChevronDown size={14} /></button>
          </div>
        </header>

        <section className="content-wrap" ref={mainScrollRef}>
          <div className="page-heading">
            <div>
              <div className="eyebrow"><span className={`live-dot ${status.kind}`} />{status.text}</div>
              <h1 key={activeLabel} className="title-swap">{activeLabel}</h1>
              <p>{activeNav === 'discover' ? '为你的桌面挑选下一张高质量壁纸。' : activeNav === 'collections' ? '集中管理你在 Wallhaven 上创建的主题合集。' : '持续更新的高质量桌面与移动壁纸。'}</p>
            </div>
            <div className="heading-actions">
              <div className="view-switcher" role="group" aria-label="视图模式">
                <button className={viewMode === 'grid' ? 'active' : ''} onClick={() => setViewMode('grid')} aria-label="网格视图"><Grid2X2 size={16} /></button>
                <button className={viewMode === 'list' ? 'active' : ''} onClick={() => setViewMode('list')} aria-label="列表视图"><ListFilter size={16} /></button>
              </div>
              <button className="outline-button" onClick={() => setIsFilterOpen((current) => !current)} aria-expanded={isFilterOpen}><SlidersHorizontal size={16} />筛选器<span className="filter-count">{countActiveFilters(filters)}</span></button>
            </div>
          </div>

          {activeNav === 'collections' ? (
            <div className="content-swap" key={`collections-${activeCollection?.id || 'root'}`}>
              <CollectionsView collections={collections} activeCollection={activeCollection} collectionItems={collectionItems} favoriteIds={favoriteIds} isLoading={isCollectionsLoading} onOpen={openCollection} onBack={() => setActiveCollection(null)} onConnect={() => setIsLoginOpen(true)} onSelect={openWallpaper} onFavorite={toggleFavorite} onDownload={downloadWallpaper} connected={isConnected} />
            </div>
          ) : (
            <div className="content-swap" key={`${activeNav}-${filters.q}`}>
              <div className="results-toolbar">
                <span><strong>{formatNumber(meta.total || displayWallpapers.length)}</strong> 张壁纸</span>
                <div className="toolbar-actions">
                  <button className="text-button" onClick={() => setIsFilterOpen(true)}><Palette size={15} />按颜色筛选</button>
                  <span className="sort-label">排序</span>
                  <SelectMenu className="compact" value={filters.sorting} options={SORT_OPTIONS} onChange={(next) => { const nextFilters = { ...filters, sorting: next }; setFilters(nextFilters); loadWallpapers(nextFilters, 1) }} ariaLabel="排序方式" />
                </div>
              </div>

              {isLoading && <GallerySkeleton viewMode={viewMode} />}
              {!isLoading && displayWallpapers.length === 0 && <EmptyState activeNav={activeNav} onExplore={() => handleNav('discover')} />}
              {!isLoading && displayWallpapers.length > 0 && <Gallery wallpapers={displayWallpapers} viewMode={viewMode} favoriteIds={favoriteIds} onSelect={openWallpaper} onFavorite={toggleFavorite} onDownload={downloadWallpaper} />}

              {!isLoading && activeNav !== 'favorites' && (meta.last_page > 1 || meta.current_page > 1) && <Pagination meta={meta} onChange={changePage} />}
            </div>
          )}
        </section>
      </main>

      {isFilterOpen && (
        <div className={`filter-overlay ${isFilterClosing ? 'closing' : ''}`}>
          <div className="filter-backdrop" onClick={closeFilter} />
          <div className="filter-popover">
            <FilterPanel filters={filters} updateFilter={updateFilter} toggleMask={toggleMask} hasApiKey={isConnected} onSync={syncWallhavenSettings} onApply={applyFilter} onClose={closeFilter} onReset={() => setFilters({ ...DEFAULT_FILTERS })} />
          </div>
        </div>
      )}

      {isDownloadsOpen && <DownloadsPanel tasks={downloadTasks} closing={isDownloadsClosing} activeCount={activeDownloadCount} onClose={closeDownloads} onCancel={cancelDownload} onRetry={retryDownload} onClearFinished={clearFinishedDownloads} onPreview={openDownloadPreview} onApplyTarget={applyFile} onRemove={requestRemove} />}
      {duplicatePrompt && <DuplicateDownloadModal data={duplicatePrompt} closing={isDuplicateClosing} onClose={closeDuplicatePrompt} onRedownload={redownloadDuplicate} onPreview={previewDuplicate} onApplyTarget={setDuplicateTarget} />}
      {previewFile && <DownloadPreviewModal data={previewFile} closing={isPreviewClosing} onClose={closeDownloadPreview} onApplyTarget={applyFile} />}
      {removePrompt && <RemoveDownloadModal data={removePrompt} closing={isRemoveClosing} onClose={closeRemovePrompt} onRemoveOnly={() => confirmRemove(false)} onRemoveAndDelete={() => confirmRemove(true)} />}
      {selected && <WallpaperModal wallpaper={selected} isFavorite={favoriteIds.includes(selected.id)} onClose={() => setSelected(null)} onFavorite={() => toggleFavorite(selected)} onDownload={downloadWallpaper} onSimilar={() => { const similarQuery = buildSimilarQuery(selected); if (!similarQuery) { notify('这张壁纸没有可用于查找相似的标签', 'warning'); return } setSelected(null); const next = { ...filters, q: similarQuery }; setFilters(next); setDraftSearch(similarQuery); setActiveNav('discover'); loadWallpapers(next, 1) }} onTag={(tag) => { setSelected(null); const next = { ...filters, q: tag }; setFilters(next); setDraftSearch(tag); setActiveNav('discover'); loadWallpapers(next, 1) }} onOpenExternal={() => window.wallhaven.openExternal(selected.url || `https://wallhaven.cc/w/${selected.id}`)} />}
      {isLoginOpen && <AccountModal config={config} onClose={() => setIsLoginOpen(false)} onSaved={(next) => { setConfig(next); setIsLoginOpen(false); notify('账户配置已保存'); loadWallpapers(filters, 1) }} onDisconnect={async () => { const next = await window.wallhaven.config.save({ apiKey: '' }); setConfig(next); setIsLoginOpen(false); setActiveNav('discover'); notify('已断开 Wallhaven API Key'); loadWallpapers(filters, 1) }} />}
      {isSettingsOpen && <SettingsModal config={config} onClose={() => setIsSettingsOpen(false)} onSaved={(next) => { setConfig(next); setIsSettingsOpen(false); notify('偏好设置已保存') }} onChooseFolder={chooseDownloadFolder} />}
      {toast && <div className={`toast ${toast.type}`}><span className="toast-icon">{toast.type === 'warning' ? <Info size={16} /> : <Check size={16} />}</span>{toast.message}</div>}
      </div>
    </div>
  )
}

function ThemeSwitcher({ mode, resolved, systemTheme, onChange }) {
  const [isOpen, setIsOpen] = useState(false)
  const [menuPos, setMenuPos] = useState(null)
  const rootRef = useRef(null)
  const triggerRef = useRef(null)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return undefined
    function handleOutside(event) {
      if (rootRef.current?.contains(event.target)) return
      if (menuRef.current?.contains(event.target)) return
      setIsOpen(false)
    }
    function handleKey(event) {
      if (event.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('keydown', handleKey)
    }
  }, [isOpen])

  const toggleMenu = () => {
    if (isOpen) { setIsOpen(false); return }
    const rect = triggerRef.current?.getBoundingClientRect()
    if (!rect) return
    setMenuPos({ top: Math.round(rect.bottom + 10), right: Math.round(Math.max(12, window.innerWidth - rect.right)) })
    setIsOpen(true)
  }

  const current = THEME_OPTIONS.find((option) => option.value === mode) || THEME_OPTIONS[0]
  const CurrentIcon = current.icon
  const effectiveTheme = resolved || (mode === 'system' ? systemTheme : mode) || 'dark'

  return (
    <div className="theme-switcher" ref={rootRef}>
      <button
        ref={triggerRef}
        className={`icon-button theme-trigger ${isOpen ? 'open' : ''}`}
        onClick={toggleMenu}
        aria-label="切换主题"
        aria-expanded={isOpen}
        title={`主题：${current.label}${mode === 'system' ? `（当前${effectiveTheme === 'dark' ? '深色' : '浅色'}）` : ''}`}
      >
        <CurrentIcon size={18} />
      </button>
      {isOpen && menuPos && createPortal((
        <div className="theme-menu" role="menu" ref={menuRef} style={{ top: menuPos.top, right: menuPos.right }}>
          <div className="theme-menu-head">
            <span>界面主题</span>
            <small>当前：{effectiveTheme === 'dark' ? '深色' : effectiveTheme === 'contrast' ? '高对比度' : '浅色'}</small>
          </div>
          {THEME_OPTIONS.map((option) => {
            const Icon = option.icon
            const isActive = option.value === mode
            return (
              <button
                key={option.value}
                role="menuitemradio"
                aria-checked={isActive}
                className={`theme-option ${isActive ? 'active' : ''}`}
                onClick={() => { setIsOpen(false); if (!isActive) onChange(option.value) }}
              >
                <span className="theme-option-icon"><Icon size={15} /></span>
                <span className="theme-option-copy">
                  <strong>{option.label}</strong>
                  <small>{option.value === 'system' ? `跟随系统 · 当前${systemTheme === 'dark' ? '深色' : '浅色'}` : option.hint}</small>
                </span>
                {isActive && <Check size={15} className="theme-option-check" />}
              </button>
            )
          })}
        </div>
      ), document.body)}
    </div>
  )
}

function formatSpeed(bytesPerSecond) {
  if (!bytesPerSecond || bytesPerSecond < 1) return ''
  const units = ['B/s', 'KB/s', 'MB/s', 'GB/s']
  let value = bytesPerSecond
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) { value /= 1024; unit += 1 }
  return `${value.toFixed(value >= 10 || unit === 0 ? 0 : 1)} ${units[unit]}`
}

function formatEta(task) {
  if (!task.totalBytes || !task.speed || task.speed < 1) return ''
  const remaining = Math.max(0, task.totalBytes - task.receivedBytes)
  const seconds = Math.ceil(remaining / task.speed)
  if (!Number.isFinite(seconds) || seconds <= 0) return ''
  if (seconds < 60) return `约 ${seconds} 秒`
  if (seconds < 3600) return `约 ${Math.ceil(seconds / 60)} 分钟`
  return `约 ${(seconds / 3600).toFixed(1)} 小时`
}

const DOWNLOAD_STATUS_LABEL = {
  queued: '排队中',
  downloading: '下载中',
  completed: '已完成',
  error: '失败',
  canceled: '已取消',
  interrupted: '已中断'
}

const DOWNLOADS_PER_PAGE = 8

function DownloadsPanel({ tasks, closing, activeCount, onClose, onCancel, onRetry, onRemove, onClearFinished, onPreview, onApplyTarget }) {
  const hasFinished = tasks.some((task) => ['completed', 'error', 'canceled', 'interrupted'].includes(task.status))
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(tasks.length / DOWNLOADS_PER_PAGE))
  const safePage = Math.min(page, totalPages)
  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])
  const pageTasks = tasks.slice((safePage - 1) * DOWNLOADS_PER_PAGE, safePage * DOWNLOADS_PER_PAGE)
  const pageNumbers = Array.from(new Set([1, safePage - 1, safePage, safePage + 1, totalPages].filter((item) => item >= 1 && item <= totalPages))).sort((a, b) => a - b)
  return (
    <div className={`modal-backdrop downloads-backdrop ${closing ? 'closing' : ''}`} onMouseDown={onClose}>
      <div className="downloads-panel" onMouseDown={(event) => event.stopPropagation()}>
        <div className="downloads-header">
          <div>
            <div className="eyebrow">DOWNLOADS</div>
            <h2>下载管理</h2>
            <p>{activeCount > 0 ? `${activeCount} 个任务进行中 · 共 ${tasks.length} 条记录` : tasks.length ? `共 ${tasks.length} 条记录${totalPages > 1 ? ` · 第 ${safePage}/${totalPages} 页` : ''}` : '还没有下载任务'}</p>
          </div>
          <div className="downloads-header-actions">
            {hasFinished && <button className="text-button" onClick={onClearFinished}>清除已结束</button>}
            <button className="icon-button subtle" onClick={onClose} aria-label="关闭下载管理"><X size={16} /></button>
          </div>
        </div>

        {tasks.length === 0 ? (
          <div className="downloads-empty">
            <div className="empty-icon"><ArrowDownToLine size={24} /></div>
            <h3>暂无下载记录</h3>
            <p>在壁纸卡片或详情页点击下载，任务会实时显示在这里。</p>
          </div>
        ) : (
          <div className="downloads-list">
            {pageTasks.map((task) => {
              const progress = task.status === 'completed'
                ? 100
                : task.totalBytes
                  ? Math.min(100, Math.round((task.receivedBytes / task.totalBytes) * 100))
                  : (task.status === 'downloading' ? null : 0)
              const isActive = task.status === 'downloading' || task.status === 'queued'
              const eta = formatEta(task)
              const speed = formatSpeed(task.speed)
              const applyLabel = task.applyTarget === 'both' ? '桌面 + 锁屏' : task.applyTarget === 'lockscreen' ? '锁屏' : task.applyTarget === 'wallpaper' ? '桌面' : ''
              const doneNotes = [task.wallpaperSet ? '已设为桌面壁纸' : '', task.lockScreenSet ? '已设为锁屏' : ''].filter(Boolean)
              return (
                <article className={`download-item ${task.status}`} key={task.taskId}>
                  <button className="download-thumb" onClick={() => task.status === 'completed' && onPreview(task.filePath, task.title)} title={task.status === 'completed' ? '预览' : undefined}>
                    {task.thumb ? <img src={task.thumb} alt="" loading="lazy" /> : <ArrowDownToLine size={18} />}
                    {applyLabel && <span className="download-flag">{applyLabel}</span>}
                  </button>
                  <div className="download-body">
                    <div className="download-title-row">
                      <span className="download-title" title={task.title}>{task.title}</span>
                      <span className={`download-status ${task.status}`}>{DOWNLOAD_STATUS_LABEL[task.status] || task.status}</span>
                    </div>
                    <div className={`download-progress ${progress === null ? 'indeterminate' : ''}`}>
                      <div className="download-progress-bar" style={progress === null ? undefined : { width: `${progress}%` }} />
                    </div>
                    <div className="download-meta">
                      <span>{task.receivedBytes ? formatBytes(task.receivedBytes) : '0 B'}{task.totalBytes ? ` / ${formatBytes(task.totalBytes)}` : ''}</span>
                      {task.status === 'downloading' && speed && <span>{speed}</span>}
                      {task.status === 'downloading' && eta && <span>{eta}</span>}
                      {task.status === 'completed' && doneNotes.length > 0 && <span className="download-note">{doneNotes.join(' · ')}</span>}
                      {task.status === 'completed' && doneNotes.length === 0 && <span>{progress === 100 ? '100%' : ''}</span>}
                      {task.status === 'error' && task.error && <span className="download-error" title={task.error}>{task.error}</span>}
                      {task.status === 'canceled' && <span>任务已取消</span>}
                      {task.status === 'interrupted' && <span>应用关闭时中断</span>}
                    </div>
                  </div>
                  <div className="download-actions">
                    {isActive && <button className="download-action" onClick={() => onCancel(task.taskId)} title="取消下载"><X size={15} /></button>}
                    {(task.status === 'error' || task.status === 'canceled' || task.status === 'interrupted') && <button className="download-action" onClick={() => onRetry(task.taskId)} title="重新下载"><RefreshCw size={15} /></button>}
                    {task.status === 'completed' && <button className="download-action" onClick={() => onPreview(task.filePath, task.title)} title="预览"><Play size={15} /></button>}
                    {task.status === 'completed' && <button className="download-action" onClick={() => onApplyTarget(task.filePath, 'wallpaper')} title="设为桌面壁纸"><Monitor size={15} /></button>}
                    {task.status === 'completed' && <button className="download-action" onClick={() => onApplyTarget(task.filePath, 'lockscreen')} title="设为锁屏"><Lock size={15} /></button>}
                    {task.status === 'completed' && <button className="download-action" onClick={() => onApplyTarget(task.filePath, 'both')} title="同时设为桌面与锁屏"><MonitorSmartphone size={15} /></button>}
                    {!isActive && <button className="download-action" onClick={() => onRemove(task)} title="从列表移除"><X size={15} /></button>}
                  </div>
                </article>
              )
            })}
          </div>
        )}
        {totalPages > 1 && (
          <div className="downloads-pagination">
            <button className="page-arrow" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)} aria-label="上一页"><ChevronLeft size={16} /></button>
            {pageNumbers.map((item, index) => (
              <React.Fragment key={item}>
                {index > 0 && item - pageNumbers[index - 1] > 1 && <span className="page-ellipsis">…</span>}
                <button className={item === safePage ? 'current' : ''} onClick={() => setPage(item)}>{item}</button>
              </React.Fragment>
            ))}
            <button className="page-arrow" disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)} aria-label="下一页"><ChevronRight size={16} /></button>
          </div>
        )}
      </div>
    </div>
  )
}

function DownloadPreviewModal({ data, closing, onClose, onApplyTarget }) {
  const { filePath, title } = data
  const fileUrl = window.wallhaven?.system?.fileUrl ? window.wallhaven.system.fileUrl(filePath) : ''
  return (
    <div className={`modal-backdrop preview-backdrop ${closing ? 'closing' : ''}`} onMouseDown={onClose}>
      <div className="preview-modal" onMouseDown={(event) => event.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="关闭预览"><X size={18} /></button>
        <div className="preview-stage">
          <img src={fileUrl} alt={title} draggable={false} />
        </div>
        <div className="preview-footer">
          <div className="preview-copy">
            <div className="eyebrow">PREVIEW</div>
            <h3 title={title}>{title}</h3>
            <p className="preview-path" title={filePath}>{filePath}</p>
          </div>
          <div className="preview-actions">
            <button className="secondary-button" onClick={() => onApplyTarget(filePath, 'wallpaper')}><Monitor size={16} />设为桌面</button>
            <button className="secondary-button" onClick={() => onApplyTarget(filePath, 'lockscreen')}><Lock size={16} />设为锁屏</button>
            <button className="primary-button" onClick={() => onApplyTarget(filePath, 'both')}><MonitorSmartphone size={16} />桌面 + 锁屏</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function DuplicateDownloadModal({ data, closing, onClose, onRedownload, onPreview, onApplyTarget }) {
  const { wallpaper, filePath } = data
  return (
    <div className={`modal-backdrop duplicate-backdrop ${closing ? 'closing' : ''}`} onMouseDown={onClose}>
      <div className="small-modal duplicate-modal" onMouseDown={(event) => event.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="关闭"><X size={18} /></button>
        <div className="modal-icon cyan"><Check size={22} /></div>
        <div className="eyebrow">ALREADY DOWNLOADED</div>
        <h2>这张壁纸已经下载过了</h2>
        <p>{wallpaper.title || `Wallhaven · ${wallpaper.id}`} 已存在于下载目录中，可以直接应用或预览，也可以重新下载覆盖。</p>
        <div className="duplicate-path" title={filePath}>{filePath}</div>
        <div className="duplicate-actions">
          <button className="secondary-button" onClick={onPreview}><Play size={15} />预览</button>
          <button className="secondary-button" onClick={() => onApplyTarget('wallpaper')}><Monitor size={15} />设为桌面</button>
          <button className="secondary-button" onClick={() => onApplyTarget('lockscreen')}><Lock size={15} />设为锁屏</button>
          <button className="secondary-button" onClick={() => onApplyTarget('both')}><MonitorSmartphone size={15} />桌面 + 锁屏</button>
        </div>
        <div className="modal-actions">
          <span className="modal-footnote">已下载的文件无需重新下载即可直接使用</span>
          <button className="primary-button" onClick={onRedownload}><RefreshCw size={16} />重新下载</button>
        </div>
      </div>
    </div>
  )
}

function RemoveDownloadModal({ data, closing, onClose, onRemoveOnly, onRemoveAndDelete }) {
  const { title, filePath, fileSize } = data
  return (
    <div className={`modal-backdrop remove-backdrop ${closing ? 'closing' : ''}`} onMouseDown={onClose}>
      <div className="small-modal remove-modal" onMouseDown={(event) => event.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="关闭"><X size={18} /></button>
        <div className="modal-icon danger"><Trash2 size={22} /></div>
        <div className="eyebrow">REMOVE DOWNLOAD</div>
        <h2>移除这条下载记录？</h2>
        <p>{title} 的记录会从列表中移除。你也可以同时删除已经下载到本地的文件。</p>
        <div className="duplicate-path" title={filePath}>{filePath}</div>
        <div className="remove-file-meta"><TriangleAlert size={13} /><span>本地文件大小 {formatBytes(fileSize)} · 删除后无法恢复</span></div>
        <div className="modal-actions">
          <button className="text-button" onClick={onClose}>取消</button>
          <div className="modal-action-group">
            <button className="secondary-button" onClick={onRemoveOnly}>仅移除记录</button>
            <button className="danger-button" onClick={onRemoveAndDelete}><Trash2 size={15} />移除并删除文件</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function countActiveFilters(filters) {
  return [filters.categories !== '111', filters.purity !== '100', filters.atleast, filters.resolution, filters.ratio, filters.color].filter(Boolean).length
}

function SelectMenu({ value, options, onChange, disabled = false, className = '', ariaLabel = '' }) {
  const [open, setOpen] = useState(false)
  const [menuStyle, setMenuStyle] = useState(null)
  const triggerRef = useRef(null)
  const menuRef = useRef(null)

  const selected = options.find((option) => option.value === value) || options[0]

  const openMenu = () => {
    if (disabled) return
    const rect = triggerRef.current?.getBoundingClientRect()
    if (!rect) return
    const itemHeight = 34
    const menuHeight = Math.min(options.length * itemHeight + 12, 288)
    const spaceBelow = window.innerHeight - rect.bottom - 12
    const flipUp = spaceBelow < menuHeight && rect.top > menuHeight
    const width = Math.round(Math.max(rect.width, 132))
    setMenuStyle({
      left: Math.round(Math.min(Math.max(8, rect.left), window.innerWidth - width - 12)),
      width,
      top: Math.round(flipUp ? rect.top - menuHeight - 6 : rect.bottom + 6),
      maxHeight: Math.round(Math.min(menuHeight, flipUp ? rect.top - 12 : spaceBelow))
    })
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return undefined
    function handlePointer(event) {
      if (triggerRef.current?.contains(event.target)) return
      if (menuRef.current?.contains(event.target)) return
      setOpen(false)
    }
    function handleKey(event) {
      if (event.key === 'Escape') setOpen(false)
    }
    function handleViewport() {
      setOpen(false)
    }
    document.addEventListener('mousedown', handlePointer)
    document.addEventListener('keydown', handleKey)
    window.addEventListener('scroll', handleViewport, true)
    window.addEventListener('resize', handleViewport)
    return () => {
      document.removeEventListener('mousedown', handlePointer)
      document.removeEventListener('keydown', handleKey)
      window.removeEventListener('scroll', handleViewport, true)
      window.removeEventListener('resize', handleViewport)
    }
  }, [open])

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={`select-trigger ${open ? 'open' : ''} ${className}`.trim()}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openMenu())}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
      >
        <span className="select-value">{selected?.label || ''}</span>
        <ChevronDown size={14} className="select-chevron" />
      </button>
      {open && menuStyle && createPortal((
        <div
          ref={menuRef}
          className="select-menu"
          role="listbox"
          style={{ left: menuStyle.left, top: menuStyle.top, width: menuStyle.width, maxHeight: menuStyle.maxHeight }}
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === value}
              className={`select-option ${option.value === value ? 'selected' : ''}`}
              onClick={() => { setOpen(false); if (option.value !== value) onChange(option.value) }}
            >
              <span>{option.label}</span>
              {option.value === value && <Check size={13} className="select-check" />}
            </button>
          ))}
        </div>
      ), document.body)}
    </>
  )
}

function FilterPanel({ filters, updateFilter, toggleMask, hasApiKey, onSync, onApply, onClose, onReset }) {
  return (
    <section className="filter-panel">
      <div className="filter-header"><div><strong>精确筛选</strong><span>组合类别、纯净度、分辨率与色彩</span></div><div className="filter-header-actions">{hasApiKey && <button className="text-button" onClick={onSync}><RefreshCw size={14} />同步官网偏好</button>}<button className="text-button" onClick={onReset}>恢复默认</button><button className="text-button" onClick={onClose} aria-label="关闭筛选器"><X size={14} />关闭</button></div></div>
      <div className="filter-grid">
        <FilterGroup label="类别"><div className="segmented-control">{CATEGORIES.map((item) => <button key={item.index} className={filters.categories[item.index] === '1' ? 'active' : ''} aria-pressed={filters.categories[item.index] === '1'} onClick={() => toggleMask('categories', item.index)}>{item.label}</button>)}<button className={filters.categories === '111' ? 'active' : ''} onClick={() => updateFilter('categories', '111')}>全部</button></div></FilterGroup>
        <FilterGroup label="纯净度"><div className="segmented-control">{PURITIES.map((item) => <button key={item.index} className={filters.purity[item.index] === '1' ? 'active' : ''} aria-pressed={filters.purity[item.index] === '1'} disabled={item.index === 2 && !hasApiKey} onClick={() => toggleMask('purity', item.index)}>{item.label}</button>)}<button className={filters.purity === (hasApiKey ? '111' : '110') ? 'active' : ''} onClick={() => updateFilter('purity', hasApiKey ? '111' : '110')}>全部</button></div></FilterGroup>
        <FilterGroup label="最低分辨率"><SelectMenu value={filters.atleast} options={RESOLUTIONS} onChange={(next) => updateFilter('atleast', next)} ariaLabel="最低分辨率" /></FilterGroup>
        <FilterGroup label="精确分辨率"><SelectMenu value={filters.resolution} options={EXACT_RESOLUTIONS} onChange={(next) => updateFilter('resolution', next)} ariaLabel="精确分辨率" /></FilterGroup>
        <FilterGroup label="画面比例"><SelectMenu value={filters.ratio} options={RATIOS} onChange={(next) => updateFilter('ratio', next)} ariaLabel="画面比例" /></FilterGroup>
        <FilterGroup label="榜单时间" hint="仅适用于热门榜单"><SelectMenu value={filters.topRange} options={TOP_RANGES} disabled={filters.sorting !== 'toplist'} onChange={(next) => updateFilter('topRange', next)} ariaLabel="榜单时间" /></FilterGroup>
        <FilterGroup label="排序方向"><SelectMenu value={filters.order} options={ORDER_OPTIONS} onChange={(next) => updateFilter('order', next)} ariaLabel="排序方向" /></FilterGroup>
      </div>
      <div className="color-filter"><div className="filter-label">主色调 <span>点击选择一种颜色</span></div><div className="color-swatches">{COLORS.map((color) => <button key={color} className={filters.color === color ? 'selected' : ''} style={{ backgroundColor: `#${color}` }} onClick={() => updateFilter('color', filters.color === color ? '' : color)} aria-label={`颜色 ${color}`} />)}</div></div>
      <div className="filter-footer"><span>API 参数会同步到 Wallhaven 官方搜索</span><button className="primary-button" onClick={onApply}><Search size={16} />应用筛选</button></div>
    </section>
  )
}

function FilterGroup({ label, hint, children }) {
  return <div className="filter-group"><div className="filter-label">{label} {hint && <span>{hint}</span>}</div>{children}</div>
}

function Gallery({ wallpapers, viewMode, favoriteIds, onSelect, onFavorite, onDownload }) {
  return <div className={`gallery ${viewMode === 'list' ? 'list-view' : ''}`}>{wallpapers.map((wallpaper, index) => <WallpaperCard key={`${wallpaper.id}-${index}`} index={index} wallpaper={wallpaper} isFavorite={favoriteIds.includes(wallpaper.id)} onSelect={onSelect} onFavorite={onFavorite} onDownload={onDownload} />)}</div>
}

function WallpaperCard({ wallpaper, index = 0, isFavorite, onSelect, onFavorite, onDownload }) {
  return (
    <article className="wallpaper-card" style={{ animationDelay: `${Math.min(index * 0.025, 0.6)}s` }} onClick={() => onSelect(wallpaper)}>
      <div className="wallpaper-image-wrap">
        <SmartImage src={getThumb(wallpaper)} alt={wallpaper.title || `Wallhaven ${wallpaper.id}`} eager={index < 4} />
        <div className="image-overlay" />
        <div className="card-topline"><span className={`purity-badge ${wallpaper.purity}`}>{wallpaper.purity === 'sfw' ? 'SFW' : wallpaper.purity === 'sketchy' ? 'SKETCHY' : 'NSFW'}</span><button className={`heart-button ${isFavorite ? 'active' : ''}`} onClick={(event) => { event.stopPropagation(); onFavorite(wallpaper) }} aria-label={isFavorite ? '取消收藏' : '加入收藏'}><Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} stroke={isFavorite ? 'none' : 'currentColor'} /></button></div>
        <div className="card-hover-actions"><button onClick={(event) => { event.stopPropagation(); onDownload(wallpaper) }} title="下载原图"><Download size={16} /></button><button onClick={(event) => { event.stopPropagation(); onSelect(wallpaper) }} title="查看详情"><Info size={16} /></button></div>
        <div className="card-gradient-meta"><span>{wallpaper.resolution || `${wallpaper.dimension_x}×${wallpaper.dimension_y}`}</span><span>{wallpaper.file_type?.split('/')[1]?.toUpperCase() || 'JPG'}</span></div>
      </div>
      <div className="card-body"><div className="card-title">{wallpaper.title || `Wallhaven · ${wallpaper.id}`}</div><div className="card-meta"><span>{formatNumber(wallpaper.views)} 浏览</span><span className="meta-dot" /><span>{formatNumber(wallpaper.favorites)} 收藏</span><time>{formatDate(wallpaper.created_at)}</time></div></div>
    </article>
  )
}

function GallerySkeleton({ viewMode }) {
  return <div className={`gallery skeleton-gallery ${viewMode === 'list' ? 'list-view' : ''}`}>{Array.from({ length: 12 }, (_, index) => <div className="skeleton-card" key={index} style={{ animationDelay: `${Math.min(index * 0.025, 0.6)}s` }}><div className="skeleton-image" /><div className="skeleton-body"><div className="skeleton-line short" /><div className="skeleton-line" /></div></div>)}</div>
}

function EmptyState({ activeNav, onExplore }) {
  return <div className="empty-state"><div className="empty-icon"><Images size={25} /></div><h2>{activeNav === 'favorites' ? '还没有本地收藏' : '这里暂时没有内容'}</h2><p>{activeNav === 'favorites' ? '在壁纸卡片上点击心形图标，收藏会保存在这台电脑上。' : '换一个搜索词或放宽筛选条件试试看。'}</p><button className="primary-button" onClick={onExplore}><Sparkles size={16} />去发现壁纸</button></div>
}

function Pagination({ meta, onChange }) {
  const current = meta.current_page || 1
  const last = meta.last_page || 1
  const pages = Array.from(new Set([1, current - 1, current, current + 1, last].filter((page) => page >= 1 && page <= last))).sort((a, b) => a - b)
  return <div className="pagination"><button className="page-arrow" disabled={current <= 1} onClick={() => onChange(current - 1)}><ChevronLeft size={17} /></button>{pages.map((page, index) => <React.Fragment key={page}>{index > 0 && page - pages[index - 1] > 1 && <span className="page-ellipsis">…</span>}<button className={page === current ? 'current' : ''} onClick={() => onChange(page)}>{page}</button></React.Fragment>)}<button className="page-arrow" disabled={current >= last} onClick={() => onChange(current + 1)}><ChevronRight size={17} /></button></div>
}

function WallpaperModal({ wallpaper, isFavorite, onClose, onFavorite, onDownload, onSimilar, onTag, onOpenExternal }) {
  const { closing, close } = useClosing(240)
  const imageUrl = getImageUrl(wallpaper)
  const thumbUrl = getThumb(wallpaper)
  const previewUrl = wallpaper?.thumbs?.large || wallpaper?.thumbs?.original || ''
  const [imageState, setImageState] = useState({ status: 'loading', url: imageUrl, fallback: false })
  const handleClose = () => close(onClose)
  const retryRef = useRef(0)

  useEffect(() => {
    retryRef.current = 0
    setImageState({ status: 'loading', url: imageUrl, fallback: false })
  }, [imageUrl])

  const markLoaded = () => setImageState((current) => ({ ...current, status: 'loaded' }))
  const handleBroken = () => {
    if (retryRef.current < 1) {
      retryRef.current += 1
      setImageState({ status: 'loading', url: `${imageUrl}${imageUrl.includes('?') ? '&' : '?'}retry=${Date.now()}`, fallback: false })
      return
    }
    if (!imageState.fallback && thumbUrl && thumbUrl !== imageUrl) {
      setImageState({ status: 'loading', url: thumbUrl, fallback: true })
      return
    }
    setImageState((current) => ({ ...current, status: 'error' }))
  }
  const retryOriginal = () => {
    retryRef.current = 0
    setImageState({ status: 'loading', url: imageUrl, fallback: false })
  }

  return (
    <div className={`modal-backdrop ${closing ? 'closing' : ''}`} onMouseDown={handleClose}>
      <div className="detail-modal" onMouseDown={(event) => event.stopPropagation()}>
        <button className="modal-close" onClick={handleClose} aria-label="关闭详情"><X size={18} /></button>
        <div className="detail-media">
          <div className="detail-media-bg" style={{ backgroundImage: `url("${thumbUrl}")` }} />
          {imageState.status === 'loading' && previewUrl && previewUrl !== imageState.url && (
            <img className="detail-preview" src={previewUrl} alt="" onError={(event) => { event.currentTarget.style.display = 'none' }} draggable={false} />
          )}
          <SmartImage key={imageState.url} src={imageState.url} alt={wallpaper.title || `Wallhaven ${wallpaper.id}`} className="detail-image" eager onLoaded={markLoaded} onFailed={handleBroken} />
          <div className={`detail-media-loading ${imageState.status === 'loading' ? 'visible' : ''}`}><LoaderCircle size={14} className="spin" />正在加载原图…</div>
          {imageState.fallback && imageState.status === 'loaded' && <div className="detail-media-warn">原图加载失败 · 当前为缩略图预览<button className="detail-retry" onClick={retryOriginal}>重试原图</button></div>}
          {imageState.status === 'error' && <div className="detail-media-error">原图加载失败<button className="detail-retry" onClick={retryOriginal}>重试</button></div>}
          <div className="detail-media-overlay"><span className={`purity-badge ${wallpaper.purity}`}>{wallpaper.purity?.toUpperCase()}</span><span className="detail-id">{wallpaper.id}</span></div>
        </div>
        <div className="detail-panel">
          <div className="detail-scroll">
            <div className="detail-header"><div><div className="eyebrow">WALLHAVEN DETAIL</div><h2>{wallpaper.title || `Wallhaven · ${wallpaper.id}`}</h2><p>上传于 {formatDate(wallpaper.created_at)} · {wallpaper.category || '通用'}分类{wallpaper.uploader?.username ? ` · ${wallpaper.uploader.username}` : ''}</p></div><button className={`detail-heart ${isFavorite ? 'active' : ''}`} onClick={onFavorite}><Heart size={19} fill={isFavorite ? 'currentColor' : 'none'} stroke={isFavorite ? 'none' : 'currentColor'} /></button></div>
            <div className="detail-stats"><div><span>分辨率</span><strong>{wallpaper.resolution || `${wallpaper.dimension_x}×${wallpaper.dimension_y}`}</strong></div><div><span>宽高比</span><strong>{wallpaper.ratio || '—'}</strong></div><div><span>文件大小</span><strong>{formatBytes(wallpaper.file_size)}</strong></div><div><span>浏览</span><strong>{formatNumber(wallpaper.views)}</strong></div></div>
            <div className="detail-tags"><div className="detail-section-title"><Tag size={15} />标签</div><div className="tag-list">{(wallpaper.tags || []).length ? wallpaper.tags.map((tag) => <button key={tag.id || tag.name} onClick={() => onTag(tag.name)}>#{tag.name}</button>) : <span className="muted-text">暂无标签信息</span>}</div></div>
            <div className="detail-colors"><div className="detail-section-title"><Palette size={15} />主色</div><div className="detail-color-row">{(wallpaper.colors || []).slice(0, 6).map((color) => <span key={color} style={{ backgroundColor: color }} title={color} />)}</div></div>
          </div>
          <div className="detail-footer">
            <div className="detail-actions"><button className="primary-button" onClick={() => onDownload(wallpaper)}><ArrowDownToLine size={17} />下载原图</button><button className="secondary-button" onClick={() => onDownload(wallpaper, 'wallpaper')}><MonitorDown size={17} />设为桌面</button></div>
            <div className="detail-actions detail-actions-second"><button className="secondary-button" onClick={() => onDownload(wallpaper, 'lockscreen')}><Lock size={16} />设为锁屏</button><button className="secondary-button" onClick={() => onDownload(wallpaper, 'both')}><MonitorSmartphone size={16} />桌面 + 锁屏</button></div>
            <div className="detail-secondary-actions"><button className="text-button" onClick={onSimilar}><Sparkles size={15} />查找相似壁纸</button><button className="text-button" onClick={onOpenExternal}><ExternalLink size={15} />打开官网详情</button></div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CollectionsView({ collections, activeCollection, collectionItems, favoriteIds, isLoading, onOpen, onBack, onConnect, onSelect, onFavorite, onDownload, connected }) {
  if (!connected) return <div className="auth-empty"><div className="auth-empty-icon"><Layers3 size={25} /></div><h2>连接账户以查看合集</h2><p>Wallhaven API Key 可以安全地启用 NSFW 内容、个人设置与私有 collections。</p><button className="primary-button" onClick={onConnect}><KeyRound size={16} />连接 API Key</button><span>不会保存你的站内密码</span></div>
  if (activeCollection) return <div className="collection-detail"><button className="back-button" onClick={onBack}><ArrowLeft size={16} />返回我的合集</button><div className="collection-title"><div><div className="eyebrow">COLLECTION</div><h2>{activeCollection.label || activeCollection.name || `合集 ${activeCollection.id}`}</h2><p>{activeCollection.count || collectionItems.length} 张壁纸</p></div><FolderOpen size={28} /></div>{isLoading ? <GallerySkeleton /> : collectionItems.length ? <Gallery wallpapers={collectionItems} favoriteIds={favoriteIds} onSelect={onSelect} onFavorite={onFavorite} onDownload={onDownload} /> : <EmptyState activeNav="collections" onExplore={onBack} />}</div>
  return <div className="collections-view"><div className="collections-intro"><div><div className="eyebrow">YOUR LIBRARY</div><h2>我的合集</h2><p>从 Wallhaven 账户读取公开与私有收藏夹。</p></div><button className="outline-button" onClick={onConnect}><Settings size={16} />账户设置</button></div>{isLoading ? <div className="collection-skeletons">{[1, 2, 3].map((item) => <div className="collection-skeleton" key={item} />)}</div> : collections.length ? <div className="collection-grid">{collections.map((collection) => <button className="collection-card" key={collection.id} onClick={() => onOpen(collection)}><div className="collection-cover"><Images size={22} /><span>{collection.count || 0} 张</span></div><div className="collection-card-copy"><strong>{collection.label || collection.name || `合集 ${collection.id}`}</strong><span>{collection.public ? '公开合集' : '私有合集'}</span></div><ChevronRight size={17} /></button>)}</div> : <div className="empty-state compact"><div className="empty-icon"><Layers3 size={25} /></div><h2>还没有读取到合集</h2><p>请确认用户名和 API Key 正确，或者在 Wallhaven 官网创建一个合集。</p></div>}</div>
}

function AccountModal({ config, onClose, onSaved, onDisconnect }) {
  const { closing, close } = useClosing(240)
  const [apiKey, setApiKey] = useState('')
  const [username, setUsername] = useState(config.username || '')
  const [isSaving, setIsSaving] = useState(false)
  async function save() {
    setIsSaving(true)
    try {
      const patch = { username }
      if (apiKey.trim()) patch.apiKey = apiKey.trim()
      const next = await window.wallhaven.config.save(patch)
      close(() => onSaved(next))
    } finally { setIsSaving(false) }
  }
  return <div className={`modal-backdrop ${closing ? 'closing' : ''}`} onMouseDown={() => close(onClose)}><div className="small-modal account-modal" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => close(onClose)}><X size={18} /></button><div className="modal-icon blue"><KeyRound size={22} /></div><div className="eyebrow">ACCOUNT CONNECTION</div><h2>连接你的 Wallhaven 账户</h2><p>官方 API 使用 API Key 认证，不需要在客户端输入或保存站内密码。</p><label>API Key<input type="password" value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder={config.apiKeySet ? '已配置，输入新 Key 可替换' : '粘贴 settings/account 中的 API Key'} /></label><label>Wallhaven 用户名<input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="用于读取你的 collections" /></label><div className="modal-help"><CircleHelp size={15} /><span>API Key 可在 Wallhaven 的 Account Settings 中生成。Key 会使用系统安全存储保存。</span></div><div className="modal-actions"><div className="modal-action-group"><button className="text-button" onClick={() => window.wallhaven.openExternal('https://wallhaven.cc/settings/account')}><ExternalLink size={15} />打开账户设置</button>{config.apiKeySet && <button className="text-button danger-text" onClick={() => close(onDisconnect)}><X size={15} />断开连接</button>}</div><button className="primary-button" disabled={isSaving} onClick={save}>{isSaving ? <LoaderCircle size={16} className="spin" /> : <Check size={16} />}保存连接</button></div></div></div>
}

function SettingsModal({ config, onClose, onSaved, onChooseFolder }) {
  const { closing, close } = useClosing(240)
  const [downloadPath, setDownloadPath] = useState(config.downloadPath || '')
  const [theme, setTheme] = useState(config.theme || 'system')
  async function save() {
    const next = await window.wallhaven.config.save({ downloadPath, theme })
    close(() => onSaved(next))
  }
  return <div className={`modal-backdrop ${closing ? 'closing' : ''}`} onMouseDown={() => close(onClose)}><div className="small-modal settings-modal" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => close(onClose)}><X size={18} /></button><div className="modal-icon amber"><Settings size={22} /></div><div className="eyebrow">PREFERENCES</div><h2>偏好设置</h2><p>调整本地下载行为与应用显示风格。</p><label>壁纸下载目录<div className="input-with-button"><input value={downloadPath} onChange={(event) => setDownloadPath(event.target.value)} /><button onClick={async () => { await onChooseFolder(); const next = await window.wallhaven.config.get(); setDownloadPath(next.downloadPath) }}><FolderOpen size={16} />选择</button></div></label><div className="settings-label">界面主题</div><div className="theme-grid">{THEME_OPTIONS.map((option) => { const Icon = option.icon; const isActive = theme === option.value; return <button key={option.value} type="button" className={`theme-card ${isActive ? 'active' : ''}`} onClick={() => setTheme(option.value)} aria-pressed={isActive}><span className="theme-card-icon"><Icon size={16} /></span><span className="theme-card-copy"><strong>{option.label}</strong><small>{option.hint}</small></span>{isActive && <Check size={14} className="theme-card-check" />}</button> })}</div><div className="settings-note"><Info size={15} /><span>本地收藏保存在当前用户的浏览器数据中，API Key 使用 Electron 安全存储。</span></div><div className="modal-actions"><button className="text-button" onClick={() => window.wallhaven.download.openFolder()}><FolderOpen size={15} />打开下载目录</button><button className="primary-button" onClick={save}><Check size={16} />保存设置</button></div></div></div>
}

function AppErrorBoundary({ children }) { return children }

createRoot(document.getElementById('root')).render(<AppErrorBoundary><App /></AppErrorBoundary>)
