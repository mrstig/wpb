/** Joins conditional class names (tiny classnames replacement). */
export function cx(
  base: string,
  mods: Record<string, boolean | undefined>,
): string {
  return [
    base,
    ...Object.entries(mods)
      .filter(([, on]) => on)
      .map(([name]) => name),
  ].join(' ');
}
