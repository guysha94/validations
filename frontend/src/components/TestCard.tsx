"use client";
import { TestForm } from "~/components/forms";
import { ErrorTable } from "~/components/tables";

type Props = {
  readOnly?: boolean;
};

export default function TestCard({ readOnly = false }: Props) {
  return (
    <div className="min-h-[85dvh] flex flex-col gap-6">
      <TestForm readOnly={readOnly} />
      <ErrorTable />
    </div>
  );
}
