import { UpcomingTask } from "@/lib/api/dashboard";

interface UpcomingTasksProps {
  tasks: UpcomingTask[];
}

const priorityColors = {
  urgent: "text-red-600 bg-red-50",
  high: "text-orange-600 bg-orange-50",
  medium: "text-yellow-600 bg-yellow-50",
  low: "text-gray-600 bg-gray-50",
};

const priorityLabels = {
  urgent: "緊急",
  high: "高",
  medium: "中",
  low: "低",
};

export function UpcomingTasks({ tasks }: UpcomingTasksProps) {
  if (tasks.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p>期限が近いタスクはありません</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-80 overflow-y-auto">
      {tasks.map((task) => (
        <div
          key={task.id}
          className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-900 truncate">{task.title}</h4>
              <p className="text-xs text-gray-900 mt-1">{task.project_name}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span
                className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                  priorityColors[task.priority as keyof typeof priorityColors]
                }`}
              >
                {priorityLabels[task.priority as keyof typeof priorityLabels]}
              </span>
              <div className="text-xs text-gray-500">
                {task.days_until_due === 0 ? (
                  <span className="text-red-600 font-medium">今日期限</span>
                ) : task.days_until_due === 1 ? (
                  <span className="text-orange-600 font-medium">明日期限</span>
                ) : (
                  <span>{task.days_until_due}日後</span>
                )}
              </div>
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-900">
            期限:{" "}
            {new Date(task.due_date).toLocaleDateString("ja-JP", {
              month: "short",
              day: "numeric",
              weekday: "short",
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
