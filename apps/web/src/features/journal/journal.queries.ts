import type { CreateManualJournalEntryDto } from "@dto/journal.dto";
import { mutationOptions, queryOptions, useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@web/lib/api";
import { callApi } from "@web/lib/callApi";

export function listJournalEntries() {
  return callApi(api.journal.$get, { query: {} });
}

export function getJournalEntry(id: number) {
  return callApi(api.journal[":id"].$get, { param: { id: String(id) } });
}

export function createManualJournalEntry(json: CreateManualJournalEntryDto) {
  return callApi(api.journal.$post, { json });
}

export const listJournalEntriesOptions = queryOptions({
  queryKey: ["journal", "list"],
  queryFn: listJournalEntries,
});

export const getJournalEntryOptions = (id: number | null) =>
  queryOptions({
    queryKey: ["journal", "detail", id],
    queryFn: () => getJournalEntry(id ?? 0),
    enabled: id !== null,
  });

export const createManualJournalEntryOptions = mutationOptions({
  mutationKey: ["journal", "create-manual"],
  mutationFn: createManualJournalEntry,
});

export const useJournalEntries = () => useQuery(listJournalEntriesOptions);
export const useJournalEntry = (id: number | null) => useQuery(getJournalEntryOptions(id));
export const useCreateManualJournalEntry = (
  options?: Partial<typeof createManualJournalEntryOptions>,
) => useMutation({ ...options, ...createManualJournalEntryOptions });
