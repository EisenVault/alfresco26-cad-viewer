export type HostQuery = {
  url: string
  chrome: boolean
}

export function parseQuery(): HostQuery {
  const params = new URLSearchParams(window.location.search)
  return {
    url: params.get('url')?.trim() ?? '',
    chrome: params.get('chrome') !== '0'
  }
}
