"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { loginAction, loginWithGoogleAction, magicLinkAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { authSchema, type AuthInput } from "@/lib/validations";

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.5 3.9-5.5 3.9-3.3 0-6-2.8-6-6.2s2.7-6.2 6-6.2c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.8 2.7 14.6 2 12 2 6.9 2 2.7 6.4 2.7 11.8S6.9 21.6 12 21.6c6.9 0 9.1-4.9 9.1-7.4 0-.5 0-.9-.1-1.3H12Z" />
    </svg>
  );
}

export function LoginForm() {
  const form = useForm<AuthInput>({
    resolver: zodResolver(authSchema),
    defaultValues: { email: "", password: "" }
  });
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const params = useSearchParams();

  const onSubmit = (values: AuthInput) => {
    startTransition(async () => {
      const result = await loginAction(values);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(result.message ?? "Logged in");
      router.push(params.get("next") ?? "/dashboard");
      router.refresh();
    });
  };

  const onGoogle = () => {
    startTransition(async () => {
      const result = await loginWithGoogleAction();
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      window.location.href = result.data.url;
    });
  };

  const onMagicLink = () => {
    const email = form.getValues("email");
    startTransition(async () => {
      const result = await magicLinkAction(email);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(result.message ?? "Magic link sent");
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" autoComplete="email" placeholder="you@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="pr-20"
                    {...field}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-2 text-xs text-muted-foreground"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Signing in..." : "Sign in"}
        </Button>

        <Button type="button" variant="outline" className="w-full" onClick={onGoogle} disabled={isPending}>
          <GoogleIcon />
          Continue with Google
        </Button>

        <Button type="button" variant="ghost" className="w-full" onClick={onMagicLink} disabled={isPending}>
          Send magic link
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          New here?{" "}
          <Link href="/register" className="font-semibold text-primary hover:underline">
            Create account
          </Link>
        </p>
      </form>
    </Form>
  );
}
