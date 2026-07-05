import { useMutation, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/queryKeys";
import {
  completeOnboarding,
  uploadCertification,
  type CertFile,
  type OnboardingInput,
} from "./api";

export function useCompleteOnboarding(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: OnboardingInput) => completeOnboarding(userId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.profile.mine(userId) });
    },
  });
}

export function useUploadCertification(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ certKey, file }: { certKey: string; file: CertFile }) =>
      uploadCertification(userId, certKey, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.profile.mine(userId) });
    },
  });
}
