/**
 * Simulate canvas text rendering to verify spacing matches website
 */

const testCases = [
  {
    name: 'Czech: 22letá (joined)',
    segments: [
      { type: 'translated', text: '22', original: '22' },
      { type: 'text', text: 'letá vysokoškolská studentka' }
    ],
    expected: '22letá vysokoškolská studentka'
  },
  {
    name: 'Dutch: 22-jarige (hyphenated)',
    segments: [
      { type: 'translated', text: '22', original: '22' },
      { type: 'text', text: '-jarige universiteitsstudente' }
    ],
    expected: '22-jarige universiteitsstudente'
  },
  {
    name: 'Czech: name with comma and space',
    segments: [
      { type: 'translated', text: 'Karolína', original: 'Raha' },
      { type: 'text', text: ', ' },
      { type: 'translated', text: '22', original: '22' },
      { type: 'text', text: 'letá studentka' }
    ],
    expected: 'Karolína, 22letá studentka'
  },
  {
    name: 'Source citation without extra space',
    segments: [
      { type: 'text', text: 'podle dokumentů' },
      { type: 'source', text: '[1]' },
      { type: 'text', text: ', bylo' }
    ],
    expected: 'podle dokumentů[1], bylo'
  },
  {
    name: 'Text with leading space',
    segments: [
      { type: 'translated', text: 'Lynn', original: 'Raha' },
      { type: 'text', text: ' was ' },
      { type: 'translated', text: '22', original: '22' },
      { type: 'text', text: ' years old' }
    ],
    expected: 'Lynn was 22 years old'
  },
  {
    name: 'Text with trailing space',
    segments: [
      { type: 'text', text: 'The student ' },
      { type: 'translated', text: 'Karolína', original: 'Raha' },
      { type: 'text', text: ' was arrested' }
    ],
    expected: 'The student Karolína was arrested'
  }
];

/**
 * Simulate canvas rendering (simplified - no wrapping)
 */
function simulateCanvasRendering(segments) {
  let result = '';

  for (const segment of segments) {
    if (segment.type === 'paragraph-break') {
      result += '\n\n';
    } else if (segment.type === 'source' || segment.type === 'translated') {
      // Just add the text, no automatic spacing
      result += segment.text;
    } else {
      // Text segment - render as-is
      result += segment.text;
    }
  }

  return result;
}

console.log('🧪 Testing canvas spacing logic\n');

let passed = 0;
let failed = 0;

for (const testCase of testCases) {
  const result = simulateCanvasRendering(testCase.segments);
  const success = result === testCase.expected;

  if (success) {
    console.log(`✓ ${testCase.name}`);
    console.log(`  Result: "${result}"`);
    passed++;
  } else {
    console.log(`✗ ${testCase.name}`);
    console.log(`  Expected: "${testCase.expected}"`);
    console.log(`  Got:      "${result}"`);
    failed++;
  }
  console.log();
}

console.log(`${passed} passed, ${failed} failed`);

if (failed > 0) {
  process.exit(1);
}
