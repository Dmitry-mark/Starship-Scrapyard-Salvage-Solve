// screens/ClickerGame.js
import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Image,
  ImageBackground,
  Pressable,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
  Dimensions,
  Animated,
  Easing,
  Text,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width: W, height: H } = Dimensions.get("window");

// Фоны
const BG_SPACE = require("../assets/fon2.png");
const BG_GROUND = require("../assets/dfon.png");

// UI
const BACK = require("../assets/back.png");
const TOP_PANEL = require("../assets/Group 1.png");
const ICON_SEARCH = require("../assets/search.png");
const COIN = require("../assets/coin.png");
const COIN_FRAME = require("../assets/coinframe.png");
const BUY_IMG = require("../assets/buy.png");

// Ракеты
const ROCKET_1 = require("../assets/rocket1.png");
const ROCKET_2 = require("../assets/rocket2.png");

// Обломки
const DETAIL_SOURCES = [
  require("../assets/detail1.png"),
  require("../assets/detail2.png"),
  require("../assets/detail3.png"),
  require("../assets/detail4.png"),
  require("../assets/detail5.png"),
  require("../assets/detail6.png"),
  require("../assets/detail7.png"),
  require("../assets/detail8.png"),
];

// ---------- параметры сцены ----------
const GROUND_H = H * 0.22;
const TOP_RESERVED = (Platform.OS === "android" ? 28 : 10) + 118 + 8 + 36 + 18;
const X_MARGIN = 10;
const DEBRIS_SIZE = 72;
const NUM_DEBRIS = 10;

const AIR_DRIFT_X = 10;
const AIR_DRIFT_Y = 8;

const ROCKET_BAND_W = 160;

const PRICE = 10;
const REWARD = 10;

const COINS_KEY = "@coins_v1";

const randi = (n) => Math.floor(Math.random() * n);
const rnd = (a, b) => a + Math.random() * (b - a);
const d2 = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;

function randomSpotSmart(existing) {
  const preferGround = Math.random() < 0.7;

  const xMinAir = X_MARGIN + AIR_DRIFT_X;
  const xMaxAir = W - DEBRIS_SIZE - X_MARGIN - AIR_DRIFT_X;

  const xMinGround = X_MARGIN;
  const xMaxGround = W - DEBRIS_SIZE - X_MARGIN;

  const yMinAir = Math.max(TOP_RESERVED, 0) + AIR_DRIFT_Y;
  const yMaxAir = H - GROUND_H - DEBRIS_SIZE - 40 - AIR_DRIFT_Y;

  const bottomPad = rnd(6, 14);
  const yGround = H - DEBRIS_SIZE - bottomPad;

  const minDistGround = 55;
  const minDistAir = 80;

  const rocketLeft = W * 0.5 - ROCKET_BAND_W * 0.5;
  const rocketRight = W * 0.5 + ROCKET_BAND_W * 0.5;

  const tries = 30;
  for (let k = 0; k < tries; k++) {
    let x, y, air;
    if (preferGround) {
      do {
        x = rnd(xMinGround, xMaxGround);
      } while (x > rocketLeft - 30 && x < rocketRight + 30);
      y = yGround;
      air = false;
    } else {
      x = rnd(xMinAir, xMaxAir);
      y = rnd(yMinAir, yMaxAir);
      air = true;
    }

    const candidate = { x, y, air };
    const minD2 = (air ? minDistAir : minDistGround) ** 2;
    if (existing.every((p) => d2(candidate, p) > minD2)) {
      return {
        ...candidate,
        assetIndex: randi(DETAIL_SOURCES.length),
        token: Math.random(),
      };
    }
  }

  const x = preferGround ? rnd(xMinGround, xMaxGround) : rnd(xMinAir, xMaxAir);
  const y = preferGround ? yGround : rnd(yMinAir, yMaxAir);
  return {
    x,
    y,
    air: !preferGround ? true : false,
    assetIndex: randi(DETAIL_SOURCES.length),
    token: Math.random(),
  };
}

function useDrift(baseX, baseY, token) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    t.setValue(0);
    Animated.loop(
      Animated.timing(t, {
        toValue: 1,
        duration: rnd(3500, 5200),
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      })
    ).start();
  }, [t, token]);

  const x = t.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [baseX - AIR_DRIFT_X, baseX + AIR_DRIFT_X, baseX - AIR_DRIFT_X],
  });
  const y = t.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [baseY - AIR_DRIFT_Y, baseY + AIR_DRIFT_Y, baseY - AIR_DRIFT_Y],
  });
  const rot = t.interpolate({ inputRange: [0, 1], outputRange: ["-6deg", "6deg"] });
  return { x, y, rot };
}

function Debris({ spot, onCollect, showRing }) {
  const src = DETAIL_SOURCES[spot.assetIndex];

  const appear = useRef(new Animated.Value(0)).current;
  const pressScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    appear.setValue(0);
    Animated.sequence([
      Animated.timing(appear, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(pressScale, { toValue: 1, speed: 12, bounciness: 8, useNativeDriver: true }),
    ]).start();
  }, [spot.token]);

  const appearScale = appear.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] });
  const appearOpacity = appear;

  const drift = spot.air ? useDrift(spot.x, spot.y, spot.token) : null;

  const handlePress = (e) => {
    const { pageX, pageY } = e.nativeEvent || {};
    Animated.sequence([
      Animated.timing(pressScale, { toValue: 0.9, duration: 70, useNativeDriver: true }),
      Animated.timing(pressScale, { toValue: 1, duration: 90, useNativeDriver: true }),
    ]).start();
    onCollect(pageX, pageY);
  };

  const handleRingPress = (e) => {
    const { pageX, pageY } = e.nativeEvent || {};
    onCollect(pageX, pageY);
  };

  const transform = spot.air
    ? [{ translateX: drift.x }, { translateY: drift.y }, { rotate: drift.rot }, { scale: Animated.multiply(appearScale, pressScale) }]
    : [{ translateX: spot.x }, { translateY: spot.y }, { scale: Animated.multiply(appearScale, pressScale) }];

  const RING_SIZE = DEBRIS_SIZE + 22;

  return (
    <Animated.View pointerEvents="box-none" style={[styles.debrisWrap, { opacity: appearOpacity, transform }]}>
      {showRing && (
        <Pressable
          onPress={handleRingPress}
          style={[
            styles.ring,
            {
              width: RING_SIZE,
              height: RING_SIZE,
              borderRadius: RING_SIZE / 2,
              left: (DEBRIS_SIZE - RING_SIZE) / 2,
              top: (DEBRIS_SIZE - RING_SIZE) / 2,
            },
          ]}
          hitSlop={10}
        />
      )}

      <Pressable onPress={handlePress} hitSlop={12} style={styles.debrisPress}>
        <Image source={src} style={styles.debrisImg} resizeMode="contain" />
      </Pressable>
    </Animated.View>
  );
}

export default function ClickerGame({ navigation }) {
  const [parts, setParts] = useState(0);
  const [coins, setCoins] = useState(555);
  const coinsRef = useRef(coins);
  useEffect(() => {
    coinsRef.current = coins;
  }, [coins]);

  useEffect(() => {
    (async () => {
      try {
        const v = await AsyncStorage.getItem(COINS_KEY);
        if (v != null) setCoins(parseInt(v, 10));
      } catch {}
    })();
  }, []);
  useEffect(() => {
    AsyncStorage.setItem(COINS_KEY, String(coins)).catch(() => {});
  }, [coins]);

  const [ringIndex, setRingIndex] = useState(null);

  const [debris, setDebris] = useState(() => {
    const full = [];
    for (let i = 0; i < NUM_DEBRIS; i++)
      full.push(randomSpotSmart(full.map((p) => ({ x: p.x, y: p.y }))));
    return full;
  });

  // === поп-ап награды: статичные left/top, анимируем только opacity/translateY ===
  const [rewardPos, setRewardPos] = useState({ x: 0, y: 0 }); // <-- обычные числа
  const rewardOpacity = useRef(new Animated.Value(0)).current;
  const rewardDY = useRef(new Animated.Value(0)).current;

  const popReward = (px = W / 2, py = H / 2) => {
    const x = Math.min(Math.max(px - 20, 8), W - 80);
    const y = Math.min(Math.max(py - 40, 60), H - 120);

    setRewardPos({ x, y });           // <-- выставляем как числа
    rewardOpacity.setValue(0);
    rewardDY.setValue(0);

    Animated.parallel([
      Animated.timing(rewardOpacity, { toValue: 1, duration: 90, useNativeDriver: true }),
      Animated.timing(rewardDY, { toValue: -28, duration: 380, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start(() => {
      Animated.timing(rewardOpacity, { toValue: 0, duration: 180, useNativeDriver: true }).start();
    });
  };

  const collect = (index, px, py) => {
    setDebris((arr) => {
      const others = arr.filter((_, i) => i !== index).map((s) => ({ x: s.x, y: s.y }));
      const nextSpot = randomSpotSmart(others);
      const next = arr.slice();
      next[index] = nextSpot;
      return next;
    });
    setRingIndex((ri) => (ri === index ? null : ri));
    setParts((p) => p + 1);
    setCoins((c) => c + REWARD);
    popReward(px, py);
  };

  const rocketSource = parts >= 10 ? ROCKET_2 : ROCKET_1;

  const doBuy = () => {
    if (coinsRef.current < PRICE) return;
    setCoins((c) => c - PRICE);
    setRingIndex(randi(debris.length));
  };

  return (
    <ImageBackground source={BG_SPACE} style={styles.bg} resizeMode="cover">
      <SafeAreaView style={styles.safe}>
        <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

        {/* BACK */}
        <View style={styles.backWrap}>
          <Pressable onPress={() => navigation.goBack?.()} hitSlop={8} style={styles.backBtn}>
            <Image source={BACK} style={styles.backImg} resizeMode="contain" />
          </Pressable>
        </View>

        {/* ВЕРХНИЙ ЦЕНТР: панель + BUY */}
        <View style={styles.topCenter}>
          <ImageBackground source={TOP_PANEL} style={styles.centerPanel} imageStyle={styles.panelImg} resizeMode="stretch">
            <View style={styles.centerPanelInside}>
              <Image source={ICON_SEARCH} style={styles.searchIcon} resizeMode="contain" />
              <View style={styles.priceRow}>
                <Image source={COIN} style={styles.coinIconSmall} />
                <Text style={styles.priceText}>{PRICE}</Text>
              </View>
            </View>
          </ImageBackground>

          <Pressable onPress={doBuy} style={styles.buyTouch}>
            <Image source={BUY_IMG} style={{ width: 108, height: 36 }} resizeMode="contain" />
          </Pressable>
        </View>

        {/* Монеты справа — рамка coinframe + иконка монеты */}
        <ImageBackground source={COIN_FRAME} style={styles.coinPanel} resizeMode="contain">
          <View style={styles.coinInside}>
            <Image source={COIN} style={styles.coinIcon} />
            <Text style={styles.coinValue}>{coins}</Text>
          </View>
        </ImageBackground>

        {/* ОБЛОМКИ */}
        {debris.map((spot, i) => (
          <Debris
            key={spot.token}
            spot={spot}
            showRing={ringIndex === i}
            onCollect={(px, py) => collect(i, px, py)}
          />
        ))}

        {/* Поп-ап +10 монет — left/top обычные числа, анимируем только translateY/opacity */}
        <Animated.View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: rewardPos.x,  // <-- число
            top: rewardPos.y,   // <-- число
            opacity: rewardOpacity,
            transform: [{ translateY: rewardDY }],
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            zIndex: 50,
          }}
        >
          <Image source={COIN} style={{ width: 18, height: 18 }} />
          <Text style={{ color: "#FFED88", fontWeight: "900", fontSize: 16, textShadowColor: "#000", textShadowRadius: 6 }}>
            +{REWARD}
          </Text>
        </Animated.View>

        {/* Низ: земля и ракета */}
        <View style={styles.bottomWrap} pointerEvents="box-none">
          <Image source={BG_GROUND} style={styles.ground} resizeMode="stretch" />
          <View style={styles.rocketWrap}>
            <Image source={rocketSource} style={styles.rocket} resizeMode="contain" />
          </View>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: "#000" },
  safe: { flex: 1, paddingTop: Platform.OS === "android" ? 24 : 0 },

  backWrap: { position: "absolute", top: Platform.OS === "android" ? 28 : 10, left: 8, zIndex: 30 },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  backImg: { width: 36, height: 36 },

  topCenter: {
    position: "absolute",
    top: Platform.OS === "android" ? 28 : 8,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 25,
  },
  centerPanel: { width: 86, height: 118, justifyContent: "center" },
  panelImg: { borderRadius: 14 },
  centerPanelInside: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8, paddingTop: 6 },
  searchIcon: { width: 40, height: 40, marginBottom: 20 },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  coinIconSmall: { width: 16, height: 16 },
  priceText: { color: "#E8FFD8", fontWeight: "900", fontSize: 14 },
  buyTouch: { marginTop: 8 },

  coinPanel: {
    position: "absolute",
    top: Platform.OS === "android" ? 28 : 8,
    right: 10,
    width: 130,
    height: 56,
    justifyContent: "center",
    zIndex: 24,
  },
  coinInside: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    justifyContent: "center",
  },
  coinIcon: { width: 22, height: 22 },
  coinValue: { color: "#E8FFD8", fontWeight: "900", fontSize: 16 },

  debrisWrap: { position: "absolute", zIndex: 3 },
  debrisPress: { width: DEBRIS_SIZE, height: DEBRIS_SIZE, alignItems: "center", justifyContent: "center" },
  debrisImg: { width: DEBRIS_SIZE, height: DEBRIS_SIZE },

  ring: {
    position: "absolute",
    borderWidth: 8,
    borderColor: "#30E600",
    backgroundColor: "rgba(48,230,0,0.08)",
    zIndex: 4,
  },

  bottomWrap: { position: "absolute", left: 0, right: 0, bottom: 0, alignItems: "center" },
  ground: { width: W, height: GROUND_H },
  rocketWrap: { position: "absolute", bottom: 10, alignItems: "center" },
  rocket: { width: 120, height: 180 },
});
