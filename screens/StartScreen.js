// screens/StartScreen.jsx
import React, { useEffect, useRef } from "react";
import {
  View,
  ImageBackground,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
  Pressable,
  Animated,
  Easing,
  Text,
} from "react-native";

const bg = require("../assets/fon1.png");
const logo = require("../assets/logo.png");
const btnQuiz = require("../assets/btn2.png");
const btnOther = require("../assets/btn2.png");

// синус-кейфреймы для бесшовной анимации
function sinPoints(amplitude = 1, offset = 0) {
  const ts = [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1];
  const ys = ts.map((t) => Math.sin(2 * Math.PI * (t + offset)) * amplitude);
  return { inputRange: ts, outputRange: ys };
}

export default function StartScreen({ navigation }) {
  const goQuiz = () => navigation.navigate("Quiz");
  const goEngineer = () => navigation.navigate("Game");

  // бесшовная петля для лого
  const loopT = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(logoOpacity, {
      toValue: 1,
      duration: 650,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.timing(loopT, {
        toValue: 1,
        duration: 6000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [loopT, logoOpacity]);

  const FLOAT_AMPL = 8;
  const SCALE_AMPL = 0.04;
  const TILT_AMPL = 1.2;

  const { inputRange: IR1, outputRange: Y1 } = sinPoints(FLOAT_AMPL);
  const { outputRange: S1 } = sinPoints(SCALE_AMPL, 0.25);
  const { outputRange: R1 } = sinPoints(TILT_AMPL, 0.5);

  const logoTranslateY = loopT.interpolate({ inputRange: IR1, outputRange: Y1 });
  const logoScale = loopT.interpolate({ inputRange: IR1, outputRange: S1.map((v) => 1 + v) });
  const logoRotate = loopT.interpolate({ inputRange: IR1, outputRange: R1.map((deg) => `${deg}deg`) });

  // анимация появления кнопок
  const btn1Anim = useRef(new Animated.Value(0)).current;
  const btn2Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(150, [
      Animated.timing(btn1Anim, {
        toValue: 1,
        duration: 520,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(btn2Anim, {
        toValue: 1,
        duration: 520,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [btn1Anim, btn2Anim]);

  return (
    <ImageBackground source={bg} style={styles.bg} resizeMode="cover">
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

        {/* ЛОГО */}
        <View style={styles.logoWrap}>
          <Animated.Image
            source={logo}
            resizeMode="contain"
            style={[
              styles.logo,
              {
                opacity: logoOpacity,
                transform: [
                  { translateY: logoTranslateY },
                  { scale: logoScale },
                  { rotate: logoRotate },
                ],
              },
            ]}
          />
        </View>

        {/* КНОПКИ */}
        <View style={styles.centerBlock}>
          <AnimatedMenuButton
            label="Quiz"
            image={btnQuiz}
            onPress={goQuiz}
            appearAnim={btn1Anim}
            testID="btn-quiz"
          />
          <AnimatedMenuButton
            label="Play"
            image={btnOther}
            onPress={goEngineer}
            appearAnim={btn2Anim}
            testID="btn-play"
          />
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

/**
 * Кнопка меню — новые анимации:
 * • Idle «дыхание» (легкая пульсация масштаба);
 * • Появление: fade + подлёт;
 * • При нажатии: подпрыгивание + лёгкий наклон;
 * • Блик: анимированная светлая полоска, пробегающая по кнопке.
 */
function AnimatedMenuButton({ image, label, onPress, appearAnim, testID }) {
  const pressScale = useRef(new Animated.Value(1)).current;
  const pressTilt = useRef(new Animated.Value(0)).current;

  // бесконечное «дыхание»
  const idleBreath = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(idleBreath, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(idleBreath, {
          toValue: 0,
          duration: 1400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [idleBreath]);

  const idleScale = idleBreath.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.015], // еле заметно
  });

  // блик (тонкая диагональная полоса, «скользит» слева направо)
  const shineT = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shineT, {
          toValue: 1,
          duration: 1600,
          delay: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(shineT, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [shineT]);

  const shineTranslate = shineT.interpolate({
    inputRange: [0, 1],
    outputRange: [-160, 160],
  });

  const onPressIn = () => {
    Animated.parallel([
      Animated.spring(pressScale, {
        toValue: 0.95,
        friction: 6,
        tension: 180,
        useNativeDriver: true,
      }),
      Animated.timing(pressTilt, {
        toValue: -1,
        duration: 90,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const onPressOut = () => {
    Animated.parallel([
      Animated.spring(pressScale, {
        toValue: 1.02,
        friction: 5,
        tension: 160,
        useNativeDriver: true,
      }),
      Animated.timing(pressTilt, {
        toValue: 0,
        duration: 140,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // небольшой отскок обратно к «дыханию»
      Animated.spring(pressScale, {
        toValue: 1,
        friction: 5,
        tension: 120,
        useNativeDriver: true,
      }).start();
    });
  };

  const appearTranslate = appearAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 0],
  });

  const rotate = pressTilt.interpolate({
    inputRange: [-1, 1],
    outputRange: ["-1.4deg", "1.4deg"],
  });

  const combinedScale = Animated.multiply(pressScale, idleScale);

  return (
    <Animated.View
      style={[
        styles.btnTouch,
        {
          opacity: appearAnim,
          transform: [{ translateY: appearTranslate }, { scale: combinedScale }, { rotate }],
        },
      ]}
    >
      <Pressable
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={onPress}
        android_ripple={{ color: "rgba(255,255,255,0.08)", borderless: false }}
        testID={testID}
        style={styles.btnPressable}
      >
        <ImageBackground
          source={image}
          style={styles.btn}
          imageStyle={styles.btnImg}
          resizeMode="cover"
        >
          {/* Текст на кнопке */}
          <Text style={styles.btnLabel} accessibilityRole="button" accessible>
            {label}
          </Text>

          {/* Блик */}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.shine,
              {
                transform: [
                  { translateX: shineTranslate },
                  { rotate: "20deg" },
                ],
              },
            ]}
          />
        </ImageBackground>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: "#047C02" },
  safe: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? 24 : 0,
    alignItems: "center",
  },

  // ЛОГО
  logoWrap: { alignItems: "center" },
  logo: { width: "50%", aspectRatio: 1 },

  // Центр/кнопки
  centerBlock: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "flex-start",
    marginTop: 10,
    gap: 26,
  },

  // контейнер под кнопку
  btnTouch: {
    width: "72%",
    maxWidth: 420,
  },

  // интерактивная область
  btnPressable: {
    width: "100%",
    height: 80,
    borderRadius: 14,
    overflow: "hidden",
  },

  // фон кнопки
  btn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  btnImg: { borderRadius: 14 },

  // подпись
  btnLabel: {
    color: "#f6e4bd",
    fontWeight: "900",
    letterSpacing: 1,
    fontSize: 22,
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  // блик
  shine: {
    position: "absolute",
    top: -20,
    bottom: -20,
    width: 60,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignSelf: "flex-start",
    borderRadius: 30,
  },
});
