import { router } from "../trpc";
import { patientRouter } from "./patient";
import { eingangRouter } from "./eingang";
import { vorgangRouter } from "./vorgang";
import { taskRouter } from "./task";
import { freigabeRouter } from "./freigabe";
import { documentRouter } from "./document";
import { appointmentRouter } from "./appointment";
import { callbackRouter } from "./callback";
import { auditRouter } from "./audit";
import { userRouter } from "./user";
import { adapterRouter } from "./adapter";
import { notificationRouter } from "./notification";
import { dashboardRouter } from "./dashboard";

/**
 * Wurzel-Router (AppRouter).
 * Kombiniert alle fachlichen Sub-Router zu einer typsicheren API.
 */
export const appRouter = router({
  patient: patientRouter,
  eingang: eingangRouter,
  vorgang: vorgangRouter,
  task: taskRouter,
  freigabe: freigabeRouter,
  document: documentRouter,
  appointment: appointmentRouter,
  callback: callbackRouter,
  audit: auditRouter,
  user: userRouter,
  adapter: adapterRouter,
  notification: notificationRouter,
  dashboard: dashboardRouter,
});

export type AppRouter = typeof appRouter;
