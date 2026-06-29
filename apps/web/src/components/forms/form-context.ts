import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import InputField from "@web/components/forms/fields/input-field";

export const { fieldContext, useFieldContext, formContext, useFormContext } =
  createFormHookContexts();

export const { useAppForm, withForm } = createFormHook({
  fieldComponents: {
    InputField,
  },
  formComponents: {},
  fieldContext,
  formContext,
});
