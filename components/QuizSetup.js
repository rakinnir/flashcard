import React, { useCallback, useMemo, memo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import MultiSlider from '@ptomasroos/react-native-multi-slider';

const SLIDER_SELECTED = { backgroundColor: '#4f46e5' };
const SLIDER_UNSELECTED = { backgroundColor: '#d3d3d3' };
const SLIDER_CONTAINER = { alignSelf: 'center', marginVertical: 20 };
const IS_IOS = Platform.OS === 'ios';

export default memo(function QuizSetup({
  maxCount,
  inputCount,
  setInputCount,
  range,
  setRange,
  onStart,
  onBack,
}) {
  const maxValue = maxCount || 1;
  const [minRange, maxRange] = Array.isArray(range) && range.length === 2 ? range : [1, maxValue];
  const sliderValues = useMemo(() => [minRange, maxRange], [minRange, maxRange]);

  const onRangeChange = useCallback((values) => {
    setRange(values);
    const rangeLength = values[1] - values[0] + 1;
    if (parseInt(inputCount, 10) > rangeLength) {
      setInputCount(rangeLength.toString());
    }
  }, [inputCount, setRange, setInputCount]);

  const onChangeText = useCallback((text) => {
    setInputCount(text.replace(/[^0-9]/g, ''));
  }, [setInputCount]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={IS_IOS ? 'padding' : undefined}
    >
      <Text style={styles.label}>Number of Words to Test</Text>
      <TextInput
        style={styles.inputBox}
        keyboardType="numeric"
        value={inputCount}
        onChangeText={onChangeText}
        placeholder="Enter number"
        maxLength={3}
      />

      <Text style={styles.label}>Select Range of Words</Text>
      <Text style={styles.rangeText}>
        {minRange} to {maxRange} (Total: {maxRange - minRange + 1})
      </Text>

      <MultiSlider
        values={sliderValues}
        sliderLength={280}
        onValuesChange={onRangeChange}
        min={1}
        max={maxValue}
        step={1}
        allowOverlap={false}
        snapped
        selectedStyle={SLIDER_SELECTED}
        unselectedStyle={SLIDER_UNSELECTED}
        containerStyle={SLIDER_CONTAINER}
      />

      <View style={styles.buttons}>
        <TouchableOpacity style={styles.btnPrimary} onPress={onStart}>
          <Text style={styles.btnText}>Start Quiz</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnSecondary} onPress={onBack}>
          <Text style={styles.btnText}>Back</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: '#fff' },
  label: { fontWeight: 'bold', fontSize: 16, marginTop: 15, color: '#333' },
  inputBox: {
    borderWidth: 1, borderColor: '#888', borderRadius: 6,
    paddingHorizontal: 12, fontSize: 18, marginTop: 8, height: 44, color: '#000',
  },
  rangeText: { fontSize: 16, marginTop: 8, textAlign: 'center', color: '#555' },
  buttons: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 30 },
  btnPrimary: {
    backgroundColor: '#4f46e5', paddingVertical: 15, paddingHorizontal: 40,
    borderRadius: 12, minWidth: 120, alignItems: 'center',
  },
  btnSecondary: {
    backgroundColor: '#888', paddingVertical: 15, paddingHorizontal: 40,
    borderRadius: 12, minWidth: 120, alignItems: 'center',
  },
  btnText: { color: 'white', fontSize: 18, fontWeight: '600' },
});