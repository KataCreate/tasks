import { supabase } from "../supabase";
import { Task, TaskInsert, TaskUpdate, TaskWithChildren } from "../database.types";

// プロジェクトのタスク一覧取得（階層構造付き）
export async function getProjectTasks(projectId: string): Promise<TaskWithChildren[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("タスク取得エラー:", error);
    throw error;
  }

  // 階層構造に変換
  const tasksMap = new Map<string, TaskWithChildren>();
  const rootTasks: TaskWithChildren[] = [];

  // すべてのタスクをMapに格納し、childrenプロパティを初期化
  data.forEach((task) => {
    tasksMap.set(task.id, { ...task, children: [] });
  });

  // 親子関係を構築
  data.forEach((task) => {
    const taskWithChildren = tasksMap.get(task.id)!;
    if (task.parent_task_id) {
      const parent = tasksMap.get(task.parent_task_id);
      if (parent) {
        parent.children.push(taskWithChildren);
      }
    } else {
      rootTasks.push(taskWithChildren);
    }
  });

  return rootTasks;
}

// タスク作成
export async function createTask(task: TaskInsert): Promise<Task> {
  try {
    // 同じレベル内での最大sort_orderを取得
    let query = supabase
      .from("tasks")
      .select("sort_order")
      .eq("project_id", task.project_id)
      .order("sort_order", { ascending: false })
      .limit(1);

    if (task.parent_task_id) {
      query = query.eq("parent_task_id", task.parent_task_id);
    } else {
      query = query.is("parent_task_id", null);
    }

    const { data: maxSortData } = await query;
    const nextSortOrder = maxSortData?.[0]?.sort_order ? maxSortData[0].sort_order + 1 : 0;

    // デフォルト値を設定してタスクデータを準備
    const taskData = {
      project_id: task.project_id,
      parent_task_id: task.parent_task_id || null,
      title: task.title,
      description: task.description || null,
      is_completed: task.is_completed || false,
      sort_order: nextSortOrder,
      priority: task.priority || "medium",
      status: task.status || "todo",
      due_date: task.due_date || null,
      estimated_hours: task.estimated_hours || null,
      actual_hours: task.actual_hours || null,
      progress_percentage: task.progress_percentage || 0,
      tags: task.tags || null,
      assignee_id: task.assignee_id || null,
    };

    const { data, error } = await supabase.from("tasks").insert([taskData]).select().single();

    if (error) {
      console.error("❌ タスク作成エラー詳細:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      throw error;
    }

    return data;
  } catch (error) {
    console.error("❌ タスク作成処理エラー:", error);
    throw error;
  }
}

// タスク更新
export async function updateTask(id: string, updates: TaskUpdate): Promise<Task> {
  try {
    const { data, error } = await supabase
      .from("tasks")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("❌ タスク更新エラー詳細:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      throw error;
    }

    return data;
  } catch (error) {
    console.error("❌ タスク更新処理エラー:", error);
    throw error;
  }
}

// タスク削除
export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase.from("tasks").delete().eq("id", id);

  if (error) {
    console.error("タスク削除エラー:", error);
    throw error;
  }
}

// タスクの完了状態切り替え（スマートステータス管理）
export async function toggleTaskCompletion(id: string, isCompleted: boolean): Promise<Task> {
  try {
    // 現在のタスク情報を取得
    const { data: currentTask, error: fetchError } = await supabase
      .from("tasks")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError) {
      console.error("❌ タスク取得エラー:", fetchError);
      throw fetchError;
    }

    let newStatus: "todo" | "in_progress" | "review" | "blocked" | "done";

    if (isCompleted) {
      // 完了にする場合
      newStatus = "done";
    } else {
      // 未完了にする場合、前のステータスに戻すか、デフォルトをtodoに
      if (currentTask.status === "done") {
        // 完了から戻す場合は、以前のステータスを推測
        newStatus = "todo"; // デフォルトは未着手に戻す
      } else {
        // 既に未完了の場合はそのまま
        newStatus = currentTask.status || "todo";
      }
    }

    const updates: TaskUpdate = {
      is_completed: isCompleted,
      status: newStatus,
      progress_percentage: isCompleted ? 100 : currentTask.progress_percentage || 0,
    };

    const result = await updateTask(id, updates);

    return result;
  } catch (error) {
    console.error("❌ タスク完了状態切り替えエラー:", error);
    throw error;
  }
}

// タスクの並び順更新
export async function updateTaskOrder(
  taskId: string,
  newParentId: string | null,
  newSortOrder: number
): Promise<void> {
  const { error } = await supabase
    .from("tasks")
    .update({
      parent_task_id: newParentId,
      sort_order: newSortOrder,
    })
    .eq("id", taskId);

  if (error) {
    console.error("タスク順序更新エラー:", error);
    throw error;
  }
}

// 複数タスクのソート順更新
export async function updateTasksOrder(
  updates: Array<{ id: string; sort_order: number; parent_task_id?: string | null }>
): Promise<void> {
  for (const update of updates) {
    await updateTask(update.id, {
      sort_order: update.sort_order,
      parent_task_id: update.parent_task_id,
    });
  }
}
