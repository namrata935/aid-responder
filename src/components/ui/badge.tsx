import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground",
        success:
          "border-transparent bg-success text-success-foreground",
        warning:
          "border-transparent bg-warning text-warning-foreground",
        info:
          "border-transparent bg-info text-info-foreground",
        outline: "text-foreground",
        priority_high:
          "border-destructive/30 bg-destructive/10 text-destructive",
        priority_medium:
          "border-warning/30 bg-warning/10 text-warning",
        priority_low:
          "border-success/30 bg-success/10 text-success",
        status_assigned:
          "border-info/30 bg-info/10 text-info",
        status_completed:
          "border-success/30 bg-success/10 text-success",
        status_pending:
          "border-warning/30 bg-warning/10 text-warning",
        ai:
          "border-primary/30 bg-primary/10 text-primary",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
