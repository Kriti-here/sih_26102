export function formatINR(n: number): string {
  // Indian numbering with rupee sign, rounded to nearest rupee for large, 2dp for small
  if (Math.abs(n) >= 100000) {
    // show in lakh / crore style for readability
    if (Math.abs(n) >= 10000000) {
      return `₹${(n / 10000000).toFixed(2)} Cr`;
    }
    return `₹${(n / 100000).toFixed(2)} L`;
  }
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

export function formatINRFull(n: number): string {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

export function formatNum(n: number, dp = 0): string {
  return n.toLocaleString("en-IN", {
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
  });
}

export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function daysBetween(a: string, b: string): number {
  const da = new Date(a).getTime();
  const db = new Date(b).getTime();
  return Math.round((db - da) / 86400000);
}

export function daysSince(iso: string, today: string): number {
  return daysBetween(iso, today);
}
