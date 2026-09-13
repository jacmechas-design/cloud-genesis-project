import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import {
  Check,
  CircleUserRound,
  Expand,
  HandHelping,
  HardHat,
  ListChecks,
  Coffee,
  CheckCheck,
  Cloud,
  Plus,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  avatarFor,
  claimTask,
  priorityLabel,
  setTaskStatus,
  tasksQuery,
  workersQuery,
  type Task,
} from "@/lib/tasks";
import { ImageLightbox } from "@/components/ImageLightbox";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Iglooo Task — Jornada del operario" },
      {
        name: "description",
        content:
          "App de campo para operarios: revisa tus tareas asignadas, toma tareas libres y marca tu avance del turno en tiempo real.",
      },
      { property: "og:title", content: "Iglooo Task — Jornada del operario" },
      {
        property: "og:description",
        content:
          "Revisa tus tareas asignadas, toma tareas libres y marca tu avance del turno en tiempo real.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OperatorApp,
});

function celebrate() {
  confetti({
    particleCount: 50,
    spread: 60,
    origin: { y: 0.8 },
    colors: ["#3b82f6", "#10b981", "#f59e0b"],
  });
}

function priorityClasses(priority: string) {
  if (priority === "high") return "bg-destructive/10 text-destructive";
  if (priority === "medium") return "bg-warning/20 text-warning-foreground";
  return "bg-muted text-muted-foreground";
}

function OperatorApp() {
  const queryClient = useQueryClient();
  const { data: workers = [] } = useQuery(workersQuery);
  const { data: tasks = [], isLoading } = useQuery(tasksQuery);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>("");
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedWorkerId && workers[0]) setSelectedWorkerId(workers[0].id);
  }, [workers, selectedWorkerId]);

  useEffect(() => {
    const channel = supabase
      .channel("iglooo-tasks")
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, () => {
        queryClient.invalidateQueries({ queryKey: ["tasks"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "workers" }, () => {
        queryClient.invalidateQueries({ queryKey: ["workers"] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const activeWorker = workers.find((w) => w.id === selectedWorkerId);

  const myTasks = useMemo(
    () => tasks.filter((t) => t.assigned_to?.includes(selectedWorkerId)),
    [tasks, selectedWorkerId],
  );
  const availableTasks = useMemo(
    () => tasks.filter((t) => !t.assigned_to || t.assigned_to.length === 0),
    [tasks],
  );

  const completed = myTasks.filter((t) => t.status === "completed").length;
  const percent = myTasks.length > 0 ? Math.round((completed / myTasks.length) * 100) : 0;

  const toggle = useMutation({
    mutationFn: ({ task }: { task: Task }) =>
      setTaskStatus(task.id, task.status !== "completed"),
    onSuccess: (_data, { task }) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      if (task.status !== "completed") {
        celebrate();
        toast.success("¡Tarea completada! 🎉");
      }
    },
    onError: () => toast.error("No se pudo guardar el cambio."),
  });

  const claim = useMutation({
    mutationFn: ({ task }: { task: Task }) =>
      claimTask(task.id, selectedWorkerId, task.assigned_to ?? []),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      celebrate();
      toast.success(`¡Tarea asignada a ${activeWorker?.name ?? "ti"}!`);
    },
    onError: () => toast.error("No se pudo tomar la tarea."),
  });

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 bg-surface-dark text-surface-dark-foreground shadow-md">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between gap-2 px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-foreground shadow-lg">
              <HardHat className="h-5 w-5" />
            </div>
            <div>
              <h1 className="flex items-center gap-2 text-base font-bold leading-tight tracking-tight">
                <span>Iglooo Task</span>
                <span className="rounded-full border border-accent/40 bg-accent/20 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-accent">
                  Operario
                </span>
              </h1>
              <p className="text-xs font-medium text-surface-dark-muted">Jornada de trabajo</p>
            </div>
          </div>

          <span className="flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-accent">
            <Cloud className="h-3 w-3" /> En la nube
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 space-y-6 px-4 py-6">
        <div className="card-surface flex items-center justify-between gap-3 p-3.5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <CircleUserRound className="h-5 w-5 text-primary" />
            <span>Mi perfil:</span>
          </div>
          <select
            aria-label="Seleccionar operario"
            value={selectedWorkerId}
            onChange={(e) => setSelectedWorkerId(e.target.value)}
            className="max-w-xs flex-1 rounded-xl border border-border bg-secondary px-3 py-2 text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {workers.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col items-start justify-between gap-4 rounded-2xl bg-surface-dark p-5 text-surface-dark-foreground shadow-lg sm:flex-row sm:items-center">
          <div className="flex items-center gap-3.5">
            {activeWorker ? (
              <img
                src={avatarFor(activeWorker)}
                alt={`Avatar de ${activeWorker.name}`}
                className="h-14 w-14 shrink-0 rounded-2xl bg-surface-dark-2 p-1"
              />
            ) : (
              <div className="h-14 w-14 shrink-0 rounded-2xl bg-surface-dark-2" />
            )}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-accent">
                Mi turno actual
              </p>
              <h2 className="text-xl font-extrabold">Hola, {activeWorker?.name ?? "Operario"}</h2>
              <p className="mt-0.5 text-xs text-surface-dark-muted">
                Toca las tareas para marcarlas como completadas.
              </p>
            </div>
          </div>

          <div className="w-full min-w-[220px] rounded-xl bg-surface-dark-2/80 p-3.5 sm:w-auto">
            <div className="mb-1 flex items-center justify-between text-xs font-semibold text-surface-dark-muted">
              <span>Mi avance</span>
              <span>{percent}%</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-dark">
              <div
                className="h-2.5 rounded-full bg-accent transition-all duration-500"
                style={{ width: `${percent}%` }}
              />
            </div>
            <p className="mt-1.5 text-right text-[11px] font-medium text-surface-dark-muted">
              {completed} de {myTasks.length} completadas
            </p>
          </div>
        </div>

        <section>
          <div className="mb-3 flex items-center justify-between px-1">
            <h3 className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-foreground">
              <ListChecks className="h-4 w-4 text-accent" />
              <span>Mis tareas asignadas</span>
            </h3>
            <span className="hidden text-xs font-medium text-muted-foreground sm:inline">
              Toca la casilla para completar
            </span>
          </div>

          {isLoading ? (
            <p className="px-1 text-sm text-muted-foreground">Cargando tareas…</p>
          ) : myTasks.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-border p-6 py-10 text-center">
              <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-accent">
                <Coffee className="h-6 w-6" />
              </div>
              <h4 className="text-base font-bold text-foreground">¡Todo al día!</h4>
              <p className="mt-1 text-xs text-muted-foreground">
                No tienes tareas pendientes en tu lista personal por ahora.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {myTasks.map((task) => {
                const isDone = task.status === "completed";
                return (
                  <div
                    key={task.id}
                    className={`card-surface press p-4 ${isDone ? "border-accent/40 bg-accent/5" : ""}`}
                  >
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <button
                        onClick={() => toggle.mutate({ task })}
                        aria-label={isDone ? "Marcar como pendiente" : "Marcar como completada"}
                        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border-2 transition-all ${
                          isDone
                            ? "border-accent bg-accent text-accent-foreground shadow-md"
                            : "border-border bg-secondary text-transparent hover:border-primary"
                        }`}
                      >
                        <Check className="h-4 w-4" />
                      </button>

                      <div className="min-w-0 flex-1">
                        <h4
                          className={`text-sm font-bold ${isDone ? "text-muted-foreground line-through" : "text-foreground"}`}
                        >
                          {task.title}
                        </h4>
                        {task.description ? (
                          <p
                            className={`mt-0.5 text-xs text-muted-foreground ${isDone ? "line-through" : ""}`}
                          >
                            {task.description}
                          </p>
                        ) : null}

                        {task.image_url ? (
                          <button
                            onClick={() => setLightbox(task.image_url)}
                            className="relative mt-2 block w-full overflow-hidden rounded-xl border border-border bg-muted"
                          >
                            <img
                              src={task.image_url}
                              alt={`Foto de la tarea ${task.title}`}
                              loading="lazy"
                              className="h-28 w-full object-cover"
                            />
                            <span className="absolute bottom-1.5 right-1.5 flex items-center gap-1 rounded-lg bg-surface-dark/80 px-2 py-0.5 text-[10px] font-medium text-surface-dark-foreground">
                              <Expand className="h-3 w-3" /> Toca para ampliar
                            </span>
                          </button>
                        ) : null}

                        <div className="mt-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${priorityClasses(task.priority)}`}
                          >
                            Prioridad: {priorityLabel(task.priority)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="border-t border-border pt-6">
          <div className="mb-3 flex items-center justify-between px-1">
            <div>
              <h3 className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-foreground">
                <HandHelping className="h-4 w-4 text-primary" />
                <span>Tareas disponibles (bolsa libre)</span>
              </h3>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Puedes tomar tareas libres para realizarlas en tu turno
              </p>
            </div>
            <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
              {availableTasks.length}
            </span>
          </div>

          {availableTasks.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-border bg-muted/60 p-6 py-8 text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                <CheckCheck className="h-5 w-5" />
              </div>
              <h4 className="text-sm font-semibold text-foreground">No hay tareas sin asignar</h4>
              <p className="mt-1 text-xs text-muted-foreground">
                Todas las tareas tienen asignado un operario.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {availableTasks.map((task) => (
                <div
                  key={task.id}
                  className="card-surface flex flex-col justify-between space-y-3 border-primary/20 p-4 transition hover:border-primary/50"
                >
                  <div>
                    <span className="mb-2 inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-primary">
                      <HandHelping className="h-3 w-3" /> Disponible
                    </span>
                    <h4 className="text-sm font-bold text-foreground">{task.title}</h4>
                    {task.description ? (
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {task.description}
                      </p>
                    ) : null}
                    {task.image_url ? (
                      <button
                        onClick={() => setLightbox(task.image_url)}
                        className="mt-2 block w-full overflow-hidden rounded-xl border border-border"
                      >
                        <img
                          src={task.image_url}
                          alt={`Foto de la tarea ${task.title}`}
                          loading="lazy"
                          className="h-24 w-full object-cover"
                        />
                      </button>
                    ) : null}
                  </div>

                  <div className="flex items-center justify-between border-t border-border pt-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${priorityClasses(task.priority)}`}
                    >
                      Prioridad: {priorityLabel(task.priority)}
                    </span>
                    <button
                      onClick={() => claim.mutate({ task })}
                      disabled={!selectedWorkerId || claim.isPending}
                      className="press flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-bold text-primary-foreground shadow-md transition hover:opacity-90 disabled:opacity-50"
                    >
                      <Plus className="h-3.5 w-3.5" /> Tomar tarea
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <ImageLightbox url={lightbox} onClose={() => setLightbox(null)} />
    </div>
  );
}
