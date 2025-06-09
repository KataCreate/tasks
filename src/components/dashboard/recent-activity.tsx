import { RecentActivity as RecentActivityType } from "@/lib/api/dashboard";

interface RecentActivityProps {
  activities: RecentActivityType[];
}

const activityIcons = {
  task_created: "➕",
  task_completed: "✅",
  project_created: "📁",
};

const activityLabels = {
  task_created: "タスク作成",
  task_completed: "タスク完了",
  project_created: "案件作成",
};

const activityColors = {
  task_created: "text-blue-600 bg-blue-50",
  task_completed: "text-green-600 bg-green-50",
  project_created: "text-purple-600 bg-purple-50",
};

function formatTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return `${diffDays}日前`;
  } else if (diffHours > 0) {
    return `${diffHours}時間前`;
  } else {
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    return diffMinutes > 0 ? `${diffMinutes}分前` : "たった今";
  }
}

export function RecentActivity({ activities }: RecentActivityProps) {
  if (activities.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p>最近のアクティビティはありません</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-80 overflow-y-auto">
      {activities.map((activity) => (
        <div
          key={activity.id}
          className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
              activityColors[activity.type]
            }`}
          >
            {activityIcons[activity.type]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-gray-900">
                {activityLabels[activity.type]}
              </span>
              <span className="text-xs text-gray-500">{formatTimeAgo(activity.created_at)}</span>
            </div>
            <h4 className="text-sm text-gray-700 truncate">{activity.title}</h4>
            {activity.project_name && (
              <p className="text-xs text-gray-500 mt-1">{activity.project_name}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
