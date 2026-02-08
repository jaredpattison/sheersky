export function parseLinkingUrl(url: string): URL {
  /*
   * Hack: add a third slash to sheersky:// urls so that `URL.host` is empty and
   * `URL.pathname` has the full path.
   */
  if (url.startsWith('sheersky://') && !url.startsWith('sheersky:///')) {
    url = url.replace('sheersky://', 'sheersky:///')
  }
  return new URL(url)
}
