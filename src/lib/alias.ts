const ADJECTIVES = [
  "Quiet",
  "Warm",
  "Bright",
  "Gentle",
  "Calm",
  "Clear",
  "Soft",
  "Fresh",
  "True",
  "Sly",
  "Wry",
  "Zesty",
  "Jazzy",
  "Spry",
  "Cheeky",
  "Nimble",
  "Odd",
  "Rogue",
  "Charmed",
  "Liminal",
  "Neon",
  "Phantom",
  "Ferrous",
  "Astral",
  "Obsidian",
  "Velvet",
  "Verdant",
  "Ultramarine",
  "Noctilucent",
] as const

const COLORS = [
  "Indigo",
  "Jade",
  "Amber",
  "Copper",
  "Obsidian",
  "Vermilion",
  "Slate",
  "Opal",
  "Quartz",
  "Neon",
  "Verdigris",
  "Cobalt",
  "Crimson",
  "Ivory",
  "Onyx",
  "Umber",
  "Saffron",
  "Teal",
  "Cerulean",
  "Magenta",
  "Bronze",
  "Silver",
  "Gold",
  "Emerald",
  "Topaz",
  "Garnet",
] as const

const ARCHETYPES = [
  "Cartographer",
  "Trickster",
  "Navigator",
  "Archivist",
  "Tinkerer",
  "Whisperer",
  "Forager",
  "Cipher",
  "Alchemist",
  "Wayfarer",
  "Sentinel",
  "Raconteur",
  "Naturalist",
  "Astronomer",
  "Conservator",
  "Weaver",
  "Scribe",
  "Scout",
  "Herald",
  "Artificer",
] as const

export function generateAlias(randomFn?: () => number) {
  const random = randomFn ?? Math.random

  const adjective = pickRandom(ADJECTIVES, random)
  const color = pickRandom(COLORS, random)
  const archetype = pickRandom(ARCHETYPES, random)

  return `${adjective} ${color} ${archetype}`
}

function pickRandom<T>(items: readonly T[], randomFn: () => number): T {
  const index = Math.floor(randomFn() * items.length)
  return items[Math.min(index, items.length - 1)]
}

