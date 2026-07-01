import type { StandardSchemaV1Issue } from "@tanstack/react-form";
import FieldWrapper, { type FieldWrapperProps } from "@web/components/forms/field-wrapper";
import type * as React from "react";

export type RenderFieldArgs = {
  fieldEl: (isError: boolean) => React.ReactNode;
  errors: StandardSchemaV1Issue[];
  label?: string;
  hideErrors?: boolean;
  isPristine: boolean;
} & Pick<FieldWrapperProps, "classNames" | "required">;

export default function renderField({
  fieldEl,
  label,
  errors,
  isPristine,
  hideErrors,
  classNames,
  required,
}: RenderFieldArgs) {
  const isError = hideErrors ? false : (errors?.length ?? 0) > 0 && isPristine === false;

  return label || !hideErrors ? (
    <FieldWrapper
      label={label}
      errors={isError ? errors.map((err) => err.message) : undefined}
      classNames={classNames}
      required={required}
    >
      {fieldEl(isError)}
    </FieldWrapper>
  ) : (
    fieldEl(isError)
  );
}
