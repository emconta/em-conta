export const bearerSecurity: Array<Record<string, string[]>> = [
	{
		bearerAuth: [],
	},
];

export const bearerSecurityScheme = {
	type: "http",
	scheme: "bearer",
	bearerFormat: "API Key",
	description:
		"Send the configured API key in the Authorization header using the Bearer scheme: `Authorization: Bearer <API_KEY>`.",
} as const;
