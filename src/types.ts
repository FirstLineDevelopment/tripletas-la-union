export type DayKey = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

export type HoursRange = {
  open: string;
  close: string;
  label: string;
};

export type PaymentMethod = {
  id: "cash" | "athDebit" | "creditCard" | "athMovil" | "visa" | "mastercard" | "other";
  label: string;
  verified: boolean;
};

export type Location = {
  id: "caguas" | "pinero" | "65-infanteria";
  shortName: string;
  name: string;
  addressLines: string[];
  description?: string;
  phone: string;
  telUri: string;
  mapsUrl: string;
  wazeUrl: string;
  coordinates: { lat: number; lng: number };
  hours: Record<DayKey, HoursRange[]>;
  characteristics: string[];
  paymentMethods: PaymentMethod[];
  socials: {
    instagram?: string;
    facebook?: string;
  };
  image: string;
};

export type MenuCategory = "tripletas" | "sandwiches" | "platos-wraps" | "papas" | "especiales";

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  category: MenuCategory;
  image: string;
  badges: string[];
  availableLocations: Location["id"][];
  featured: boolean;
  active: boolean;
  sortOrder: number;
};
