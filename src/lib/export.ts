import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";
import type { StaffHoursRow } from "@/features/assignments/api";

// Ore come numero italiano (virgola, senza suffisso): "12,5" · "5".
function hoursNumber(h: number): string {
  const r = Math.round(h * 10) / 10;
  return (r % 1 === 0 ? String(r) : r.toFixed(1)).replace(".", ",");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Tabella HTML stampabile (scuro-su-bianco, accento gold). Solo ore/presenze. */
export function buildHoursHtml(
  venueName: string,
  monthLabel: string,
  rows: StaffHoursRow[],
  totalHours: number
): string {
  const totalShifts = rows.reduce((s, r) => s + r.shifts_count, 0);
  const body = rows
    .map(
      (r) =>
        `<tr><td>${escapeHtml(r.display_name)}</td><td>${escapeHtml(
          r.role ?? "—"
        )}</td><td class="n">${r.shifts_count}</td><td class="n">${hoursNumber(
          r.hours
        )}</td></tr>`
    )
    .join("");
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    * { box-sizing: border-box; }
    body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #1a1206; margin: 32px; }
    h1 { font-size: 22px; margin: 0 0 2px; }
    .sub { color: #6a6358; font-size: 13px; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { text-align: left; padding: 10px 8px; border-bottom: 1px solid #e7e2d8; }
    th { color: #8c857a; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; }
    td.n, th.n { text-align: right; }
    tfoot td { font-weight: 700; border-top: 2px solid #eab54c; border-bottom: none; }
    .accent { height: 4px; width: 48px; background: #eab54c; border-radius: 2px; margin-bottom: 16px; }
    .foot { margin-top: 28px; color: #a49a8a; font-size: 11px; }
  </style></head><body>
    <div class="accent"></div>
    <h1>Ore tracciate</h1>
    <div class="sub">${escapeHtml(venueName)} · ${escapeHtml(monthLabel)}</div>
    <table>
      <thead><tr><th>Nome</th><th>Ruolo</th><th class="n">Turni</th><th class="n">Ore</th></tr></thead>
      <tbody>${body}</tbody>
      <tfoot><tr><td>Totale</td><td></td><td class="n">${totalShifts}</td><td class="n">${hoursNumber(
        totalHours
      )}</td></tr></tfoot>
    </table>
    <div class="foot">Documento generato da topWaitr · riepilogo ore/presenze del personale interno.</div>
  </body></html>`;
}

function csvCell(v: string): string {
  return /[";\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

/** CSV separatore ';' e decimali con virgola (default Excel IT), con BOM UTF-8. */
export function buildHoursCsv(rows: StaffHoursRow[]): string {
  const header = "Nome;Ruolo;Turni;Ore";
  const lines = rows.map((r) =>
    [r.display_name, r.role ?? "", String(r.shifts_count), hoursNumber(r.hours)]
      .map(csvCell)
      .join(";")
  );
  return "﻿" + [header, ...lines].join("\r\n");
}

/** Genera un PDF del riepilogo ore e apre il foglio di condivisione. */
export async function exportHoursPdf(
  venueName: string,
  monthLabel: string,
  rows: StaffHoursRow[],
  totalHours: number
): Promise<void> {
  const html = buildHoursHtml(venueName, monthLabel, rows, totalHours);
  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      UTI: "com.adobe.pdf",
      mimeType: "application/pdf",
      dialogTitle: `Ore ${monthLabel}`,
    });
  }
}

/** Genera un CSV del riepilogo ore e apre il foglio di condivisione. */
export async function exportHoursCsv(
  venueName: string,
  monthLabel: string,
  rows: StaffHoursRow[]
): Promise<void> {
  const csv = buildHoursCsv(rows);
  const safeMonth = monthLabel.toLowerCase().replace(/\s+/g, "-");
  const uri = `${FileSystem.cacheDirectory}ore-${safeMonth}.csv`;
  await FileSystem.writeAsStringAsync(uri, csv, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      UTI: "public.comma-separated-values-text",
      mimeType: "text/csv",
      dialogTitle: `Ore ${monthLabel}`,
    });
  }
}
