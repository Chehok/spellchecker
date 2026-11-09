const $ = id => document.getElementById(id);
const inp = $('input'); let issues = [];
$('foot').textContent = `사전 ${SpellEngine.dictSize}개 · 규칙 ${SpellEngine.ruleCount}개 · 결과는 참고용입니다.`;
const h = s => s.replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const words = s => JSON.stringify((s.match(/[\p{L}\p{N}\p{M}]+/gu) || []));
const isFormattingIssue = i => words(i.original || '') === words(i.suggestion || '');
const visible = s => (s || '').replace(/ /g, '␠').replace(/\n/g, '↵').replace(/\t/g, '⇥');
function formattingLabel(i) {
  if (/^\s+$/.test(i.original) && i.suggestion === ' ') return `연속 공백 ${i.original.length}칸 → 공백 1칸`;
  if (/\s+[.,!?;:。、]/.test(i.original)) return '문장부호 앞 공백 제거';
  if (/([.,!?])\1+/.test(i.original)) return '반복 문장부호 정리';
  if (/,\S/.test(i.original)) return '쉼표 뒤 띄어쓰기 추가';
  return `서식 정리: ${visible(i.original)} → ${visible(i.suggestion)}`;
}
inp.oninput = () => { const v = inp.value || ''; $('count').textContent = v.length + '자'; };
function run() {
  const t = inp.value; issues = SpellEngine.check(t); $('resultCard').hidden = false;
  $('summary').textContent = issues.length ? `${issues.length}개의 수정 제안` : '오류를 찾지 못했습니다 👍';
  $('resultState').textContent = t.trim()
    ? (issues.length ? '빨간 표시를 클릭하거나 오른쪽 제안을 눌러 바로 수정할 수 있습니다.' : '현재 문장에서는 고칠 항목이 보이지 않습니다.')
    : '먼저 문장을 입력한 뒤 검사 버튼을 눌러 주세요.';
  let html = '', p = 0;
  issues.forEach((x, i) => { html += h(t.slice(p, x.start)) + `<mark data-i="${i}" title="${h(x.message)}">${h(x.original) || '␣'}</mark>`; p = x.end; });
  $('output').innerHTML = html + h(t.slice(p));
  $('list').innerHTML = issues.length
    ? issues.map((x, i) => isFormattingIssue(x)
      ? `<li class="formatting"><div><span class="formatLabel">${h(formattingLabel(x))}</span><small>${h(x.message)}</small></div><button class="s" data-i="${i}">적용</button></li>`
      : `<li><span class="o">${h(x.original)}</span> → <button class="s" data-i="${i}">${h(x.suggestion) || '(삭제)'}</button><small>${h(x.message)}</small></li>`).join('')
    : '<li class="empty">표시할 수정 제안이 없습니다.</li>';
  const w = SpellEngine.summarize(issues); const f = SpellEngine.countFormatting(issues);
  $('wordCard').hidden = false;
  $('wordState').textContent = t.trim()
    ? (w.length ? `자주 반복된 항목 ${w.length}개` : '중복되는 맞춤법/띄어쓰기 오류가 없습니다.')
    : '입력 후 검사하면 단어 목록이 여기에 표시됩니다.';
  $('fmt').textContent = f ? `띄어쓰기·문장부호 정리 ${f}건` : '';
  $('words').innerHTML = w.length
    ? w.map(x => `<li><span class="wordPair"><span class="wordOriginal">${h(x.original) || '␣'}</span><span class="wordArrow">→</span><span class="wordSuggestion">${h(x.suggestion) || '(삭제)'}</span></span><span class="wordCount">${x.count}회</span></li>`).join('')
    : '<li class="empty">중복 단어가 없으면 이 목록은 비어 있습니다.</li>';
}
function apply(i) { const x = issues[i]; inp.value = inp.value.slice(0, x.start) + x.suggestion + inp.value.slice(x.end); inp.oninput(); run(); }
document.addEventListener('click', e => { const i = e.target.dataset.i; if (i !== undefined) apply(+i); });
$('check').onclick = run;
$('applyAll').onclick = () => { inp.value = SpellEngine.applyAll(inp.value, issues); inp.oninput(); run(); };
$('copy').onclick = async () => { try { await navigator.clipboard.writeText(inp.value); } catch { inp.select(); document.execCommand('copy'); } $('copy').textContent = '복사됨!'; setTimeout(() => $('copy').textContent = '결과 복사', 1200); };
inp.onkeydown = e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) run(); };
$('copyWords').onclick = async () => { const t = SpellEngine.summarize(issues).map(x => `${x.original} → ${x.suggestion} (${x.count}회)`).join('\n'); try { await navigator.clipboard.writeText(t); } catch {} $('copyWords').textContent = '복사됨!'; setTimeout(() => $('copyWords').textContent = '목록 복사', 1200); };
inp.oninput();
