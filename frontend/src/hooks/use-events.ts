"use client";
import { useContext } from "react";
import { type ContextType, eventsContext } from "~/contexts/events-context";

export function useEvents(): ContextType {
  const ctx = useContext(eventsContext);
  if (!ctx) {
    throw new Error("useEvents must be used within an EventsContextProvider");
  }

  return ctx;
}
