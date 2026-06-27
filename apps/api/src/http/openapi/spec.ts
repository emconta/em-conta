import { bearerSecurityScheme } from "@api/http/openapi/security";
import type { GenerateSpecOptions } from "hono-openapi";

export const openApiSpecOptions = {
  documentation: {
    openapi: "3.1.0",
    info: {
      title: "SIND Invoices API",
      version: "1.0.0",
      description:
        "HTTP API for retrieving the latest customer invoice used to integrate with WhatsApp chatbot.",
    },
    servers: [
      {
        url: "/",
        description: "Current deployment origin",
      },
    ],
    tags: [
      {
        name: "Customers",
        description: "Endpoints for looking up customers basic info.",
      },
      {
        name: "Invoices",
        description: "Endpoints for looking up customer invoices by product and document number.",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: bearerSecurityScheme,
      },
    },
  },
  exclude: ["/api/v1/openapi.json", "/api/v1/health", "/api/v1/docs"],
} satisfies Partial<GenerateSpecOptions>;
