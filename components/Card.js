import React, { useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import * as Speech from 'expo-speech';

const COLORS = ['#bfdbfe', '#fde68a', '#fca5a5', '#86efac', '#d8b4fe'];
const CLEAN_WORD_REGEX = /\s*\(.*?\)\s*/g;

export default React.memo(function Card({ card, columns, flipStage, flipAnim, flipCard, saveBookmark }) {
  const rotateY = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  // Build stages dynamically from the ordered columns array
  const stages = useMemo(() => {
    return columns
      .map((col) => ({ label: col, text: card[col] }))
      .filter((s) => s.text?.trim());
  }, [card, columns]);

  const { label, text } = stages[flipStage] ?? { label: '', text: '' };
  const cardColor = COLORS[flipStage % COLORS.length];

  // First column is always the "word" stage (stage 0)
  const firstColumnKey = columns[0];

  const speakWord = useCallback(() => {
    if (flipStage === 0 && card[firstColumnKey]) {
      Speech.stop();
      Speech.speak(String(card[firstColumnKey]).replace(CLEAN_WORD_REGEX, '').trim(), {
        pitch: 1.0, rate: 1.0, language: 'en-US',
      });
    }
  }, [flipStage, card, firstColumnKey]);

  const onFlip = useCallback(() => flipCard(stages.length), [flipCard, stages.length]);
  const onBookmark = useCallback(() => saveBookmark(card), [saveBookmark, card]);

  // First stage: show word prominently; rest: show label + content
  const isFirstStage = flipStage === 0;

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[styles.card, { backgroundColor: cardColor, transform: [{ rotateY }] }]}
    >
      <TouchableOpacity style={styles.cardContent} onPress={onFlip} activeOpacity={0.9}>
        {isFirstStage ? (
          <Text style={styles.wordText}>{text}</Text>
        ) : (
          <>
            <Text style={styles.cardLabel}>{label}</Text>
            <Text style={styles.cardText}>{text}</Text>
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.bookmarkBtn}
        onPress={onBookmark}
        hitSlop={{ top: 25, bottom: 25, left: 25, right: 25 }}
      >
        <Text style={styles.btnIcon}>🔖</Text>
      </TouchableOpacity>

      {isFirstStage && (
        <TouchableOpacity
          style={styles.speakerBtn}
          onPress={speakWord}
          hitSlop={{ top: 25, bottom: 25, left: 25, right: 25 }}
          activeOpacity={0.7}
        >
          <Text style={styles.btnIcon}>🔊</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  card: {
    width: 350, height: 300, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
    padding: 20, marginVertical: 30,
    backfaceVisibility: 'hidden', position: 'relative',
    transform: [{ perspective: 1000 }],
  },
  cardContent: { flex: 1, justifyContent: 'center', alignItems: 'stretch', width: '100%' },
  wordText: { fontSize: 26, color: '#1e3a8a', textAlign: 'center', fontWeight: 'bold', width: '100%' },
  cardLabel: { fontSize: 14, color: '#4b5563', marginBottom: 8, fontWeight: 'bold', textAlign: 'left', width: '100%' },
  cardText: { fontSize: 20, color: '#1e3a8a', textAlign: 'left', width: '100%' },
  bookmarkBtn: {
    position: 'absolute', top: 8, left: 8,
    padding: 10, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 24, elevation: 4, zIndex: 10,
  },
  speakerBtn: {
    position: 'absolute', top: 8, right: 8,
    padding: 10, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 24, elevation: 4, zIndex: 10,
  },
  btnIcon: { fontSize: 24 },
});