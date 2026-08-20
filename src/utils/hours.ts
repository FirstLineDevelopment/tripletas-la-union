import type { DayKey, HoursRange, Location } from "../types";

const dayKeys: DayKey[] = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const dayLabels: Record<DayKey, string> = {
  monday: "lunes",
  tuesday: "martes",
  wednesday: "miércoles",
  thursday: "jueves",
  friday: "viernes",
  saturday: "sábado",
  sunday: "domingo",
};

const toMinutes = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

export const getPuertoRicoDateParts = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Puerto_Rico",
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const weekday = parts.find((part) => part.type === "weekday")?.value.toLowerCase() ?? "sunday";
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? "0");
  return {
    day: weekday as DayKey,
    minutes: hour * 60 + minute,
  };
};

export const dayLabel = (day: DayKey) => dayLabels[day];

export const getTodayHours = (location: Location, date = new Date()) => {
  const { day } = getPuertoRicoDateParts(date);
  return location.hours[day];
};

export const formatHours = (ranges: HoursRange[]) => ranges.map((range) => range.label).join(", ");

export const getOpenState = (location: Location, date = new Date()) => {
  const { day, minutes } = getPuertoRicoDateParts(date);
  const todayIndex = dayKeys.indexOf(day);
  const yesterday = dayKeys[(todayIndex + 6) % 7];

  const isWithin = (range: HoursRange, now: number, fromPreviousDay: boolean) => {
    const open = toMinutes(range.open);
    const closeBase = toMinutes(range.close);
    const close = closeBase <= open ? closeBase + 1440 : closeBase;
    const adjustedNow = fromPreviousDay ? now + 1440 : now;
    return adjustedNow >= open && adjustedNow < close;
  };

  const openToday = location.hours[day].some((range) => isWithin(range, minutes, false));
  const openFromYesterday = location.hours[yesterday].some((range) => {
    const open = toMinutes(range.open);
    const close = toMinutes(range.close);
    return close <= open && isWithin(range, minutes, true);
  });

  return {
    isOpen: openToday || openFromYesterday,
    label: openToday || openFromYesterday ? "Abierto ahora" : "Cerrado ahora",
    todayLabel: formatHours(location.hours[day]),
  };
};

export const openingHoursSpecification = (location: Location) =>
  Object.entries(location.hours).flatMap(([day, ranges]) =>
    ranges.map((range) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: `https://schema.org/${day.charAt(0).toUpperCase()}${day.slice(1)}`,
      opens: range.open,
      closes: range.close,
    })),
  );
