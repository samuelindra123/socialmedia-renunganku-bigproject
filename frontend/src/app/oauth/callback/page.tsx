"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Cookies from "js-cookie";
import { Loader2 } from "lucide-react";
import useAuthStore from "@/store/auth";

export default function OAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Menyiapkan sesi aman...");

  useEffect(() => {
    const token = searchParams.get("token");
    const sessionToken = searchParams.get("sessionToken");
    const redirect = searchParams.get("redirect") || "/feed";

    if (!token || !sessionToken) {
      const id = requestAnimationFrame(() => {
        setMessage("Token OAuth tidak ditemukan.");
      });
      return () => cancelAnimationFrame(id);
    }

    const persistSession = async () => {
      try {
        localStorage.setItem("auth_token", token);
        localStorage.setItem("session_token", sessionToken);
        Cookies.set("token", token, { expires: 7, secure: true, sameSite: "strict" });
        await useAuthStore.getState().checkAuth();
        router.replace(redirect);
      } catch (error) {
        console.error(error);
        const id = requestAnimationFrame(() => {
          setMessage("Gagal menyimpan sesi OAuth.");
        });
        return () => cancelAnimationFrame(id);
      }
    };

    persistSession();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-6">
      <div className="rounded-3xl bg-white shadow-xl p-10 text-center space-y-4">
        <Loader2 className="mx-auto h-10 w-10 animate-spin text-slate-900" />
        <p className="text-sm font-semibold text-slate-700">{message}</p>
        <p className="text-xs text-slate-400">Jangan tutup jendela ini, kami sedang mengamankan akunmu.</p>
      </div>
    </div>
  );
}
