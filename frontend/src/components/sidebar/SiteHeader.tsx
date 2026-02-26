"use client";
import { memo } from "react";
import { useShallow } from "zustand/react/shallow";
import { Separator } from "~/components/ui/separator";
import { SidebarTrigger } from "~/components/ui/sidebar";
import { useStore } from "~/store";

export function SiteHeader() {
  // const {open, setOpen} = useSidebar();
  const { activeEvent, isAuthenticated } = useStore(
    useShallow((state) => state),
  );
  // useEffect(() => {
  //
  //     if (typeof document === 'undefined') return;
  //     const cookieValue = document.cookie.split('; ').find(row => row.startsWith(`${SIDEBAR_COOKIE_NAME}=`))?.split('=')[1];
  //     const newOpenState = cookieValue !== "false";
  //     if (open !== newOpenState) {
  //         setOpen(newOpenState);
  //     }
  //
  // }, [open, setOpen]);

  if (!isAuthenticated) return null;

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1 cursor-pointer" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">{activeEvent?.label}</h1>
      </div>
    </header>
  );
}

export default memo(SiteHeader);
