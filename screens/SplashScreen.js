import { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, Dimensions, TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ORANGE, ORANGE_LIGHT, ORANGE_DARK, WHITE } from '../constants/theme';

const { width, height } = Dimensions.get('window');

export default function SplashScreen({ onFinish }) {
  const pinAnim    = useRef(new Animated.Value(-80)).current;
  const pinScale   = useRef(new Animated.Value(0.5)).current;
  const textAnim   = useRef(new Animated.Value(20)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const ripple1    = useRef(new Animated.Value(1)).current;
  const ripple2    = useRef(new Animated.Value(1)).current;
  const rippleOp1  = useRef(new Animated.Value(0.5)).current;
  const rippleOp2  = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    // Ripple loops
    const rippleLoop = () => {
      Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.delay(0),
            Animated.parallel([
              Animated.timing(ripple1, { toValue: 3, duration: 2000, useNativeDriver: true }),
              Animated.timing(rippleOp1, { toValue: 0, duration: 2000, useNativeDriver: true }),
            ]),
          ]),
        ])
      ).start();
      Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.delay(500),
            Animated.parallel([
              Animated.timing(ripple2, { toValue: 3, duration: 2000, useNativeDriver: true }),
              Animated.timing(rippleOp2, { toValue: 0, duration: 2000, useNativeDriver: true }),
            ]),
          ]),
        ])
      ).start();
    };
    rippleLoop();

    // Pin drop
    Animated.sequence([
      Animated.delay(300),
      Animated.spring(pinAnim, {
        toValue: 0,
        tension: 60,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.sequence([
      Animated.delay(300),
      Animated.spring(pinScale, {
        toValue: 1,
        tension: 60,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();

    // Text fade up
    Animated.sequence([
      Animated.delay(900),
      Animated.parallel([
        Animated.timing(textAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.timing(textOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  return (
    <LinearGradient
      colors={[ORANGE_LIGHT, ORANGE, ORANGE_DARK]}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={styles.container}
    >
      {/* Decorative circles */}
      <View style={styles.circleBottomLeft} />
      <View style={styles.circleTopRight} />

      {/* Pin + ripples */}
      <View style={styles.pinContainer}>
        <Animated.View style={[styles.ripple, { transform: [{ scale: ripple1 }], opacity: rippleOp1 }]} />
        <Animated.View style={[styles.ripple, { transform: [{ scale: ripple2 }], opacity: rippleOp2 }]} />
        <Animated.View style={[
          styles.pin,
          { transform: [{ translateY: pinAnim }, { scale: pinScale }, { rotate: '-45deg' }] }
        ]}>
          <Text style={{ fontSize: 32, transform: [{ rotate: '45deg' }] }}>🏢</Text>
        </Animated.View>
      </View>

      {/* Title */}
      <Animated.View style={[styles.textContainer, { transform: [{ translateY: textAnim }], opacity: textOpacity }]}>
        <Text style={styles.title}>SoonSpot</Text>
        <Text style={styles.subtitle}>See What's Coming Soon!</Text>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleBottomLeft: {
    position: 'absolute',
    bottom: -80,
    left: -60,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  circleTopRight: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  pinContainer: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  ripple: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  pin: {
    width: 72,
    height: 72,
    borderRadius: 36,
    // Pin shape: round top, pointed bottom-left
    borderBottomLeftRadius: 0,
    backgroundColor: WHITE,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
  textContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  title: {
    fontSize: 46,
    fontWeight: '900',
    color: WHITE,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.88)',
    marginTop: 8,
    fontStyle: 'italic',
  },
});