var DB = {

  students: JSON.parse(localStorage.getItem('students') || '[]'),
  groups: JSON.parse(localStorage.getItem('groups') || '[]'),
  settings: JSON.parse(localStorage.getItem('settings') || JSON.stringify({
    adminPin: "1234",
    groupSize: 5,
    separateClasses: true,
    weights: {
      english: 0.3,
      mbti: 0.2,
      gender: 0.2,
      leadership: 0.15,
      creativity: 0.1,
      collaboration: 0.05
    }
  })),

  // =====================
  // 학생
  // =====================
  getStudents() {
    return this.students;
  },

  addStudent(data) {
    data.id = Date.now().toString();
    this.students.push(data);
    localStorage.setItem('students', JSON.stringify(this.students));
  },

  updateStudent(id, newData) {
    this.students = this.students.map(s => s.id === id ? {...s, ...newData} : s);
    localStorage.setItem('students', JSON.stringify(this.students));
  },

  deleteStudent(id) {
    this.students = this.students.filter(s => s.id !== id);
    localStorage.setItem('students', JSON.stringify(this.students));
  },

  deleteAllStudents() {
    this.students = [];
    localStorage.setItem('students', JSON.stringify(this.students));
  },

  // =====================
  // 그룹
  // =====================
  getGroups() {
    return this.groups;
  },

  saveGroups(groups) {
    this.groups = groups;
    localStorage.setItem('groups', JSON.stringify(groups));
  },

  clearGroups() {
    this.groups = [];
    localStorage.setItem('groups', JSON.stringify([]));
  },

  // =====================
  // 설정
  // =====================
  getSettings() {
    return this.settings;
  },

  saveSettings(settings) {
    this.settings = settings;
    localStorage.setItem('settings', JSON.stringify(settings));
  }

};
