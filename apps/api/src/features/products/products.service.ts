import type { InsertProduct, Product } from "@api/db/schema";
import CompaniesRepo from "@api/features/companies/companies.repo";
import ProductsRepo from "@api/features/products/products.repo";
import type { CreateProductDto, ProductDto } from "@dto/products.dto";
import { Data, Effect, Option } from "effect";

export class ProductsService extends Effect.Service<ProductsService>()("ProductsService", {
  effect: Effect.gen(function* () {
    const companiesRepo = yield* CompaniesRepo;
    const productsRepo = yield* ProductsRepo;

    function createForUser(input: CreateProductDto & { userId: string }) {
      return Effect.gen(function* () {
        const company = yield* companiesRepo.getFromUser({ userId: input.userId });

        if (!company) {
          return yield* Effect.fail(new ProductsServiceError({ code: "COMPANY_NOT_FOUND" }));
        }

        if (input.type === "service" && input.trackInventory) {
          return yield* Effect.fail(
            new ProductsServiceError({ code: "SERVICE_CANNOT_TRACK_STOCK" }),
          );
        }

        const productToInsert: InsertProduct = {
          companyId: company.id,
          name: input.name,
          type: input.type,
          defaultSalePrice: input.defaultSalePrice,
          trackInventory: input.type === "product" ? (input.trackInventory ?? false) : false,
          costMethod: "average_cost",
          isActive: input.isActive ?? true,
        };

        const product = yield* productsRepo
          .insert(productToInsert)
          .pipe(Effect.map(Option.getOrThrow));

        return toProductDto(product);
      });
    }

    function listForUser({ userId }: { userId: string }) {
      return Effect.gen(function* () {
        const company = yield* companiesRepo.getFromUser({ userId });

        if (!company) {
          return yield* Effect.fail(new ProductsServiceError({ code: "COMPANY_NOT_FOUND" }));
        }

        const products = yield* productsRepo.listByCompany({ companyId: company.id });

        return products.map(toProductDto);
      });
    }

    return { createForUser, listForUser };
  }),

  accessors: true,
}) {}

function toProductDto(product: Product): ProductDto {
  return {
    id: product.id,
    name: product.name,
    type: product.type,
    defaultSalePrice: product.defaultSalePrice,
    trackInventory: product.trackInventory,
    costMethod: product.costMethod,
    isActive: product.isActive,
  };
}

export class ProductsServiceError extends Data.TaggedError("ProductsServiceError")<{
  readonly code: "COMPANY_NOT_FOUND" | "SERVICE_CANNOT_TRACK_STOCK";
}> {}
