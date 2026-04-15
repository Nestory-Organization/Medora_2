const Skeleton = ({ className, height, width }: { className?: string; height?: string; width?: string }) => (
  <div 
    className={`bg-slate-800/50 animate-pulse rounded-2xl ${className}`}
    style={{ height: height || '100%', width: width || '100%' }}
  />
);

export const StatCardSkeleton = () => (
  <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 p-5 rounded-3xl flex items-center justify-between shadow-xl shadow-black/5">
    <div className="flex items-center gap-4">
      <Skeleton className="w-12 h-12 rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-2 w-16" />
        <Skeleton className="h-6 w-24" />
      </div>
    </div>
    <Skeleton className="w-6 h-6 rounded-full" />
  </div>
);

export const TableSkeleton = ({ rows = 3 }: { rows?: number }) => (
  <div className="space-y-4">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="px-5 py-4 bg-slate-800/20 border border-white/5 rounded-3xl flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="w-12 h-12 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
        <div className="flex items-center gap-6">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="w-10 h-10 rounded-xl" />
        </div>
      </div>
    ))}
  </div>
);

export const ProfileSkeleton = () => (
  <div className="space-y-8">
    <div className="flex items-center gap-6 p-8 bg-slate-900/40 rounded-3xl border border-white/5">
      <Skeleton className="w-24 h-24 rounded-full" />
      <div className="space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Skeleton className="h-48 rounded-3xl" />
      <Skeleton className="h-48 rounded-3xl" />
    </div>
  </div>
);

export default Skeleton;
