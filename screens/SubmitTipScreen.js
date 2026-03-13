import { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput,
  TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ORANGE, WHITE, OFF_WHITE, LIGHT_GRAY, MID_GRAY, DARK_GRAY, TEXT,
} from '../constants/theme';

const CATEGORIES = ['Restaurant', 'Retail', 'Bar', 'Coffee', 'Construction', 'Other'];

export default function SubmitTipScreen() {
  const [addr, setAddr]       = useState('');
  const [desc, setDesc]       = useState('');
  const [cat, setCat]         = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <SafeAreaView style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ fontSize: 64, marginBottom: 16 }}>🎉</Text>
        <Text style={styles.heading}>Tip Submitted!</Text>
        <Text style={[styles.sub, { textAlign: 'center', paddingHorizontal: 32, marginBottom: 32 }]}>
          Thanks for helping your community stay in the know. We'll review your tip shortly.
        </Text>
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={() => { setSubmitted(false); setAddr(''); setDesc(''); setCat(''); }}
        >
          <Text style={styles.submitBtnText}>Submit Another</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.heading}>Submit a Tip</Text>
          <Text style={styles.sub}>
            Know what's going into a construction site or empty storefront? Tell us!
          </Text>

          <Text style={styles.label}>Address or Location</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 123 Main St, Downtown"
            placeholderTextColor={MID_GRAY}
            value={addr}
            onChangeText={setAddr}
          />

          <Text style={styles.label}>What's Going In?</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="e.g. I heard it's going to be a Chipotle..."
            placeholderTextColor={MID_GRAY}
            value={desc}
            onChangeText={setDesc}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          <Text style={styles.label}>Category</Text>
          <View style={styles.catGrid}>
            {CATEGORIES.map(c => (
              <TouchableOpacity
                key={c}
                style={[styles.catChip, cat === c && styles.catChipActive]}
                onPress={() => setCat(c)}
              >
                <Text style={[styles.catText, cat === c && styles.catTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, !addr && styles.submitBtnDisabled]}
            onPress={() => addr && setSubmitted(true)}
            disabled={!addr}
          >
            <Text style={styles.submitBtnText}>📌 Submit Tip</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: OFF_WHITE },
  content: { padding: 16, paddingBottom: 40 },
  heading: { fontSize: 26, fontWeight: '900', color: '#1E1A17', marginBottom: 4 },
  sub: { fontSize: 13, color: MID_GRAY, marginBottom: 24, lineHeight: 19 },
  label: {
    fontSize: 12, fontWeight: '700', color: DARK_GRAY,
    textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8,
  },
  input: {
    backgroundColor: WHITE,
    borderWidth: 1.5,
    borderColor: LIGHT_GRAY,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#1E1A17',
    marginBottom: 18,
  },
  textArea: {
    height: 90,
    paddingTop: 12,
  },
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  catChip: {
    backgroundColor: LIGHT_GRAY,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  catChipActive: {
    backgroundColor: ORANGE + '15',
    borderColor: ORANGE,
  },
  catText: { fontSize: 12, fontWeight: '600', color: DARK_GRAY },
  catTextActive: { color: ORANGE },
  submitBtn: {
    backgroundColor: ORANGE,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    shadowColor: ORANGE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  submitBtnDisabled: {
    backgroundColor: MID_GRAY,
    shadowOpacity: 0,
    elevation: 0,
  },
  submitBtnText: {
    color: WHITE,
    fontSize: 15,
    fontWeight: '700',
  },
});