var DB = {

  students: JSON.parse(localStorage.getItem('students') || '[]'),
  groups: JSON.parse(localStorage.getItem('groups') || '[]'),
  settings: JSON.parse(localStorage.getItem('settings') || 'null') || {
    adminPin: "1234",
    groupSize: 4,
    separateClasses: false,
    weights: {
      english: 0.3,
      mbti: 0.2,
      gender: 0.2,
      leadership: 0.15,
      creativity: 0.1,
      collaboration: 0.05
    }
  },

  // ⭐ 저장 함수
  save() {
    localStorage.setItem('students', JSON.stringify(this.students));
    localStorage.setItem('groups', JSON.stringify(this.groups));
    localStorage.setItem('settings', JSON.stringify(this.settings));
  },

  getStudents() {
    return this.students;
  },

  addStudent(data) {
    data.id = Date.now().toString();
    this.students.push(data);
    this.save(); // 🔥 핵심
  },

  updateStudent(id, newData) {
    this.students = this.students.map(s => s.id === id ? {...s, ...newData} : s);
    this.save();
  },

  deleteStudent(id) {
    this.students = this.students.filter(s => s.id !== id);
    this.save();
  },

  deleteAllStudents() {
    this.students = [];
    this.save();
  },

  getGroups() {
    return this.groups;
  },

  saveGroups(groups) {
    this.groups = groups;
    this.save();
  },

  clearGroups() {
    this.groups = [];
    this.save();
  },

  getSettings() {
    return this.settings;
  },

  saveSettings(settings) {
    this.settings = settings;
    this.save();
  }
};
