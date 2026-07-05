import { IMaskMixin } from "react-imask";
import { Input } from "@web/components/ui/input";

const MaskedInput = IMaskMixin(({ inputRef, ...props }) => (
  <Input ref={inputRef as React.Ref<HTMLInputElement>} {...(props as React.ComponentProps<"input">)} />
));

type MaskedNumericInputProps = Omit<React.ComponentProps<"input">, "value" | "onChange" | "defaultValue"> & {
  value?: string;
  onValueChange: (value: string) => void;
};

export function MoneyInput({
  onValueChange,
  value,
  ...props
}: MaskedNumericInputProps) {
  return (
    <MaskedInput
      mask={Number}
      radix=","
      thousandsSeparator="."
      scale={2}
      padFractionalZeros
      normalizeZeros
      mapToRadix={["."]}
      min={0}
      unmask="typed"
      inputMode="decimal"
      value={Number(value || 0) || 0}
      onAccept={(value) => {
        const numeric = typeof value === "number" ? value : Number(value);
        onValueChange(Number.isNaN(numeric) ? "0.00" : numeric.toFixed(2));
      }}
      {...props}
    />
  );
}

export function QuantityInput({
  onValueChange,
  value,
  ...props
}: MaskedNumericInputProps) {
  return (
    <MaskedInput
      mask={Number}
      radix=","
      thousandsSeparator="."
      scale={3}
      padFractionalZeros
      normalizeZeros
      mapToRadix={["."]}
      min={0}
      unmask="typed"
      inputMode="decimal"
      value={Number(value || 0) || 0}
      onAccept={(value) => {
        const numeric = typeof value === "number" ? value : Number(value);
        onValueChange(Number.isNaN(numeric) ? "0.000" : numeric.toFixed(3));
      }}
      {...props}
    />
  );
}