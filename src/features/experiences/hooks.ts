import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/queryKeys";
import {
  createExperience,
  deleteExperience,
  getExperienceById,
  getExperiences,
  updateExperience,
  type ExperienceInput,
} from "./api";

export function useExperiences(waiterId: string) {
  return useQuery({
    queryKey: qk.experiences.byWaiter(waiterId),
    queryFn: () => getExperiences(waiterId),
  });
}

export function useExperience(id: string | undefined) {
  return useQuery({
    queryKey: qk.experiences.detail(id ?? ""),
    queryFn: () => getExperienceById(id as string),
    enabled: !!id,
  });
}

export function useCreateExperience(waiterId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ExperienceInput) => createExperience(waiterId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.experiences.byWaiter(waiterId) });
    },
  });
}

export function useUpdateExperience(id: string, waiterId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ExperienceInput) => updateExperience(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.experiences.byWaiter(waiterId) });
      qc.invalidateQueries({ queryKey: qk.experiences.detail(id) });
    },
  });
}

export function useDeleteExperience(waiterId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteExperience(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.experiences.byWaiter(waiterId) });
    },
  });
}
