import type { FileRoutesByFullPath } from "../../routeTree.gen";

export type RouterPath = keyof FileRoutesByFullPath;

export type EventsView = "cards" | "calendar";
export type CalendarView = "day" | "week" | "month";

export const CALENDAR_MAX_PER_DAY = 3;

/**
 * mirror structure of variants.ts
 * any new modals added, just add them here
 */

const ModalOption = {
  0: "login", // LoginModal,
  1: "create_account", // CreateAccountModal,
  2: "event_detail", // EventDetailModal,
  3: "create_event", // CreateEventModal,
} as const;

export type ModalOption = (typeof ModalOption)[keyof typeof ModalOption] | undefined;