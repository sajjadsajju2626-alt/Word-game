import type { CategoryMeta, LanguageMode } from '../game/types';

export function TitleEmblem() {
  return (
    <svg
      viewBox="0 0 64 64"
      className="h-12 w-12 shrink-0"
      aria-hidden="true"
    >
      <rect x="6" y="8" width="52" height="48" rx="10" fill="#065F46" />
      <rect x="10" y="12" width="44" height="40" rx="6" fill="#FFFFFF" />
      <line x1="16" y1="24" x2="48" y2="24" stroke="#E2E8F0" strokeWidth="2" />
      <line x1="16" y1="34" x2="48" y2="34" stroke="#E2E8F0" strokeWidth="2" />
      <line x1="16" y1="44" x2="38" y2="44" stroke="#E2E8F0" strokeWidth="2" />
      <circle cx="45" cy="43" r="10" fill="#059669" stroke="#FFFFFF" strokeWidth="2.5" />
      <text
        x="45"
        y="47"
        textAnchor="middle"
        fill="#FFFFFF"
        fontSize="11"
        fontWeight="800"
        fontFamily="system-ui, sans-serif"
      >
        അ
      </text>
      <text
        x="32"
        y="21"
        textAnchor="middle"
        fill="#0F172A"
        fontSize="10"
        fontWeight="800"
        fontFamily="system-ui, sans-serif"
      >
        A–Z
      </text>
    </svg>
  );
}

export function formatCategoryTitle(cat: CategoryMeta, lang: LanguageMode): {
  primary: string;
  secondary?: string;
} {
  if (lang === 'english') {
    return { primary: cat.en };
  }
  if (lang === 'malayalam') {
    return { primary: cat.ml, secondary: cat.en };
  }
  return { primary: cat.ml, secondary: cat.en };
}
