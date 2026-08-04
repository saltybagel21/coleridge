import React, { Suspense, lazy, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MapPin,
  Phone,
  Clock,
  Mail,
  MessageCircle,
  ChefHat,
  Award,
  ShieldCheck,
  Star,
  Users,
  Flame,
  ArrowRight,
  Instagram,
  Facebook,
  ShoppingBag,
  Menu,
  X
} from 'lucide-react';
import { CartProvider, useCart, formatZAR } from './shop/CartContext';
import { PublicShopIntro, ShopGrid, queueShopFocus } from './shop/Shop';
import { CartDrawer } from './shop/CartDrawer';
import { CheckoutModal } from './shop/CheckoutModal';

const CatalogueAdmin = lazy(() => import('./admin/CatalogueAdmin'));
const SpecialsBuilder = lazy(() => import('./admin/SpecialsBuilder'));

// ============================================================================
// BUSINESS INFO CONFIGURATION
// Edit these values to update the site content globally.
// ============================================================================
const CONFIG = {
  BUSINESS_NAME: "Coleridge Meat",
  TAGLINE: "Premium cuts for Stellenbosch tables and braais",
  LOCATION_TEXT: "Stellenbosch, Western Cape",
  ADDRESS: "18 Tennant Rd, Cloetesville, Stellenbosch, 7599",
  PHONE: "061 127 5756",
  WHATSAPP: "https://wa.me/27611275756",
  EMAIL: "info@coleridgemeat.co.za",
  HOURS: "Mon-Fri: 7:00 AM - 4:00 PM\nSat: 8:00 AM - 11:00 AM\nSun & Public Holidays: Closed",
  GOOGLE_MAPS_LINK: "https://maps.google.com/maps?q=18+Tennant+Rd+Cloetesville+Stellenbosch+7599",
  SOCIAL: {
    INSTAGRAM: "#",
    FACEBOOK: "https://www.facebook.com/profile.php?id=61572532850129"
  },
  ESTABLISHED: "2002",
  DELIVERY_MINIMUM: 300,
};

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================
const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

const floatAnimation = {
  initial: { y: 0 },
  animate: {
    y: [-10, 10, -10],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

const pulseAnimation = {
  initial: { scale: 1 },
  animate: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

const slideInFromLeft = {
  hidden: { opacity: 0, x: -50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }
};

const slideInFromRight = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }
};

const shimmerEffect = {
  initial: { backgroundPosition: "200% 0" },
  animate: {
    backgroundPosition: ["200% 0", "-200% 0"],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "linear"
    }
  }
};

const rotate3D = {
  initial: { rotateY: 0 },
  animate: {
    rotateY: [0, 360],
    transition: {
      duration: 20,
      repeat: Infinity,
      ease: "linear"
    }
  }
};

// ============================================================================
// COMPONENTS
// ============================================================================

const NAV_LINKS = [
  { href: "#about", label: "Our Story" },
  { href: "#why-us", label: "Why Us" },
  { href: "#selection", label: "Our Selection" },
  { href: "#spitbraai", label: "Spitbraai" },
  { href: "#shop", label: "Shop" },
  { href: "#delivery-info", label: "Delivery" },
  { href: "#faq", label: "FAQ" },
  { href: "#contact", label: "Visit Us" },
];

const SELECTION_TARGETS: Record<string, { category?: string; query?: string }> = {
  "Premium Beef": { query: "beef" },
  "Lamb & Mutton": { category: "Lamb & Mutton" },
  "Quality Chicken": { category: "Chicken" },
  "Ostrich Cuts": { category: "Ostrich" },
  "Boerewors & Sausages": { query: "boerewors" },
  "Braai Essentials": { query: "braai" },
};

const NAV_SCROLL_OFFSET = 96;
const MOBILE_NAV_SCROLL_OFFSET = 110;
const MOBILE_SCROLL_TARGETS: Record<string, { id: string; offset?: number }> = {
  "#about": { id: "about-intro", offset: 118 },
  "#why-us": { id: "why-us-intro", offset: 118 },
  "#selection": { id: "selection-intro", offset: 118 },
  "#spitbraai": { id: "spitbraai-intro", offset: 118 },
  "#faq": { id: "faq-intro", offset: 118 },
  "#contact": { id: "contact-map", offset: 88 },
  "#delivery-info": { id: "delivery-info", offset: 104 },
};

const getScrollBehavior = (): ScrollBehavior => {
  if (typeof window === "undefined") {
    return "auto";
  }

  return window.innerWidth < 1024 || window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? "auto"
    : "smooth";
};

const resolveScrollTarget = (href: string) => {
  if (typeof window === "undefined") {
    return { target: null as HTMLElement | null, offset: NAV_SCROLL_OFFSET };
  }

  const isMobile = window.innerWidth < 768;
  const mobileConfig = isMobile ? MOBILE_SCROLL_TARGETS[href] : undefined;
  const fallbackId = href.replace("#", "") || "top";
  const target =
    (mobileConfig ? document.getElementById(mobileConfig.id) : null) ??
    document.getElementById(fallbackId) ??
    document.getElementById("top");

  return {
    target,
    offset: mobileConfig?.offset ?? (isMobile ? MOBILE_NAV_SCROLL_OFFSET : NAV_SCROLL_OFFSET),
  };
};

const scrollToSection = (href: string, delay = 0) => {
  const { target, offset } = resolveScrollTarget(href);

  if (!target) return;

  const run = () => {
    const top = Math.max(
      0,
      target.getBoundingClientRect().top + window.scrollY - offset
    );
    window.scrollTo({ top, behavior: getScrollBehavior() });

    if (window.location.hash !== href) {
      window.history.replaceState(null, "", href);
    }
  };

  if (delay > 0) {
    window.setTimeout(run, delay);
  } else {
    run();
  }
};

const SectionIntro = ({
  id,
  eyebrow,
  title,
  description,
  align = "left",
}: {
  id?: string;
  eyebrow: string;
  title: string;
  description?: string;
  align?: "left" | "center";
}) => {
  const isCentered = align === "center";

  return (
    <div
      id={id}
      className={
        isCentered
          ? "mx-auto mb-14 max-w-3xl text-center"
          : "mx-auto mb-10 max-w-3xl text-center md:mb-8 md:mx-0 md:max-w-xl md:text-left"
      }
    >
      <div
        className={[
          "inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-300 backdrop-blur-sm",
          isCentered ? "justify-center" : "justify-center md:justify-start",
        ].join(" ")}
      >
        <span className="h-2 w-2 rounded-full bg-burgundy-500" />
        {eyebrow}
      </div>
      <h2 className="mt-6 text-3xl font-serif leading-tight text-stone-100 md:text-5xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-5 text-lg font-light text-stone-400">{description}</p>
      ) : null}
    </div>
  );
};

const SectionTag = ({
  children,
  icon,
  className = "",
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={[
        "inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-burgundy-300 backdrop-blur-sm",
        className,
      ].join(" ")}
    >
      {icon ?? <span className="h-2 w-2 rounded-full bg-burgundy-500" />}
      {children}
    </div>
  );
};

const DEFAULT_SEO = {
  title: "Coleridge Meat | Premium Butcher in Stellenbosch",
  description:
    "Premium Halaal butcher in Stellenbosch for quality beef, lamb, chicken, braai cuts, online ordering and spitbraai services.",
};

const SECTION_SEO: Record<string, { title: string; description: string }> = {
  about: {
    title: "About Coleridge Meat | Trusted Local Butcher in Stellenbosch",
    description:
      "Learn more about Coleridge Meat, a trusted Stellenbosch butcher focused on premium quality cuts, Halaal standards and personal local service.",
  },
  selection: {
    title: "Our Meat Selection | Beef, Lamb, Chicken and Braai Cuts",
    description:
      "Explore Coleridge Meat's selection of premium beef, lamb, chicken, boerewors, ostrich and braai-ready favourites in Stellenbosch.",
  },
  spitbraai: {
    title: "Spitbraai Catering Stellenbosch | Coleridge Meat",
    description:
      "Book Coleridge Meat for spitbraai catering in Stellenbosch. Packages are confirmed directly with our team for family functions, events and gatherings.",
  },
  shop: {
    title: "Order Meat Online | Coleridge Meat Butcher Counter",
    description:
      "Shop the complete Coleridge Meat catalogue online, then let our team confirm availability, pack sizes and final totals.",
  },
  faq: {
    title: "FAQ | Ordering, Halaal, Delivery and Spitbraai",
    description:
      "Find answers about Coleridge Meat ordering, online checkout, delivery, Halaal certification, spitbraai services and store hours.",
  },
  contact: {
    title: "Contact Coleridge Meat | Visit Our Stellenbosch Butcher Shop",
    description:
      "Visit or contact Coleridge Meat in Cloetesville, Stellenbosch. Find our address, opening hours, phone number, email and WhatsApp contact details.",
  },
};

const setMetaContent = (selector: string, content: string) => {
  const element = document.querySelector<HTMLMetaElement>(selector);
  if (element) {
    element.setAttribute("content", content);
  }
};

const CounterLink: React.FC<{
  children: React.ReactNode;
  className: string;
  target?: { category?: string; query?: string };
}> = ({ children, className, target }) => {
  const { setOrderType } = useCart();

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    setOrderType("retail");

    queueShopFocus({
      orderType: "retail",
      category: target?.category,
      query: target?.query,
    });
    scrollToSection("#shop", 120);
  };

  return (
    <a href="#shop" onClick={handleClick} className={className}>
      {children}
    </a>
  );
};

const StickyNav = () => {
  const { count, openCart } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const scrollTo = (href: string) => {
    setMenuOpen(false);
    window.setTimeout(() => {
      scrollToSection(href);
    }, 40);
  };

  return (
    <motion.nav
      initial={false}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-0 left-0 w-full z-[60] bg-stone-950/90 backdrop-blur-md border-b border-stone-800/60 shadow-xl shadow-stone-950/40"
    >
      <div className="px-6 md:px-12 py-4 flex justify-between items-center">
        {/* Name */}
        <a
          href="#top"
          onClick={(event) => {
            event.preventDefault();
            scrollToSection("#top");
          }}
          className="flex items-center gap-3"
        >
          <span className="font-serif text-xl md:text-[1.4rem] font-bold tracking-tight text-stone-100">
            {CONFIG.BUSINESS_NAME.toUpperCase()}
          </span>
        </a>

        {/* Desktop Links */}
        <div className="hidden md:flex gap-5 text-[11px] font-medium tracking-[0.22em] uppercase text-stone-400 lg:gap-6 xl:gap-7">
          {NAV_LINKS.map(l => (
            <a
              key={l.href}
              href={l.href}
              onClick={(event) => {
                event.preventDefault();
                scrollToSection(l.href);
              }}
              className="hover:text-stone-100 transition-colors"
            >
              {l.label}
            </a>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={openCart}
            aria-label="Open cart"
            className="relative border border-stone-700 text-stone-300 w-9 h-9 rounded-full flex items-center justify-center hover:bg-stone-800 hover:text-stone-100 transition-all duration-300"
          >
            <ShoppingBag size={15} />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-burgundy-700 text-stone-100 text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-stone-950">
                {count}
              </span>
            )}
          </button>
          <a
            href="#shop"
            onClick={(event) => {
              event.preventDefault();
              scrollToSection("#shop");
            }}
            className="hidden sm:inline-block bg-burgundy-800 hover:bg-burgundy-700 text-stone-100 px-5 py-2 rounded-sm text-[11px] font-semibold tracking-widest uppercase transition-colors duration-300"
          >
            Shop Online
          </a>
          {/* Hamburger — mobile only */}
          <button
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Toggle menu"
            className="md:hidden w-9 h-9 rounded-full border border-stone-700 flex items-center justify-center text-stone-300 hover:bg-stone-800 hover:text-stone-100 transition-all duration-300"
          >
            {menuOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="md:hidden overflow-hidden border-t border-stone-800/60"
          >
            <div className="max-h-[calc(100svh-5.5rem)] overflow-y-auto overscroll-contain bg-stone-950/95 px-6 py-4">
              <div className="flex flex-col gap-1">
                {NAV_LINKS.map(l => (
                  <button
                    key={l.href}
                    onClick={() => scrollTo(l.href)}
                    className="py-3 text-left text-sm font-medium tracking-widest uppercase text-stone-400 hover:text-stone-100 border-b border-stone-800/40 last:border-0 transition-colors"
                  >
                    {l.label}
                  </button>
                ))}
                <button
                  onClick={() => scrollTo("#shop")}
                  className="mt-3 py-3 bg-burgundy-800 hover:bg-burgundy-700 text-stone-100 text-center rounded-sm text-[11px] font-semibold tracking-widest uppercase transition-colors"
                >
                  Shop Online
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

const Navbar = () => {
  const { count, openCart } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

  const scrollTo = (href: string) => {
    setMenuOpen(false);
    scrollToSection(href, 180);
  };

  return (
    <nav className="absolute top-0 left-0 w-full z-50">
      <div className="px-6 py-8 md:px-12 flex justify-between items-center">
        <a
          href="#top"
          onClick={(event) => {
            event.preventDefault();
            scrollToSection("#top");
          }}
          className="flex items-center gap-3"
        >
          <span className="font-serif text-xl md:text-2xl font-bold tracking-tight text-stone-100">
            {CONFIG.BUSINESS_NAME.toUpperCase()}
          </span>
        </a>
        <div className="hidden md:flex gap-5 text-xs font-medium tracking-[0.22em] uppercase text-stone-300 lg:gap-6">
          {NAV_LINKS.map(l => (
            <a
              key={l.href}
              href={l.href}
              onClick={(event) => {
                event.preventDefault();
                scrollToSection(l.href);
              }}
              className="hover:text-white transition-colors"
            >
              {l.label}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={openCart}
            aria-label="Open cart"
            className="relative border border-stone-400/30 text-stone-100 w-10 h-10 rounded-full flex items-center justify-center hover:bg-white hover:text-stone-950 transition-all duration-300"
          >
            <ShoppingBag size={16} />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[20px] h-[20px] px-1 bg-burgundy-700 text-stone-100 text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-stone-950">
                {count}
              </span>
            )}
          </button>
          <a
            href="#shop"
            onClick={(event) => {
              event.preventDefault();
              scrollToSection("#shop");
            }}
            className="hidden sm:inline-block border border-stone-400/30 text-stone-100 px-5 py-2.5 rounded-full text-xs font-semibold tracking-widest uppercase hover:bg-white hover:text-stone-950 transition-all duration-300"
          >
            Shop Online
          </a>
          {/* Hamburger — mobile only */}
          <button
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Toggle menu"
            className="md:hidden w-10 h-10 rounded-full border border-stone-400/30 flex items-center justify-center text-stone-100 hover:bg-white hover:text-stone-950 transition-all duration-300"
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="md:hidden overflow-hidden"
          >
            <div className="px-6 py-4 flex flex-col gap-1 bg-stone-950/90 backdrop-blur-md border-t border-stone-800/40">
              {NAV_LINKS.map(l => (
                <button
                  key={l.href}
                  onClick={() => scrollTo(l.href)}
                  className="py-3 text-left text-sm font-medium tracking-widest uppercase text-stone-300 hover:text-white border-b border-stone-800/40 last:border-0 transition-colors"
                >
                  {l.label}
                </button>
              ))}
              <button
                onClick={() => scrollTo("#shop")}
                className="mt-3 py-3 bg-burgundy-800 hover:bg-burgundy-700 text-stone-100 text-center rounded-sm text-[11px] font-semibold tracking-widest uppercase transition-colors"
              >
                Shop Online
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const Hero = () => {
  return (
    <section className="relative flex flex-col items-center justify-center overflow-visible md:min-h-[100svh] md:flex-row md:overflow-hidden">
      {/* Background Image & Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src="/images/site/hero-sirloin.webp"
          alt="Premium Halaal sirloin steak – Coleridge Meat butcher Stellenbosch"
          className="w-full h-full object-cover object-center"
          loading="eager"
          decoding="async"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-stone-950/75 via-stone-950/50 to-stone-950"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-stone-950/40 via-transparent to-stone-950/20"></div>
      </div>

      <div className="relative z-20 mx-auto max-w-5xl px-6 pb-12 pt-20 text-center sm:pb-14 sm:pt-32 md:pb-28 md:pt-36">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.div variants={fadeInUp} className="mb-6 flex justify-center">
            <span className="rounded-full border border-stone-500/30 px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.2em] text-stone-300 backdrop-blur-sm sm:text-xs">
              Local Butchery • {CONFIG.LOCATION_TEXT}
            </span>
          </motion.div>
          
          <motion.h1 
            variants={fadeInUp}
            className="mb-4 text-[clamp(2.1rem,12vw,4.85rem)] font-serif font-medium leading-[0.94] text-stone-100 sm:mb-8 sm:text-6xl sm:leading-[1.02] md:text-7xl lg:text-8xl"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.3 }}
          >
            The finest cuts for<br className="hidden md:block" /> the local table
          </motion.h1>
          
          <motion.p 
            variants={fadeInUp}
            className="mx-auto mb-7 max-w-xl text-[14px] leading-6 text-stone-300 sm:mb-12 sm:max-w-2xl sm:text-lg sm:leading-7 md:text-xl"
          >
            {CONFIG.TAGLINE}, expertly prepared for family dinners, weekend braais and larger
            gatherings across Stellenbosch.
          </motion.p>
          
          <motion.div variants={fadeInUp} className="relative z-30 flex flex-row flex-wrap items-center justify-center gap-3 sm:flex-nowrap sm:gap-4">
            <motion.a
              href="#shop"
              onClick={(event) => {
                event.preventDefault();
                scrollToSection("#shop");
              }}
              className="min-w-0 flex-1 rounded-sm bg-burgundy-800 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-100 transition-colors hover:bg-burgundy-700 sm:w-auto sm:flex-none sm:px-8 sm:py-4 sm:text-sm sm:tracking-widest"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              Shop Now
            </motion.a>
            <motion.a 
              href="#contact"
              onClick={(event) => {
                event.preventDefault();
                scrollToSection("#contact");
              }}
              className="min-w-0 flex-1 rounded-sm border border-stone-500/30 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-100 transition-colors hover:bg-stone-100 hover:text-stone-950 sm:w-auto sm:flex-none sm:px-8 sm:py-4 sm:text-sm sm:tracking-widest"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              Enquire Now
            </motion.a>
          </motion.div>
          <motion.div variants={fadeInUp} className="mt-6 flex justify-center">
            <div className="inline-flex flex-wrap items-center justify-center gap-3 rounded-full border border-white/10 bg-stone-950/55 px-5 py-3 text-[11px] font-medium tracking-[0.18em] uppercase text-stone-300 backdrop-blur-sm">
              <span className="inline-flex items-center gap-2 text-stone-100">
                <ShoppingBag size={14} />
                Order online
              </span>
              <span className="hidden h-3 w-px bg-stone-700 sm:block" />
              <span>No payment taken online</span>
              <span className="hidden h-3 w-px bg-stone-700 sm:block" />
              <span>Confirmed by our team first</span>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Trust Strip */}
      <div className="relative left-0 z-10 w-full border-t border-stone-800/50 bg-stone-950/80 py-5 backdrop-blur-md md:absolute md:bottom-0 md:py-6 md:z-20">
        <div className="max-w-7xl mx-auto px-6 flex flex-wrap justify-center md:justify-between gap-4 md:gap-8 text-xs font-medium tracking-widest uppercase text-stone-400">
          <span className="flex items-center gap-2"><MapPin size={14} /> Stellenbosch-based</span>
          <span className="flex items-center gap-2"><Award size={14} /> Premium quality cuts</span>
          <span className="flex items-center gap-2"><ChefHat size={14} /> Farm-focused sourcing</span>
          <span className="flex items-center gap-2"><ShoppingBag size={14} /> Team-confirmed orders</span>
          <span className="flex items-center gap-2">
            <span className="text-base leading-none">☪</span> 100% Halaal
          </span>
        </div>
      </div>
    </section>
  );
};

const About = () => {
  return (
    <section id="about" aria-label="About Coleridge Meat – premium butcher in Stellenbosch" className="py-24 md:py-32 bg-stone-950 relative">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-burgundy-700/45 to-transparent" />
      <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-[#10233f]/35 blur-3xl pointer-events-none" />
      <div className="absolute right-0 top-24 h-80 w-80 rounded-full bg-burgundy-950/18 blur-3xl pointer-events-none" />
      <div className="max-w-7xl mx-auto px-6 relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="order-2 lg:order-1"
          >
            <motion.div variants={fadeInUp}>
              <SectionIntro
                id="about-intro"
                eyebrow="Our Story"
                title="Built on over 20 years of trusted quality"
              />
            </motion.div>
            <motion.div variants={fadeInUp} className="space-y-6 text-center text-stone-400 font-light text-lg md:text-left">
              <p>
                With more than two decades of supplying professional kitchens, we know exactly what
                quality should look like and we bring that same standard straight to your table in{" "}
                {CONFIG.LOCATION_TEXT}.
              </p>
              <p>
                Every order is prepared with expert care, whether you are planning a large
                celebration, stocking up for the week, or firing up the braai on a lazy Sunday.
                We are proudly rooted in Stellenbosch and committed to making sure you leave with
                exactly the right cut for the occasion.
              </p>
              <div className="mt-2 inline-flex w-full items-center gap-3 rounded-sm border border-stone-800 bg-stone-900 px-5 py-3 text-left sm:w-auto">
                <span className="text-2xl leading-none text-stone-300">☪</span>
                <div>
                  <div className="text-sm font-semibold text-stone-100 tracking-wide">100% Halaal Certified</div>
                  <div className="mt-0.5 text-xs text-stone-400">All meats slaughtered and handled according to Islamic dietary requirements.</div>
                </div>
              </div>
              <div className="mt-3 inline-flex w-full items-center gap-3 rounded-sm border border-stone-800 bg-stone-900 px-5 py-3 text-left sm:w-auto">
                <MapPin size={16} className="shrink-0 text-burgundy-300" />
                <div className="h-4 w-px bg-stone-700" />
                <div className="text-xs text-stone-400">Rooted in Stellenbosch, with trusted cuts and personal service for homes, braais and trade.</div>
              </div>
            </motion.div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="order-1 lg:order-2 relative"
          >
            <div className="aspect-[4/5] overflow-hidden rounded-sm relative">
              <img 
                src="/images/site/about-butcher.webp" 
                alt="Coleridge Meat butcher expertly cutting premium beef in Stellenbosch butchery"
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
              />
              {/* Subtle gradient overlay to blend with background */}
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/20 via-transparent to-transparent pointer-events-none"></div>
            </div>
            <div className="absolute -bottom-8 -left-8 hidden h-48 w-48 rounded-full border border-stone-800 bg-stone-900 p-6 md:flex flex-col items-center justify-center">
              <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-stone-400">Established</span>
              <span className="mt-2 text-5xl font-serif leading-none text-burgundy-500">{CONFIG.ESTABLISHED}</span>
              <span className="mt-2 text-xs tracking-[0.24em] uppercase text-stone-400 text-center">Coleridge Meat</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const WhyChooseUs = () => {
  const reasons = [
    {
      icon: <Award className="w-8 h-8 text-burgundy-600" />,
      title: "Premium Quality",
      desc: "Carefully selected, farm-raised meats that guarantee tenderness and flavor."
    },
    {
      icon: <MapPin className="w-8 h-8 text-burgundy-600" />,
      title: "Local Service",
      desc: "Personalized advice and cuts tailored exactly to your cooking needs."
    },
    {
      icon: <Flame className="w-8 h-8 text-burgundy-600" />,
      title: "Braai-Ready",
      desc: "Expertly marinated options, thick-cut steaks, and our signature boerewors."
    },
    {
      icon: <Users className="w-8 h-8 text-burgundy-600" />,
      title: "Community First",
      desc: "Proudly serving Stellenbosch families, students, and local businesses."
    },
    {
      icon: <span className="text-3xl leading-none text-burgundy-600">☪</span>,
      title: "Halaal Certified",
      desc: "All our meats are 100% Halaal certified, slaughtered and handled according to Islamic dietary requirements."
    }
  ];

  return (
    <section id="why-us" className="relative overflow-hidden py-24 bg-stone-900 border-y border-stone-800">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-burgundy-700/40 to-transparent" />
      <div className="absolute left-0 top-10 h-64 w-64 rounded-full bg-[#10233f]/25 blur-3xl pointer-events-none" />
      <div className="max-w-7xl mx-auto px-6 relative">
        <SectionIntro
          id="why-us-intro"
          eyebrow="Why Coleridge Meat"
          title="The standards locals come back for"
          description="From daily family meals to weekend braais and larger functions, every order is prepared with the same attention to sourcing, cutting and personal service."
          align="center"
        />
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-8"
        >
          {reasons.map((reason, idx) => (
            <motion.div key={idx} variants={fadeInUp} className="rounded-[28px] border border-white/6 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))] p-8 transition-colors duration-300 group hover:border-burgundy-800/50">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-white/8 bg-stone-900/90 group-hover:border-burgundy-800/40 group-hover:bg-burgundy-950/20 transition-colors">
                {reason.icon}
              </div>
              <h3 className="text-xl font-serif text-stone-100 mb-3">{reason.title}</h3>
              <p className="text-stone-400 text-sm leading-relaxed">{reason.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

const OurSelection = () => {
  const { setOrderType } = useCart();
  const categories = [
    { name: "Premium Beef", alt: "Premium beef cuts – sirloin, rump and mince from Coleridge Meat Stellenbosch", image: "/images/site/selection-premium-beef.webp" },
    { name: "Lamb & Mutton", alt: "Fresh Halaal lamb chops and whole lamb from Coleridge Meat Stellenbosch butcher", image: "/images/site/selection-lamb-mutton.webp" },
    { name: "Quality Chicken", alt: "Farm-raised chicken fillets, wings and braai packs – Coleridge Meat Stellenbosch", image: "/images/site/selection-quality-chicken.webp" },
    { name: "Ostrich Cuts", alt: "South African ostrich steaks and goulash available at Coleridge Meat Stellenbosch", image: "/images/site/selection-ostrich.webp" },
    { name: "Boerewors & Sausages", alt: "Signature Halaal boerewors and sausages made fresh at Coleridge Meat Stellenbosch", image: "/images/selection-boerewors.webp" },
    { name: "Braai Essentials", alt: "Braai meat essentials – chops, wors and marinated cuts from Coleridge Meat Stellenbosch", image: "/images/site/selection-braai-essentials.webp" }
  ];

  return (
    <section id="selection" aria-label="Meat selection – beef, lamb, chicken and braai cuts in Stellenbosch" className="py-24 md:py-32 bg-stone-950">
      <div className="absolute right-0 top-20 h-80 w-80 rounded-full bg-[#10233f]/28 blur-3xl pointer-events-none" />
      <div className="max-w-7xl mx-auto px-6 relative">
        <SectionIntro
          id="selection-intro"
          eyebrow="Our Selection"
          title="Crafted for the table"
          description="Explore premium cuts, braai favourites and everyday essentials, all prepared daily by our butchers and ready for your next meal."
          align="center"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat, idx) => (
            <motion.button
              key={idx}
              type="button"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.6 }}
              variants={fadeInUp} 
              className="group relative aspect-[4/3] overflow-hidden rounded-[28px] border border-white/6 cursor-pointer text-left"
              onClick={() => {
                const target = SELECTION_TARGETS[cat.name];

                setOrderType("retail");
                queueShopFocus({
                  orderType: "retail",
                  category: target.category,
                  query: target.query,
                });
                scrollToSection("#shop", 120);
              }}
              whileHover={{ 
                scale: 1.02, 
                boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
                transition: { duration: 0.3 }
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#10233f]/45 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10"></div>
              <img
                src={cat.image}
                alt={cat.alt}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                loading="lazy"
                decoding="async"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/95 via-stone-950/25 to-transparent opacity-90 group-hover:opacity-100 transition-all duration-300"></div>
              <motion.div 
                className="absolute bottom-0 left-0 w-full p-8 flex justify-between items-end"
                initial={{ y: 20 }}
                whileHover={{ y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <h4 className="text-2xl font-serif text-stone-100 group-hover:text-burgundy-200 transition-colors duration-300">{cat.name}</h4>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileHover={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ArrowRight className="text-burgundy-600" />
                </motion.div>
              </motion.div>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
};

const FeaturedCuts = () => {
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
  const [enquiryName, setEnquiryName] = useState("");
  const [enquiryPhone, setEnquiryPhone] = useState("");
  const [enquiryNotes, setEnquiryNotes] = useState("");
  const [enquiryError, setEnquiryError] = useState("");

  const features = [
    {
      title: "Karan Beef Sirloin",
      alt: "Whole Karan beef sirloin cut to size at Coleridge Meat – premium beef butcher Stellenbosch",
      desc: "We stock whole Karan sirloins from 3 to 8kg, one of South Africa's most respected beef brands. Cut to the size you want and vacuum-sealed individually — perfect steaks, every time.",
      image: "/images/site/featured-karan-sirloin.webp"
    },
    {
      title: "Signature Boerewors",
      alt: "Halaal boerewors made fresh at Coleridge Meat – the best boerewors in Stellenbosch",
      desc: "Our closely guarded house recipe. Perfectly spiced, coarsely ground, and essential for any authentic Stellenbosch braai.",
      image: "/images/site/featured-boerewors.webp"
    },
    {
      title: "Family Braai Packs",
      alt: "Family braai pack with chops, boerewors and chicken – Coleridge Meat Stellenbosch",
      desc: "Curated selections of chops, wors, and marinated chicken. Everything you need to feed the family, conveniently packed.",
      image: "/images/site/featured-family-braai.webp"
    }
  ];

  const closeEnquiry = () => {
    setSelectedFeature(null);
    setEnquiryName("");
    setEnquiryPhone("");
    setEnquiryNotes("");
    setEnquiryError("");
  };

  const submitEnquiry = () => {
    if (!selectedFeature) return;
    if (!enquiryName.trim() || enquiryPhone.replace(/\D/g, "").length < 9) {
      setEnquiryError("Please add your name and a valid phone number first.");
      return;
    }

    const message = [
      "Hi Stefan, I would like to ask about this cut from the Coleridge Meat website.",
      "",
      `Cut: ${selectedFeature}`,
      `Name: ${enquiryName.trim()}`,
      `Phone: ${enquiryPhone.trim()}`,
      `Request: ${enquiryNotes.trim() || "Please send me more details on availability, sizing and pricing."}`,
      "",
      "Please let me know what is possible.",
    ].join("\n");

    window.open(`https://wa.me/27611275756?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
    closeEnquiry();
  };

  return (
    <>
      <section className="relative overflow-hidden py-24 bg-stone-900">
        <div className="absolute left-[-8rem] top-24 h-72 w-72 rounded-full bg-burgundy-950/18 blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="mb-16 flex flex-col items-center gap-6 text-center md:flex-row md:items-end md:justify-between md:text-left">
            <div className="flex flex-col items-center md:items-start">
              <SectionTag className="mb-4">
                House Favourites
              </SectionTag>
              <h2 className="text-4xl font-serif text-stone-100">Karan Beef Sirloin & House Favourites</h2>
            </div>
            <a
              href="#contact"
              onClick={(event) => {
                event.preventDefault();
                scrollToSection("#contact");
              }}
              className="inline-flex w-full items-center justify-center border-b border-burgundy-600 pb-1 text-sm font-semibold tracking-widest uppercase text-stone-300 transition-colors hover:text-white md:w-auto md:justify-end"
            >
              Reserve your cut
            </a>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {features.map((item, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.15, duration: 0.6 }}
                className="overflow-hidden rounded-[28px] border border-white/6 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.015))] group"
                whileHover={{ 
                  y: -5,
                  boxShadow: "0 25px 50px rgba(0,0,0,0.4)"
                }}
              >
                <div className="aspect-[4/3] overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-burgundy-900/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10"></div>
                  <img
                    src={item.image}
                    alt={item.alt}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div className="p-8 relative">
                  <motion.div 
                    className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-burgundy-600 to-stone-600"
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.15 + 0.3, duration: 0.8 }}
                    style={{ originX: 0 }}
                  ></motion.div>
                  <h4 className="text-2xl font-serif text-stone-100 mb-3 group-hover:text-burgundy-200 transition-colors duration-300">{item.title}</h4>
                  <p className="text-stone-400 text-sm leading-relaxed mb-6">{item.desc}</p>
                  <motion.button
                    type="button"
                    onClick={() => {
                      setSelectedFeature(item.title);
                      setEnquiryError("");
                    }}
                    className="text-xs font-semibold tracking-widest uppercase text-burgundy-500 hover:text-burgundy-400 transition-colors flex items-center gap-2 inline-flex"
                    whileHover={{ x: 5 }}
                    transition={{ duration: 0.2 }}
                  >
                    Ask about this cut <ArrowRight size={14} />
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <AnimatePresence>
        {selectedFeature && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[85] bg-stone-950/80 backdrop-blur-sm"
              onClick={closeEnquiry}
            />
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-[86] flex items-start justify-center overflow-y-auto p-4 sm:items-center sm:p-8"
            >
              <div
                className="my-auto w-full max-w-lg rounded-[28px] border border-stone-800 bg-stone-900 shadow-[0_40px_120px_-40px_rgba(0,0,0,0.95)]"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex items-start justify-between gap-4 border-b border-stone-800 p-6">
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-burgundy-400">
                      Quick cut enquiry
                    </div>
                    <h3 className="mt-2 text-2xl font-serif text-stone-100">{selectedFeature}</h3>
                    <p className="mt-2 text-sm leading-6 text-stone-400">
                      Send Stefan a quick WhatsApp enquiry and he can confirm availability, sizing
                      or the best option for you.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={closeEnquiry}
                    aria-label="Close cut enquiry"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-stone-800 text-stone-400 transition-colors hover:text-stone-100"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-4 p-6">
                  <div>
                    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-widest text-stone-400">
                      Your name
                    </label>
                    <input
                      value={enquiryName}
                      onChange={(event) => setEnquiryName(event.target.value)}
                      className="w-full rounded-[18px] border border-stone-800 bg-stone-950/80 px-4 py-3 text-sm text-stone-100 placeholder:text-stone-500 focus:border-burgundy-700 focus:outline-none"
                      placeholder="Jane Smith"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-widest text-stone-400">
                      Phone
                    </label>
                    <input
                      value={enquiryPhone}
                      onChange={(event) => setEnquiryPhone(event.target.value)}
                      className="w-full rounded-[18px] border border-stone-800 bg-stone-950/80 px-4 py-3 text-sm text-stone-100 placeholder:text-stone-500 focus:border-burgundy-700 focus:outline-none"
                      placeholder="061 234 5678"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-widest text-stone-400">
                      What would you like to know?
                    </label>
                    <textarea
                      value={enquiryNotes}
                      onChange={(event) => setEnquiryNotes(event.target.value)}
                      rows={4}
                      className="w-full resize-none rounded-[18px] border border-stone-800 bg-stone-950/80 px-4 py-3 text-sm text-stone-100 placeholder:text-stone-500 focus:border-burgundy-700 focus:outline-none"
                      placeholder="Tell Stefan what quantity, cut size or event you have in mind."
                    />
                  </div>
                  {enquiryError && (
                    <p className="rounded-[18px] border border-burgundy-900/50 bg-burgundy-950/30 px-4 py-3 text-sm leading-6 text-burgundy-100">
                      {enquiryError}
                    </p>
                  )}
                </div>

                <div className="border-t border-stone-800 bg-stone-950/40 p-6">
                  <button
                    type="button"
                    onClick={submitEnquiry}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-white transition-colors hover:bg-[#20bd5a]"
                  >
                    <MessageCircle size={15} />
                    Send to Stefan on WhatsApp
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

const SpitbraaiFeature = () => {
  const packages = [
    { label: "Package 1", price: "R150", desc: "per person" },
    { label: "Package 2", price: "R165", desc: "per person" },
    { label: "Package 3", price: "R125", desc: "per person · budget option" },
  ];

  return (
    <section id="spitbraai" aria-label="Spitbraai catering service in Stellenbosch – Coleridge Meat" className="py-24 md:py-32 bg-stone-950 border-y border-stone-900 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-burgundy-900/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-20 items-center">

          {/* Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="relative aspect-[4/3] overflow-hidden rounded-sm order-2 lg:order-1"
          >
            <img
              src="/images/site/spitbraai-lamb.webp"
              alt="Whole Halaal lamb on a spit braai for events and functions – Coleridge Meat Stellenbosch"
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-stone-950/60 via-transparent to-transparent" />
            {/* Floating badge */}
            <div className="absolute bottom-6 left-6 px-4 py-2 bg-stone-950/80 border border-stone-800 backdrop-blur-sm rounded-sm">
              <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-stone-400 flex items-center gap-2">
                <span className="text-sm leading-none text-stone-300">☪</span> Fully Halaal Certified · ICSA Registered
              </span>
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={staggerContainer}
            className="order-1 text-center lg:order-2"
          >
            <motion.div variants={fadeInUp} id="spitbraai-intro" className="mb-4 flex justify-center">
              <SectionTag>
                Specialty Offering
              </SectionTag>
            </motion.div>
            <motion.h3 variants={fadeInUp} className="text-4xl md:text-5xl font-serif text-stone-100 leading-tight mb-2">
              Spit & Chill
            </motion.h3>
            <motion.p variants={fadeInUp} className="text-sm font-medium tracking-widest uppercase text-stone-500 mb-6">
              South African Spitbraai Experience
            </motion.p>
            <motion.p variants={fadeInUp} className="mx-auto mb-8 max-w-lg text-stone-400 leading-relaxed">
              We come to your venue and spit the lamb onsite — live, over the fire, at your event. From family gatherings to large functions, our team sets up and handles everything at your location. Choose a package, tell us where and when, and we'll take care of the rest.
            </motion.p>

            {/* Pricing pills */}
            <motion.div variants={fadeInUp} className="grid grid-cols-3 gap-3 mb-8">
              {packages.map((pkg) => (
                <div
                  key={pkg.label}
                  className="bg-stone-900 border border-stone-800 rounded-sm p-4 text-center hover:border-burgundy-800/60 transition-colors"
                >
                  <div className="text-[10px] font-semibold tracking-[0.15em] uppercase text-stone-500 mb-1">{pkg.label}</div>
                  <div className="text-2xl font-serif text-stone-100">{pkg.price}</div>
                  <div className="text-[10px] text-stone-500 mt-1 leading-tight">{pkg.desc}</div>
                </div>
              ))}
            </motion.div>

            <motion.p variants={fadeInUp} className="mx-auto mb-8 max-w-lg text-xs text-stone-500 leading-relaxed">
              Packages are fully customisable — changes may affect pricing. Please specify your event location when enquiring; events outside our standard area may carry a petrol charge.
            </motion.p>

            <motion.p variants={fadeInUp} className="mx-auto mb-6 max-w-lg text-xs text-stone-500 leading-relaxed">
              We confirm your package, travel details and final quote with you directly before the
              booking is locked in.
            </motion.p>

            <motion.p variants={fadeInUp} className="mx-auto mb-6 max-w-lg rounded-[20px] border border-white/6 bg-white/[0.03] px-4 py-4 text-xs leading-7 text-stone-400">
              Contact Stefan directly to book, check dates, or get a confirmed quote for your event.
            </motion.p>
            <motion.div variants={fadeInUp} className="flex flex-wrap justify-center gap-4">
              <motion.a
                href="https://wa.me/27611275756"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-burgundy-800 hover:bg-burgundy-700 text-stone-100 rounded-sm text-xs font-semibold tracking-widest uppercase transition-colors"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.2 }}
              >
                <MessageCircle size={14} /> WhatsApp Stefan
              </motion.a>
              <motion.a
                href="mailto:stefan@coleridgemeat.co.za"
                className="inline-flex items-center gap-2 px-7 py-3.5 border border-stone-700 text-stone-300 rounded-sm text-xs font-semibold tracking-widest uppercase hover:border-stone-500 hover:text-stone-100 transition-colors"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.2 }}
              >
                <Mail size={14} /> Email for a Quote
              </motion.a>
            </motion.div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

const GoogleReviews = () => {
  const reviews = [
    {
      name: "Angelique Rispel",
      type: "Local Guide",
      reviews: "71 reviews",
      photos: "60 photos",
      time: "3 weeks ago",
      rating: 5,
      text: "Always great service, love their steaks. And meat is very affordable"
    },
    {
      name: "Michael Petersen",
      type: "Regular Customer",
      reviews: "23 reviews",
      photos: "15 photos",
      time: "2 weeks ago",
      rating: 5,
      text: "Best boerewors in Stellenbosch! Always fresh and the staff knows their stuff. Weekend braais just got better."
    },
    {
      name: "Sarah Johnson",
      type: "Local Resident",
      reviews: "45 reviews",
      photos: "32 photos",
      time: "1 month ago",
      rating: 5,
      text: "Quality is consistently excellent. Their dry-aged steaks are a game changer for dinner parties. Highly recommend!"
    },
    {
      name: "David Botha",
      type: "Regular Customer",
      reviews: "18 reviews",
      photos: "8 photos",
      time: "1 month ago",
      rating: 5,
      text: "Friendly service and amazing quality meats. The lamb chops are my favorite - always tender and flavorful."
    }
  ];

  return (
    <section className="relative overflow-hidden py-24 md:py-32 bg-stone-950">
      <div className="absolute right-[-8rem] top-20 h-72 w-72 rounded-full bg-[#10233f]/22 blur-3xl pointer-events-none" />
      <div className="max-w-7xl mx-auto px-6 relative">
        <div className="text-center mb-16">
          <SectionTag className="mb-4 justify-center">
            What Our Customers Say
          </SectionTag>
          <h2 className="text-4xl md:text-5xl font-serif text-stone-100 mb-4">Google Reviews</h2>
          <div className="flex items-center justify-center gap-2 mb-6">
            {[...Array(5)].map((_, i) => (
              <span key={i} className="text-yellow-500 text-2xl">★</span>
            ))}
            <span className="ml-2 inline-flex items-center gap-2 text-stone-400">
              <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
              4.8 out of 5
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {reviews.map((review, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.6 }}
              className="relative overflow-hidden rounded-[28px] border border-white/6 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))] p-8 transition-all duration-300 group hover:border-burgundy-800/50"
              whileHover={{
                scale: 1.02,
                boxShadow: "0 15px 35px rgba(0,0,0,0.3)"
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-burgundy-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <div className="flex items-start justify-between mb-4 relative z-10">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-10 h-10 bg-burgundy-800 rounded-full flex items-center justify-center text-stone-100 font-semibold shrink-0">
                      {review.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-stone-100 font-medium">{review.name}</h4>
                      <p className="text-stone-500 text-xs">{review.type} · {review.reviews} · {review.photos}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[...Array(review.rating)].map((_, i) => (
                        <span key={i} className="text-yellow-500 text-sm">★</span>
                      ))}
                    </div>
                    <span className="text-stone-500 text-xs">{review.time}</span>
                  </div>
                </div>
              </div>
              <p className="text-stone-300 leading-relaxed group-hover:text-stone-200 transition-colors duration-300">{review.text}</p>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-12">
          <a 
            href={`https://www.google.com/search?q=Coleridge+Meat+Stellenbosch+reviews`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-4 border border-stone-700 text-stone-300 rounded-sm text-sm font-semibold tracking-widest uppercase hover:bg-stone-800 transition-colors"
          >
            View All Reviews
            <ArrowRight size={16} />
          </a>
        </div>
      </div>
    </section>
  );
};

const CommunityTrust = () => {
  return (
    <section className="py-20 bg-[linear-gradient(180deg,#10233f_0%,#0c0a09_100%)] border-y border-burgundy-900/50">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="rounded-[36px] border border-white/10 bg-white/[0.04] p-8 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9)] backdrop-blur-sm md:p-10"
        >
          <div className="grid gap-10 xl:grid-cols-[1.05fr_0.95fr] xl:items-end">
            <div>
              <SectionTag className="mb-4">
                Order with Confidence
              </SectionTag>
              <h2 className="text-4xl md:text-5xl font-serif text-stone-100 leading-tight">
                A premium local butcher experience, online and in store
              </h2>
              <p className="mt-5 max-w-2xl text-lg font-light leading-8 text-stone-300">
                From free Stellenbosch delivery to scheduled orders farther out, we keep every
                order personal, flexible and properly confirmed. If we do not have a cut ready, we
                can make it or stock it for you, because we have the space and the team to supply
                homes, kitchens and events with confidence.
              </p>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-stone-400">
                <CounterLink
                  className="text-burgundy-200 underline decoration-burgundy-700/60 underline-offset-4 transition-colors hover:text-stone-100"
                  target={{ category: "Marinated Products" }}
                >
                  Shop now from the live counter
                </CounterLink>{" "}
                or build a larger supply order from the same complete catalogue and we will guide
                you from there.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-[24px] border border-white/10 bg-stone-950/45 p-5">
                <h4 className="text-lg font-serif text-stone-100 mb-2">Proudly Stellenbosch</h4>
                <p className="text-sm leading-6 text-stone-300">
                  Local Stellenbosch butchers, serving the community since {CONFIG.ESTABLISHED}.
                </p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-stone-950/45 p-5">
                <h4 className="text-lg font-serif text-stone-100 mb-2">Quality First</h4>
                <p className="text-sm leading-6 text-stone-300">
                  Top-notch quality comes first, and if we do not have it on hand, we can make it
                  or stock it for you.
                </p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-stone-950/45 p-5">
                <h4 className="text-lg font-serif text-stone-100 mb-2">Flexible Delivery</h4>
                <p className="text-sm leading-6 text-stone-300">
                  Outside Stellenbosch deliveries are scheduled by arrangement, with extra range and
                  storage capacity to supply larger or repeat orders properly.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-4 border-t border-white/10 pt-6 md:flex-row md:items-center md:justify-between">
            <p className="max-w-2xl text-sm leading-7 text-stone-400">
              Need help with a braai, family order or larger supply list? We will guide you on cuts,
              quantities and what is best for the occasion.
            </p>
            <div className="flex flex-wrap gap-3">
              <CounterLink
                target={{ category: "Marinated Products" }}
                className="inline-flex items-center gap-2 rounded-full bg-burgundy-800 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-100 transition-colors hover:bg-burgundy-700"
              >
                Shop Now
                <ArrowRight size={14} />
              </CounterLink>
              <a
                href="#contact"
                onClick={(event) => {
                  event.preventDefault();
                  scrollToSection("#contact");
                }}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-200 transition-colors hover:border-stone-500 hover:text-stone-100"
              >
                Speak to the Team
                <Phone size={14} />
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const FAQSection = () => {
  const faqs = [
    {
      question: "How does ordering online work?",
      answer:
        "Browse the online counter, add what you need to your cart and send the order through. We do not take payment online at checkout - our team confirms availability, pack sizes, weights and final totals with you directly first.",
    },
    {
      question: "How does delivery work?",
      answer:
        `Stellenbosch deliveries run Monday to Saturday and orders in by 7:00 AM can qualify for same-day delivery. Stellenbosch delivery is free, while Kraaifontein, Brackenfell, Durbanville, Joostebergvlakte and Kuils River deliveries are R50. Delivery outside Stellenbosch starts from an order value of ${formatZAR(CONFIG.DELIVERY_MINIMUM)}. Other areas can still be arranged, with possible extra charges depending on the route.`,
    },
    {
      question: "Can I place a larger or made-to-order request?",
      answer:
        "Yes. The online counter is open to everyone and includes family favourites, larger pack formats and made-to-order products. Lines marked made to order or upon request can take up to two days to prepare.",
    },
    {
      question: "Is all your meat Halaal?",
      answer:
        "Yes. Coleridge Meat is 100% Halaal certified, and our products are prepared and handled according to Halaal requirements.",
    },
    {
      question: "Do you do spitbraai catering in Stellenbosch?",
      answer:
        "Yes. We offer spitbraai services for family functions, celebrations and larger events. Package details, venue logistics and final quotes are confirmed directly with our team.",
    },
    {
      question: "Where are you based and when are you open?",
      answer:
        "You can find us at 18 Tennant Rd, Cloetesville, Stellenbosch. We are open Monday to Friday from 7:00 AM to 4:00 PM, Saturday from 8:00 AM to 11:00 AM, and closed on Sundays and public holidays.",
    },
    {
      question: "What payment methods do you accept?",
      answer:
        "We accept cash and card in store, and EFT by arrangement. For home deliveries, EFT payment must reflect in the account before the order is loaded for delivery.",
    },
  ];

  return (
    <section
      id="faq"
      aria-label="Frequently asked questions about ordering from Coleridge Meat"
      className="py-24 md:py-28 bg-stone-950 border-t border-stone-900"
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid gap-12 xl:grid-cols-[0.9fr_1.1fr] xl:items-start">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="mx-auto max-w-xl text-center xl:mx-0 xl:text-left"
          >
            <div id="faq-intro" className="flex flex-col items-center xl:items-start">
              <SectionTag className="mb-4">
                Frequently Asked Questions
              </SectionTag>
              <h2 className="text-4xl md:text-5xl font-serif text-stone-100 leading-tight">
                Helpful answers before you order
              </h2>
              <p className="mt-5 text-lg font-light leading-8 text-stone-400">
                A quick guide to ordering, collection, delivery, Halaal standards and
                spitbraai enquiries.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-3 xl:justify-start">
              <CounterLink
                target={{ category: "Marinated Products" }}
                className="inline-flex items-center gap-2 rounded-full bg-burgundy-800 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-100 transition-colors hover:bg-burgundy-700"
              >
                Start Your Order
                <ArrowRight size={14} />
              </CounterLink>
              <a
                href="#contact"
                onClick={(event) => {
                  event.preventDefault();
                  scrollToSection("#contact");
                }}
                className="inline-flex items-center gap-2 rounded-full border border-stone-700 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-300 transition-colors hover:border-stone-500 hover:text-stone-100"
              >
                Contact the Team
                <Phone size={14} />
              </a>
            </div>
          </motion.div>

          <div className="grid gap-4">
            {faqs.map((faq, index) => (
              <motion.article
                key={faq.question}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08, duration: 0.5 }}
                className="rounded-[26px] border border-stone-800/80 bg-stone-900/70 p-6 shadow-[0_22px_60px_-42px_rgba(0,0,0,0.9)]"
              >
                <h3 className="text-2xl font-serif text-stone-100">{faq.question}</h3>
                <p className="mt-4 text-sm leading-7 text-stone-400">{faq.answer}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const Contact = () => {
  return (
    <section id="contact" className="relative overflow-hidden py-24 md:py-32 bg-stone-900">
      <div className="absolute left-0 bottom-0 h-80 w-80 rounded-full bg-[#10233f]/25 blur-3xl pointer-events-none" />
      <div className="max-w-7xl mx-auto px-6 relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="mb-12 text-center lg:text-left">
              <div className="flex justify-center lg:justify-start">
                <SectionTag className="mb-4">
                  Visit Us
                </SectionTag>
              </div>
              <h2 className="text-4xl md:text-5xl font-serif text-stone-100 mb-8">Stop by the shop</h2>
              <p className="text-stone-400 font-light text-lg">
                Whether you're looking for tonight's dinner or placing a larger order for the
                weekend, we'd love to help you choose the right cuts.
              </p>
            </div>

            <div className="mb-10 rounded-[24px] border border-burgundy-900/40 bg-[linear-gradient(180deg,rgba(16,35,63,0.2),rgba(12,10,9,0.75))] px-5 py-5">
              <SectionTag icon={<ShieldCheck size={14} />}>
                Helpful to know
              </SectionTag>
              <p className="mt-3 text-sm leading-7 text-stone-300">
                Orders placed through the website are sent straight to our team for confirmation.
                We do not take payment online at checkout, so availability, weights and final totals
                can be confirmed properly with you first. Deliveries in Stellenbosch run Monday to
                Saturday, and orders in by 7:00 AM can qualify for same-day delivery.
              </p>
            </div>

            <div id="delivery-info" className="mb-10 rounded-[24px] border border-white/10 bg-stone-950/65 px-5 py-5">
              <SectionTag icon={<MapPin size={14} />}>
                Delivery info
              </SectionTag>
              <p className="mt-3 text-sm leading-7 text-stone-300">
                Stellenbosch deliveries are free. Kraaifontein, Brackenfell, Durbanville,
                Joostebergvlakte and Kuils River deliveries are R50, and delivery outside
                Stellenbosch starts from an order value of {formatZAR(CONFIG.DELIVERY_MINIMUM)}.
                Deliveries beyond those areas can still be scheduled by arrangement, with possible
                extra charges depending on distance.
              </p>
              <p className="mt-3 text-sm leading-7 text-stone-400">
                We also encourage co-workers to order together, and we can deliver to a workplace
                when it makes the route easier.{" "}
                <CounterLink
                  className="text-burgundy-200 underline decoration-burgundy-700/60 underline-offset-4 transition-colors hover:text-stone-100"
                  target={{ category: "Marinated Products" }}
                >
                  Shop here
                </CounterLink>{" "}
                and start building the order from the complete online catalogue. Home deliveries
                must be paid by EFT before the order is loaded for delivery.
              </p>
            </div>

            <div className="space-y-8">
              <div className="flex items-start gap-4 rounded-[24px] border border-white/6 bg-stone-950/65 px-4 py-4">
                <div className="w-12 h-12 bg-stone-950 rounded-full flex items-center justify-center shrink-0 border border-stone-800">
                  <MapPin className="text-burgundy-500 w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-stone-100 font-medium mb-1">Address</h4>
                  <p className="text-stone-400 text-sm">{CONFIG.ADDRESS}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4 rounded-[24px] border border-white/6 bg-stone-950/65 px-4 py-4">
                <div className="w-12 h-12 bg-stone-950 rounded-full flex items-center justify-center shrink-0 border border-stone-800">
                  <Clock className="text-burgundy-500 w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-stone-100 font-medium mb-1">Opening Hours</h4>
                  <p className="text-stone-400 text-sm whitespace-pre-line">{CONFIG.HOURS}</p>
                </div>
              </div>

              <div className="flex items-start gap-4 rounded-[24px] border border-white/6 bg-stone-950/65 px-4 py-4">
                <div className="w-12 h-12 bg-stone-950 rounded-full flex items-center justify-center shrink-0 border border-stone-800">
                  <Phone className="text-burgundy-500 w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-stone-100 font-medium mb-1">Contact</h4>
                  <p className="text-stone-400 text-sm mb-1">{CONFIG.PHONE}</p>
                  <p className="text-stone-400 text-sm">{CONFIG.EMAIL}</p>
                </div>
              </div>
            </div>

            <div className="mt-12 flex flex-wrap justify-center gap-4 lg:justify-start">
              <a 
                href={`tel:${CONFIG.PHONE.replace(/[^0-9+]/g, '')}`} 
                className="px-6 py-3 bg-stone-100 text-stone-950 rounded-sm text-xs font-semibold tracking-widest uppercase hover:bg-stone-300 transition-colors flex items-center gap-2"
              >
                <Phone size={16} /> Call Now
              </a>
              <a 
                href={CONFIG.WHATSAPP} 
                target="_blank" 
                rel="noopener noreferrer"
                className="px-6 py-3 bg-[#25D366] text-white rounded-sm text-xs font-semibold tracking-widest uppercase hover:bg-[#20bd5a] transition-colors flex items-center gap-2"
              >
                <MessageCircle size={16} /> WhatsApp Us
              </a>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            id="contact-map"
            className="bg-stone-950 p-2 rounded-sm border border-stone-800 h-[400px] lg:h-auto min-h-[400px] relative flex items-center justify-center overflow-hidden"
          >
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3308.123456789!2d18.859504!3d-33.934567!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1dcc7e5b8e2a2b2b%3A0x1234567890abcdef!2s18+Tennant+Rd+Cloetesville+Stellenbosch+7599!5e0!3m2!1sen!2sza!4v1234567890"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer"
              className="rounded-sm"
              title="Google Maps - Coleridge Meat Location"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const Footer = () => {
  const hasSocialLinks =
    CONFIG.SOCIAL.INSTAGRAM !== "#" || CONFIG.SOCIAL.FACEBOOK !== "#";

  return (
    <footer className="bg-stone-950 pt-20 pb-10 border-t border-stone-900">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12 mb-16">
          <div className="sm:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <img
                src="/logo.jpg"
                alt="Coleridge Meat logo"
                className="h-12 w-auto object-contain mix-blend-screen"
              />
            </div>
            <p className="text-stone-400 text-sm max-w-sm leading-relaxed mb-6">
              {CONFIG.TAGLINE}, with premium farm-raised meats and dependable local service.
            </p>
            {hasSocialLinks ? (
              <div className="flex gap-4">
                {CONFIG.SOCIAL.INSTAGRAM !== "#" && (
                  <a href={CONFIG.SOCIAL.INSTAGRAM} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-stone-900 flex items-center justify-center text-stone-400 hover:bg-burgundy-900 hover:text-stone-100 transition-colors">
                    <Instagram size={18} />
                  </a>
                )}
                {CONFIG.SOCIAL.FACEBOOK !== "#" && (
                  <a href={CONFIG.SOCIAL.FACEBOOK} target="_blank" rel="noopener noreferrer" aria-label="Visit Coleridge Meat on Facebook" className="w-10 h-10 rounded-full bg-stone-900 flex items-center justify-center text-stone-400 hover:bg-burgundy-900 hover:text-stone-100 transition-colors">
                    <Facebook size={18} />
                  </a>
                )}
              </div>
            ) : (
              <div className="flex flex-wrap gap-3">
                <a
                  href={CONFIG.WHATSAPP}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-200 transition-colors hover:border-stone-500 hover:text-stone-100"
                >
                  <MessageCircle size={14} />
                  WhatsApp us
                </a>
                <a
                  href={`tel:${CONFIG.PHONE.replace(/[^0-9+]/g, '')}`}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-300 transition-colors hover:border-stone-500 hover:text-stone-100"
                >
                  <Phone size={14} />
                  Call the shop
                </a>
              </div>
            )}
          </div>
          
          <div>
            <h4 className="text-stone-100 font-medium mb-6 uppercase tracking-widest text-xs">Quick Links</h4>
            <ul className="space-y-3 text-sm text-stone-400">
              <li><a href="#about" onClick={(event) => { event.preventDefault(); scrollToSection("#about"); }} className="hover:text-burgundy-500 transition-colors">Our Story</a></li>
              <li><a href="#why-us" onClick={(event) => { event.preventDefault(); scrollToSection("#why-us"); }} className="hover:text-burgundy-500 transition-colors">Why Us</a></li>
              <li><a href="#selection" onClick={(event) => { event.preventDefault(); scrollToSection("#selection"); }} className="hover:text-burgundy-500 transition-colors">Our Selection</a></li>
              <li><a href="#spitbraai" onClick={(event) => { event.preventDefault(); scrollToSection("#spitbraai"); }} className="hover:text-burgundy-500 transition-colors">Spitbraai</a></li>
              <li><a href="#shop" onClick={(event) => { event.preventDefault(); scrollToSection("#shop"); }} className="hover:text-burgundy-500 transition-colors">Shop Online</a></li>
              <li><a href="#delivery-info" onClick={(event) => { event.preventDefault(); scrollToSection("#delivery-info"); }} className="hover:text-burgundy-500 transition-colors">Delivery Info</a></li>
              <li><a href="#faq" onClick={(event) => { event.preventDefault(); scrollToSection("#faq"); }} className="hover:text-burgundy-500 transition-colors">FAQ</a></li>
              <li><a href="#contact" onClick={(event) => { event.preventDefault(); scrollToSection("#contact"); }} className="hover:text-burgundy-500 transition-colors">Visit Us</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-stone-100 font-medium mb-6 uppercase tracking-widest text-xs">Contact</h4>
            <ul className="space-y-3 text-sm text-stone-400">
              <li>{CONFIG.ADDRESS}</li>
              <li>{CONFIG.PHONE}</li>
              <li>{CONFIG.EMAIL}</li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-stone-900 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-stone-600">
          <p>&copy; {new Date().getFullYear()} {CONFIG.BUSINESS_NAME}. All rights reserved.</p>
          <p>Designed for Stellenbosch.</p>
        </div>
      </div>
    </footer>
  );
};

// Hidden admin route — not linked from public nav
function App() {
  const [adminRoute] = useState<"catalogue" | "specials" | null>(() => {
    const path = window.location.pathname.replace(/\/+$/, "") || "/";
    if (path === "/admin/specials") return "specials";
    if (path === "/admin") return "catalogue";
    return null;
  });

  useEffect(() => {
    if (!adminRoute && window.location.hash === "#cm-specials-portal") {
      window.location.replace("/admin/specials/");
    }
  }, [adminRoute]);

  useEffect(() => {
    if (adminRoute) {
      return;
    }

    const applySeo = () => {
      const currentHash = window.location.hash.replace("#", "");
      const seo = SECTION_SEO[currentHash] ?? DEFAULT_SEO;

      document.title = seo.title;
      setMetaContent('meta[name="description"]', seo.description);
      setMetaContent('meta[property="og:title"]', seo.title);
      setMetaContent('meta[property="og:description"]', seo.description);
      setMetaContent('meta[name="twitter:title"]', seo.title);
      setMetaContent('meta[name="twitter:description"]', seo.description);
    };

    const syncHashScroll = (delay = 0) => {
      const hash = window.location.hash;
      if (!hash) {
        return;
      }

      let attempts = 0;
      const attemptScroll = () => {
        const { target, offset } = resolveScrollTarget(hash);

        if (!target) {
          if (attempts < 10) {
            attempts += 1;
            window.setTimeout(attemptScroll, 120);
          }
          return;
        }

        const top = Math.max(
          0,
          target.getBoundingClientRect().top + window.scrollY - offset
        );

        window.scrollTo({ top, behavior: "auto" });
      };

      window.setTimeout(() => {
        window.requestAnimationFrame(attemptScroll);
      }, delay);
    };

    const handleHashChange = () => {
      applySeo();
      syncHashScroll(120);
    };

    applySeo();
    syncHashScroll(180);
    window.addEventListener("hashchange", handleHashChange);

    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [adminRoute]);

  if (adminRoute) {
    return (
      <Suspense
        fallback={
          <div className="min-h-screen bg-stone-950 px-6 py-16 text-stone-200">
            <div className="mx-auto max-w-3xl">
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-burgundy-400">
                Coleridge Meat
              </div>
              <h1 className="mt-4 font-serif text-4xl text-stone-100">
                {adminRoute === "specials" ? "Loading specials builder..." : "Loading catalogue manager..."}
              </h1>
            </div>
          </div>
        }
      >
        {adminRoute === "specials" ? <SpecialsBuilder /> : <CatalogueAdmin />}
      </Suspense>
    );
  }

  return (
    <CartProvider>
    <div id="top" className="min-h-screen bg-stone-950 text-stone-200 font-sans selection:bg-burgundy-800 selection:text-stone-100">
      <StickyNav />
      <main>
        <Hero />
        <About />
        <WhyChooseUs />
        <OurSelection />
        <FeaturedCuts />
        <SpitbraaiFeature />
        <PublicShopIntro />
        <ShopGrid />
        <GoogleReviews />
        <CommunityTrust />
        <FAQSection />
        <Contact />
      </main>
      <Footer />
      <CartDrawer />
      <CheckoutModal />
      
      {/* Floating WhatsApp Button */}
      <motion.a
        href={CONFIG.WHATSAPP}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-4 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-all duration-300 hover:bg-[#20bd5a] md:bottom-6 md:right-6 md:h-14 md:w-14"
        aria-label="Contact us on WhatsApp"
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.9 }}
        animate={{
          y: [0, -5, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
          <MessageCircle size={22} />
      </motion.a>
    </div>
    </CartProvider>
  );
}

export default App;
