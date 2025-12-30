import { BuildingSize, BuildingType } from '../core/types'

// ASCII art for each building size
export const BUILDING_ASCII: Record<BuildingSize, string[]> = {
  S: [
    '┌──┐',
    '│▒▒│',
    '│▒▒│',
    '└──┘'
  ],
  M: [
    '┌───┐',
    '│▒▒▒│',
    '│▒▒▒│',
    '│▒▒▒│',
    '│▒▒▒│',
    '└───┘'
  ],
  L: [
    '┌────┐',
    '│▒▒▒▒│',
    '│▒▒▒▒│',
    '│▒▒▒▒│',
    '│▒▒▒▒│',
    '│▒▒▒▒│',
    '│▒▒▒▒│',
    '│▒▒▒▒│',
    '│▒▒▒▒│',
    '└────┘'
  ],
  XL: [
    '  ╱╲  ',
    ' ╱──╲ ',
    '┌────┐',
    '│▒▒▒▒│',
    '│▒▒▒▒│',
    '│▒▒▒▒│',
    '│▒▒▒▒│',
    '│▒▒▒▒│',
    '│▒▒▒▒│',
    '│▒▒▒▒│',
    '│▒▒▒▒│',
    '│▒▒▒▒│',
    '│▒▒▒▒│',
    '└────┘'
  ]
}

// Degraded versions
export const BUILDING_ASCII_DEGRADED: Record<BuildingSize, string[]> = {
  S: [
    '┌──┐',
    '│░░│',
    '│ ░│',
    '└──┘'
  ],
  M: [
    '┌───┐',
    '│░ ░│',
    '│░░ │',
    '│ ░░│',
    '│░ ░│',
    '└───┘'
  ],
  L: [
    '┌────┐',
    '│░ ░ │',
    '│ ░░ │',
    '│░  ░│',
    '│ ░░ │',
    '│░ ░ │',
    '│ ░░ │',
    '│░  ░│',
    '│ ░░ │',
    '└────┘'
  ],
  XL: [
    '  ╱╲  ',
    ' ╱──╲ ',
    '┌────┐',
    '│░ ░ │',
    '│ ░░ │',
    '│░  ░│',
    '│ ░░ │',
    '│░ ░ │',
    '│ ░░ │',
    '│░  ░│',
    '│ ░░ │',
    '│░ ░ │',
    '│ ░░ │',
    '└────┘'
  ]
}

// Abandoned versions (more damaged)
export const BUILDING_ASCII_ABANDONED: Record<BuildingSize, string[]> = {
  S: [
    '┌──┐',
    '│  │',
    '│ x│',
    '└──┘'
  ],
  M: [
    '┌───┐',
    '│x  │',
    '│   │',
    '│  x│',
    '│ x │',
    '└───┘'
  ],
  L: [
    '┌────┐',
    '│x   │',
    '│    │',
    '│  x │',
    '│    │',
    '│ x  │',
    '│    │',
    '│   x│',
    '│ x  │',
    '└────┘'
  ],
  XL: [
    '  ╱╲  ',
    ' ╱──╲ ',
    '┌────┐',
    '│x   │',
    '│    │',
    '│  x │',
    '│    │',
    '│ x  │',
    '│    │',
    '│   x│',
    '│ x  │',
    '│    │',
    '│  x │',
    '└────┘'
  ]
}

// Fill character by type
export const TYPE_FILL: Record<BuildingType, string> = {
  osix: '░',
  shearn: '▓',
  estudio: '█'
}

// Get building art with correct fill
export function getBuildingArt(
  size: BuildingSize,
  type: BuildingType,
  status: 'active' | 'warning' | 'abandoned'
): string[] {
  let template: string[]

  if (status === 'abandoned') {
    template = BUILDING_ASCII_ABANDONED[size]
  } else if (status === 'warning') {
    template = BUILDING_ASCII_DEGRADED[size]
  } else {
    template = BUILDING_ASCII[size]
  }

  const fill = TYPE_FILL[type]
  return template.map(line => line.replace(/▒/g, fill))
}

// Get building width
export function getBuildingWidth(size: BuildingSize): number {
  return BUILDING_ASCII[size][0].length
}

// Get building height
export function getBuildingHeight(size: BuildingSize): number {
  return BUILDING_ASCII[size].length
}
