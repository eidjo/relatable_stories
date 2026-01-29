/**
 * Test spacing between segments
 */

// Test cases
const testCases = [
  {
    name: 'Name followed by comma',
    segments: [
      { type: 'translated', text: 'Olivia', original: 'Raha' },
      { type: 'text', text: ', a student' }
    ],
    expected: 'Olivia, a student',
    description: 'No extra space before comma'
  },
  {
    name: 'Name followed by text with leading space',
    segments: [
      { type: 'translated', text: 'Olivia', original: 'Raha' },
      { type: 'text', text: ' was a student' }
    ],
    expected: 'Olivia was a student',
    description: 'No double space - text has leading space'
  },
  {
    name: 'Name followed by text without leading space',
    segments: [
      { type: 'translated', text: 'Olivia', original: 'Raha' },
      { type: 'text', text: 'was a student' }
    ],
    expected: 'Olivia was a student',
    description: 'Space added between name and text'
  },
  {
    name: 'Text followed by name',
    segments: [
      { type: 'text', text: 'The student ' },
      { type: 'translated', text: 'Olivia', original: 'Raha' }
    ],
    expected: 'The student Olivia',
    description: 'No double space - text has trailing space'
  },
  {
    name: 'Name followed by paragraph break',
    segments: [
      { type: 'translated', text: 'Olivia', original: 'Raha' },
      { type: 'paragraph-break', text: '\\n\\n' },
      { type: 'text', text: 'Next paragraph' }
    ],
    expected: 'Olivia\n\nNext paragraph',
    description: 'No space before paragraph break'
  },
  {
    name: 'Source citation',
    segments: [
      { type: 'text', text: 'according to documents' },
      { type: 'source', text: '[1]' },
      { type: 'text', text: ', the protest' }
    ],
    expected: 'according to documents[1], the protest',
    description: 'No space before source citation, no space before comma'
  }
];

function simulateRendering(segments) {
  let result = '';

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const nextSegment = i < segments.length - 1 ? segments[i + 1] : null;

    switch (segment.type) {
      case 'translated':
        result += segment.text;
        // Check if space needed after
        if (nextSegment && nextSegment.type !== 'paragraph-break') {
          const nextText = nextSegment.text || '';
          if (nextText && !nextText.match(/^[\s.,;:!?)\]]/)) {
            result += ' ';
          }
        }
        break;

      case 'source':
        result += segment.text;
        // Check if space needed after
        if (nextSegment && nextSegment.type !== 'paragraph-break') {
          const nextText = nextSegment.text || '';
          if (nextText && !nextText.match(/^[\s.,;:!?)\]]/)) {
            result += ' ';
          }
        }
        break;

      case 'paragraph-break':
        result += '\n\n';
        break;

      case 'text':
        result += segment.text;
        break;
    }
  }

  return result;
}

console.log('🧪 Testing spacing logic\n');

let passed = 0;
let failed = 0;

for (const testCase of testCases) {
  const result = simulateRendering(testCase.segments);
  const success = result === testCase.expected;

  if (success) {
    console.log(`✓ ${testCase.name}`);
    console.log(`  ${testCase.description}`);
    passed++;
  } else {
    console.log(`✗ ${testCase.name}`);
    console.log(`  Expected: "${testCase.expected}"`);
    console.log(`  Got:      "${result}"`);
    failed++;
  }
  console.log();
}

console.log(`\n${passed} passed, ${failed} failed`);

if (failed > 0) {
  process.exit(1);
}
