import * as React from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { StarRating } from './components/StarRating'
import { useLocalStorageState } from './hooks/useLocalStorageState'
import { BASE_PRICE_CENTS, configPriceDeltaCents, formatMoney, subtotalCents } from './lib/pricing'
import type { CartItem, Comment, ProductConfig } from './lib/types'

const assetUrl = (path: string) => `${(import.meta as ImportMeta & { env: { BASE_URL: string } }).env.BASE_URL}${path.replace(/^\//, '')}`
const VIDEO_URL = assetUrl('/videos/vera-30s-pixverse-final.mp4')
const PRODUCT_NAME = 'VERA'
const SNAP_SECTION_CLASS = 'snap-section sticky-section'
const PRODUCT_IMAGE_BY_COLOR: Record<ProductConfig['frameColor'], string> = {
  'Obsidian Black': assetUrl('/images/vera-frames/vera-obsidian-black.png'),
  'Arctic Silver': assetUrl('/images/vera-frames/vera-arctic-silver.png'),
  'Sunset Rose': assetUrl('/images/vera-frames/vera-sunset-rose.png'),
}
const PROMO_CODES: Record<string, number> = {
  TRAE10: 10,
}
const SEED_COMMENTS: Comment[] = [
  { id: 'sample-1', name: 'Maya', rating: 5, message: 'The frame feels more like a product I could wear daily than a prototype.', createdAt: '2026-05-30T00:00:00.000Z' },
  { id: 'sample-2', name: 'Jon', rating: 5, message: 'The privacy indicator is immediately understandable in shared spaces.', createdAt: '2026-05-30T00:00:00.000Z' },
  { id: 'sample-3', name: 'Ari', rating: 4, message: 'Hands-free navigation makes the experience feel calm and direct.', createdAt: '2026-05-30T00:00:00.000Z' },
]

gsap.registerPlugin(ScrollTrigger)

type OrderLookup = {
  id: string
  totalLabel: string
  createdAt: string
  items: CartItem[]
  status?: 'new' | 'reviewing' | 'contacted' | 'closed'
}

type PurchaseFormPayload = { name: string; email: string; address: string }
type PurchaseDetails = PurchaseFormPayload & {
  reference: string
  configSummary: string
  totalLabel: string
  createdAt: string
}

type SavedOrder = OrderLookup & {
  email: string
}

function uid() {
  return typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `id_${Math.random().toString(16).slice(2)}_${Date.now()}`
}

function optionClass(active: boolean) {
  return [
    'rounded-2xl border px-4 py-3 text-left text-sm transition focus-visible:outline-black',
    active
      ? 'border-zinc-950 bg-white text-zinc-950 shadow-[0_18px_45px_rgba(24,24,27,0.12)]'
      : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:border-zinc-400 hover:bg-white',
  ].join(' ')
}

function useGsapScrollStories() {
  React.useLayoutEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reducedMotion) return undefined

    const context = gsap.context(() => {
      const storySteps = gsap.utils.toArray<HTMLElement>('[data-scroll-step]')
      const railItems = gsap.utils.toArray<HTMLElement>('[data-rail-item]')
      const railProgress = document.querySelector<HTMLElement>('[data-rail-progress]')
      let railClickLockUntil = 0

      const setActiveRailItem = (index: number) => {
        railItems.forEach((item, itemIndex) => item.toggleAttribute('data-active', itemIndex === index))
        if (railProgress) gsap.to(railProgress, { scaleY: pageRail.length > 1 ? index / (pageRail.length - 1) : 0, duration: 0.18, ease: 'power2.out' })
      }

      const updateRailFromViewport = () => {
        if (Date.now() < railClickLockUntil) return

        const targetY = window.innerHeight * 0.42
        const nextIndex = storySteps.reduce((closestIndex, step, index) => {
          const currentDistance = Math.abs(step.getBoundingClientRect().top - targetY)
          const closestDistance = Math.abs(storySteps[closestIndex].getBoundingClientRect().top - targetY)
          return currentDistance < closestDistance ? index : closestIndex
        }, 0)

        setActiveRailItem(nextIndex)
      }

      const railClickCleanup = railItems.map((item, index) => {
        const handleClick = () => {
          railClickLockUntil = Date.now() + 900
          setActiveRailItem(index)
        }

        item.addEventListener('click', handleClick)
        return () => item.removeEventListener('click', handleClick)
      })

      window.addEventListener('scroll', updateRailFromViewport, { passive: true })
      window.addEventListener('resize', updateRailFromViewport)
      updateRailFromViewport()

      ScrollTrigger.create({
        trigger: '[data-main-scroll]',
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: updateRailFromViewport,
      })

      gsap.timeline({
        scrollTrigger: {
          trigger: '[data-story-intro]',
          start: 'top top',
          end: '+=260%',
          scrub: 0.8,
          pin: true,
          anticipatePin: 1,
        },
      })
        .fromTo('[data-intro-line="1"]', { autoAlpha: 0, y: 46 }, { autoAlpha: 1, y: 0, duration: 0.55 })
        .to('[data-intro-line="1"]', { autoAlpha: 0, y: -38, duration: 0.45 }, '+=0.25')
        .fromTo('[data-intro-line="2"]', { autoAlpha: 0, y: 46 }, { autoAlpha: 1, y: 0, duration: 0.55 })
        .to('[data-intro-line="2"]', { autoAlpha: 0, y: -38, duration: 0.45 }, '+=0.25')
        .fromTo('[data-intro-line="3"]', { autoAlpha: 0, y: 46 }, { autoAlpha: 1, y: 0, duration: 0.7 })
        .to('[data-intro-visual]', { scale: 1.12, filter: 'blur(18px)', autoAlpha: 0.28, ease: 'none' }, 0)

      const cards = gsap.utils.toArray<HTMLElement>('[data-flip-card]')
      const notes = gsap.utils.toArray<HTMLElement>('[data-flip-note]')
      const progressDots = gsap.utils.toArray<HTMLElement>('[data-flip-dot]')

      gsap.set(cards, { autoAlpha: 0, y: 72, rotateX: 18, rotateY: 10, scale: 0.94, transformPerspective: 1200, transformOrigin: 'center bottom' })
      gsap.set(notes, { autoAlpha: 0, y: 26 })
      gsap.set(progressDots, { scale: 0.8, autoAlpha: 0.32 })

      const flipTimeline = gsap.timeline({
        scrollTrigger: {
          trigger: '[data-flip-section]',
          start: 'top top',
          end: '+=330%',
          scrub: 0.85,
          pin: true,
          anticipatePin: 1,
        },
      })

      cards.forEach((card, index) => {
        const note = notes[index]
        const dot = progressDots[index]
        const start = index * 1.15
        flipTimeline
          .to(card, { autoAlpha: 1, y: 0, rotateX: 0, rotateY: 0, scale: 1, duration: 0.42, ease: 'power2.out' }, start)
          .to(note, { autoAlpha: 1, y: 0, duration: 0.32 }, start + 0.12)
          .to(dot, { autoAlpha: 1, scale: 1.12, duration: 0.24 }, start + 0.12)

        if (index < cards.length - 1) {
          flipTimeline
            .to(note, { autoAlpha: 0, y: -24, duration: 0.26 }, start + 0.68)
            .to(dot, { autoAlpha: 0.32, scale: 0.8, duration: 0.2 }, start + 0.72)
            .to(card, { rotateX: -82, rotateY: -8, y: -90, scale: 0.92, autoAlpha: 0, duration: 0.42, ease: 'power2.in' }, start + 0.78)
        }
      })

      gsap.fromTo('[data-price-panel]', { autoAlpha: 0, y: 76, scale: 0.96 }, {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '[data-final-price]',
          start: 'top 62%',
          end: 'top 20%',
          scrub: 0.75,
        },
      })

      return () => {
        railClickCleanup.forEach((cleanup) => cleanup())
        window.removeEventListener('scroll', updateRailFromViewport)
        window.removeEventListener('resize', updateRailFromViewport)
      }
    })

    return () => context.revert()
  }, [])
}

function createCartItem(config: ProductConfig, unitPrice: number, sku: string): CartItem {
  return {
    id: uid(),
    sku,
    name: PRODUCT_NAME,
    unitPriceCents: unitPrice,
    qty: 1,
    config,
  }
}

export default function App() {
  useGsapScrollStories()

  const [config, setConfig] = React.useState<ProductConfig>({
    frameColor: 'Obsidian Black',
    lens: 'Clear',
    storage: '64GB',
    warranty: 'None',
  })

  const [cart, setCart] = useLocalStorageState<CartItem[]>('trae_ar_cart_v1', [])
  const [promoCode, setPromoCode] = useLocalStorageState<string>('trae_ar_promo_v1', '')
  const [savedOrders, setSavedOrders] = useLocalStorageState<SavedOrder[]>('trae_ar_orders_v1', [])
  const [localComments, setLocalComments] = useLocalStorageState<Comment[]>('trae_ar_comments_v1', [])
  const [promoDiscountPercent, setPromoDiscountPercent] = React.useState(0)
  const [toast, setToast] = React.useState<string | null>(null)
  const [orderLookup, setOrderLookup] = React.useState<OrderLookup | null>(null)
  const [purchaseReference, setPurchaseReference] = React.useState<string | null>(null)
  const [purchaseDetails, setPurchaseDetails] = React.useState<PurchaseDetails | null>(null)
  const comments = React.useMemo(() => [...localComments, ...SEED_COMMENTS], [localComments])

  React.useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), 3600)
    return () => window.clearTimeout(t)
  }, [toast])

  const unitPrice = BASE_PRICE_CENTS + configPriceDeltaCents(config)
  const sku = `VERA-${config.frameColor[0]}${config.lens[0]}-${config.storage.replace('GB', '')}`
  const activeItems = cart.length > 0 ? cart : [createCartItem(config, unitPrice, sku)]
  const subtotal = subtotalCents(activeItems)
  const promoActive = promoDiscountPercent > 0
  const discount = promoActive ? Math.round(subtotal * (promoDiscountPercent / 100)) : 0
  const shipping = subtotal - discount >= 150000 ? 0 : subtotal > 0 ? 2500 : 0
  const tax = Math.round((subtotal - discount + shipping) * 0.07)
  const total = subtotal - discount + shipping + tax
  const avgRating = comments.length === 0 ? 0 : comments.reduce((s, c) => s + c.rating, 0) / comments.length
  const currentSummary = `${config.frameColor} · ${config.lens} · ${config.storage} · ${config.warranty}`

  function saveConfiguration() {
    const item = createCartItem(config, unitPrice, sku)
    setCart([item])
    setToast(`Configuration saved locally: CFG-${uid().slice(0, 8).toUpperCase()}`)
  }

  function applyPromo() {
    const discountPercent = PROMO_CODES[promoCode.trim().toUpperCase()] ?? 0
    if (discountPercent > 0) {
      setPromoDiscountPercent(discountPercent)
      setToast('Promo applied')
      return
    }

    setPromoDiscountPercent(0)
    setToast('Invalid code')
  }

  function updateQty(id: string, nextQty: number) {
    setCart((prev) => prev.map((it) => (it.id === id ? { ...it, qty: Math.max(1, Math.min(9, nextQty)) } : it)))
  }

  function removeFromCart(id: string) {
    setCart((prev) => prev.filter((it) => it.id !== id))
  }

  function requestPurchase(form: PurchaseFormPayload) {
    const items = cart.length > 0 ? cart : [createCartItem(config, unitPrice, sku)]
    const createdAt = new Date().toISOString()
    const reference = `VERA-${createdAt.slice(0, 10).replaceAll('-', '')}-${uid().slice(0, 5).toUpperCase()}`
    const totalLabel = formatMoney(total)
    const order: SavedOrder = { id: reference, email: form.email.trim().toLowerCase(), totalLabel, items, status: 'new', createdAt }

    setSavedOrders((prev) => [order, ...prev].slice(0, 20))
    setPurchaseReference(reference)
    setPurchaseDetails({ ...form, reference, configSummary: currentSummary, totalLabel, createdAt })
    setCart(items)
    setToast('Inquiry saved locally')
  }

  function submitComment(form: { name: string; rating: 1 | 2 | 3 | 4 | 5; message: string }) {
    const comment: Comment = {
      id: `review-${uid()}`,
      name: form.name.trim() || 'Anonymous',
      rating: form.rating,
      message: form.message.trim(),
      createdAt: new Date().toISOString(),
    }

    setLocalComments((prev) => [comment, ...prev].slice(0, 20))
    setToast('Impression saved locally')
  }

  function lookupOrder(form: { id: string; email: string }) {
    const order = savedOrders.find((entry) => entry.id.toLowerCase() === form.id.trim().toLowerCase() && entry.email === form.email.trim().toLowerCase())
    if (order) {
      const { email, ...lookup } = order
      setOrderLookup(lookup)
      setToast('Reference found')
      return
    }

    setOrderLookup(null)
    setToast('Reference not found on this device')
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f5f5f3] text-zinc-950">
      <Header savedCount={cart.reduce((s, it) => s + it.qty, 0)} />

      <main className="page-snap-container" data-main-scroll>
        <div data-scroll-step><HeroScene /></div>
        <div id="story" data-scroll-step><StickyIntroScene /></div>
        <div id="features" data-scroll-step><FeatureFlipScene /></div>
        <ConfiguratorScene config={config} setConfig={setConfig} unitPrice={unitPrice} sku={sku} onSave={saveConfiguration} />
        <ConfigurationSummaryScene
          cart={cart}
          currentItem={activeItems[0]}
          promoCode={promoCode}
          setPromoCode={setPromoCode}
          promoActive={promoActive}
          subtotal={subtotal}
          discount={discount}
          shipping={shipping}
          tax={tax}
          total={total}
          onApplyPromo={applyPromo}
          onUpdateQty={updateQty}
          onRemove={removeFromCart}
        />
        <PurchaseInquiryScene
          configSummary={currentSummary}
          totalLabel={formatMoney(total)}
          reference={purchaseReference}
          details={purchaseDetails}
          onSubmit={requestPurchase}
        />
        <ImpressionsScene comments={comments} avgRating={avgRating} onSubmit={submitComment} />
        <FooterInquiryScene order={orderLookup} onSubmit={lookupOrder} />
      </main>

      {toast ? (
        <div aria-live="polite" className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-full border border-zinc-200 bg-white px-5 py-3 text-sm font-medium text-zinc-900 shadow-[0_20px_60px_rgba(24,24,27,0.16)]">
          {toast}
        </div>
      ) : null}
    </div>
  )
}

const pageRail = [
  { id: 'top', label: 'Opening' },
  { id: 'story', label: 'Story' },
  { id: 'features', label: 'Flip cards' },
  { id: 'configure', label: 'Configure' },
  { id: 'final-price', label: 'Price' },
  { id: 'purchase', label: 'Purchase' },
  { id: 'impressions', label: 'Impressions' },
  { id: 'reference', label: 'Reference' },
] as const

function RightScrollRail() {
  return (
    <aside className="fixed right-4 top-1/2 z-50 hidden -translate-y-1/2 lg:block" aria-label="Page scroll progress">
      <div className="relative rounded-full border border-zinc-950/10 bg-white/72 p-2 shadow-[0_22px_70px_rgba(24,24,27,0.14)] backdrop-blur-xl">
        <div className="absolute left-1/2 top-5 h-[calc(100%-2.5rem)] w-px -translate-x-1/2 bg-zinc-950/12" aria-hidden="true">
          <div data-rail-progress className="h-full origin-top scale-y-0 bg-zinc-950" />
        </div>
        <nav className="relative grid gap-3" aria-label="Story sections">
          {pageRail.map((item, index) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              data-rail-item
              data-active={index === 0 ? '' : undefined}
              className="group grid h-10 w-10 place-items-center rounded-full text-[11px] font-semibold text-zinc-500 transition hover:bg-zinc-950 hover:text-white data-[active]:bg-zinc-950 data-[active]:text-white"
            >
              <span className="sr-only">Go to {item.label}</span>
              <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
            </a>
          ))}
        </nav>
      </div>
    </aside>
  )
}

function Header(props: { savedCount: number }) {
  const [hasScrolledPastHero, setHasScrolledPastHero] = React.useState(false)

  React.useEffect(() => {
    const updateHeaderState = () => {
      setHasScrolledPastHero(window.scrollY >= window.innerHeight - 96)
    }

    updateHeaderState()
    window.addEventListener('scroll', updateHeaderState, { passive: true })
    window.addEventListener('resize', updateHeaderState)

    return () => {
      window.removeEventListener('scroll', updateHeaderState)
      window.removeEventListener('resize', updateHeaderState)
    }
  }, [])

  const linkClass = hasScrolledPastHero
    ? 'transition hover:text-zinc-950 focus-visible:outline-zinc-950'
    : 'transition hover:text-white focus-visible:outline-white'

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 px-5 py-4 transition-colors duration-300 ${
        hasScrolledPastHero ? 'border-b border-zinc-200/70 bg-white shadow-[0_14px_45px_rgba(24,24,27,0.08)]' : 'bg-transparent'
      }`}
      aria-label="Site header"
    >
      <nav className={`mx-auto flex w-full max-w-7xl items-center justify-between transition-colors duration-300 ${hasScrolledPastHero ? 'text-zinc-950' : 'text-white'}`} aria-label="Primary navigation">
        <a href="#top" className="text-sm font-semibold tracking-tight">VERA</a>
        <div className={`hidden items-center gap-6 text-sm md:flex ${hasScrolledPastHero ? 'text-zinc-600' : 'text-white/72'}`}>
          <a href="#configure" className={linkClass}>Configure</a>
          <a href="#impressions" className={linkClass}>Impressions</a>
        </div>
        <a href="#purchase" className={`px-4 py-2 text-sm font-semibold transition ${hasScrolledPastHero ? 'bg-zinc-950 text-white hover:bg-zinc-700 focus-visible:outline-zinc-950' : 'bg-white text-zinc-950 hover:bg-white/86 focus-visible:outline-white'}`}>
          Request details{props.savedCount ? ` · ${props.savedCount}` : ''}
        </a>
      </nav>
    </header>
  )
}

function HeroScene() {
  return (
    <section id="top" className={`${SNAP_SECTION_CLASS} relative min-h-screen overflow-hidden bg-zinc-950 px-5 text-white`}>
      <div className="hero-video-drift absolute inset-x-0 top-0 h-screen overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_76%_10%,rgba(255,255,255,0.22),transparent_30%),linear-gradient(120deg,#050505_0%,#18181b_46%,#4b4b45_100%)]" />
        <video
          className="hero-video absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={assetUrl('/assets/hero.png')}
          aria-label="VERA introduction video showing AR and AI glasses moments"
        >
          <source src={VIDEO_URL} type="video/mp4" />
        </video>
        <div className="hero-video-fallback absolute inset-0 grid h-full w-full place-items-center bg-[radial-gradient(circle_at_50%_40%,rgba(255,255,255,0.28),rgba(255,255,255,0.08)_35%,rgba(0,0,0,0.18)_70%)]">
          <ProductVisual size="hero" />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(9,9,11,0.88),rgba(9,9,11,0.22)_48%,rgba(9,9,11,0.72)),linear-gradient(0deg,rgba(9,9,11,0.74),transparent_34%,rgba(9,9,11,0.2))]" />
      </div>
      <div className="hero-copy relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col justify-end pb-20 pt-24">
        <div className="max-w-4xl">
          <h1 className="text-6xl font-semibold tracking-[-0.065em] text-white sm:text-7xl lg:text-8xl">
            See space become interface.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/72">
            VERA is an AR+AI glasses experience that overlays timely information, voice assistance and hands-free controls into everyday view.
          </p>
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href="#configure" className="rounded-full border border-white/25 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20">Configure VERA</a>
        </div>
      </div>
    </section>
  )
}

function StickyIntroScene() {
  return (
    <section data-story-intro className={`${SNAP_SECTION_CLASS} relative min-h-screen overflow-hidden bg-[#f5f5f3] px-5 text-zinc-950`}>
      <div data-intro-visual className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-60">
        <div className="h-[38rem] w-[38rem] rounded-full bg-[radial-gradient(circle,rgba(24,24,27,0.13),transparent_62%)]" />
      </div>
      <div className="relative mx-auto flex min-h-screen max-w-7xl items-center justify-center py-24">
        <div className="relative h-[22rem] w-full max-w-5xl text-center" aria-label="VERA product story">
          <p data-intro-line="1" className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-4xl font-semibold leading-tight tracking-[-0.055em] sm:text-6xl lg:text-7xl">
            VERA blends digital content with the space around you.
          </p>
          <p data-intro-line="2" className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-4xl font-semibold leading-tight tracking-[-0.055em] sm:text-6xl lg:text-7xl">
            Built for hands-free control, balanced comfort and transparent privacy.
          </p>
          <p data-intro-line="3" className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-4xl font-semibold leading-tight tracking-[-0.055em] sm:text-6xl lg:text-7xl">
            Configure the fit, review the total and request details when you are ready.
          </p>
        </div>
      </div>
    </section>
  )
}

const featureStories = [
  {
    title: 'Hands-free AI',
    eyebrow: 'Voice + gaze',
    description: 'Voice and gaze shortcuts help you move through content naturally, without reaching for another device.',
    visual: 'wave',
  },
  {
    title: 'All-day comfort',
    eyebrow: 'Balanced frame',
    description: 'A lightweight frame keeps the experience wearable, balanced and easy to return to throughout the day.',
    visual: 'comfort',
  },
  {
    title: 'Privacy-first',
    eyebrow: 'Clear indicators',
    description: 'Clear device indicators keep interactions transparent, so people around you understand what is happening.',
    visual: 'privacy',
  },
] as const

function FeatureFlipScene() {
  return (
    <section data-flip-section className={`${SNAP_SECTION_CLASS} relative min-h-screen overflow-hidden bg-zinc-950 px-5 text-white`}>
      <div className="mx-auto grid min-h-screen max-w-7xl gap-10 py-24 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
        <div className="lg:pb-28">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-zinc-500">Scroll story</p>
          <h2 className="mt-4 max-w-xl text-5xl font-semibold leading-none tracking-[-0.06em] sm:text-6xl">
            Designed around how you naturally move.
          </h2>
          <div className="mt-8 flex gap-3" aria-label="Feature story progress">
            {featureStories.map((story) => (
              <span key={story.title} data-flip-dot className="h-2.5 w-10 rounded-full bg-white" />
            ))}
          </div>
        </div>
        <div className="grid gap-8 lg:grid-cols-[1fr_0.82fr] lg:items-center">
          <div className="flip-stage relative h-[28rem] sm:h-[34rem]" aria-label="Scroll-driven feature card flip">
            {featureStories.map((story, index) => (
              <article key={story.title} data-flip-card className="flip-card absolute inset-0 rounded-[2.5rem] border border-white/10 bg-white p-6 text-zinc-950 shadow-[0_40px_120px_rgba(0,0,0,0.42)] sm:p-8" style={{ zIndex: featureStories.length - index }}>
                <div className="flex h-full flex-col justify-between overflow-hidden rounded-[2rem] bg-[#f5f5f3] p-6">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-zinc-500">{story.eyebrow}</p>
                    <span className="text-sm font-semibold text-zinc-400">0{index + 1}</span>
                  </div>
                  <FeatureVisual type={story.visual} />
                  <h3 className="text-5xl font-semibold tracking-[-0.06em] sm:text-6xl">{story.title}</h3>
                </div>
              </article>
            ))}
          </div>
          <div className="relative min-h-48">
            {featureStories.map((story) => (
              <p key={story.title} data-flip-note className="absolute inset-x-0 top-0 text-2xl font-medium leading-10 tracking-[-0.035em] text-zinc-200">
                {story.description}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function FeatureVisual(props: { type: 'wave' | 'comfort' | 'privacy' }) {
  if (props.type === 'wave') {
    return <div className="my-10 flex h-36 items-center justify-center gap-2" aria-hidden="true">{[24, 48, 82, 58, 108, 70, 38].map((height, index) => <span key={index} className="w-3 rounded-full bg-zinc-950/80" style={{ height }} />)}</div>
  }

  if (props.type === 'comfort') {
    return <div className="my-10 rounded-[999px] bg-white p-8 shadow-inner" aria-hidden="true"><ProductVisual color="Arctic Silver" /></div>
  }

  return <div className="my-10 grid h-52 place-items-center rounded-[2rem] bg-zinc-950 text-white" aria-hidden="true"><div className="flex items-center gap-4 rounded-full border border-white/15 px-5 py-3"><span className="h-3 w-3 rounded-full bg-emerald-300 shadow-[0_0_32px_rgba(110,231,183,0.9)]" /><span className="text-sm font-semibold tracking-[0.18em]">ACTIVE INDICATOR</span></div></div>
}

function ConfiguratorScene(props: {
  config: ProductConfig
  setConfig: React.Dispatch<React.SetStateAction<ProductConfig>>
  unitPrice: number
  sku: string
  onSave: () => void
}) {
  const steps = [
    { label: 'Frame', value: props.config.frameColor },
    { label: 'Lens', value: props.config.lens },
    { label: 'Storage', value: props.config.storage },
    { label: 'Care', value: props.config.warranty === 'None' ? 'Standard' : props.config.warranty },
  ]

  return (
    <section id="configure" data-scroll-step className={`${SNAP_SECTION_CLASS} border-y border-zinc-200 bg-white px-5 py-24 sm:py-32`}>
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-zinc-500">Choose your VERA</p>
            <h2 className="mt-4 text-5xl font-semibold tracking-[-0.055em] text-zinc-950 sm:text-6xl">Configure with calm clarity.</h2>
          </div>
          <div className="rounded-full border border-zinc-200 bg-zinc-50 px-5 py-3 text-sm font-semibold text-zinc-600">{props.sku}</div>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <aside className="sticky top-24 rounded-[2.75rem] p-6">
            <ProductVisual color={props.config.frameColor} />
            <div className="mt-6 grid gap-x-8 gap-y-5 sm:grid-cols-2">
              {steps.map((step) => (
                <div key={step.label} className="p-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">{step.label}</p>
                  <p className="mt-2 text-sm font-semibold text-zinc-950">{step.value}</p>
                </div>
              ))}
            </div>
          </aside>

          <div className="grid gap-5">
            <ConfiguratorPanel step="01" title="Frame color" description="Pick the finish that best fits your daily carry.">
              <OptionGroup options={['Obsidian Black', 'Arctic Silver', 'Sunset Rose'] as const} value={props.config.frameColor} onChange={(v) => props.setConfig((c) => ({ ...c, frameColor: v }))} />
            </ConfiguratorPanel>
            <ConfiguratorPanel step="02" title="Lens" description="Choose clear everyday glass or adaptive transitions.">
              <OptionGroup options={['Clear', 'Transitions'] as const} value={props.config.lens} onChange={(v) => props.setConfig((c) => ({ ...c, lens: v }))} priceLabels={{ Transitions: '+ $149' }} />
            </ConfiguratorPanel>
            <ConfiguratorPanel step="03" title="Storage" description="Keep local captures and app states close at hand.">
              <OptionGroup options={['64GB', '128GB'] as const} value={props.config.storage} onChange={(v) => props.setConfig((c) => ({ ...c, storage: v }))} priceLabels={{ '128GB': '+ $60' }} />
            </ConfiguratorPanel>
            <ConfiguratorPanel step="04" title="Protection" description="Add care coverage if this is part of your daily workflow.">
              <OptionGroup options={['None', '1 year', '2 years'] as const} value={props.config.warranty} onChange={(v) => props.setConfig((c) => ({ ...c, warranty: v }))} priceLabels={{ '1 year': '+ $79', '2 years': '+ $129' }} />
            </ConfiguratorPanel>
            <div className="rounded-[2rem] border border-zinc-200 bg-zinc-50 p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-sm text-zinc-500">Unit price</div>
                  <div className="mt-1 text-3xl font-semibold tracking-[-0.04em] text-zinc-950">{formatMoney(props.unitPrice)}</div>
                </div>
                <button type="button" onClick={props.onSave} className="rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-700">
                  Save configuration
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function ConfiguratorPanel(props: { step: string; title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[2.25rem] border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="grid gap-4 md:grid-cols-[0.72fr_1.28fr] md:items-start">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-400">{props.step}</p>
          <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-zinc-950">{props.title}</h3>
          <p className="mt-2 text-sm leading-6 text-zinc-500">{props.description}</p>
        </div>
        {props.children}
      </div>
    </section>
  )
}

function ConfigurationSummaryScene(props: {
  cart: CartItem[]
  currentItem: CartItem
  promoCode: string
  setPromoCode: (value: string) => void
  promoActive: boolean
  subtotal: number
  discount: number
  shipping: number
  tax: number
  total: number
  onApplyPromo: () => void
  onUpdateQty: (id: string, qty: number) => void
  onRemove: (id: string) => void
}) {
  const items = props.cart.length > 0 ? props.cart : [props.currentItem]
  return (
    <section id="final-price" data-final-price data-scroll-step className={`${SNAP_SECTION_CLASS} relative overflow-hidden bg-[#f5f5f3] px-5 py-28 sm:py-36`}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(24,24,27,0.08),transparent_34%),radial-gradient(circle_at_86%_80%,rgba(24,24,27,0.08),transparent_28%)]" />
      <div data-price-panel className="relative mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-zinc-500">Final setup</p>
          <h2 className="mt-4 max-w-3xl text-5xl font-semibold tracking-[-0.055em] text-zinc-950 sm:text-6xl">Review the build and price before the inquiry.</h2>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-500">This final panel keeps the selected configuration, quantity controls, promo estimate and total visible as the story lands on a purchasing decision.</p>
          <div className="mt-10 space-y-4">
            {items.map((it) => (
              <article key={it.id} className="rounded-[2.25rem] border border-zinc-200 bg-white p-5 shadow-[0_24px_80px_rgba(24,24,27,0.08)]">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-semibold text-zinc-950">{it.name}</h3>
                    <p className="mt-2 text-sm leading-6 text-zinc-500">{it.sku} · {it.config.frameColor} · {it.config.lens} · {it.config.storage} · {it.config.warranty}</p>
                    <p className="mt-3 text-lg font-semibold text-zinc-950">{formatMoney(it.unitPriceCents)}</p>
                  </div>
                  {props.cart.length > 0 ? <button type="button" onClick={() => props.onRemove(it.id)} className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-600 hover:border-zinc-400">Remove</button> : null}
                </div>
                {props.cart.length > 0 ? (
                  <div className="mt-5 flex items-center justify-between border-t border-zinc-100 pt-4">
                    <div className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50">
                      <button type="button" onClick={() => props.onUpdateQty(it.id, it.qty - 1)} className="px-4 py-2" aria-label="Decrease quantity">−</button>
                      <span className="px-2 text-sm font-semibold">{it.qty}</span>
                      <button type="button" onClick={() => props.onUpdateQty(it.id, it.qty + 1)} className="px-4 py-2" aria-label="Increase quantity">+</button>
                    </div>
                    <div className="font-semibold">{formatMoney(it.unitPriceCents * it.qty)}</div>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </div>
        <aside className="sticky top-24 rounded-[2.75rem] border border-zinc-200 bg-white p-6 shadow-[0_35px_110px_rgba(24,24,27,0.12)] lg:self-start">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-zinc-400">Checkout preview</p>
              <h3 className="mt-2 text-3xl font-semibold tracking-[-0.05em]">Estimated total</h3>
            </div>
            <span className="rounded-full bg-zinc-950 px-3 py-1 text-xs font-semibold text-white">USD</span>
          </div>
          <div className="mt-6 rounded-2xl bg-zinc-50 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-500">Promo code</span>
              <span className="text-zinc-400">Try: TRAE10</span>
            </div>
            <div className="mt-3 flex gap-2">
              <input value={props.promoCode} onChange={(e) => props.setPromoCode(e.target.value)} placeholder="Enter code" className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-950" />
              <button type="button" onClick={props.onApplyPromo} className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold hover:bg-white">Apply</button>
            </div>
            {props.promoActive ? <p className="mt-2 text-sm text-emerald-700">10% discount active</p> : null}
          </div>
          <div className="mt-6 space-y-3 text-sm">
            <Row label="Subtotal" value={formatMoney(props.subtotal)} />
            <Row label="Promo" value={props.discount ? `− ${formatMoney(props.discount)}` : formatMoney(0)} muted={!props.discount} />
            <Row label="Shipping" value={props.shipping ? formatMoney(props.shipping) : 'Free'} muted={props.shipping === 0} />
            <Row label="Estimated tax" value={formatMoney(props.tax)} />
            <div className="h-px bg-zinc-200" />
            <Row label="Total" value={formatMoney(props.total)} bold />
          </div>
          <a href="#purchase" className="mt-6 block rounded-full bg-zinc-950 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-zinc-700">Request purchase details</a>
        </aside>
      </div>
    </section>
  )
}

function PurchaseInquiryScene(props: {
  configSummary: string
  totalLabel: string
  reference: string | null
  details: PurchaseDetails | null
  onSubmit: (form: PurchaseFormPayload) => void | Promise<void>
}) {
  const downloadHref = props.details
    ? `data:text/plain;charset=utf-8,${encodeURIComponent(formatPurchaseDetailsText(props.details))}`
    : null

  return (
    <section id="purchase" data-scroll-step className={`${SNAP_SECTION_CLASS} px-5 py-28 sm:py-36`}>
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-zinc-500">Request purchase details</p>
          <h2 className="mt-4 text-5xl font-semibold tracking-[-0.055em] text-zinc-950 sm:text-6xl">Request purchase details.</h2>
          <div className="mt-8 rounded-[2rem] bg-white p-6 shadow-sm">
            <p className="text-sm text-zinc-500">Selected configuration</p>
            <p className="mt-2 text-lg font-semibold text-zinc-950">{props.configSummary}</p>
            <p className="mt-4 text-sm text-zinc-500">Estimated total</p>
            <p className="mt-1 text-3xl font-semibold tracking-[-0.04em]">{props.totalLabel}</p>
          </div>
          {props.reference ? (
            <div className="mt-5 rounded-[2rem] border border-emerald-200 bg-emerald-50 p-6 text-emerald-950">
              <p className="font-semibold">Inquiry received.</p>
              <p className="mt-2 text-sm">Reference: {props.reference}</p>
              {downloadHref ? (
                <a href={downloadHref} download={`vera-purchase-details-${props.reference}.txt`} className="mt-5 inline-flex rounded-full bg-emerald-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800">
                  Download purchase details TXT
                </a>
              ) : null}
            </div>
          ) : null}
        </div>
        <PurchaseForm onSubmit={props.onSubmit} />
      </div>
    </section>
  )
}

function formatPurchaseDetailsText(details: PurchaseDetails) {
  return [
    'VERA Purchase Details',
    '',
    `Reference: ${details.reference}`,
    `Created at: ${new Date(details.createdAt).toLocaleString()}`,
    `Name: ${details.name}`,
    `Email: ${details.email}`,
    `Delivery address: ${details.address}`,
    '',
    'Selected configuration',
    details.configSummary,
    '',
    `Estimated total: ${details.totalLabel}`,
    '',
    'This document confirms that your purchase details request was received. No payment has been processed. The VERA team will contact you with next steps.',
  ].join('\n')
}

function ImpressionsScene(props: {
  comments: Comment[]
  avgRating: number
  onSubmit: (form: { name: string; rating: 1 | 2 | 3 | 4 | 5; message: string }) => void | Promise<void>
}) {
  return (
    <section id="impressions" data-scroll-step className={`${SNAP_SECTION_CLASS} bg-zinc-950 px-5 py-28 text-white sm:py-36`}>
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-zinc-400">Early impressions</p>
            <h2 className="mt-4 text-5xl font-semibold tracking-[-0.055em] sm:text-6xl">Early impressions.</h2>
            <p className="mt-4 text-lg text-zinc-400">What early users notice first.</p>
          </div>
          <div className="flex items-center gap-3 rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300">
            <StarRating value={Math.round(props.avgRating)} size="sm" />
            {props.comments.length ? `${props.avgRating.toFixed(1)} average` : 'Share the first impression'}
          </div>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {(props.comments.length ? props.comments.slice(0, 3) : [
            { id: 'sample-1', name: 'Maya', rating: 5, message: 'The frame feels more like a product I could wear daily than a prototype.', createdAt: new Date().toISOString() },
            { id: 'sample-2', name: 'Jon', rating: 5, message: 'The privacy indicator is immediately understandable in shared spaces.', createdAt: new Date().toISOString() },
            { id: 'sample-3', name: 'Ari', rating: 4, message: 'Hands-free navigation makes the experience feel calm and direct.', createdAt: new Date().toISOString() },
          ] as Comment[]).map((comment) => (
            <article key={comment.id} className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6">
              <StarRating value={comment.rating} size="sm" />
              <p className="mt-6 text-2xl font-medium leading-9 tracking-[-0.035em]">“{comment.message}”</p>
              <p className="mt-6 text-sm text-zinc-400">{comment.name} · {new Date(comment.createdAt).toLocaleDateString()}</p>
            </article>
          ))}
        </div>
        <CommentComposer onSubmit={props.onSubmit} />
      </div>
    </section>
  )
}

function FooterInquiryScene(props: { order: OrderLookup | null; onSubmit: (f: { id: string; email: string }) => void | Promise<void> }) {
  return (
    <footer id="reference" data-scroll-step className="snap-section bg-white px-5 py-16">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-end">
        <div>
          <h2 className="text-3xl font-semibold tracking-[-0.045em] text-zinc-950">Already submitted an inquiry?<br />Check your reference.</h2>
          <p className="mt-4 max-w-xl text-sm leading-6 text-zinc-500">Use the reference from your request details confirmation. This utility stays out of the main product story.</p>
          <p className="mt-8 text-xs text-zinc-400">VERA · AR+AI glasses storefront.</p>
        </div>
        <OrderLookupForm onSubmit={props.onSubmit} order={props.order} />
      </div>
    </footer>
  )
}

function ProductVisual(props: { size?: 'hero'; color?: ProductConfig['frameColor'] }) {
  const color = props.color ?? 'Obsidian Black'
  return (
    <div className={`relative mx-auto grid ${props.size === 'hero' ? 'h-[28rem]' : 'h-72'} place-items-center`} aria-hidden="true">
      <img className="relative z-10 h-full w-full object-contain" src={PRODUCT_IMAGE_BY_COLOR[color]} alt="" draggable={false} />
    </div>
  )
}

function OptionGroup<T extends string>(props: { title?: string; options: readonly T[]; value: T; onChange: (value: T) => void; priceLabels?: Partial<Record<T, string>> }) {
  return (
    <fieldset className={props.title ? 'rounded-[2rem] border border-zinc-200 bg-white p-5 shadow-sm' : ''}>
      {props.title ? <legend className="px-2 text-sm font-semibold text-zinc-950">{props.title}</legend> : <legend className="sr-only">Choose option</legend>}
      <div className={`${props.title ? 'mt-4' : ''} grid gap-3 sm:grid-cols-2`}>
        {props.options.map((option) => (
          <button key={option} type="button" aria-pressed={props.value === option} onClick={() => props.onChange(option)} className={optionClass(props.value === option)}>
            <span className="block font-semibold">{option}</span>
            {props.priceLabels?.[option] ? <span className="mt-1 block text-xs text-zinc-500">{props.priceLabels[option]}</span> : null}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

function Row(props: { label: string; value: string; muted?: boolean; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className={`${props.bold ? 'font-semibold text-zinc-950' : 'text-zinc-500'}`}>{props.label}</div>
      <div className={`${props.muted ? 'text-zinc-400' : 'text-zinc-950'} ${props.bold ? 'text-2xl font-semibold tracking-[-0.04em]' : 'font-medium'}`}>{props.value}</div>
    </div>
  )
}

function PurchaseForm(props: { onSubmit: (form: PurchaseFormPayload) => void | Promise<void> }) {
  const [name, setName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [country, setCountry] = React.useState('Singapore')
  const [address, setAddress] = React.useState('')
  const fullAddress = `${country} · ${address.trim()}`
  const canSubmit = name.trim().length >= 2 && email.includes('@') && country.trim().length >= 2 && address.trim().length >= 8
  return (
    <form className="grid gap-4 rounded-[2.5rem] border border-zinc-200 bg-white p-6 shadow-sm" onSubmit={(e) => { e.preventDefault(); if (canSubmit) props.onSubmit({ name, email, address: fullAddress }) }}>
      <LabeledInput label="Name" value={name} onChange={setName} placeholder="Your name" />
      <LabeledInput label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
      <label className="grid gap-2">
        <span className="text-sm font-medium text-zinc-600">Country</span>
        <select value={country} onChange={(e) => setCountry(e.target.value)} className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-950">
          <option>Singapore</option>
          <option>Malaysia</option>
          <option>United States</option>
          <option>United Kingdom</option>
          <option>Canada</option>
          <option>Australia</option>
          <option>Japan</option>
          <option>South Korea</option>
          <option>China</option>
          <option>Germany</option>
          <option>France</option>
        </select>
      </label>
      <LabeledInput label="Detailed address" value={address} onChange={setAddress} placeholder="Street, unit, city, postal code" />
      <button type="submit" disabled={!canSubmit} className="rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:opacity-40">Request purchase details</button>
      <p className="text-xs leading-5 text-zinc-500">This creates an inquiry record only. No payment is processed.</p>
    </form>
  )
}

function LabeledInput(props: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-zinc-600">{props.label}</span>
      <input type={props.type ?? 'text'} value={props.value} onChange={(e) => props.onChange(e.target.value)} placeholder={props.placeholder} className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-950 placeholder:text-zinc-400" />
    </label>
  )
}

function OrderLookupForm(props: { onSubmit: (f: { id: string; email: string }) => void | Promise<void>; order: OrderLookup | null }) {
  const [id, setId] = React.useState('')
  const [email, setEmail] = React.useState('')
  const canSubmit = id.trim().length >= 6 && email.includes('@')
  return (
    <form className="grid gap-3 rounded-[2rem] border border-zinc-200 bg-zinc-50 p-5" onSubmit={(e) => { e.preventDefault(); if (canSubmit) props.onSubmit({ id: id.trim(), email }) }}>
      <div className="grid gap-3 sm:grid-cols-2">
        <input value={id} onChange={(e) => setId(e.target.value)} placeholder="AV-20260530-XXXXX" className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm" />
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email used for request" className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm" />
      </div>
      <button type="submit" disabled={!canSubmit} className="rounded-full border border-zinc-300 bg-white px-5 py-3 text-sm font-semibold text-zinc-950 hover:border-zinc-500 disabled:opacity-40">Check your reference</button>
      {props.order ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950"><div className="font-semibold">{props.order.id}</div><div className="mt-1">Status: {props.order.status ?? 'new'}</div><div className="mt-1">{props.order.totalLabel} · {props.order.items.length} item(s)</div><div className="mt-1 text-emerald-800/70">{new Date(props.order.createdAt).toLocaleString()}</div></div> : null}
    </form>
  )
}

function CommentComposer(props: { onSubmit: (f: { name: string; rating: 1 | 2 | 3 | 4 | 5; message: string }) => void | Promise<void> }) {
  const [name, setName] = React.useState('')
  const [rating, setRating] = React.useState<1 | 2 | 3 | 4 | 5>(5)
  const [message, setMessage] = React.useState('')
  const canPost = message.trim().length >= 10
  return (
    <form className="mt-10 grid gap-4 rounded-[2rem] border border-white/10 bg-white/[0.06] p-5" onSubmit={(e) => { e.preventDefault(); if (!canPost) return; props.onSubmit({ name, rating, message }); setMessage('') }}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2"><span className="text-sm text-zinc-400">Name</span><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-zinc-500" /></label>
        <div className="grid gap-2"><span className="text-sm text-zinc-400">Rating</span><StarRating value={rating} onChange={(v) => setRating(v)} /></div>
      </div>
      <label className="grid gap-2"><span className="text-sm text-zinc-400">Share your experience</span><textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} placeholder="What did you notice first?" className="resize-none rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-zinc-500" /></label>
      <button type="submit" disabled={!canPost} className="justify-self-end rounded-full bg-white px-5 py-3 text-sm font-semibold text-zinc-950 disabled:opacity-40">Share impression</button>
    </form>
  )
}
