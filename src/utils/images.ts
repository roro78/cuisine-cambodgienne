export function imageAtWidth(src: string, width: number) {
  if (/([?&])width=\d+/.test(src)) {
    return src.replace(/([?&])width=\d+/, `$1width=${width}`);
  }

  const separator = src.includes('?') ? '&' : '?';
  return `${src}${separator}width=${width}`;
}

export function imageSrcSet(src: string, widths: number[]) {
  return widths.map((width) => `${imageAtWidth(src, width)} ${width}w`).join(', ');
}
