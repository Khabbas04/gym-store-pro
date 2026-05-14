import React from 'react';
import Footer from '../components/Footer';
import Header from '../components/Header';

export default function MainLayout({ user, onLogout, children }) {
    return (
        <div className="theme-sirius-space app-shell-bg min-h-screen text-white">
            <div className="pointer-events-none fixed inset-0 -z-10">
                <div className="aurora-layer h-full w-full" />
                <div className="constellation-layer" />
            </div>

            <Header user={user} onLogout={onLogout} />
            <main className="page-enter min-h-screen">
                {children}
            </main>
            <Footer />
        </div>
    );
}
