"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MyPageRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.push("/apply");
  }, [router]);

  return null;
}
