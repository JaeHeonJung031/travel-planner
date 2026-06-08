/** 서버 전용 — API 라우트·서버 컴포넌트에서만 import */
export { prisma } from "./db/prisma";
export { aiAdapter } from "./ai/adapter";
export type * from "./ai/types";
