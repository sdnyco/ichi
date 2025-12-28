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
  ...props
}: CarouselProps) {
  const [carouselRef, api] = useEmblaCarousel(
    {
      axis: orientation === "horizontal" ? "x" : "y",
      ...opts,
    },
    plugins,
  )

  const [canScrollPrev, setCanScrollPrev] = React.useState(false)
  const [canScrollNext, setCanScrollNext] = React.useState(false)

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
      <div ref={carouselRef} className={cn("overflow-hidden", className)} {...props}>
        {children}
      </div>
    </CarouselContext.Provider>
  )
}

export const CarouselContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { orientation } = useCarousel()
  return (
    <div
      ref={ref}
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


