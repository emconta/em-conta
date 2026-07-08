import type { AccountDto } from "@dto/accounts.dto";

const CASH_BANK_TYPES = new Set(["cash", "bank_checking"]);

export function isLeafCashOrBankAccount(account: AccountDto, parentIds: Set<number>): boolean {
  return CASH_BANK_TYPES.has(account.type) && !parentIds.has(account.id);
}

export function getParentIds(accounts: AccountDto[]): Set<number> {
  const ids = new Set<number>();

  for (const account of accounts) {
    if (account.parentId !== null) {
      ids.add(account.parentId);
    }
  }

  return ids;
}

export function getLeafCashBankAccounts(accounts: AccountDto[]): AccountDto[] {
  const parentIds = getParentIds(accounts);

  return accounts.filter((account) => isLeafCashOrBankAccount(account, parentIds));
}
