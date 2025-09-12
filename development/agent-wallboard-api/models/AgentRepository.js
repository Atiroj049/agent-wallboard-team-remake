// models/AgentRepository.js - เตรียมไว้สำหรับ Phase 2
class AgentRepository {
  constructor() {
    // Phase 1: ใช้ Map storage
    this.storage = new Map();
    
    // Phase 2: จะเปลี่ยนเป็น database
    // this.db = require('../config/database');
  }

  async findAll(filters = {}) {
    // Phase 1: จาก Map
    let agents = Array.from(this.storage.values());
    
    // Apply filters
    if (filters.status) {
      agents = agents.filter(agent => agent.status === filters.status);
    }
    
    return agents;
    
    // Phase 2: จะเป็น
    // return await this.db.collection('agents').find(filters).toArray();
  }

  async save(agent) {
    // Phase 1: save to Map
    this.storage.set(agent.id, agent);
    return agent;
    
    // Phase 2: จะเป็น  
    // return await this.db.collection('agents').insertOne(agent);
  }
}