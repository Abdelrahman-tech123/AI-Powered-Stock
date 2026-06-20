"use client";
import axios from "axios";
import { signOut } from "next-auth/react";

const api = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL });

// Global 401 handler: sign out and redirect to login when backend rejects the token
api.interceptors.response.use(
    (res) => res,
    async (err) => {
        if (err?.response?.status === 401) {
            try {
                await signOut({ callbackUrl: "/login" });
            } catch (e) {
                // ignore
            }
        }
        return Promise.reject(err);
    }
);

export default api;
