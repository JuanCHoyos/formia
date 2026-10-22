export type BrandName = 'blue' | 'indigo' | 'rose' | 'teal' | 'violet';

export type PaletteStep =
  '100' | '200' | '300' | '400' | '50' | '500' | '600' | '700' | '800' | '900' | '950';

export interface BrandSchemeColors {
  color: string;
  hover: string;
  active: string;
  text: string;
  soft: string;
  soft2: string;
  border: string;
  disabled: string;
}

export interface BrandDefinition {
  palette: Record<PaletteStep, string>;
  light: BrandSchemeColors;
  dark: BrandSchemeColors;
}
