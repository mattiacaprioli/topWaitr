import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/queryKeys";
import {
  createDocumentUrl,
  createStaffDocument,
  deleteStaffDocument,
  getStaffDocuments,
  replaceStaffDocumentFile,
  updateStaffDocument,
  type DocumentFile,
  type DocumentMeta,
  type StaffDocument,
} from "./api";

export function useStaffDocuments(staffMemberId: string | undefined) {
  return useQuery({
    queryKey: qk.documents.byStaffMember(staffMemberId ?? ""),
    queryFn: () => getStaffDocuments(staffMemberId as string),
    enabled: !!staffMemberId,
  });
}

function useDocumentsInvalidation(staffMemberId: string) {
  const qc = useQueryClient();
  return () =>
    qc.invalidateQueries({ queryKey: qk.documents.byStaffMember(staffMemberId) });
}

export function useCreateStaffDocument(staffMemberId: string) {
  const invalidate = useDocumentsInvalidation(staffMemberId);
  return useMutation({
    mutationFn: (vars: {
      uploadedBy: string;
      meta: DocumentMeta;
      file: DocumentFile;
    }) =>
      createStaffDocument(staffMemberId, vars.uploadedBy, vars.meta, vars.file),
    onSuccess: invalidate,
  });
}

export function useUpdateStaffDocument(staffMemberId: string) {
  const invalidate = useDocumentsInvalidation(staffMemberId);
  return useMutation({
    mutationFn: (vars: { id: string; meta: DocumentMeta }) =>
      updateStaffDocument(vars.id, vars.meta),
    onSuccess: invalidate,
  });
}

export function useReplaceStaffDocumentFile(staffMemberId: string) {
  const invalidate = useDocumentsInvalidation(staffMemberId);
  return useMutation({
    mutationFn: (vars: { doc: StaffDocument; file: DocumentFile }) =>
      replaceStaffDocumentFile(vars.doc, vars.file),
    onSuccess: invalidate,
  });
}

export function useDeleteStaffDocument(staffMemberId: string) {
  const invalidate = useDocumentsInvalidation(staffMemberId);
  return useMutation({
    mutationFn: (doc: StaffDocument) => deleteStaffDocument(doc),
    onSuccess: invalidate,
  });
}

/**
 * Mutation e non query, di proposito: l'URL firmata dura 60 secondi e non deve
 * finire nella cache di TanStack, dove verrebbe riusata già scaduta. Si chiede
 * al tap, si usa, si butta.
 */
export function useDocumentUrl() {
  return useMutation({
    mutationFn: (vars: { storagePath: string; download?: string }) =>
      createDocumentUrl(vars.storagePath, { download: vars.download }),
  });
}
