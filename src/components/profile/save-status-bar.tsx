"use client"

type SaveStatus = "idle" | "saving" | "saved" | "error"

type SaveStatusBarProps = {
  status: SaveStatus
  label: string
  backLabel: string
  onBack: () => void
}

const STATUS_STYLES: Record<SaveStatus, { dot: string; bar: string; text: string }> = {
  idle: {
    dot: "bg-zinc-500",
    bar: "bg-zinc-900/80 border-white/5",
    text: "text-zinc-300",
  },
  saving: {
    dot: "bg-amber-400",
    bar: "bg-amber-900/20 border-amber-500/30",
    text: "text-amber-100",
  },
  saved: {
    dot: "bg-emerald-400",
    bar: "bg-emerald-900/20 border-emerald-500/30",
    text: "text-emerald-100",
  },
  error: {
    dot: "bg-red-400",
    bar: "bg-red-900/30 border-red-500/30",
    text: "text-red-100",
  },
}

export function SaveStatusBar({
  status,
  label,
  backLabel,
  onBack,
}: SaveStatusBarProps) {
  const styles = STATUS_STYLES[status]

  return (
    <div
      className={`sticky top-0 z-30 flex h-12 w-full items-center justify-between gap-3 border-b px-4 font-medium backdrop-blur ${styles.bar}`}
    >
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm text-white transition hover:text-white/80"
      >
        ← {backLabel}
      </button>
      <div className="flex items-center gap-3">
        <span className={`h-2.5 w-2.5 rounded-full ${styles.dot}`} aria-hidden />
        <span className={`text-sm ${styles.text}`}>{label}</span>
      </div>
      <div className="w-16" aria-hidden />
    </div>
  )
}

