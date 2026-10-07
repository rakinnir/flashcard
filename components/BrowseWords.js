import React, { useCallback, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import * as Speech from 'expo-speech';

const CLEAN_WORD_REGEX = /\s*\(.*?\)\s*/g;

// Columns handled specially get pulled out of the "other fields" loop below.
// Adjust these labels if your sheet uses different header names for the
// primary word / speakable field.
const PRIMARY_FIELD_CANDIDATES = ['Word', 'Term'];

const EMPTY_BOOKMARKS = [];

const WordRow = React.memo(({ item, index, otherFields, primaryField, isBookmarked, onBookmark, onSpeak }) => {
  const primaryValue = item[primaryField];

  return (
    <View style={styles.wordRow}>
      <Text style={styles.number}>{index + 1}.</Text>
      <View style={styles.wordContent}>
        <View style={styles.wordRowTop}>
          <Text style={styles.word}>{primaryValue}</Text>
          <TouchableOpacity
            onPress={() => onSpeak(primaryValue)}
            style={styles.iconBtn}
            activeOpacity={0.7}
          >
            <Text style={styles.speakerIcon}>🔊</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onBookmark(item)}
            style={styles.iconBtn}
            activeOpacity={0.7}
          >
            <Text style={styles.speakerIcon}>{isBookmarked ? '🔖' : '📄'}</Text>
          </TouchableOpacity>
        </View>

        {otherFields.map((field) => {
          const value = item[field];
          if (!value) return null;
          return (
            <Text key={field} style={styles.fieldLine}>
              <Text style={styles.fieldLabel}>{field}: </Text>
              {value}
            </Text>
          );
        })}
      </View>
    </View>
  );
});

export default function BrowseWords({ words, bookmarks = EMPTY_BOOKMARKS, onToggleBookmark, onBack }) {
  // Derive column names from the actual data instead of hardcoding them.
  const fields = useMemo(() => (words.length > 0 ? Object.keys(words[0]) : []), [words]);

  // Pick whichever known "primary" column exists in this sheet; fall back to
  // the first column so any sheet layout still works.
  const primaryField = useMemo(() => {
    const found = PRIMARY_FIELD_CANDIDATES.find((c) => fields.includes(c));
    return found || fields[0];
  }, [fields]);

  // Computed once per sheet instead of once per row.
  const otherFields = useMemo(() => fields.filter((f) => f !== primaryField), [fields, primaryField]);

  const bookmarkedSet = useMemo(
    () => new Set(bookmarks.map((b) => b[primaryField])),
    [bookmarks, primaryField]
  );

  const speakWord = useCallback((word) => {
    if (!word) return;
    const cleanWord = String(word).replace(CLEAN_WORD_REGEX, '').trim();
    Speech.speak(cleanWord, { pitch: 1.0, rate: 1.0, language: 'en-US' });
  }, []);

  const keyExtractor = useCallback(
    (item, idx) => String(item[primaryField]) + idx,
    [primaryField]
  );

  const renderItem = useCallback(
    ({ item, index }) => (
      <WordRow
        item={item}
        index={index}
        otherFields={otherFields}
        primaryField={primaryField}
        isBookmarked={bookmarkedSet.has(item[primaryField])}
        onBookmark={onToggleBookmark}
        onSpeak={speakWord}
      />
    ),
    [otherFields, primaryField, bookmarkedSet, onToggleBookmark, speakWord]
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Browse Words</Text>
      <FlatList
        data={words}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        removeClippedSubviews
        initialNumToRender={12}
        maxToRenderPerBatch={12}
        windowSize={9}
      />
      <TouchableOpacity style={styles.backBtn} onPress={onBack}>
        <Text style={styles.backBtnText}>Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f9fafb' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 12, textAlign: 'center', color: '#1e40af' },
  listContent: { paddingBottom: 20 },
  wordRow: {
    flexDirection: 'row',
    marginBottom: 12,
    backgroundColor: '#e0e7ff',
    padding: 10,
    borderRadius: 8,
  },
  wordContent: { flex: 1 },
  wordRowTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  number: { fontWeight: 'bold', fontSize: 16, marginRight: 8, color: '#1e40af' },
  word: { fontWeight: 'bold', fontSize: 16, color: '#1e3a8a', flex: 1 },
  fieldLine: { fontSize: 14, color: '#374151', marginBottom: 2 },
  fieldLabel: { fontWeight: '600', color: '#4b5563' },
  iconBtn: {
    marginLeft: 8,
    paddingHorizontal: 6,
    paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 16,
  },
  speakerIcon: { fontSize: 18 },
  backBtn: {
    backgroundColor: '#4f46e5',
    padding: 14,
    marginTop: 12,
    borderRadius: 8,
    alignSelf: 'center',
    width: 150,
    alignItems: 'center',
  },
  backBtnText: { color: 'white', fontSize: 18, fontWeight: '600' },
});