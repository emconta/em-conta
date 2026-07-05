import type { CreateManualJournalEntryDto } from "@dto/journal.dto";
import { mutationOptions, queryOptions, useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@web/lib/api";
import { callApi } from "@web/lib/callApi";

export function listJournalEntries() {
  return callApi(api.journal.$get, { query: {} });
}

export function createManualJournalEntry(json: CreateManualJournalEntryDto) {
  return callApi(api.journal.$post, { json });
}

export const listJournalEntriesOptions = queryOptions({
  queryKey: ["journal", "list"],
  queryFn: listJournalEntries,
});

export const createManualJournalEntryOptions = mutationOptions({
  mutationKey: ["journal", "create-manual"],
  mutationFn: createManualJournalEntry,
});

export const useJournalEntries = () => useQuery(listJournalEntriesOptions);
export const useCreateManualJournalEntry = (
  options?: Partial<typeof createManualJournalEntryOptions>,
) => useMutation({ ...options, ...createManualJournalEntryOptions });
