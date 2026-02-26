import { LoaderIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "~/lib/utils";

function Spinner({ className, ...props }: ComponentProps<"svg">) {
  return (
    <LoaderIcon
      role="status"
      aria-label="Loading"
      className={cn("size-4 animate-spin", className)}
      {...props}
    />
  );
}

type LoaderProps = {
  fullscreen?: boolean;
};

export default function Loader({ fullscreen = false }: LoaderProps) {
  if (fullscreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background/75 z-50">
        <Spinner />
      </div>
    );
  }
  return (
    <div className="flex items-center gap-4">
      <Spinner />
    </div>
  );
}
