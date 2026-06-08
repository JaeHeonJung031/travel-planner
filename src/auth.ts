import NextAuth from "next-auth";
import type { Provider } from "next-auth/providers";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import Kakao from "next-auth/providers/kakao";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authConfig } from "@/auth.config";
import { syncKakaoUserForNotifications } from "@/features/notifications/server/kakao/sync-kakao-user";
import { prisma } from "@/server/db/prisma";

const providers: Provider[] = [
  Credentials({
    name: "email",
    credentials: {
      email: { label: "이메일", type: "email" },
      password: { label: "비밀번호", type: "password" },
    },
    async authorize(credentials) {
      const email = credentials?.email as string | undefined;
      const password = credentials?.password as string | undefined;
      if (!email || !password) return null;

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user?.passwordHash) return null;

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) return null;

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
      };
    },
  }),
];

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
  );
}

if (process.env.AUTH_KAKAO_ID && process.env.AUTH_KAKAO_SECRET) {
  providers.push(
    Kakao({
      id: "kakao",
      clientId: process.env.AUTH_KAKAO_ID,
      clientSecret: process.env.AUTH_KAKAO_SECRET,
      allowDangerousEmailAccountLinking: true,
      authorization: {
        url: "https://kauth.kakao.com/oauth/authorize",
        params: {
          // account_email 은 카카오 콘솔 동의항목에서 별도 활성화 필요 — 없으면 KOE205
          scope: "profile_nickname profile_image talk_message",
        },
      },
      profile(profile) {
        const account = profile.kakao_account;
        const kakaoProfile = account?.profile;
        return {
          id: String(profile.id),
          name: kakaoProfile?.nickname ?? `카카오${profile.id}`,
          email: account?.email ?? `kakao_${profile.id}@users.nippon.local`,
          image: kakaoProfile?.profile_image_url ?? null,
        };
      },
    }),
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers,
  events: {
    async signIn({ user, account }) {
      if (account?.provider === "kakao" && account.providerAccountId && user.id) {
        await syncKakaoUserForNotifications(user.id, account.providerAccountId);
      }
    },
  },
});
