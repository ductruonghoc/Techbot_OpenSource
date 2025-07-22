"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BASEURL from "../../api/backend/dmc_api_gateway/baseurl";

export default function LogInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch(`${BASEURL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Login failed.");
        return;
      }

      // Save token to localStorage
      localStorage.setItem("dmc_api_gateway_token", data.token);

      // Redirect to home
      router.push("/client/features");
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="container mx-auto p-4 flex justify-between items-center">
        <div className="text-2xl font-bold">TechBot</div>
        <Link href="/client/sign-up" className="text-[#2e3470] font-medium hover:underline">
          Sign up
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-semibold">Welcome Back</h1>
            <p className="text-muted-foreground mt-2">Enter your email and password to log in</p>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                </div>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="example@email.com"
                  className="pl-10 rounded-full border-2 border-[#a9b5df] focus:border-[#4045ef] w-full placeholder:text-gray-300 py-[22px]"
                  required
                  value={email}
                  onChange={(e : any) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-muted-foreground" />
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  className="pl-10 rounded-full border-2 border-[#a9b5df] focus:border-[#4045ef] w-full placeholder:text-gray-300 py-[22px]"
                  required
                  value={password}
                  onChange={(e : any) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <Button type="submit" className="w-full bg-[#2e3470] text-white hover:bg-[#232759] rounded-full py-[22px]">
              Log in
            </Button>
          </form>

          <div className="flex justify-between text-sm mt-4">
            <p>
              Don't have an account?
              <Link href="/client/sign-up" className="ml-1 text-[#2e3470] font-medium hover:underline">
                Sign up
              </Link>
            </p>
            <Link href="/client/forgot-password" className="text-[#2e3470] font-medium hover:underline">
              Forgot password?
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}