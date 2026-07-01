import type { FinishOnboardingDto } from "@dto/onboarding.dto";
import { mutationOptions, queryOptions, useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@web/lib/api";
import { callApi, type InferErrorCodeResponse } from "@web/lib/utils";

export class FinishOnboardingError {
  constructor(
    public code: InferErrorCodeResponse<typeof api.onboarding.$post>,
    public message: string = "Erro inesperado, tente novamente.",
  ) {}
}

export function finishOnboarding(json: FinishOnboardingDto) {
  return callApi(api.onboarding.$post, { json })({
    mapError({ code }) {
      if (code === "CNPJ_ALREADY_EXISTS")
        return new FinishOnboardingError(code, "Esse CNPJ já está cadastrado.");

      return new FinishOnboardingError(code);
    },
  });
}

export function getOnboardingStatus() {
  return callApi(api.onboarding.status.$get)();
}

export const finishOnboardingOptions = mutationOptions({
  mutationKey: ["onboarding", "finish"],
  mutationFn: finishOnboarding,
});

export const getOnboardingStatusOptions = queryOptions({
  queryKey: ["onboarding", "get-status"],
  queryFn: getOnboardingStatus,
});

export const useFinishOnboarding = (options?: Partial<typeof finishOnboardingOptions>) =>
  useMutation({ ...options, ...finishOnboardingOptions });

export const useOnboardingStatus = () => useQuery(getOnboardingStatusOptions);
