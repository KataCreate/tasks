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
  const [mounted, setMounted] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const profileLoadingRef = useRef(false);
  const sessionCheckRef = useRef(false);
  const lastRefreshRef = useRef(0);

  // マウント状態の管理
  useEffect(() => {
    setMounted(true);
  }, []);

  // セッション復元とプロファイル読み込み
  const initializeAuth = async () => {
    if (sessionCheckRef.current) {
      console.log("⏭️ 認証初期化中 - スキップ");
      return;
    }
    sessionCheckRef.current = true;

    try {
      console.log("🔐 認証状態初期化開始");

      // タイムアウト付きでセッション取得を実行
      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise<{ data: { session: null }; error: null }>((resolve) => {
        setTimeout(() => {
          console.warn("⚠️ セッション取得タイムアウト");
          resolve({ data: { session: null }, error: null });
        }, 5000);
      });

      const {
        data: { session },
        error: sessionError,
      } = await Promise.race([sessionPromise, timeoutPromise]);

      if (sessionError) {
        console.error("❌ セッション取得エラー:", sessionError);
        setLoading(false);
        setInitialized(true);
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
      setInitialized(true);
      sessionCheckRef.current = false;
    }
  };

  // セッション更新関数
  const refreshSession = async () => {
    // 前回の更新から5秒以内ならスキップ
    const now = Date.now();
    if (now - lastRefreshRef.current < 5000) {
      console.log("⏭️ セッション更新をスキップ（前回から5秒以内）");
      return;
    }
    lastRefreshRef.current = now;

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
        // プロファイルが既に読み込まれている場合は再読み込みしない
        if (!profile || profile.id !== session.user.id) {
          await loadProfile(session.user.id);
        } else {
          console.log("⏭️ プロファイルは既に読み込み済み - スキップ");
        }
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

      // 初期化が完了していない場合は処理をスキップ
      if (!initialized) {
        console.log("⏭️ 初期化未完了 - 認証状態変更をスキップ");
        return;
      }

      try {
        if (session?.user) {
          console.log("✅ ユーザーログイン:", session.user.email);
          setUser(session.user);
          // プロファイルが既に読み込まれている場合は再読み込みしない
          if (!profile || profile.id !== session.user.id) {
            await loadProfile(session.user.id);
          } else {
            console.log("⏭️ プロファイルは既に読み込み済み - スキップ");
            setLoading(false);
          }
        } else {
          console.log("🔓 ユーザーがログアウト");
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      } catch (error) {
        console.error("❌ 認証状態変更処理エラー:", error);
        setLoading(false);
      }
    });

    // ページフォーカス時のセッション確認を無効化
    // const handleFocus = () => {
    //   if (user) {
    //     console.log("🔄 ページフォーカス - セッション確認");
    //     refreshSession();
    //   }
    // };

    // const handleVisibilityChange = () => {
    //   if (document.visibilityState === "visible" && user) {
    //     console.log("👁️ ページ可視化 - セッション確認");
    //     refreshSession();
    //   }
    // };

    // window.addEventListener("focus", handleFocus);
    // document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      subscription.unsubscribe();
      // window.removeEventListener("focus", handleFocus);
      // document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [initialized]);

  const loadProfile = async (userId: string) => {
    if (profileLoadingRef.current) {
      console.log("⏭️ プロファイル読み込み中 - スキップ");
      return;
    }

    try {
      profileLoadingRef.current = true;
      console.log("👤 プロファイル読み込み開始:", userId);

      // タイムアウト付きでプロファイル取得を実行
      const profilePromise = (async () => {
        try {
          // まず通常のプロファイル取得を試行
          const { data, error } = await auth.getProfile(userId);

          if (error || !data) {
            console.log("プロファイルが見つかりません。初期化を実行します...");
            // プロファイルが見つからない場合は初期化を実行
            const user = await auth.getCurrentUser();
            if (user) {
              try {
                const { profile } = await initializeUserData(
                  userId,
                  user.email!,
                  user.user_metadata?.name
                );
                return profile;
              } catch (initError) {
                console.error("❌ プロファイル初期化エラー:", initError);
                return null;
              }
            }
            return null;
          } else {
            console.log("✅ 既存プロファイル取得成功");
            return data;
          }
        } catch (error) {
          console.error("❌ プロファイル取得処理エラー:", error);
          return null;
        }
      })();

      // 10秒のタイムアウトを設定
      const timeoutPromise = new Promise<null>((resolve) => {
        setTimeout(() => {
          console.warn("⚠️ プロファイル読み込みタイムアウト");
          resolve(null);
        }, 10000);
      });

      const profile = await Promise.race([profilePromise, timeoutPromise]);
      setProfile(profile);

      // プロファイルが取得できた場合、制作状況も確認
      if (profile) {
        try {
          const { data: statuses } = await supabase
            .from("project_statuses")
            .select("*")
            .eq("user_id", userId)
            .limit(1);

          if (!statuses || statuses.length === 0) {
            console.log("制作状況が見つかりません。初期化を実行します...");
            try {
              await initializeUserData(userId, profile.email, profile.name || undefined);
              console.log("✅ 制作状況初期化完了");
            } catch (statusInitError) {
              console.error("❌ 制作状況初期化エラー:", statusInitError);
            }
          }
        } catch (statusError) {
          console.error("制作状況確認エラー:", statusError);
        }
      }
    } catch (error) {
      console.error("❌ プロファイル取得エラー:", error);
      setProfile(null);
    } finally {
      console.log("🏁 プロファイル読み込み完了");
      setLoading(false);
      profileLoadingRef.current = false;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error };
      }

      if (data.user) {
        setUser(data.user);
        await loadProfile(data.user.id);
      }

      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const signUp = async (email: string, password: string, name?: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name || "",
          },
        },
      });

      if (error) {
        return { error };
      }

      if (data.user) {
        setUser(data.user);
        await loadProfile(data.user.id);
      }

      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
    } catch (error) {
      console.error("ログアウトエラー:", error);
    }
  };

  // サーバーサイドレンダリング中は何も表示しない
  if (!mounted) {
    return null;
  }

  // 初期化が完了していない場合はローディング表示
  if (!initialized) {
    return (
      <AuthContext.Provider
        value={{
          user: null,
          profile: null,
          loading: true,
          signIn: async () => ({ error: new Error("初期化中です") }),
          signUp: async () => ({ error: new Error("初期化中です") }),
          signOut: async () => {},
          refreshSession: async () => {},
        }}
      >
        {children}
      </AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
