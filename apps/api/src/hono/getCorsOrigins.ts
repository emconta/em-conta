export function getCorsOrigins(value?: string) {
  return (
    value
      ?.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean) ?? []
  );
}
