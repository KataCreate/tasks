import { supabase } from "../supabase";
import { ProjectStatus } from "../database.types";

// デフォルト制作状況を作成
export async function createDefaultProjectStatuses(userId: string): Promise<ProjectStatus[]> {
  const defaultStatuses = [
    { name: "未着手", color: "#EF4444", sort_order: 0 },
    { name: "制作中", color: "#F59E0B", sort_order: 1 },
    { name: "確認待ち", color: "#3B82F6", sort_order: 2 },
    { name: "完了", color: "#10B981", sort_order: 3 },
  ];

  const { data, error } = await supabase
    .from("project_statuses")
    .insert(
      defaultStatuses.map((status) => ({
        user_id: userId,
        name: status.name,
        color: status.color,
        sort_order: status.sort_order,
      }))
    )
    .select();

  if (error) {
    console.error("デフォルト制作状況作成エラー:", error);
    throw error;
  }

  return data || [];
}

// 制作状況の存在確認と自動作成
export async function ensureProjectStatuses(userId: string): Promise<ProjectStatus[]> {
  try {
    // 既存の制作状況を確認
    const { data: existingStatuses, error } = await supabase
      .from("project_statuses")
      .select("*")
      .eq("user_id", userId)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("制作状況確認エラー:", error);
      throw error;
    }

    // 制作状況が存在しない場合は作成
    if (!existingStatuses || existingStatuses.length === 0) {
      console.log("制作状況が見つかりません。デフォルトを作成します...");
      return await createDefaultProjectStatuses(userId);
    }

    return existingStatuses;
  } catch (error) {
    console.error("制作状況確保エラー:", error);
    throw error;
  }
}

// プロファイルの存在確認と作成
export async function ensureProfile(userId: string, email: string, name?: string) {
  try {
    // 既存プロファイルを確認
    const { data: existingProfile, error: fetchError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (fetchError && fetchError.code === "PGRST116") {
      // プロファイルが存在しない場合は作成
      console.log("プロファイルが見つかりません。作成します...");
      const { data, error: insertError } = await supabase
        .from("profiles")
        .insert({
          id: userId,
          email: email,
          name: name || null,
        })
        .select()
        .single();

      if (insertError) {
        console.error("プロファイル作成エラー:", insertError);
        throw insertError;
      }

      return data;
    } else if (fetchError) {
      console.error("プロファイル確認エラー:", fetchError);
      throw fetchError;
    }

    return existingProfile;
  } catch (error) {
    console.error("プロファイル確保エラー:", error);
    throw error;
  }
}

// 初期セットアップ
export async function initializeUserData(userId: string, email: string, name?: string) {
  try {
    console.log("ユーザーデータを初期化中...");

    // プロファイルを確保
    const profile = await ensureProfile(userId, email, name);
    console.log("✅ プロファイル確保完了");

    // 制作状況を確保
    const statuses = await ensureProjectStatuses(userId);
    console.log("✅ 制作状況確保完了");

    return { profile, statuses };
  } catch (error) {
    console.error("❌ ユーザーデータ初期化エラー:", error);
    throw error;
  }
}
