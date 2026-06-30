export default function parseStandardSchemaIssues(issues?: Issue[] | readonly Issue[]) {
  return (issues ?? []).map((issue) => ({
    message: issue.message,
    path: issue.path?.map((segment) =>
      typeof segment === "object" && "key" in segment ? String(segment.key) : String(segment),
    ),
  }));
}

interface PathSegment {
  readonly key: PropertyKey;
}

interface Issue {
  readonly message: string;
  readonly path?: ReadonlyArray<PropertyKey | PathSegment> | undefined;
}
