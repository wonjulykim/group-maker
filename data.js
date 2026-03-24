var DB = {
  students: [],
  groups: [],
  settings: {
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

  getStudents() {
    return this.students;
  },

  addStudent(data) {
    data.id = Date.now().toString();
    this.students.push(data);
  },

  updateStudent(id, newData) {
    this.students = this.students.map(s => s.id === id ? {...s, ...newData} : s);
  },

  deleteStudent(id) {
    this.students = this.students.filter(s => s.id !== id);
  },

  deleteAllStudents() {
    this.students = [];
  },

  getGroups() {
    return this.groups;
  },

  saveGroups(groups) {
    this.groups = groups;
  },

  clearGroups() {
    this.groups = [];
  },

  getSettings() {
    return this.settings;
  },

  saveSettings(settings) {
    this.settings = settings;
  }
};
