import { NextApiHandler } from 'next'
import NextAuth from 'next-auth'
import EmailProvider from 'next-auth/providers/email'
import GitHubProvider from 'next-auth/providers/github'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from '@prisma/client'

// too many connections during local development
let prisma: PrismaClient

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient()
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient()
  }
  prisma = global.prisma
}

const options = {
  providers: [
    EmailProvider({
      server: process.env.EMAIL_SERVER, 
      from: process.env.EMAIL_FROM
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET
    }),
    CredentialsProvider({
      // The name to display on the sign in form (e.g. "Sign in with...")
      name: "Credentials",
      // The credentials is used to generate a suitable form on the sign in page.
      // You can specify whatever fields you are expecting to be submitted.
      // e.g. domain, username, password, 2FA token, etc.
      // You can pass any HTML attribute to the <input> tag through the object.
      credentials: {
        username: { label: "Username", type: "text", placeholder: "jsmith" },
        password: {  label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        // Add logic here to look up the user from the credentials supplied
        //const user = { id: 1, name: "J Smith", email: "jsmith@example.com" }

        const user = await prisma.user.findFirst({
          where: {
            email: "andrew.c.corbin@gmail.com",
          },
        })
        console.log("db user:")
        console.log(user.email)

        console.log(user)
        if (user) {
          // Any object returned will be saved in `user` property of the JWT
          return user
        } else {
          // If you return null then an error will be displayed advising the user to check their details.
          return null
  
          // You can also Reject this callback with an Error thus the user will be sent to the error page with the error message as a query parameter
        }
      }
    }),
    
  ],

  adapter: PrismaAdapter(prisma),
  session: {
    // Choose how you want to save the user session.
    // The default is `"jwt"`, an encrypted JWT (JWE) stored in the session cookie.
    // If you use an `adapter` however, we default it to `"database"` instead.
    // You can still force a JWT session by explicitly defining `"jwt"`.
    // When using `"database"`, the session cookie will only contain a `sessionToken` value,
    // which is used to look up the session in the database.
    strategy: "jwt",
  
    // Seconds - How long until an idle session expires and is no longer valid.
    maxAge: 30 * 24 * 60 * 60, // 30 days
  
    // Seconds - Throttle how frequently to write to database to extend a session.
    // Use it to limit write operations. Set to 0 to always update the database.
    // Note: This option is ignored if using JSON Web Tokens
    updateAge: 24 * 60 * 60, // 24 hours
  },

  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      console.log("signIn")
      console.log("user:", user)
      console.log("account:", account)
      console.log("profile:", profile)
      console.log("email:", email)
      console.log("credentials:", credentials)

      return true
    },
    async redirect({ url, baseUrl }) {
      console.log("redirect")
      console.log("url:", url)
      console.log("baseUrl:", baseUrl)
      return baseUrl
    },
    async session({ session, user, token }) {
      console.log("session")
      console.log("session:", session)
      console.log("user:", user)
      console.log("token:", token)
      session.accessToken = token.accessToken
      return session
    },
    async jwt({ token, user, account, profile, isNewUser }) {
      if (account) {
        token.accessToken = account.access_token
      }
      console.log("jwt")
      console.log("token:", token)
      console.log("user:", user)
      console.log("account:", account)
      console.log("profile:", profile)
      console.log("isNewUser:", isNewUser)
      return token
    } 
  }


}

const authHandler: NextApiHandler = (req, res) => NextAuth(req, res, options)

export default authHandler
