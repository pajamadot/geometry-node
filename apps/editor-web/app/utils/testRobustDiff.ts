/**
 * Test the robust diff strategy with various scenarios
 */

import { RobustDiffStrategy } from './robustDiffStrategy';

export async function testRobustDiffStrategy(): Promise<void> {
  const strategy = new RobustDiffStrategy({
    fuzzyThreshold: 0.85,
    preserveIndentation: true
  });

  console.log('🔧 Testing Robust Diff Strategy...');

  // Test 1: Exact match
  console.log('\n📝 Test 1: Exact Match');
  const originalCode = `function calculateSum(a, b) {
  return a + b;
}

const result = calculateSum(5, 3);
console.log(result);`;

  const exactDiff = `<<<<<<< SEARCH
function calculateSum(a, b) {
  return a + b;
}
=======
function calculateSum(a, b, c = 0) {
  return a + b + c;
}
>>>>>>> REPLACE`;

  try {
    const result1 = await strategy.applyDiff(originalCode, exactDiff);
    console.log('✅ Success:', result1.success);
    console.log('Applied parts:', result1.appliedParts.length);
    console.log('Failed parts:', result1.failedParts.length);
    if (result1.content) {
      console.log('Result preview:', result1.content.substring(0, 100) + '...');
    }
  } catch (error) {
    console.log('❌ Error:', error);
  }

  // Test 2: Fuzzy match with slight differences
  console.log('\n📝 Test 2: Fuzzy Match (slight differences)');
  const slightlyDifferentCode = `function calculateSum(a, b) {
    return a + b; // This line has extra spaces
}

const result = calculateSum(5, 3);
console.log(result);`;

  const fuzzyDiff = `<<<<<<< SEARCH
function calculateSum(a, b) {
  return a + b;
}
=======
function calculateSum(a, b, c = 0) {
  return a + b + c;
}
>>>>>>> REPLACE`;

  try {
    const result2 = await strategy.applyDiff(slightlyDifferentCode, fuzzyDiff);
    console.log('✅ Success:', result2.success);
    console.log('Applied parts:', result2.appliedParts.length);
    console.log('Failed parts:', result2.failedParts.length);
    if (result2.failedParts.length > 0) {
      console.log('Failure reasons:', result2.failedParts.map(f => f.reason));
    }
  } catch (error) {
    console.log('❌ Error:', error);
  }

  // Test 3: Multiple hunks
  console.log('\n📝 Test 3: Multiple SEARCH/REPLACE Blocks');
  const multiHunkCode = `class Calculator {
  add(a, b) {
    return a + b;
  }
  
  subtract(a, b) {
    return a - b;
  }
}

const calc = new Calculator();`;

  const multiHunkDiff = `<<<<<<< SEARCH
  add(a, b) {
    return a + b;
  }
=======
  add(a, b, c = 0) {
    return a + b + c;
  }
>>>>>>> REPLACE

<<<<<<< SEARCH
const calc = new Calculator();
=======
const calc = new Calculator();
console.log('Calculator initialized');
>>>>>>> REPLACE`;

  try {
    const result3 = await strategy.applyDiff(multiHunkCode, multiHunkDiff);
    console.log('✅ Success:', result3.success);
    console.log('Applied parts:', result3.appliedParts.length);
    console.log('Failed parts:', result3.failedParts.length);
    if (result3.content) {
      console.log('Multi-hunk result preview:', result3.content.substring(0, 150) + '...');
    }
  } catch (error) {
    console.log('❌ Error:', error);
  }

  // Test 4: Invalid diff format
  console.log('\n📝 Test 4: Invalid Diff Format');
  const invalidDiff = `<<<<<<< SEARCH
function test() {
  return true;
}
// Missing separator and REPLACE marker`;

  try {
    const result4 = await strategy.applyDiff(originalCode, invalidDiff);
    console.log('✅ Success:', result4.success);
    console.log('Applied parts:', result4.appliedParts.length);
    console.log('Failed parts:', result4.failedParts.length);
    if (result4.failedParts.length > 0) {
      console.log('Validation errors:', result4.failedParts.map(f => f.reason));
    }
  } catch (error) {
    console.log('❌ Error:', error);
  }

  // Test 5: No match found
  console.log('\n📝 Test 5: No Match Found');
  const noMatchDiff = `<<<<<<< SEARCH
function nonExistentFunction() {
  return false;
}
=======
function nonExistentFunction() {
  return true;
}
>>>>>>> REPLACE`;

  try {
    const result5 = await strategy.applyDiff(originalCode, noMatchDiff);
    console.log('✅ Success:', result5.success);
    console.log('Applied parts:', result5.appliedParts.length);
    console.log('Failed parts:', result5.failedParts.length);
    if (result5.failedParts.length > 0) {
      console.log('No match reasons:', result5.failedParts.map(f => f.reason));
      console.log('Suggestions:', result5.failedParts.map(f => f.suggestion));
    }
  } catch (error) {
    console.log('❌ Error:', error);
  }

  console.log('\n🎉 Robust Diff Strategy Testing Complete!');
}

// Run tests if this file is executed directly
if (typeof window === 'undefined' && require.main === module) {
  testRobustDiffStrategy().catch(console.error);
} 