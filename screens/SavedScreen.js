import { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SPOTS } from '../constants/data';
import { useNavigation } from '@react-navigation/native';
import {
  ORANGE, WHITE, OFF_WHITE, LIGHT_GRAY, MID_GRAY, DARK_GRAY, TEXT,
  STATUS_CONFIG,
} from '../constants/theme';

export default function SavedScreen() {
  const navigation = useNavigation();
  const [saved, setSaved] = useState(['1', '5']);
  const savedSpots = SPOTS.filter(s => saved.includes(s.id));

  const unsave = (id) => setSaved(prev => prev.filter(x => x !== id));

  if (savedSpots.length === 0) {
    return (
      <SafeAreaView style={[styles.container, styles.empty]}>
        <Text style={{ fontSize: 56, marginBottom: 16 }}>🤍</Text>
        <Text style={styles.emptyHeading}>No saved spots yet</Text>
        <Text style={styles.emptySub}>Tap the heart on any spot to save it for later</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <FlatList
        data={savedSpots}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.heading}>Saved Spots</Text>
            <Text style={styles.sub}>{savedSpots.length} saved spot{savedSpots.length !== 1 ? 's' : ''}</Text>
          </View>
        }
        renderItem={({ item }) => {
          const cfg = STATUS_CONFIG[item.status];
          return (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.9}
              onPress={() => navigation.navigate('SpotDetail', { spot: item })}
            >
              <View style={[styles.cardAccent, { backgroundColor: item.color }]} />
              <View style={styles.cardBody}>
                <View style={styles.cardRow}>
                  <View style={[styles.iconBox, { backgroundColor: item.color + '18', borderColor: item.color + '33' }]}>
                    <Text style={{ fontSize: 24 }}>{item.emoji}</Text>
                  </View>
                  <View style={styles.cardInfo}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={styles.cardTitle}>
                        {item.status === 'mystery' ? 'Mystery Project' : item.name}
                      </Text>
                      <TouchableOpacity onPress={() => unsave(item.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Text style={{ fontSize: 20 }}>❤️</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.cardAddress} numberOfLines={1}>📍 {item.address}</Text>
                    <View style={styles.cardMeta}>
                      <View style={[styles.badge, { backgroundColor: cfg.bg, borderColor: cfg.dot + '44' }]}>
                        <View style={[styles.badgeDot, { backgroundColor: cfg.dot }]} />
                        <Text style={[styles.badgeText, { color: cfg.text }]}>{cfg.label}</Text>
                      </View>
                      <Text style={styles.distance}>📏 {item.distance}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: OFF_WHITE },
  empty: { alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyHeading: { fontSize: 22, fontWeight: '900', color: TEXT, marginBottom: 8 },
  emptySub: { fontSize: 14, color: MID_GRAY, textAlign: 'center' },
  content: { padding: 16, paddingBottom: 32 },
  header: { marginBottom: 18 },
  heading: { fontSize: 26, fontWeight: '900', color: TEXT },
  sub: { fontSize: 13, color: MID_GRAY, marginTop: 4 },
  card: {
    backgroundColor: WHITE,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: LIGHT_GRAY,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardAccent: { height: 3 },
  cardBody: { padding: 14 },
  cardRow: { flexDirection: 'row', gap: 12 },
  iconBox: {
    width: 50, height: 50, borderRadius: 14, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: TEXT, flex: 1, marginRight: 8 },
  cardAddress: { fontSize: 12, color: MID_GRAY, marginTop: 2 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1,
  },
  badgeDot: { width: 5, height: 5, borderRadius: 3 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  distance: { fontSize: 12, color: MID_GRAY, marginLeft: 'auto' },
});