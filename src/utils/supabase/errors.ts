export function isMissingTableInSchemaCache(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "PGRST205"
  );
}

export function getSupabaseErrorMessage(error: unknown): string | undefined {
  if (isMissingTableInSchemaCache(error)) {
    return "The expenses table is missing from Supabase. Apply the 20261008000000_create_expenses.sql migration, or refresh the Data API schema cache if the table already exists.";
  }

  if (error instanceof Error) {
    return error.message || undefined;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return undefined;
}
