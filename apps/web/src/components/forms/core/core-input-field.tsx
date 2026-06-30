import { Input } from "@web/components/ui/input";
import type { DetailedHTMLProps, InputHTMLAttributes } from "react";
import { type ReactMaskOpts, useIMask } from "react-imask";

type DetailedHTMLInputProps = Omit<
  DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>,
  "type" | "value" | "ref"
>;

export type InputType = "string" | "number";

type OnValueChangeParams<T extends InputType> = {
  masked?: string;
  value: T extends "string" ? string | null : number | null;
};

export interface CoreInputFieldProps<T extends InputType = "string">
  extends DetailedHTMLInputProps {
  mask?: ReactMaskOpts;
  type: T;
  value: T extends "string" ? string | null : number | null;
  onValueChange: (params: OnValueChangeParams<T>) => void;
  children?: React.ReactNode;
}

export default function CoreInputField<T extends InputType>({
  mask,
  value,
  type,
  onValueChange,
  children,
  ...props
}: CoreInputFieldProps<T>) {
  const { ref: maskRef } = useIMask(mask ? mask : {}, {
    defaultUnmaskedValue: value ? value.toString() : undefined,

    onAccept: (_, ref) => {
      const { typedValue, masked } = ref;

      if (
        (typeof typedValue === "string" && type !== "string") ||
        (typeof typedValue === "number" && typeof typedValue !== "number")
      )
        throw new Error("Resulting typedValue from mask is different from the expected type", {
          cause: typedValue,
        });

      handleValueChange({ masked: masked.value, value: typedValue });
    },
  });

  function handleValueChange({
    masked,
    value,
  }: {
    masked?: string;
    value: string | number | null;
  }) {
    if (value === "") onValueChange({ masked, value: null });
    else if (masked === "" && value === 0) onValueChange({ masked, value: null });
    else
      onValueChange({
        masked,
        value: value as T extends "string" ? string : number,
      });
  }

  const newValue = value === null ? "" : value.toString();

  return (
    <div className="flex items-center w-full relative">
      <Input
        {...props}
        {...(!mask && { value: newValue })}
        type="text"
        onChange={(e) => {
          if (mask) return;

          const targetValue = e.target.value;

          handleValueChange({ value: targetValue });
        }}
        //@ts-expect-error Problem with the returned type by react-imask
        ref={maskRef}
      />

      {children}
    </div>
  );
}
