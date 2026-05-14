import React from 'react';

export default function PageHeader({ eyebrow, title, subtitle, rightSlot, actions, bottomSlot }) {
    return (
        <section className="surface-card relative overflow-hidden rounded-3xl p-6 sm:p-7">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(246,234,206,0.16),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(71,110,162,0.2),transparent_52%)]" />
            <div className="absolute -top-24 right-10 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(246,234,206,0.3),transparent_60%)] blur-2xl" />
            <div className="absolute -bottom-24 left-6 h-32 w-32 rounded-full bg-[radial-gradient(circle,rgba(88,120,178,0.28),transparent_62%)] blur-2xl" />

            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="space-y-3">
                    {eyebrow ? (
                        <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.3em] text-slate-300">
                            {eyebrow}
                        </span>
                    ) : null}
                    <h1 className="text-3xl font-black text-[#fff4dd] text-glow sm:text-4xl">
                        {title}
                    </h1>
                    {subtitle ? (
                        <p className="text-sm text-slate-300 sm:text-base">
                            {subtitle}
                        </p>
                    ) : null}
                </div>

                {rightSlot ? (
                    <div className="flex flex-wrap gap-3">
                        {rightSlot}
                    </div>
                ) : null}
            </div>

            {actions ? (
                <div className="relative mt-6 flex flex-wrap items-center gap-3">
                    {actions}
                </div>
            ) : null}

            {bottomSlot ? (
                <div className="relative mt-6">
                    {bottomSlot}
                </div>
            ) : null}
        </section>
    );
}

export function StatChip({ label, value }) {
    return (
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-slate-200">
            <span className="uppercase tracking-[0.2em] text-slate-400">{label}</span>
            <span className="font-semibold text-white">{value}</span>
        </div>
    );
}
