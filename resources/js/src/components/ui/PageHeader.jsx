import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

export default function PageHeader({ eyebrow, title, subtitle, watermark, rightSlot, actions, bottomSlot }) {
    const { isArabic } = useLanguage();
    const displayWatermark = watermark || title || 'SIRIUS';

    return (
        <section className="relative overflow-hidden pt-36 pb-12 sm:pt-48 sm:pb-16 px-6 sm:px-12 mx-auto max-w-[1600px] border-b border-white/5">
            {/* Ambient Backlight Glows */}
            <div className="absolute top-1/4 left-1/12 w-[350px] h-[350px] rounded-full bg-[#f6eace]/5 blur-[120px] pointer-events-none -z-10" />
            <div className="absolute top-1/2 right-1/10 w-[400px] h-[400px] rounded-full bg-white/[0.01] blur-[150px] pointer-events-none -z-10" />

            {/* Giant Luxury Watermark Text */}
            <div className={`absolute select-none pointer-events-none font-black text-white/[0.02] uppercase leading-none tracking-[0.1em] -z-10 text-[9vw] sm:text-[10vw] hidden md:block ${
                isArabic ? 'left-6 bottom-4' : 'right-6 bottom-4'
            }`}>
                {displayWatermark}
            </div>

            {/* Layout Wrapper */}
            <div className="relative z-10 flex flex-col md:flex-row md:items-end md:justify-between gap-8">
                <div className="flex gap-6 items-start">
                    {/* Vertical Glowing Accent Bar */}
                    <div className="w-[3px] bg-gradient-to-b from-[#f6eace] via-[#f6eace]/50 to-transparent h-16 self-stretch rounded-full" />
                    
                    <div className="space-y-4">
                        {eyebrow ? (
                            <div className="flex items-center gap-3">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#f6eace] shadow-[0_0_8px_#f6eace]" />
                                <span className={`text-[10px] font-black uppercase text-[#f6eace] ${isArabic ? 'tracking-normal' : 'tracking-[0.4em]'}`}>
                                    {eyebrow}
                                </span>
                            </div>
                        ) : null}
                        
                        <h1 className="text-3xl font-black uppercase tracking-tight sm:text-6xl text-white leading-[1.15] bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-[#f6eace]/90">
                            {title}
                        </h1>

                        {subtitle ? (
                            <p className="max-w-2xl text-xs sm:text-sm font-semibold leading-relaxed text-slate-400">
                                {subtitle}
                            </p>
                        ) : null}
                    </div>
                </div>

                {/* Right / Side Content */}
                {rightSlot ? (
                    <div className="flex flex-wrap gap-4 shrink-0">
                        {rightSlot}
                    </div>
                ) : null}
            </div>

            {/* Actions / Buttons row */}
            {actions ? (
                <div className="relative z-10 mt-8 flex flex-wrap items-center gap-4 border-t border-white/5 pt-6">
                    {actions}
                </div>
            ) : null}

            {bottomSlot ? (
                <div className="relative z-10 mt-8">
                    {bottomSlot}
                </div>
            ) : null}
        </section>
    );
}

export function StatChip({ label, value }) {
    return (
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md px-5 py-3 text-xs text-slate-300 shadow-sm hover:border-white/20 transition-all">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">{label}</span>
            <span className="font-black text-white">{value}</span>
        </div>
    );
}
