function saveSettings() {

  var groupSize = parseInt(document.getElementById('set-group-size').value);
  var separateClasses = document.getElementById('set-separate').checked;

  var wE = parseInt(document.getElementById('set-w-eng').value);
  var wM = parseInt(document.getElementById('set-w-mbti').value);
  var wG = parseInt(document.getElementById('set-w-gender').value);
  var wL = parseInt(document.getElementById('set-w-lead').value);
  var wC = parseInt(document.getElementById('set-w-create').value);
  var wCo = parseInt(document.getElementById('set-w-collab').value);

  if (wE+wM+wG+wL+wC+wCo !== 100) {
    Utils.showToast('가중치 합이 100%가 되어야 합니다.', 'warning');
    return;
  }

  var newPin = document.getElementById('set-pin').value.trim();

  // 🔥 완전히 새 객체 생성 (핵심)
  var newSettings = {
    groupSize: groupSize,
    separateClasses: separateClasses,
    weights: {
      english: wE/100,
      mbti: wM/100,
      gender: wG/100,
      leadership: wL/100,
      creativity: wC/100,
      collaboration: wCo/100
    },
    adminPin: newPin.length >= 4 ? newPin : DB.getSettings().adminPin
  };

  DB.saveSettings(newSettings);

  Utils.showToast('설정이 저장되었습니다.');
}
