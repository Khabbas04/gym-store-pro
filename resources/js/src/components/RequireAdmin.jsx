import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function RequireAdmin({ children }) {
    const { loading, user, isAdmin } = useAuth();
    const { t } = useLanguage();

    if (loading) {
        return <p className="text-slate-300">{t('loading_account')}</p>;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (!isAdmin) {
        return <Navigate to="/shop" replace />;
    }

    return children;
}
