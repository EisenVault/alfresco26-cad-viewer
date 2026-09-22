export type HostQuery = {
  url: string
  chrome: boolean
  /** When false, export/download commands and toolbar are disabled (SiteViewer). */
  download: boolean
}

export function parseQuery(): HostQuery {
  const params = new URLSearchParams(window.location.search)
  return {
    url: params.get('url')?.trim() ?? '',
    chrome: params.get('chrome') !== '0',
    // Standalone (no download=) keeps export; Share always passes download=0|1.
    download: params.get('download') !== '0'
  }
}
