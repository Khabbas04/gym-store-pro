export const JORDAN_GOVERNORATES = [
    { value: 'عمان', labelAr: 'عمان', labelEn: 'Amman', shippingFee: 2 },
    { value: 'إربد', labelAr: 'إربد', labelEn: 'Irbid', shippingFee: 3 },
    { value: 'الزرقاء', labelAr: 'الزرقاء', labelEn: 'Zarqa', shippingFee: 3 },
    { value: 'البلقاء', labelAr: 'البلقاء', labelEn: 'Balqa', shippingFee: 3 },
    { value: 'جرش', labelAr: 'جرش', labelEn: 'Jerash', shippingFee: 3 },
    { value: 'عجلون', labelAr: 'عجلون', labelEn: 'Ajloun', shippingFee: 3 },
    { value: 'مأدبا', labelAr: 'مأدبا', labelEn: 'Madaba', shippingFee: 3 },
    { value: 'الكرك', labelAr: 'الكرك', labelEn: 'Karak', shippingFee: 3 },
    { value: 'الطفيلة', labelAr: 'الطفيلة', labelEn: 'Tafilah', shippingFee: 3 },
    { value: 'معان', labelAr: 'معان', labelEn: "Ma'an", shippingFee: 3 },
    { value: 'العقبة', labelAr: 'العقبة', labelEn: 'Aqaba', shippingFee: 3 },
    { value: 'المفرق', labelAr: 'المفرق', labelEn: 'Mafraq', shippingFee: 3 },
];

export function getGovernorateShippingFee(governorate) {
    const hit = JORDAN_GOVERNORATES.find((entry) => entry.value === governorate);
    return hit ? hit.shippingFee : 3;
}
