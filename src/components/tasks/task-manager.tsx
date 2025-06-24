"use client";

import { useState, useEffect } from "react";
import { ProjectWithStatus, TaskWithChildren } from "@/lib/database.types";
import { getProjectTasks } from "@/lib/api/tasks";
import { TaskItem } from "./task-item";
import { TaskForm } from "./task-form";

interface TaskManagerProps {
  project: ProjectWithStatus;
  onClose: () => void;
}

export function TaskManager({ project, onClose }: TaskManagerProps) {
  const [tasks, setTasks] = useState<TaskWithChildren[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskWithChildren | null>(null);
  const [parentTask, setParentTask] = useState<TaskWithChildren | null>(null);

  useEffect(() => {
    loadTasks();
  }, [project.id]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const data = await getProjectTasks(project.id);
      setTasks(data);
    } catch (error) {
      console.error("タスク読み込みエラー:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskCreated = () => {
    setShowCreateForm(false);
    setParentTask(null);
    loadTasks();
  };

  const handleTaskUpdated = () => {
    setEditingTask(null);
    loadTasks();
  };

  const handleAddSubTask = (parentTask: TaskWithChildren) => {
    setParentTask(parentTask);
    setShowCreateForm(true);
  };

  const handleEditTask = (task: TaskWithChildren) => {
    setEditingTask(task);
  };

  const completedTasksCount = countCompletedTasks(tasks);
  const totalTasksCount = countTotalTasks(tasks);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* ヘッダー */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{project.name}</h2>
              <p className="text-sm text-gray-900 mt-1">タスク管理</p>
              <div className="mt-2 flex items-center text-sm text-gray-900">
                <span>
                  進捗: {completedTasksCount}/{totalTasksCount} 完了
                </span>
                {totalTasksCount > 0 && (
                  <div className="ml-3 flex-1 max-w-xs">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all"
                        style={{
                          width: `${(completedTasksCount / totalTasksCount) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* タスク一覧 */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">タスク一覧</h3>
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center"
              >
                <svg className="-ml-1 mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                    clipRule="evenodd"
                  />
                </svg>
                新規タスク
              </button>
            </div>

            <div className="space-y-2">
              {tasks.length > 0 ? (
                tasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggleComplete={loadTasks}
                    onAddSubTask={handleAddSubTask}
                    onEdit={handleEditTask}
                    onDelete={loadTasks}
                    level={0}
                  />
                ))
              ) : (
                <div className="text-center py-12">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">タスクがありません</h3>
                  <p className="mt-1 text-sm text-gray-900">最初のタスクを作成してみましょう</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* タスクフォーム */}
        {(showCreateForm || editingTask) && (
          <TaskForm
            projectId={project.id}
            task={editingTask}
            parentTask={parentTask}
            onClose={() => {
              setShowCreateForm(false);
              setEditingTask(null);
              setParentTask(null);
            }}
            onSuccess={editingTask ? handleTaskUpdated : handleTaskCreated}
          />
        )}
      </div>
    </div>
  );
}

// ヘルパー関数
function countCompletedTasks(tasks: TaskWithChildren[]): number {
  let count = 0;
  tasks.forEach((task) => {
    if (task.is_completed) count++;
    count += countCompletedTasks(task.children);
  });
  return count;
}

function countTotalTasks(tasks: TaskWithChildren[]): number {
  let count = tasks.length;
  tasks.forEach((task) => {
    count += countTotalTasks(task.children);
  });
  return count;
}
