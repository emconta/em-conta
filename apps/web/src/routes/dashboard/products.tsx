import { createFileRoute } from "@tanstack/react-router";
import ProductsPage from "@web/features/products/products.page";

export const Route = createFileRoute("/dashboard/products")({
  component: ProductsPage,
});
