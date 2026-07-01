import Database from "@api/db/database";
import Env from "@api/env";
import CompaniesRepo from "@api/features/companies/companies.repo";
import OnboardingService from "@api/features/onboarding/onboarding.service";
import { Layer, Logger, ManagedRuntime } from "effect";

export function makeRuntime(env: Cloudflare.Env) {
  const noDepsLayer = Layer.provide(Layer.mergeAll(Env.Default(env), Logger.pretty), Logger.pretty);

  const baseLayer = Layer.provide(Layer.mergeAll(Database.Default), noDepsLayer);

  const repoLayer = Layer.provide(
    Layer.mergeAll(CompaniesRepo.Default),
    Layer.mergeAll(noDepsLayer, baseLayer),
  );

  const serviceLayer = Layer.provide(
    Layer.mergeAll(OnboardingService.Default),
    Layer.mergeAll(repoLayer, noDepsLayer, baseLayer),
  );

  const appLayer = Layer.mergeAll(noDepsLayer, baseLayer, repoLayer, serviceLayer);

  const runtime = ManagedRuntime.make(appLayer);

  return { appLayer, runtime };
}

export type AppLayer = Layer.Layer.Success<ReturnType<typeof makeRuntime>["appLayer"]>;

export type Runtime = ReturnType<typeof makeRuntime>["runtime"];
