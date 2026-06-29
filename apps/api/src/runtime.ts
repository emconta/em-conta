import Database from "@api/db/database";
import Env from "@api/env";
import { Layer, Logger, ManagedRuntime } from "effect";

export function makeRuntime(env: Cloudflare.Env) {
  const noDepsLayer = Layer.provide(Layer.mergeAll(Env.Default(env), Logger.pretty), Logger.pretty);

  const baseLayer = Layer.provide(Layer.mergeAll(Database.Default), noDepsLayer);

  const appLayer = Layer.mergeAll(noDepsLayer, baseLayer);

  const runtime = ManagedRuntime.make(appLayer);

  return { appLayer, runtime };
}

export type AppLayer = Layer.Layer.Success<ReturnType<typeof makeRuntime>["appLayer"]>;

export type Runtime = ReturnType<typeof makeRuntime>["runtime"];
