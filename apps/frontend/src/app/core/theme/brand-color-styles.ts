import { BRAND_NAMES, BRANDS } from './brand';

/**
 * CSS for the rich text color classes (`te-color-<brand>`, `te-bg-<brand>`), one pair per brand.
 * Generated from `BRANDS`, so adding a brand makes it available in the editor with no extra CSS.
 * Text uses the brand's readable text color; highlights use its soft background.
 */
export const buildBrandColorStyles = (darkClass: string): string =>
  BRAND_NAMES.map((brand) => {
    const { light, dark } = BRANDS[brand];
    return [
      `.te-color-${brand}{color:${light.text}}`,
      `.${darkClass} .te-color-${brand}{color:${dark.text}}`,
      `.te-bg-${brand}{background-color:${light.soft2}}`,
      `.${darkClass} .te-bg-${brand}{background-color:${dark.soft2}}`,
    ].join('');
  }).join('');
