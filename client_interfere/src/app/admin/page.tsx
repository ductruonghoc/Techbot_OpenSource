"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminDefaultRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/log-in");
  }, [router]);

  return null;
}