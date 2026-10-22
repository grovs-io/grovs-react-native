import { darkColors, lightColors } from '../colors';

describe('colors', () => {
  it('has the same keys in both palettes', () => {
    expect(Object.keys(darkColors)).toEqual(Object.keys(lightColors));
  });

  it('uses the Grovs blue as the light accent', () => {
    expect(lightColors.accent).toBe('#2A86FF');
  });
});
