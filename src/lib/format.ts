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

// Durata del turno in ore (gestisce i turni che scavalcano la mezzanotte).
export function shiftDurationHours(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let mins = eh * 60 + em - (sh * 60 + sm);
  if (mins <= 0) mins += 24 * 60;
  return mins / 60;
}

// Stima del compenso lordo del turno = paga oraria × durata.
export function shiftTotal(
  rate: number | null,
  start: string,
  end: string
): number | null {
  if (rate == null) return null;
  return rate * shiftDurationHours(start, end);
}

export function formatEuro(n: number): string {
  return `€${Math.round(n)}`;
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
