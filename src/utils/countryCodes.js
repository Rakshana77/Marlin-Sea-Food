export const COUNTRY_CODES = [
  { code: '+91', name: 'India', flag: '🇮🇳' },
  { code: '+65', name: 'Singapore', flag: '🇸🇬' },
  { code: '+60', name: 'Malaysia', flag: '🇲🇾' },
  { code: '+971', name: 'UAE', flag: '🇦🇪' },
  { code: '+974', name: 'Qatar', flag: '🇶🇦' },
  { code: '+966', name: 'Saudi Arabia', flag: '🇸🇦' },
  { code: '+965', name: 'Kuwait', flag: '🇰🇼' },
  { code: '+968', name: 'Oman', flag: '🇴🇲' },
  { code: '+1', name: 'USA', flag: '🇺🇸' },
  { code: '+44', name: 'United Kingdom', flag: '🇬🇧' },
  { code: '+94', name: 'Sri Lanka', flag: '🇱🇰' },
  { code: '+960', name: 'Maldives', flag: '🇲🇻' },
  { code: '+880', name: 'Bangladesh', flag: '🇧🇩' },
  { code: '+66', name: 'Thailand', flag: '🇹🇭' },
  { code: '+84', name: 'Vietnam', flag: '🇻🇳' },
  { code: '+62', name: 'Indonesia', flag: '🇮🇩' },
  { code: '+61', name: 'Australia', flag: '🇦🇺' },
  { code: '+81', name: 'Japan', flag: '🇯🇵' }
];

export const formatWhatsAppNumber = (countryCode, mobile) => {
  const cleanMobile = mobile.replace(/[^0-9]/g, '');
  return `${countryCode}${cleanMobile}`;
};
