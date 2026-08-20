import { business } from "../data/business";

export type AnalyticsEvent =
  | "call_location"
  | "directions_location"
  | "menu_view"
  | "instagram_click"
  | "facebook_click"
  | "location_selected";

export const trackEvent = (event: AnalyticsEvent, payload: Record<string, string> = {}) => {
  if (!business.analytics.enabled) return;
  window.dispatchEvent(new CustomEvent("tlu:analytics", { detail: { event, payload } }));
};
