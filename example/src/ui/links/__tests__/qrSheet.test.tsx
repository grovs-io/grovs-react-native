import { render } from '@testing-library/react-native';
import { QrSheet } from '../QrSheet';

let mockScheme: 'light' | 'dark' = 'light';
const mockQrProps: Array<Record<string, unknown>> = [];

jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  __esModule: true,
  default: () => mockScheme,
}));

jest.mock('react-native-qrcode-svg', () => (props: Record<string, unknown>) => {
  mockQrProps.push(props);
  return null;
});

const qrPropsIn = (scheme: 'light' | 'dark') => {
  mockScheme = scheme;
  mockQrProps.length = 0;
  render(<QrSheet link="https://grovs.link/abc" visible onClose={() => {}} />);
  return mockQrProps[mockQrProps.length - 1];
};

describe('QrSheet', () => {
  it('draws the same dark on light code with a quiet zone in both modes', () => {
    const light = qrPropsIn('light');
    const dark = qrPropsIn('dark');
    expect(light).toMatchObject({
      value: 'https://grovs.link/abc',
      color: '#000000',
      backgroundColor: '#FFFFFF',
      quietZone: 12,
    });
    expect(dark).toEqual(light);
  });
});
