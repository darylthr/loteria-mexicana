export type ThemeId = 'dark' | 'muertos' | 'bandera' | 'independencia'

export const THEMES: Record<ThemeId, { label: string; description: string; swatches: string[] }> = {
  dark: {
    label: 'Oscuro',
    description: 'Clásico',
    swatches: ['#1c1917', '#d97706', '#44403c'],
  },
  muertos: {
    label: 'Día de Muertos',
    description: '2 Nov',
    swatches: ['#1a0530', '#f97316', '#ec4899'],
  },
  bandera: {
    label: 'Día de la Bandera',
    description: '24 Feb',
    swatches: ['#052e16', '#dc2626', '#16a34a'],
  },
  independencia: {
    label: 'Independencia',
    description: '16 Sep',
    swatches: ['#1a0a06', '#d4af37', '#b91c1c'],
  },
}

export function getTheme(): ThemeId {
  return (localStorage.getItem('loteria-theme') as ThemeId | null) ?? 'dark'
}

export function setTheme(id: ThemeId): void {
  localStorage.setItem('loteria-theme', id)
  document.documentElement.setAttribute('data-theme', id)
}

export function initTheme(): void {
  document.documentElement.setAttribute('data-theme', getTheme())
}
