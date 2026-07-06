"use client";

import * as PopoverPrimitive from "@radix-ui/react-popover";
import { cn } from "@/lib/utils";

export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;
export const PopoverAnchor = PopoverPrimitive.Anchor;
export const PopoverClose = PopoverPrimitive.Close;

export function PopoverContent({
  className,
  sideOffset = 6,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        sideOffset={sideOffset}
        collisionPadding={12}
        className={cn(
          "z-50 w-72 rounded-lg border border-line bg-surface p-1.5 shadow-lg shadow-ink/8 outline-none",
          "data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95 duration-150",
          className,
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
}
