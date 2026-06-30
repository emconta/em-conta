import type { CoreInputFieldProps } from "@web/components/forms/core/core-input-field";
import { Label } from "@web/components/ui/label";
import { cn } from "@web/lib/utils";
import { AlertCircleIcon } from "lucide-react";

export interface FieldWrapperProps {
  label?: string;
  errors?: string[];
  children:
    | React.ReactNode
    | ((props: Pick<CoreInputFieldProps, "aria-invalid">) => React.ReactNode);
  classNames?: { label?: string; container?: string };
}

export default function FieldWrapper({ children, errors, label, classNames }: FieldWrapperProps) {
  return (
    <div className={cn("flex flex-col gap-2", classNames?.container)}>
      {label && <Label className={cn(classNames?.label)}>{label}</Label>}

      {typeof children === "function"
        ? children({ "aria-invalid": (errors?.length ?? 0) > 0 })
        : children}

      {errors && (
        <div className="mt-1 flex flex-col gap-1">
          {errors.map((err) => (
            <p
              className="text-destructive text-sm flex items-center gap-1"
              key={`field-label-errors-${err}`}
            >
              <AlertCircleIcon className="size-[1.15em]" /> {err}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
