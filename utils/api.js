// Sheets are bundled locally. Each loader requires its JSON lazily, so a sheet
// is only evaluated the first time it is opened instead of all of them at
// startup. Key order here is the order shown on the home screen.
const LOADERS = {
  'WS1': () => require('../data/ws1.json'),
  'Gre333e': () => require('../data/gre333_extra.json'),
  'WS2': () => require('../data/ws2.json'),
  'OWS': () => require('../data/ows.json'),
  'Idiom & Phrase': () => require('../data/idiom_phrase.json'),
  'বাগধারা (BB)': () => require('../data/bagdharabb.json'),
  'Extras': () => require('../data/extras.json'),
  'All': () => require('../data/all.json'),
};

export const SHEET_NAMES = Object.keys(LOADERS);

// Cleaned sheets, keyed by sheet name. Rows are never mutated by callers,
// so the same array can safely be handed out repeatedly.
const cache = new Map();

const cleanRow = (row) => {
  const cleaned = {};
  Object.keys(row).forEach((k) => { cleaned[k.trim()] = row[k]; });
  return cleaned;
};

export async function fetchSheetData(sheetName) {
  if (cache.has(sheetName)) return cache.get(sheetName);
  try {
    const load = LOADERS[sheetName];
    const cleaned = load ? load().map(cleanRow) : [];
    cache.set(sheetName, cleaned);
    return cleaned;
  } catch (e) {
    console.warn('Local sheet load failed', e);
    return [];
  }
}
