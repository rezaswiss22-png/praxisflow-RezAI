import { z } from "zod";
import { router, protectedProcedure } from "../trpc";

export const notificationRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.notification.findMany({
      where: { tenantId: ctx.tenantId, userId: ctx.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }),

  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.notification.count({
      where: { tenantId: ctx.tenantId, userId: ctx.user.id, isRead: false },
    });
  }),

  markRead: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.notification.updateMany({
        where: { id: input.id, tenantId: ctx.tenantId, userId: ctx.user.id },
        data: { isRead: true, readAt: new Date() },
      });
    }),

  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    return ctx.prisma.notification.updateMany({
      where: { tenantId: ctx.tenantId, userId: ctx.user.id, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }),
});
