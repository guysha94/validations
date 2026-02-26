"use client";

import { useQuery } from "@tanstack/react-query";
import api from "~/lib/api";

const DB_TABLES_QUERY_KEY = ["db-tables"] as const;

export function useDbTables() {
  return useQuery({
    queryKey: DB_TABLES_QUERY_KEY,
    queryFn: () => api.dbTables.getAll(),
    staleTime: 5 * 60 * 1000,
  });
}
