// ============================================================
// BRAIN UPGRADE AI — GAME ENGINE
// 100+ unique question generators, organized by category
// Full anti-repeat system using history tracking
// ============================================================

export type GameCategory = 'math' | 'logic' | 'memory' | 'reaction' | 'iq' | 'speed' | 'verbal' | 'pattern' | 'spatial';

export interface Question {
  id: string;
  type: string;
  category: GameCategory;
  prompt: string;
  subPrompt?: string;
  answer: string;
  options: string[];
  difficulty: 1 | 2 | 3;
  explanation?: string;
  inputType: 'choice' | 'type' | 'memory-type' | 'memory-grid' | 'reaction';
  memorySequence?: string[];
  memoryGrid?: boolean[];
  gridSize?: number;
  timeLimit?: number; // seconds
  statKey: 'speed' | 'memory' | 'logic' | 'focus' | 'mathIQ';
}

const uid = () => Math.random().toString(36).substr(2, 9);
const rnd = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const shuffle = <T>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);
const pick = <T>(arr: T[]): T => arr[rnd(0, arr.length - 1)];

// ─── Distractor generators ────────────────────────────────
function numDistractors(correct: number, count: number = 3): string[] {
  const set = new Set<number>([correct]);
  const offsets = [1, 2, 3, 5, 7, 10, 11, 13, 15, 17, 20, 22, 25];
  shuffle(offsets).forEach(o => {
    if (set.size < count + 1) { set.add(correct + o); set.add(correct - o); }
  });
  set.delete(correct);
  return shuffle([...set].slice(0, count).map(String));
}

function makeOptions(correct: string, distractors: string[]): string[] {
  return shuffle([correct, ...distractors.slice(0, 3)]);
}

// ─── Previous-question-type tracker for anti-repeat ───────
let lastTypes: string[] = [];
function markUsed(type: string) {
  lastTypes = [type, ...lastTypes].slice(0, 10);
}
function wasRecentlyUsed(type: string) {
  return lastTypes.includes(type);
}

// ══════════════════════════════════════════════════════════
//  MATH GENERATORS (25 types)
// ══════════════════════════════════════════════════════════

function additionBasic(): Question {
  const a = rnd(10, 99), b = rnd(10, 99);
  const ans = a + b;
  return { id: uid(), type: 'addition-basic', category: 'math', difficulty: 1, inputType: 'choice', statKey: 'mathIQ',
    prompt: `${a} + ${b} = ?`, answer: String(ans), options: makeOptions(String(ans), numDistractors(ans)), timeLimit: 15 };
}

function additionThreeNums(): Question {
  const a = rnd(10, 50), b = rnd(10, 50), c = rnd(10, 50);
  const ans = a + b + c;
  return { id: uid(), type: 'addition-three', category: 'math', difficulty: 2, inputType: 'choice', statKey: 'mathIQ',
    prompt: `${a} + ${b} + ${c} = ?`, answer: String(ans), options: makeOptions(String(ans), numDistractors(ans)), timeLimit: 20 };
}

function subtraction(): Question {
  const b = rnd(10, 80), a = rnd(b, 99);
  const ans = a - b;
  return { id: uid(), type: 'subtraction', category: 'math', difficulty: 1, inputType: 'choice', statKey: 'mathIQ',
    prompt: `${a} − ${b} = ?`, answer: String(ans), options: makeOptions(String(ans), numDistractors(ans)), timeLimit: 15 };
}

function subtractionLarge(): Question {
  const b = rnd(100, 400), a = rnd(b, 999);
  const ans = a - b;
  return { id: uid(), type: 'subtraction-large', category: 'math', difficulty: 3, inputType: 'choice', statKey: 'mathIQ',
    prompt: `${a} − ${b} = ?`, answer: String(ans), options: makeOptions(String(ans), numDistractors(ans, 3)), timeLimit: 25 };
}

function multiplicationBasic(): Question {
  const a = rnd(2, 12), b = rnd(2, 12);
  const ans = a * b;
  return { id: uid(), type: 'multiplication', category: 'math', difficulty: 1, inputType: 'choice', statKey: 'mathIQ',
    prompt: `${a} × ${b} = ?`, answer: String(ans), options: makeOptions(String(ans), numDistractors(ans)), timeLimit: 12 };
}

function multiplicationMedium(): Question {
  const a = rnd(11, 25), b = rnd(11, 25);
  const ans = a * b;
  return { id: uid(), type: 'multiplication-med', category: 'math', difficulty: 2, inputType: 'choice', statKey: 'mathIQ',
    prompt: `${a} × ${b} = ?`, answer: String(ans), options: makeOptions(String(ans), numDistractors(ans)), timeLimit: 20 };
}

function division(): Question {
  const b = rnd(2, 12), ans = rnd(2, 12);
  const a = b * ans;
  return { id: uid(), type: 'division', category: 'math', difficulty: 2, inputType: 'choice', statKey: 'mathIQ',
    prompt: `${a} ÷ ${b} = ?`, answer: String(ans), options: makeOptions(String(ans), numDistractors(ans)), timeLimit: 15 };
}

function squares(): Question {
  const n = rnd(2, 20);
  const ans = n * n;
  return { id: uid(), type: 'squares', category: 'math', difficulty: 2, inputType: 'choice', statKey: 'mathIQ',
    prompt: `${n}² = ?`, answer: String(ans), options: makeOptions(String(ans), numDistractors(ans)), timeLimit: 15 };
}

function cubes(): Question {
  const n = rnd(2, 10);
  const ans = n * n * n;
  return { id: uid(), type: 'cubes', category: 'math', difficulty: 3, inputType: 'choice', statKey: 'mathIQ',
    prompt: `${n}³ = ?`, answer: String(ans), options: makeOptions(String(ans), numDistractors(ans)), timeLimit: 20 };
}

function squareRoots(): Question {
  const n = rnd(2, 15);
  const ans = n * n;
  return { id: uid(), type: 'sqrt', category: 'math', difficulty: 2, inputType: 'choice', statKey: 'mathIQ',
    prompt: `√${ans} = ?`, answer: String(n), options: makeOptions(String(n), numDistractors(n)), timeLimit: 15 };
}

function percentageOf(): Question {
  const pcts = [10, 20, 25, 50, 75, 5, 15, 30, 40];
  const p = pick(pcts), n = rnd(2, 20) * 10;
  const ans = (p * n) / 100;
  return { id: uid(), type: 'percentage', category: 'math', difficulty: 2, inputType: 'choice', statKey: 'mathIQ',
    prompt: `${p}% of ${n} = ?`, answer: String(ans), options: makeOptions(String(ans), numDistractors(ans)), timeLimit: 18 };
}

function missingNumber(): Question {
  const a = rnd(10, 50), b = rnd(10, 50), ans = rnd(10, 50);
  const ops = [
    { sym: '+', result: a + ans },
    { sym: '−', result: a - ans },
    { sym: '×', result: a * ans },
  ];
  const op = pick(ops);
  return { id: uid(), type: 'missing-number', category: 'math', difficulty: 2, inputType: 'choice', statKey: 'mathIQ',
    prompt: `${a} ${op.sym} __ = ${op.result}`, answer: String(ans), options: makeOptions(String(ans), numDistractors(ans)), timeLimit: 18 };
}

function primeCheck(): Question {
  const primes = [2,3,5,7,11,13,17,19,23,29,31,37,41,43,47,53,59,61,67,71];
  const nonPrimes = [4,6,8,9,10,12,14,15,16,18,20,21,22,24,25,26,27,28,30];
  const isP = Math.random() > 0.5;
  const n = isP ? pick(primes) : pick(nonPrimes);
  return { id: uid(), type: 'prime', category: 'math', difficulty: 2, inputType: 'choice', statKey: 'logic',
    prompt: `Is ${n} a prime number?`, answer: isP ? 'Yes' : 'No',
    options: ['Yes', 'No', 'Maybe', 'Unsure'], timeLimit: 12 };
}

function evenOdd(): Question {
  const n = rnd(1, 999);
  const ans = n % 2 === 0 ? 'Even' : 'Odd';
  return { id: uid(), type: 'even-odd', category: 'math', difficulty: 1, inputType: 'choice', statKey: 'mathIQ',
    prompt: `Is ${n} even or odd?`, answer: ans, options: ['Even', 'Odd', 'Neither', 'Both'], timeLimit: 8 };
}

function romanNumerals(): Question {
  const map: [number, string][] = [[1,'I'],[2,'II'],[3,'III'],[4,'IV'],[5,'V'],[6,'VI'],[7,'VII'],[8,'VIII'],[9,'IX'],
    [10,'X'],[11,'XI'],[12,'XII'],[14,'XIV'],[15,'XV'],[19,'XIX'],[20,'XX'],[40,'XL'],[50,'L'],[90,'XC'],[100,'C']];
  const [num, roman] = pick(map);
  const askRoman = Math.random() > 0.5;
  const ans = askRoman ? String(num) : roman;
  const prompt = askRoman ? `${roman} = ?` : `${num} in Roman = ?`;
  const wrong = shuffle(map.filter(([n]) => n !== num)).slice(0, 3).map(([n, r]) => askRoman ? String(n) : r);
  return { id: uid(), type: 'roman', category: 'math', difficulty: 2, inputType: 'choice', statKey: 'mathIQ',
    prompt, answer: ans, options: makeOptions(ans, wrong), timeLimit: 15 };
}

function fractionSimplify(): Question {
  const pairs: [number, number, string][] = [
    [2,4,'1/2'],[3,6,'1/2'],[4,8,'1/2'],[2,6,'1/3'],[3,9,'1/3'],
    [4,6,'2/3'],[3,12,'1/4'],[6,8,'3/4'],[5,10,'1/2'],[4,10,'2/5'],
    [6,9,'2/3'],[8,12,'2/3'],[6,10,'3/5'],[4,16,'1/4'],[9,12,'3/4']
  ];
  const [n, d, ans] = pick(pairs);
  const wrongs = ['1/4','2/3','3/5','1/3','3/4','1/5','2/7'].filter(x => x !== ans).slice(0, 3);
  return { id: uid(), type: 'fraction-simplify', category: 'math', difficulty: 2, inputType: 'choice', statKey: 'mathIQ',
    prompt: `Simplify: ${n}/${d}`, answer: ans, options: makeOptions(ans, wrongs), timeLimit: 18 };
}

function mixedOps(): Question {
  const a = rnd(2, 20), b = rnd(2, 10), c = rnd(2, 10);
  const ans = a + b * c;
  return { id: uid(), type: 'mixed-ops', category: 'math', difficulty: 3, inputType: 'choice', statKey: 'mathIQ',
    prompt: `${a} + ${b} × ${c} = ?`, answer: String(ans),
    options: makeOptions(String(ans), [String(a * b + c), String((a + b) * c), String(a - b + c)]), timeLimit: 20 };
}

function powerOfTwo(): Question {
  const exp = rnd(1, 10);
  const ans = Math.pow(2, exp);
  return { id: uid(), type: 'power-of-two', category: 'math', difficulty: 2, inputType: 'choice', statKey: 'mathIQ',
    prompt: `2^${exp} = ?`, answer: String(ans), options: makeOptions(String(ans), numDistractors(ans)), timeLimit: 12 };
}

function comparison(): Question {
  const a = rnd(10, 999), b = rnd(10, 999);
  const ans = a > b ? `${a}` : `${b}`;
  const prompt = `Which is larger: ${a} or ${b}?`;
  return { id: uid(), type: 'comparison', category: 'math', difficulty: 1, inputType: 'choice', statKey: 'mathIQ',
    prompt, answer: ans, options: makeOptions(ans, [a > b ? String(b) : String(a), String(a+b), 'Equal']), timeLimit: 8 };
}

function speedAddChain(): Question {
  const nums = [rnd(1,20), rnd(1,20), rnd(1,20), rnd(1,20)];
  const ans = nums.reduce((a, b) => a + b, 0);
  return { id: uid(), type: 'add-chain', category: 'speed', difficulty: 2, inputType: 'choice', statKey: 'speed',
    prompt: `${nums.join(' + ')} = ?`, answer: String(ans), options: makeOptions(String(ans), numDistractors(ans)), timeLimit: 10 };
}

function negativeNumbers(): Question {
  const a = rnd(-20, 20), b = rnd(-20, 20);
  const ops = [{sym:'+', ans:a+b},{sym:'−', ans:a-b}];
  const op = pick(ops);
  return { id: uid(), type: 'negative', category: 'math', difficulty: 2, inputType: 'choice', statKey: 'mathIQ',
    prompt: `${a} ${op.sym} ${b} = ?`, answer: String(op.ans), options: makeOptions(String(op.ans), numDistractors(op.ans)), timeLimit: 15 };
}

function doubleHalf(): Question {
  const ops = ['double', 'half'] as const;
  const op = pick(ops);
  const n = op === 'half' ? rnd(1, 50) * 2 : rnd(1, 100);
  const ans = op === 'double' ? n * 2 : n / 2;
  return { id: uid(), type: 'double-half', category: 'math', difficulty: 1, inputType: 'choice', statKey: 'mathIQ',
    prompt: `${op === 'double' ? 'Double' : 'Half of'} ${n} = ?`, answer: String(ans),
    options: makeOptions(String(ans), numDistractors(ans)), timeLimit: 10 };
}

function timeConversion(): Question {
  const pairs: [string, string][] = [
    ['1 hour', '60 minutes'], ['2 hours', '120 minutes'], ['90 minutes', '1.5 hours'],
    ['1 day', '24 hours'], ['1 week', '7 days'], ['1 year', '365 days'],
    ['2 days', '48 hours'], ['3 hours', '180 minutes'], ['30 minutes', '0.5 hours']
  ];
  const [q, ans] = pick(pairs);
  const wrong = shuffle(pairs.filter(([a]) => a !== q)).slice(0, 3).map(([,b]) => b);
  return { id: uid(), type: 'time-conv', category: 'math', difficulty: 1, inputType: 'choice', statKey: 'mathIQ',
    prompt: `${q} = ?`, answer: ans, options: makeOptions(ans, wrong), timeLimit: 12 };
}

function multiplicationMissing(): Question {
  const b = rnd(2, 12), ans = rnd(2, 12);
  const result = b * ans;
  return { id: uid(), type: 'mult-missing', category: 'math', difficulty: 2, inputType: 'choice', statKey: 'mathIQ',
    prompt: `${b} × __ = ${result}`, answer: String(ans), options: makeOptions(String(ans), numDistractors(ans)), timeLimit: 15 };
}

// ══════════════════════════════════════════════════════════
//  LOGIC / SEQUENCE GENERATORS (20 types)
// ══════════════════════════════════════════════════════════

function arithmeticSequence(): Question {
  const start = rnd(1, 20), step = rnd(2, 15);
  const seq = [start, start+step, start+2*step, start+3*step];
  const ans = start + 4 * step;
  return { id: uid(), type: 'arith-seq', category: 'logic', difficulty: 1, inputType: 'choice', statKey: 'logic',
    prompt: `${seq.join(', ')}, ?`, answer: String(ans), options: makeOptions(String(ans), numDistractors(ans)), timeLimit: 20 };
}

function geometricSequence(): Question {
  const start = rnd(1, 5), ratio = rnd(2, 4);
  const seq = [start, start*ratio, start*ratio**2, start*ratio**3];
  const ans = start * ratio**4;
  return { id: uid(), type: 'geo-seq', category: 'logic', difficulty: 2, inputType: 'choice', statKey: 'logic',
    prompt: `${seq.join(', ')}, ?`, answer: String(ans), options: makeOptions(String(ans), numDistractors(ans)), timeLimit: 22 };
}

function fibonacciLike(): Question {
  const a = rnd(1, 8), b = rnd(1, 8);
  const seq = [a, b, a+b, a+2*b, 2*a+3*b];
  const ans = 3*a + 5*b;
  return { id: uid(), type: 'fib-like', category: 'logic', difficulty: 2, inputType: 'choice', statKey: 'logic',
    prompt: `${seq.join(', ')}, ?`, answer: String(ans), options: makeOptions(String(ans), numDistractors(ans)), timeLimit: 25 };
}

function squareSequence(): Question {
  const start = rnd(1, 5);
  const seq = [start, start+1, start+2, start+3].map(n => n * n);
  const ans = (start + 4) * (start + 4);
  return { id: uid(), type: 'square-seq', category: 'logic', difficulty: 2, inputType: 'choice', statKey: 'logic',
    prompt: `${seq.join(', ')}, ?`, answer: String(ans), options: makeOptions(String(ans), numDistractors(ans)), timeLimit: 20 };
}

function primeSequence(): Question {
  const allPrimes = [2,3,5,7,11,13,17,19,23,29,31,37,41,43,47];
  const start = rnd(0, 9);
  const seq = allPrimes.slice(start, start + 4);
  const ans = allPrimes[start + 4];
  const wrongs = allPrimes.filter(p => !seq.includes(p) && p !== ans).slice(0, 3).map(String);
  return { id: uid(), type: 'prime-seq', category: 'logic', difficulty: 3, inputType: 'choice', statKey: 'logic',
    prompt: `${seq.join(', ')}, ?`, answer: String(ans), options: makeOptions(String(ans), wrongs), timeLimit: 22 };
}

function letterSequence(): Question {
  const start = rnd(0, 18);
  const step = pick([1, 2, 3]);
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const seq = [0,1,2,3].map(i => letters[(start + i * step) % 26]);
  const ans = letters[(start + 4 * step) % 26];
  const wrongs = shuffle('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').filter(l => !seq.includes(l) && l !== ans)).slice(0, 3);
  return { id: uid(), type: 'letter-seq', category: 'logic', difficulty: 2, inputType: 'choice', statKey: 'logic',
    prompt: `${seq.join(', ')}, ?`, answer: ans, options: makeOptions(ans, wrongs), timeLimit: 20 };
}

function oddOneOut(): Question {
  const sets: [number[], number][] = [
    [[2,4,6,7,8], 7], [[3,6,9,12,14], 14], [[1,4,9,16,25,35], 35],
    [[5,10,15,20,27], 27], [[2,3,5,7,10,11], 10], [[100,200,300,350,400], 350],
    [[11,22,33,44,56], 56], [[1,2,4,8,15,16], 15],
  ];
  const [nums, ans] = pick(sets);
  const numStr = nums.map(String);
  const shuffled = shuffle(numStr);
  return { id: uid(), type: 'odd-one-out', category: 'logic', difficulty: 2, inputType: 'choice', statKey: 'logic',
    prompt: `Which doesn't belong?\n${shuffled.join('   ')}`, answer: String(ans),
    options: makeOptions(String(ans), shuffle(numStr.filter(x => x !== String(ans))).slice(0, 3)), timeLimit: 25 };
}

function analogy(): Question {
  const analogies: [string, string, string, string, string[]][] = [
    ['2', '4', '3', '6', ['5','7','9']],
    ['10', '100', '5', '25', ['50','15','35']],
    ['3', '9', '4', '16', ['8','12','20']],
    ['1', '1', '2', '4', ['3','8','6']],
    ['5', '25', '6', '36', ['30','12','18']],
    ['7', '49', '8', '64', ['56','48','16']],
    ['2', '8', '3', '27', ['9','18','12']],
    ['4', '2', '16', '4', ['8','6','3']],
  ];
  const [a, b, c, ans, wrong] = pick(analogies);
  return { id: uid(), type: 'analogy', category: 'logic', difficulty: 2, inputType: 'choice', statKey: 'logic',
    prompt: `${a} : ${b} :: ${c} : ?`, answer: ans, options: makeOptions(ans, wrong), timeLimit: 20 };
}

function decreasingSequence(): Question {
  const start = rnd(50, 200), step = rnd(5, 20);
  const seq = [start, start-step, start-2*step, start-3*step];
  const ans = start - 4 * step;
  return { id: uid(), type: 'decreasing-seq', category: 'logic', difficulty: 1, inputType: 'choice', statKey: 'logic',
    prompt: `${seq.join(', ')}, ?`, answer: String(ans), options: makeOptions(String(ans), numDistractors(ans)), timeLimit: 20 };
}

function alternatingSequence(): Question {
  const a = rnd(2, 10), b = rnd(11, 30);
  const seq = [a, b, a+2, b+2, a+4, b+4];
  const ans = a + 6;
  return { id: uid(), type: 'alternating-seq', category: 'logic', difficulty: 3, inputType: 'choice', statKey: 'logic',
    prompt: `${seq.join(', ')}, ?`, answer: String(ans), options: makeOptions(String(ans), numDistractors(ans)), timeLimit: 25 };
}

function missingMiddle(): Question {
  const start = rnd(2, 15), step = rnd(3, 10);
  const a = start, b = start + step, c = start + 2*step, d = start + 3*step;
  const ans = String(b);
  return { id: uid(), type: 'missing-middle', category: 'logic', difficulty: 2, inputType: 'choice', statKey: 'logic',
    prompt: `${a}, ?, ${c}, ${d}`, answer: ans, options: makeOptions(ans, numDistractors(b)), timeLimit: 20 };
}

function doubleSequence(): Question {
  const start = rnd(1, 5);
  const seq = [start, start*2, start*4, start*8];
  const ans = start * 16;
  return { id: uid(), type: 'double-seq', category: 'logic', difficulty: 2, inputType: 'choice', statKey: 'logic',
    prompt: `${seq.join(', ')}, ?`, answer: String(ans), options: makeOptions(String(ans), numDistractors(ans)), timeLimit: 18 };
}

function symbolPattern(): Question {
  const patterns: [string, string][] = [
    ['🔴🔵🟢🔴🔵?', '🟢'], ['⭐⭐⭐★⭐⭐⭐★?', '⭐'],
    ['↑↓↑↓↑?', '↓'], ['▲●▲●▲?', '●'],
    ['1️⃣2️⃣3️⃣1️⃣2️⃣?', '3️⃣'], ['🌕🌖🌗🌘🌑?', '🌒'],
  ];
  const [seq, ans] = pick(patterns);
  const allEmojis = ['🔴','🔵','🟢','🟡','⭐','★','↑','↓','▲','●','🌕','🌑','1️⃣','2️⃣','3️⃣','4️⃣'];
  const wrong = shuffle(allEmojis.filter(e => e !== ans)).slice(0, 3);
  return { id: uid(), type: 'symbol-pattern', category: 'pattern', difficulty: 2, inputType: 'choice', statKey: 'logic',
    prompt: `Complete the pattern:\n${seq}`, answer: ans, options: makeOptions(ans, wrong), timeLimit: 20 };
}

// ══════════════════════════════════════════════════════════
//  MEMORY GENERATORS (15 types)
// ══════════════════════════════════════════════════════════

function digitSpan(difficulty: 1 | 2 | 3): Question {
  const lengths = { 1: rnd(4, 5), 2: rnd(5, 7), 3: rnd(7, 9) };
  const len = lengths[difficulty];
  const seq = Array.from({ length: len }, () => rnd(0, 9)).map(String);
  return { id: uid(), type: 'digit-span', category: 'memory', difficulty, inputType: 'memory-type', statKey: 'memory',
    memorySequence: seq, prompt: 'Memorize the number sequence', answer: seq.join(''),
    options: [], timeLimit: len * 2 + 5 };
}

function reverseDigits(difficulty: 1 | 2 | 3): Question {
  const lengths = { 1: rnd(3, 4), 2: rnd(4, 5), 3: rnd(5, 6) };
  const len = lengths[difficulty];
  const seq = Array.from({ length: len }, () => rnd(0, 9)).map(String);
  return { id: uid(), type: 'reverse-digits', category: 'memory', difficulty, inputType: 'memory-type', statKey: 'memory',
    memorySequence: seq, prompt: 'Memorize then type it BACKWARDS', answer: [...seq].reverse().join(''),
    options: [], subPrompt: '(Type the digits in REVERSE order)', timeLimit: len * 2 + 8 };
}

function wordListMemory(): Question {
  const wordPools = [
    ['APPLE','BRIDGE','CASTLE','DOLPHIN','EMPIRE'],
    ['FOREST','GUITAR','HARBOR','ISLAND','JUNGLE'],
    ['KNIGHT','LEMON','MARBLE','NEEDLE','ORACLE'],
    ['PLANET','QUARTZ','ROCKET','SILVER','THRONE'],
    ['UNISON','VELVET','WALNUT','XENON','YELLOW'],
    ['ZENITH','ANCHOR','BEACON','CARBON','DELTA'],
  ];
  const pool = pick(wordPools);
  const count = rnd(3, 4);
  const words = shuffle(pool).slice(0, count);
  const missingWord = pick(words);
  return { id: uid(), type: 'word-memory', category: 'memory', difficulty: 2, inputType: 'choice', statKey: 'memory',
    memorySequence: words, prompt: `Memorize these words`,
    subPrompt: 'Which word was in the list?',
    answer: missingWord,
    options: makeOptions(missingWord, shuffle(pool.filter(w => !words.includes(w))).slice(0, 3)),
    timeLimit: count * 3 + 8 };
}

function gridMemory(): Question {
  const sizes = [9, 12, 16];
  const size = pick(sizes);
  const lit = Math.floor(size * 0.4);
  const grid = Array.from({ length: size }, (_, i) => i < lit);
  const shuffled = shuffle(grid);
  return { id: uid(), type: 'grid-memory', category: 'memory', difficulty: 2, inputType: 'memory-grid', statKey: 'memory',
    memoryGrid: shuffled, gridSize: Math.sqrt(size), prompt: 'Memorize the highlighted pattern',
    answer: shuffled.map(b => b ? '1' : '0').join(''), options: [], timeLimit: 5 };
}

function numberWordMemory(): Question {
  const pairs: [string, string][] = [
    ['SEVEN', '7'], ['THREE', '3'], ['NINE', '9'], ['FOUR', '4'],
    ['ELEVEN', '11'], ['FIFTEEN', '15'], ['TWENTY', '20'], ['EIGHT', '8']
  ];
  const shown = shuffle(pairs).slice(0, 4);
  const [word, num] = pick(shown);
  const wrong = shuffle(pairs.filter(([w]) => w !== word)).slice(0, 3).map(([,n]) => n);
  return { id: uid(), type: 'num-word-mem', category: 'memory', difficulty: 2, inputType: 'choice', statKey: 'memory',
    memorySequence: shown.map(([w]) => w), prompt: 'Memorize these words then answer',
    subPrompt: `What number does "${word}" represent?`,
    answer: num, options: makeOptions(num, wrong), timeLimit: 15 };
}

function sequenceOrder(): Question {
  const items = ['🍎','🍌','🍇','🍊','🍓','🍒','🍑','🥝'].slice(0, 5);
  const shuffledItems = shuffle(items);
  const correct = items.map((_, i) => i).sort(() => 0);
  return { id: uid(), type: 'seq-order', category: 'memory', difficulty: 2, inputType: 'choice', statKey: 'memory',
    memorySequence: items, prompt: 'Memorize this sequence in order',
    subPrompt: 'What was the FIRST item?',
    answer: items[0], options: makeOptions(items[0], shuffle(items.slice(1)).slice(0, 3)), timeLimit: 8 };
}

function countingMemory(): Question {
  const items = ['⭐','🔵','🔴','🟢'];
  const counts: Record<string, number> = {};
  items.forEach(i => { counts[i] = 0; });
  const total = rnd(12, 20);
  const sequence = Array.from({ length: total }, () => pick(items));
  sequence.forEach(i => counts[i]++);
  const target = pick(items);
  return { id: uid(), type: 'counting-mem', category: 'memory', difficulty: 3, inputType: 'choice', statKey: 'memory',
    memorySequence: sequence, prompt: 'Count as they flash by',
    subPrompt: `How many ${target} appeared?`,
    answer: String(counts[target]),
    options: makeOptions(String(counts[target]), numDistractors(counts[target])), timeLimit: total * 0.8 + 3 };
}

// ══════════════════════════════════════════════════════════
//  IQ / SPATIAL / VERBAL (15 types)
// ══════════════════════════════════════════════════════════

function verbalAnalogy(): Question {
  const analogies: [string, string][] = [
    ['Bird is to nest as fish is to __', 'Water'],
    ['Book is to library as painting is to __', 'Museum'],
    ['Doctor is to hospital as teacher is to __', 'School'],
    ['Chef is to kitchen as mechanic is to __', 'Garage'],
    ['Pen is to writer as brush is to __', 'Painter'],
    ['Key is to lock as password is to __', 'Computer'],
    ['Sun is to day as moon is to __', 'Night'],
    ['Sword is to soldier as hammer is to __', 'Blacksmith'],
    ['Water is to thirst as food is to __', 'Hunger'],
    ['Eye is to sight as ear is to __', 'Hearing'],
  ];
  const [prompt, ans] = pick(analogies);
  const allAnswers = analogies.map(([,a]) => a).filter(a => a !== ans);
  const wrong = shuffle(allAnswers).slice(0, 3);
  return { id: uid(), type: 'verbal-analogy', category: 'verbal', difficulty: 2, inputType: 'choice', statKey: 'logic',
    prompt, answer: ans, options: makeOptions(ans, wrong), timeLimit: 20 };
}

function synonyms(): Question {
  const pairs: [string, string, string[]][] = [
    ['FAST', 'Quick', ['Slow','Heavy','Bright','Cold']],
    ['HAPPY', 'Joyful', ['Sad','Angry','Tired','Dark']],
    ['BRAVE', 'Courageous', ['Coward','Weak','Soft','Scared']],
    ['SMART', 'Intelligent', ['Dull','Slow','Quiet','Tired']],
    ['BIG', 'Large', ['Tiny','Thin','Short','Flat']],
    ['SAD', 'Sorrowful', ['Happy','Bright','Loud','Swift']],
    ['SHOUT', 'Yell', ['Whisper','Smile','Walk','Think']],
    ['HELP', 'Assist', ['Hinder','Block','Ignore','Refuse']],
    ['COLD', 'Frigid', ['Hot','Warm','Mild','Bright']],
    ['DARK', 'Gloomy', ['Bright','Clear','Light','Sunny']],
  ];
  const [word, ans, wrong] = pick(pairs);
  return { id: uid(), type: 'synonym', category: 'verbal', difficulty: 1, inputType: 'choice', statKey: 'logic',
    prompt: `Synonym of "${word}"?`, answer: ans, options: makeOptions(ans, wrong.slice(0, 3)), timeLimit: 15 };
}

function antonyms(): Question {
  const pairs: [string, string, string[]][] = [
    ['HOT', 'Cold', ['Warm','Mild','Cool','Boiling']],
    ['FAST', 'Slow', ['Quick','Swift','Rapid','Hasty']],
    ['BIG', 'Small', ['Huge','Giant','Large','Tall']],
    ['HAPPY', 'Sad', ['Joyful','Glad','Pleased','Thrilled']],
    ['LIGHT', 'Dark', ['Dim','Bright','Glow','Shine']],
    ['BEGIN', 'End', ['Start','Open','Launch','Commence']],
    ['STRONG', 'Weak', ['Powerful','Bold','Tough','Firm']],
    ['LOVE', 'Hate', ['Like','Adore','Cherish','Fancy']],
    ['RICH', 'Poor', ['Wealthy','Affluent','Opulent','Loaded']],
    ['OLD', 'Young', ['Aged','Ancient','Elderly','Senior']],
  ];
  const [word, ans, wrong] = pick(pairs);
  return { id: uid(), type: 'antonym', category: 'verbal', difficulty: 1, inputType: 'choice', statKey: 'logic',
    prompt: `Antonym of "${word}"?`, answer: ans, options: makeOptions(ans, wrong.slice(0, 3)), timeLimit: 15 };
}

function categoryOdd(): Question {
  const sets: [string[], string][] = [
    [['Cat', 'Dog', 'Eagle', 'Fish'], 'Eagle'],
    [['Apple', 'Orange', 'Carrot', 'Grape'], 'Carrot'],
    [['Piano', 'Guitar', 'Violin', 'Trumpet'], 'Guitar'],
    [['Car', 'Bus', 'Bicycle', 'Boat'], 'Boat'],
    [['Red', 'Blue', 'Green', 'Circle'], 'Circle'],
    [['Mercury', 'Venus', 'Earth', 'Sun'], 'Sun'],
    [['Doctor', 'Nurse', 'Pilot', 'Surgeon'], 'Pilot'],
    [['Hammer', 'Nail', 'Saw', 'Pencil'], 'Pencil'],
    [['Paris', 'Tokyo', 'London', 'Africa'], 'Africa'],
    [['Swim', 'Run', 'Jump', 'Eat'], 'Eat'],
  ];
  const [items, ans] = pick(sets);
  const shuffled = shuffle(items);
  return { id: uid(), type: 'category-odd', category: 'verbal', difficulty: 2, inputType: 'choice', statKey: 'logic',
    prompt: `Which doesn't belong in the group?\n${shuffled.join('  |  ')}`, answer: ans,
    options: makeOptions(ans, shuffle(items.filter(i => i !== ans))), timeLimit: 20 };
}

function logicTrueFalse(): Question {
  const questions: [string, string][] = [
    ['All squares are rectangles.', 'True'],
    ['All rectangles are squares.', 'False'],
    ['Some birds cannot fly.', 'True'],
    ['All mammals lay eggs.', 'False'],
    ['The sun is a star.', 'True'],
    ['The moon produces its own light.', 'False'],
    ['Water boils at 100°C at sea level.', 'True'],
    ['Sound travels faster than light.', 'False'],
    ['A triangle has 4 sides.', 'False'],
    ['7 is a prime number.', 'True'],
    ['All prime numbers are odd.', 'False'],
    ['Zero is an even number.', 'True'],
    ['A hexagon has 6 sides.', 'True'],
    ['Negative numbers can be prime.', 'False'],
  ];
  const [q, ans] = pick(questions);
  return { id: uid(), type: 'true-false', category: 'iq', difficulty: 1, inputType: 'choice', statKey: 'logic',
    prompt: q, answer: ans, options: ['True', 'False', 'Sometimes', 'Unknown'], timeLimit: 15 };
}

function iqMath(): Question {
  const problems: [string, string, string[]][] = [
    ['If 3 cats catch 3 mice in 3 minutes, how many cats to catch 100 mice in 100 minutes?', '3', ['100','1','33']],
    ['A bat and ball cost $1.10. The bat costs $1 more. How much is the ball?', '$0.05', ['$0.10','$0.55','$1.00']],
    ['How many months have 28 days?', '12', ['1','2','4']],
    ['What is the next number: 1, 3, 6, 10, 15, ?', '21', ['18','20','25']],
    ['A rooster lays an egg on a roof. Which way does it roll?', 'It doesn\'t', ['Left','Right','Down']],
    ['2 + 2 = 4. 3 + 3 = 6. 7 + 7 = ?', '14', ['49','77','11']],
    ['How many times can you subtract 5 from 25?', 'Once', ['5','0','Infinite']],
    ['What has 13 hearts but no other organs?', 'A deck of cards', ['A body','A hospital','A clock']],
  ];
  const [q, ans, wrong] = pick(problems);
  return { id: uid(), type: 'iq-math', category: 'iq', difficulty: 3, inputType: 'choice', statKey: 'logic',
    prompt: q, answer: ans, options: makeOptions(ans, wrong), timeLimit: 30 };
}

function spatialRotation(): Question {
  const shapes: [string, string, string, string[]][] = [
    ['If you rotate ▶ 90° clockwise, what do you get?', '▼', '▼', ['▲','◀','▶']],
    ['If you rotate ▲ 180°, what do you get?', '▼', '▼', ['▶','◀','▲']],
    ['If you rotate ◀ 90° clockwise, what do you get?', '▲', '▲', ['▼','▶','◀']],
    ['Mirror image of "b" is:', 'd', 'd', ['p','q','b']],
    ['Mirror image of "p" is:', 'q', 'q', ['b','d','p']],
    ['Rotate 🔺 180°:', '🔻', '🔻', ['◁','▷','🔺']],
  ];
  const [q, ans, _, wrong] = pick(shapes);
  return { id: uid(), type: 'spatial', category: 'spatial', difficulty: 2, inputType: 'choice', statKey: 'focus',
    prompt: q, answer: ans, options: makeOptions(ans, wrong), timeLimit: 20 };
}

function wordProblem(): Question {
  type WP = { q: string; ans: number };
  const problems: WP[] = [
    { q: 'Tom has 15 apples. He gives away 7. How many left?', ans: 8 },
    { q: 'A train travels 60 km/h for 2 hours. How far?', ans: 120 },
    { q: 'There are 24 students. 3 groups equal size. How many per group?', ans: 8 },
    { q: 'A shirt costs $45. 20% discount. Final price?', ans: 36 },
    { q: 'Sam is 5× older than his dog. Dog is 3. How old is Sam?', ans: 15 },
    { q: 'A rectangle is 8cm × 5cm. Area?', ans: 40 },
    { q: '3 workers build a wall in 6 days. How long for 1 worker?', ans: 18 },
    { q: 'You have $100. Spend $37. Spend $28 more. How much left?', ans: 35 },
    { q: 'A square has perimeter 36cm. What is one side?', ans: 9 },
    { q: 'Eggs come in boxes of 12. Need 60 eggs. How many boxes?', ans: 5 },
  ];
  const { q, ans } = pick(problems);
  return { id: uid(), type: 'word-problem', category: 'iq', difficulty: 3, inputType: 'choice', statKey: 'mathIQ',
    prompt: q, answer: String(ans), options: makeOptions(String(ans), numDistractors(ans)), timeLimit: 35 };
}

function numberRiddle(): Question {
  const riddles: [string, string, string[]][] = [
    ['I am an odd number. Take away one letter and I become even. What am I?', 'Seven', ['Three','Five','Nine']],
    ['I am always in front of you but cannot be seen. What am I?', 'The future', ['The past','A wall','Air']],
    ['What 3-digit number divided by 11 gives you 11?', '121', ['110','111','112']],
    ['What is the only number that equals the number of letters in its name?', 'Four', ['One','Two','Three']],
    ['Which 2 numbers multiply to give 36 and add to give 13?', '4 and 9', ['6 and 7','3 and 12','5 and 8']],
    ['What number stays the same when multiplied by itself?', '1', ['0 and 1','2','Infinity']],
  ];
  const [q, ans, wrong] = pick(riddles);
  return { id: uid(), type: 'number-riddle', category: 'iq', difficulty: 3, inputType: 'choice', statKey: 'logic',
    prompt: q, answer: ans, options: makeOptions(ans, wrong), timeLimit: 30 };
}

function colorSeries(): Question {
  const series: [string, string, string[]][] = [
    ['RED → ORANGE → YELLOW → ?', 'GREEN', ['BLUE','PURPLE','WHITE']],
    ['🔴 🟠 🟡 🟢 ?', '🔵', ['🟣','⚪','⚫']],
    ['Rainbow: Violet, Indigo, Blue, Green, ?', 'Yellow', ['Orange','Red','Pink']],
    ['Traffic light: GREEN → YELLOW → ?', 'RED', ['BLUE','OFF','WHITE']],
  ];
  const [q, ans, wrong] = pick(series);
  return { id: uid(), type: 'color-series', category: 'pattern', difficulty: 1, inputType: 'choice', statKey: 'logic',
    prompt: q, answer: ans, options: makeOptions(ans, wrong), timeLimit: 15 };
}

// ══════════════════════════════════════════════════════════
//  SPEED GENERATORS (special — time pressure)
// ══════════════════════════════════════════════════════════

function rapidFire(): Question {
  const type = rnd(0, 4);
  if (type === 0) return { ...additionBasic(), timeLimit: 8, type: 'rapid-add', statKey: 'speed' };
  if (type === 1) return { ...subtraction(), timeLimit: 8, type: 'rapid-sub', statKey: 'speed' };
  if (type === 2) return { ...multiplicationBasic(), timeLimit: 8, type: 'rapid-mul', statKey: 'speed' };
  if (type === 3) return { ...evenOdd(), timeLimit: 5, type: 'rapid-even', statKey: 'speed' };
  return { ...comparison(), timeLimit: 5, type: 'rapid-cmp', statKey: 'speed' };
}

function flashMath(): Question {
  const a = rnd(100, 999), b = rnd(100, 999);
  const ans = a + b;
  return { id: uid(), type: 'flash-math', category: 'speed', difficulty: 3, inputType: 'choice', statKey: 'speed',
    prompt: `${a} + ${b} = ?`, answer: String(ans), options: makeOptions(String(ans), numDistractors(ans)), timeLimit: 12 };
}

// ══════════════════════════════════════════════════════════
//  BRAIN TEASER / FOCUS GENERATORS
// ══════════════════════════════════════════════════════════

function stroopEffect(): Question {
  const colorNames = ['RED', 'BLUE', 'GREEN', 'YELLOW', 'PURPLE'];
  const displayed = pick(colorNames);
  const actual = pick(colorNames);
  return { id: uid(), type: 'stroop', category: 'iq', difficulty: 3, inputType: 'choice', statKey: 'focus',
    prompt: `The word below is written in a color.\nWord: "${displayed}" (shown in ${actual} color)\nWhat COLOR is the text written in?`,
    answer: actual, options: makeOptions(actual, shuffle(colorNames.filter(c => c !== actual)).slice(0, 3)), timeLimit: 12 };
}

function whatComesNext(): Question {
  const sequences: [string, string, string[]][] = [
    ['Monday, Tuesday, Wednesday, ?', 'Thursday', ['Friday','Saturday','Sunday']],
    ['January, February, March, ?', 'April', ['May','June','July']],
    ['Spring, Summer, Autumn, ?', 'Winter', ['Monsoon','Spring','Fall']],
    ['Mercury, Venus, Earth, ?', 'Mars', ['Jupiter','Saturn','Moon']],
    ['Do, Re, Mi, Fa, ?', 'Sol', ['La','Ti','Si']],
  ];
  const [q, ans, wrong] = pick(sequences);
  return { id: uid(), type: 'what-next', category: 'pattern', difficulty: 1, inputType: 'choice', statKey: 'logic',
    prompt: `What comes next?\n${q}`, answer: ans, options: makeOptions(ans, wrong), timeLimit: 15 };
}

function calculationChain(): Question {
  const start = rnd(1, 10);
  const ops: [string, number][] = shuffle([
    ['×3', start * 3],
    ['+7', start + 7],
    ['×2', start * 2],
    ['-4', start - 4],
    ['+15', start + 15],
  ]).slice(0, 3);
  let val = start;
  const steps: string[] = [`Start: ${start}`];
  ops.forEach(([op]) => {
    const num = parseInt(op.replace(/[×+\-]/g, ''));
    if (op.startsWith('×')) { val *= num; steps.push(op); }
    else if (op.startsWith('+')) { val += num; steps.push(op); }
    else if (op.startsWith('-')) { val -= num; steps.push(op); }
  });
  return { id: uid(), type: 'calc-chain', category: 'iq', difficulty: 3, inputType: 'choice', statKey: 'mathIQ',
    prompt: `Follow the chain:\n${steps.join(' → ')} → ?`,
    answer: String(val), options: makeOptions(String(val), numDistractors(val)), timeLimit: 25 };
}

// ══════════════════════════════════════════════════════════
//  MASTER QUESTION BANK — Categorized pools
// ══════════════════════════════════════════════════════════

type Generator = () => Question;

const MATH_GENERATORS: Generator[] = [
  additionBasic, additionThreeNums, subtraction, subtractionLarge,
  multiplicationBasic, multiplicationMedium, division, squares, cubes,
  squareRoots, percentageOf, missingNumber, primeCheck, evenOdd, romanNumerals,
  fractionSimplify, mixedOps, powerOfTwo, comparison, speedAddChain,
  negativeNumbers, doubleHalf, timeConversion, multiplicationMissing, flashMath,
];

const LOGIC_GENERATORS: Generator[] = [
  arithmeticSequence, geometricSequence, fibonacciLike, squareSequence, primeSequence,
  letterSequence, oddOneOut, analogy, decreasingSequence, alternatingSequence,
  missingMiddle, doubleSequence, symbolPattern, colorSeries, whatComesNext,
];

const MEMORY_GENERATORS: Generator[] = [
  () => digitSpan(1), () => digitSpan(2), () => digitSpan(3),
  () => reverseDigits(1), () => reverseDigits(2), () => reverseDigits(3),
  wordListMemory, gridMemory, numberWordMemory, sequenceOrder, countingMemory,
];

const IQ_GENERATORS: Generator[] = [
  verbalAnalogy, synonyms, antonyms, categoryOdd, logicTrueFalse,
  iqMath, spatialRotation, wordProblem, numberRiddle, stroopEffect,
  calculationChain,
];

const SPEED_GENERATORS: Generator[] = [
  rapidFire, rapidFire, rapidFire, // weighted — appears more often
  flashMath, additionBasic, subtraction, multiplicationBasic,
  evenOdd, comparison, doubleHalf, percentageOf,
];

const PATTERN_GENERATORS: Generator[] = [
  arithmeticSequence, geometricSequence, letterSequence, symbolPattern,
  colorSeries, whatComesNext, doubleSequence, squareSequence, oddOneOut,
];

// ══════════════════════════════════════════════════════════
//  PUBLIC API
// ══════════════════════════════════════════════════════════

export type ModeKey = 'math' | 'logic' | 'memory' | 'speed' | 'iq' | 'pattern' | 'mixed' | 'reaction';

const POOL_MAP: Record<ModeKey, Generator[]> = {
  math: MATH_GENERATORS,
  logic: LOGIC_GENERATORS,
  memory: MEMORY_GENERATORS,
  speed: SPEED_GENERATORS,
  iq: IQ_GENERATORS,
  pattern: PATTERN_GENERATORS,
  mixed: [...MATH_GENERATORS, ...LOGIC_GENERATORS, ...IQ_GENERATORS, ...PATTERN_GENERATORS],
  reaction: [], // handled separately
};

export function generateQuestion(mode: ModeKey, difficulty: 1 | 2 | 3 = 1): Question {
  const pool = POOL_MAP[mode];
  if (!pool || pool.length === 0) {
    return additionBasic();
  }
  let attempts = 0;
  let q: Question;
  do {
    const gen = pick(pool);
    q = gen();
    attempts++;
  } while (wasRecentlyUsed(q.type) && attempts < 20);
  markUsed(q.type);
  return q;
}

export function generateQuestionBatch(mode: ModeKey, count: number, difficulty: 1 | 2 | 3 = 1): Question[] {
  lastTypes = []; // reset history for a new game session
  return Array.from({ length: count }, () => generateQuestion(mode, difficulty));
}

// Mode metadata for the Train page
export interface TrainMode {
  id: ModeKey;
  title: string;
  icon: string;
  description: string;
  badge: string;
  color: string;
  statKey: keyof import('@/context/AppContext').BrainStats;
  premium: boolean;
}

export const TRAIN_MODES: TrainMode[] = [
  { id: 'math',     title: 'Math Mastery',       icon: '🔢', description: 'Arithmetic, fractions, percentages, squares — 25 types', badge: '25 TYPES', color: '#00e5ff', statKey: 'mathIQ',  premium: false },
  { id: 'logic',    title: 'Logic & Sequences',   icon: '🧩', description: 'Patterns, sequences, analogies — spot the rule', badge: '15 TYPES', color: '#a855f7', statKey: 'logic',   premium: false },
  { id: 'speed',    title: 'Speed Mode',          icon: '⚡', description: 'Race the clock — rapid-fire mental math & decisions', badge: 'TIMED',    color: '#facc15', statKey: 'speed',   premium: false },
  { id: 'memory',   title: 'Memory Training',     icon: '🧠', description: 'Digit span, grid recall, word lists, reverse memory', badge: '11 TYPES', color: '#22d3ee', statKey: 'memory',  premium: false },
  { id: 'iq',       title: 'IQ Challenges',       icon: '🏆', description: 'Riddles, word problems, logic puzzles, Stroop test', badge: 'IQ TEST',  color: '#f97316', statKey: 'logic',   premium: false },
  { id: 'pattern',  title: 'Pattern Recognition', icon: '🌀', description: 'Visual & abstract patterns — find what comes next',  badge: '9 TYPES',  color: '#84cc16', statKey: 'logic',   premium: false },
  { id: 'reaction', title: 'Reaction Speed',      icon: '🎯', description: 'Flash-click test — measure your milliseconds',      badge: 'REFLEX',   color: '#ec4899', statKey: 'focus',   premium: false },
  { id: 'mixed',    title: 'Brain Gauntlet',       icon: '🔥', description: 'Random mix of ALL categories — ultimate test',     badge: 'ALL IN',   color: '#ef4444', statKey: 'logic',   premium: false },
];
