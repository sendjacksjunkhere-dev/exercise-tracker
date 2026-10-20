export function stripLeadingZeros(raw: string): string {
  return raw.replace(/^0+(?=\d)/, "");
}
