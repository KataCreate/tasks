"use client";

import { useState, useEffect } from "react";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useAuth } from "@/lib/auth-context";
import {
  getProjectStatuses,
  deleteProjectStatus,
  updateProjectStatusesOrder,
} from "@/lib/api/projects";
import { ProjectStatus } from "@/lib/database.types";
import { StatusForm } from "./status-form";

interface StatusManagerProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface SortableStatusItemProps {
  status: ProjectStatus;
  onEdit: (status: ProjectStatus) => void;
  onDelete: (status: ProjectStatus) => void;
}

function SortableStatusItem({ status, onEdit, onDelete }: SortableStatusItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: status.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-gray-500 hover:text-gray-700"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
        </svg>
      </div>

      <div
        className="w-4 h-4 rounded-full flex-shrink-0"
        style={{ backgroundColor: status.color }}
      />

      <div className="flex-1">
        <h3 className="font-medium text-gray-900">{status.name}</h3>
        <p className="text-sm text-gray-700">並び順: {status.sort_order + 1}</p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onEdit(status)}
          className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
          title="編集"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
        </button>
        <button
          onClick={() => onDelete(status)}
          className="p-2 text-gray-500 hover:text-red-600 transition-colors"
          title="削除"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

export function StatusManager({ onClose, onSuccess }: StatusManagerProps) {
  const { user } = useAuth();
  const [statuses, setStatuses] = useState<ProjectStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingStatus, setEditingStatus] = useState<ProjectStatus | null>(null);
  const [activeStatus, setActiveStatus] = useState<ProjectStatus | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    if (user?.id) {
      loadStatuses();
    }
  }, [user]);

  const loadStatuses = async () => {
    try {
      setLoading(true);
      const data = await getProjectStatuses(user!.id);
      setStatuses(data);
    } catch (error) {
      console.error("制作状況読み込みエラー:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      setActiveStatus(null);
      return;
    }

    const oldIndex = statuses.findIndex((status) => status.id === active.id);
    const newIndex = statuses.findIndex((status) => status.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      setActiveStatus(null);
      return;
    }

    const newStatuses = arrayMove(statuses, oldIndex, newIndex);

    // 即座にUIを更新
    setStatuses(newStatuses);
    setActiveStatus(null);

    // バックエンドの並び順を更新
    try {
      const updates = newStatuses.map((status, index) => ({
        id: status.id,
        sort_order: index,
      }));

      await updateProjectStatusesOrder(updates);

      // 成功後に最新データを再読み込み
      await loadStatuses();
    } catch (error) {
      console.error("並び順更新エラー:", error);
      // エラー時は元の状態に戻す
      await loadStatuses();
    }
  };

  const handleDelete = async (status: ProjectStatus) => {
    if (
      !confirm(
        `制作状況「${status.name}」を削除しますか？\n\nこの制作状況を使用している案件がある場合は削除できません。`
      )
    ) {
      return;
    }

    try {
      await deleteProjectStatus(status.id);
      await loadStatuses();
    } catch (error: any) {
      alert(error.message || "削除に失敗しました。");
    }
  };

  const handleFormSuccess = () => {
    setShowCreateForm(false);
    setEditingStatus(null);
    loadStatuses();
    onSuccess();
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="ml-3 text-gray-800">読み込み中...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">制作状況管理</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
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

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="flex justify-between items-center mb-6">
            <p className="text-gray-800">制作状況をドラッグ&ドロップで並び替えできます</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              制作状況を追加
            </button>
          </div>

          {statuses.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 text-gray-300">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <p className="text-gray-700">制作状況がありません</p>
              <p className="text-sm text-gray-600 mt-1">
                「制作状況を追加」ボタンから作成してください
              </p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              onDragStart={(event) => {
                const status = statuses.find((s) => s.id === event.active.id);
                setActiveStatus(status || null);
              }}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={statuses.map((s) => s.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {statuses.map((status) => (
                    <SortableStatusItem
                      key={status.id}
                      status={status}
                      onEdit={setEditingStatus}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </SortableContext>

              <DragOverlay>
                {activeStatus && (
                  <div className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg shadow-lg opacity-90">
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: activeStatus.color }}
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{activeStatus.name}</h3>
                    </div>
                  </div>
                )}
              </DragOverlay>
            </DndContext>
          )}
        </div>
      </div>

      {(showCreateForm || editingStatus) && (
        <StatusForm
          status={editingStatus}
          onClose={() => {
            setShowCreateForm(false);
            setEditingStatus(null);
          }}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
}
