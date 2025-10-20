import { Skeleton } from "@/components/ui/skeleton";

export const WorkspaceSkeleton = () => {
  return (
    <div className="h-screen flex flex-col bg-background">
      <div className="border-b px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-6 w-48" />
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-64 border-r p-4 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-8 w-8" />
          </div>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>

        <div className="flex-1 p-4">
          <Skeleton className="h-full w-full" />
        </div>

        <div className="w-80 border-l p-4 space-y-4">
          <Skeleton className="h-10 w-full" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const ProjectsSkeleton = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b px-6 py-4">
        <div className="container max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto px-6 py-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="border rounded-lg p-6 space-y-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <div className="flex gap-2 pt-2">
                <Skeleton className="h-9 flex-1" />
                <Skeleton className="h-9 w-20" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};
