"use client";
import { User, Lock, TriangleAlert } from "lucide-react";
import { Input } from "@/components/form/input";
import { useState } from "react";
import { useRouter } from "next/navigation";
import BASEURL from "../../api/backend/dmc_api_gateway/baseurl";

export default function SignInPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();

  const handleLogin = async () => {
    try {
      const response = await fetch(`${BASEURL}/auth/admin_login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const result = await response.json();

      if (result.success) {
        localStorage.setItem("dmc_api_gateway_token", result.data.token);
        setErrorMessage("");
        router.push("/admin/features");
      } else {
        setErrorMessage(result.message || "Login failed!");
      }
    } catch (error) {
      console.error("Error during login:", error);
      setErrorMessage("An error occurred. Please try again.");
    }
  };

  return (
    <div
      className="min-h-screen bg-black text-white flex flex-col font-sans"
      style={{
        backgroundImage: "url('/admin.gif')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="absolute inset-0 bg-black bg-opacity-60 backdrop-blur-sm"></div>
      <div className="relative z-10 flex flex-col min-h-screen">
        <header className="container mx-auto p-4 flex items-center">
          <div className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-purple-400">
            TechBot
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md space-y-10 bg-white/95 backdrop-blur-md p-8 rounded-2xl shadow-xl border border-gray-200">
            <div className="text-center">
              <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">
                Welcome Back
              </h1>
              <p className="mt-3 text-gray-600 text-lg font-medium">
                Hi admin, please sign in to your account
              </p>
            </div>

            <form
              className="space-y-6"
              onSubmit={(e) => {
                e.preventDefault();
                handleLogin();
              }}
            >
              <div className="space-y-3">
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                  Username
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <Input
                    id="username"
                    name="username"
                    placeholder="Enter your username"
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-12 pr-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-white text-gray-900 placeholder:text-gray-400 w-full transition-all duration-300 ease-in-out"
                    required
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Enter your password"
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-12 pr-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-white text-gray-900 placeholder:text-gray-400 w-full transition-all duration-300 ease-in-out"
                    required
                  />
                </div>
              </div>

              {errorMessage !== "" && (
                <p className="text-sm text-center bg-red-100 text-red-600 p-3 rounded-lg flex items-center justify-center gap-2">
                  <TriangleAlert className="h-5 w-5" />
                  {errorMessage}
                </p>
              )}

              <button
                type="submit"
                className="w-full bg-blue-600 text-white hover:bg-blue-700 rounded-lg py-3 font-semibold text-lg transition-all duration-300 ease-in-out transform hover:scale-105"
              >
                Sign In
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}