"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield, Lock, Mail, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check if already authenticated
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (res.ok) {
          router.replace("/admin");
        }
      })
      .catch(() => {});
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Authentication failed.");
        setIsLoading(false);
        return;
      }

      router.replace("/admin");
      router.refresh();
    } catch {
      setErrorMessage("Unable to connect to the authentication service.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-zinc-100 dark:bg-zinc-950 font-sans">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-12 h-12 rounded-lg bg-zinc-900 flex items-center justify-center text-white dark:bg-zinc-50 dark:text-zinc-900 shadow-sm">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            OneTimePrint Administrator
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Secure administrative portal for one-time document provisioning
          </p>
        </div>

        {/* Login Card */}
        <Card className="border-zinc-200 shadow-sm dark:border-zinc-800">
          <CardHeader className="p-6 pb-2">
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Enter your administrative credentials to manage document access tokens.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 pt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2.5 text-red-900 text-xs dark:bg-red-950/50 dark:border-red-800 dark:text-red-200">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
                  <p>{errorMessage}</p>
                </div>
              )}

              <div>
                <Input
                  label="Administrative Email"
                  type="email"
                  placeholder="admin@onetimeprint.internal"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>

              <div>
                <Input
                  label="Password"
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full mt-2 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                isLoading={isLoading}
              >
                <Lock className="w-3.5 h-3.5 mr-1" />
                Authenticate Session
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <div className="text-center text-[11px] text-zinc-400 dark:text-zinc-500 font-mono">
          Strict rate-limiting and audit logging are enforced on this endpoint.
        </div>
      </div>
    </div>
  );
}
