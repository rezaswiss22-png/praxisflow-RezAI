"use client";

import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@/server/routers/_app";

/** Typsicherer tRPC-React-Client (Hooks). */
export const trpc = createTRPCReact<AppRouter>();
