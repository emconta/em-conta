import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@web/components/ui/alert-dialog";

type DiscardChangesAlertProps = {
  open: boolean;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
};

export function DiscardChangesAlert({
  open,
  onConfirm,
  onOpenChange,
}: DiscardChangesAlertProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Descartar dados informados?</AlertDialogTitle>
          <AlertDialogDescription>
            Existem informações preenchidas neste formulário. Se continuar, esses dados serão
            perdidos.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Continuar editando</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onConfirm}>
            Descartar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
