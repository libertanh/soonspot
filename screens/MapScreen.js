import { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Dimensions, Platform, Image,
} from 'react-native';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SPOTS } from '../constants/data';
import {
  ORANGE, ORANGE_DARK, WHITE, OFF_WHITE,
  LIGHT_GRAY, MID_GRAY, DARK_GRAY, TEXT, STATUS_CONFIG,
} from '../constants/theme';

const { width } = Dimensions.get('window');

// ─── CUSTOM MAP MARKER ───────────────────────────────────────────────────────
// This renders as the pin on the map itself
function SpotMarker({ spot }) {
  const cfg = STATUS_CONFIG[spot.status];
  const isConfirmed = spot.status === 'confirmed';

  return (
    <View style={styles.markerContainer}>
      {/* Label bubble */}
      <View style={[
        styles.markerBubble,
        { backgroundColor: isConfirmed ? ORANGE : WHITE,
          borderColor: isConfirmed ? ORANGE_DARK : cfg.dot }
      ]}>
        <Text style={{ fontSize: 12, marginRight: 3 }}>{spot.emoji}</Text>
        <Text style={[
          styles.markerText,
          { color: isConfirmed ? WHITE : cfg.text }
        ]}>
          {spot.status === 'mystery'    ? '???'          :
           spot.status === 'confirmed'  ? 'CONFIRMED!'   :
           spot.status === 'upcoming'   ? 'COMING SOON!' : 'ANNOUNCED!'}
        </Text>
      </View>
      {/* Pin tail */}
      <View style={[styles.markerTail, { borderTopColor: isConfirmed ? ORANGE : WHITE }]} />
      {/* Dot */}
      <View style={[styles.markerDot, { backgroundColor: cfg.dot }]} />
    </View>
  );
}

// ─── CALLOUT POPUP (tapping a pin shows this) ────────────────────────────────
function SpotCallout({ spot }) {
  const cfg = STATUS_CONFIG[spot.status];
  return (
    <View style={styles.callout}>
      <View style={styles.calloutHeader}>
        <Text style={styles.calloutEmoji}>{spot.emoji}</Text>
        <View style={styles.calloutInfo}>
          <Text style={styles.calloutName} numberOfLines={1}>
            {spot.status === 'mystery' ? 'Mystery Project' : spot.name}
          </Text>
          <Text style={styles.calloutAddress} numberOfLines={1}>{spot.address}</Text>
        </View>
      </View>
      <View style={[styles.calloutBadge, { backgroundColor: cfg.bg }]}>
        <View style={[styles.calloutDot, { backgroundColor: cfg.dot }]} />
        <Text style={[styles.calloutBadgeText, { color: cfg.text }]}>{cfg.label}</Text>
      </View>
      <Text style={styles.calloutOpening}>{spot.openingDate}</Text>
      <View style={styles.calloutCta}>
        <Text style={styles.calloutCtaText}>Tap for details →</Text>
      </View>
    </View>
  );
}

// ─── SPOT CARD (list below map) ──────────────────────────────────────────────
function SpotCard({ spot, saved, onSave, onPress }) {
  const cfg = STATUS_CONFIG[spot.status];
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.92} style={styles.card}>
      <View style={[styles.cardAccent, { backgroundColor: spot.color }]} />
      <View style={styles.cardBody}>
        <View style={styles.cardRow}>
          <View style={[styles.iconBox, { backgroundColor: spot.color + '18', borderColor: spot.color + '33' }]}>
            <Text style={styles.iconEmoji}>{spot.emoji}</Text>
          </View>
          <View style={styles.cardInfo}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {spot.status === 'mystery' ? 'Mystery Project' : spot.name}
              </Text>
              <TouchableOpacity onPress={() => onSave(spot.id)} hitSlop={{ top:10, bottom:10, left:10, right:10 }}>
                <Text style={styles.heartBtn}>{saved ? '❤️' : '🤍'}</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.cardAddress} numberOfLines={1}>📍 {spot.address}</Text>
            <View style={styles.cardMeta}>
              <View style={[styles.badge, { backgroundColor: cfg.bg, borderColor: cfg.dot + '44' }]}>
                <View style={[styles.badgeDot, { backgroundColor: cfg.dot }]} />
                <Text style={[styles.badgeText, { color: cfg.text }]}>{cfg.label}</Text>
              </View>
              <Text style={styles.cardDistance}>📏 {spot.distance}</Text>
            </View>
          </View>
        </View>
        <Text style={styles.cardDesc} numberOfLines={2}>{spot.description}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── FEATURED CARD ────────────────────────────────────────────────────────────
function FeaturedCard({ spot, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.92} style={styles.featuredCard}>
      <View style={[styles.featuredAccent, { backgroundColor: ORANGE }]} />
      <View style={styles.featuredInner}>
        <View style={styles.featuredContent}>
          <View style={styles.featuredBadge}>
            <Text style={styles.featuredBadgeText}>⭐ Featured</Text>
          </View>
          <Text style={styles.featuredName}>{spot.name}</Text>
          <Text style={styles.featuredDesc} numberOfLines={2}>{spot.description}</Text>
          <TouchableOpacity style={styles.learnMoreBtn} onPress={onPress}>
            <Text style={styles.learnMoreText}>Learn More ›</Text>
          </TouchableOpacity>
        </View>
        <View style={[styles.featuredIconBox, { backgroundColor: spot.color + '18' }]}>
          <Text style={styles.featuredEmoji}>{spot.emoji}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── MAIN SCREEN ─────────────────────────────────────────────────────────────
export default function MapScreen() {
  const navigation = useNavigation();
  const mapRef = useRef(null);
  const [search, setSearch] = useState('');
  const [saved, setSaved] = useState(['1', '5']);

  // Center on San Francisco for demo — will use real device location later
  const initialRegion = {
    latitude:      37.7749,
    longitude:    -122.4194,
    latitudeDelta:  0.018,
    longitudeDelta: 0.018,
  };

  const toggleSave = useCallback((id) => {
    setSaved(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }, []);

  const filtered = SPOTS.filter(s => {
    if (!search) return true;
    const q = search.toLowerCase();
    return s.name.toLowerCase().includes(q) ||
           s.address.toLowerCase().includes(q) ||
           s.neighborhood.toLowerCase().includes(q);
  });

  const featured = filtered.find(s => s.featured);
  const rest     = filtered.filter(s => !s.featured);

  const goToDetail = (spot) => navigation.navigate('SpotDetail', { spot });

  // When user taps a card in the list, fly the map to that pin
  const flyToSpot = (spot) => {
    mapRef.current?.animateToRegion({
      latitude:       spot.latitude,
      longitude:      spot.longitude,
      latitudeDelta:  0.006,
      longitudeDelta: 0.006,
    }, 600);
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      {/* ── Logo Header ── */}
      <View style={styles.header}>
        <Image
          source={require('../assets/logo.png')}
          style={styles.headerLogo}
          resizeMode="contain"
        />
        <Text style={styles.headerTitle}>SoonSpot</Text>
      </View>

      {/* ── Search Bar ── */}
      <View style={styles.searchContainer}>
        <View style={styles.searchRow}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="What's Coming Near You?"
            placeholderTextColor={MID_GRAY}
            value={search}
            onChangeText={setSearch}
          />
          <Text style={styles.micIcon}>🎙</Text>
        </View>
        <TouchableOpacity
          style={styles.submitTipBtn}
          onPress={() => navigation.navigate('Submit Tip')}
        >
          <Text style={styles.submitTipText}>📌 Submit Tip</Text>
        </TouchableOpacity>
      </View>

      {/* ── EMBEDDED GOOGLE MAP ── */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}      // uses Google Maps on both iOS & Android
          initialRegion={initialRegion}
          showsUserLocation={true}        // blue dot for current location
          showsMyLocationButton={true}    // recenter button
          showsCompass={true}
          showsBuildings={true}
          showsPointsOfInterest={false}   // hide POI clutter so our pins stand out
          mapType="standard"
          customMapStyle={soonSpotMapStyle} // custom orange-accented style
        >
          {/* One marker per spot */}
          {SPOTS.map(spot => (
            <Marker
              key={spot.id}
              coordinate={{ latitude: spot.latitude, longitude: spot.longitude }}
              onCalloutPress={() => goToDetail(spot)}
              tracksViewChanges={false}   // perf: don't re-render unless needed
            >
              {/* Custom marker view */}
              <SpotMarker spot={spot} />

              {/* Callout popup when marker is tapped */}
              <Callout tooltip onPress={() => goToDetail(spot)}>
                <SpotCallout spot={spot} />
              </Callout>
            </Marker>
          ))}
        </MapView>

        {/* Spot count badge overlaid on map */}
        <View style={styles.mapBadge}>
          <Text style={styles.mapBadgeText}>📍 {SPOTS.length} spots nearby</Text>
        </View>
      </View>

      {/* ── Spot List ── */}
      <FlatList
        data={rest}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {featured && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Featured</Text>
                <FeaturedCard spot={featured} onPress={() => goToDetail(featured)} />
              </View>
            )}
            <Text style={styles.sectionLabel}>Nearby Spots</Text>
          </>
        }
        renderItem={({ item }) => (
          <SpotCard
            spot={item}
            saved={saved.includes(item.id)}
            onSave={toggleSave}
            onPress={() => {
              flyToSpot(item);   // pan map to this spot
              goToDetail(item);  // open detail
            }}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      />
    </SafeAreaView>
  );
}

// ─── CUSTOM MAP STYLE ────────────────────────────────────────────────────────
// Muted warm tones so SoonSpot pins pop. Generated via mapstyle.withgoogle.com
const soonSpotMapStyle = [
  { elementType: 'geometry',        stylers: [{ color: '#f5f0ea' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#5a4e44' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#f5f0ea' }] },
  { featureType: 'road',            elementType: 'geometry', stylers: [{ color: '#e8e0d4' }] },
  { featureType: 'road.arterial',   elementType: 'geometry', stylers: [{ color: '#ddd4c4' }] },
  { featureType: 'road.highway',    elementType: 'geometry', stylers: [{ color: '#d4c8b4' }] },
  { featureType: 'water',           elementType: 'geometry', stylers: [{ color: '#b8d4e8' }] },
  { featureType: 'park',            elementType: 'geometry', stylers: [{ color: '#c8ddb8' }] },
  { featureType: 'poi',             stylers: [{ visibility: 'off' }] },
  { featureType: 'transit',         stylers: [{ visibility: 'off' }] },
];

// ─── STYLES ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: OFF_WHITE },

  // Header
  header:          { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: ORANGE, paddingHorizontal: 16, paddingVertical: 10 },
  headerLogo:      { width: 32, height: 32 },
  headerTitle:     { fontSize: 22, fontWeight: '900', color: 'white', letterSpacing: 0.5 },

  // Search
  searchContainer: { backgroundColor: WHITE, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10, gap: 8 },
  searchRow:       { flexDirection: 'row', alignItems: 'center', backgroundColor: OFF_WHITE, borderWidth: 1.5, borderColor: LIGHT_GRAY, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  searchIcon:      { fontSize: 16 },
  searchInput:     { flex: 1, fontSize: 14, color: TEXT },
  micIcon:         { fontSize: 16 },
  submitTipBtn:    { alignSelf: 'flex-end', backgroundColor: ORANGE, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 7, shadowColor: ORANGE, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 5 },
  submitTipText:   { color: WHITE, fontSize: 12, fontWeight: '700' },

  // Map
  mapContainer:    { height: 260, borderBottomWidth: 1, borderBottomColor: LIGHT_GRAY },
  map:             { flex: 1 },
  mapBadge:        { position: 'absolute', top: 10, left: 10, backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 6, elevation: 4 },
  mapBadgeText:    { fontSize: 12, fontWeight: '700', color: DARK_GRAY },

  // Marker
  markerContainer: { alignItems: 'center' },
  markerBubble:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 20, borderWidth: 1.5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.18, shadowRadius: 4, elevation: 5 },
  markerText:      { fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },
  markerTail:      { width: 0, height: 0, borderLeftWidth: 5, borderRightWidth: 5, borderTopWidth: 7, borderLeftColor: 'transparent', borderRightColor: 'transparent', marginTop: -1 },
  markerDot:       { width: 8, height: 8, borderRadius: 4, borderWidth: 2, borderColor: WHITE, marginTop: 2 },

  // Callout
  callout:         { width: 210, backgroundColor: WHITE, borderRadius: 14, padding: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8 },
  calloutHeader:   { flexDirection: 'row', gap: 8, marginBottom: 8 },
  calloutEmoji:    { fontSize: 28 },
  calloutInfo:     { flex: 1, justifyContent: 'center' },
  calloutName:     { fontSize: 14, fontWeight: '700', color: TEXT },
  calloutAddress:  { fontSize: 11, color: MID_GRAY, marginTop: 2 },
  calloutBadge:    { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 5 },
  calloutDot:      { width: 5, height: 5, borderRadius: 3 },
  calloutBadgeText: { fontSize: 11, fontWeight: '700' },
  calloutOpening:  { fontSize: 12, color: MID_GRAY, marginBottom: 10 },
  calloutCta:      { backgroundColor: ORANGE, borderRadius: 8, padding: 8, alignItems: 'center' },
  calloutCtaText:  { color: WHITE, fontSize: 12, fontWeight: '700' },

  // List
  listContent:     { padding: 16, paddingBottom: 32 },
  section:         { marginBottom: 4 },
  sectionLabel:    { fontSize: 11, fontWeight: '700', color: MID_GRAY, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },

  // Spot Card
  card:            { backgroundColor: WHITE, borderRadius: 16, borderWidth: 1, borderColor: LIGHT_GRAY, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  cardAccent:      { height: 3 },
  cardBody:        { padding: 14 },
  cardRow:         { flexDirection: 'row', gap: 12, marginBottom: 8 },
  iconBox:         { width: 50, height: 50, borderRadius: 14, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  iconEmoji:       { fontSize: 24 },
  cardInfo:        { flex: 1 },
  cardTitleRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitle:       { fontSize: 15, fontWeight: '700', color: TEXT, flex: 1, marginRight: 8 },
  heartBtn:        { fontSize: 20 },
  cardAddress:     { fontSize: 12, color: MID_GRAY, marginTop: 2 },
  cardMeta:        { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  badge:           { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1 },
  badgeDot:        { width: 5, height: 5, borderRadius: 3 },
  badgeText:       { fontSize: 11, fontWeight: '700' },
  cardDistance:    { fontSize: 12, color: MID_GRAY, marginLeft: 'auto' },
  cardDesc:        { fontSize: 13, color: DARK_GRAY, lineHeight: 18 },

  // Featured Card
  featuredCard:    { backgroundColor: WHITE, borderRadius: 18, borderWidth: 1, borderColor: LIGHT_GRAY, overflow: 'hidden', marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 5 },
  featuredAccent:  { height: 4 },
  featuredInner:   { flexDirection: 'row', padding: 14 },
  featuredContent: { flex: 1, paddingRight: 8 },
  featuredBadge:   { backgroundColor: ORANGE, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start', marginBottom: 8 },
  featuredBadgeText: { color: WHITE, fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  featuredName:    { fontSize: 18, fontWeight: '700', color: TEXT, marginBottom: 4 },
  featuredDesc:    { fontSize: 13, color: MID_GRAY, lineHeight: 18, marginBottom: 12 },
  learnMoreBtn:    { backgroundColor: DARK_GRAY, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8, alignSelf: 'flex-start' },
  learnMoreText:   { color: WHITE, fontSize: 12, fontWeight: '700' },
  featuredIconBox: { width: 90, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  featuredEmoji:   { fontSize: 48 },
});