import React from "react";
import { AuthCard } from "@/components/auth/AuthCard";

export default function ChildSetupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthCard showMascot={false} maxWidth="max-w-[500px]">
      {children}
    </AuthCard>
  );
}

