import React, { useState, useCallback } from 'react';
import {
  View, Text, Alert, Animated,
  TouchableOpacity, ActivityIndicator, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import SheetSelector from './components/SheetSelector';
import QuizSetup from './components/QuizSetup';
import Quiz from './components/Quiz';
import BookmarksList from './components/BookmarksList';
import BrowseWords from './components/BrowseWords';
import useBookmarks from './hooks/useBookmarks';
import { fetchSheetData, SHEET_NAMES } from './utils/api';

const shuffleArr = (arr) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const INITIAL_QUIZ_STATE = {
  quizCards: [],
  currentIndex: 0,
  flipStage: 0,
  score: 0,
  cardLimit: 0,
  finalScore: 0,
  showResultPopup: false,
};

export default function Mainapp() {
  const [selectedSheet, setSelectedSheet] = useState(null);
  const [allCards, setAllCards] = useState([]);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('sheetSelector');
  const [bookmarkMessage, setBookmarkMessage] = useState(false);
  const [browseWords, setBrowseWords] = useState([]);
  const [quizSource, setQuizSource] = useState('sheet');
  const [range, setRange] = useState([1, 1]);
  const [inputCount, setInputCount] = useState('');

  const [quizState, setQuizState] = useState(INITIAL_QUIZ_STATE);

  // Lazy init: `useRef(new Animated.Value(0))` would build (and discard) a new value every render.
  const [flipAnim] = useState(() => new Animated.Value(0));
  const [fadeAnim] = useState(() => new Animated.Value(0));

  const { bookmarks, groupedBookmarks, loadBookmarks: reloadBookmarks, saveBookmark, removeBookmark } = useBookmarks();

  /* ----- Navigation helpers (stable identities so memoized screens can skip re-renders) ----- */
  const toSheetSelector = useCallback(() => setViewMode('sheetSelector'), []);
  const toBookmarksList = useCallback(() => setViewMode('bookmarksList'), []);
  const leaveQuiz = useCallback(() => {
    setSelectedSheet(null);
    setViewMode('sheetSelector');
  }, []);

  /* ----- Bookmark feedback ----- */
  const showBookmarkMessage = useCallback(() => {
    setBookmarkMessage(true);
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(1000),
      Animated.timing(fadeAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start(() => setBookmarkMessage(false));
  }, [fadeAnim]);

  const onSaveBookmark = useCallback((card) => {
    saveBookmark(card, selectedSheet);
    showBookmarkMessage();
  }, [saveBookmark, showBookmarkMessage, selectedSheet]);

  const onToggleBookmark = useCallback((item) => {
    const isBookmarked = bookmarks.some((b) => b.Word === item.Word);
    if (isBookmarked) {
      removeBookmark(item.Word);
    } else {
      saveBookmark(item, selectedSheet);
      showBookmarkMessage();
    }
  }, [bookmarks, saveBookmark, removeBookmark, showBookmarkMessage, selectedSheet]);

  /* ----- Load bookmarks ----- */
  const loadBookmarks = useCallback(async () => {
    setLoading(true);
    try {
      await reloadBookmarks();
      setSelectedSheet('BOOKMARKS');
      setViewMode('bookmarksList');
    } catch (e) {
      Alert.alert('Error', 'Failed to load bookmarks.');
    } finally {
      setLoading(false);
    }
  }, [reloadBookmarks]);

  /* ----- Fetch sheet ----- */
  const onSelectSheet = useCallback(async (sheetName) => {
    setLoading(true);
    try {
      const data = await fetchSheetData(sheetName);
      setAllCards(data);
      setSelectedSheet(sheetName);
      setRange([1, data.length || 1]);
      setColumns(data.length > 0 ? Object.keys(data[0]) : []);
      return data;
    } catch (e) {
      Alert.alert('Error', `Couldn't load sheet: ${sheetName}`);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSheetAction = useCallback(async (sheetName, action) => {
    const data = await onSelectSheet(sheetName);
    if (action === 'test') {
      setQuizSource('sheet');
      setViewMode('quizSetup');
    } else if (action === 'browse') {
      setBrowseWords(data);
      setViewMode('browse');
    }
  }, [onSelectSheet]);

  /* ----- Start a quiz from bookmarks (a single group, or all when groupCards is null) ----- */
  const startBookmarkQuiz = useCallback((groupCards) => {
    const cards = groupCards ?? bookmarks;
    setAllCards(cards);
    setColumns(cards.length > 0 ? Object.keys(cards[0]) : []);
    setInputCount(cards.length.toString());
    setRange([1, cards.length || 1]);
    setQuizSource('bookmarks');
    setViewMode('bookmarksQuiz');
  }, [bookmarks]);

  /* ----- Start quiz ----- */
  const startQuiz = useCallback(() => {
    const n = parseInt(inputCount, 10);
    if (isNaN(n) || n <= 0) {
      Alert.alert('Error', 'Please enter a valid number of words.');
      return;
    }

    const sourceCards = allCards;

    if (!sourceCards?.length) {
      Alert.alert('Error', 'No cards available.');
      return;
    }

    if (sourceCards.length < n) {
      Alert.alert('Error', `You only have ${sourceCards.length} words.`);
      return;
    }

    let selected;

    if (quizSource === 'bookmarks') {
      selected = shuffleArr(sourceCards).slice(0, n);
    } else {
      const [start, end] = range.map((v) => parseInt(v, 10));
      if (isNaN(start) || isNaN(end) || start < 1 || end > sourceCards.length || start > end) {
        Alert.alert('Error', `Please enter a valid range between 1 and ${sourceCards.length}.`);
        return;
      }
      const rangeCards = sourceCards.slice(start - 1, end);
      if (rangeCards.length < n) {
        Alert.alert('Error', `Range has only ${rangeCards.length} cards, but you requested ${n}.`);
        return;
      }
      selected = shuffleArr(rangeCards).slice(0, n);
    }

    flipAnim.setValue(0);
    setQuizState({
      ...INITIAL_QUIZ_STATE,
      quizCards: selected,
      cardLimit: n,
    });
    setViewMode('quiz');
  }, [inputCount, quizSource, allCards, range, flipAnim]);

  /* ----- Handle answer ----- */
  const handleAnswer = useCallback((correct) => {
    // Reset the animation outside the state updater, which must stay pure.
    flipAnim.setValue(0);
    setQuizState((prev) => {
      const newScore = prev.score + (correct ? 1 : 0);
      const isLast = prev.currentIndex === prev.quizCards.length - 1;
      return isLast
        ? { ...prev, score: newScore, finalScore: newScore, showResultPopup: true }
        : { ...prev, score: newScore, currentIndex: prev.currentIndex + 1, flipStage: 0 };
    });
  }, [flipAnim]);

  const restartQuiz = useCallback(() => {
    flipAnim.setValue(0);
    setQuizState((prev) => ({
      ...prev,
      currentIndex: 0,
      flipStage: 0,
      score: 0,
      finalScore: 0,
      showResultPopup: false,
    }));
  }, [flipAnim]);

  const goHome = useCallback(() => {
    flipAnim.setValue(0);
    setSelectedSheet(null);
    setViewMode('sheetSelector');
    setQuizState(INITIAL_QUIZ_STATE);
    setInputCount('');
    setRange([1, 1]);
    setQuizSource('sheet');
    setAllCards([]);
    setColumns([]);
  }, [flipAnim]);

  /* ----- Flip animation ----- */
  const flipCard = useCallback((maxFlipStage) => {
    Animated.timing(flipAnim, {
      toValue: 1, duration: 300, useNativeDriver: true,
    }).start(() => {
      setQuizState((prev) => ({ ...prev, flipStage: (prev.flipStage + 1) % maxFlipStage }));
      flipAnim.setValue(0);
    });
  }, [flipAnim]);

  /* ----- Loading overlay ----- */
  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  const { quizCards, currentIndex, flipStage, score, cardLimit, finalScore, showResultPopup } = quizState;

  /* ----- View routing ----- */
  switch (viewMode) {
    case 'sheetSelector':
      return (
        <SafeAreaView style={styles.container}>
          <SheetSelector
            sheetNames={SHEET_NAMES}
            onSelectOptions={handleSheetAction}
            onLoadBookmarks={loadBookmarks}
          />
        </SafeAreaView>
      );

    case 'browse':
      return (
        <SafeAreaView style={styles.container}>
          <BrowseWords
            words={browseWords}
            bookmarks={bookmarks}
            onToggleBookmark={onToggleBookmark}
            onBack={toSheetSelector}
          />
        </SafeAreaView>
      );

    // Same setup screen for a sheet quiz and a bookmarks quiz; only "Back" differs.
    case 'quizSetup':
    case 'bookmarksQuiz':
      return (
        <SafeAreaView style={styles.container}>
          <QuizSetup
            maxCount={allCards.length}
            inputCount={inputCount}
            setInputCount={setInputCount}
            range={range}
            setRange={setRange}
            onStart={startQuiz}
            onBack={viewMode === 'quizSetup' ? toSheetSelector : toBookmarksList}
          />
        </SafeAreaView>
      );

    case 'quiz':
      return (
        <SafeAreaView style={styles.flex}>
          <Quiz
            quizCards={quizCards}
            columns={columns}
            currentIndex={currentIndex}
            flipStage={flipStage}
            flipAnim={flipAnim}
            flipCard={flipCard}
            saveBookmark={onSaveBookmark}
            score={score}
            cardLimit={cardLimit}
            handleAnswer={handleAnswer}
            onBack={leaveQuiz}
            bookmarkMessage={bookmarkMessage}
            fadeAnim={fadeAnim}
          />

          {showResultPopup && (
            <View style={styles.resultOverlay}>
              <View style={styles.resultPopup}>
                <Text style={styles.resultTitle}>Quiz Complete</Text>
                <Text style={styles.resultScore}>Score: {finalScore} / {cardLimit}</Text>
                <TouchableOpacity style={styles.resultBtn} onPress={restartQuiz}>
                  <Text style={styles.resultBtnText}>Restart</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.resultBtn, styles.resultBtnHome]} onPress={goHome}>
                  <Text style={styles.resultBtnText}>Home</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </SafeAreaView>
      );

    case 'bookmarksList':
      return (
        <SafeAreaView style={styles.container}>
          <BookmarksList
            groupedBookmarks={groupedBookmarks}
            removeBookmark={removeBookmark}
            onStartQuiz={startBookmarkQuiz}
            onBack={toSheetSelector}
          />
        </SafeAreaView>
      );

    default:
      return (
        <SafeAreaView style={styles.centered}>
          <Text>Unexpected state</Text>
        </SafeAreaView>
      );
  }
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  resultOverlay: {
    position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center', alignItems: 'center',
  },
  resultPopup: {
    width: '80%', backgroundColor: 'white', padding: 20,
    borderRadius: 12, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 10, elevation: 10,
  },
  resultTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  resultScore: { fontSize: 18, marginBottom: 16 },
  resultBtn: {
    width: '80%', paddingVertical: 10, backgroundColor: '#4ade80',
    borderRadius: 8, marginTop: 8, alignItems: 'center',
  },
  resultBtnHome: { backgroundColor: '#888' },
  resultBtnText: { color: 'white', fontWeight: '700' },
});
