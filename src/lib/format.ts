const dateFmt = new Intl.DateTimeFormat("it-IT", {
  weekday: "short",
  day: "numeric",
  month: "short",
});

// date: "YYYY-MM-DD"
export function formatDate(date: string): string {
  const d = new Date(`${date}T00:00:00`);
  return dateFmt.format(d);
}

// time: "HH:MM:SS" or "HH:MM"
export function formatTime(time: string): string {
  return time.slice(0, 5);
}

export function formatRate(rate: number | null): string {
  if (rate == null) return "Da concordare";
  return `${rate.toFixed(2).replace(".", ",")} €/h`;
}

// Date -> "YYYY-MM-DD"
export function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Date -> "HH:MM"
export function toTimeString(d: Date): string {
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}
