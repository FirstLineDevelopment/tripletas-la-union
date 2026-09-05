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
  privacy: "/privacy",
  terms: "/terms",
};

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
const isComingSoonBuild = import.meta.env.VITE_COMING_SOON === "true";

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
    description: "Explora tripletas, sándwiches, wraps y papas locas de Tripletas La Unión.",
  },
  "/locations": {
    title: "Ubicaciones | Tripletas La Unión",
    description: "Encuentra Tripletas La Unión en Av. Piñero y 65 de Infantería.",
  },
  "/privacy": {
    title: "Políticas de Privacidad | Tripletas La Unión",
    description: "Conoce cómo Tripletas La Unión maneja la privacidad de visitantes y clientes del sitio web.",
  },
  "/privacy-policy": {
    title: "Políticas de Privacidad | Tripletas La Unión",
    description: "Conoce cómo Tripletas La Unión maneja la privacidad de visitantes y clientes del sitio web.",
  },
  "/terms": {
    title: "Términos de Uso | Tripletas La Unión",
    description: "Consulta los términos de uso del sitio web de Tripletas La Unión.",
  },
  "/terms-of-use": {
    title: "Términos de Uso | Tripletas La Unión",
    description: "Consulta los términos de uso del sitio web de Tripletas La Unión.",
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
  if (isComingSoonBuild) return <ComingSoonPage />;
  return <FullSiteApp />;
}

function ComingSoonPage() {
  useEffect(() => {
    const title = "Tripletas La Unión | Próximamente";
    const description = "El sitio oficial de Tripletas La Unión estará disponible pronto.";

    document.title = title;
    document.querySelector("meta[name='description']")?.setAttribute("content", description);
    document.querySelector("meta[property='og:title']")?.setAttribute("content", title);
    document.querySelector("meta[property='og:description']")?.setAttribute("content", description);
    document.querySelector("meta[name='twitter:title']")?.setAttribute("content", title);
    document.querySelector("meta[name='twitter:description']")?.setAttribute("content", description);
  }, []);

  return (
    <main className="coming-soon-page">
      <section className="coming-soon-card" aria-labelledby="coming-soon-title">
        <img src={assetUrl("/images/branding/Logo.png")} alt="Tripletas La Unión" />
        <p className="eyebrow">Próximamente</p>
        <h1 id="coming-soon-title">Estamos preparando algo bueno.</h1>
        <p>El sitio oficial estará disponible pronto.</p>
      </section>
    </main>
  );
}

function FullSiteApp() {
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
    if (path === "/privacy" || path === "/privacy-policy") return <PrivacyPolicyPage />;
    if (path === "/terms" || path === "/terms-of-use") return <TermsOfUsePage />;
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
          <p className="eyebrow">2 ubicaciones en Puerto Rico</p>
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
        <div className="feature-panel" style={{ "--feature-image": `url("${assetUrl("/images/menu/Hechas al momento.png")}")` } as React.CSSProperties}>
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
          <div className="button-row">
            <a className="secondary-cta" href={socials.metroInstagram.url} target="_blank" rel="noreferrer" onClick={() => trackEvent("instagram_click", { account: socials.metroInstagram.label })}>
              <img className="instagram-logo" src={assetUrl("/images/branding/instagram.svg")} alt="" aria-hidden="true" />
              <span className="sr-only">Instagram </span>
              Metro
            </a>
          </div>
        </div>
        <div className="gallery-grid" aria-label="Fotos destacadas del menú">
          <span style={{ "--gallery-image": `url("${assetUrl("/images/menu/Tripleta2.png")}")` } as React.CSSProperties}>Tripleta</span>
          <span style={{ "--gallery-image": `url("${assetUrl("/images/menu/Papas-locas-de-tripleta.png")}")` } as React.CSSProperties}>Papas locas</span>
          <span style={{ "--gallery-image": `url("${assetUrl("/images/menu/Churrasco.png")}")` } as React.CSSProperties}>Churrasco</span>
          <span style={{ "--gallery-image": `url("${assetUrl("/images/menu/Wrap.png")}")` } as React.CSSProperties}>Wrap</span>
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
        <div className="about-logo-panel">
          <img src={assetUrl("/images/branding/Logo.png")} alt="Tripletas La Unión" />
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
  const [activeCategory, setActiveCategory] = useState<MenuCategory | "todos">("todos");
  const categoryFilters = [{ id: "todos" as const, label: "Todos" }, ...menuCategories];
  const activeItems = menuItems
    .filter((item) => item.active && (activeCategory === "todos" || item.category === activeCategory))
    .sort((a, b) => a.sortOrder - b.sortOrder);

  useEffect(() => trackEvent("menu_view"), []);

  return (
    <main className="page">
      <PageHero eyebrow="Menú" title="Tripletas, sándwiches y papas que resuelven." copy="Explora los favoritos y llama a la ubicación que prefieras para ordenar directo." />
      <section className="section">
        <div className="category-tabs" role="tablist" aria-label="Categorías del menú">
          {categoryFilters.map((category) => (
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
          {activeItems.length > 0 ? activeItems.map((item) => <MenuCard key={item.id} item={item} showAvailability />) : <p>¡Llama y pídela como tú la quieras!</p>}
        </div>
        <div className="callout">
          <div>
            <h2>Llama para ordenar</h2>
            <p>Escoge la ubicación y llama directo.</p>
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
      <PageHero eyebrow="Ubicaciones" title="Encuentra tu Unión." copy="Av. Piñero y 65 de Infantería." />
      <section className="section">
        <MapPanel />
      </section>
    </main>
  );
}

function PrivacyPolicyPage() {
  return (
    <main className="page">
      <PageHero
        eyebrow="Legal"
        title="Políticas de Privacidad"
        copy="Última actualización: 1 de septiembre de 2026"
      />
      <section className="section policy-page" aria-label="Política de Privacidad">
        <p>
          En <strong>Tripletas La Unión</strong>, respetamos la privacidad de nuestros clientes y visitantes. Esta
          Política de Privacidad explica de manera general qué información puede recopilarse cuando visitas nuestro
          sitio web y cómo puede utilizarse.
        </p>

        <h2>1. Información que podemos recopilar</h2>
        <p>
          Podemos recopilar información que tú nos proporciones voluntariamente, incluyendo tu nombre, número de
          teléfono, correo electrónico o cualquier otra información enviada mediante formularios de contacto, mensajes o
          solicitudes realizadas a través del sitio.
        </p>
        <p>
          También podemos recopilar automáticamente cierta información técnica, como tipo de navegador, dispositivo
          utilizado, páginas visitadas, tiempo de navegación y dirección IP, cuando estas funciones estén habilitadas
          mediante herramientas de análisis.
        </p>

        <h2>2. Cómo utilizamos la información</h2>
        <p>La información recopilada puede utilizarse para:</p>
        <ul>
          <li>Responder preguntas o solicitudes.</li>
          <li>Proporcionar información sobre nuestros productos, menú, horarios o servicios.</li>
          <li>Mejorar la funcionalidad y experiencia del sitio web.</li>
          <li>Analizar de manera general cómo los visitantes utilizan nuestra página.</li>
          <li>Mantener la seguridad y funcionamiento del sitio.</li>
        </ul>
        <p>No vendemos ni alquilamos información personal de nuestros usuarios.</p>

        <h2>3. Cookies y tecnologías similares</h2>
        <p>
          Nuestro sitio puede utilizar cookies u otras tecnologías similares para facilitar su funcionamiento, analizar
          tráfico o mejorar la experiencia del visitante.
        </p>
        <p>
          Algunos servicios de terceros integrados en el sitio también pueden utilizar sus propias cookies de acuerdo
          con sus respectivas políticas de privacidad.
        </p>

        <h2>4. Servicios de terceros</h2>
        <p>
          Nuestro sitio puede contener enlaces o integraciones con servicios externos, incluyendo plataformas como Google
          Maps, Facebook, Instagram u otros servicios de terceros.
        </p>
        <p>
          Tripletas La Unión no controla las prácticas de privacidad de estos servicios externos. Recomendamos revisar
          las políticas de privacidad correspondientes antes de proporcionar información personal en dichas plataformas.
        </p>

        <h2>5. Seguridad de la información</h2>
        <p>
          Tomamos medidas razonables para proteger la información proporcionada a través del sitio. Sin embargo, ningún
          sistema de transmisión o almacenamiento de datos por Internet puede garantizar seguridad absoluta.
        </p>

        <h2>6. Privacidad de menores</h2>
        <p>Este sitio no está diseñado para recopilar intencionalmente información personal de menores de edad.</p>

        <h2>7. Cambios a esta política</h2>
        <p>
          Podemos actualizar esta Política de Privacidad ocasionalmente. Cualquier modificación será publicada en esta
          misma página junto con la fecha de actualización correspondiente.
        </p>

        <h2>8. Contacto</h2>
        <p>Si tienes preguntas sobre esta Política de Privacidad, puedes comunicarte con:</p>
        <address>
          <strong>Tripletas La Unión</strong>
          <span>Av. Piñero: 787-630-3884</span>
          <span>65 de Infantería: 787-634-6771</span>
          <span>Correo electrónico: No publicado en este momento.</span>
        </address>
      </section>
    </main>
  );
}

function TermsOfUsePage() {
  return (
    <main className="page">
      <PageHero eyebrow="Legal" title="Términos de Uso" copy="Última actualización: 1 de septiembre de 2026" />
      <section className="section policy-page" aria-label="Términos de Uso">
        <p>
          Bienvenido al sitio web de <strong>Tripletas La Unión</strong>. Al acceder o utilizar este sitio, aceptas los
          siguientes Términos de Uso.
        </p>

        <h2>1. Propósito del sitio web</h2>
        <p>
          Este sitio tiene como propósito proporcionar información relacionada con Tripletas La Unión, incluyendo
          productos, menú, horarios, ubicación, promociones, información de contacto y otros datos relacionados con el
          negocio.
        </p>

        <h2>2. Información del menú</h2>
        <p>
          Hacemos todo lo posible por mantener la información del sitio actualizada. Sin embargo, los productos,
          ingredientes, promociones, disponibilidad y horarios pueden cambiar sin previo aviso.
        </p>
        <p>
          En caso de existir alguna diferencia entre la información publicada en el sitio web y la información
          proporcionada directamente en el establecimiento, prevalecerá la información disponible en el establecimiento.
        </p>

        <h2>3. Fotografías de productos</h2>
        <p>
          Las fotografías utilizadas en el sitio tienen fines ilustrativos. La apariencia, tamaño, presentación o
          ingredientes de los productos pueden variar ligeramente.
        </p>

        <h2>4. Disponibilidad de productos</h2>
        <p>Algunos productos pueden estar sujetos a disponibilidad y pueden agotarse o modificarse sin previo aviso.</p>

        <h2>5. Alergias e ingredientes</h2>
        <p>
          Los clientes con alergias o restricciones alimentarias deben informarlo directamente al personal antes de
          realizar un pedido.
        </p>
        <p>
          Aunque tomamos precauciones razonables durante la preparación de alimentos, no podemos garantizar que los
          productos estén completamente libres de contacto con ingredientes o alérgenos utilizados dentro de nuestras
          instalaciones.
        </p>

        <h2>6. Propiedad intelectual</h2>
        <p>
          El contenido de este sitio, incluyendo fotografías, logotipos, nombres comerciales, diseños, textos, gráficos
          y otros materiales relacionados con Tripletas La Unión, pertenece a sus respectivos propietarios y está
          protegido por las leyes aplicables.
        </p>
        <p>No se permite copiar, reproducir, distribuir o utilizar este contenido con fines comerciales sin autorización previa.</p>

        <h2>7. Enlaces externos</h2>
        <p>El sitio puede incluir enlaces a páginas o servicios de terceros.</p>
        <p>
          Tripletas La Unión no controla ni se responsabiliza por el contenido, disponibilidad, políticas o prácticas de
          esos sitios externos.
        </p>

        <h2>8. Uso apropiado del sitio</h2>
        <p>El usuario acepta no utilizar este sitio para:</p>
        <ul>
          <li>Intentar obtener acceso no autorizado a sistemas o servidores.</li>
          <li>Introducir código malicioso, virus u otros elementos dañinos.</li>
          <li>Interferir con el funcionamiento normal del sitio.</li>
          <li>Utilizar el contenido del sitio de forma fraudulenta o ilegal.</li>
        </ul>

        <h2>9. Limitación de responsabilidad</h2>
        <p>
          Tripletas La Unión procura mantener la información de este sitio correcta y disponible. Sin embargo, no
          garantiza que el sitio permanezca libre de errores, interrupciones o información desactualizada en todo
          momento.
        </p>
        <p>
          Dentro de lo permitido por la ley, Tripletas La Unión no será responsable por daños derivados exclusivamente
          del uso o imposibilidad de uso del sitio web.
        </p>

        <h2>10. Cambios al sitio o a estos términos</h2>
        <p>Podemos modificar el contenido del sitio o estos Términos de Uso en cualquier momento.</p>
        <p>Los cambios entrarán en vigor desde el momento en que sean publicados en esta página.</p>

        <h2>11. Ley aplicable</h2>
        <p>
          Estos Términos de Uso se interpretarán de acuerdo con las leyes aplicables del{" "}
          <strong>Estado Libre Asociado de Puerto Rico y las leyes federales de los Estados Unidos</strong>, según
          corresponda.
        </p>

        <h2>12. Contacto</h2>
        <p>Para preguntas relacionadas con estos Términos de Uso:</p>
        <address>
          <strong>Tripletas La Unión</strong>
          <span>Av. Piñero: 787-630-3884</span>
          <span>65 de Infantería: 787-634-6771</span>
          <span>Correo electrónico: No publicado en este momento.</span>
        </address>
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
          <h3>Métodos de pago</h3>
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
        <p>Tripletas que rompen. Dos ubicaciones en Puerto Rico.</p>
      </div>
      <div className="footer-groups">
        <nav className="footer-group" aria-label="Navegación del footer">
          <span>Explora</span>
          <Link href="/">Inicio</Link>
          <Link href="/menu">Menú</Link>
          <Link href="/locations">Ubicaciones</Link>
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
        <div className="footer-credit">
          {business.featureFlags.developerCredit ? (
            <span>
              Built by{" "}
              <a href="https://firstlinedev.com" target="_blank" rel="noreferrer">
                FirstLine Development
              </a>
            </span>
          ) : null}
        </div>
        <div className="footer-legal-links">
          <Link href="/privacy">Políticas de Privacidad</Link>
          <Link href="/terms">Términos de Uso</Link>
        </div>
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
