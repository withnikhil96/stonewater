import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      role?: string
    } & DefaultSession["user"]
  }
  interface User {
    role?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string
  }
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt"
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (credentials?.username === process.env.ADMIN_USERNAME && 
            credentials?.password === process.env.ADMIN_PASSWORD) {
          return {
            id: "1",
            name: "Admin",
            email: "admin@example.com",
            role: "admin"
          }
        }
        return null
      }
    })
  ],
  pages: {
    signIn: '/admin/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.role = token.role
      }
      return session
    }
  }
} 