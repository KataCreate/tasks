import { createClient } from "@supabase/supabase-js";
import { Database } from "./database.types";

// 環境変数のチェック
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL が設定されていません");
  console.log("💡 .env.local ファイルを作成して以下を設定してください:");
  console.log("NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url");
}

if (!supabaseKey) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_ANON_KEY が設定されていません");
  console.log("💡 .env.local ファイルを作成して以下を設定してください:");
  console.log("NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key");
}

if (supabaseUrl && supabaseKey) {
  console.log("✅ Supabase環境変数が正しく設定されています");
}

// パフォーマンス最適化されたSupabaseクライアント
export const supabase = createClient<Database>(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseKey || "placeholder-key",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    global: {
      headers: {
        "x-client-info": "task-sys@1.0.0",
      },
    },
    db: {
      schema: "public",
    },
    realtime: {
      // リアルタイム機能が不要な場合は無効化してパフォーマンス向上
      params: {
        eventsPerSecond: 2,
      },
    },
  }
);

// 認証関連のヘルパー関数
export const auth = {
  signUp: async (email: string, password: string, name?: string) => {
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

      if (data?.user && !error) {
        // プロファイル作成
        const { error: profileError } = await supabase.from("profiles").insert({
          id: data.user.id,
          email: data.user.email!,
          name: name || null,
        });

        if (profileError) {
          console.error("プロファイル作成エラー:", profileError);
        }
      }

      return { data, error };
    } catch (error) {
      console.error("サインアップエラー:", error);
      return { data: null, error };
    }
  },

  signIn: async (email: string, password: string) => {
    try {
      console.log("🔐 Supabase ログイン試行:", {
        email,
        supabaseUrl: supabaseUrl?.substring(0, 20) + "...",
        hasKey: !!supabaseKey,
      });

      const result = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log("🔐 Supabase ログイン結果:", {
        hasUser: !!result.data?.user,
        hasSession: !!result.data?.session,
        error: result.error?.message,
      });

      return result;
    } catch (error) {
      console.error("❌ Supabase サインインエラー:", error);
      return { data: { user: null, session: null }, error };
    }
  },

  signOut: async () => {
    try {
      return await supabase.auth.signOut();
    } catch (error) {
      console.error("サインアウトエラー:", error);
      return { error };
    }
  },

  getCurrentUser: async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      return user;
    } catch (error) {
      console.error("ユーザー取得エラー:", error);
      return null;
    }
  },

  getProfile: async (userId: string) => {
    try {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();

      if (error) {
        console.error("プロファイル取得エラー詳細:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
      }

      return { data, error };
    } catch (error) {
      console.error("プロファイル取得処理エラー:", error);
      return { data: null, error };
    }
  },
};

// キャッシュ機能付きデータ取得ヘルパー
export class SupabaseCache {
  private static cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  static async get<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = 60000 // デフォルト1分
  ): Promise<T> {
    const cached = this.cache.get(key);
    const now = Date.now();

    if (cached && (now - cached.timestamp) < cached.ttl) {
      return cached.data;
    }

    const data = await fetcher();
    this.cache.set(key, { data, timestamp: now, ttl });

    return data;
  }

  static clear(key?: string) {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }
}
