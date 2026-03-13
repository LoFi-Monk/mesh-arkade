import { type VariantProps, cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

import {
  Card as ShadcnCard,
  CardContent as ShadcnCardContent,
  CardDescription as ShadcnCardDescription,
  CardFooter as ShadcnCardFooter,
  CardHeader as ShadcnCardHeader,
  CardTitle as ShadcnCardTitle,
} from "../card";

import "@/components/ui/8bit/styles/retro.css";

/**
 * Base styling variants for the 8-bit Card using CVA.
 *
 * @intent Define retro font options for the bit-card.
 * @guarantee Returns a processed string of CSS classes based on the font variant.
 */
export const cardVariants = cva("", {
  variants: {
    font: {
      normal: "",
      retro: "retro",
    },
  },
  defaultVariants: {
    font: "retro",
  },
});

/**
 * Properties for 8-bit Card components.
 *
 * @intent consistent type definitions for all retro card parts.
 * @guarantee based on standard HTML attributes and card variant props.
 */
export interface BitCardProps
  extends React.ComponentProps<"div">,
    VariantProps<typeof cardVariants> {
  asChild?: boolean;
}

/**
 * Retro pixel-art style Card container.
 *
 * @intent provide a consistent retro container for bit-arkade UI.
 * @guarantee Renders an absolute-positioned pixelated border around the content.
 */
function Card({ ...props }: BitCardProps) {
  const { className, font } = props;

  return (
    <div
      className={cn(
        "relative border-y-6 border-foreground dark:border-ring p-0!",
        className
      )}
    >
      <ShadcnCard
        {...props}
        className={cn(
          "rounded-none border-0 w-full!",
          font !== "normal" && "retro",
          className
        )}
      />

      <div
        className="absolute inset-0 border-x-6 -mx-1.5 border-foreground dark:border-ring pointer-events-none"
        aria-hidden="true"
      />
    </div>
  );
}

/**
 * Retro Card Header section.
 *
 * @intent strictly themed header for bit-cards.
 * @guarantee correctly applies retro font variant to inner header.
 */
function CardHeader({ ...props }: BitCardProps) {
  const { className, font } = props;

  return (
    <ShadcnCardHeader
      className={cn(font !== "normal" && "retro", className)}
      {...props}
    />
  );
}

/**
 * Retro Card Title component.
 *
 * @intent strictly themed title for bit-cards.
 * @guarantee correctly applies retro font variant to inner title.
 */
function CardTitle({ ...props }: BitCardProps) {
  const { className, font } = props;

  return (
    <ShadcnCardTitle
      className={cn(font !== "normal" && "retro", className)}
      {...props}
    />
  );
}

/**
 * Retro Card Description component.
 *
 * @intent strictly themed description for bit-cards.
 * @guarantee correctly applies muted retro styling.
 */
function CardDescription({ ...props }: BitCardProps) {
  const { className, font } = props;

  return (
    <ShadcnCardDescription
      className={cn(font !== "normal" && "retro", className)}
      {...props}
    />
  );
}


/**
 * Retro Card Content area.
 *
 * @intent strictly themed content area for bit-cards.
 * @guarantee standardized retro padding and font usage.
 */
function CardContent({ ...props }: BitCardProps) {
  const { className, font } = props;

  return (
    <ShadcnCardContent
      className={cn(font !== "normal" && "retro", className)}
      {...props}
    />
  );
}

/**
 * Retro Card Footer section.
 *
 * @intent strictly themed actions area for bit-cards.
 * @guarantee strictly positioned at bottom-right for action placement.
 */
function CardFooter({ ...props }: BitCardProps) {
  const { className, font } = props;

  return (
    <ShadcnCardFooter
      data-slot="card-footer"
      className={cn(font !== "normal" && "retro", className)}
      {...props}
    />
  );
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
};
