export function compactFormat(value: number) {
  // Use a more predictable formatting to prevent hydration mismatch
  if (value >= 1000000) {
    return (value / 1000000).toFixed(1) + "M";
  }
  if (value >= 1000) {
    return (value / 1000).toFixed(1) + "K";
  }
  return value.toString();
}

export function standardFormat(value: number) {
  // Use consistent formatting to prevent hydration mismatch
  return value.toFixed(2);
}