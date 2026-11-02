const $ = id => document.getElementById(id);
const inp = $('input'); let issues = [];
$('foot').textContent = `사전 ${SpellEngine.dictSize}개 · 규칙 ${SpellEngine.ruleCount}개 · 결과는 참고용입니다.`;
const h = s => s.replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
inp.oninput = () => $('count').textContent = inp.value.length + '자';
function run() {
  const t = inp.value; issues = SpellEngine.check(t); $('resultCard').hidden = false;
  $('summary').textContent = issues.length ? `${issues.length}개의 수정 제안` : '오류를 찾지 못했습니다 👍';
  let html = '', p = 0;
  issues.forEach((x, i) => { html += h(t.slice(p, x.start)) + `<mark data-i="${i}" title="${h(x.message)}">${h(x.original) || '␣'}</mark>`; p = x.end; });
  $('output').innerHTML = html + h(t.slice(p));
  $('list').innerHTML = issues.map((x, i) => `<li><span class="o">${h(x.original)}</span> → <button class="s" data-i="${i}">${h(x.suggestion) || '(삭제)'}</button><small>${h(x.message)}</small></li>`).join('');
  const w = SpellEngine.summarize(issues); const f = SpellEngine.countFormatting(issues); $('wordCard').hidden = !w.length && !f; $('fmt').textContent = f ? `띄어쓰기·문장부호 수정 ${f}건` : '';
  $('words').innerHTML = w.map(x => `<li>${h(x.original) || '␣'} → ${h(x.suggestion) || '(삭제)'} (${x.count}회)</li>`).join('');
}
function apply(i) { const x = issues[i]; inp.value = inp.value.slice(0, x.start) + x.suggestion + inp.value.slice(x.end); inp.oninput(); run(); }
document.addEventListener('click', e => { const i = e.target.dataset.i; if (i !== undefined) apply(+i); });
$('check').onclick = run;
$('applyAll').onclick = () => { inp.value = SpellEngine.applyAll(inp.value, issues); inp.oninput(); run(); };
$('copy').onclick = async () => { try { await navigator.clipboard.writeText(inp.value); } catch { inp.select(); document.execCommand('copy'); } $('copy').textContent = '복사됨!'; setTimeout(() => $('copy').textContent = '결과 복사', 1200); };
inp.onkeydown = e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) run(); };
$('copyWords').onclick = async () => { const t = SpellEngine.summarize(issues).map(x => `${x.original} → ${x.suggestion} (${x.count}회)`).join('\n'); try { await navigator.clipboard.writeText(t); } catch {} $('copyWords').textContent = '복사됨!'; setTimeout(() => $('copyWords').textContent = '목록 복사', 1200); };
