export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      project_statuses: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          color: string;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          color?: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          color?: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "project_statuses_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      projects: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          memo: string | null;
          delivery_date: string | null;
          status_id: string | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          memo?: string | null;
          delivery_date?: string | null;
          status_id?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          memo?: string | null;
          delivery_date?: string | null;
          status_id?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "projects_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "projects_status_id_fkey";
            columns: ["status_id"];
            referencedRelation: "project_statuses";
            referencedColumns: ["id"];
          }
        ];
      };
      tasks: {
        Row: {
          id: string;
          project_id: string;
          parent_task_id: string | null;
          title: string;
          description: string | null;
          is_completed: boolean;
          sort_order: number;
          priority: "low" | "medium" | "high" | "urgent";
          status: "todo" | "in_progress" | "review" | "blocked" | "done";
          due_date: string | null;
          estimated_hours: number | null;
          actual_hours: number | null;
          progress_percentage: number;
          tags: string[] | null;
          assignee_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          parent_task_id?: string | null;
          title: string;
          description?: string | null;
          is_completed?: boolean;
          sort_order?: number;
          priority?: "low" | "medium" | "high" | "urgent";
          status?: "todo" | "in_progress" | "review" | "blocked" | "done";
          due_date?: string | null;
          estimated_hours?: number | null;
          actual_hours?: number | null;
          progress_percentage?: number;
          tags?: string[] | null;
          assignee_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          parent_task_id?: string | null;
          title?: string;
          description?: string | null;
          is_completed?: boolean;
          sort_order?: number;
          priority?: "low" | "medium" | "high" | "urgent";
          status?: "todo" | "in_progress" | "review" | "blocked" | "done";
          due_date?: string | null;
          estimated_hours?: number | null;
          actual_hours?: number | null;
          progress_percentage?: number;
          tags?: string[] | null;
          assignee_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tasks_project_id_fkey";
            columns: ["project_id"];
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tasks_parent_task_id_fkey";
            columns: ["parent_task_id"];
            referencedRelation: "tasks";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// 便利な型エイリアス
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type ProjectStatus = Database["public"]["Tables"]["project_statuses"]["Row"];
export type Project = Database["public"]["Tables"]["projects"]["Row"];
export type Task = Database["public"]["Tables"]["tasks"]["Row"];

export type ProjectInsert = Database["public"]["Tables"]["projects"]["Insert"];
export type ProjectUpdate = Database["public"]["Tables"]["projects"]["Update"];
export type TaskInsert = Database["public"]["Tables"]["tasks"]["Insert"];
export type TaskUpdate = Database["public"]["Tables"]["tasks"]["Update"];

// 結合されたデータ型
export type ProjectWithStatus = Project & {
  project_statuses: {
    id: string;
    name: string;
    color: string;
    sort_order: number;
  } | null;
  tasks: {
    id: string;
    title: string;
    is_completed: boolean;
    sort_order: number;
  }[];
};

export type TaskWithChildren = Task & {
  children: TaskWithChildren[];
};
