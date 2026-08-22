import { useEffect, useMemo, useRef, useState } from "react";
import { business } from "./data/business";
import { locations } from "./data/locations";
import { menuCategories, menuItems } from "./data/menu";
import { socials } from "./data/socials";
import type { Location, MenuCategory, MenuItem } from "./types";
import { dayLabel, formatHours, getOpenState, getTodayHours, openingHoursSpecification } from "./utils/hours";
import { trackEvent } from "./utils/analytics";
import { assetUrl } from "./utils/assets";

const routes = {
  home: "/",
  menu: "/menu",
  locations: "/locations",
};

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const withBasePath = (href: string) => {
  if (!href.startsWith("/")) return href;
  if (href === "/") return `${basePath || "/"}`;
  return `${basePath}${href}`;
};

const routeMeta: Record<string, { title: string; description: string }> = {
  "/": {
    title: "Tripletas La Unión | Tripletas y comida late night en Puerto Rico",
    description: business.seoDescription,
  },
  "/menu": {
    title: "Menú | Tripletas La Unión",
    description: "Explora tripletas, sándwiches, wraps y papas locas. Precios oficiales pendientes de confirmar.",
  },
  "/locations": {
    title: "Ubicaciones | Tripletas La Unión",
    description: "Encuentra Tripletas La Unión en Caguas, Av. Piñero y 65 de Infantería.",
  },
};

const getPath = () => {
  const pathname = window.location.pathname;
  const withoutBase = basePath && pathname.startsWith(basePath) ? pathname.slice(basePath.length) || "/" : pathname;
  return withoutBase.replace(/\/$/, "") || "/";
};

const getStickyHeaderHeight = () => document.querySelector(".site-header")?.getBoundingClientRect().height ?? 0;

const scrollToHashTarget = (hash: string) => {
  const target = document.getElementById(decodeURIComponent(hash.replace(/^#/, "")));
  if (!target) return;

  const top = target.getBoundingClientRect().top + window.scrollY - getStickyHeaderHeight() - 50;
  window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
};

const navigate = (href: string) => {
  window.history.pushState({}, "", withBasePath(href));
  window.dispatchEvent(new PopStateEvent("popstate"));

  const hash = href.includes("#") ? href.slice(href.indexOf("#")) : "";
  if (hash) {
    requestAnimationFrame(() => requestAnimationFrame(() => scrollToHashTarget(hash)));
    return;
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
};

const Link = ({ href, children, className, onClick }: { href: string; children: React.ReactNode; className?: string; onClick?: () => void }) => (
  <a
    className={className}
    href={withBasePath(href)}
    onClick={(event) => {
      if (href.startsWith("/")) {
        event.preventDefault();
        navigate(href);
      }
      onClick?.();
    }}
  >
    {children}
  </a>
);

export function App() {
  const [path, setPath] = useState(getPath);
  const [menuOpen, setMenuOpen] = useState(false);
  const [orderModalOpen, setOrderModalOpen] = useState(false);

  useEffect(() => {
    const onPopState = () => setPath(getPath());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    if (!window.location.hash) return;
    requestAnimationFrame(() => requestAnimationFrame(() => scrollToHashTarget(window.location.hash)));
  }, [path]);

  useEffect(() => {
    const locationRoute = locations.find((location) => path === `/locations/${location.id}`);
    const meta =
      locationRoute != null
        ? {
            title: `${locationRoute.shortName} | Tripletas La Unión`,
            description: `${locationRoute.name}: ${locationRoute.addressLines.join(", ")}. Llama al ${locationRoute.phone}.`,
          }
        : routeMeta[path] ?? routeMeta["/"];
    document.title = meta.title;
    document.querySelector("meta[name='description']")?.setAttribute("content", meta.description);
    document.querySelector("meta[property='og:title']")?.setAttribute("content", meta.title);
    document.querySelector("meta[property='og:description']")?.setAttribute("content", meta.description);
    document.querySelector("meta[name='twitter:title']")?.setAttribute("content", meta.title);
    document.querySelector("meta[name='twitter:description']")?.setAttribute("content", meta.description);
  }, [path]);

  const page = useMemo(() => {
    if (path === "/menu") return <MenuPage onOrder={() => setOrderModalOpen(true)} />;
    if (path === "/locations") return <LocationsPage />;
    const detail = locations.find((location) => path === `/locations/${location.id}`);
    if (detail) return <LocationDetailPage location={detail} onOrder={() => setOrderModalOpen(true)} />;
    return <HomePage onOrder={() => setOrderModalOpen(true)} />;
  }, [path]);


  return (
    <>
      <Header
        menuOpen={menuOpen}
        onToggleMenu={() => setMenuOpen((open) => !open)}
        onCloseMenu={() => setMenuOpen(false)}
        onOrder={() => setOrderModalOpen(true)}
      />
      {page}
      <Footer />
      <MobileActionBar onOrder={() => setOrderModalOpen(true)} />
      {orderModalOpen ? <OrderModal onClose={() => setOrderModalOpen(false)} /> : null}
      <StructuredData />
    </>
  );
}

function Header({
  menuOpen,
  onToggleMenu,
  onCloseMenu,
  onOrder,
}: {
  menuOpen: boolean;
  onToggleMenu: () => void;
  onCloseMenu: () => void;
  onOrder: () => void;
}) {
  const headerRef = useRef<HTMLElement>(null);
  const handleMobileMenuOrder = () => {
    onCloseMenu();
    onOrder();
  };
  const nav = (
    <>
      <Link href="/">Inicio</Link>
      <Link href="/menu" onClick={() => trackEvent("menu_view")}>
        Menú
      </Link>
      <Link href="/locations">Ubicaciones</Link>
      <Link href="/#nosotros">Nosotros</Link>
      <Link href="/#galeria">Galería</Link>
    </>
  );

  const mobileNav = (
    <>
      <Link href="/" onClick={onCloseMenu}>
        Inicio
      </Link>
      <Link
        href="/menu"
        onClick={() => {
          trackEvent("menu_view");
          onCloseMenu();
        }}
      >
        Menú
      </Link>
      <Link href="/locations" onClick={onCloseMenu}>
        Ubicaciones
      </Link>
      <Link href="/#nosotros" onClick={onCloseMenu}>
        Nosotros
      </Link>
      <Link href="/#galeria" onClick={onCloseMenu}>
        Galería
      </Link>
    </>
  );

  useEffect(() => {
    if (!menuOpen) return;

    const closeOnOutsidePointerDown = (event: PointerEvent) => {
      if (!window.matchMedia("(max-width: 900px)").matches) return;
      if (headerRef.current?.contains(event.target as Node)) return;
      onCloseMenu();
    };

    document.addEventListener("pointerdown", closeOnOutsidePointerDown);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointerDown);
  }, [menuOpen, onCloseMenu]);

  return (
    <header className="site-header" ref={headerRef}>
      <nav className="nav-shell" aria-label="Navegación principal">
        <Link href="/" className="brand-mark">
          <img className="brand-badge" src={assetUrl("/images/Favicon.png")} alt="Tripletas La Unión" />
          <span>
            <strong>Tripletas La Unión</strong>
            <small>Puerto Rico</small>
          </span>
        </Link>
        <div className="desktop-nav">{nav}</div>
        <button className="primary-cta desktop-cta" onClick={onOrder}>
          Ordena / llama
        </button>
        <button className="menu-button" onClick={onToggleMenu} aria-expanded={menuOpen} aria-controls="mobile-nav">
          <span className="sr-only">Abrir menú</span>
          <span />
          <span />
          <span />
        </button>
      </nav>
      <div id="mobile-nav" className={`mobile-nav ${menuOpen ? "is-open" : ""}`}>
        {mobileNav}
        <button className="primary-cta" onClick={handleMobileMenuOrder}>
          Ordena / llama
        </button>
      </div>
    </header>
  );
}

function HomePage({ onOrder }: { onOrder: () => void }) {
  const featuredItems = menuItems.filter((item) => item.featured && item.active).slice(0, 6);

  return (
    <main>
      <section className="hero" style={{ "--hero-image": `url("${assetUrl("/images/hero/tripleta-hero.png")}")` } as React.CSSProperties}>
        <div className="hero-content">
          <p className="eyebrow">3 ubicaciones en Puerto Rico</p>
          <h1>El hambre no espera.</h1>
          <p className="hero-copy">Tripletas, churrasco, pastrami y más. Sabor boricua hecho pa' esa hambre de verdad.</p>
          <div className="button-row">
            <Link href="/menu" className="primary-cta" onClick={() => trackEvent("menu_view")}>
              Ver menú
            </Link>
            <Link href="/locations" className="secondary-cta">
              Encuentra tu Unión
            </Link>
          </div>
        </div>
      </section>

      <section className="section split-section">
        <div>
          <p className="eyebrow">La firma</p>
          <h2>Tres carnes. Un clásico.</h2>
          <p>
            La tripleta es comida boricua de calle en su punto: pan caliente, carnes, sabor y una porción que resuelve.
            Aquí se presenta sin inventar secretos de receta: lo importante es pedirla como te gusta.
          </p>
          <Link href="/menu" className="text-link">
            Ver el menú
          </Link>
        </div>
        <div className="feature-panel">
          <span>Tripletas</span>
          <strong>hechas al momento</strong>
        </div>
      </section>

      <section className="section dark-band" id="menu">
        <div className="section-heading">
          <p className="eyebrow">Menú</p>
          <h2>Pa' esa hambre de verdad.</h2>
          <Link href="/menu" className="secondary-cta">
            Ver menú completo
          </Link>
        </div>
        <div className="menu-grid">
          {featuredItems.map((item) => (
            <MenuCard key={item.id} item={item} />
          ))}
        </div>
      </section>

      <section className="section customization">
        <p className="eyebrow">A tu gusto</p>
        <h2>Aquí se hace como tú la pidas.</h2>
        <p>Pollo, beefsteak, churrasco, pastrami o combina tus favoritas.</p>
        <div className="meat-tags" aria-label="Opciones populares de carnes">
          {["Pollo", "Beefsteak", "Churrasco", "Pastrami", "Mixtas"].map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
      </section>

      <section className="section" id="ubicaciones">
        <div className="section-heading">
          <p className="eyebrow">Ubicaciones</p>
          <h2>Encuentra tu Unión.</h2>
          <Link href="/locations" className="text-link">
            Ver todas
          </Link>
        </div>
        <MapPanel />
      </section>

      <section className="section late-night">
        <p className="eyebrow">Late night</p>
        <h2>Del jangueo pa' La Unión.</h2>
        <p>Cuando la noche sigue, la comida también. Busca tu parada, llama y llega directo.</p>
      </section>

      <section className="section gallery" id="galeria">
        <div>
          <p className="eyebrow">Social</p>
          <h2>Mira lo que se está cocinando.</h2>
          <p>Galería controlada con fotos aprobadas por el negocio. Las imágenes actuales son temporales y reemplazables.</p>
          <div className="button-row">
            <a className="secondary-cta" href={socials.caguasInstagram.url} target="_blank" rel="noreferrer" onClick={() => trackEvent("instagram_click", { account: socials.caguasInstagram.label })}>
              Instagram Caguas
            </a>
            <a className="secondary-cta" href={socials.metroInstagram.url} target="_blank" rel="noreferrer" onClick={() => trackEvent("instagram_click", { account: socials.metroInstagram.label })}>
              Instagram Metro
            </a>
          </div>
        </div>
        <div className="gallery-grid" aria-label="Espacios reservados para fotografía aprobada" style={{ "--gallery-image": `url("${assetUrl("/images/gallery/gallery-placeholder.svg")}")` } as React.CSSProperties}>
          <span>Tripleta</span>
          <span>Papas locas</span>
          <span>Churrasco</span>
          <span>Wrap</span>
        </div>
      </section>

      <section className="section split-section" id="nosotros">
        <div>
          <p className="eyebrow">Nosotros</p>
          <h2>Comida que resuelve.</h2>
          <p>
            Tripletas La Unión nació con una misión sencilla: servir comida que resuelva el hambre de verdad. Porciones
            generosas, preparación al momento, combinaciones a tu gusto y servicio rápido para la ruta, la salida o la noche.
          </p>
        </div>
        <div className="about-list">
          <span>Made to order</span>
          <span>Porciones generosas</span>
          <span>Servicio nocturno</span>
          <span>Sabor local</span>
        </div>
      </section>

      <section className="final-cta">
        <h2>¿Con hambre?</h2>
        <p>Busca tu ubicación más cercana y pide la tuya.</p>
        <div className="button-row">
          <Link href="/locations" className="primary-cta">
            Encuentra tu ubicación
          </Link>
          <button className="secondary-cta" onClick={onOrder}>
            Llama para ordenar
          </button>
        </div>
      </section>
    </main>
  );
}

function MenuPage({ onOrder }: { onOrder: () => void }) {
  const [activeCategory, setActiveCategory] = useState<MenuCategory>("tripletas");
  const activeItems = menuItems
    .filter((item) => item.active && item.category === activeCategory)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  useEffect(() => trackEvent("menu_view"), []);

  return (
    <main className="page">
      <PageHero eyebrow="Menú" title="Tripletas, sándwiches y papas que resuelven." copy="Los precios oficiales están pendientes de confirmar con el dueño. Donde falte precio, verás Consulta precio." />
      <section className="section">
        <div className="category-tabs" role="tablist" aria-label="Categorías del menú">
          {menuCategories.map((category) => (
            <button
              key={category.id}
              className={activeCategory === category.id ? "is-active" : ""}
              onClick={() => setActiveCategory(category.id)}
              role="tab"
              aria-selected={activeCategory === category.id}
            >
              {category.label}
            </button>
          ))}
        </div>
        <div className="menu-grid menu-page-grid">
          {activeItems.length > 0 ? activeItems.map((item) => <MenuCard key={item.id} item={item} showAvailability />) : <p>Esta categoría está lista para recibir productos oficiales.</p>}
        </div>
        <div className="callout">
          <div>
            <h2>Llama para ordenar</h2>
            <p>Escoge la ubicación y llama directo. No hay checkout falso ni pedidos simulados.</p>
          </div>
          <button className="primary-cta" onClick={onOrder}>
            Elegir ubicación
          </button>
        </div>
      </section>
    </main>
  );
}

function LocationsPage() {
  return (
    <main className="page">
      <PageHero eyebrow="Ubicaciones" title="Encuentra tu Unión." copy="Caguas, Av. Piñero y 65 de Infantería." />
      <section className="section">
        <MapPanel />
      </section>
    </main>
  );
}

function LocationDetailPage({ location, onOrder }: { location: Location; onOrder: () => void }) {
  const state = getOpenState(location);

  return (
    <main className="page">
      <PageHero eyebrow="Ubicación" title={location.shortName} copy={`${location.addressLines.join(", ")}. ${state.label}: ${state.todayLabel}.`} />
      <section className="section location-detail">
        <div className="detail-main">
          <img src={assetUrl(location.image)} alt={`Imagen temporal para ${location.name}`} />
          <h2>{location.name}</h2>
          {location.description ? <p>{location.description}</p> : null}
          <div className="button-row">
            <a className="primary-cta" href={location.telUri} onClick={() => trackEvent("call_location", { location: location.id })}>
              Llamar {location.phone}
            </a>
            <a className="secondary-cta" href={location.mapsUrl} target="_blank" rel="noreferrer" onClick={() => trackEvent("directions_location", { location: location.id })}>
              Cómo llegar
            </a>
            <button className="secondary-cta" onClick={onOrder}>
              Ordenar por llamada
            </button>
          </div>
        </div>
        <aside className="detail-aside">
          <h3>Horario completo</h3>
          <HoursList location={location} />
          <h3>Pagos verificados</h3>
          <PaymentList location={location} />
          <h3>Social</h3>
          <SocialLinks location={location} />
        </aside>
      </section>
    </main>
  );
}

function PageHero({ eyebrow, title, copy }: { eyebrow: string; title: string; copy: string }) {
  return (
    <section className="page-hero">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p>{copy}</p>
    </section>
  );
}

function MenuCard({ item, showAvailability = false }: { item: MenuItem; showAvailability?: boolean }) {
  return (
    <article className="menu-card">
      <img src={assetUrl(item.image)} alt={`Imagen temporal para ${item.name}`} loading="lazy" />
      <div>
        <div className="card-topline">
          <h3>{item.name}</h3>
          <strong>{item.price == null ? "Consulta precio" : `$${item.price.toFixed(2)}`}</strong>
        </div>
        <p>{item.description}</p>
        <div className="badge-row">
          {item.badges.map((badge) => (
            <span key={badge}>{badge}</span>
          ))}
        </div>
        {showAvailability ? <small>Disponible según menú oficial por ubicación. Confirmar con el negocio.</small> : null}
      </div>
    </article>
  );
}

function MapPanel() {
  const mapQuery = encodeURIComponent(
    locations.map((location) => `${location.name} ${location.addressLines.join(" ")}`).join(" ")
  );

  return (
    <section className="map-panel" aria-labelledby="map-title">
      <div>
        <p className="eyebrow">Mapa</p>
        <h2 id="map-title">Todas las paradas</h2>
        <p>Encuentra la parada más cercana y abre la ruta directa en Google Maps.</p>
        <div className="map-location-list">
          {locations.map((location) => {
            const state = getOpenState(location);

            return (
              <article key={location.id}>
                <div className="map-location-heading">
                  <strong>{location.shortName}</strong>
                  <span className={state.isOpen ? "status open" : "status"}>{state.label}</span>
                </div>
                <span>{location.addressLines.join(", ")}</span>
                <div className="map-location-actions">
                  <a href={location.mapsUrl} target="_blank" rel="noreferrer" onClick={() => trackEvent("directions_location", { location: location.id })}>
                    Cómo llegar
                  </a>
                  <a href={location.telUri} onClick={() => trackEvent("call_location", { location: location.id })}>
                    Llamar
                  </a>
                  <Link href={`/locations/${location.id}`} onClick={() => trackEvent("location_selected", { location: location.id })}>
                    Detalles
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </div>
      <div className="map-canvas" aria-label="Mapa de Tripletas La Unión en Puerto Rico">
        <iframe
          title="Mapa de Tripletas La Unión"
          src={`https://www.google.com/maps?q=${mapQuery}&output=embed`}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </section>
  );
}

function HoursList({ location }: { location: Location }) {
  return (
    <dl className="hours-list">
      {Object.entries(location.hours).map(([day, ranges]) => (
        <div key={day}>
          <dt>{dayLabel(day as keyof typeof location.hours)}</dt>
          <dd>{formatHours(ranges)}</dd>
        </div>
      ))}
    </dl>
  );
}

function PaymentList({ location }: { location: Location }) {
  const verified = location.paymentMethods.filter((method) => method.verified);
  return verified.length > 0 ? (
    <ul className="simple-list">
      {verified.map((method) => (
        <li key={method.id}>{method.label}</li>
      ))}
    </ul>
  ) : (
    <p>Por confirmar con el negocio.</p>
  );
}

function SocialLinks({ location }: { location: Location }) {
  return (
    <div className="social-links">
      {location.socials.instagram ? (
        <a href={location.socials.instagram} target="_blank" rel="noreferrer" onClick={() => trackEvent("instagram_click", { location: location.id })}>
          Instagram
        </a>
      ) : null}
      {location.socials.facebook ? (
        <a href={location.socials.facebook} target="_blank" rel="noreferrer" onClick={() => trackEvent("facebook_click", { location: location.id })}>
          Facebook
        </a>
      ) : null}
    </div>
  );
}

function OrderModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="order-title">
      <div className="modal">
        <button className="modal-close" onClick={onClose} aria-label="Cerrar">
          ×
        </button>
        <h2 id="order-title">¿De cuál ubicación deseas ordenar?</h2>
        <p>Selecciona una ubicación y llama directo.</p>
        <div className="modal-location-list">
          {locations.map((location) => (
            <a key={location.id} href={location.telUri} onClick={() => trackEvent("call_location", { location: location.id })}>
              <strong>{location.shortName}</strong>
              <span>{location.phone}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

function MobileActionBar({ onOrder }: { onOrder: () => void }) {
  return (
    <div className="mobile-action-bar" aria-label="Acciones rápidas">
      <button onClick={onOrder}>Llamar</button>
      <Link href="/locations">Ubicaciones</Link>
      <Link href="/menu" onClick={() => trackEvent("menu_view")}>
        Menú
      </Link>
    </div>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-brand">
        <h2>Tripletas La Unión</h2>
        <p>Tripletas que rompen. Tres ubicaciones en Puerto Rico.</p>
      </div>
      <div className="footer-groups">
        <nav className="footer-group" aria-label="Navegación del footer">
          <span>Explora</span>
          <Link href="/">Inicio</Link>
          <Link href="/menu">Menú</Link>
          <Link href="/locations">Ubicaciones</Link>
          <a href={socials.caguasInstagram.url} target="_blank" rel="noreferrer">
            Instagram Caguas
          </a>
          <a href={socials.metroInstagram.url} target="_blank" rel="noreferrer">
            Instagram Metro
          </a>
        </nav>
        <nav className="footer-group footer-locations" aria-label="Ubicaciones del footer">
          <span>Ubicaciones</span>
          {locations.map((location) => (
            <Link key={location.id} href={`/locations/${location.id}`}>
              {location.shortName}
            </Link>
          ))}
        </nav>
      </div>
      <div className="legal-row">
        <span>Privacy Policy</span>
        <span>Términos</span>
        {business.featureFlags.developerCredit ? (
          <span>
            Built by{" "}
            <a href="https://firstlinedev.com" target="_blank" rel="noreferrer">
              FirstLine Development
            </a>
          </span>
        ) : null}
      </div>
    </footer>
  );
}

function StructuredData() {
  const schema = {
    "@context": "https://schema.org",
    "@graph": locations.map((location) => ({
      "@type": "Restaurant",
      name: location.name,
      address: {
        "@type": "PostalAddress",
        streetAddress: location.addressLines[0],
        addressLocality: location.addressLines[1].split(",")[0],
        addressRegion: "PR",
        addressCountry: "US",
      },
      telephone: location.phone,
      url: `${window.location.origin}/locations/${location.id}`,
      openingHoursSpecification: openingHoursSpecification(location),
      servesCuisine: ["Puerto Rican", "Sandwiches", "Street food"],
    })),
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}
