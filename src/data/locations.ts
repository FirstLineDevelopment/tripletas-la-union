import type { DayKey, Location, PaymentMethod } from "../types";
import { socials } from "./socials";

const standardHours: Location["hours"] = {
  monday: [{ open: "18:30", close: "02:00", label: "6:30 PM - 2:00 AM" }],
  tuesday: [{ open: "18:30", close: "02:00", label: "6:30 PM - 2:00 AM" }],
  wednesday: [{ open: "18:30", close: "02:00", label: "6:30 PM - 2:00 AM" }],
  thursday: [{ open: "18:30", close: "02:00", label: "6:30 PM - 2:00 AM" }],
  friday: [{ open: "18:30", close: "04:00", label: "6:30 PM - 4:00 AM" }],
  saturday: [{ open: "18:30", close: "04:00", label: "6:30 PM - 4:00 AM" }],
  sunday: [{ open: "18:30", close: "02:00", label: "6:30 PM - 2:00 AM" }],
};

const paymentMethods = (verifiedIds: PaymentMethod["id"][]): PaymentMethod[] =>
  [
    { id: "cash", label: "Efectivo", verified: verifiedIds.includes("cash") },
    { id: "athDebit", label: "ATH / débito", verified: verifiedIds.includes("athDebit") },
    { id: "creditCard", label: "Tarjeta de crédito", verified: verifiedIds.includes("creditCard") },
    { id: "athMovil", label: "ATH Móvil", verified: verifiedIds.includes("athMovil") },
    { id: "visa", label: "Visa", verified: verifiedIds.includes("visa") },
    { id: "mastercard", label: "Mastercard", verified: verifiedIds.includes("mastercard") },
  ];

export const locations: Location[] = [
  {
    id: "caguas",
    shortName: "Caguas",
    name: "Tripletas La Unión - Caguas",
    addressLines: ["PR-189", "Caguas, Puerto Rico 00725"],
    description:
      "Carretera 189, en el área entre la gasolinera Toral/To Go y KFC, cerca de la entrada hacia Cementerio Monte Calvario.",
    phone: "787-509-3730",
    telUri: "tel:+17875093730",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Tripletas%20La%20Union%20Caguas%20PR-189",
    wazeUrl: "https://waze.com/ul?q=Tripletas%20La%20Union%20Caguas%20PR-189&navigate=yes",
    coordinates: { lat: 18.2387, lng: -66.0338 },
    hours: standardHours,
    characteristics: ["Takeout", "Asientos al aire libre", "Servicio nocturno"],
    paymentMethods: paymentMethods(["cash", "athMovil"]),
    socials: {
      instagram: socials.caguasInstagram.url,
      facebook: socials.caguasFacebook.url,
    },
    image: "/images/locations/Caguas.PNG",
  },
  {
    id: "pinero",
    shortName: "Av. Piñero",
    name: "Tripletas La Unión - Piñero",
    addressLines: ["274 Av. Jesús T. Piñero", "San Juan, Puerto Rico 00927"],
    phone: "787-630-3884",
    telUri: "tel:+17876303884",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=274%20Av.%20Jesus%20T.%20Pinero%20San%20Juan%20Puerto%20Rico%2000927",
    wazeUrl: "https://waze.com/ul?q=274%20Av.%20Jesus%20T.%20Pinero%20San%20Juan%20Puerto%20Rico%2000927&navigate=yes",
    coordinates: { lat: 18.4082, lng: -66.0633 },
    hours: standardHours,
    characteristics: ["Takeout", "Servicio nocturno", "San Juan"],
    paymentMethods: paymentMethods(["cash", "athMovil"]),
    socials: {
      instagram: socials.metroInstagram.url,
    },
    image: "/images/locations/Piñeiro.PNG",
  },
  {
    id: "65-infanteria",
    shortName: "65 de Infantería",
    name: "Tripletas La Unión - 65 de Infantería",
    addressLines: ["Av. 65 de Infantería", "San Juan, Puerto Rico 00924"],
    phone: "787-634-6771",
    telUri: "tel:+17876346771",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Tripletas%20La%20Union%2065%20de%20Infanteria%20San%20Juan%20Puerto%20Rico%2000924",
    wazeUrl: "https://waze.com/ul?q=Tripletas%20La%20Union%2065%20de%20Infanteria%20San%20Juan%20Puerto%20Rico%2000924&navigate=yes",
    coordinates: { lat: 18.4026, lng: -66.0127 },
    hours: standardHours,
    characteristics: ["Takeout", "Servicio nocturno", "San Juan"],
    paymentMethods: paymentMethods(["cash", "athMovil"]),
    socials: {
      instagram: socials.metroInstagram.url,
    },
    image: "/images/locations/65deInfanteria.PNG",
  },
];

export const getLocationById = (id: string) => locations.find((location) => location.id === id);
