const assert = require('assert'); const E = require('./engine.js');
const fix = t => E.applyAll(t, E.check(t));
const cases = [
 ['금새 끝났다', '금세 끝났다'], ['어떻해', '어떡해'], ['몇일 뒤에 봐요', '며칠 뒤에 봐요'],
 ['설겆이를 했다', '설거지를 했다'], ['정말 희안하다', '정말 희한하다'], ['왠일이야', '웬일이야'],
 ['그러면 안되요', '그러면 안 돼요'], ['나는 할수 있다', '나는 할 수 있다'], ['비가  온다', '비가 온다'],
 ['정말 ?', '정말?'], ['그래서,나는', '그래서, 나는'], ['내일 할께요', '내일 할게요'],
 ['한달 두달 세달 몇달', '한 달 두 달 세 달 몇 달'],
 ['그 곳에서 그 때', '그곳에서 그때'], ['한번 더 두번', '한 번 더 두 번'],
 ['할수', '할 수'], ['한 달 두 달 그곳 그때', '한 달 두 달 그곳 그때'],
 ['그는 왠지 슬펐다', '그는 왠지 슬펐다'], ['올바른 문장입니다.', '올바른 문장입니다.'],
];
{ const w = E.summarize(E.check('금새 금새 금새 몇일')); assert.deepStrictEqual(w.map(x => [x.original, x.suggestion, x.count]), [['금새','금세',3],['몇일','며칠',1]]); console.log('✔ summarize'); }
{ const t = '금새 갔다 .\n[ 1 ]  (가) 몇일 .\n훈  연  서  사 할수 있다'; const is = E.check(t);
  assert.deepStrictEqual(E.summarize(is).map(x => x.original), ['금새', '몇일', '할수']);
  assert.ok(!is.some(i => /[\])]/.test(i.original)));
  assert.ok(!is.some(i => /[훈연서사]/.test(i.original)));
  assert.strictEqual(E.countFormatting(is), 6);

  // Reproduce the invisible changes independently of the rules that create them.
  const formatting = [
    ...Array.from({ length: 18 }, () => ({ original: ' .', suggestion: '.' })),
    ...Array.from({ length: 18 }, () => ({ original: ' ]', suggestion: ']' })),
    ...['훈', '연', '서', '사'].map(s => ({ original: s + '\t\n\u00a0\u3000', suggestion: s })),
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
  assert.strictEqual(document.getElementById('fmt').textContent, '띄어쓰기·문장부호 정리 6건');
  assert.strictEqual(document.getElementById('words').innerHTML, '<li><span class="wordPair"><span class="wordOriginal">금새</span><span class="wordArrow">→</span><span class="wordSuggestion">금세</span></span><span class="wordCount">1회</span></li><li><span class="wordPair"><span class="wordOriginal">몇일</span><span class="wordArrow">→</span><span class="wordSuggestion">며칠</span></span><span class="wordCount">1회</span></li><li><span class="wordPair"><span class="wordOriginal">할수</span><span class="wordArrow">→</span><span class="wordSuggestion">할 수</span></span><span class="wordCount">1회</span></li>');
  assert.strictEqual((document.getElementById('output').innerHTML.match(/<mark /g) || []).length, is.length);
  input.value = '훈  연  서  사'; document.getElementById('check').onclick();
  assert.strictEqual(document.getElementById('words').innerHTML, '<li class="empty">중복 단어가 없으면 이 목록은 비어 있습니다.</li>');
  assert.strictEqual(document.getElementById('fmt').textContent, '띄어쓰기·문장부호 정리 3건');
  assert.strictEqual(document.getElementById('wordCard').hidden, false);
  input.value = '[ 1 ]'; document.getElementById('check').onclick();
  assert.strictEqual(document.getElementById('wordCard').hidden, false);
  assert.strictEqual(document.getElementById('fmt').textContent, '');
  console.log('✔ 공백·문장부호 정리 집계, 괄호·음절 미포함'); }
{
  const text = '한달 한달 두달 세달 몇달 그 곳에서는 그 때부터 한번 더 두번 연습할수 할수있어요 훈때문에';
  const issues = E.check(text);
  assert.deepStrictEqual(E.summarize(issues).map(x => [x.original, x.suggestion, x.count]), [
    ['한달', '한 달', 2], ['두달', '두 달', 1], ['세달', '세 달', 1], ['몇달', '몇 달', 1],
    ['그 곳에서는', '그곳에서는', 1], ['그 때부터', '그때부터', 1],
    ['한번 더', '한 번 더', 1], ['두번', '두 번', 1], ['연습할수', '연습할 수', 1],
    ['할수있어요', '할 수 있어요', 1], ['훈때문에', '훈 때문에', 1],
  ]);
  assert.strictEqual(E.countFormatting(issues), 0);
  const mixed = E.check('한달  그 곳 . 그래서,나는... 할수');
  assert.deepStrictEqual(E.summarize(mixed).map(x => x.original), ['한달', '그 곳', '할수']);
  assert.strictEqual(E.countFormatting(mixed), 4);
  assert.deepStrictEqual(E.summarize([
    { original: '훈 ', suggestion: '훈' },
    { original: '금새', suggestion: '금세', wordOriginal: '훈', wordSuggestion: '훈' },
    { original: '같음', suggestion: '같음' },
  ]), []);
  // Listing full words must leave the match offsets used for applying fixes intact.
  assert.strictEqual(E.applyAll(text, issues),
    '한 달 한 달 두 달 세 달 몇 달 그곳에서는 그때부터 한 번 더 두 번 연습할 수 할 수 있어요 훈 때문에');
  console.log('✔ 단어 띄어쓰기 목록, 전체 어절 표시, 동일 항목 제외');
}
let pass = 0;
for (const [i, o] of cases) { try { assert.strictEqual(fix(i), o); pass++; console.log('✔', i, '→', o); } catch (e) { console.log('✘', i, '→', fix(i), '(기대:', o + ')'); } }
console.log(`${pass}/${cases.length} passed; dict=${E.dictSize}, rules=${E.ruleCount}`);
process.exit(pass === cases.length ? 0 : 1);
