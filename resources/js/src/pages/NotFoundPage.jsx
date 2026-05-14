import React from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/ui/PageHeader';
import { useLanguage } from '../context/LanguageContext';

export default function NotFoundPage() {
    const { t } = useLanguage();

    return (
        <div className="space-y-6">
            <PageHeader
                eyebrow="404"
                title={t('page_not_found')}
                subtitle={t('not_found_subtitle')}
                actions={(
                    <Link to="/" className="btn-primary px-6 py-2 text-sm">
                        {t('back_home')}
                    </Link>
                )}
            />
        </div>
    );
}
