export const HOOK_CATEGORY_IDS = [
  "openers",
  "food_drink",
  "music",
  "nightlife",
  "arts_design",
  "outdoors",
  "movement_sports",
  "tech_creative",
  "local_culture",
] as const

export type HookCategoryId = (typeof HOOK_CATEGORY_IDS)[number]

export const HOOK_CATEGORY_LABEL_KEYS: Record<HookCategoryId, string> = {
  openers: "profile.hooks.category.openers",
  food_drink: "profile.hooks.category.food_drink",
  music: "profile.hooks.category.music",
  nightlife: "profile.hooks.category.nightlife",
  arts_design: "profile.hooks.category.arts_design",
  outdoors: "profile.hooks.category.outdoors",
  movement_sports: "profile.hooks.category.movement_sports",
  tech_creative: "profile.hooks.category.tech_creative",
  local_culture: "profile.hooks.category.local_culture",
}

export type HookType = "global" | "city" | "country" | "venue"

export type HookCatalogEntry = {
  id: string
  categoryId: HookCategoryId
  labelKey: string
  type: HookType
}

export const HOOK_CATALOG: HookCatalogEntry[] = [
  {
    id: "openers-quick-chats",
    categoryId: "openers",
    labelKey: "profile.hooks.label.openers.quickChats",
    type: "global",
  },
  {
    id: "openers-happy-to-help",
    categoryId: "openers",
    labelKey: "profile.hooks.label.openers.happyToHelp",
    type: "global",
  },
  {
    id: "openers-inspires-you",
    categoryId: "openers",
    labelKey: "profile.hooks.label.openers.inspiresYou",
    type: "global",
  },
  {
    id: "openers-show-me-around",
    categoryId: "openers",
    labelKey: "profile.hooks.label.openers.showMeAround",
    type: "global",
  },
  {
    id: "openers-browsing-vibe",
    categoryId: "openers",
    labelKey: "profile.hooks.label.openers.browsingVibe",
    type: "global",
  },
  {
    id: "food-bite",
    categoryId: "food_drink",
    labelKey: "profile.hooks.label.foodDrink.grabBite",
    type: "global",
  },
  {
    id: "food-espresso-crawl",
    categoryId: "food_drink",
    labelKey: "profile.hooks.label.foodDrink.espressoCrawl",
    type: "global",
  },
  {
    id: "food-spaeti-beer",
    categoryId: "food_drink",
    labelKey: "profile.hooks.label.foodDrink.spaetiBeer",
    type: "city",
  },
  {
    id: "food-ramen-buddy",
    categoryId: "food_drink",
    labelKey: "profile.hooks.label.foodDrink.ramenBuddy",
    type: "global",
  },
  {
    id: "food-fav-doener",
    categoryId: "food_drink",
    labelKey: "profile.hooks.label.foodDrink.favoriteDoener",
    type: "city",
  },
  {
    id: "food-venue-menu-recs",
    categoryId: "food_drink",
    labelKey: "profile.hooks.label.foodDrink.menuRecs",
    type: "venue",
  },
  {
    id: "food-venue-fav-cocktail",
    categoryId: "food_drink",
    labelKey: "profile.hooks.label.foodDrink.favoriteCocktail",
    type: "venue",
  },
  {
    id: "music-rave-buddy",
    categoryId: "music",
    labelKey: "profile.hooks.label.music.raveBuddy",
    type: "city",
  },
  {
    id: "music-vinyl-dig-kreuzberg",
    categoryId: "music",
    labelKey: "profile.hooks.label.music.vinylDig",
    type: "city",
  },
  {
    id: "music-ableton-talk",
    categoryId: "music",
    labelKey: "profile.hooks.label.music.abletonTalk",
    type: "global",
  },
  {
    id: "music-small-gig-tonight",
    categoryId: "music",
    labelKey: "profile.hooks.label.music.smallGig",
    type: "global",
  },
  {
    id: "music-trade-playlists",
    categoryId: "music",
    labelKey: "profile.hooks.label.music.tradePlaylists",
    type: "global",
  },
  {
    id: "nightlife-berghain-joke",
    categoryId: "nightlife",
    labelKey: "profile.hooks.label.nightlife.berghain",
    type: "city",
  },
  {
    id: "nightlife-bar-hop-neukoelln",
    categoryId: "nightlife",
    labelKey: "profile.hooks.label.nightlife.barHop",
    type: "city",
  },
  {
    id: "nightlife-karaoke",
    categoryId: "nightlife",
    labelKey: "profile.hooks.label.nightlife.karaoke",
    type: "global",
  },
  {
    id: "nightlife-lowkey-cocktail",
    categoryId: "nightlife",
    labelKey: "profile.hooks.label.nightlife.lowkeyCocktail",
    type: "global",
  },
  {
    id: "nightlife-afters",
    categoryId: "nightlife",
    labelKey: "profile.hooks.label.nightlife.afters",
    type: "city",
  },
  {
    id: "arts-gallery-stroll",
    categoryId: "arts_design",
    labelKey: "profile.hooks.label.artsDesign.galleryStroll",
    type: "global",
  },
  {
    id: "arts-photo-walk",
    categoryId: "arts_design",
    labelKey: "profile.hooks.label.artsDesign.photoWalk",
    type: "global",
  },
  {
    id: "arts-zines-risos",
    categoryId: "arts_design",
    labelKey: "profile.hooks.label.artsDesign.zines",
    type: "global",
  },
  {
    id: "arts-design-nerdery",
    categoryId: "arts_design",
    labelKey: "profile.hooks.label.artsDesign.designNerdery",
    type: "global",
  },
  {
    id: "arts-sketch-coffee",
    categoryId: "arts_design",
    labelKey: "profile.hooks.label.artsDesign.sketchCoffee",
    type: "global",
  },
  {
    id: "outdoors-tempelhof-sunset",
    categoryId: "outdoors",
    labelKey: "profile.hooks.label.outdoors.tempelhofSunset",
    type: "city",
  },
  {
    id: "outdoors-canal-walk",
    categoryId: "outdoors",
    labelKey: "profile.hooks.label.outdoors.canalWalk",
    type: "city",
  },
  {
    id: "outdoors-park-picnic",
    categoryId: "outdoors",
    labelKey: "profile.hooks.label.outdoors.parkPicnic",
    type: "global",
  },
  {
    id: "outdoors-new-kiez",
    categoryId: "outdoors",
    labelKey: "profile.hooks.label.outdoors.newKiez",
    type: "city",
  },
  {
    id: "outdoors-bouldering-spot",
    categoryId: "outdoors",
    labelKey: "profile.hooks.label.outdoors.boulderingSpot",
    type: "global",
  },
  {
    id: "move-gym-buddy",
    categoryId: "movement_sports",
    labelKey: "profile.hooks.label.movement.gymBuddy",
    type: "global",
  },
  {
    id: "move-bouldering-session",
    categoryId: "movement_sports",
    labelKey: "profile.hooks.label.movement.boulderingSession",
    type: "global",
  },
  {
    id: "move-run-canal",
    categoryId: "movement_sports",
    labelKey: "profile.hooks.label.movement.canalRun",
    type: "city",
  },
  {
    id: "move-yoga-park",
    categoryId: "movement_sports",
    labelKey: "profile.hooks.label.movement.yogaPark",
    type: "global",
  },
  {
    id: "move-teach-me-sport",
    categoryId: "movement_sports",
    labelKey: "profile.hooks.label.movement.teachSport",
    type: "global",
  },
  {
    id: "tech-hack-snack",
    categoryId: "tech_creative",
    labelKey: "profile.hooks.label.techCreative.hackSnack",
    type: "global",
  },
  {
    id: "tech-idea-swap",
    categoryId: "tech_creative",
    labelKey: "profile.hooks.label.techCreative.ideaSwap",
    type: "global",
  },
  {
    id: "tech-no-hype-ai",
    categoryId: "tech_creative",
    labelKey: "profile.hooks.label.techCreative.noHypeAi",
    type: "global",
  },
  {
    id: "tech-creative-code",
    categoryId: "tech_creative",
    labelKey: "profile.hooks.label.techCreative.creativeCode",
    type: "global",
  },
  {
    id: "tech-side-project",
    categoryId: "tech_creative",
    labelKey: "profile.hooks.label.techCreative.sideProject",
    type: "global",
  },
  {
    id: "culture-hidden-courtyards",
    categoryId: "local_culture",
    labelKey: "profile.hooks.label.localCulture.hiddenCourtyards",
    type: "city",
  },
  {
    id: "culture-flea-market",
    categoryId: "local_culture",
    labelKey: "profile.hooks.label.localCulture.fleaMarket",
    type: "city",
  },
  {
    id: "culture-best-saunas",
    categoryId: "local_culture",
    labelKey: "profile.hooks.label.localCulture.bestSaunas",
    type: "country",
  },
  {
    id: "culture-bookshop-crawl",
    categoryId: "local_culture",
    labelKey: "profile.hooks.label.localCulture.bookshopCrawl",
    type: "global",
  },
  {
    id: "culture-kiez-story",
    categoryId: "local_culture",
    labelKey: "profile.hooks.label.localCulture.kiezStory",
    type: "city",
  },
]

export const HOOKS_BY_CATEGORY: Record<HookCategoryId, HookCatalogEntry[]> =
  HOOK_CATEGORY_IDS.reduce(
    (acc, categoryId) => {
      acc[categoryId] = HOOK_CATALOG.filter(
        (entry) => entry.categoryId === categoryId,
      )
      return acc
    },
    {} as Record<HookCategoryId, HookCatalogEntry[]>,
  )

export const HOOK_TYPE_LABEL_KEYS: Record<HookType, string> = {
  global: "profile.hooks.type.global",
  city: "profile.hooks.type.city",
  country: "profile.hooks.type.country",
  venue: "profile.hooks.type.venue",
}

