import Database from "@api/db/database";
import Env from "@api/env";
import AccountsRepo from "@api/features/accounts/accounts.repo";
import { AccountsService } from "@api/features/accounts/accounts.service";
import AccountsChartsRepo from "@api/features/accountsCharts/accountsCharts.repo";
import CompaniesRepo from "@api/features/companies/companies.repo";
import { InventoryService } from "@api/features/inventory/inventory.service";
import StockMovementsRepo from "@api/features/inventory/stockMovements.repo";
import JournalRepo from "@api/features/journal/journal.repo";
import { JournalService } from "@api/features/journal/journal.service";
import OnboardingService from "@api/features/onboarding/onboarding.service";
import ProductsRepo from "@api/features/products/products.repo";
import { ProductsService } from "@api/features/products/products.service";
import ReceiptsRepo from "@api/features/receipts/receipts.repo";
import { ReceiptsService } from "@api/features/receipts/receipts.service";
import SalesRepo from "@api/features/sales/sales.repo";
import { SalesService } from "@api/features/sales/sales.service";
import { Layer, Logger, ManagedRuntime } from "effect";

export function makeRuntime(env: Cloudflare.Env) {
  const noDepsLayer = Layer.provide(Layer.mergeAll(Env.Default(env), Logger.pretty), Logger.pretty);

  const baseLayer = Layer.provide(Layer.mergeAll(Database.Default), noDepsLayer);

  const repoLayer = Layer.provide(
    Layer.mergeAll(
      CompaniesRepo.Default,
      AccountsRepo.Default,
      AccountsChartsRepo.Default,
      JournalRepo.Default,
      ProductsRepo.Default,
      ReceiptsRepo.Default,
      SalesRepo.Default,
      StockMovementsRepo.Default,
    ),
    Layer.mergeAll(noDepsLayer, baseLayer),
  );

  const serviceLayer = Layer.provide(
    Layer.mergeAll(
      Layer.provide(OnboardingService.Default, AccountsService.Default),
      AccountsService.Default,
      Layer.provide(ProductsService.Default, InventoryService.Default),
      JournalService.Default,
      InventoryService.Default,
      ReceiptsService.Default,
      Layer.provide(SalesService.Default, InventoryService.Default),
    ),
    Layer.mergeAll(repoLayer, noDepsLayer, baseLayer),
  );

  const appLayer = Layer.mergeAll(noDepsLayer, baseLayer, repoLayer, serviceLayer);

  const runtime = ManagedRuntime.make(appLayer);

  return { appLayer, runtime };
}

export type AppLayer = Layer.Layer.Success<ReturnType<typeof makeRuntime>["appLayer"]>;

export type Runtime = ReturnType<typeof makeRuntime>["runtime"];
