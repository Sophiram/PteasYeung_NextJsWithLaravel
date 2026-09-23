import React from 'react';

export default function RoomCardSkeleton() {
    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl overflow-hidden flex flex-col animate-pulse">
            {/* Image Placeholder */}
            <div className="aspect-[4/3] bg-slate-200 dark:bg-slate-800"></div>

            {/* Content Placeholder */}
            <div className="p-5 flex-1 flex flex-col">
                <div className="h-3 w-1/4 bg-slate-200 dark:bg-slate-800 rounded mb-2"></div>
                <div className="h-6 w-3/4 bg-slate-200 dark:bg-slate-800 rounded mb-2"></div>
                <div className="h-4 w-1/2 bg-slate-200 dark:bg-slate-800 rounded mb-4"></div>

                {/* Price Box Placeholder */}
                <div className="mt-auto mb-4 bg-slate-100 dark:bg-slate-950 rounded-2xl p-3 h-16 flex items-center justify-between">
                    <div className="h-3 w-12 bg-slate-200 dark:bg-slate-800 rounded"></div>
                    <div className="h-6 w-20 bg-slate-200 dark:bg-slate-800 rounded"></div>
                </div>

                {/* Button Placeholder */}
                <div className="w-full py-3 h-11 rounded-xl bg-slate-200 dark:bg-slate-800"></div>
            </div>
        </div>
    );
}
