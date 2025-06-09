import { supabase } from "../supabase";
import {
  Project,
  ProjectInsert,
  ProjectUpdate,
  ProjectWithStatus,
  ProjectStatus,
} from "../database.types";
import { ensureProjectStatuses } from "./setup";

// 案件一覧取得（制作状況と共に）
export async function getProjects(userId: string): Promise<ProjectWithStatus[]> {
  const { data, error } = await supabase
    .from("projects")
    .select(
      `
      *,
      project_statuses:status_id (
        id,
        name,
        color,
        sort_order
      ),
      tasks (
        id,
        title,
        is_completed,
        sort_order
      )
    `
    )
    .eq("user_id", userId)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("案件取得エラー:", error);
    throw error;
  }

  return data || [];
}

// 制作状況一覧取得
export async function getProjectStatuses(userId: string): Promise<ProjectStatus[]> {
  try {
    console.log("🎯 制作状況取得開始 - ユーザーID:", userId);

    // まず既存の制作状況を取得
    const { data, error } = await supabase
      .from("project_statuses")
      .select("*")
      .eq("user_id", userId)
      .order("sort_order", { ascending: true });

    console.log("📊 Supabaseレスポンス:", { data, error });

    if (error) {
      console.error("❌ 制作状況取得エラー詳細:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      throw error;
    }

    // 制作状況が空の場合は自動作成
    if (!data || data.length === 0) {
      console.log("⚠️ 制作状況が見つかりません。デフォルトを作成します...");
      return await ensureProjectStatuses(userId);
    }

    console.log("✅ 制作状況取得成功:", data.length, "件");
    return data;
  } catch (error) {
    console.error("❌ 制作状況取得処理エラー:", error);
    throw error;
  }
}

// 案件作成
export async function createProject(project: ProjectInsert): Promise<Project> {
  // 同じステータス内での最大sort_orderを取得
  const { data: maxSortData } = await supabase
    .from("projects")
    .select("sort_order")
    .eq("user_id", project.user_id)
    .eq("status_id", project.status_id || "")
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextSortOrder = maxSortData?.[0]?.sort_order ? maxSortData[0].sort_order + 1 : 0;

  const { data, error } = await supabase
    .from("projects")
    .insert([{ ...project, sort_order: nextSortOrder }])
    .select()
    .single();

  if (error) {
    console.error("案件作成エラー:", error);
    throw error;
  }

  return data;
}

// 案件更新
export async function updateProject(id: string, updates: ProjectUpdate): Promise<Project> {
  const { data, error } = await supabase
    .from("projects")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("案件更新エラー:", error);
    throw error;
  }

  return data;
}

// 案件削除（関連タスクも同時削除）
export async function deleteProject(id: string): Promise<void> {
  try {
    // まず関連タスクを削除
    console.log("🗑️ 関連タスクを削除中...");
    const { error: tasksError } = await supabase.from("tasks").delete().eq("project_id", id);

    if (tasksError) {
      console.error("タスク削除エラー:", tasksError);
      throw new Error(`関連タスクの削除に失敗しました: ${tasksError.message}`);
    }

    // 案件を削除
    console.log("🗑️ 案件を削除中...");
    const { error: projectError } = await supabase.from("projects").delete().eq("id", id);

    if (projectError) {
      console.error("案件削除エラー:", projectError);
      throw new Error(`案件の削除に失敗しました: ${projectError.message}`);
    }

    console.log("✅ 案件とタスクの削除が完了しました");
  } catch (error) {
    console.error("❌ 削除処理エラー:", error);
    throw error;
  }
}

// 案件のステータス変更（ドラッグ&ドロップ用）
export async function moveProject(
  projectId: string,
  newStatusId: string,
  newSortOrder: number
): Promise<void> {
  const { error } = await supabase
    .from("projects")
    .update({
      status_id: newStatusId,
      sort_order: newSortOrder,
    })
    .eq("id", projectId);

  if (error) {
    console.error("案件移動エラー:", error);
    throw error;
  }
}

// 複数案件のソート順更新（ドラッグ&ドロップ後の整理用）
export async function updateProjectsOrder(
  updates: Array<{ id: string; sort_order: number }>
): Promise<void> {
  // バッチ更新の代わりに個別更新
  for (const update of updates) {
    await updateProject(update.id, { sort_order: update.sort_order });
  }
}

// === 制作状況カスタマイズ用API関数群 ===

// 制作状況作成
export async function createProjectStatus(
  userId: string,
  name: string,
  color: string
): Promise<ProjectStatus> {
  // 最大sort_orderを取得
  const { data: maxSortData } = await supabase
    .from("project_statuses")
    .select("sort_order")
    .eq("user_id", userId)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextSortOrder = maxSortData?.[0]?.sort_order ? maxSortData[0].sort_order + 1 : 0;

  const { data, error } = await supabase
    .from("project_statuses")
    .insert([
      {
        user_id: userId,
        name,
        color,
        sort_order: nextSortOrder,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("制作状況作成エラー:", error);
    throw error;
  }

  return data;
}

// 制作状況更新
export async function updateProjectStatus(
  statusId: string,
  updates: { name?: string; color?: string }
): Promise<ProjectStatus> {
  const { data, error } = await supabase
    .from("project_statuses")
    .update(updates)
    .eq("id", statusId)
    .select()
    .single();

  if (error) {
    console.error("制作状況更新エラー:", error);
    throw error;
  }

  return data;
}

// 制作状況削除
export async function deleteProjectStatus(statusId: string): Promise<void> {
  // まず該当ステータスを使用している案件があるかチェック
  const { data: projectsData } = await supabase
    .from("projects")
    .select("id")
    .eq("status_id", statusId)
    .limit(1);

  if (projectsData && projectsData.length > 0) {
    throw new Error("この制作状況を使用している案件があるため削除できません。");
  }

  const { error } = await supabase.from("project_statuses").delete().eq("id", statusId);

  if (error) {
    console.error("制作状況削除エラー:", error);
    throw error;
  }
}

// 制作状況の並び順更新
export async function updateProjectStatusesOrder(
  updates: Array<{ id: string; sort_order: number }>
): Promise<void> {
  // バッチ更新の代わりに個別更新
  for (const update of updates) {
    const { error } = await supabase
      .from("project_statuses")
      .update({ sort_order: update.sort_order })
      .eq("id", update.id);

    if (error) {
      console.error("制作状況並び順更新エラー:", error);
      throw error;
    }
  }
}

// 制作状況の移動（ドラッグ&ドロップ用）
export async function moveProjectStatus(statusId: string, newSortOrder: number): Promise<void> {
  const { error } = await supabase
    .from("project_statuses")
    .update({ sort_order: newSortOrder })
    .eq("id", statusId);

  if (error) {
    console.error("制作状況移動エラー:", error);
    throw error;
  }
}
