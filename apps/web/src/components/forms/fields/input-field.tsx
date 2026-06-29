import type { StandardSchemaV1Issue } from "@tanstack/react-form";
import type {
  CoreInputFieldProps,
  InputType,
} from "@web/components/forms/core/core-input-field";
import CoreInputField from "@web/components/forms/core/core-input-field";
import type { FieldWrapperProps } from "@web/components/forms/field-wrapper";
import { useFieldContext } from "@web/components/forms/form-context";
import type { RenderFieldArgs } from "@web/components/forms/render-field";
import renderField from "@web/components/forms/render-field";
import { ensureNullable } from "@web/lib/utils";

export type InputFieldProps<T extends InputType> = Omit<
  CoreInputFieldProps<T>,
  "onValueChange" | "value" | "name" | "className"
> &
  Pick<RenderFieldArgs, "label" | "hideErrors"> & {
    classNames?: { input?: string } & FieldWrapperProps["classNames"];
  };

export default function InputField<T extends InputType>({
  type,
  label,
  hideErrors,
  classNames,
  ...props
}: InputFieldProps<T>) {
  const field = useFieldContext();
  const value = ensureNullable(field.state.value) as T extends "string"
    ? string | null
    : number | null;

  const errors = field.state.meta.errors as StandardSchemaV1Issue[];

  const isPristine = field.state.meta.isPristine;

  const name = field.name;

  return renderField({
    fieldEl: (isError) => (
      <CoreInputField
        onValueChange={({ value }) => field.setValue(value)}
        value={value}
        type={type}
        aria-invalid={isError}
        name={name}
        className={classNames?.input}
        {...props}
      />
    ),
    errors,
    hideErrors,
    isPristine,
    label,
    classNames,
  });
}
