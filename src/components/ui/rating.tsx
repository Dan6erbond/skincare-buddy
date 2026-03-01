import { Star } from "lucide-react";

type RatingProps = {
  value: number;
};

export function Rating({ value }: RatingProps) {
  const rating = Math.max(1, Math.min(5, value));

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, index) => {
        const filled = index < rating;

        return (
          <Star
            key={index}
            className={
              filled ? "text-yellow-500 fill-yellow-500" : "text-default-300"
            }
            size={16}
          />
        );
      })}
    </div>
  );
}
