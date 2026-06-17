import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validators/auth";

function maskEmail(email: string) {
  const [name, domain] = email.split("@");

  if (!domain) {
    return "invalid-email";
  }

  return `${name.slice(0, 2)}***@${domain}`;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsedCredentials = loginSchema.safeParse(credentials);

        if (!parsedCredentials.success) {
          console.warn("[auth][credentials] invalid credentials payload");
          return null;
        }

        const email = parsedCredentials.data.email;
        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          console.warn("[auth][credentials] user not found", {
            email: maskEmail(email),
          });
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          parsedCredentials.data.password,
          user.password,
        );

        if (!isPasswordValid) {
          console.warn("[auth][credentials] invalid password", {
            email: maskEmail(email),
            userId: user.id,
          });
          return null;
        }

        console.info("[auth][credentials] signed in", {
          email: maskEmail(email),
          userId: user.id,
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }

      return session;
    },
  },
});
