import { Skeleton } from "@/components/ui/skeleton";

export default function EtenLoading() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <Skeleton className="h-9 w-24" />
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-28 w-full rounded-2xl" />
      ))}
    </div>
  );
}
