import { supabase } from "@/integrations/supabase/client";
import { queryOptions } from "@tanstack/react-query";

export type Worker = {
  id: string;
  name: string;
  avatar: string | null;
  created_at: string;
};

export type Task = {
  id: string;
  title: string;
  description: string | null;
  assigned_to: string[];
  status: string;
  priority: string;
  image_url: string | null;
  completed_at: string | null;
  created_at: string;
};

export const workersQuery = queryOptions({
  queryKey: ["workers"],
  queryFn: async (): Promise<Worker[]> => {
    const { data, error } = await supabase
      .from("workers")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data as Worker[];
  },
});

export const tasksQuery = queryOptions({
  queryKey: ["tasks"],
  queryFn: async (): Promise<Task[]> => {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data as Task[];
  },
});

export async function claimTask(taskId: string, workerId: string, current: string[]) {
  const next = current.includes(workerId) ? current : [...current, workerId];
  const { error } = await supabase.from("tasks").update({ assigned_to: next }).eq("id", taskId);
  if (error) throw error;
}

export async function setTaskStatus(taskId: string, completed: boolean) {
  const { error } = await supabase
    .from("tasks")
    .update({
      status: completed ? "completed" : "pending",
      completed_at: completed ? new Date().toISOString() : null,
    })
    .eq("id", taskId);
  if (error) throw error;
}

export function avatarFor(worker: Worker) {
  return (
    worker.avatar ??
    `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(worker.name)}`
  );
}

export const priorityLabel = (priority: string) =>
  priority === "high" ? "Alta" : priority === "medium" ? "Normal" : "Baja";
