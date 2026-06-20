import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import axios from "axios";

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                try {
                    // إذا كان الـ FastAPI عندك في الـ Login بياخد (email و password) كـ JSON عادي:
                    const response = await axios.post(
                        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`,
                        {
                            email: credentials?.email || "",
                            password: credentials?.password || ""
                        },
                        {
                            headers: { "Content-Type": "application/json" },
                        }
                    );

                    // backend returns { access_token, token_type, user }
                    const data = response.data;

                    if (!data) {
                        console.error("Empty response from API login", response);
                        return null;
                    }

                    const accessToken = data.access_token;
                    const user = data.user;

                    if (!accessToken || !user) {
                        console.error("Unexpected login response shape", data);
                        return null;
                    }

                    return {
                        id: user.id as any || user.user_id || "1",
                        name: user.name || user.username || "User",
                        email: user.email || credentials?.email,
                        accessToken: accessToken,
                    };
                } catch (error: any) {
                    // السطر ده هيطبعلك في ترمنال الـ Next.js الـ 422 دي سببها إيه بالظبط من الـ FastAPI
                    console.error("FastAPI Validation Error Details:", error.response?.data?.detail);
                    return null;
                }
            }
        })
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.accessToken = (user as any).accessToken;
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (token) {
                (session as any).accessToken = token.accessToken;
                (session as any).user.id = token.id;
            }
            return session;
        }
    },
    pages: {
        signIn: "/login",
    },
    secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };