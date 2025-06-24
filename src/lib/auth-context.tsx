"use client";

import { createContext, useContext, useEffect, useState, useRef } from "react";
import { User } from "@supabase/supabase-js";
import { supabase, auth } from "./supabase";
import { Profile } from "./database.types";
import { initializeUserData } from "./api/setup";

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, name?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const profileLoadingRef = useRef(false);
  const sessionCheckRef = useRef(false);

  // セッション復元とプロファイル読み込み
  const initializeAuth = async () => {
    if (sessionCheckRef.current) return;
    sessionCheckRef.current = true;

    try {
      console.log("🔐 認証状態初期化開始");

      // 現在のセッションを取得
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("❌ セッション取得エラー:", sessionError);
        setLoading(false);
        return;
      }

      console.log("📋 セッション状態:", session ? "有効" : "無効");

      if (session?.user) {
        setUser(session.user);
        await loadProfile(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    } catch (error) {
      console.error("❌ 認証初期化エラー:", error);
      setLoading(false);
    } finally {
      sessionCheckRef.current = false;
    }
  };

  // セッション更新関数
  const refreshSession = async () => {
    try {
      console.log("🔄 セッション更新開始");
      const {
        data: { session },
        error,
      } = await supabase.auth.refreshSession();

      if (error) {
        console.error("❌ セッション更新エラー:", error);
        return;
      }

      if (session?.user) {
        setUser(session.user);
        await loadProfile(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
      }
    } catch (error) {
      console.error("❌ セッション更新例外:", error);
    }
  };

  useEffect(() => {
    // 初期認証状態の設定
    initializeAuth();

    // 認証状態の変更を監視
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔐 認証状態変更:", event);

      setUser(session?.user ?? null);
      if (session?.user) {
        await loadProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    // ページフォーカス時のセッション確認
    const handleFocus = () => {
      if (user) {
        console.log("🔄 ページフォーカス - セッション確認");
        refreshSession();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && user) {
        console.log("👁️ ページ可視化 - セッション確認");
        refreshSession();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const loadProfile = async (userId: string) => {
    if (profileLoadingRef.current) return;

    try {
      profileLoadingRef.current = true;
      console.log("👤 プロファイル読み込み開始:", userId);

      // まず通常のプロファイル取得を試行
      const { data, error } = await auth.getProfile(userId);

      if (error || !data) {
        console.log("プロファイルが見つかりません。初期化を実行します...");
        // プロファイルが見つからない場合は初期化を実行
        const user = await auth.getCurrentUser();
        if (user) {
          const { profile } = await initializeUserData(
            userId,
            user.email!,
            user.user_metadata?.name
          );
          setProfile(profile);
        }
      } else {
        setProfile(data);
        // プロファイルはあるが制作状況がない可能性もあるので、制作状況も確認
        try {
          const { data: statuses } = await supabase
            .from("project_statuses")
            .select("*")
            .eq("user_id", userId)
            .limit(1);

          if (!statuses || statuses.length === 0) {
            console.log("制作状況が見つかりません。初期化を実行します...");
            await initializeUserData(userId, data.email, data.name || undefined);
          }
        } catch (statusError) {
          console.error("制作状況確認エラー:", statusError);
        }
      }
    } catch (error) {
      console.error("プロファイル取得エラー:", error);
    } finally {
      setLoading(false);
      profileLoadingRef.current = false;
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    console.log("🔐 ログイン試行開始:", { email });

    try {
      const { error } = await auth.signIn(email, password);

      if (error) {
        console.error("❌ ログインエラー詳細:", {
          message: (error as any)?.message,
          status: (error as any)?.status,
          statusText: (error as any)?.statusText,
          name: (error as any)?.name,
          stack: (error as any)?.stack,
          fullError: error,
        });
        setLoading(false);
        return { error };
      }

      console.log("✅ ログイン成功");
      return { error: null };
    } catch (err) {
      console.error("❌ ログイン例外エラー:", err);
      setLoading(false);
      return { error: err };
    }
  };

  const signUp = async (email: string, password: string, name?: string) => {
    setLoading(true);
    const { error } = await auth.signUp(email, password, name);
    if (error) {
      setLoading(false);
    }
    return { error };
  };

  const signOut = async () => {
    setLoading(true);
    await auth.signOut();
    setUser(null);
    setProfile(null);
    setLoading(false);
  };

  const value = {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
