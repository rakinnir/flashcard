import React, { useCallback, useState, memo } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';

const BookmarkItem = memo(({ item, onRemove }) => (
  <View style={styles.bookmarkItem}>
    <View style={styles.bookmarkHeader}>
      <Text style={styles.bookmarkWord}>{item.Word}</Text>
      <TouchableOpacity
        onPress={() => onRemove(item.Word)}
        style={styles.unbookmarkBtn}
        hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
      >
        <Text style={styles.unbookmarkIcon}>❌</Text>
      </TouchableOpacity>
    </View>
    {item['Meaning / Synonym']?.trim() && (
      <Text style={styles.bookmarkDetails}>Meaning: {item['Meaning / Synonym']}</Text>
    )}
    {item.Antonym?.trim() && (
      <Text style={styles.bookmarkDetails}>Antonym: {item.Antonym}</Text>
    )}
    {item.Sentence?.trim() && (
      <Text style={styles.bookmarkDetails}>Sentence: {item.Sentence}</Text>
    )}
  </View>
));

const GroupHeader = memo(({ title, count, expanded, onToggle, onTest }) => (
  <TouchableOpacity style={styles.groupHeader} onPress={onToggle} activeOpacity={0.7}>
    <View style={styles.groupHeaderLeft}>
      <Text style={styles.groupTitle}>{title}</Text>
      <Text style={styles.groupCount}>{count} word{count !== 1 ? 's' : ''}</Text>
    </View>
    <View style={styles.groupHeaderRight}>
      <TouchableOpacity
        style={styles.groupTestBtn}
        onPress={(e) => { e.stopPropagation?.(); onTest(); }}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.groupTestBtnText}>Test</Text>
      </TouchableOpacity>
      <Text style={styles.groupChevron}>{expanded ? '▲' : '▼'}</Text>
    </View>
  </TouchableOpacity>
));

const itemKeyExtractor = (item, idx) => item.Word + idx;
const groupKeyExtractor = (g) => g;

// One collapsible group. Memoized, with handlers bound here, so toggling one
// group doesn't re-render every other group's header.
const BookmarkGroup = memo(({ group, items, expanded, onToggle, onTest, renderItem }) => {
  const handleToggle = useCallback(() => onToggle(group), [onToggle, group]);
  const handleTest = useCallback(() => onTest(items, group), [onTest, items, group]);

  return (
    <View style={styles.groupContainer}>
      <GroupHeader
        title={group}
        count={items.length}
        expanded={expanded}
        onToggle={handleToggle}
        onTest={handleTest}
      />
      {expanded && (
        <FlatList
          data={items}
          keyExtractor={itemKeyExtractor}
          renderItem={renderItem}
          scrollEnabled={false}
        />
      )}
    </View>
  );
});

export default function BookmarksList({ groupedBookmarks, removeBookmark, onStartQuiz, onBack }) {
  const groups = Object.keys(groupedBookmarks);
  const totalCount = Object.values(groupedBookmarks).reduce((s, a) => s + a.length, 0);
  // Groups start collapsed; a group that appears later (not in this map) shows expanded, as before.
  const [collapsed, setCollapsed] = useState(() =>
    groups.reduce((acc, key) => ({ ...acc, [key]: true }), {})
  );

  const toggleGroup = useCallback((key) => {
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const renderItem = useCallback(
    ({ item }) => <BookmarkItem item={item} onRemove={removeBookmark} />,
    [removeBookmark]
  );

  const renderGroup = useCallback(
    ({ item: group }) => (
      <BookmarkGroup
        group={group}
        items={groupedBookmarks[group]}
        expanded={!collapsed[group]}
        onToggle={toggleGroup}
        onTest={onStartQuiz}
        renderItem={renderItem}
      />
    ),
    [groupedBookmarks, collapsed, toggleGroup, onStartQuiz, renderItem]
  );

  const onTestAll = useCallback(() => onStartQuiz(null, 'All'), [onStartQuiz]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bookmarked Words</Text>

      {totalCount === 0 ? (
        <Text style={styles.emptyText}>No bookmarks yet.</Text>
      ) : (
        <FlatList
          data={groups}
          keyExtractor={groupKeyExtractor}
          contentContainerStyle={styles.listContent}
          removeClippedSubviews
          renderItem={renderGroup}
        />
      )}

      {totalCount > 0 && (
        <TouchableOpacity style={styles.startButton} onPress={onTestAll}>
          <Text style={styles.startText}>Test All</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity style={[styles.startButton, styles.backButton]} onPress={onBack}>
        <Text style={styles.startText}>Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f9fafb' },
  title: { fontSize: 24, fontWeight: 'bold', marginVertical: 20, color: '#1e40af', textAlign: 'center' },
  listContent: { paddingBottom: 100 },
  emptyText: { textAlign: 'center', color: '#6b7280', marginTop: 20 },
  groupContainer: { marginBottom: 12 },
  groupHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#1e40af', paddingVertical: 10, paddingHorizontal: 14,
    borderRadius: 8, marginBottom: 4,
  },
  groupHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  groupHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  groupTitle: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  groupCount: { fontSize: 13, color: '#bfdbfe' },
  groupChevron: { fontSize: 14, color: '#fff' },
  groupTestBtn: {
    backgroundColor: '#4ade80', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6,
  },
  groupTestBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  bookmarkItem: { backgroundColor: '#e0e7ff', padding: 12, marginVertical: 4, borderRadius: 10 },
  bookmarkHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  bookmarkWord: { fontSize: 20, fontWeight: 'bold', color: '#1e40af' },
  bookmarkDetails: { fontSize: 14, color: '#374151', marginTop: 2 },
  unbookmarkBtn: {
    paddingHorizontal: 6, paddingVertical: 3, backgroundColor: '#f87171',
    borderRadius: 12, justifyContent: 'center', alignItems: 'center',
  },
  unbookmarkIcon: { fontSize: 18 },
  startButton: {
    backgroundColor: '#4f46e5', padding: 15, marginTop: 15, borderRadius: 8,
    width: 200, alignItems: 'center', alignSelf: 'center',
  },
  backButton: { backgroundColor: '#888' },
  startText: { color: 'white', fontSize: 18, fontWeight: '600' },
});