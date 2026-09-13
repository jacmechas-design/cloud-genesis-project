import { X } from "lucide-react";

export function ImageLightbox({ url, onClose }: { url: string | null; onClose: () => void }) {
  if (!url) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex cursor-pointer items-center justify-center bg-surface-dark/90 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        aria-label="Cerrar imagen"
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-card/10 text-surface-dark-foreground transition hover:bg-card/20"
      >
        <X className="h-5 w-5" />
      </button>
      <img
        src={url}
        alt="Foto de la tarea ampliada"
        className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl"
      />
    </div>
  );
}
