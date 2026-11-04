import { Skeleton } from "@/components/ui/skeleton";

export default function FeedLoading() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <Skeleton className="h-9 w-32" />
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex flex-col gap-3 rounded-2xl border border-border p-4">
          <Skeleton className="aspect-[4/3] w-full rounded-xl" />
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-full" />
        </div>
      ))}
    </div>
  );
}
