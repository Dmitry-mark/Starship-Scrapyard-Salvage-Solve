// screens/Quiz.js
import React, { useMemo, useRef, useState, useEffect } from "react";
import {
  Image,
  ImageBackground,
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  Animated,
  Easing,
  Platform,
} from "react-native";

// Графика
const BG       = require("../assets/fon1.png");
const BACK_IMG = require("../assets/back.png");
const LOGO     = require("../assets/logo.png");
const FRAME    = require("../assets/frame.png");
const BTN1     = require("../assets/btn1.png");
const BTN2     = require("../assets/btn2.png");

// ===== База вопросов =====
const QUESTIONS = [
  { q: "WHAT IS A GRAVI-STATOR?", options: ["ENGINE", "PROTECTION", "STABILIZER"], correct: 2 },
  { q: "WHICH MODULE CALCULATES HYPERLANE JUMPS?", options: ["NAVIGATOR CORE", "SHIELD EMITTER", "CARGO LIFTER"], correct: 0 },
  { q: "ION DRIVE IS A TYPE OF…", options: ["SUB-LIGHT ENGINE", "CREW QUARTERS", "REFUELING PORT"], correct: 0 },
  { q: "WHAT POWERS A DEFLECTOR SHIELD?", options: ["REACTOR OUTPUT", "COOLANT LOOP", "GALLEY OVEN"], correct: 0 },
  { q: "SCOUT VESSEL IS USUALLY…", options: ["LIGHT & FAST", "HEAVY HAULER", "MINING RIG"], correct: 0 },
  { q: "FREIGHTER (CARGO SHIP) MAIN ROLE?", options: ["HAUL RESOURCES", "DOGFIGHT", "ASTRO CARTOGRAPHY"], correct: 0 },
  { q: "WHAT DOES A GYRO RING DO?", options: ["STABILIZES ATTITUDE", "BOOSTS WEAPONS", "GROWS FOOD"], correct: 0 },
  { q: "INTERCEPTOR IS A TYPE OF…", options: ["FIGHTER", "TUG", "TANKER"], correct: 0 },
  { q: "WHAT FEEDS THRUSTERS?", options: ["PROPELLANT", "COOLANT", "LUBRICANT"], correct: 0 },
  { q: "WHICH UNIT PROJECTS A SHIELD?", options: ["EMITTER ARRAY", "HYDROPONICS", "GALLEY"], correct: 0 },
];

// синус-кейфреймы
function sinPoints(amplitude = 1, offset = 0) {
  const ts = [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1];
  const ys = ts.map((t) => Math.sin(2 * Math.PI * (t + offset)) * amplitude);
  return { inputRange: ts, outputRange: ys };
}

// пружина для нажатий (ХУК — вызывать только внутри компонент, не в map!)
function usePressAnim() {
  const scale = useRef(new Animated.Value(1)).current;
  const onPressIn = () =>
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.95, tension: 220, friction: 8, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1.02, tension: 220, friction: 8, useNativeDriver: true }),
    ]).start();
  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, tension: 160, friction: 7, useNativeDriver: true }).start();
  return { scale, onPressIn, onPressOut };
}

// Отдельный компонент кнопки варианта — здесь допустимо использовать хук
function OptionButton({ selected, label, onPress }) {
  const { scale, onPressIn, onPressOut } = usePressAnim();
  const src = selected ? BTN2 : BTN1;

  return (
    <Animated.View style={{ width: "86%", transform: [{ scale }] }}>
      <Pressable onPressIn={onPressIn} onPressOut={onPressOut} onPress={onPress} style={styles.optionTouch}>
        <ImageBackground source={src} style={styles.option} imageStyle={styles.btnImg} resizeMode="stretch">
          <Text style={styles.optionText} numberOfLines={2} adjustsFontSizeToFit>
            {label}
          </Text>
        </ImageBackground>
      </Pressable>
    </Animated.View>
  );
}

export default function Quiz({ navigation }) {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const autoTimerRef = useRef(null);

  const question = useMemo(() => QUESTIONS[idx], [idx]);

  // анимация лого (как на стартовом)
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

  const { inputRange: IR1, outputRange: Y1 } = sinPoints(8);
  const { outputRange: S1 } = sinPoints(0.04, 0.25);
  const { outputRange: R1 } = sinPoints(1.2, 0.5);
  const logoTranslateY = loopT.interpolate({ inputRange: IR1, outputRange: Y1 });
  const logoScale = loopT.interpolate({ inputRange: IR1, outputRange: S1.map((v) => 1 + v) });
  const logoRotate = loopT.interpolate({ inputRange: IR1, outputRange: R1.map((deg) => `${deg}deg`) });

  // появление вопроса
  const fadeQuestion = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    fadeQuestion.setValue(0);
    Animated.timing(fadeQuestion, {
      toValue: 1,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [idx, fadeQuestion]);

  // выбор и авто-переход
  const onPick = (i) => {
    setPicked(i);
    if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
    autoTimerRef.current = setTimeout(() => {
      if (i === question.correct) setScore((s) => s + 1);
      if (idx >= QUESTIONS.length - 1) setFinished(true);
      else {
        setIdx((n) => n + 1);
        setPicked(null);
      }
    }, 900);
  };

  const onRestart = () => {
    if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
    setIdx(0);
    setPicked(null);
    setScore(0);
    setFinished(false);
  };

  // стрелка назад (в левом верхнем углу поверх — как на скрине)
  const backScale = useRef(new Animated.Value(1)).current;
  const onBackIn = () => Animated.spring(backScale, { toValue: 0.93, useNativeDriver: true }).start();
  const onBackOut = () => Animated.spring(backScale, { toValue: 1, useNativeDriver: true }).start();

  return (
    <ImageBackground source={BG} style={styles.bg} resizeMode="cover">
      <SafeAreaView style={styles.safe}>
        <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

        {/* Кнопка Back — абсолютная сверху слева */}
        <Animated.View style={[styles.backWrap, { transform: [{ scale: backScale }] }]}>
          <Pressable
            onPressIn={onBackIn}
            onPressOut={onBackOut}
            onPress={() => navigation.goBack?.()}
            hitSlop={8}
            style={styles.backBtn}
            accessibilityLabel="Back"
          >
            <Image source={BACK_IMG} style={styles.backImg} resizeMode="contain" />
          </Pressable>
        </Animated.View>

        {/* Большое лого по центру */}
        <View style={styles.logoWrap}>
          <Animated.Image
            source={LOGO}
            resizeMode="contain"
            style={[
              styles.logo,
              { opacity: logoOpacity, transform: [{ translateY: logoTranslateY }, { scale: logoScale }, { rotate: logoRotate }] },
            ]}
          />
        </View>

        {/* Рамка вопроса */}
        {!finished && (
          <Animated.View
            style={[
              styles.frameWrap,
              { opacity: fadeQuestion, transform: [{ translateY: fadeQuestion.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] },
            ]}
          >
            <ImageBackground source={FRAME} style={styles.frame} imageStyle={styles.frameImg} resizeMode="stretch">
              <Text style={styles.questionText} numberOfLines={3} adjustsFontSizeToFit>
                {question.q}
              </Text>
            </ImageBackground>
          </Animated.View>
        )}

        {/* Три кнопки */}
        {!finished ? (
          <View style={styles.options}>
            {question.options.map((label, i) => (
              <OptionButton
                key={i}
                label={label}
                selected={picked === i}
                onPress={() => onPick(i)}
              />
            ))}
          </View>
        ) : (
          <View style={styles.resultWrap}>
            <Text style={styles.resultTitle}>RESULT</Text>
            <Text style={styles.resultScore}>
              {score} / {QUESTIONS.length}
            </Text>
            <Pressable onPress={onRestart} style={{ width: "86%" }}>
              <ImageBackground source={BTN1} style={styles.restartBtn} imageStyle={styles.btnImg} resizeMode="stretch">
                <Text style={styles.restartText}>RESTART</Text>
              </ImageBackground>
            </Pressable>
          </View>
        )}
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: "#047C02" },
  safe: { flex: 1, paddingTop: Platform.OS === "android" ? 24 : 0 },

  // Back — абсолютное позиционирование, как на макете
  backWrap: {
    position: "absolute",
    top: Platform.OS === "android" ? 24 : 8,
    left: 8,
    zIndex: 5,
  },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  backImg: { width: 40, height: 40 },

  // ЛОГО — большое по центру
  logoWrap: { alignItems: "center", marginTop: -30 },
  logo: { width: "86%", aspectRatio: 3 },

  // Вопрос
  frameWrap: { paddingHorizontal: "7%", marginTop: -60 },
  frame: { width: "100%", aspectRatio: 1.9, alignItems: "center", justifyContent: "center" },
  frameImg: { borderRadius: 16 },
  questionText: { color: "#ffffff", textAlign: "center", fontWeight: "900", fontSize: 18, letterSpacing: 0.5 },

  // Кнопки
  options: { width: "100%", alignItems: "center", gap: 30, paddingVertical: 6, marginTop: 15 },
  optionTouch: { width: "100%" },
  option: { width: "100%", aspectRatio: 5.8, alignItems: "center", justifyContent: "center" },
  optionText: { color: "#ffffff", fontWeight: "900", fontSize: 16, letterSpacing: 0.6, textAlign: "center" },
  btnImg: { borderRadius: 20 },

  // Результат
  resultWrap: { flex: 1, paddingHorizontal: "8%", alignItems: "center", justifyContent: "center", gap: 16 },
  resultTitle: { color: "#ffffff", fontSize: 18, fontWeight: "800", opacity: 0.9 },
  resultScore: { color: "#fff", fontSize: 28, fontWeight: "900", marginBottom: 10 },
  restartBtn: { width: "100%", aspectRatio: 5.2, alignItems: "center", justifyContent: "center" },
  restartText: { color: "#ffffff", fontWeight: "900", fontSize: 16, letterSpacing: 0.8 },
});
