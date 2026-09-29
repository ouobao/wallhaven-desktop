import React, { useEffect, useMemo, useRef, useState } from 'react'
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
  LogIn,
  MonitorDown,
  Palette,
  PanelLeftClose,
  PanelLeftOpen,
  Play,
  RefreshCw,
  Search,
  Settings,
  SlidersHorizontal,
  Sparkles,
  Star,
  Tag,
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

const COLORS = ['660000', '990000', 'cc0000', 'cc3333', 'ea4c88', '993399', '663399', '333399', '0066cc', '0099cc', '66cccc', '77cc33', '669900', '336600', '666600', '999900', 'cccc33', 'ffff00', 'ffcc33', 'ff9900', 'ff6600', 'cc6633', '996633', '663300', '000000', '999999', 'cccccc', 'ffffff', '424153']

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

function App() {
  const [config, setConfig] = useState({ apiKeySet: false, username: '', downloadPath: '' })
  const [configLoaded, setConfigLoaded] = useState(false)
  const [activeNav, setActiveNav] = useState('discover')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [wallpapers, setWallpapers] = useState(DEMO_WALLPAPERS)
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: DEMO_WALLPAPERS.length })
  const [randomSeed, setRandomSeed] = useState('')
  const [filters, setFilters] = useState({ q: '', categories: '111', purity: '100', sorting: 'date_added', order: 'desc', topRange: '1M', atleast: '', resolution: '', ratio: '', color: '', queryType: 'all' })
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
  const searchInputRef = useRef(null)

  const isConnected = config.apiKeySet
  const favoriteIds = useMemo(() => favoriteItems.map((wallpaper) => wallpaper.id), [favoriteItems])
  const favoriteWallpapers = favoriteItems

  useEffect(() => {
    window.wallhaven?.config.get().then(setConfig).catch(() => {}).finally(() => setConfigLoaded(true))
  }, [])

  useEffect(() => {
    localStorage.setItem('wallhaven-favorites', JSON.stringify(favoriteItems))
  }, [favoriteItems])

  useEffect(() => {
    document.documentElement.dataset.theme = config.theme || 'dark'
  }, [config.theme])

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

  async function downloadWallpaper(wallpaper, setAsWallpaper = false) {
    try {
      const result = setAsWallpaper
        ? await window.wallhaven.download.setWallpaper({ id: wallpaper.id, imageUrl: getImageUrl(wallpaper), extension: wallpaper.file_type?.split('/')[1] || 'jpg' })
        : await window.wallhaven.download.wallpaper({ id: wallpaper.id, imageUrl: getImageUrl(wallpaper), extension: wallpaper.file_type?.split('/')[1] || 'jpg' })
      notify(setAsWallpaper ? `已下载并设置为桌面壁纸：${result.filePath}` : `已保存到 ${result.filePath}`)
    } catch (error) {
      notify(error?.message || '下载失败', 'warning')
    }
  }

  async function chooseDownloadFolder() {
    const folder = await window.wallhaven.download.chooseFolder()
    if (folder) {
      setConfig((current) => ({ ...current, downloadPath: folder }))
      notify('下载目录已更新')
    }
  }

  function changePage(page) {
    if (page < 1 || page > (meta.last_page || 1) || isLoading) return
    loadWallpapers(filters, page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const displayWallpapers = activeNav === 'favorites' ? favoriteWallpapers : activeNav === 'collections' && activeCollection ? collectionItems : wallpapers
  const activeLabel = activeNav === 'discover' ? (filters.q ? `搜索：${filters.q}` : '精选推荐') : NAV_ITEMS.find((item) => item.id === activeNav)?.label || '精选推荐'

  return (
    <div className={`app-shell ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <aside className="sidebar">
        <div className="brand-lockup">
          <div className="brand-mark"><Images size={20} strokeWidth={2.4} /></div>
          <div className="brand-copy"><strong>Wallhaven</strong><span>STUDIO</span></div>
        </div>

        <nav className="primary-nav" aria-label="主导航">
          <div className="nav-heading">浏览</div>
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button key={id} className={`nav-item ${activeNav === id ? 'active' : ''}`} onClick={() => handleNav(id)} title={sidebarCollapsed ? label : undefined}>
              <Icon size={18} />
              <span>{label}</span>
              {id === 'favorites' && favoriteIds.length > 0 && <small>{favoriteIds.length}</small>}
            </button>
          ))}
        </nav>

        <div className="sidebar-divider" />
        <div className="nav-heading">工作区</div>
        <button className="nav-item" onClick={() => setIsSettingsOpen(true)} title={sidebarCollapsed ? '偏好设置' : undefined}><Settings size={18} /><span>偏好设置</span></button>
        <button className="nav-item" onClick={() => setIsLoginOpen(true)} title={sidebarCollapsed ? '账户连接' : undefined}><KeyRound size={18} /><span>账户连接</span>{isConnected && <i className="status-dot" />}</button>

        <div className="sidebar-bottom">
          <div className={`account-card ${isConnected ? 'connected' : ''}`}>
            <div className="account-avatar">{isConnected ? <UserRound size={17} /> : <LogIn size={17} />}</div>
            {!sidebarCollapsed && <div className="account-copy"><strong>{isConnected ? (config.username || '已连接账户') : '未连接账户'}</strong><span>{isConnected ? 'API Key 已启用' : '连接后解锁更多内容'}</span></div>}
            {!sidebarCollapsed && <button className="icon-button subtle" onClick={() => setIsLoginOpen(true)} aria-label="打开账户连接"><ChevronRight size={16} /></button>}
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
            <button className="user-trigger" onClick={() => setIsLoginOpen(true)}><span className={`user-status ${isConnected ? 'online' : ''}`} /><span>{isConnected ? (config.username || '我的账户') : '连接账户'}</span><ChevronDown size={14} /></button>
          </div>
        </header>

        <section className="content-wrap">
          <div className="page-heading">
            <div>
              <div className="eyebrow"><span className={`live-dot ${status.kind}`} />{status.text}</div>
              <h1>{activeLabel}</h1>
              <p>{activeNav === 'discover' ? '为你的桌面挑选下一张高质量壁纸。' : activeNav === 'collections' ? '集中管理你在 Wallhaven 上创建的主题合集。' : '持续更新的高质量桌面与移动壁纸。'}</p>
            </div>
            <div className="heading-actions">
              <div className="view-switcher" role="group" aria-label="视图模式">
                <button className={viewMode === 'grid' ? 'active' : ''} onClick={() => setViewMode('grid')} aria-label="网格视图"><Grid2X2 size={16} /></button>
                <button className={viewMode === 'list' ? 'active' : ''} onClick={() => setViewMode('list')} aria-label="列表视图"><ListFilter size={16} /></button>
              </div>
              <button className="outline-button" onClick={() => setIsFilterOpen((current) => !current)}><SlidersHorizontal size={16} />筛选器<span className="filter-count">{countActiveFilters(filters)}</span></button>
            </div>
          </div>

          {isFilterOpen && <FilterPanel filters={filters} updateFilter={updateFilter} toggleMask={toggleMask} hasApiKey={isConnected} onSync={syncWallhavenSettings} onApply={() => { setIsFilterOpen(false); loadWallpapers(filters, 1) }} onReset={() => setFilters({ q: '', categories: '111', purity: '100', sorting: 'date_added', order: 'desc', topRange: '1M', atleast: '', resolution: '', ratio: '', color: '', queryType: 'all' })} />}

          {activeNav === 'collections' ? (
            <CollectionsView collections={collections} activeCollection={activeCollection} collectionItems={collectionItems} favoriteIds={favoriteIds} isLoading={isCollectionsLoading} onOpen={openCollection} onBack={() => setActiveCollection(null)} onConnect={() => setIsLoginOpen(true)} onSelect={openWallpaper} onFavorite={toggleFavorite} onDownload={downloadWallpaper} connected={isConnected} />
          ) : (
            <>
              <div className="results-toolbar">
                <span><strong>{formatNumber(meta.total || displayWallpapers.length)}</strong> 张壁纸</span>
                <div className="toolbar-actions">
                  <button className="text-button" onClick={() => setIsFilterOpen(true)}><Palette size={15} />按颜色筛选</button>
                  <span className="toolbar-separator" />
                  <span className="sort-label">排序</span>
                  <select value={filters.sorting} onChange={(event) => { const next = { ...filters, sorting: event.target.value }; setFilters(next); loadWallpapers(next, 1) }} aria-label="排序方式">
                    {SORT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </div>
              </div>

              {isLoading && <GallerySkeleton viewMode={viewMode} />}
              {!isLoading && displayWallpapers.length === 0 && <EmptyState activeNav={activeNav} onExplore={() => handleNav('discover')} />}
              {!isLoading && displayWallpapers.length > 0 && <Gallery wallpapers={displayWallpapers} viewMode={viewMode} favoriteIds={favoriteIds} onSelect={openWallpaper} onFavorite={toggleFavorite} onDownload={downloadWallpaper} />}

              {!isLoading && activeNav !== 'favorites' && (meta.last_page > 1 || meta.current_page > 1) && <Pagination meta={meta} onChange={changePage} />}
            </>
          )}
        </section>
      </main>

      {selected && <WallpaperModal wallpaper={selected} isFavorite={favoriteIds.includes(selected.id)} onClose={() => setSelected(null)} onFavorite={() => toggleFavorite(selected)} onDownload={downloadWallpaper} onSimilar={() => { setSelected(null); const next = { ...filters, q: `like:${selected.id}` }; setFilters(next); setDraftSearch(`like:${selected.id}`); setActiveNav('discover'); loadWallpapers(next, 1) }} onTag={(tag) => { setSelected(null); const next = { ...filters, q: tag }; setFilters(next); setDraftSearch(tag); setActiveNav('discover'); loadWallpapers(next, 1) }} onOpenExternal={() => window.wallhaven.openExternal(selected.url || `https://wallhaven.cc/w/${selected.id}`)} />}
      {isLoginOpen && <AccountModal config={config} onClose={() => setIsLoginOpen(false)} onSaved={(next) => { setConfig(next); setIsLoginOpen(false); notify('账户配置已保存'); loadWallpapers(filters, 1) }} onDisconnect={async () => { const next = await window.wallhaven.config.save({ apiKey: '' }); setConfig(next); setIsLoginOpen(false); setActiveNav('discover'); notify('已断开 Wallhaven API Key'); loadWallpapers(filters, 1) }} />}
      {isSettingsOpen && <SettingsModal config={config} onClose={() => setIsSettingsOpen(false)} onSaved={(next) => { setConfig(next); setIsSettingsOpen(false); notify('偏好设置已保存') }} onChooseFolder={chooseDownloadFolder} />}
      {toast && <div className={`toast ${toast.type}`}><span className="toast-icon">{toast.type === 'warning' ? <Info size={16} /> : <Check size={16} />}</span>{toast.message}</div>}
    </div>
  )
}

function countActiveFilters(filters) {
  return [filters.categories !== '111', filters.purity !== '100', filters.atleast, filters.resolution, filters.ratio, filters.color].filter(Boolean).length
}

function FilterPanel({ filters, updateFilter, toggleMask, hasApiKey, onSync, onApply, onReset }) {
  return (
    <section className="filter-panel">
      <div className="filter-header"><div><strong>精确筛选</strong><span>组合类别、纯净度、分辨率与色彩</span></div><div className="filter-header-actions">{hasApiKey && <button className="text-button" onClick={onSync}><RefreshCw size={14} />同步官网偏好</button>}<button className="text-button" onClick={onReset}>恢复默认</button></div></div>
      <div className="filter-grid">
        <FilterGroup label="类别"><div className="segmented-control">{CATEGORIES.map((item) => <button key={item.index} className={filters.categories[item.index] === '1' ? 'active' : ''} aria-pressed={filters.categories[item.index] === '1'} onClick={() => toggleMask('categories', item.index)}>{item.label}</button>)}<button className={filters.categories === '111' ? 'active' : ''} onClick={() => updateFilter('categories', '111')}>全部</button></div></FilterGroup>
        <FilterGroup label="纯净度"><div className="segmented-control">{PURITIES.map((item) => <button key={item.index} className={filters.purity[item.index] === '1' ? 'active' : ''} aria-pressed={filters.purity[item.index] === '1'} disabled={item.index === 2 && !hasApiKey} onClick={() => toggleMask('purity', item.index)}>{item.label}</button>)}<button className={filters.purity === (hasApiKey ? '111' : '110') ? 'active' : ''} onClick={() => updateFilter('purity', hasApiKey ? '111' : '110')}>全部</button></div></FilterGroup>
        <FilterGroup label="最低分辨率"><select value={filters.atleast} onChange={(event) => updateFilter('atleast', event.target.value)}>{RESOLUTIONS.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select></FilterGroup>
        <FilterGroup label="精确分辨率"><select value={filters.resolution} onChange={(event) => updateFilter('resolution', event.target.value)}>{EXACT_RESOLUTIONS.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select></FilterGroup>
        <FilterGroup label="画面比例"><select value={filters.ratio} onChange={(event) => updateFilter('ratio', event.target.value)}>{RATIOS.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select></FilterGroup>
        <FilterGroup label="榜单时间" hint="仅适用于热门榜单"><select value={filters.topRange} disabled={filters.sorting !== 'toplist'} onChange={(event) => updateFilter('topRange', event.target.value)}>{[['1d', '最近一天'], ['3d', '最近三天'], ['1w', '最近一周'], ['1M', '最近一个月'], ['3M', '最近三个月'], ['6M', '最近六个月'], ['1y', '最近一年']].map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></FilterGroup>
        <FilterGroup label="排序方向"><select value={filters.order} onChange={(event) => updateFilter('order', event.target.value)}><option value="desc">降序</option><option value="asc">升序</option></select></FilterGroup>
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
  return <div className={`gallery ${viewMode === 'list' ? 'list-view' : ''}`}>{wallpapers.map((wallpaper, index) => <WallpaperCard key={`${wallpaper.id}-${index}`} wallpaper={wallpaper} isFavorite={favoriteIds.includes(wallpaper.id)} onSelect={onSelect} onFavorite={onFavorite} onDownload={onDownload} />)}</div>
}

function WallpaperCard({ wallpaper, isFavorite, onSelect, onFavorite, onDownload }) {
  return (
    <article className="wallpaper-card" onClick={() => onSelect(wallpaper)}>
      <div className="wallpaper-image-wrap">
        <img src={getThumb(wallpaper)} alt={wallpaper.title || `Wallhaven ${wallpaper.id}`} loading="lazy" />
        <div className="image-overlay" />
        <div className="card-topline"><span className={`purity-badge ${wallpaper.purity}`}>{wallpaper.purity === 'sfw' ? 'SFW' : wallpaper.purity === 'sketchy' ? 'SKETCHY' : 'NSFW'}</span><button className={`heart-button ${isFavorite ? 'active' : ''}`} onClick={(event) => { event.stopPropagation(); onFavorite(wallpaper) }} aria-label={isFavorite ? '取消收藏' : '加入收藏'}><Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} /></button></div>
        <div className="card-hover-actions"><button onClick={(event) => { event.stopPropagation(); onDownload(wallpaper) }} title="下载原图"><Download size={16} /></button><button onClick={(event) => { event.stopPropagation(); onSelect(wallpaper) }} title="查看详情"><Info size={16} /></button></div>
        <div className="card-gradient-meta"><span>{wallpaper.resolution || `${wallpaper.dimension_x}×${wallpaper.dimension_y}`}</span><span>{wallpaper.file_type?.split('/')[1]?.toUpperCase() || 'JPG'}</span></div>
      </div>
      <div className="card-body"><div className="card-title">{wallpaper.title || `Wallhaven · ${wallpaper.id}`}</div><div className="card-meta"><span>{formatNumber(wallpaper.views)} 浏览</span><span className="meta-dot" /><span>{formatNumber(wallpaper.favorites)} 收藏</span><time>{formatDate(wallpaper.created_at)}</time></div></div>
    </article>
  )
}

function GallerySkeleton({ viewMode }) {
  return <div className={`gallery skeleton-gallery ${viewMode === 'list' ? 'list-view' : ''}`}>{Array.from({ length: 8 }, (_, index) => <div className="skeleton-card" key={index}><div className="skeleton-image" /><div className="skeleton-line short" /><div className="skeleton-line" /></div>)}</div>
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
  return <div className="modal-backdrop" onMouseDown={onClose}><div className="detail-modal" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" onClick={onClose} aria-label="关闭详情"><X size={18} /></button><div className="detail-media"><img src={getImageUrl(wallpaper)} alt={wallpaper.title || `Wallhaven ${wallpaper.id}`} /><div className="detail-media-overlay"><span className={`purity-badge ${wallpaper.purity}`}>{wallpaper.purity?.toUpperCase()}</span><span className="detail-id">{wallpaper.id}</span></div></div><div className="detail-panel"><div className="detail-header"><div><div className="eyebrow">WALLHAVEN DETAIL</div><h2>{wallpaper.title || `Wallhaven · ${wallpaper.id}`}</h2><p>上传于 {formatDate(wallpaper.created_at)} · {wallpaper.category || '通用'}分类{wallpaper.uploader?.username ? ` · ${wallpaper.uploader.username}` : ''}</p></div><button className={`detail-heart ${isFavorite ? 'active' : ''}`} onClick={onFavorite}><Heart size={19} fill={isFavorite ? 'currentColor' : 'none'} /></button></div><div className="detail-stats"><div><span>分辨率</span><strong>{wallpaper.resolution || `${wallpaper.dimension_x}×${wallpaper.dimension_y}`}</strong></div><div><span>宽高比</span><strong>{wallpaper.ratio || '—'}</strong></div><div><span>文件大小</span><strong>{formatBytes(wallpaper.file_size)}</strong></div><div><span>浏览</span><strong>{formatNumber(wallpaper.views)}</strong></div></div><div className="detail-tags"><div className="detail-section-title"><Tag size={15} />标签</div><div className="tag-list">{(wallpaper.tags || []).length ? wallpaper.tags.map((tag) => <button key={tag.id || tag.name} onClick={() => onTag(tag.name)}>#{tag.name}</button>) : <span className="muted-text">暂无标签信息</span>}</div></div><div className="detail-colors"><div className="detail-section-title"><Palette size={15} />主色</div><div className="detail-color-row">{(wallpaper.colors || []).slice(0, 6).map((color) => <span key={color} style={{ backgroundColor: color }} title={color} />)}</div></div><div className="detail-actions"><button className="primary-button" onClick={() => onDownload(wallpaper)}><ArrowDownToLine size={17} />下载原图</button><button className="secondary-button" onClick={() => onDownload(wallpaper, true)}><MonitorDown size={17} />设为桌面</button></div><div className="detail-secondary-actions"><button className="text-button" onClick={onSimilar}><Sparkles size={15} />查找相似壁纸</button><button className="text-button" onClick={onOpenExternal}><ExternalLink size={15} />打开官网详情</button></div></div></div></div>
}

function CollectionsView({ collections, activeCollection, collectionItems, favoriteIds, isLoading, onOpen, onBack, onConnect, onSelect, onFavorite, onDownload, connected }) {
  if (!connected) return <div className="auth-empty"><div className="auth-empty-icon"><Layers3 size={25} /></div><h2>连接账户以查看合集</h2><p>Wallhaven API Key 可以安全地启用 NSFW 内容、个人设置与私有 collections。</p><button className="primary-button" onClick={onConnect}><KeyRound size={16} />连接 API Key</button><span>不会保存你的站内密码</span></div>
  if (activeCollection) return <div className="collection-detail"><button className="back-button" onClick={onBack}><ArrowLeft size={16} />返回我的合集</button><div className="collection-title"><div><div className="eyebrow">COLLECTION</div><h2>{activeCollection.label || activeCollection.name || `合集 ${activeCollection.id}`}</h2><p>{activeCollection.count || collectionItems.length} 张壁纸</p></div><FolderOpen size={28} /></div>{isLoading ? <GallerySkeleton /> : collectionItems.length ? <Gallery wallpapers={collectionItems} favoriteIds={favoriteIds} onSelect={onSelect} onFavorite={onFavorite} onDownload={onDownload} /> : <EmptyState activeNav="collections" onExplore={onBack} />}</div>
  return <div className="collections-view"><div className="collections-intro"><div><div className="eyebrow">YOUR LIBRARY</div><h2>我的合集</h2><p>从 Wallhaven 账户读取公开与私有收藏夹。</p></div><button className="outline-button" onClick={onConnect}><Settings size={16} />账户设置</button></div>{isLoading ? <div className="collection-skeletons">{[1, 2, 3].map((item) => <div className="collection-skeleton" key={item} />)}</div> : collections.length ? <div className="collection-grid">{collections.map((collection) => <button className="collection-card" key={collection.id} onClick={() => onOpen(collection)}><div className="collection-cover"><Images size={22} /><span>{collection.count || 0} 张</span></div><div className="collection-card-copy"><strong>{collection.label || collection.name || `合集 ${collection.id}`}</strong><span>{collection.public ? '公开合集' : '私有合集'}</span></div><ChevronRight size={17} /></button>)}</div> : <div className="empty-state compact"><div className="empty-icon"><Layers3 size={25} /></div><h2>还没有读取到合集</h2><p>请确认用户名和 API Key 正确，或者在 Wallhaven 官网创建一个合集。</p></div>}</div>
}

function AccountModal({ config, onClose, onSaved, onDisconnect }) {
  const [apiKey, setApiKey] = useState('')
  const [username, setUsername] = useState(config.username || '')
  const [isSaving, setIsSaving] = useState(false)
  async function save() {
    setIsSaving(true)
    try {
      const patch = { username }
      if (apiKey.trim()) patch.apiKey = apiKey.trim()
      const next = await window.wallhaven.config.save(patch)
      onSaved(next)
    } finally { setIsSaving(false) }
  }
  return <div className="modal-backdrop" onMouseDown={onClose}><div className="small-modal account-modal" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" onClick={onClose}><X size={18} /></button><div className="modal-icon blue"><KeyRound size={22} /></div><div className="eyebrow">ACCOUNT CONNECTION</div><h2>连接你的 Wallhaven 账户</h2><p>官方 API 使用 API Key 认证，不需要在客户端输入或保存站内密码。</p><label>API Key<input type="password" value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder={config.apiKeySet ? '已配置，输入新 Key 可替换' : '粘贴 settings/account 中的 API Key'} /></label><label>Wallhaven 用户名<input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="用于读取你的 collections" /></label><div className="modal-help"><CircleHelp size={15} /><span>API Key 可在 Wallhaven 的 Account Settings 中生成。Key 会使用系统安全存储保存。</span></div><div className="modal-actions"><div className="modal-action-group"><button className="text-button" onClick={() => window.wallhaven.openExternal('https://wallhaven.cc/settings/account')}><ExternalLink size={15} />打开账户设置</button>{config.apiKeySet && <button className="text-button danger-text" onClick={onDisconnect}><X size={15} />断开连接</button>}</div><button className="primary-button" disabled={isSaving} onClick={save}>{isSaving ? <LoaderCircle size={16} className="spin" /> : <Check size={16} />}保存连接</button></div></div></div>
}

function SettingsModal({ config, onClose, onSaved, onChooseFolder }) {
  const [downloadPath, setDownloadPath] = useState(config.downloadPath || '')
  const [theme, setTheme] = useState(config.theme || 'dark')
  async function save() {
    const next = await window.wallhaven.config.save({ downloadPath, theme })
    onSaved(next)
  }
  return <div className="modal-backdrop" onMouseDown={onClose}><div className="small-modal settings-modal" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" onClick={onClose}><X size={18} /></button><div className="modal-icon amber"><Settings size={22} /></div><div className="eyebrow">PREFERENCES</div><h2>偏好设置</h2><p>调整本地下载行为与应用显示风格。</p><label>壁纸下载目录<div className="input-with-button"><input value={downloadPath} onChange={(event) => setDownloadPath(event.target.value)} /><button onClick={async () => { await onChooseFolder(); const next = await window.wallhaven.config.get(); setDownloadPath(next.downloadPath) }}><FolderOpen size={16} />选择</button></div></label><label>界面风格<select value={theme} onChange={(event) => setTheme(event.target.value)}><option value="dark">深色 · 午夜蓝</option><option value="contrast">高对比度</option></select></label><div className="settings-note"><Info size={15} /><span>本地收藏保存在当前用户的浏览器数据中，API Key 使用 Electron 安全存储。</span></div><div className="modal-actions"><button className="text-button" onClick={() => window.wallhaven.download.openFolder()}><FolderOpen size={15} />打开下载目录</button><button className="primary-button" onClick={save}><Check size={16} />保存设置</button></div></div></div>
}

function AppErrorBoundary({ children }) { return children }

createRoot(document.getElementById('root')).render(<AppErrorBoundary><App /></AppErrorBoundary>)
