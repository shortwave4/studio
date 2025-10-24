"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/firebase";
import { Flame } from "lucide-react";

export default function RootPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading) {
      if (user) {
        router.push("/discover");
      } else {
        router.push("/login");
      }
    }
  }, [user, isUserLoading, router]);

  return (
    <div className="flex items-center justify-center h-screen">
       <div className="flex flex-col items-center gap-4">
           <Flame className="h-12 w-12 text-primary animate-pulse" />
           <p className="text-muted-foreground">Connecting...</p>
        </div>
    </div>
  );
}
