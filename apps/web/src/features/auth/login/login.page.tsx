import { useAppForm } from "@web/components/forms/form-context";
import { GoogleLogo } from "@web/components/icons/googleLogo";
import { Button } from "@web/components/ui/button";
import LoadingButton from "@web/components/ui/loadingButton";
import { Separator } from "@web/components/ui/separator";
import { authClient } from "@web/lib/auth";
import { MailIcon, PiggyBankIcon } from "lucide-react";
import React from "react";
import { toast } from "sonner";
import * as v from "valibot";

const SendOTPDto = v.object({
  email: v.pipe(v.string(), v.email()),
});

type SendOTPDto = v.InferInput<typeof SendOTPDto>;

export default function LoginPage() {
  const form = useAppForm({
    defaultValues: {} as SendOTPDto,
    validators: {
      onSubmit: SendOTPDto,
    },
    onSubmit: (values) => {
      console.log(values);
    },
  });

  const [isRedirecting, setIsRedirecting] = React.useState(false);

  async function handleGoogleLogin() {
    setIsRedirecting(true);

    const { error } = await authClient.signIn.social({
      provider: "google",
      callbackURL: new URL("/dashboard", location.origin).href,
    });

    if (error) {
      setIsRedirecting(false);
      toast.error("Erro desconhecido, tente novamente mais tarde.");
    }
  }

  return (
    <main className="w-screen h-screen flex justify-center items-center">
      <div className="max-w-xl flex flex-col gap-6 items-center">
        <PiggyBankIcon className="size-12 text-primary" />

        <hgroup className="flex flex-col gap-1 items-center">
          <h1 className="text-xl font-medium">Bem-vindo à emConta</h1>

          <p className="text-sm text-muted-foreground">
            Faça login com sua conta Google ou seu email.
          </p>
        </hgroup>

        <LoadingButton
          variant="outline"
          size="lg"
          className="w-full"
          onClick={handleGoogleLogin}
          loading={isRedirecting}
        >
          <GoogleLogo /> Google
        </LoadingButton>

        <Separator />

        <form
          className="flex flex-col gap-2 w-full"
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          <form.AppField name="email">
            {(field) => <field.InputField placeholder="email@example.com" type="string" />}
          </form.AppField>

          <form.Subscribe selector={({ canSubmit }) => !canSubmit}>
            {(disabled) => (
              <Button size="lg" disabled={disabled}>
                <MailIcon />
                Enviar código de verificação
              </Button>
            )}
          </form.Subscribe>
        </form>
      </div>
    </main>
  );
}
