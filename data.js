function saveSettings() {

  var newSettings = {
    groupSize: parseInt(document.getElementById('set-group-size').value),
    separateClasses: document.getElementById('set-separate').checked,
    weights: {
      english: parseInt(document.getElementById('set-w-eng').value) / 100,
      mbti: parseInt(document.getElementById('set-w-mbti').value) / 100,
      gender: parseInt(document.getElementById('set-w-gender').value) / 100,
      leadership: parseInt(document.getElementById('set-w-lead').value) / 100,
      creativity: parseInt(document.getElementById('set-w-create').value) / 100,
      collaboration: parseInt(document.getElementById('set-w-collab').value) / 100
    },
    adminPin: DB.getSettings().adminPin
  };

  DB.saveSettings(newSettings);

  // 🔥 핵심 추가
  renderSettingsPanel();

  Utils.showToast('설정이 저장되었습니다.');
}
