export function formatJOD(value, language = 'en') {
    const amount = Number(value || 0);
    return new Intl.NumberFormat(language === 'ar' ? 'ar-JO' : 'en-JO', {
        style: 'currency',
        currency: 'JOD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
}
