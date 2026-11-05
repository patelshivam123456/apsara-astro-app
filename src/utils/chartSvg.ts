/** Keep SVG charts out of iOS's bitmap decoder, including encoded API responses. */
export function getChartSvg(value: string): string | null {
  const clean = value.trim();
  if (/^(?:<\?xml[\s\S]*?\?>\s*)?<svg[\s>]/i.test(clean)) return clean;
  const dataUri = clean.match(/^data:image\/svg\+xml(?:;charset=[^;,]+)?(;base64)?,([\s\S]*)$/i);
  if (!dataUri) return null;
  try {
    const decoded = dataUri[1]
      ? decodeURIComponent(Array.from(globalThis.atob(dataUri[2].replace(/\s/g, "")), (char) => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`).join(""))
      : decodeURIComponent(dataUri[2]);
    return /<svg[\s>]/i.test(decoded) ? decoded : null;
  } catch {
    return null;
  }
}

/** Preserve the API's drawing coordinates when the chart is fitted to a phone. */
export function prepareChartSvg(svg: string) {
  return svg.replace(/<svg\b([^>]*)>/i, (root, attributes: string) => {
    if (/\bviewBox\s*=/i.test(attributes)) return root;
    const width = attributes.match(/\bwidth\s*=\s*["']([\d.]+)(?:px|pt)?["']/i);
    const height = attributes.match(/\bheight\s*=\s*["']([\d.]+)(?:px|pt)?["']/i);
    if (!width || !height || Number(width[1]) <= 0 || Number(height[1]) <= 0) return root;
    return `<svg${attributes} viewBox="0 0 ${width[1]} ${height[1]}">`;
  });
}
