const assert = require('assert'); const E = require('./engine.js');
const fix = t => E.applyAll(t, E.check(t));
const cases = [
 ['금새 끝났다', '금세 끝났다'], ['어떻해', '어떡해'], ['몇일 뒤에 봐요', '며칠 뒤에 봐요'],
 ['설겆이를 했다', '설거지를 했다'], ['정말 희안하다', '정말 희한하다'], ['왠일이야', '웬일이야'],
 ['그러면 안되요', '그러면 안 돼요'], ['나는 할수 있다', '나는 할 수 있다'], ['비가  온다', '비가 온다'],
 ['정말 ?', '정말?'], ['그래서,나는', '그래서, 나는'], ['내일 할께요', '내일 할게요'],
 ['그는 왠지 슬펐다', '그는 왠지 슬펐다'], ['올바른 문장입니다.', '올바른 문장입니다.'],
];
{ const w = E.summarize(E.check('금새 금새 금새 몇일')); assert.deepStrictEqual(w.map(x => [x.original, x.suggestion, x.count]), [['금새','금세',3],['몇일','며칠',1]]); console.log('✔ summarize'); }
{ const t = '금새 갔다 .\n[ 1 ]  (가) 몇일 .\n훈  연  서  사 할수 있다'; const is = E.check(t);
  assert.deepStrictEqual(E.summarize(is).map(x => x.original), ['금새', '몇일']);
  assert.ok(!is.some(i => /[\])]/.test(i.original)));
  assert.ok(!is.some(i => /[훈연서사]/.test(i.original)));
  assert.strictEqual(E.countFormatting(is), 7);

  // Reproduce the invisible changes independently of the rules that create them.
  const formatting = [
    ...Array.from({ length: 18 }, () => ({ original: ' .', suggestion: '.' })),
    ...Array.from({ length: 18 }, () => ({ original: ' ]', suggestion: ']' })),
    ...['훈', '연', '서', '사'].map(s => ({ original: s + '\t\n\u00a0\u3000', suggestion: s })),
    { original: '할수', suggestion: '할 수' },
    { original: '...', suggestion: '.' },
  ];
  assert.deepStrictEqual(E.summarize(formatting), []);
  assert.strictEqual(E.countFormatting(formatting), formatting.length);
  for (const text of ['[ 1 ]', '[ ]', '( 가 )', '훈 연 서 사', '문단\n.', '문단\r\n.']) {
    assert.deepStrictEqual(E.check(text), [], text);
  }
  const syllableIssues = E.check('훈  연  서  사');
  assert.deepStrictEqual(syllableIssues.map(i => [i.start, i.end, i.original, i.suggestion]),
    [[1, 3, '  ', ' '], [4, 6, '  ', ' '], [7, 9, '  ', ' ']]);
  assert.strictEqual(fix('훈  연  서  사'), '훈 연 서 사');

  // Exercise the browser render path, including retained inline highlights.
  const fs = require('fs'); const vm = require('vm');
  const elements = new Map();
  const document = {
    getElementById(id) { if (!elements.has(id)) elements.set(id, {}); return elements.get(id); },
    addEventListener() {},
  };
  const browser = vm.createContext({ document });
  for (const file of ['data.js', 'engine.js', 'app.js']) vm.runInContext(fs.readFileSync(file, 'utf8'), browser);
  const input = document.getElementById('input');
  input.value = t; document.getElementById('check').onclick();
  assert.strictEqual(document.getElementById('fmt').textContent, '띄어쓰기·문장부호 수정 7건');
  assert.strictEqual(document.getElementById('words').innerHTML, '<li>금새 → 금세 (1회)</li><li>몇일 → 며칠 (1회)</li>');
  assert.strictEqual((document.getElementById('output').innerHTML.match(/<mark /g) || []).length, is.length);
  input.value = '훈  연  서  사'; document.getElementById('check').onclick();
  assert.strictEqual(document.getElementById('words').innerHTML, '');
  assert.strictEqual(document.getElementById('fmt').textContent, '띄어쓰기·문장부호 수정 3건');
  assert.strictEqual(document.getElementById('wordCard').hidden, false);
  input.value = '[ 1 ]'; document.getElementById('check').onclick();
  assert.strictEqual(document.getElementById('wordCard').hidden, true);
  assert.strictEqual(document.getElementById('fmt').textContent, '');
  console.log('✔ 목록에서 띄어쓰기·문장부호 제외, 괄호·음절 미포함'); }
let pass = 0;
for (const [i, o] of cases) { try { assert.strictEqual(fix(i), o); pass++; console.log('✔', i, '→', o); } catch (e) { console.log('✘', i, '→', fix(i), '(기대:', o + ')'); } }
console.log(`${pass}/${cases.length} passed; dict=${E.dictSize}, rules=${E.ruleCount}`);
process.exit(pass === cases.length ? 0 : 1);
