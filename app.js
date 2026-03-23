/**
 * app.js — 메인 앱 (라우터, 설문, 관리자)
 * 설문 HTML은 JS에서 동적 생성 (템플릿 리터럴 버그 방지)
 */

// ══════════════════════════════════════════════
// 라우터
// ══════════════════════════════════════════════
const Router = {
  pages: {},
  register(name, initFn) { this.pages[name] = initFn; },
  navigate(name, ...args) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.page === name));
    const page = document.getElementById('page-' + name);
    if (page) { page.classList.add('active'); if (this.pages[name]) this.pages[name](...args); }
    window.scrollTo(0, 0);
  },
};

// ══════════════════════════════════════════════
// 공통 유틸
// ══════════════════════════════════════════════
const Utils = {
  engStars(level) {
    const n = Math.round(level);
    return Array.from({ length: 5 }, (_, i) =>
      '<span class="eng-star ' + (i < n ? 'filled' : 'empty') + '">★</span>'
    ).join('');
  },
  mbtiBadge(mbti) {
    if (!mbti || mbti.length < 4) return '<span class="badge badge-gray">미입력</span>';
    return '<span class="badge badge-primary">' + mbti.toUpperCase() + '</span>';
  },
  genderLabel(g) { return (g || '').toUpperCase() === 'M' ? '남' : '여'; },
  genderClass(g) { return (g || '').toUpperCase() === 'M' ? 'avatar-m' : 'avatar-f'; },
  showToast(msg, type) {
    type = type || 'success';
    const toast = document.createElement('div');
    toast.className = 'alert alert-' + type;
    toast.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999;max-width:340px;box-shadow:0 4px 12px rgba(0,0,0,.15);';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(function() { toast.remove(); }, 3200);
  },
  showLoading(msg) {
    msg = msg || '처리 중...';
    var el = document.getElementById('loading-overlay');
    if (!el) {
      el = document.createElement('div');
      el.id = 'loading-overlay';
      el.className = 'loading-overlay';
      el.innerHTML = '<div class="spinner"></div><span>' + msg + '</span>';
      document.body.appendChild(el);
    } else {
      el.querySelector('span').textContent = msg;
    }
  },
  hideLoading() {
    var el = document.getElementById('loading-overlay');
    if (el) el.remove();
  },
  confirm(msg) { return window.confirm(msg); },
  round1(n) { return Math.round(n * 10) / 10; },
};

// ══════════════════════════════════════════════
// 설문 문항 데이터 정의
// ══════════════════════════════════════════════

/**
 * MBTI 행동 시나리오 (각 차원당 2문항 = 총 16문항)
 * 각 답변 A/B가 E/I, S/N, T/F, J/P 중 하나를 나타냄
 */
var MBTI_QUESTIONS = [

// ================= E / I =================
{
id:'ei1', dim:'EI',
text:'새 학기 첫 모둠 활동에서 처음 보는 친구들과 함께할 때 나는?',
optA:{val:'E',label:'먼저 자기소개를 하며 분위기를 이끈다'},
optB:{val:'I',label:'다른 친구들의 행동을 보며 천천히 적응한다'}
},
{
id:'ei2', dim:'EI',
text:'쉬는 시간에 에너지를 회복할 때 나는?',
optA:{val:'E',label:'친구들과 이야기하며 웃고 떠든다'},
optB:{val:'I',label:'혼자 조용히 쉬면서 에너지를 회복한다'}
},
{
id:'ei3', dim:'EI',
text:'모둠 토론 중 나는?',
optA:{val:'E',label:'생각나는 대로 바로 의견을 말한다'},
optB:{val:'I',label:'생각을 정리한 후 신중하게 말한다'}
},
{
id:'ei4', dim:'EI',
text:'발표를 해야 할 때 나는?',
optA:{val:'E',label:'긴장되지만 사람들 앞에서 말하는 것이 재미있다'},
optB:{val:'I',label:'긴장되고 부담되어 최대한 피하고 싶다'}
},

// ================= S / N =================
{
id:'sn1', dim:'SN',
text:'영어 수업에서 새로운 문법을 배울 때 나는?',
optA:{val:'S',label:'구체적인 예문을 통해 이해하는 것이 좋다'},
optB:{val:'N',label:'전체 개념과 원리를 먼저 이해하고 싶다'}
},
{
id:'sn2', dim:'SN',
text:'과제를 수행할 때 나는?',
optA:{val:'S',label:'선생님의 지시사항을 정확히 따르는 것이 중요하다'},
optB:{val:'N',label:'나만의 방식으로 새롭게 바꿔보는 것이 좋다'}
},
{
id:'sn3', dim:'SN',
text:'문제를 해결할 때 나는?',
optA:{val:'S',label:'이미 해본 방법이나 검증된 방법을 사용한다'},
optB:{val:'N',label:'새로운 아이디어나 방법을 떠올린다'}
},
{
id:'sn4', dim:'SN',
text:'미래에 대해 생각할 때 나는?',
optA:{val:'S',label:'현실적으로 가능한 계획을 세운다'},
optB:{val:'N',label:'다양한 가능성과 꿈을 상상한다'}
},

// ================= T / F =================
{
id:'tf1', dim:'TF',
text:'친구가 과제에서 실수를 했을 때 나는?',
optA:{val:'T',label:'문제점을 설명하고 어떻게 고치면 좋을지 말해준다'},
optB:{val:'F',label:'먼저 괜찮다고 위로하고 기분을 살핀다'}
},
{
id:'tf2', dim:'TF',
text:'모둠에서 의견이 갈릴 때 나는?',
optA:{val:'T',label:'논리적으로 더 맞는 의견을 선택한다'},
optB:{val:'F',label:'모두가 기분 좋게 참여할 수 있는 방향을 선택한다'}
},
{
id:'tf3', dim:'TF',
text:'친구가 고민을 이야기할 때 나는?',
optA:{val:'T',label:'해결 방법을 제시해 주려고 한다'},
optB:{val:'F',label:'공감하며 이야기를 들어준다'}
},
{
id:'tf4', dim:'TF',
text:'팀 프로젝트에서 나는?',
optA:{val:'T',label:'결과와 완성도를 가장 중요하게 생각한다'},
optB:{val:'F',label:'팀 분위기와 관계를 중요하게 생각한다'}
},

// ================= J / P =================
{
id:'jp1', dim:'JP',
text:'과제가 주어졌을 때 나는?',
optA:{val:'J',label:'계획을 세우고 미리 시작한다'},
optB:{val:'P',label:'상황을 보며 나중에 시작한다'}
},
{
id:'jp2', dim:'JP',
text:'여행이나 체험학습을 준비할 때 나는?',
optA:{val:'J',label:'일정을 미리 계획하고 준비한다'},
optB:{val:'P',label:'큰 틀만 정하고 즉흥적으로 즐긴다'}
},
{
id:'jp3', dim:'JP',
text:'과제 마감이 다가올 때 나는?',
optA:{val:'J',label:'이미 끝내 놓고 여유 있게 준비한다'},
optB:{val:'P',label:'마감 직전에 집중해서 완성한다'}
},
{
id:'jp4', dim:'JP',
text:'계획이 바뀌었을 때 나는?',
optA:{val:'J',label:'당황하고 다시 계획을 세운다'},
optB:{val:'P',label:'유연하게 상황에 맞게 바꾼다'}
}

];


/**
 * 영어 실력 5영역 (각 1~5점 자기평가)
 */
var ENG_QUESTIONS = [
  // 협력적 소통
  { id:'c1', label:'협력적 소통', sub:'일상생활이나 친숙한 주제에 대해 영어로 소통할 수 있다.' },
  { id:'c2', label:'협력적 소통', sub:'모둠 활동에서 협력적으로 의견을 나눈다.' },
  { id:'c3', label:'협력적 소통', sub:'상대방의 말을 끝까지 듣고 적절하게 반응한다.' },
  { id:'c4', label:'협력적 소통', sub:'대화가 어려울 때 다른 방법으로 표현하려 노력한다.' },

  // 지식정보처리
  { id:'i1', label:'지식정보처리', sub:'영어 디지털 자료를 스스로 검색하고 수집할 수 있다.' },
  { id:'i2', label:'지식정보처리', sub:'자료의 신뢰성을 비판적으로 평가할 수 있다.' },
  { id:'i3', label:'지식정보처리', sub:'출처를 밝히는 등 정보 윤리를 준수한다.' },
  { id:'i4', label:'지식정보처리', sub:'번역기나 사전 등 디지털 도구를 효과적으로 활용한다.' },

  // 창의적 사고
  { id:'cr1', label:'창의적 사고', sub:'다양한 지식을 융합하여 생각할 수 있다.' },
  { id:'cr2', label:'창의적 사고', sub:'새로운 아이디어를 떠올린다.' },
  { id:'cr3', label:'창의적 사고', sub:'독창적인 방식으로 영어 표현을 만든다.' },
  { id:'cr4', label:'창의적 사고', sub:'문제를 창의적으로 해결한다.' },

  // 자기관리
  { id:'s1', label:'자기관리', sub:'스스로 영어 학습 필요성을 느낀다.' },
  { id:'s2', label:'자기관리', sub:'학습 목표를 스스로 설정한다.' },
  { id:'s3', label:'자기관리', sub:'자기주도적으로 영어 학습을 지속한다.' },
  { id:'s4', label:'자기관리', sub:'실수를 두려워하지 않고 성장하려 한다.' },

  // 공동체
  { id:'g1', label:'공동체', sub:'다양한 문화와 관점을 이해한다.' },
  { id:'g2', label:'공동체', sub:'다른 사람의 의견을 존중한다.' },
  { id:'g3', label:'공동체', sub:'관용적인 태도로 참여한다.' },
  { id:'g4', label:'공동체', sub:'사회 문제 해결에 관심을 가진다.' },

  // 심미적 감성
  { id:'a1', label:'심미적 감성', sub:'영어 콘텐츠에서 감동을 느낀다.' },
  { id:'a2', label:'심미적 감성', sub:'등장인물의 감정에 공감한다.' },
  { id:'a3', label:'심미적 감성', sub:'문화적 가치를 이해한다.' },
  { id:'a4', label:'심미적 감성', sub:'감정을 영어로 표현할 수 있다.' },

  // Reading
  { id:'r1', label:'Reading', sub:'영어 글의 중심 내용과 세부 정보를 이해한다.' },
  { id:'r2', label:'Reading', sub:'문맥을 활용하여 의미를 추론한다.' },
  { id:'r3', label:'Reading', sub:'스스로 영어 글을 찾아 읽는다.' },
  { id:'r4', label:'Reading', sub:'글의 의도와 논리를 파악한다.' },
  { id:'r5', label:'Reading', sub:'다양한 관점을 열린 마음으로 이해한다.' },

  // Listening
  { id:'l1', label:'Listening', sub:'영어 대화의 핵심 정보를 이해한다.' },
  { id:'l2', label:'Listening', sub:'맥락을 통해 내용을 파악한다.' },
  { id:'l3', label:'Listening', sub:'영어 영상이나 오디오 학습에 흥미가 있다.' },
  { id:'l4', label:'Listening', sub:'능동적으로 듣는다.' },
  { id:'l5', label:'Listening', sub:'다양한 발음과 표현을 존중한다.' },

  // Speaking
  { id:'sp1', label:'Speaking', sub:'영어로 자신의 생각을 표현한다.' },
  { id:'sp2', label:'Speaking', sub:'다양한 방법으로 표현을 이어간다.' },
  { id:'sp3', label:'Speaking', sub:'상호작용하며 대화한다.' },
  { id:'sp4', label:'Speaking', sub:'논리적으로 말한다.' },
  { id:'sp5', label:'Speaking', sub:'실수를 두려워하지 않는다.' },

  // Writing
  { id:'w1', label:'Writing', sub:'목적에 맞게 영어 글을 작성한다.' },
  { id:'w2', label:'Writing', sub:'다양한 형식의 글을 쓸 수 있다.' },
  { id:'w3', label:'Writing', sub:'글을 수정하고 개선한다.' },
  { id:'w4', label:'Writing', sub:'도구를 올바르게 활용한다.' },
  { id:'w5', label:'Writing', sub:'협력하여 글을 작성한다.' }

];

var ENG_LEVEL_LABELS = ['', '기초\n(거의 모름)', '초급\n(기본 단어)', '중급\n(일상 소통)', '고급\n(자신 있음)', '최상\n(원어민급)'];

/**
 * 학습 성향 12문항 (각 1~5점 리커트)
 * category: 알고리즘 점수 산출에 사용
 */
var PERSONALITY_QUESTIONS = [
  // 리더십 (2)
  { id: 'p_lead1', cat: 'leadership', catLabel: '리더십',
    text: '모둠 활동에서 자연스럽게 리더 역할을 맡거나 방향을 제시한다.' },
  { id: 'p_lead2', cat: 'leadership', catLabel: '리더십',
    text: '팀원들의 의견을 조율하고 합의점을 찾아 팀을 이끌 수 있다.' },
  // 소통 (2)
  { id: 'p_comm1', cat: 'communication', catLabel: '소통',
    text: '발표나 토론에서 내 생각을 명확하고 조리 있게 전달한다.' },
  { id: 'p_comm2', cat: 'communication', catLabel: '소통',
    text: '친구들의 이야기를 잘 들어주고 다양한 의견을 수용한다.' },
  // 협업 (2)
  { id: 'p_collab1', cat: 'collaboration', catLabel: '협업',
    text: '혼자보다 팀으로 함께 할 때 더 좋은 결과를 낼 수 있다.' },
  { id: 'p_collab2', cat: 'collaboration', catLabel: '협업',
    text: '팀원이 어려워하면 내 역할이 아니더라도 먼저 도와준다.' },
  // 계획·꼼꼼함 (2)
  { id: 'p_plan1', cat: 'organization', catLabel: '계획성',
    text: '할 일 목록·계획표를 만들고 기한 내에 꼼꼼하게 완료한다.' },
  { id: 'p_plan2', cat: 'organization', catLabel: '계획성',
    text: '결과물의 오류와 실수를 꼼꼼히 검토하고 수정한다.' },
  // 창의성 (2)
  { id: 'p_create1', cat: 'creativity', catLabel: '창의성',
    text: '기존 방식이 아닌 새로운 아이디어나 독창적인 방법을 잘 떠올린다.' },
  { id: 'p_create2', cat: 'creativity', catLabel: '창의성',
    text: '정해진 규칙이나 틀을 벗어나 자유롭게 상상하는 것을 즐긴다.' },
  // 적응력·학습력 (2)
  { id: 'p_adapt1', cat: 'adaptability', catLabel: '적응력',
    text: '상황이 바뀌거나 예상치 못한 문제가 생겨도 빠르게 적응한다.' },
  { id: 'p_adapt2', cat: 'adaptability', catLabel: '적응력',
    text: '처음 접하는 내용이나 기술도 빠르게 이해하고 익힌다.' },
];

// ══════════════════════════════════════════════
// 설문 페이지 (동적 렌더링)
// ══════════════════════════════════════════════
var SurveyPage = (function() {

  var TOTAL_STEPS = 5;
  var currentStep = 1;

  // ── 설문 HTML 빌더 ────────────────────────

  function buildStep1() {
    return '<div class="form-section fade-in">' +
      '<h3>👤 기본 정보</h3>' +
      '<div class="form-grid">' +
        '<div class="form-group">' +
          '<label for="s-name">이름 <span class="required">*</span></label>' +
          '<input type="text" id="s-name" placeholder="홍길동" autocomplete="off">' +
        '</div>' +
        '<div class="form-group">' +
          '<label for="s-class">반 <span class="required">*</span></label>' +
          '<select id="s-class"><option value="">반 선택</option><option value="1-1">1학년 1반</option><option value="1-2">1학년 2반</option></select>' +
        '</div>' +
        '<div class="form-group">' +
          '<label for="s-number">번호 <span class="required">*</span></label>' +
          '<input type="number" id="s-number" min="1" max="40" placeholder="1~40">' +
        '</div>' +
        '<div class="form-group">' +
          '<label>성별 <span class="required">*</span></label>' +
          '<div style="display:flex;gap:20px;margin-top:6px;">' +
            '<label style="display:flex;align-items:center;gap:7px;cursor:pointer;font-weight:400;font-size:.95rem;"><input type="radio" name="s-gender" value="M"> 남자</label>' +
            '<label style="display:flex;align-items:center;gap:7px;cursor:pointer;font-weight:400;font-size:.95rem;"><input type="radio" name="s-gender" value="F"> 여자</label>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function buildStep2() {
    var html = '<div class="form-section fade-in">' +
      '<h3>🧠 MBTI 행동 진단 <span style="font-size:.8rem;font-weight:400;color:var(--gray-500);">(16문항 · 각 A/B 중 선택)</span></h3>' +
      '<p class="text-muted" style="margin-bottom:20px;">아래 상황에서 본인에게 더 가까운 것을 솔직하게 골라주세요. 정답이 없으며 자신의 자연스러운 모습을 선택하세요.</p>' +
      '<div style="display:grid;gap:20px;">';

    MBTI_QUESTIONS.forEach(function(q, idx) {
      var dimColors = { EI: '#4f46e5', SN: '#06b6d4', TF: '#10b981', JP: '#f59e0b' };
      var dimLabels = { EI: '에너지 방향', SN: '정보 인식', TF: '의사결정', JP: '생활 방식' };
      var color = dimColors[q.dim] || '#888';
      var dimLabel = dimLabels[q.dim] || q.dim;

      html += '<div class="mbti-scenario">' +
        '<div style="font-size:.72rem;font-weight:700;color:' + color + ';margin-bottom:6px;text-transform:uppercase;letter-spacing:.5px;">' +
          'Q' + (idx + 1) + ' · ' + dimLabel +
        '</div>' +
        '<div class="q-text">' + q.text + '</div>' +
        '<div class="mbti-options">' +
          '<div class="mbti-option">' +
            '<input type="radio" name="mbti_' + q.id + '" id="mbti_' + q.id + '_A" value="' + q.optA.val + '">' +
            '<label for="mbti_' + q.id + '_A">' +
              '<span class="opt-badge">A</span>' +
              '<span>' + q.optA.label + '</span>' +
            '</label>' +
          '</div>' +
          '<div class="mbti-option">' +
            '<input type="radio" name="mbti_' + q.id + '" id="mbti_' + q.id + '_B" value="' + q.optB.val + '">' +
            '<label for="mbti_' + q.id + '_B">' +
              '<span class="opt-badge">B</span>' +
              '<span>' + q.optB.label + '</span>' +
            '</label>' +
          '</div>' +
        '</div>' +
      '</div>';
    });

    html += '</div></div>';
    return html;
  }

  function buildStep3() {
    var html = '<div class="form-section fade-in">' +
      '<h3>🌍 영어 실력 5영역 자기평가 <span style="font-size:.8rem;font-weight:400;color:var(--gray-500);">(각 영역 1~5점)</span></h3>' +
      '<p class="text-muted" style="margin-bottom:16px;">각 영역별 본인의 현재 수준을 솔직하게 선택해주세요. 선생님이 보는 점수가 아니라 모둠 구성에만 쓰입니다.</p>' +
      '<div>';

    ENG_QUESTIONS.forEach(function(q) {
      html += '<div class="eng-skill-row">' +
        '<div class="eng-skill-icon">🌐</div>' +
        '<div class="eng-skill-body">' +
          '<div class="eng-skill-label">' + q.label + '</div>' +
          '<div class="eng-skill-sub">' + q.sub + '</div>' +
          '<div class="eng-rating">';

      for (var v = 1; v <= 5; v++) {
        var lbl = ENG_LEVEL_LABELS[v].replace('\n', '<br>');
        html += '<div style="display:flex;flex-direction:column;align-items:center;gap:3px;">' +
          '<input type="radio" name="' + q.id + '" id="' + q.id + '_' + v + '" value="' + v + '">' +
          '<label for="' + q.id + '_' + v + '" style="display:flex;align-items:center;justify-content:center;width:38px;height:38px;border-radius:8px;border:1.5px solid var(--gray-200);cursor:pointer;font-size:.88rem;font-weight:700;color:var(--gray-500);transition:all .15s;" onmouseover="this.style.borderColor=\'var(--primary)\'" onmouseout="if(!document.getElementById(\'' + q.id + '_' + v + '\').checked)this.style.borderColor=\'var(--gray-200)\'">' + v + '</label>' +
          '<span style="font-size:.65rem;color:var(--gray-400);text-align:center;line-height:1.2;">' + lbl + '</span>' +
        '</div>';
      }

      html += '</div></div></div>';
    });

    html += '</div></div>';
    return html;
  }

  function buildStep4() {
    var html = '<div class="form-section fade-in">' +
      '<h3>💡 학습 성향 12문항 <span style="font-size:.8rem;font-weight:400;color:var(--gray-500);">(1=전혀 아님 ~ 5=매우 그럼)</span></h3>' +
      '<p class="text-muted" style="margin-bottom:20px;">리더십·소통·협업·계획성·창의성·적응력 6가지 성향을 측정합니다. 평소 모습에 가장 가까운 숫자를 선택하세요.</p>' +
      '<div>';

    var catColors = { leadership:'#4f46e5', communication:'#06b6d4', collaboration:'#10b981', organization:'#f59e0b', creativity:'#ec4899', adaptability:'#8b5cf6' };

    PERSONALITY_QUESTIONS.forEach(function(q, idx) {
      var color = catColors[q.cat] || 'var(--primary)';
      html += '<div class="likert-row">' +
        '<div style="font-size:.72rem;font-weight:700;display:inline-block;background:' + color + '22;color:' + color + ';padding:2px 9px;border-radius:10px;margin-bottom:5px;">' + q.catLabel + '</div>' +
        '<div class="likert-q"><span class="q-num">' + (idx + 1) + '</span>' + q.text + '</div>' +
        '<div class="likert-scale">' +
          '<span class="likert-end">전혀 아님</span>' +
          '<div class="likert-btns">';

      for (var v = 1; v <= 5; v++) {
        html += '<input type="radio" name="' + q.id + '" id="' + q.id + '_' + v + '" value="' + v + '">' +
          '<label for="' + q.id + '_' + v + '">' + v + '</label>';
      }

      html += '</div><span class="likert-end">매우 그럼</span></div></div>';
    });

    html += '</div></div>';
    return html;
  }

  function buildStep5() {
    return '<div class="form-section fade-in">' +
      '<h3>✅ 제출 전 확인</h3>' +
      '<div class="alert alert-warning">⚠️ 제출 후 수정이 필요하면 선생님께 말씀해주세요.</div>' +
      '<div class="form-group" style="margin-top:16px;">' +
        '<label for="s-note">선생님께 전하고 싶은 말 (선택)</label>' +
        '<textarea id="s-note" rows="3" placeholder="예: 발표를 어려워합니다. 특정 친구와 사이가 불편합니다. 등 (선택 사항)"></textarea>' +
      '</div>' +
      '<div class="alert alert-info" style="margin-top:16px;">💙 설문 데이터는 모둠 구성 목적으로만 사용되며 안전하게 보관됩니다.</div>' +
    '</div>';
  }

  // ── 스텝 인디케이터 ──────────────────────
  var STEP_LABELS = ['기본 정보', 'MBTI 진단', '영어 실력', '학습 성향', '확인·제출'];

  function buildStepIndicator() {
    var row = document.getElementById('step-indicator-row');
    if (!row) return;
    var html = '';
    for (var i = 1; i <= TOTAL_STEPS; i++) {
      var cls = i < currentStep ? 'done' : i === currentStep ? 'active' : '';
      html += '<div class="step ' + cls + '" id="step-ind-' + i + '">' +
        '<div class="step-num">' + (i < currentStep ? '✓' : i) + '</div>' +
        '<div class="step-label">' + STEP_LABELS[i - 1] + '</div>' +
      '</div>';
      if (i < TOTAL_STEPS) html += '<div class="step-line"></div>';
    }
    row.innerHTML = html;
  }

  function updateUI() {
    buildStepIndicator();
    var pct = ((currentStep - 1) / (TOTAL_STEPS - 1)) * 100;
    var bar = document.getElementById('survey-progress');
    if (bar) bar.style.width = pct + '%';

    var counter = document.getElementById('step-counter');
    if (counter) counter.textContent = currentStep + ' / ' + TOTAL_STEPS;

    var btnPrev = document.getElementById('btn-prev');
    var btnNext = document.getElementById('btn-next');
    var btnSubmit = document.getElementById('btn-submit');
    if (btnPrev) btnPrev.disabled = currentStep === 1;
    if (btnNext) btnNext.style.display = currentStep < TOTAL_STEPS ? 'inline-flex' : 'none';
    if (btnSubmit) btnSubmit.style.display = currentStep === TOTAL_STEPS ? 'inline-flex' : 'none';
  }

  // ── 렌더링 ──────────────────────────────
  function render() {
    currentStep = 1;

    // 각 스텝 HTML 주입 (처음 한 번만)
    var s1 = document.getElementById('survey-step-1');
    if (s1 && !s1.dataset.built) {
      s1.innerHTML = buildStep1();
      s1.dataset.built = '1';
    }
    var s2 = document.getElementById('survey-step-2');
    if (s2 && !s2.dataset.built) {
      s2.innerHTML = buildStep2();
      s2.dataset.built = '1';
      // 라디오 버튼 선택 시 label border 색상 업데이트
      s2.querySelectorAll('.eng-rating input[type="radio"]').forEach(function(radio) {
        radio.addEventListener('change', function() {
          var name = this.name;
          document.querySelectorAll('input[name="' + name + '"]').forEach(function(r) {
            var lbl = document.querySelector('label[for="' + r.id + '"]');
            if (lbl) lbl.style.borderColor = r.checked ? 'var(--primary)' : 'var(--gray-200)';
          });
        });
      });
    }
    var s3 = document.getElementById('survey-step-3');
    if (s3 && !s3.dataset.built) {
      s3.innerHTML = buildStep3();
      s3.dataset.built = '1';
      // 영어 rating 체크 시 border 업데이트
      s3.querySelectorAll('.eng-rating input[type="radio"]').forEach(function(radio) {
        radio.addEventListener('change', function() {
          updateEngLabel(this.name);
        });
      });
    }
    var s4 = document.getElementById('survey-step-4');
    if (s4 && !s4.dataset.built) {
      s4.innerHTML = buildStep4();
      s4.dataset.built = '1';
    }
    var s5 = document.getElementById('survey-step-5');
    if (s5 && !s5.dataset.built) {
      s5.innerHTML = buildStep5();
      s5.dataset.built = '1';
    }

    // 폼 초기화
    resetForm();
    showStep(1);
    updateUI();

    document.getElementById('survey-success').style.display = 'none';
    document.getElementById('survey-content').style.display = 'block';
  }

  function updateEngLabel(name) {
    var radios = document.querySelectorAll('input[name="' + name + '"]');
    radios.forEach(function(r) {
      var lbl = document.querySelector('label[for="' + r.id + '"]');
      if (lbl) {
        if (r.checked) {
          lbl.style.background = 'var(--primary)';
          lbl.style.borderColor = 'var(--primary)';
          lbl.style.color = 'white';
        } else {
          lbl.style.background = '';
          lbl.style.borderColor = 'var(--gray-200)';
          lbl.style.color = 'var(--gray-500)';
        }
      }
    });
  }

  function resetForm() {
    document.querySelectorAll('.survey-step input[type="radio"]').forEach(function(r) { r.checked = false; });
    document.querySelectorAll('.survey-step input[type="text"]').forEach(function(r) { r.value = ''; });
    document.querySelectorAll('.survey-step input[type="number"]').forEach(function(r) { r.value = ''; });
    document.querySelectorAll('.survey-step select').forEach(function(r) { r.selectedIndex = 0; });
    document.querySelectorAll('.survey-step textarea').forEach(function(r) { r.value = ''; });
    // eng label 색상 초기화
    ENG_QUESTIONS.forEach(function(q) {
      for (var v = 1; v <= 5; v++) {
        var lbl = document.querySelector('label[for="' + q.id + '_' + v + '"]');
        if (lbl) { lbl.style.background = ''; lbl.style.borderColor = 'var(--gray-200)'; lbl.style.color = 'var(--gray-500)'; }
      }
    });
    // mbti option label 초기화
    document.querySelectorAll('.mbti-option label').forEach(function(l) {
      l.style.borderColor = ''; l.style.background = '';
    });
  }

  function showStep(n) {
    for (var i = 1; i <= TOTAL_STEPS; i++) {
      var el = document.getElementById('survey-step-' + i);
      if (el) el.style.display = i === n ? 'block' : 'none';
    }
  }

  // ── 유효성 검사 ──────────────────────────
  function validate(step) {
    if (step === 1) {
      var name = (document.getElementById('s-name') || {}).value || '';
      if (!name.trim()) { Utils.showToast('이름을 입력해주세요.', 'warning'); return false; }
      var cls = (document.getElementById('s-class') || {}).value || '';
      if (!cls) { Utils.showToast('반을 선택해주세요.', 'warning'); return false; }
      var num = parseInt((document.getElementById('s-number') || {}).value || '0');
      if (!num || num < 1 || num > 40) { Utils.showToast('번호를 올바르게 입력해주세요. (1~40)', 'warning'); return false; }
      if (!document.querySelector('input[name="s-gender"]:checked')) {
        Utils.showToast('성별을 선택해주세요.', 'warning'); return false;
      }
    }
    if (step === 2) {
      for (var i = 0; i < MBTI_QUESTIONS.length; i++) {
        var q = MBTI_QUESTIONS[i];
        if (!document.querySelector('input[name="mbti_' + q.id + '"]:checked')) {
          Utils.showToast('Q' + (i + 1) + ' MBTI 질문에 답해주세요.', 'warning');
          return false;
        }
      }
    }
    if (step === 3) {
      for (var j = 0; j < ENG_QUESTIONS.length; j++) {
        var eq = ENG_QUESTIONS[j];
        if (!document.querySelector('input[name="' + eq.id + '"]:checked')) {
          Utils.showToast('"' + eq.label + '" 영역을 선택해주세요.', 'warning');
          return false;
        }
      }
    }
    if (step === 4) {
      for (var k = 0; k < PERSONALITY_QUESTIONS.length; k++) {
        var pq = PERSONALITY_QUESTIONS[k];
        if (!document.querySelector('input[name="' + pq.id + '"]:checked')) {
          Utils.showToast((k + 1) + '번 성향 질문에 답해주세요.', 'warning');
          return false;
        }
      }
    }
    return true;
  }

  // ── 데이터 수집 ──────────────────────────
  function collectData() {
    // 기본 정보
    var name = document.getElementById('s-name').value.trim();
    var cls = document.getElementById('s-class').value;
    var number = parseInt(document.getElementById('s-number').value);
    var gender = (document.querySelector('input[name="s-gender"]:checked') || {}).value || 'M';

    // MBTI 계산
    var mbtiScore = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
    MBTI_QUESTIONS.forEach(function(q) {
      var checked = document.querySelector('input[name="mbti_' + q.id + '"]:checked');
      if (checked) mbtiScore[checked.value]++;
    });
    var mbti = (mbtiScore.E >= mbtiScore.I ? 'E' : 'I') +
               (mbtiScore.S >= mbtiScore.N ? 'S' : 'N') +
               (mbtiScore.T >= mbtiScore.F ? 'T' : 'F') +
               (mbtiScore.J >= mbtiScore.P ? 'J' : 'P');
    // E/I 각 점수 비율 (0~1, E가 1이면 완전 외향)
    var eiRatio = mbtiScore.E / (mbtiScore.E + mbtiScore.I || 1);
    var snRatio = mbtiScore.N / (mbtiScore.S + mbtiScore.N || 1);
    var tfRatio = mbtiScore.F / (mbtiScore.T + mbtiScore.F || 1);
    var jpRatio = mbtiScore.P / (mbtiScore.J + mbtiScore.P || 1);

    // 영어 5영역
    var engRaw = {};
    ENG_QUESTIONS.forEach(function(q) {
      engRaw[q.id] = parseInt((document.querySelector('input[name="' + q.id + '"]:checked') || {}).value || '3');
    });
    var engValues = Object.values(engRaw);
    var englishLevel = Utils.round1(engValues.reduce(function(a, b) { return a + b; }, 0) / engValues.length);

    // 성향 12문항 → 카테고리별 평균
    var catScores = {};
    var catCount = {};
    PERSONALITY_QUESTIONS.forEach(function(q) {
      var v = parseInt((document.querySelector('input[name="' + q.id + '"]:checked') || {}).value || '3');
      catScores[q.cat] = (catScores[q.cat] || 0) + v;
      catCount[q.cat] = (catCount[q.cat] || 0) + 1;
    });
    var cats = {};
    Object.keys(catScores).forEach(function(k) { cats[k] = Utils.round1(catScores[k] / catCount[k]); });

    var leadershipScore = cats.leadership || 3;
    var communicationScore = cats.communication || 3;
    var collaborationScore = cats.collaboration || 3;
    var organizationScore = cats.organization || 3;
    var creativityScore = cats.creativity || 3;
    var adaptabilityScore = cats.adaptability || 3;

    var selfNote = (document.getElementById('s-note') || {}).value || '';

    return {
      name, class: cls, number, gender,
      mbti, mbtiScore, eiRatio, snRatio, tfRatio, jpRatio,
      englishLevel, engRaw,
      leadershipScore, communicationScore, collaborationScore,
      organizationScore, creativityScore, adaptabilityScore,
      selfNote,
    };
  }

  // ── 네비게이션 ────────────────────────────
  function nextStep() {
    if (!validate(currentStep)) return;
    if (currentStep < TOTAL_STEPS) {
      currentStep++;
      showStep(currentStep);
      updateUI();
      window.scrollTo(0, 0);
    }
  }

  function prevStep() {
    if (currentStep > 1) {
      currentStep--;
      showStep(currentStep);
      updateUI();
      window.scrollTo(0, 0);
    }
  }

  function submitSurvey() {
    if (!validate(currentStep)) return;
    var data = collectData();

    // 중복 체크
    var existing = DB.getStudents().find(function(s) { return s.class === data.class && s.number === data.number; });
    if (existing) {
      if (!Utils.confirm(data.class + '반 ' + data.number + '번 학생의 응답이 이미 존재합니다. 덮어쓰겠습니까?')) return;
      DB.updateStudent(existing.id, data);
    } else {
      DB.addStudent(data);
    }

    // 성공 화면
    document.getElementById('survey-content').style.display = 'none';
    var successEl = document.getElementById('survey-success');
    successEl.style.display = 'block';
    document.getElementById('success-name').textContent = data.name;
    document.getElementById('success-class').textContent = data.class + '반 ' + data.number + '번';

    // 요약 카드
    var summaryEl = document.getElementById('success-summary');
    if (summaryEl) {
      summaryEl.innerHTML =
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">' +
          '<div><div style="font-size:.72rem;color:var(--gray-500);font-weight:600;">MBTI</div><div style="font-weight:700;">' + data.mbti + '</div></div>' +
          '<div><div style="font-size:.72rem;color:var(--gray-500);font-weight:600;">영어 평균</div><div style="font-weight:700;">' + data.englishLevel + ' / 5</div></div>' +
          '<div><div style="font-size:.72rem;color:var(--gray-500);font-weight:600;">리더십</div><div style="font-weight:700;">' + data.leadershipScore + ' / 5</div></div>' +
          '<div><div style="font-size:.72rem;color:var(--gray-500);font-weight:600;">창의성</div><div style="font-weight:700;">' + data.creativityScore + ' / 5</div></div>' +
        '</div>';
    }
  }

  return { render, nextStep, prevStep, submitSurvey };
})();

// ══════════════════════════════════════════════
// 관리자 페이지
// ══════════════════════════════════════════════
var AdminPage = (function() {
  var authenticated = false;
  var currentClassFilter = 'all';
  var activeTab = 'students';

  function render() { authenticated ? showDashboard() : showLogin(); }

  function showLogin() {
    document.getElementById('admin-login').style.display = 'flex';
    document.getElementById('admin-dashboard').style.display = 'none';
    document.getElementById('pin-input').value = '';
    document.getElementById('pin-error').style.display = 'none';
  }

  function tryLogin() {
    var pin = document.getElementById('pin-input').value;
    if (pin === DB.getSettings().adminPin) {
      authenticated = true;
      showDashboard();
    } else {
      document.getElementById('pin-error').style.display = 'block';
      document.getElementById('pin-input').value = '';
      document.getElementById('pin-input').focus();
    }
  }

  function logout() { authenticated = false; showLogin(); }

  function showDashboard() {
    document.getElementById('admin-login').style.display = 'none';
    document.getElementById('admin-dashboard').style.display = 'block';
    switchTab(activeTab);
    renderStats();
  }

  function switchTab(tab) {
    activeTab = tab;
    document.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.toggle('active', b.dataset.tab === tab); });
    document.querySelectorAll('.tab-panel').forEach(function(p) { p.classList.toggle('active', p.id === 'tab-' + tab); });
    if (tab === 'students') renderStudentTable();
    if (tab === 'groups') renderGroupsPanel();
    if (tab === 'settings') renderSettingsPanel();
  }

  function renderStats() {
    var students = DB.getStudents();
    var c1 = students.filter(function(s) { return s.class === '1-1'; }).length;
    var c2 = students.filter(function(s) { return s.class === '1-2'; }).length;
    var groups = DB.getGroups();
    document.getElementById('stat-total').textContent = students.length;
    document.getElementById('stat-c1').textContent = c1;
    document.getElementById('stat-c2').textContent = c2;
    document.getElementById('stat-groups').textContent = groups ? groups.length : 0;
  }

  function renderStudentTable(filter) {
    if (filter !== undefined) currentClassFilter = filter;
    var students = DB.getStudents();
    if (currentClassFilter !== 'all') students = students.filter(function(s) { return s.class === currentClassFilter; });
    students.sort(function(a, b) {
      if (a.class !== b.class) return a.class.localeCompare(b.class);
      return a.number - b.number;
    });

    var tbody = document.getElementById('student-tbody');
    var empty = document.getElementById('students-empty');

    if (students.length === 0) {
      tbody.innerHTML = '';
      empty.style.display = 'block';
      return;
    }
    empty.style.display = 'none';

    tbody.innerHTML = students.map(function(s) {
      var gClass = Utils.genderClass(s.gender);
      var gLabel = Utils.genderLabel(s.gender);
      return '<tr>' +
        '<td><span class="badge badge-gray">' + s.class + '</span></td>' +
        '<td>' + s.number + '</td>' +
        '<td><strong>' + s.name + '</strong></td>' +
        '<td><div class="member-avatar ' + gClass + '" style="width:26px;height:26px;display:inline-flex;align-items:center;justify-content:center;border-radius:50%;font-size:.72rem;font-weight:700;">' + gLabel + '</div></td>' +
        '<td>' + Utils.mbtiBadge(s.mbti) + '</td>' +
        '<td><span style="font-weight:700;">' + (s.englishLevel || '-') + '</span></td>' +
        '<td>' + renderMiniBar(s.leadershipScore) + '</td>' +
        '<td>' + renderMiniBar(s.creativityScore) + '</td>' +
        '<td>' + renderMiniBar(s.collaborationScore) + '</td>' +
        '<td style="white-space:nowrap;">' +
          '<button class="btn btn-sm btn-secondary" onclick="AdminPage.editStudent(\'' + s.id + '\')">수정</button> ' +
          '<button class="btn btn-sm btn-danger" onclick="AdminPage.deleteStudent(\'' + s.id + '\')">삭제</button>' +
        '</td>' +
      '</tr>';
    }).join('');
  }

  function renderMiniBar(val) {
    val = val || 0;
    var pct = Math.round((val / 5) * 100);
    var color = pct >= 70 ? 'var(--success)' : pct >= 40 ? 'var(--warning)' : 'var(--danger)';
    return '<div style="display:flex;align-items:center;gap:5px;">' +
      '<div style="width:50px;height:6px;background:var(--gray-200);border-radius:3px;overflow:hidden;">' +
        '<div style="width:' + pct + '%;height:100%;background:' + color + ';border-radius:3px;"></div>' +
      '</div>' +
      '<span style="font-size:.78rem;color:var(--gray-600);">' + val + '</span>' +
    '</div>';
  }

  function deleteStudent(id) {
    var s = DB.getStudents().find(function(st) { return st.id === id; });
    if (!s || !Utils.confirm(s.name + ' 학생의 데이터를 삭제하겠습니까?')) return;
    DB.deleteStudent(id);
    DB.clearGroups();
    renderStudentTable();
    renderStats();
    Utils.showToast('삭제되었습니다.');
  }

  function editStudent(id) {
    var s = DB.getStudents().find(function(st) { return st.id === id; });
    if (s) openEditModal(s);
  }

  function openAddModal() { openEditModal(null); }

  function openEditModal(student) {
    var isEdit = !!student;
    document.getElementById('modal-title').textContent = isEdit ? '학생 정보 수정' : '학생 직접 추가';
    document.getElementById('modal-student-id').value = isEdit ? student.id : '';
    document.getElementById('modal-name').value = isEdit ? student.name : '';
    document.getElementById('modal-class').value = isEdit ? student.class : '1-1';
    document.getElementById('modal-number').value = isEdit ? student.number : '';
    document.getElementById('modal-gender').value = isEdit ? (student.gender || 'M') : 'M';
    document.getElementById('modal-mbti').value = isEdit ? (student.mbti || '') : '';
    document.getElementById('modal-eng').value = isEdit ? (Math.round(student.englishLevel || 3)) : 3;
    document.getElementById('modal-lead').value = isEdit ? (student.leadershipScore || 3) : 3;
    document.getElementById('modal-create').value = isEdit ? (student.creativityScore || 3) : 3;
    document.getElementById('modal-collab').value = isEdit ? (student.collaborationScore || 3) : 3;
    document.getElementById('student-modal').classList.add('open');
  }

  function closeModal() { document.getElementById('student-modal').classList.remove('open'); }

  function saveModal() {
    var id = document.getElementById('modal-student-id').value;
    var name = document.getElementById('modal-name').value.trim();
    var cls = document.getElementById('modal-class').value;
    var number = parseInt(document.getElementById('modal-number').value);
    var gender = document.getElementById('modal-gender').value;
    var mbti = document.getElementById('modal-mbti').value.trim().toUpperCase();
    var englishLevel = parseFloat(document.getElementById('modal-eng').value);
    var leadershipScore = parseInt(document.getElementById('modal-lead').value);
    var creativityScore = parseInt(document.getElementById('modal-create').value);
    var collaborationScore = parseInt(document.getElementById('modal-collab').value);

    if (!name || !cls || !number) { Utils.showToast('이름, 반, 번호는 필수입니다.', 'warning'); return; }
    if (mbti && !/^(E|I)(S|N)(T|F)(J|P)$/.test(mbti)) { Utils.showToast('MBTI 형식이 올바르지 않습니다. (예: INFJ)', 'warning'); return; }

    var data = { name, class: cls, number, gender, mbti, englishLevel, leadershipScore, creativityScore, collaborationScore, communicationScore: 3, organizationScore: 3, adaptabilityScore: 3 };

    if (id) { DB.updateStudent(id, data); Utils.showToast('수정되었습니다.'); }
    else { DB.addStudent(data); Utils.showToast('추가되었습니다.'); }

    DB.clearGroups();
    closeModal();
    renderStudentTable();
    renderStats();
  }

  function generateGroups() {
    var students = DB.getStudents();
    if (students.length < 5) { Utils.showToast('학생이 최소 5명 이상이어야 합니다.', 'warning'); return; }
    var settings = DB.getSettings();
    Utils.showLoading('최적 모둠을 구성 중입니다...');
    setTimeout(function() {
      try {
        var groups = Algorithm.formGroups(students, settings);
        DB.saveGroups(groups);
        Utils.hideLoading();
        renderStats();
        renderGroupsPanel();
        switchTab('groups');
        Utils.showToast(groups.length + '개 모둠이 구성되었습니다!', 'success');
      } catch (e) {
        Utils.hideLoading();
        Utils.showToast('오류: ' + e.message, 'danger');
        console.error(e);
      }
    }, 80);
  }

  function renderGroupsPanel() {
    var groups = DB.getGroups();
    var container = document.getElementById('groups-container');
    var empty = document.getElementById('groups-empty');
    var toolbar = document.getElementById('groups-toolbar');

    if (!groups || groups.length === 0) {
      container.style.display = 'none';
      toolbar.style.display = 'none';
      empty.style.display = 'block';
      return;
    }

    empty.style.display = 'none';
    toolbar.style.display = 'flex';
    container.style.display = 'grid';

    var colors = ['group-color-1','group-color-2','group-color-3','group-color-4',
                  'group-color-5','group-color-6','group-color-7','group-color-8'];

    container.innerHTML = groups.map(function(group, idx) {
      var colorClass = colors[idx % colors.length];
      var st = group.stats;
      var scoreClass = group.score >= 70 ? '#a7f3d0' : group.score >= 50 ? '#fde68a' : '#fca5a5';

      var membersHtml = group.members.map(function(m) {
        var gClass = Utils.genderClass(m.gender);
        var gLabel = Utils.genderLabel(m.gender);
        return '<div class="group-member">' +
          '<div class="member-avatar ' + gClass + '">' + gLabel + '</div>' +
          '<div class="member-info">' +
            '<div class="member-name">' + m.name +
              ' <span style="font-weight:400;color:var(--gray-500);font-size:.78rem">' + m.class + ' ' + m.number + '번</span>' +
            '</div>' +
            '<div class="member-meta">' +
              Utils.mbtiBadge(m.mbti) +
              ' <span style="font-size:.75rem">영어<strong>' + m.englishLevel + '</strong></span>' +
              ' <span class="badge badge-gray" style="font-size:.7rem">리더' + m.leadershipScore + '</span>' +
              ' <span class="badge badge-gray" style="font-size:.7rem">창의' + (m.creativityScore||'-') + '</span>' +
            '</div>' +
          '</div>' +
        '</div>';
      }).join('');

      return '<div class="group-card">' +
        '<div class="group-header ' + colorClass + '">' +
          '<span class="group-num">🏷️ ' + group.label + '</span>' +
          '<span class="group-score">' +
            '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:' + scoreClass + ';margin-right:4px;"></span>' +
            '균형 ' + group.score + '점' +
          '</span>' +
        '</div>' +
        '<div class="group-body">' + membersHtml + '</div>' +
        '<div class="group-stats">' +
          '<div class="stat-item"><div class="stat-label">인원</div><div class="stat-value">' + group.members.length + '명</div></div>' +
          '<div class="stat-item"><div class="stat-label">남/여</div><div class="stat-value">' + st.maleCount + '/' + st.femaleCount + '</div></div>' +
          '<div class="stat-item"><div class="stat-label">영어평균</div><div class="stat-value">' + st.engAvg + '</div></div>' +
          '<div class="stat-item"><div class="stat-label">리더</div><div class="stat-value">' + st.leaderCount + '명</div></div>' +
          '<div class="stat-item"><div class="stat-label">E형</div><div class="stat-value">' + st.extrovertCount + '명</div></div>' +
          '<div class="stat-item"><div class="stat-label">창의</div><div class="stat-value">avg ' + st.creativityAvg + '</div></div>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  function printGroups() { window.print(); }

  function exportGroups() {
    var groups = DB.getGroups();
    if (!groups) { Utils.showToast('구성된 모둠이 없습니다.', 'warning'); return; }
    var text = '===== 모둠 구성 결과 =====\n생성일: ' + new Date().toLocaleString('ko-KR') + '\n\n';
    groups.forEach(function(g) {
      text += '[' + g.label + '] (균형점수: ' + g.score + '점)\n';
      g.members.forEach(function(m, i) {
        text += '  ' + (i+1) + '. ' + m.name + ' (' + m.class + ' ' + m.number + '번, ' + Utils.genderLabel(m.gender) + ', MBTI:' + (m.mbti||'미입력') + ', 영어:' + m.englishLevel + ', 리더:' + m.leadershipScore + ', 창의:' + (m.creativityScore||'-') + ')\n';
      });
      var st = g.stats;
      text += '  → 남' + st.maleCount + '/여' + st.femaleCount + ', 영어평균' + st.engAvg + ', 리더' + st.leaderCount + '명\n\n';
    });
    var blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = '모둠구성_' + new Date().toLocaleDateString('ko-KR').replace(/\./g,'').replace(/ /g,'') + '.txt';
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportCSV() {
    var groups = DB.getGroups();
    if (!groups) { Utils.showToast('구성된 모둠이 없습니다.', 'warning'); return; }
    var csv = '모둠,이름,반,번호,성별,MBTI,영어수준,리더십,창의성,협업\n';
    groups.forEach(function(g) {
      g.members.forEach(function(m) {
        csv += g.label + ',' + m.name + ',' + m.class + ',' + m.number + ',' + Utils.genderLabel(m.gender) + ',' + (m.mbti||'') + ',' + m.englishLevel + ',' + m.leadershipScore + ',' + (m.creativityScore||'') + ',' + (m.collaborationScore||'') + '\n';
      });
    });
    var BOM = '\uFEFF';
    var blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = '모둠구성.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  function clearGroups() {
    if (!Utils.confirm('모둠 구성 결과를 초기화하겠습니까?')) return;
    DB.clearGroups(); renderGroupsPanel(); renderStats();
    Utils.showToast('초기화되었습니다.');
  }

  function clearAllData() {
    if (!Utils.confirm('모든 학생 데이터와 모둠을 삭제하겠습니까? 되돌릴 수 없습니다.')) return;
    DB.deleteAllStudents(); DB.clearGroups();
    renderStudentTable(); renderStats(); renderGroupsPanel();
    Utils.showToast('전체 데이터가 삭제되었습니다.');
  }

  function loadDemo() {
    if (!Utils.confirm('샘플 데이터(1-1반 20명, 1-2반 20명)를 불러오겠습니까? 기존 데이터는 대체됩니다.')) return;
    DB.loadDemoData(); renderStudentTable(); renderStats(); renderGroupsPanel();
    Utils.showToast('샘플 데이터가 로드되었습니다.');
  }

  function renderSettingsPanel() {
    var s = DB.getSettings();
    document.getElementById('set-group-size').value = s.groupSize;
    document.getElementById('set-separate').checked = s.separateClasses;
    document.getElementById('set-w-eng').value = Math.round((s.weights.english || .30) * 100);
    document.getElementById('set-w-mbti').value = Math.round((s.weights.mbti || .20) * 100);
    document.getElementById('set-w-gender').value = Math.round((s.weights.gender || .20) * 100);
    document.getElementById('set-w-lead').value = Math.round((s.weights.leadership || .15) * 100);
    document.getElementById('set-w-create').value = Math.round((s.weights.creativity || .10) * 100);
    document.getElementById('set-w-collab').value = Math.round((s.weights.collaboration || .05) * 100);
    document.getElementById('set-pin').value = '';
    updateWeightTotal();
  }

  function updateWeightTotal() {
    var ids = ['set-w-eng','set-w-mbti','set-w-gender','set-w-lead','set-w-create','set-w-collab'];
    var total = ids.reduce(function(sum, id) { return sum + (parseInt(document.getElementById(id).value) || 0); }, 0);
    var el = document.getElementById('weight-total');
    if (el) {
      el.textContent = '합계: ' + total + '% ' + (total !== 100 ? '⚠️ (100%가 되어야 합니다)' : '✅');
      el.style.color = total !== 100 ? 'var(--warning)' : 'var(--success)';
    }
  }

  function saveSettings() {
    var groupSize = parseInt(document.getElementById('set-group-size').value);
    var separateClasses = document.getElementById('set-separate').checked;
    var wE = parseInt(document.getElementById('set-w-eng').value);
    var wM = parseInt(document.getElementById('set-w-mbti').value);
    var wG = parseInt(document.getElementById('set-w-gender').value);
    var wL = parseInt(document.getElementById('set-w-lead').value);
    var wC = parseInt(document.getElementById('set-w-create').value);
    var wCo = parseInt(document.getElementById('set-w-collab').value);
    if (wE+wM+wG+wL+wC+wCo !== 100) { Utils.showToast('가중치 합이 100%가 되어야 합니다.', 'warning'); return; }
    var newPin = document.getElementById('set-pin').value.trim();
    var settings = DB.getSettings();
    settings.groupSize = groupSize;
    settings.separateClasses = separateClasses;
    settings.weights = { english: wE/100, mbti: wM/100, gender: wG/100, leadership: wL/100, creativity: wC/100, collaboration: wCo/100 };
    if (newPin.length >= 4) settings.adminPin = newPin;
    DB.saveSettings(settings);
    Utils.showToast('설정이 저장되었습니다.');
  }

  function exportData() {
    var blob = new Blob([DB.exportJSON()], { type: 'application/json;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = 'grouper_backup.json'; a.click();
    URL.revokeObjectURL(url);
  }

  function importData() {
    var input = document.createElement('input');
    input.type = 'file'; input.accept = '.json';
    input.onchange = function(e) {
      var file = e.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function(ev) {
        try { DB.importJSON(ev.target.result); showDashboard(); Utils.showToast('가져오기 완료!'); }
        catch (err) { Utils.showToast('파일 형식이 올바르지 않습니다.', 'danger'); }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  return {
    render, tryLogin, logout, switchTab,
    renderStudentTable, deleteStudent, editStudent,
    openAddModal, closeModal, saveModal,
    generateGroups, renderGroupsPanel, printGroups, exportGroups, exportCSV, clearGroups,
    clearAllData, loadDemo,
    renderSettingsPanel, updateWeightTotal, saveSettings,
    exportData, importData,
  };
})();

// ══════════════════════════════════════════════
// 초기화
// ══════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', function() {
  Router.register('home', function() {});
  Router.register('survey', function() { SurveyPage.render(); });
  Router.register('admin', function() { AdminPage.render(); });

  document.querySelectorAll('.nav-btn[data-page]').forEach(function(btn) {
    btn.addEventListener('click', function() { Router.navigate(btn.dataset.page); });
  });

  document.querySelectorAll('[data-goto]').forEach(function(el) {
    el.addEventListener('click', function() { Router.navigate(el.dataset.goto); });
  });

  var pinInput = document.getElementById('pin-input');
  if (pinInput) pinInput.addEventListener('keydown', function(e) { if (e.key === 'Enter') AdminPage.tryLogin(); });

  ['set-w-eng','set-w-mbti','set-w-gender','set-w-lead','set-w-create','set-w-collab'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('input', AdminPage.updateWeightTotal);
  });

  Router.navigate('home');
});
