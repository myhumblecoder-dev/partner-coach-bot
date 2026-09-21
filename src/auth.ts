import NextAuth from 'next-auth';
import Email from 'next-auth/providers/email';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/db';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Email({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
    }),
  ],
  callbacks: {
    // Without this, exporting `auth` as middleware protects NOTHING.
    // next-auth's handleAuth starts from `let authorized = true` and only
    // narrows it when this callback exists, so the middleware was attaching
    // a session and calling next() for every request — /portrait answered
    // 200 to anyone, and `/` redirects straight to it.
    authorized: ({ auth }) => Boolean(auth?.user),
  },
});