// models/Agent.js - Agent Model (รองรับทั้ง Phase 1 และ Phase 2)

const mongoose = require('mongoose');

// ✅ Config: Toggle database usage
const isDatabaseEnabled = false; // เปลี่ยนเป็น true เมื่อต้องการใช้ MongoDB

// ✅ Phase 1: Agent class (ใช้กับ in-memory storage)
class Agent {
  constructor(data) {
    this.id = data.id || this.generateId();
    this.agentCode = data.agentCode;
    this.name = data.name;
    this.email = data.email;
    this.department = data.department || 'General';
    this.skills = data.skills || [];
    this.status = data.status || 'Available';
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.loginTime = data.loginTime || null;
    this.lastStatusChange = new Date();
    this.statusHistory = data.statusHistory || [];
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = new Date();
  }

  generateId() {
    return Date.now() + Math.random().toString(36).substr(2, 9);
  }

  updateStatus(newStatus, reason = null) {
    this.statusHistory.push({
      from: this.status,
      to: newStatus,
      reason,
      timestamp: new Date()
    });

    this.status = newStatus;
    this.lastStatusChange = new Date();
    this.updatedAt = new Date();
  }

  toJSON() {
    return {
      id: this.id,
      agentCode: this.agentCode,
      name: this.name,
      email: this.email,
      department: this.department,
      skills: this.skills,
      status: this.status,
      isActive: this.isActive,
      loginTime: this.loginTime,
      lastStatusChange: this.lastStatusChange,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  getStatusHistory() {
    return this.statusHistory;
  }
}

// ✅ Phase 1: In-memory data
const agents = new Map();

// ✅ Sample Data (ใช้สำหรับทดสอบ)
function initializeSampleData() {
  if (isDatabaseEnabled) return; // ถ้าเปิดใช้ DB ไม่ต้อง initialize
  const sampleAgents = [
    {
      agentCode: 'A001',
      name: 'John Doe',
      email: 'john.doe@company.com',
      department: 'Sales',
      skills: ['Thai', 'English', 'Sales'],
      status: 'Available'
    },
    {
      agentCode: 'A002',
      name: 'Jane Smith',
      email: 'jane.smith@company.com',
      department: 'Support',
      skills: ['Thai', 'Technical Support'],
      status: 'Busy'
    },
    {
      agentCode: 'S001',
      name: 'Sarah Wilson',
      email: 'sarah.wilson@company.com',
      department: 'Technical',
      skills: ['English', 'Technical', 'Supervisor'],
      status: 'Available'
    }
  ];

  sampleAgents.forEach(data => {
    const agent = new Agent(data);
    agents.set(agent.id, agent);
  });

  console.log(`✅ Initialized ${agents.size} sample agents`);
}

// ✅ Optional: Mongoose schema (เตรียมไว้สำหรับ Phase 2)
const agentSchema = new mongoose.Schema({
  agentCode: { type: String, required: true },
  name: String,
  email: String,
  department: { type: String, default: 'General' },
  skills: [String],
  status: { type: String, default: 'Available' },
  isActive: { type: Boolean, default: true },
  loginTime: Date,
  lastStatusChange: Date,
  statusHistory: [
    {
      from: String,
      to: String,
      reason: String,
      timestamp: Date
    }
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: Date
});

const AgentModel = mongoose.models.Agent || mongoose.model('Agent', agentSchema);

// ✅ Export
module.exports = {
  Agent,
  agents,
  initializeSampleData,
  AgentModel,
  isDatabaseEnabled
};
