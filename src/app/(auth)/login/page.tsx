import { AuthShell } from "@/components/auth/auth-shell";
import { AuthForm } from "@/components/auth/auth-form";
export default function LoginPage() {

  return (
    <AuthShell>
      <AuthForm mode="login" />
    </AuthShell>
  );
}
