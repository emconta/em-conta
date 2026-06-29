import { Button, type ButtonProps } from "@web/components/ui/button";
import { Loader2Icon } from "lucide-react";

export default function LoadingButton({
  loading,
  children,
  ...props
}: ButtonProps & { loading?: { text: string } | boolean }) {
  const disabled = !!loading || props.disabled;
  const loadingText = typeof loading === "object" ? loading.text : "Carregando...";

  return (
    <Button {...props} disabled={disabled}>
      {loading ? (
        <>
          <Loader2Icon className="animate-spin" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
