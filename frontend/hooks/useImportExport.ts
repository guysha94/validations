"use client";

import { useCallback, useState } from "react";
import Papa from "papaparse";
import { downloadBlob } from "~/lib/utils/download";

export function useImportExport() {
    const [isImporting, setIsImporting] = useState(false);

    const exportCsv = useCallback((data: unknown[], filename: string) => {
        const csv = Papa.unparse(data);
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        downloadBlob(blob, filename);
    }, []);

    const exportJson = useCallback((data: unknown, filename: string) => {
        const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: "application/json",
        });
        downloadBlob(blob, filename);
    }, []);

    const importCsv = useCallback(
        async (file: File): Promise<Record<string, string>[]> => {
            setIsImporting(true);
            try {
                const text = await file.text();
                const { data } = Papa.parse<Record<string, string>>(text, {
                    header: true,
                });
                return data ?? [];
            } finally {
                setIsImporting(false);
            }
        },
        []
    );

    const importJson = useCallback(async (file: File): Promise<unknown> => {
        setIsImporting(true);
        try {
            const text = await file.text();
            return JSON.parse(text);
        } finally {
            setIsImporting(false);
        }
    }, []);

    return {
        exportCsv,
        exportJson,
        importCsv,
        importJson,
        isImporting,
        downloadBlob,
    };
}
