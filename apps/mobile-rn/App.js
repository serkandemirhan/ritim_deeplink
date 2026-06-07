import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import OnboardingScreen from './src/features/onboarding/OnboardingScreen';
import HomeScreen from './src/features/home/HomeScreen';
import MockScanScreen from './src/features/nfc/MockScanScreen';
import RegisterCardScreen from './src/features/cards/RegisterCardScreen';
import MyCardsScreen from './src/features/cards/MyCardsScreen';
import HistoryScreen from './src/features/history/HistoryScreen';
import useStore from './src/store/store';

export default function App() {
  const profile = useStore((s) => s.profile);
  const [route, setRoute] = useState(profile ? 'home' : 'onboarding');
  const [routeParams, setRouteParams] = useState(null);

  const navigate = (r, params) => {
    setRouteParams(params || null);
    setRoute(r);
  };

  const renderRoute = () => {
    switch (route) {
      case 'onboarding':
        return <OnboardingScreen navigate={navigate} />;
      case 'home':
        return <HomeScreen navigate={navigate} />;
      case 'mock-scan':
        return <MockScanScreen navigate={navigate} />;
      case 'cards/register':
        return <RegisterCardScreen route={{ params: routeParams }} navigate={navigate} />;
      case 'cards':
        return <MyCardsScreen navigate={navigate} />;
      case 'history':
        return <HistoryScreen navigate={navigate} />;
      default:
        return <HomeScreen navigate={navigate} />;
    }
  };

  return (
    <>
      <StatusBar style="light" />
      {renderRoute()}
    </>
  );
}
