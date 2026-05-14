import React from 'react';

export default function SkeletonCard({ className = '' }) {
    return (
        <div className={`animate-pulse rounded-3xl border border-white/10 bg-white/[0.04] p-4 ${className}`}>
            <div className="h-44 rounded-2xl bg-white/10" />
            <div className="mt-4 h-4 w-2/3 rounded bg-white/10" />
            <div className="mt-2 h-3 w-1/2 rounded bg-white/10" />
            <div className="mt-4 h-3 w-3/4 rounded bg-white/10" />
        </div>
    );
}
