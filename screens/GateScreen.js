import React, { useEffect, useRef, useState } from "react";
import { SafeAreaView, StatusBar, BackHandler, Platform } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import WebLayer from "./WebLayer";   // наш компонент обёртка
import StartScreen from "./StartScreen"; // локальный UI

const ENTRY_URL = "https://zapasapps.com/api/data?app_key=wao71jp1rx3ylilrejyf6it3srlepoys";

export default function GateScreen({ navigation }) {
  const [webShown, setWebShown] = useState(false);
  const [checked, setChecked] = useState(false);
  const webRef = useRef(null);

  // Проверяем сеть
  useEffect(() => {
    NetInfo.fetch().then((state) => {
      if (state.isConnected && state.isInternetReachable !== false) {
        setWebShown(true);
      } else {
        setWebShown(false);
      }
      setChecked(true);
    });
  }, []);

  // Аппаратная кнопка "назад"
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (webShown && webRef.current?.canGoBack()) {
        webRef.current.goBack();
        return true;
      }
      BackHandler.exitApp();
      return true;
    });
    return () => sub.remove();
  }, [webShown]);

  if (!checked) {
    return null; // можно повесить прелоадер
  }

  if (webShown) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#000", paddingTop: Platform.OS === "android" ? 24 : 0 }}>
        <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
        <WebLayer
          ref={webRef}
          targetUrl={ENTRY_URL}
          onFallback={() => setWebShown(false)} // если ошибка → локальный UI
        />
      </SafeAreaView>
    );
  }

  // Локальное приложение
  return <StartScreen navigation={navigation} />;
}
