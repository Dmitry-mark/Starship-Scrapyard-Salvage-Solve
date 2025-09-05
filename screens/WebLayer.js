// WebLayer.jsx
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  Linking,
  Platform,
  StyleSheet,
  View,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { WebView } from "react-native-webview";
import * as ScreenOrientation from "expo-screen-orientation";

const PATTERNS = [
  "redirect",
  "err_too_many_redirects",
  "webpage not available",
];
const URL_PARTS = ["gmetrck"];

// домены/схемы, которые должны открываться во внешних приложениях
function isExternal(url = "") {
  const low = url.toLowerCase();
  return (
    low.startsWith("mailto:") ||
    low.startsWith("tel:") ||
    low.startsWith("tg:") ||
    low.startsWith("sms:") ||
    low.startsWith("whatsapp:") ||
    low.startsWith("viber:") ||
    low.startsWith("skype:") ||
    low.startsWith("geo:") ||
    low.startsWith("comgooglemaps://") ||
    low.startsWith("yandexmaps://") ||
    low.startsWith("2gis://") ||
    low.startsWith("market:") ||
    low.startsWith("intent:") ||
    low.startsWith("itms-apps:")
  );
}

function isHttpsDomain(url = "") {
  try {
    const u = new URL(url);
    const host = (u.hostname || "").toLowerCase();
    const path = (u.pathname || "").toLowerCase();

    // Яндекс.Карты
    if (host.includes("yandex") && path.startsWith("/maps")) return true;

    // Google Maps
    if ((host === "www.google.com" || host === "google.com") && path.startsWith("/maps")) {
      return true;
    }

    // 2GIS
    if (host.includes("2gis.ru")) return true;

    // соцсети/мессенджеры и т.п. — добавляй по необходимости
    const APP_DOMAINS = new Set([
      "t.me",
      "telegram.me",
      "telegram.org",
      "wa.me",
      "api.whatsapp.com",
      "instagram.com",
      "www.instagram.com",
      "facebook.com",
      "m.facebook.com",
      "fb.me",
      "vk.com",
      "m.vk.com",
      "twitter.com",
      "mobile.twitter.com",
      "x.com",
      "youtube.com",
      "www.youtube.com",
      "youtu.be",
      "music.youtube.com",
      "viber.com",
      "invite.viber.com",
      "skype.com",
      "join.skype.com",
      "open.spotify.com",
      "waze.com",
      "www.waze.com",
      "uber.com",
      "play.google.com",
      "apps.apple.com",
    ]);

    return APP_DOMAINS.has(host);
  } catch {
    return false;
  }
}

// Внутри WebView остаются сервисы Google (кроме Google Maps)
function isGoogle(url = "") {
  try {
    const u = new URL(url);
    const host = (u.hostname || "").toLowerCase();
    if ((host === "google.com" || host === "www.google.com") && u.pathname.startsWith("/maps")) {
      return false; // карты — наружу
    }
    return (
      /(^|\.)google(\.|$)/.test(host) ||
      host.includes("gstatic") ||
      host.includes("googleusercontent")
    );
  } catch {
    return false;
  }
}

const WebLayer = forwardRef(function WebLayer({ targetUrl, onFallback }, ref) {
  const webRef = useRef(null);
  const [canGoBack, setCanGoBack] = useState(false);

  // Разрешаем поворот только для WebView (экран WebLayer)
  useEffect(() => {
    ScreenOrientation.lockAsync(
      ScreenOrientation.OrientationLock.ALL_BUT_UPSIDE_DOWN
    ).catch(() => {});
    return () => {
      // Возвращаем портрет для остальных экранов
      ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.PORTRAIT_UP
      ).catch(() => {});
    };
  }, []);

  useImperativeHandle(ref, () => ({
    canGoBack: () => !!canGoBack,
    goBack: () => webRef.current?.goBack(),
  }));

  const handleShouldStart = (navReq) => {
    const url = navReq?.url ?? "";

    // Схемы сразу наружу (телефон, TG, карты по deeplink и т.п.)
    if (isExternal(url)) {
      Linking.openURL(url).catch(() => {});
      return false;
    }

    // HTTPS-домены, которые лучше открыть в нативном приложении
    if (/^https?:/i.test(url) && isHttpsDomain(url)) {
      if (!isGoogle(url)) {
        Linking.openURL(url).catch(() => {});
        return false;
      }
    }
    return true;
  };

  const handleNavChange = (navState) => {
    setCanGoBack(!!navState?.canGoBack);

    const url = (navState?.url || "").toLowerCase();
    const title = (navState?.title || "").toLowerCase();

    const flaggedByUrl = URL_PARTS.some((p) => url.includes(p));
    const flaggedByTitle = PATTERNS.some((p) => title.includes(p));
    if (flaggedByUrl || flaggedByTitle) onFallback?.();
  };

  const handleError = (e) => {
    const code = e?.nativeEvent?.statusCode ?? 0;
    if (code === 404 || (code >= 400)) onFallback?.();
  };

  return (
  <SafeAreaView
    style={[
      styles.safe,
      Platform.OS === "android"
        ? {
            // уменьшаем отступ: берем высоту статус-бара, но не больше 16
            paddingTop: Math.min(StatusBar.currentHeight ?? 0, 8),
          }
        : null,
    ]}
  >
    <StatusBar
      translucent
      backgroundColor="transparent"
      barStyle="light-content"
    />
    <View style={styles.container}>
      <WebView
        ref={webRef}
        source={{ uri: targetUrl }}
        originWhitelist={["*"]}
        javaScriptEnabled
        domStorageEnabled
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        cacheEnabled
        mixedContentMode="always"
        setSupportMultipleWindows={false}
        onShouldStartLoadWithRequest={handleShouldStart}
        onNavigationStateChange={handleNavChange}
        onHttpError={handleError}
        onError={() => onFallback?.()}
        allowsBackForwardNavigationGestures={Platform.OS === "ios"}
        automaticallyAdjustContentInsets={false}
        contentInsetAdjustmentBehavior="never"
        style={styles.web}
      />
    </View>
  </SafeAreaView>
);
});

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#000", // под статус-баром чёрный фон
  },
  container: { flex: 1, backgroundColor: "#000" },
  web: { flex: 1, backgroundColor: "transparent" },
});

export default WebLayer;
