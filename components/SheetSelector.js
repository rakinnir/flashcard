import React, { useState, useCallback, useMemo, memo } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Modal } from 'react-native';

const keyExtractor = (item) => item;

const SheetItem = memo(({ item, onPress }) => (
  <TouchableOpacity style={styles.sheetButton} onPress={() => onPress(item)}>
    <Text style={styles.sheetButtonText}>{item}</Text>
  </TouchableOpacity>
));

export default memo(function SheetSelector({ sheetNames, onSelectOptions, onLoadBookmarks }) {
  const [selectedSheet, setSelectedSheet] = useState(null);

  const data = useMemo(() => ['Bookmarks', ...sheetNames], [sheetNames]);

  const openOptions = useCallback((item) => {
    if (item === 'Bookmarks') {
      onLoadBookmarks();
    } else {
      setSelectedSheet(item);
    }
  }, [onLoadBookmarks]);

  const closeOptions = useCallback(() => setSelectedSheet(null), []);

  const renderItem = useCallback(
    ({ item }) => <SheetItem item={item} onPress={openOptions} />,
    [openOptions]
  );

  const onTest = useCallback(() => {
    const sheet = selectedSheet;
    closeOptions();
    onSelectOptions(sheet, 'test');
  }, [selectedSheet, closeOptions, onSelectOptions]);

  const onBrowse = useCallback(() => {
    const sheet = selectedSheet;
    closeOptions();
    onSelectOptions(sheet, 'browse');
  }, [selectedSheet, closeOptions, onSelectOptions]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Word Group</Text>
      <FlatList
        data={data}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.flatListContent}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
      />

      <Modal
        visible={!!selectedSheet}
        transparent
        animationType="fade"
        onRequestClose={closeOptions}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Choose Action for "{selectedSheet}"</Text>

            <TouchableOpacity style={[styles.modalButton, styles.takeTestButton]} onPress={onTest}>
              <Text style={styles.modalButtonText}>Take Test</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.modalButton, styles.browseWordsButton]} onPress={onBrowse}>
              <Text style={styles.modalButtonText}>Browse Words</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalCancel} onPress={closeOptions}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
});

const BUTTON_WIDTH = 250;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff', justifyContent: 'center' },
  flatListContent: { alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#1e40af', textAlign: 'center' },
  sheetButton: {
    backgroundColor: '#f0f0f0', paddingVertical: 14, paddingHorizontal: 25,
    marginVertical: 6, borderRadius: 8, width: BUTTON_WIDTH, alignItems: 'center',
  },
  sheetButtonText: { fontSize: 18, color: '#333333', fontWeight: 'bold' },
  modalBackdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: 'white', borderRadius: 12, paddingVertical: 30, paddingHorizontal: 30,
    alignItems: 'center', elevation: 10, shadowColor: '#000', shadowOpacity: 0.25,
    shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, maxWidth: 320, width: '90%',
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 25, textAlign: 'center', color: '#111' },
  modalButton: {
    borderRadius: 8, paddingVertical: 16, paddingHorizontal: 25,
    alignItems: 'center', justifyContent: 'center', marginVertical: 8, width: BUTTON_WIDTH,
  },
  takeTestButton: { backgroundColor: '#3b82f6' },
  browseWordsButton: { backgroundColor: '#888' },
  modalButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  modalCancel: { marginTop: 15 },
  modalCancelText: { color: '#555', fontSize: 16 },
});