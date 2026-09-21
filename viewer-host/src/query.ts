import { AcEdOpenMode } from '@mlightcad/cad-simple-viewer'

export type ViewerMode = 'read' | 'review' | 'write'

export type HostQuery = {
  url: string
  mode: ViewerMode
  chrome: boolean
}

export function parseQuery(): HostQuery {
  const params = new URLSearchParams(window.location.search)
  const url = params.get('url')?.trim() ?? ''
  const rawMode = (params.get('mode') ?? 'read').toLowerCase()
  const mode: ViewerMode =
    rawMode === 'write' ? 'write' : rawMode === 'review' ? 'review' : 'read'
  return {
    url,
    mode,
    chrome: params.get('chrome') !== '0'
  }
}

export function toOpenMode(mode: ViewerMode): AcEdOpenMode {
  if (mode === 'write') {
    return AcEdOpenMode.Write
  }
  if (mode === 'review') {
    return AcEdOpenMode.Review
  }
  return AcEdOpenMode.Read
}
