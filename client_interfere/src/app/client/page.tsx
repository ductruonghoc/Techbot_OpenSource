"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DefaultRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/client/log-in");
  }, [router]);

  return null;
}