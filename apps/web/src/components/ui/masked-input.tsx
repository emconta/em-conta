import { useEffect, useRef, useState } from "react";
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
    <NumericInput
      fixedFractionDigits
      mask="R$ num"
      placeholder="R$ 0,00"
      scale={2}
      value={value}
      onValueChange={onValueChange}
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
    <NumericInput
      placeholder="0,000"
      scale={3}
      value={value}
      onValueChange={onValueChange}
      {...props}
    />
  );
}

function NumericInput({
  fixedFractionDigits = false,
  mask = Number,
  onBlur,
  onValueChange,
  scale,
  value,
  ...props
}: MaskedNumericInputProps & { fixedFractionDigits?: boolean; mask?: NumberConstructor | string; scale: number }) {
  const lastAcceptedValueRef = useRef<string | null>(value ?? null);
  const [maskedValue, setMaskedValue] = useState(() =>
    formatMaskedValue(value, scale, fixedFractionDigits, mask),
  );

  useEffect(() => {
    if (value === lastAcceptedValueRef.current) return;

    lastAcceptedValueRef.current = value ?? null;
    setMaskedValue(formatMaskedValue(value, scale, fixedFractionDigits, mask));
  }, [fixedFractionDigits, mask, scale, value]);

  return (
    <MaskedInput
      mask={mask}
      {...maskOptions(scale, fixedFractionDigits, mask)}
      unmask={false}
      inputMode="decimal"
      value={maskedValue}
      onAccept={(acceptedValue) => {
        const nextMaskedValue = typeof acceptedValue === "string" ? acceptedValue : "";
        const nextValue = parseMaskedValue(nextMaskedValue, scale);

        lastAcceptedValueRef.current = nextValue;
        setMaskedValue(nextMaskedValue);
        onValueChange(nextValue);
      }}
      onBlur={(event) => {
        setMaskedValue(
          formatMaskedValue(lastAcceptedValueRef.current ?? value, scale, fixedFractionDigits, mask),
        );
        onBlur?.(event);
      }}
      {...props}
    />
  );
}

function parseMaskedValue(value: string, scale: number) {
  if (value.trim() === "") return "";

  const numeric = Number(value.replace(/[^\d,]/g, "").replace(",", "."));

  return Number.isNaN(numeric) ? (0).toFixed(scale) : numeric.toFixed(scale);
}

function formatMaskedValue(
  value: string | undefined,
  scale: number,
  fixedFractionDigits: boolean,
  mask: NumberConstructor | string,
) {
  if (value === undefined || value === "") return "";

  const numeric = Number(value);

  const formattedValue = (Number.isNaN(numeric) ? 0 : numeric).toLocaleString("pt-BR", {
    minimumFractionDigits: fixedFractionDigits ? scale : 0,
    maximumFractionDigits: scale,
  });

  return mask === Number ? formattedValue : `R$ ${formattedValue}`;
}

function maskOptions(scale: number, fixedFractionDigits: boolean, mask: NumberConstructor | string) {
  const numberOptions = {
    radix: ",",
    thousandsSeparator: ".",
    scale,
    padFractionalZeros: fixedFractionDigits,
    normalizeZeros: fixedFractionDigits,
    mapToRadix: ["."],
    min: 0,
  };

  if (mask === Number) return numberOptions;

  return {
    lazy: false,
    blocks: {
      num: {
        mask: Number,
        expose: true,
        ...numberOptions,
      },
    },
  };
}
