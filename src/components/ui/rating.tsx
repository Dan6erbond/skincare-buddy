import { Star } from "lucide-react";
import { cn } from "@heroui/react";

type RatingProps = {
  value: number;
  onChange?(value: number): void;
};

export function Rating({ value, onChange }: RatingProps) {
  return (
    <div className="flex items-center gap-1 pt-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          onClick={onChange && (() => onChange(star))}
          className={cn(
            onChange && "cursor-pointer transition-transform hover:scale-110",
            "size-5",
            value >= star ? "fill-amber-500" : "fill-transparent",
            value >= star ? "text-amber-500" : "text-content4",
          )}
        />
      ))}
    </div>
  );
}
