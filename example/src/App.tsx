import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from './theme/ThemeContext';
import { Scaffold } from './ui/Scaffold';

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <Scaffold />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
