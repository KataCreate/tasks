import { supabase } from "../supabase";

// ダッシュボード統計データの型定義
export interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  todayTasks: number;
  thisWeekTasks: number;
  upcomingDeadlines: UpcomingTask[];
  priorityDistribution: PriorityStats[];
  statusDistribution: StatusStats[];
  recentActivity: RecentActivity[];
  weeklyProgress: WeeklyProgress[];
}

export interface UpcomingTask {
  id: string;
  title: string;
  due_date: string;
  priority: string;
  project_name: string;
  days_until_due: number;
}

export interface PriorityStats {
  priority: string;
  count: number;
  percentage: number;
}

export interface StatusStats {
  status: string;
  count: number;
  percentage: number;
}

export interface RecentActivity {
  id: string;
  type: "task_created" | "task_completed" | "project_created";
  title: string;
  project_name?: string;
  created_at: string;
}

export interface WeeklyProgress {
  week: string;
  completed: number;
  created: number;
}

// ダッシュボード統計データを取得
export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    console.log("📊 ダッシュボード統計データ取得開始");

    // 並行してデータを取得
    const [projectsResult, tasksResult, upcomingTasksResult] = await Promise.all([
      // プロジェクト統計（プロジェクトステータスも含む）
      supabase.from("projects").select(`
          id,
          status_id,
          project_statuses(name)
        `),

      // タスク統計（プロジェクト名も含む）
      supabase.from("tasks").select(`
          id,
          title,
          is_completed,
          status,
          priority,
          due_date,
          created_at,
          project_id,
          projects!inner(name)
        `),

      // 期限が近いタスク（7日以内）
      supabase
        .from("tasks")
        .select(
          `
          id,
          title,
          due_date,
          priority,
          is_completed,
          projects!inner(name)
        `
        )
        .not("due_date", "is", null)
        .eq("is_completed", false)
        .gte("due_date", new Date().toISOString())
        .lte("due_date", new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString())
        .order("due_date", { ascending: true })
        .limit(10),
    ]);

    if (projectsResult.error) throw projectsResult.error;
    if (tasksResult.error) throw tasksResult.error;
    if (upcomingTasksResult.error) throw upcomingTasksResult.error;

    const projects = projectsResult.data || [];
    const tasks = tasksResult.data || [];
    const upcomingTasks = upcomingTasksResult.data || [];

    // 今日の日付範囲
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    // 今週の日付範囲
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay());
    thisWeekStart.setHours(0, 0, 0, 0);
    const thisWeekEnd = new Date(thisWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

    // プロジェクト統計
    const totalProjects = projects.length;
    // プロジェクトステータスは動的なので、ひとまずstatus_idがあるかどうかで判断
    const activeProjects = projects.filter((p) => p.status_id !== null).length;
    const completedProjects = 0; // 現在のシステムでは完了状態の定義がないため、後で拡張

    // タスク統計
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.is_completed || t.status === "done").length;

    // 期限切れタスク
    const overdueTasks = tasks.filter(
      (t) => t.due_date && new Date(t.due_date) < today && !t.is_completed && t.status !== "done"
    ).length;

    // 今日期限のタスク
    const todayTasks = tasks.filter(
      (t) =>
        t.due_date &&
        new Date(t.due_date) >= todayStart &&
        new Date(t.due_date) < todayEnd &&
        !t.is_completed &&
        t.status !== "done"
    ).length;

    // 今週期限のタスク
    const thisWeekTasks = tasks.filter(
      (t) =>
        t.due_date &&
        new Date(t.due_date) >= thisWeekStart &&
        new Date(t.due_date) < thisWeekEnd &&
        !t.is_completed &&
        t.status !== "done"
    ).length;

    // 優先度別統計
    const priorityCounts = {
      urgent: tasks.filter((t) => t.priority === "urgent").length,
      high: tasks.filter((t) => t.priority === "high").length,
      medium: tasks.filter((t) => t.priority === "medium").length,
      low: tasks.filter((t) => t.priority === "low").length,
    };

    const priorityDistribution: PriorityStats[] = Object.entries(priorityCounts).map(
      ([priority, count]) => ({
        priority,
        count,
        percentage: totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0,
      })
    );

    // ステータス別統計
    const statusCounts = {
      todo: tasks.filter((t) => t.status === "todo").length,
      in_progress: tasks.filter((t) => t.status === "in_progress").length,
      review: tasks.filter((t) => t.status === "review").length,
      blocked: tasks.filter((t) => t.status === "blocked").length,
      done: tasks.filter((t) => t.status === "done").length,
    };

    const statusDistribution: StatusStats[] = Object.entries(statusCounts).map(
      ([status, count]) => ({
        status,
        count,
        percentage: totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0,
      })
    );

    // 期限が近いタスクの処理
    const upcomingDeadlines: UpcomingTask[] = upcomingTasks.map((task) => {
      const dueDate = new Date(task.due_date!);
      const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));

      return {
        id: task.id,
        title: task.title,
        due_date: task.due_date!,
        priority: task.priority || "medium",
        project_name: (task.projects as any)?.name || "不明なプロジェクト",
        days_until_due: daysUntilDue,
      };
    });

    // 最近のアクティビティ（新しく作成されたタスク・完了したタスクを含む）
    const recentActivity: RecentActivity[] = tasks
      .filter((task) => {
        const createdDate = new Date(task.created_at);
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
        return createdDate >= threeDaysAgo;
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10)
      .map((task) => ({
        id: task.id,
        type:
          task.is_completed || task.status === "done"
            ? ("task_completed" as const)
            : ("task_created" as const),
        title: task.title,
        project_name: (task.projects as any)?.name,
        created_at: task.created_at,
      }));

    // 週別進捗（過去4週間）
    const weeklyProgress: WeeklyProgress[] = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(thisWeekStart.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

      const weekTasks = tasks.filter((task) => {
        const createdDate = new Date(task.created_at);
        return createdDate >= weekStart && createdDate < weekEnd;
      });

      const completedInWeek = weekTasks.filter((t) => t.is_completed || t.status === "done").length;

      weeklyProgress.push({
        week: `${weekStart.getMonth() + 1}/${weekStart.getDate()}`,
        completed: completedInWeek,
        created: weekTasks.length,
      });
    }

    const stats: DashboardStats = {
      totalProjects,
      activeProjects,
      completedProjects,
      totalTasks,
      completedTasks,
      overdueTasks,
      todayTasks,
      thisWeekTasks,
      upcomingDeadlines,
      priorityDistribution,
      statusDistribution,
      recentActivity,
      weeklyProgress,
    };

    console.log("✅ ダッシュボード統計データ取得成功:", stats);
    return stats;
  } catch (error) {
    console.error("❌ ダッシュボード統計データ取得エラー:", error);
    throw error;
  }
}
