"use client";
import _ from "lodash";
import {
  CheckIcon,
  ChevronsUpDownIcon,
  icons,
  type LucideIcon,
} from "lucide-react";
import { createElement, memo, useState } from "react";
import type { ControllerRenderProps } from "react-hook-form";
import { Button } from "~/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { cn } from "~/lib/utils";

const iconsList = Object.keys(icons);

type SelectIconProps = {
  field: ControllerRenderProps<any, any>;
};

function SelectIconComponent({ field }: SelectIconProps) {
  const [open, setOpen] = useState<boolean>(false);

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between cursor-pointer"
        >
          {_.startCase(field.value || "Select Icon")}
          <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search Icon" />
          <CommandList className="max-h-[300px] overflow-y-auto overflow-x-hidden">
            <CommandEmpty>No icons found.</CommandEmpty>
            <CommandGroup>
              {iconsList.map((icon, idx) => (
                <CommandItem
                  key={idx}
                  value={icon}
                  className="cursor-pointer"
                  onSelect={(currentValue) => {
                    field.onChange(
                      currentValue === field.value ? "" : currentValue,
                    );
                    setOpen(false);
                  }}
                >
                  <CheckIcon
                    className={cn(
                      "mr-2 h-4 w-4",
                      field.value === icon ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {
                    <>
                      {createElement(
                        (icons as Record<string, unknown>)[
                          icon
                        ] as never as LucideIcon,
                      )}
                      <span>{_.startCase(icon)}</span>
                    </>
                  }
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export const SelectIcon = memo(SelectIconComponent);

export default SelectIcon;
