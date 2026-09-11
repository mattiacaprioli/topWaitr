import {
  isActiveAssignment,
  type AssignmentStatus,
} from "@/features/assignments/status";
import { toDateString } from "@/lib/format";
import type { ShiftWithAssignees } from "./types";

/**
 * Chi riceve una notifica se cambia la data (o l'orario) di un turno.
 *
 * Gemello client di `notify_on_shift_change()`
 * (`supabase/migrations/20260910120300_notify_triggers.sql`): assegnati attivi
 * **con account collegato** ∪ candidati accettati. Le due condizioni vanno
 * tenute allineate a mano — se il trigger cambia destinatari, questo file va
 * cambiato con lui, o l'interfaccia prometterà avvisi che nessuno riceve.
 *
 * Serve a dire la verità prima di trascinare un turno su un altro giorno: lo
 * spostamento non è mai solo uno spostamento, è una notifica sul telefono di
 * qualcuno.
 */
export type ShiftNotifyRecipients = {
  /** Nomi di chi è assegnato e verrà avvisato, per poterli nominare. */
  assignees: string[];
  acceptedApplicants: number;
  total: number;
};

export const NO_RECIPIENTS: ShiftNotifyRecipients = {
  assignees: [],
  acceptedApplicants: 0,
  total: 0,
};

export function shiftNotifyRecipients(
  shift: ShiftWithAssignees | undefined
): ShiftNotifyRecipients {
  if (!shift) return NO_RECIPIENTS;
  // Un turno annullato non genera notifiche: il trigger si ferma prima.
  if (shift.status === "cancelled") return NO_RECIPIENTS;

  const assignees = shift.shift_assignments
    .filter((a) => isActiveAssignment(a.status) && a.staff_member?.waiter_id)
    .map((a) => a.staff_member?.display_name ?? "");

  // Il trigger fa una `union`, quindi la stessa persona assegnata *e* candidata
  // accettata conta una volta sola. In pratica non succede: i turni interni non
  // hanno candidature e quelli marketplace non hanno assegnazioni.
  const acceptedApplicants = shift.applications.filter(
    (a) => a.status === "accepted"
  ).length;

  return {
    assignees,
    acceptedApplicants,
    total: assignees.length + acceptedApplicants,
  };
}

/** Perché chi lascia il turno non riceve la revoca. */
export type ReassignSkip = "declined" | "no-account" | "past" | "cancelled";

export type ReassignNotifyPlan = {
  notifiesFrom: boolean;
  /** Null quando la revoca parte davvero. */
  fromSkip: ReassignSkip | null;
  notifiesTo: boolean;
};

/**
 * Chi viene avvisato quando un turno passa di mano.
 *
 * Gemello client di due trigger: `notify_on_assignment_removed`
 * (20260909193312) per chi esce — che si ferma su rifiuto, account mancante,
 * turno annullato e turni già passati — e `notify_on_assignment`
 * (20260712075549) per chi entra, che chiede solo un account collegato (e non
 * salta i turni passati: chi entra viene avvisato comunque).
 */
export function reassignNotifyPlan(input: {
  shiftDate: string;
  shiftCancelled: boolean;
  from: { status: AssignmentStatus; waiterId: string | null };
  toWaiterId: string | null;
}): ReassignNotifyPlan {
  const fromSkip: ReassignSkip | null =
    input.from.status === "declined"
      ? "declined"
      : !input.from.waiterId
        ? "no-account"
        : input.shiftCancelled
          ? "cancelled"
          : input.shiftDate < toDateString(new Date())
            ? "past"
            : null;

  return {
    notifiesFrom: fromSkip === null,
    fromSkip,
    notifiesTo: !!input.toWaiterId,
  };
}
