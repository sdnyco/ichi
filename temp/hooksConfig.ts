export const openness = {
  focused: {
    key: 'focused' as const,
    description: 'prefer solo / minimal chat',
  },
  casual: {
    key: 'casual' as const,
    description: 'open to light conversation',
  },
  chatty: {
    key: 'chatty' as const,
    description: 'happy to chat',
  },
  outgoing: {
    key: 'outgoing' as const,
    description: 'actively looking to meet people',
  },
} as const

export const defaultOpenness = openness.casual.key

export const status = {
  here_now: 'here_now' as const,
  anchored: 'anchored' as const,
} as const

export const hookCategory = {
  openers: 'openers' as const,
  food_drink: 'food_drink' as const,
  music: 'music' as const,
  nightlife: 'nightlife' as const,
  arts_design: 'arts_design' as const,
  outdoors: 'outdoors' as const,
  movement_sports: 'movement_sports' as const,
  tech_creative: 'tech_creative' as const,
  local_culture: 'local_culture' as const,
} as const

export type OpennessKey = keyof typeof openness
export type StatusKey = keyof typeof status
export type HookCategory = keyof typeof hookCategory

export const PROFILE_HOOK_LIMIT = 3
export const HOOK_LABEL_MAX_LENGTH = 36
export const RECOGNITION_HINT_MAX_LENGTH = 200

export type HookOptionType = 'global' | 'city' | 'country' | 'venue'
export type HookIntensity = 'soft' | 'direct' | 'plan'

export type HookCatalogEntry = {
  id: string
  category: HookCategory
  label: string
  optionType: HookOptionType
  intensity?: HookIntensity
  meta?: Record<string, string>
}

export const hookCategoriesOrdered = [
  hookCategory.openers,
  hookCategory.food_drink,
  hookCategory.music,
  hookCategory.nightlife,
  hookCategory.arts_design,
  hookCategory.outdoors,
  hookCategory.movement_sports,
  hookCategory.tech_creative,
  hookCategory.local_culture,
] as const

export const hookCategoryLabels: Record<HookCategory, string> = {
  openers: 'Openers',
  food_drink: 'Food & Drink',
  music: 'Music',
  nightlife: 'Nightlife',
  arts_design: 'Arts & Design',
  outdoors: 'Outdoors',
  movement_sports: 'Movement & Sports',
  tech_creative: 'Tech & Creative',
  local_culture: 'Local Culture',
}

export const hookCatalog: HookCatalogEntry[] = [
  {
    id: 'openers-quick-chats',
    category: 'openers',
    label: 'Down for quick chats',
    optionType: 'global',
    intensity: 'soft',
  },
  {
    id: 'openers-happy-to-help',
    category: 'openers',
    label: 'Happy to help',
    optionType: 'global',
    intensity: 'soft',
  },
  {
    id: 'openers-inspires-you',
    category: 'openers',
    label: 'Tell me what inspires you',
    optionType: 'global',
    intensity: 'direct',
  },
  {
    id: 'openers-show-me-around',
    category: 'openers',
    label: 'New in town, show me around',
    optionType: 'global',
    intensity: 'plan',
  },
  {
    id: 'openers-browsing-vibe',
    category: 'openers',
    label: 'Just browsing the vibe',
    optionType: 'global',
    intensity: 'soft',
  },
  {
    id: 'food-bite',
    category: 'food_drink',
    label: "Let's grab a bite",
    optionType: 'global',
    intensity: 'plan',
  },
  {
    id: 'food-espresso-crawl',
    category: 'food_drink',
    label: 'Espresso crawl?',
    optionType: 'global',
    intensity: 'plan',
  },
  {
    id: 'food-spaeti-beer',
    category: 'food_drink',
    label: 'Späti beer & talk',
    optionType: 'city',
    intensity: 'plan',
  },
  {
    id: 'food-ramen-buddy',
    category: 'food_drink',
    label: 'Looking for a ramen buddy',
    optionType: 'global',
    intensity: 'plan',
  },
  {
    id: 'food-fav-doener',
    category: 'food_drink',
    label: "Where's your favorite Döner?",
    optionType: 'city',
    intensity: 'direct',
  },
  {
    id: 'food-venue-menu-recs',
    category: 'food_drink',
    label: 'What do you recommend from the menu?',
    optionType: 'venue',
    intensity: 'direct',
  },
  {
    id: 'food-venue-fav-cocktail',
    category: 'food_drink',
    label: "What's your favorite cocktail here?",
    optionType: 'venue',
    intensity: 'direct',
  },
  {
    id: 'music-rave-buddy',
    category: 'music',
    label: 'Looking for a rave buddy',
    optionType: 'city',
    intensity: 'plan',
  },
  {
    id: 'music-vinyl-dig-kreuzberg',
    category: 'music',
    label: 'Vinyl dig around Kreuzberg?',
    optionType: 'city',
    intensity: 'plan',
  },
  {
    id: 'music-ableton-talk',
    category: 'music',
    label: 'Talk Ableton & live sets',
    optionType: 'global',
    intensity: 'direct',
  },
  {
    id: 'music-small-gig-tonight',
    category: 'music',
    label: "Small gig tonight—join?",
    optionType: 'global',
    intensity: 'plan',
  },
  {
    id: 'music-trade-playlists',
    category: 'music',
    label: 'Trade playlists',
    optionType: 'global',
    intensity: 'soft',
  },
  {
    id: 'nightlife-berghain-joke',
    category: 'nightlife',
    label: "Let's get rejected at Berghain",
    optionType: 'city',
    intensity: 'plan',
  },
  {
    id: 'nightlife-bar-hop-neukoelln',
    category: 'nightlife',
    label: 'Easy bar hop in Neukölln',
    optionType: 'city',
    intensity: 'plan',
  },
  {
    id: 'nightlife-karaoke',
    category: 'nightlife',
    label: 'Karaoke ring-in',
    optionType: 'global',
    intensity: 'plan',
  },
  {
    id: 'nightlife-lowkey-cocktail',
    category: 'nightlife',
    label: 'Low-key cocktail chat',
    optionType: 'global',
    intensity: 'plan',
  },
  {
    id: 'nightlife-afters',
    category: 'nightlife',
    label: "Where's good afters?",
    optionType: 'city',
    intensity: 'direct',
  },
  {
    id: 'arts-gallery-stroll',
    category: 'arts_design',
    label: 'Gallery stroll?',
    optionType: 'global',
    intensity: 'plan',
  },
  {
    id: 'arts-photo-walk',
    category: 'arts_design',
    label: 'Street photography walk',
    optionType: 'global',
    intensity: 'plan',
  },
  {
    id: 'arts-zines-risos',
    category: 'arts_design',
    label: 'Zines & risos, anyone?',
    optionType: 'global',
    intensity: 'soft',
  },
  {
    id: 'arts-design-nerdery',
    category: 'arts_design',
    label: 'Design nerdery welcome',
    optionType: 'global',
    intensity: 'direct',
  },
  {
    id: 'arts-sketch-coffee',
    category: 'arts_design',
    label: 'Sketch & coffee',
    optionType: 'global',
    intensity: 'plan',
  },
  {
    id: 'outdoors-tempelhof-sunset',
    category: 'outdoors',
    label: 'Sunset at Tempelhofer Feld',
    optionType: 'city',
    intensity: 'plan',
  },
  {
    id: 'outdoors-canal-walk',
    category: 'outdoors',
    label: 'Canal walk & chat',
    optionType: 'city',
    intensity: 'plan',
  },
  {
    id: 'outdoors-park-picnic',
    category: 'outdoors',
    label: 'Park picnic alliance',
    optionType: 'global',
    intensity: 'plan',
  },
  {
    id: 'outdoors-new-kiez',
    category: 'outdoors',
    label: 'Explore a new Kiez',
    optionType: 'city',
    intensity: 'plan',
  },
  {
    id: 'outdoors-bouldering-spot',
    category: 'outdoors',
    label: 'Looking for a bouldering spot',
    optionType: 'global',
    intensity: 'direct',
  },
  {
    id: 'move-gym-buddy',
    category: 'movement_sports',
    label: 'Looking for a gym buddy',
    optionType: 'global',
    intensity: 'plan',
  },
  {
    id: 'move-bouldering-session',
    category: 'movement_sports',
    label: 'Bouldering session?',
    optionType: 'global',
    intensity: 'plan',
  },
  {
    id: 'move-run-canal',
    category: 'movement_sports',
    label: 'Run by the canal',
    optionType: 'city',
    intensity: 'plan',
  },
  {
    id: 'move-yoga-park',
    category: 'movement_sports',
    label: 'Yoga in the park',
    optionType: 'global',
    intensity: 'plan',
  },
  {
    id: 'move-teach-me-sport',
    category: 'movement_sports',
    label: 'Teach me a new sport',
    optionType: 'global',
    intensity: 'direct',
  },
  {
    id: 'tech-hack-snack',
    category: 'tech_creative',
    label: 'Hack & snack (light co-work)',
    optionType: 'global',
    intensity: 'plan',
  },
  {
    id: 'tech-idea-swap',
    category: 'tech_creative',
    label: 'Idea swap: startups & UX',
    optionType: 'global',
    intensity: 'direct',
  },
  {
    id: 'tech-no-hype-ai',
    category: 'tech_creative',
    label: 'Talk AI without hype',
    optionType: 'global',
    intensity: 'direct',
  },
  {
    id: 'tech-creative-code',
    category: 'tech_creative',
    label: 'Creative coding jam',
    optionType: 'global',
    intensity: 'plan',
  },
  {
    id: 'tech-side-project',
    category: 'tech_creative',
    label: 'Show me your side project',
    optionType: 'global',
    intensity: 'direct',
  },
  {
    id: 'culture-hidden-courtyards',
    category: 'local_culture',
    label: 'Hidden courtyards tour',
    optionType: 'city',
    intensity: 'plan',
  },
  {
    id: 'culture-flea-market',
    category: 'local_culture',
    label: 'Flea market browse',
    optionType: 'city',
    intensity: 'plan',
  },
  {
    id: 'culture-best-saunas',
    category: 'local_culture',
    label: 'Best saunas & spas?',
    optionType: 'country',
    intensity: 'direct',
  },
  {
    id: 'culture-bookshop-crawl',
    category: 'local_culture',
    label: 'Bookshop crawl',
    optionType: 'global',
    intensity: 'plan',
  },
  {
    id: 'culture-kiez-story',
    category: 'local_culture',
    label: 'Your favorite Kiez story',
    optionType: 'city',
    intensity: 'direct',
  },
]

export const hookCatalogByCategory = hookCategoriesOrdered.reduce<Record<HookCategory, HookCatalogEntry[]>>((acc, category) => {
  acc[category] = hookCatalog.filter(entry => entry.category === category)
  return acc
}, {} as Record<HookCategory, HookCatalogEntry[]>)

const hookCatalogIds = new Set<string>(hookCatalog.map(entry => entry.id))

export function hasMinimumHooks(selectedHookIds: unknown, min = 1): boolean {
  if (!Array.isArray(selectedHookIds)) return false
  let count = 0
  const seen = new Set<string>()
  for (const raw of selectedHookIds) {
    const value = typeof raw === 'string' ? raw.trim() : ''
    if (!value || seen.has(value)) continue
    seen.add(value)
    if (hookCatalogIds.has(value)) {
      count++
      if (count >= min) return true
    }
  }
  return count >= min
}

export const interestsDeprecated = true

