import { Suspense } from "react";
import { Overview, OverviewSkeleton } from "@/features/analytics/components/overview";
import { rangeSchema } from "@/features/analytics/range";

/** Route: parse the URL, hand off to the feature. */
export default function OverviewPage({ searchParams }: PageProps<"/">) {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <Suspense fallback={<OverviewSkeleton />}>
        {searchParams.then((sp) => <Overview range={rangeSchema.parse(sp.range)} />)}
      </Suspense>
    </div>
  );
}
