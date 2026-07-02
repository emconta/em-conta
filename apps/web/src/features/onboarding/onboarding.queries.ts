import type { FinishOnboardingDto } from "@dto/onboarding.dto";
import { mutationOptions, queryOptions, useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@web/lib/api";
import { callApi } from "@web/lib/callApi";

export function finishOnboarding(json: FinishOnboardingDto) {
  return callApi(api.onboarding.$post, { json });
}

export function getOnboardingStatus() {
  return callApi(api.onboarding.status.$get);
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
