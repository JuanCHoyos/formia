import { BRAND_NAMES, BRANDS } from './brand';
import { buildBrandColorStyles } from './brand-color-styles';

describe('buildBrandColorStyles', () => {
  const css = buildBrandColorStyles('app-dark');

  it('defines a text and a highlight class for every brand', () => {
    for (const brand of BRAND_NAMES) {
      expect(css).toContain(`.te-color-${brand}{color:${BRANDS[brand].light.text}}`);
      expect(css).toContain(`.te-bg-${brand}{background-color:${BRANDS[brand].light.soft2}}`);
    }
  });

  it('switches to the dark scheme colors under the dark class', () => {
    expect(css).toContain(`.app-dark .te-color-teal{color:${BRANDS.teal.dark.text}}`);
    expect(css).toContain(`.app-dark .te-bg-teal{background-color:${BRANDS.teal.dark.soft2}}`);
  });
});
