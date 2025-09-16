// models/AgentRepository.js
class AgentRepository {
  constructor() {
    // Phase 1: ใช้ Map storage (In-Memory)
    this.storage = new Map();

    // Phase 2: จะเปลี่ยนเป็น MongoDB หรือ DB อื่น
    // this.db = require('../config/database');
  }

  async findAll(filters = {}) {
    let agents = Array.from(this.storage.values());

    if (filters.status) {
      agents = agents.filter(agent => agent.status === filters.status);
    }

    if (filters.department) {
      agents = agents.filter(agent => agent.department === filters.department);
    }

    return agents;
    // Phase 2:
    // return await this.db.collection('agents').find(filters).toArray();
  }

  async findById(id) {
    return this.storage.get(id) || null;
    // Phase 2:
    // return await this.db.collection('agents').findOne({ id });
  }

  async save(agent) {
    this.storage.set(agent.id, agent);
    return agent;
    // Phase 2:
    // return await this.db.collection('agents').insertOne(agent);
  }

  async update(agent) {
    if (!this.storage.has(agent.id)) {
      return null;
    }
    this.storage.set(agent.id, agent);
    return agent;
  }

  async deleteById(id) {
    const existed = this.storage.has(id);
    this.storage.delete(id);
    return existed;
    // Phase 2:
    // return await this.db.collection('agents').deleteOne({ id });
  }

  async clearAll() {
    this.storage.clear();
  }
}

module.exports = new AgentRepository();
