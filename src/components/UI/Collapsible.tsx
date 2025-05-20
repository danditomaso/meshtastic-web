import * as CollapsiblePrimitives from "@radix-ui/react-collapsible";
import * as React from "react";
import { cn } from "@core/utils/cn.ts";

const Collapsible = React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof CollapsiblePrimitives.Root>
>(({ className, ...props }, ref) => (
  <CollapsiblePrimitives.Root
    ref={ref}
    className={cn("w-full", className)}
    {...props}
  />
));
Collapsible.displayName = CollapsiblePrimitives.Root.displayName;

const CollapsibleTrigger = React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitives.Trigger>,
  React.ComponentPropsWithoutRef<typeof CollapsiblePrimitives.Trigger>
>(({ className, children, ...props }, ref) => (
  <CollapsiblePrimitives.Trigger
    ref={ref}
    className={cn(
      "flex w-full cursor-pointer items-center justify-between rounded-md px-4 py-3 text-left text-sm font-medium",
      "transition-all hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 dark:hover:bg-slate-800 dark:focus-visible:ring-slate-400 dark:focus-visible:ring-offset-slate-900",
      "data-[state=open]:rounded-b-none",
      className,
    )}
    {...props}
  >
    {children}
  </CollapsiblePrimitives.Trigger>
));
CollapsibleTrigger.displayName = CollapsiblePrimitives.Trigger.displayName;

const CollapsibleContent = React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitives.Content>,
  React.ComponentPropsWithoutRef<typeof CollapsiblePrimitives.Content>
>(({ className, ...props }, ref) => (
  <CollapsiblePrimitives.Content
    ref={ref}
    className={cn(
      "overflow-hidden rounded-b-md bg-white px-4 text-sm dark:bg-slate-900 dark:text-slate-300",
      "transition-all data-[state=open]:border-x data-[state=open]:border-b data-[state=open]:border-slate-200 data-[state=open]:py-3 data-[state=open]:dark:border-slate-700",
      "data-[state=closed]:py-0",
      className,
    )}
    {...props}
  />
));
CollapsibleContent.displayName = CollapsiblePrimitives.Content.displayName;

export { Collapsible, CollapsibleContent, CollapsibleTrigger };
