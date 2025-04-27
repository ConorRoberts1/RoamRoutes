import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export const GlobalStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export const BackgroundGradient = ({ children }) => (
  <LinearGradient
    colors={['#CBC3E3', 'white']} // Light purple to white gradient
    style={GlobalStyles.container}
  >
    {children}
  </LinearGradient>
);