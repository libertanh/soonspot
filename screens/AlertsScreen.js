// AlertsScreen.js
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ALERTS } from '../constants/data';
import { ORANGE, WHITE, OFF_WHITE, LIGHT_GRAY, MID_GRAY, TEXT, DARK_GRAY } from '../constants/theme';

export default function AlertsScreen() {
  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <FlatList
        data={ALERTS}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.heading}>Nearby Alerts</Text>
            <Text style={styles.sub}>Stay up to date on what's coming near you</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.alertCard} activeOpacity={0.88}>
            <View style={styles.alertIcon}>
              <Text style={{ fontSize: 22 }}>{item.emoji}</Text>
            </View>
            <View style={styles.alertInfo}>
              <Text style={styles.alertTitle}>{item.text}</Text>
              <Text style={styles.alertSub}>📍 {item.sub}</Text>
            </View>
            <View style={styles.alertRight}>
              <Text style={styles.alertTime}>{item.time}</Text>
              <View style={styles.alertDot} />
            </View>
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: OFF_WHITE },
  content: { padding: 16, paddingBottom: 32 },
  header: { marginBottom: 20 },
  heading: { fontSize: 26, fontWeight: '900', color: TEXT },
  sub: { fontSize: 13, color: MID_GRAY, marginTop: 4 },
  alertCard: {
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: LIGHT_GRAY,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  alertIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: ORANGE + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertInfo: { flex: 1 },
  alertTitle: { fontSize: 14, fontWeight: '700', color: TEXT },
  alertSub: { fontSize: 12, color: MID_GRAY, marginTop: 2 },
  alertRight: { alignItems: 'flex-end', gap: 6 },
  alertTime: { fontSize: 11, color: MID_GRAY },
  alertDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: ORANGE },
});