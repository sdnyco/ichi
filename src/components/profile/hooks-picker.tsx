"use client"

import { useMemo, useState } from "react"
import {
  MessageCircle,
  Utensils,
  Music4,
  Sparkles,
  Palette,
  Mountain,
  Dumbbell,
  Cpu,
  Landmark,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import {
  HOOKS_BY_CATEGORY,
  HOOK_CATEGORY_IDS,
  HOOK_CATEGORY_LABEL_KEYS,
  HOOK_TYPE_LABEL_KEYS,
  type HookCategoryId,
} from "@/lib/hooks-catalog"
import { t, type Locale } from "@/lib/i18n"

type HooksPickerProps = {
  locale: Locale
  selected: string[]
  max: number
  disabled?: boolean
  onChange: (next: string[]) => void
}

export function HooksPicker({
  locale,
  selected,
  max,
  disabled,
  onChange,
}: HooksPickerProps) {
  const [activeCategory, setActiveCategory] = useState<HookCategoryId>(
    HOOK_CATEGORY_IDS[0],
  )

  const categoryHooks = useMemo(
    () => HOOKS_BY_CATEGORY[activeCategory] ?? [],
    [activeCategory],
  )

  const canSelectMore = selected.length < max

  function toggleHook(hookId: string) {
    if (disabled) return
    if (selected.includes(hookId)) {
      onChange(selected.filter((value) => value !== hookId))
      return
    }

    if (!canSelectMore) return
    onChange([...selected, hookId])
  }

  const CATEGORY_ICONS: Record<HookCategoryId, LucideIcon> = {
    openers: MessageCircle,
    food_drink: Utensils,
    music: Music4,
    nightlife: Sparkles,
    arts_design: Palette,
    outdoors: Mountain,
    movement_sports: Dumbbell,
    tech_creative: Cpu,
    local_culture: Landmark,
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {HOOK_CATEGORY_IDS.map((categoryId) => {
          const label = t(locale, HOOK_CATEGORY_LABEL_KEYS[categoryId])
          const isActive = activeCategory === categoryId
          const Icon = CATEGORY_ICONS[categoryId]
          return (
            <button
              key={categoryId}
              type="button"
              onClick={() => setActiveCategory(categoryId)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition",
                isActive
                  ? "border-white bg-white text-zinc-900 shadow"
                  : "border-white/30 text-zinc-200 hover:border-white/60",
              )}
              aria-pressed={isActive}
            >
              <Icon className={cn("h-4 w-4", isActive ? "text-zinc-900" : "text-white")} />
              <span>{label}</span>
            </button>
          )
        })}
      </div>

      <div className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-4">
        {categoryHooks.length === 0 ? (
          <p className="text-sm text-zinc-400">
            {t(locale, "profile.hooks.empty")}
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {categoryHooks.map((hook) => {
              const isSelected = selected.includes(hook.id)
              const typeLabel =
                hook.type === "global"
                  ? null
                  : t(locale, HOOK_TYPE_LABEL_KEYS[hook.type])
              const isDisabled =
                disabled ||
                (!isSelected && !canSelectMore) ||
                (hook.type === "venue" && disabled)

              return (
                <button
                  key={hook.id}
                  type="button"
                  onClick={() => toggleHook(hook.id)}
                  disabled={isDisabled}
                  className={cn(
                    "group inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 disabled:cursor-not-allowed disabled:opacity-40",
                    isSelected
                      ? "border-white bg-white text-zinc-900"
                      : "border-white/30 text-zinc-100 hover:border-white/60",
                  )}
                >
                  <span>{t(locale, hook.labelKey)}</span>
                  {typeLabel ? (
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-semibold",
                        isSelected
                          ? "bg-zinc-900 text-white"
                          : "bg-white/10 text-zinc-100",
                      )}
                    >
                      {typeLabel}
                    </span>
                  ) : null}
                </button>
              )
            })}
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-zinc-400">
          <span>
            {t(locale, "profile.hooks.selectedCount", {
              count: `${selected.length}/${max}`,
            })}
          </span>
          {!disabled ? (
            <span>
              {t(locale, "profile.hooks.limit", { count: String(max) })}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  )
}

