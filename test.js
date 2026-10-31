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
let pass = 0;
for (const [i, o] of cases) { try { assert.strictEqual(fix(i), o); pass++; console.log('✔', i, '→', o); } catch (e) { console.log('✘', i, '→', fix(i), '(기대:', o + ')'); } }
console.log(`${pass}/${cases.length} passed; dict=${E.dictSize}, rules=${E.ruleCount}`);
process.exit(pass === cases.length ? 0 : 1);
