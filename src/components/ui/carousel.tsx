"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import useEmblaCarousel, {
  type UseEmblaCarouselType,
} from "embla-carousel-react"
import type { EmblaOptionsType, EmblaPluginType } from "embla-carousel"

import { cn } from "@/lib/utils"

type CarouselApi = UseEmblaCarouselType[1]
type CarouselOptions = EmblaOptionsType
type CarouselPlugin = EmblaPluginType

type CarouselProps = React.HTMLAttributes<HTMLDivElement> & {
  opts?: CarouselOptions
  plugins?: CarouselPlugin[]
  orientation?: "horizontal" | "vertical"
  onApi?: (api: CarouselApi | undefined) => void
}

type CarouselContextValue = {
  carouselRef: UseEmblaCarouselType[0]
  api: CarouselApi
  orientation: NonNullable<CarouselProps["orientation"]>
  canScrollPrev: boolean
  canScrollNext: boolean
}

const CarouselContext = React.createContext<CarouselContextValue | null>(null)

export function useCarousel() {
  const context = React.useContext(CarouselContext)
  if (!context) {
    throw new Error("useCarousel must be used within <Carousel>")
  }
  return context
}

export function Carousel({
  opts,
  plugins,
  orientation = "horizontal",
  className,
  children,
  onApi,
  ...props
}: CarouselProps) {
  const [carouselRef, api] = useEmblaCarousel(
    {
      axis: orientation === "horizontal" ? "x" : "y",
      ...opts,
    },
    plugins,
  )
  const viewportNodeRef = React.useRef<HTMLDivElement | null>(null)

  const [canScrollPrev, setCanScrollPrev] = React.useState(false)
  const [canScrollNext, setCanScrollNext] = React.useState(false)
  // UX: prevent pre-init carousel flash (Embla applies transform after first paint)
  const [isReady, setIsReady] = React.useState(false)

  const onSelect = React.useCallback((carouselApi?: CarouselApi) => {
    if (!carouselApi) return
    setCanScrollPrev(carouselApi.canScrollPrev())
    setCanScrollNext(carouselApi.canScrollNext())
  }, [])

  React.useEffect(() => {
    if (!api) return
    onSelect(api)
    api.on("reInit", onSelect)
    api.on("select", onSelect)
    return () => {
      api.off("reInit", onSelect)
      api.off("select", onSelect)
    }
  }, [api, onSelect])

  React.useEffect(() => {
    if (!onApi) return
    onApi(api)
    return () => {
      onApi(undefined)
    }
  }, [api, onApi])

  // UX: prevent pre-init carousel flash (Embla applies transform after first paint)
  React.useEffect(() => {
    if (typeof window === "undefined") return
    if (isReady) return
    let rafId: number | null = null
    let frames = 0
    const maxFrames = 20

    const checkReady = () => {
      const viewport = viewportNodeRef.current
      if (!viewport) {
        rafId = window.requestAnimationFrame(checkReady)
        return
      }
      const track =
        viewport.querySelector<HTMLElement>("[data-embla-container]") ??
        (viewport.firstElementChild as HTMLElement | null)
      if (!track) {
        frames++
        if (frames >= maxFrames) {
          setIsReady(true)
          return
        }
        rafId = window.requestAnimationFrame(checkReady)
        return
      }
      const transform = window.getComputedStyle(track).transform
      frames++
      if ((transform && transform !== "none") || frames >= maxFrames) {
        setIsReady(true)
        return
      }
      rafId = window.requestAnimationFrame(checkReady)
    }

    rafId = window.requestAnimationFrame(checkReady)
    return () => {
      if (rafId) {
        window.cancelAnimationFrame(rafId)
      }
    }
  }, [isReady])

  React.useEffect(() => {
    if (!api) return
    const markReady = () => setIsReady(true)
    markReady()
    api.on("init", markReady)
    api.on("reInit", markReady)
    return () => {
      api.off("init", markReady)
      api.off("reInit", markReady)
    }
  }, [api])

  return (
    <CarouselContext.Provider
      value={{
        carouselRef,
        api,
        orientation,
        canScrollPrev,
        canScrollNext,
      }}
    >
      <div
        ref={React.useCallback(
          (node: HTMLDivElement | null) => {
            viewportNodeRef.current = node
            carouselRef(node)
          },
          [carouselRef],
        )}
        data-carousel-viewport=""
        className={cn(
          "overflow-hidden",
          !isReady && "opacity-0 pointer-events-none",
          isReady && "opacity-100",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    </CarouselContext.Provider>
  )
}

export type { CarouselApi }

export const CarouselContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { orientation } = useCarousel()
  return (
    <div
      ref={ref}
      data-embla-container=""
      className={cn(
        "flex",
        orientation === "horizontal" ? "gap-4" : "flex-col gap-4",
        className,
      )}
      {...props}
    />
  )
})
CarouselContent.displayName = "CarouselContent"

export const CarouselItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "min-w-0 shrink-0 grow-0 basis-full",
        className,
      )}
      {...props}
    />
  )
})
CarouselItem.displayName = "CarouselItem"

type CarouselButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>

const buttonBaseClasses =
  "inline-flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-900 shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20 disabled:cursor-not-allowed disabled:opacity-50 hover:bg-zinc-50"

export const CarouselPrevious = React.forwardRef<
  HTMLButtonElement,
  CarouselButtonProps
>(({ className, ...props }, ref) => {
  const { api, canScrollPrev } = useCarousel()
  return (
    <button
      ref={ref}
      type="button"
      className={cn(buttonBaseClasses, className)}
      disabled={!canScrollPrev}
      onClick={() => api?.scrollPrev()}
      {...props}
    >
      <ChevronLeft className="h-4 w-4" aria-hidden="true" />
      <span className="sr-only">Previous slide</span>
    </button>
  )
})
CarouselPrevious.displayName = "CarouselPrevious"

export const CarouselNext = React.forwardRef<
  HTMLButtonElement,
  CarouselButtonProps
>(({ className, ...props }, ref) => {
  const { api, canScrollNext } = useCarousel()
  return (
    <button
      ref={ref}
      type="button"
      className={cn(buttonBaseClasses, className)}
      disabled={!canScrollNext}
      onClick={() => api?.scrollNext()}
      {...props}
    >
      <ChevronRight className="h-4 w-4" aria-hidden="true" />
      <span className="sr-only">Next slide</span>
    </button>
  )
})
CarouselNext.displayName = "CarouselNext"


