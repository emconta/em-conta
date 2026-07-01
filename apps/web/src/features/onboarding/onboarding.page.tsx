import { FinishOnboardingDto } from "@dto/onboarding.dto";
import { useNavigate } from "@tanstack/react-router";
import { useAppForm } from "@web/components/forms/form-context";
import { cnpjMask } from "@web/components/forms/input-field-masks";
import LoadingButton from "@web/components/ui/loadingButton";
import {
  FinishOnboardingError,
  useFinishOnboarding,
} from "@web/features/onboarding/onboarding.queries";
import { BriefcaseBusinessIcon, CheckIcon } from "lucide-react";
import { toast } from "sonner";

export default function OnboardingPage() {
  const form = useAppForm({
    defaultValues: {} as FinishOnboardingDto,
    validators: {
      onSubmit: FinishOnboardingDto,
    },
    onSubmit: ({ value }) => {
      finishOnboarding(value);
    },
  });

  const navigate = useNavigate();

  const { mutate: finishOnboarding, isPending: isFinishingOnboarding } = useFinishOnboarding({
    onSuccess() {
      navigate({ to: "/dashboard" });
    },
    onError(error) {
      if (error instanceof FinishOnboardingError) {
        toast.error(error.message);
      }
    },
  });

  return (
    <main className="w-screen h-screen flex justify-center items-center">
      <div className="max-w-xl w-full flex flex-col gap-6 items-center">
        <hgroup className="flex flex-col gap-1 items-center">
          <h1 className="flex items-center gap-2 text-xl font-medium">
            <BriefcaseBusinessIcon className="text-primary text-[1em]" />
            Cadastre seu negócio
          </h1>

          <p className="text-sm text-muted-foreground">Preencha as informações abaixo</p>
        </hgroup>

        <form
          className="flex flex-col gap-4 w-full"
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          <form.AppField name="name">
            {(field) => (
              <field.InputField
                label="Nome da sua empresa"
                placeholder="ex.: Acme Corp."
                type="string"
                required
              />
            )}
          </form.AppField>

          <form.AppField name="cnpj">
            {(field) => (
              <field.InputField
                label="CNPJ da sua empresa"
                placeholder="83.296.473/0001-05"
                type="string"
                mask={cnpjMask}
              />
            )}
          </form.AppField>

          <form.Subscribe
            selector={({ canSubmit, isValid, isPristine }) => !canSubmit || !isValid || isPristine}
          >
            {(disabled) => (
              <LoadingButton
                loading={isFinishingOnboarding ? { text: "Cadastrando..." } : false}
                size="lg"
                disabled={disabled}
              >
                Cadastrar empresa
                <CheckIcon />
              </LoadingButton>
            )}
          </form.Subscribe>
        </form>
      </div>
    </main>
  );
}
