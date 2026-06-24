import NextAuth, { DefaultSession } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
    /**
     * لتوسيع نوع الـ Session وإضافة الـ accessToken
     */
    interface Session {
        accessToken?: string;
        user: {
            id?: string;
        } & DefaultSession["user"];
    }

    /**
     * لتوسيع نوع الـ User القادم من دالة authorize
     */
    interface User {
        id?: string;
        accessToken?: string;
    }
}

declare module "next-auth/jwt" {
    /**
     * لتوسيع نوع الـ JWT لتتعرف على الـ accessToken أيضاً
     */
    interface JWT {
        accessToken?: string;
        id?: string;
    }
}