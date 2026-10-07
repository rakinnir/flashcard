import React, { useCallback, memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import Card from './Card';

const BookmarkToast = memo(({ fadeAnim }) => (
  <Animated.View style={[styles.bookmarkMsg, { opacity: fadeAnim }]}>
    <Text style={styles.bookmarkMsgText}>Bookmarked</Text>
  </Animated.View>
));

const AnswerButtons = memo(({ onCorrect, onWrong }) => (
  <View style={styles.row}>
    <TouchableOpacity style={[styles.btn, styles.btnCorrect]} onPress={onCorrect}>
      <Text style={styles.btnText}>✔️</Text>
    </TouchableOpacity>
    <TouchableOpacity style={[styles.btn, styles.btnWrong]} onPress={onWrong}>
      <Text style={styles.btnText}>❌</Text>
    </TouchableOpacity>
  </View>
));

export default memo(function Quiz({
  quizCards,
  columns,
  currentIndex,
  flipStage,
  flipAnim,
  flipCard,
  saveBookmark,
  score,
  cardLimit,
  handleAnswer,
  onBack,
  bookmarkMessage,
  fadeAnim,
}) {
  const card = quizCards[currentIndex];

  const onCorrect = useCallback(() => handleAnswer(true), [handleAnswer]);
  const onWrong = useCallback(() => handleAnswer(false), [handleAnswer]);

  return (
    <View style={styles.container}>
      {bookmarkMessage && <BookmarkToast fadeAnim={fadeAnim} />}

      <Text style={styles.title}>Score: {score} / {cardLimit}</Text>

      <Card
        card={card}
        columns={columns}
        flipStage={flipStage}
        flipAnim={flipAnim}
        flipCard={flipCard}
        saveBookmark={saveBookmark}
      />

      <AnswerButtons onCorrect={onCorrect} onWrong={onWrong} />

      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={styles.startText}>Back</Text>
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, alignItems: 'center', backgroundColor: '#f9fafb' },
  title: { fontSize: 24, fontWeight: 'bold', marginVertical: 20, color: '#1e40af', textAlign: 'center' },
  row: { flexDirection: 'row', width: '60%', justifyContent: 'space-between' },
  btn: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
  btnCorrect: { backgroundColor: '#4ade80' },
  btnWrong: { backgroundColor: '#f87171' },
  btnText: { fontSize: 28, color: 'white' },
  backButton: { backgroundColor: '#888', padding: 15, marginTop: 20, borderRadius: 8, width: 200, alignItems: 'center' },
  startText: { color: 'white', fontSize: 18, fontWeight: '600' },
  bookmarkMsg: {
    position: 'absolute', top: 30, alignSelf: 'center',
    backgroundColor: '#4ade80', paddingHorizontal: 20, paddingVertical: 8,
    borderRadius: 25, zIndex: 10, elevation: 10,
  },
  bookmarkMsgText: { color: 'white', fontWeight: 'bold' },
});