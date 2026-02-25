"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { Eye } from "lucide-react";
import { toast } from "sonner";

import { loginAction, loginWithGoogleAction, signUpAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { authSchema, type AuthInput } from "@/lib/validations";

interface AuthFormProps {
  mode: "login" | "signup";
}

export function AuthForm({ mode }: AuthFormProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<AuthInput>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  });

  const onSubmit = (values: AuthInput) => {
    startTransition(async () => {
      const result = mode === "login" ? await loginAction(values) : await signUpAction(values);

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success(result.message ?? "Success");

      if (mode === "login") {
        router.push("/dashboard");
      } else {
        router.push("/login");
      }
    });
  };

  const onGoogleLogin = () => {
    startTransition(async () => {
      const result = await loginWithGoogleAction();

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      router.push(result.data.url);
    });
  };

  return (
    <div className="w-full max-w-md">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">
        {mode === "login" ? "Nice to see you again" : "Create your account"}
      </h1>
      <p className="mt-2 text-sm text-slate-500">
        {mode === "login" ? "Sign in to manage sports events and venues." : "Start managing your events in one place."}
      </p>

      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <Form {...form}>
          <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Email or phone number"
                      autoComplete="email"
                      className="h-11 bg-slate-50"
                      {...field}
                    />
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
                        type="password"
                        placeholder="Enter password"
                        autoComplete="current-password"
                        className="h-11 bg-slate-50 pr-10"
                        {...field}
                      />
                      <Eye className="pointer-events-none absolute right-3 top-3.5 h-4 w-4 text-slate-400" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-slate-500">
                <input type="checkbox" className="h-4 w-4 rounded border-slate-300" />
                Remember me
              </label>
              <span className="text-primary">Forgot password?</span>
            </div>

            <Button className="h-11 w-full text-base" type="submit" disabled={isPending}>
              {isPending ? "Please wait..." : mode === "login" ? "Sign in" : "Sign up"}
            </Button>

            <Button
              type="button"
              variant="secondary"
              className="h-11 w-full rounded-full border border-slate-300 bg-white text-slate-900 hover:bg-slate-50"
              onClick={onGoogleLogin}
              disabled={isPending}
            >
              <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-sm font-semibold text-[#4285F4] shadow">
                G
              </span>
              Continue with Google
            </Button>
          </form>
        </Form>

        <p className="mt-6 text-center text-sm text-slate-500">
          {mode === "login" ? (
            <>
              Don&apos;t have an account?{" "}
              <Link className="font-medium text-primary" href="/signup">
                Sign up now
              </Link>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Link className="font-medium text-primary" href="/login">
                Login
              </Link>
            </>
          )}
        </p>
      </div>

      <div className="mt-8 flex items-center justify-between text-xs text-slate-400">
        <span>@fastbreak</span>
        <span>Perfect Login 2026</span>
      </div>
      {mode === "login" ? (
        <p className="sr-only">
          No account yet? <Link className="text-primary underline" href="/signup">Sign up</Link>
        </p>
      ) : (
        <p className="sr-only">
          Already have an account? <Link className="text-primary underline" href="/login">Login</Link>
        </p>
      )}
    </div>
  );
}
