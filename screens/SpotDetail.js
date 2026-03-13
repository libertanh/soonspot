import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Linking, Platform, Alert,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ORANGE, ORANGE_LIGHT, ORANGE_DARK, WHITE,
  OFF_WHITE, LIGHT_GRAY, MID_GRAY, DARK_GRAY, TEXT,
  STATUS_CONFIG,
} from '../constants/theme';

// ─── MAP HELPERS ─────────────────────────────────────────────────────────────

// Opens the native Maps app (Apple Maps on iOS, Google Maps on Android)
// with directions TO the spot's address
function openNativeDirections(spot) {
  const { latitude, longitude, address, name } = spot;
  const label = encodeURIComponent(name || address);

  const url = Platform.select({
    ios:     `maps://app?daddr=${latitude},${longitude}&q=${label}`,
    android: `google.navigation:q=${latitude},${longitude}`,
  });

  Linking.canOpenURL(url)
    .then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        // Fallback: open Google Maps in browser
        openGoogleMapsWeb(spot);
      }
    })
    .catch(() => openGoogleMapsWeb(spot));
}

// Opens the spot in the Google Maps app (if installed),
// falling back to maps.google.com in the browser
function openGoogleMaps(spot) {
  const { latitude, longitude, name } = spot;
  const label = encodeURIComponent(name || 'SoonSpot Location');

  // Deep link into Google Maps app
  const googleMapsApp = `comgooglemaps://?q=${latitude},${longitude}&zoom=16`;

  Linking.canOpenURL(googleMapsApp)
    .then(supported => {
      if (supported) {
        Linking.openURL(googleMapsApp);
      } else {
        openGoogleMapsWeb(spot);
      }
    })
    .catch(() => openGoogleMapsWeb(spot));
}

// Always-works fallback: browser Google Maps URL
function openGoogleMapsWeb(spot) {
  const { latitude, longitude, address } = spot;
  const query = encodeURIComponent(address || `${latitude},${longitude}`);
  Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
}

// Share a Google Maps link to this location (for the share button)
function getGoogleMapsShareLink(spot) {
  const { latitude, longitude } = spot;
  return `https://www.google.com/maps?q=${latitude},${longitude}`;
}

// ─── MINI MAP ────────────────────────────────────────────────────────────────
function MiniMap({ spot }) {
  const region = {
    latitude:       spot.latitude,
    longitude:      spot.longitude,
    latitudeDelta:  0.004,
    longitudeDelta: 0.004,
  };

  return (
    <View style={styles.miniMapContainer}>
      <MapView
        style={styles.miniMap}
        provider={PROVIDER_GOOGLE}
        region={region}
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        showsUserLocation={false}
        showsPointsOfInterest={false}
        customMapStyle={miniMapStyle}
      >
        <Marker coordinate={{ latitude: spot.latitude, longitude: spot.longitude }}>
          <View style={styles.miniPin}>
            <Text style={{ fontSize: 18 }}>{spot.emoji}</Text>
          </View>
        </Marker>
      </MapView>

      {/* Map action buttons overlaid on the mini map */}
      <View style={styles.mapActions}>
        {/* Directions — opens native Maps app */}
        <TouchableOpacity
          style={[styles.mapActionBtn, styles.mapActionPrimary]}
          onPress={() => openNativeDirections(spot)}
        >
          <Text style={styles.mapActionIcon}>🧭</Text>
          <Text style={styles.mapActionTextPrimary}>Directions</Text>
        </TouchableOpacity>

        {/* Open in Google Maps app/web */}
        <TouchableOpacity
          style={[styles.mapActionBtn, styles.mapActionSecondary]}
          onPress={() => openGoogleMaps(spot)}
        >
          <Text style={styles.mapActionIcon}>🗺</Text>
          <Text style={styles.mapActionTextSecondary}>Google Maps</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── MAIN SCREEN ─────────────────────────────────────────────────────────────
export default function SpotDetail({ route, navigation }) {
  const { spot } = route.params;
  const [tab, setTab] = useState('info');
  const [saved, setSaved] = useState(false);
  const cfg = STATUS_CONFIG[spot.status];

  const handleShare = async () => {
    const mapsLink = getGoogleMapsShareLink(spot);
    const message = `Check out what's going in at ${spot.address}!\n\n${spot.name} — ${spot.openingDate}\n\nView on map: ${mapsLink}\n\nvia SoonSpot 📍`;

    try {
      const { Share } = await import('react-native');
      Share.share({ message, title: `SoonSpot: ${spot.name}` });
    } catch (e) {
      // Share not available in dev — just open the link
      Linking.openURL(mapsLink);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: OFF_WHITE }}>
      {/* ── Hero Header ── */}
      <LinearGradient
        colors={[ORANGE_LIGHT, ORANGE, ORANGE_DARK]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={styles.hero}
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.heroNav}>
            <TouchableOpacity style={styles.navBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.navBtnText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.heroTitle}>SoonSpot</Text>
            <TouchableOpacity style={styles.navBtn} onPress={() => setSaved(s => !s)}>
              <Text style={{ fontSize: 20 }}>{saved ? '❤️' : '🤍'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.heroBody}>
            <View style={styles.heroIcon}>
              <Text style={{ fontSize: 36 }}>{spot.emoji}</Text>
            </View>
            <View style={styles.heroInfo}>
              <View style={[styles.heroBadge, { backgroundColor: cfg.bg }]}>
                <Text style={[styles.heroBadgeText, { color: cfg.text }]}>
                  {cfg.label}{spot.verified ? ' · ✓ Verified' : ''}
                </Text>
              </View>
              <Text style={styles.heroName}>
                {spot.status === 'mystery' ? 'Mystery Project' : spot.name}
              </Text>
              <Text style={styles.heroAddress}>
                📍 {spot.address} · 📏 {spot.distance}
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* ── Stats Row ── */}
        <View style={styles.statsRow}>
          {[
            { label: 'Opening',    value: spot.openingDate, color: TEXT },
            { label: 'Hype',       value: `${spot.hype}/100 🔥`, color: ORANGE },
            { label: 'Confidence', value: `${spot.confidence}%`,
              color: spot.confidence > 80 ? '#1E7A45' : spot.confidence > 60 ? ORANGE : '#92620A' },
          ].map(s => (
            <View key={s.label} style={styles.statBox}>
              <Text style={styles.statLabel}>{s.label}</Text>
              <Text style={[styles.statValue, { color: s.color }]} numberOfLines={1}>{s.value}</Text>
            </View>
          ))}
        </View>

        {/* ── MINI MAP + DIRECTIONS ── */}
        <Text style={styles.sectionTitle}>📍 Location</Text>
        <MiniMap spot={spot} />

        {/* Address row with tap-to-open */}
        <TouchableOpacity
          style={styles.addressRow}
          onPress={() => openGoogleMapsWeb(spot)}
          activeOpacity={0.7}
        >
          <View style={styles.addressIcon}>
            <Text style={{ fontSize: 18 }}>📌</Text>
          </View>
          <View style={styles.addressInfo}>
            <Text style={styles.addressText}>{spot.address}</Text>
            <Text style={styles.addressNeighborhood}>{spot.neighborhood}</Text>
          </View>
          <Text style={styles.addressLink}>Open ›</Text>
        </TouchableOpacity>

        {/* ── Tabs ── */}
        <View style={styles.tabs}>
          {['info', 'updates', 'source'].map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.tab, tab === t && styles.tabActive]}
              onPress={() => setTab(t)}
            >
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Tab Content ── */}
        <View style={styles.tabContent}>
          {tab === 'info' && (
            <>
              <Text style={styles.description}>{spot.description}</Text>
              <View style={styles.tags}>
                {spot.tags.map(tag => (
                  <View key={tag} style={styles.tag}>
                    <Text style={styles.tagText}>#{tag}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {tab === 'updates' && (
            <View style={styles.updates}>
              {spot.updates.map((u, i) => (
                <View key={i} style={styles.updateRow}>
                  <View style={[styles.updateDot, { backgroundColor: i === 0 ? ORANGE : MID_GRAY }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.updateText}>{u.text}</Text>
                    <Text style={styles.updateDate}>{u.date}</Text>
                  </View>
                </View>
              ))}
              <TouchableOpacity style={styles.addTipRow}>
                <Text style={styles.addTipText}>+ Add a Tip or Update</Text>
              </TouchableOpacity>
            </View>
          )}

          {tab === 'source' && (
            <>
              <Text style={styles.sourceLabel}>Data Source</Text>
              <Text style={styles.sourceText}>{spot.source}</Text>
              <View style={[styles.verifyBox, { backgroundColor: spot.verified ? '#E8F5EE' : '#FFF8F0' }]}>
                <Text style={{ fontSize: 18 }}>{spot.verified ? '✅' : '⚠️'}</Text>
                <Text style={[styles.verifyText, { color: spot.verified ? '#1E7A45' : ORANGE_DARK }]}>
                  {spot.verified
                    ? 'Verified by the business owner'
                    : 'Based on public records & community tips — not yet verified.'}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* ── CTA Buttons ── */}
        <View style={styles.ctaRow}>
          <TouchableOpacity style={styles.ctaPrimary}>
            <Text style={styles.ctaPrimaryText}>🔔 Notify Me When Open</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.ctaShare} onPress={handleShare}>
            <Text style={styles.ctaShareText}>↗</Text>
          </TouchableOpacity>
        </View>

        {/* ── Google Maps deep link (text link style) ── */}
        <TouchableOpacity
          style={styles.googleMapsLink}
          onPress={() => openGoogleMapsWeb(spot)}
        >
          <Text style={styles.googleMapsLinkText}>View full location on Google Maps →</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

// ─── MINI MAP STYLE ──────────────────────────────────────────────────────────
const miniMapStyle = [
  { elementType: 'geometry',         stylers: [{ color: '#f5f0ea' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#5a4e44' }] },
  { featureType: 'road',             elementType: 'geometry', stylers: [{ color: '#e8e0d4' }] },
  { featureType: 'road.highway',     elementType: 'geometry', stylers: [{ color: '#d4c8b4' }] },
  { featureType: 'water',            elementType: 'geometry', stylers: [{ color: '#b8d4e8' }] },
  { featureType: 'park',             elementType: 'geometry', stylers: [{ color: '#c8ddb8' }] },
  { featureType: 'poi',              stylers: [{ visibility: 'off' }] },
  { featureType: 'transit',          stylers: [{ visibility: 'off' }] },
];

// ─── STYLES ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  hero:              { paddingBottom: 20, paddingHorizontal: 16 },
  heroNav:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingTop: 8 },
  navBtn:            { backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 10, width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  navBtnText:        { color: WHITE, fontSize: 18, fontWeight: '600' },
  heroTitle:         { color: WHITE, fontSize: 18, fontWeight: '900' },
  heroBody:          { flexDirection: 'row', gap: 14, alignItems: 'center' },
  heroIcon:          { width: 72, height: 72, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  heroInfo:          { flex: 1 },
  heroBadge:         { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, marginBottom: 6 },
  heroBadgeText:     { fontSize: 11, fontWeight: '700' },
  heroName:          { fontSize: 22, fontWeight: '900', color: WHITE, lineHeight: 26 },
  heroAddress:       { fontSize: 12, color: 'rgba(255,255,255,0.82)', marginTop: 3 },

  content:           { padding: 16, paddingBottom: 40 },

  // Stats
  statsRow:          { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statBox:           { flex: 1, backgroundColor: WHITE, borderRadius: 14, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: LIGHT_GRAY, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  statLabel:         { fontSize: 10, color: MID_GRAY, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: '600', marginBottom: 4 },
  statValue:         { fontSize: 13, fontWeight: '700', textAlign: 'center' },

  // Section title
  sectionTitle:      { fontSize: 12, fontWeight: '700', color: MID_GRAY, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },

  // Mini Map
  miniMapContainer:  { borderRadius: 16, overflow: 'hidden', height: 180, marginBottom: 10, borderWidth: 1, borderColor: LIGHT_GRAY, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 4 },
  miniMap:           { flex: 1 },
  mapActions:        { position: 'absolute', bottom: 10, left: 10, right: 10, flexDirection: 'row', gap: 8 },
  mapActionBtn:      { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 12, paddingVertical: 9, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 5 },
  mapActionPrimary:  { backgroundColor: ORANGE },
  mapActionSecondary: { backgroundColor: WHITE, borderWidth: 1, borderColor: LIGHT_GRAY },
  mapActionIcon:     { fontSize: 16 },
  mapActionTextPrimary:   { fontSize: 13, fontWeight: '700', color: WHITE },
  mapActionTextSecondary: { fontSize: 13, fontWeight: '700', color: DARK_GRAY },
  miniPin:           { backgroundColor: WHITE, borderRadius: 20, padding: 6, borderWidth: 2, borderColor: ORANGE, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 5 },

  // Address row
  addressRow:        { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: WHITE, borderRadius: 14, padding: 12, marginBottom: 20, borderWidth: 1, borderColor: LIGHT_GRAY },
  addressIcon:       { width: 36, height: 36, borderRadius: 10, backgroundColor: ORANGE + '15', alignItems: 'center', justifyContent: 'center' },
  addressInfo:       { flex: 1 },
  addressText:       { fontSize: 14, fontWeight: '600', color: TEXT },
  addressNeighborhood: { fontSize: 12, color: MID_GRAY, marginTop: 1 },
  addressLink:       { fontSize: 13, fontWeight: '700', color: ORANGE },

  // Tabs
  tabs:              { flexDirection: 'row', backgroundColor: LIGHT_GRAY, borderRadius: 12, padding: 4, marginBottom: 14 },
  tab:               { flex: 1, paddingVertical: 8, borderRadius: 9, alignItems: 'center' },
  tabActive:         { backgroundColor: WHITE, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  tabText:           { fontSize: 12, fontWeight: '600', color: MID_GRAY, textTransform: 'capitalize' },
  tabTextActive:     { color: ORANGE },

  // Tab content
  tabContent:        { backgroundColor: WHITE, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: LIGHT_GRAY, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  description:       { fontSize: 14, color: DARK_GRAY, lineHeight: 22, marginBottom: 14 },
  tags:              { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag:               { backgroundColor: ORANGE + '12', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: ORANGE + '25' },
  tagText:           { fontSize: 12, fontWeight: '600', color: ORANGE_DARK },
  updates:           { gap: 12 },
  updateRow:         { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  updateDot:         { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
  updateText:        { fontSize: 13, color: DARK_GRAY, lineHeight: 20 },
  updateDate:        { fontSize: 11, color: MID_GRAY, marginTop: 2 },
  addTipRow:         { borderWidth: 1.5, borderColor: ORANGE + '55', borderStyle: 'dashed', borderRadius: 10, padding: 12, alignItems: 'center', marginTop: 4 },
  addTipText:        { fontSize: 13, color: ORANGE, fontWeight: '600' },
  sourceLabel:       { fontSize: 11, color: MID_GRAY, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: '700', marginBottom: 8 },
  sourceText:        { fontSize: 14, color: DARK_GRAY, lineHeight: 22, marginBottom: 12 },
  verifyBox:         { borderRadius: 10, padding: 12, flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  verifyText:        { fontSize: 13, fontWeight: '500', flex: 1, lineHeight: 20 },

  // CTAs
  ctaRow:            { flexDirection: 'row', gap: 10, marginBottom: 14 },
  ctaPrimary:        { flex: 1, backgroundColor: ORANGE, borderRadius: 14, padding: 14, alignItems: 'center', shadowColor: ORANGE, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 6 },
  ctaPrimaryText:    { color: WHITE, fontSize: 14, fontWeight: '700' },
  ctaShare:          { backgroundColor: WHITE, borderRadius: 14, padding: 14, borderWidth: 1.5, borderColor: LIGHT_GRAY, alignItems: 'center', justifyContent: 'center', width: 52 },
  ctaShareText:      { fontSize: 16, color: DARK_GRAY, fontWeight: '700' },

  // Google Maps link
  googleMapsLink:    { alignItems: 'center', paddingVertical: 8 },
  googleMapsLinkText: { fontSize: 13, color: ORANGE, fontWeight: '600', textDecorationLine: 'underline' },
});