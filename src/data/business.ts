import { locations } from "./locations";
import { socials } from "./socials";

export const business = {
  brandName: "Tripletas La Unión",
  brandNameUnaccented: "Tripletas La Union",
  tagline: "Tripletas que rompen.",
  seoDescription:
    "Tripletas, churrasco, pastrami, wraps y papas locas en Caguas, Av. Piñero y 65 de Infantería.",
  email: null as string | null,
  socialLinks: socials,
  locations,
  featureFlags: {
    onlineOrdering: false,
    delivery: false,
    catering: false,
    englishLanguage: false,
    analytics: false,
    developerCredit: false,
  },
  analytics: {
    enabled: false,
  },
};
