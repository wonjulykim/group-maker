function saveSettings() {

  // 값 가져오기
  var groupSize = parseInt(document.getElementById('set-group-size').value);
  var separateClasses = document.getElementById('set-separate').checked;

  var wE = parseInt(document.getElementById('set-w-eng').value);
  var wM = parseInt(document.getElementById('set-w-mbti').value);
  var wG = parseInt(document.getElementById('set-w-gender').value);
  var wL = parseInt(document.getElementById('set-w-lead').value);
  var wC = parseInt(document.getElementById('set-w-create').value);
  var wCo = parseInt(document.getElementById('set-w-collab').value);

  // ✅ 가중치 검증
  if (wE + wM + wG + wL + wC + wCo !== 100) {
    Utils.showToast('가중치 합이 100%가 되어야 합니다.', 'warning');
    return;
  }

  // 기존 PIN 유지
  var current = DB.getSettings();

  // 새 설정 생성
  var newSettings = {
    groupSize: groupSize,
    separateClasses: separateClasses,
    weights: {
      english: wE / 100,
      mbti: wM / 100,
      gender: wG / 100,
      leadership: wL / 100,
      creativity: wC / 100,
      collaboration: wCo / 100
    },
    adminPin: current.adminPin
  };

  // 저장
  DB.saveSettings(newSettings);

  // 🔥 바로 화면 반영 (핵심)
  AdminPage.renderSettingsPanel();
  AdminPage.renderStats();

  // 완료 메시지
  Utils.showToast('설정이 저장되었습니다.');
}
