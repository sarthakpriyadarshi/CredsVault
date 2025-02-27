"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login, signUp } from "@/api/auth";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import Image from "next/image";

interface AuthFormProps extends React.ComponentProps<"div"> {
  mode: "login" | "signup";
  userType: "user" | "company";
}

export function AuthForm({ mode, userType, className, ...props }: AuthFormProps) {
  const router = useRouter();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const loginPath = userType === "company" ? "/company/login" : "/user/login";
  const signUpPath = userType === "company" ? "/company/signup" : "/user/signup";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      console.log("Submitting form data:", formData);

      const data =
        mode === "login"
          ? await login(formData.email, formData.password, userType)
          : await signUp(formData.name, formData.email, formData.password, userType);
      console.log("Response from API:", data);

      if (data?.token) {
        localStorage.setItem("token", data.token);
        const dashboardPath = userType === "company" ? "/company/dashboard" : "/user/dashboard";
        router.push(dashboardPath);
      } else {
        setError(data?.message || "Authentication failed.");
      }
    } catch (err) {
      console.error("Error occurred:", err);
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", isDarkMode ? "dark" : "", className)} {...props}>
      <Card className="overflow-hidden dark:bg-gray-900 dark:text-white">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">
                  {mode === "login" ? "Welcome back" : "Create an account"}
                </h1>
                <Button variant="ghost" onClick={toggleDarkMode}>
                  {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </Button>
              </div>
              <p className="text-muted-foreground">
                {mode === "login"
                  ? `Login to your ${userType === "company" ? "company" : "user"} account`
                  : `Sign up as a ${userType}`}
              </p>
              {error && <p className="text-red-500 text-center">{error}</p>}

              {mode === "signup" && (
                <div className="grid gap-2">
                  <Label htmlFor="name">
                    {userType === "company" ? "Company Name" : "Full Name"}
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Processing..." : mode === "login" ? "Login" : "Sign Up"}
              </Button>

              <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:border-t after:border-border">
                <span className="relative z-10 bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Button variant="outline" className="w-full">Google</Button>
                <Button variant="outline" className="w-full">Facebook</Button>
                <Button variant="outline" className="w-full">Apple</Button>
              </div>

              {mode === "login" ? (
                <div className="text-center text-sm">
                  Don&apos;t have an account?{" "}
                  <a href={signUpPath} className="underline">
                    Sign up
                  </a>
                </div>
              ) : (
                <div className="text-center text-sm">
                  Already have an account?{" "}
                  <a href={loginPath} className="underline">
                    Login
                  </a>
                </div>
              )}
            </div>
          </form>
          <div className="relative hidden bg-muted md:block">
            <Image
              src="/next.svg"
              alt="Image"
              fill
              className="object-cover dark:brightness-75 dark:grayscale"
            />
          </div>
        </CardContent>
      </Card>

      <div className="text-center text-xs text-muted-foreground">
        By clicking continue, you agree to our{" "}
        <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
      </div>
    </div>
  );
}
