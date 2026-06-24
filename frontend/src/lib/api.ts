"use client";
import axios from "axios";
import { signOut, getSession } from "next-auth/react";

const api = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL });

api.interceptors.request.use(
    async (config) => {
        const session = await getSession();
        const token = session?.accessToken;

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (res) => res,
    async (err) => {
        if (err?.response?.status === 401) {
            console.warn("🚨 [401 Unauthorized] Token expired or invalid. Logging out...");
            try {
                await signOut({ redirect: false });

                if (typeof window !== "undefined") {
                    window.location.href = "/login";
                }
            } catch (e) {
                if (typeof window !== "undefined") {
                    window.location.href = "/login";
                }
            }
        }
        return Promise.reject(err);
    }
);

export default api;