var Algorithm = {

  formGroups: function(students, settings) {
    const groupSize = settings.groupSize || 4;

    // 학생 섞기 (랜덤)
    const shuffled = [...students].sort(() => Math.random() - 0.5);

    const groups = [];
    let groupIndex = 1;

    for (let i = 0; i < shuffled.length; i += groupSize) {
      const members = shuffled.slice(i, i + groupSize);

      groups.push({
        label: groupIndex + '모둠',
        members: members,
        score: calculateGroupScore(members),
        stats: calculateStats(members)
      });

      groupIndex++;
    }

    return groups;
  }
};


// ───────────── 내부 함수 ─────────────

// 간단 점수 계산
function calculateGroupScore(members) {
  if (!members.length) return 0;

  const avg = members.reduce((sum, m) => sum + (m.englishLevel || 3), 0) / members.length;

  return Math.round(avg * 20); // 100점 기준
}

// 통계 계산
function calculateStats(members) {
  let male = 0, female = 0, leader = 0, extro = 0;
  let engSum = 0, createSum = 0;

  members.forEach(m => {
    if (m.gender === 'M') male++;
    else female++;

    if (m.leadershipScore >= 4) leader++;
    if (m.mbti && m.mbti[0] === 'E') extro++;

    engSum += m.englishLevel || 3;
    createSum += m.creativityScore || 3;
  });

  return {
    maleCount: male,
    femaleCount: female,
    leaderCount: leader,
    extrovertCount: extro,
    engAvg: Math.round(engSum / members.length * 10) / 10,
    creativityAvg: Math.round(createSum / members.length * 10) / 10
  };
}
