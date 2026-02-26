"use client";
import { useContext } from "react";
import { authContext, type ContextType } from "~/contexts/auth-context";

export function useAuth(): ContextType {
  const ctx = useContext(authContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return ctx;
}
