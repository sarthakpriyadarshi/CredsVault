import { AuthForm } from "@/components/auth-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted p-6 md:p-10 tomorrow">
      <div className="w-full max-w-sm md:max-w-3xl">
        <AuthForm mode="login" userType="company" />
      </div>
    </div>
  );
}
