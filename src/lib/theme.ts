export type ThemeId = 'dark' | 'light' | 'muertos' | 'bandera' | 'independencia'

export const THEMES: Record<ThemeId, { label: string; description: string; swatches: string[] }> = {
  dark: {
    label: 'Oscuro',
    description: 'Clásico',
    swatches: ['#1e1b18', '#c87533', '#3c3733'],
  },
  light: {
    label: 'Claro',
    description: 'Diurno',
    swatches: ['#f5f0e8', '#b45309', '#ddd5c8'],
  },
  muertos: {
    label: 'Día de Muertos',
    description: '2 Nov',
    swatches: ['#180c2c', '#d9724a', '#7344c0'],
  },
  bandera: {
    label: 'Día de la Bandera',
    description: '24 Feb',
    swatches: ['#0c1f18', '#b83030', '#254d38'],
  },
  independencia: {
    label: 'Independencia',
    description: '16 Sep',
    swatches: ['#1a1208', '#c9a327', '#5c4020'],
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
