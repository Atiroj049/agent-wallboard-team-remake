// controllers/agentController.js - Business logic ที่แยกจาก routes
const { Agent, agents } = require('../models/Agent');
const { AGENT_STATUS, VALID_STATUS_TRANSITIONS, API_MESSAGES } = require('../utils/constants');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const agentController = {
  // ✅ GET /api/agents/:id
  getAgentById: (req, res) => {
    try {
      const { id } = req.params;
      const agent = agents.get(id);

      if (!agent) {
        return sendError(res, API_MESSAGES.AGENT_NOT_FOUND, 404);
      }

      console.log(`📋 Retrieved agent: ${agent.agentCode}`);
      return sendSuccess(res, 'Agent retrieved successfully', agent.toJSON());
    } catch (error) {
      console.error('Error in getAgentById:', error);
      return sendError(res, API_MESSAGES.INTERNAL_ERROR, 500);
    }
  },

  // 🔄 TODO #1 (ทำเสร็จแล้ว)
  // GET /api/agents
  getAllAgents: (req, res) => {
    try {
      const { status, department } = req.query;
      let agentList = Array.from(agents.values());

      if (status) {
        agentList = agentList.filter(agent => agent.status === status);
      }
      if (department) {
        agentList = agentList.filter(agent => agent.department === department);
      }

      console.log(`📋 Retrieved ${agentList.length} agents`);
      return sendSuccess(
        res,
        'Agents retrieved successfully',
        agentList.map(agent => agent.toJSON())
      );
    } catch (error) {
      console.error('Error in getAllAgents:', error);
      return sendError(res, API_MESSAGES.INTERNAL_ERROR, 500);
    }
  },

  // 🔄 TODO #2 (ทำเสร็จแล้ว)
  // POST /api/agents
  createAgent: (req, res) => {
    try {
      const agentData = req.body;

      if (!agentData.agentCode || !agentData.name || !agentData.department) {
        return sendError(res, 'Missing required fields: agentCode, name, department', 400);
      }

      // ตรวจสอบ agentCode ซ้ำ
      const duplicate = Array.from(agents.values()).find(
        (a) => a.agentCode === agentData.agentCode
      );
      if (duplicate) {
        return sendError(res, `Agent with code ${agentData.agentCode} already exists`, 409);
      }

      // สร้าง Agent ใหม่
      const newAgent = new Agent(agentData);

      // เก็บลง Map
      agents.set(newAgent.id, newAgent);

      console.log(`➕ Created new agent: ${newAgent.agentCode} - ${newAgent.name}`);
      return sendSuccess(res, API_MESSAGES.AGENT_CREATED, newAgent.toJSON(), 201);
    } catch (error) {
      console.error('Error in createAgent:', error);
      return sendError(res, API_MESSAGES.INTERNAL_ERROR, 500);
    }
  },

  // ✅ PUT /api/agents/:id
  updateAgent: (req, res) => {
    try {
      const { id } = req.params;
      const agent = agents.get(id);

      if (!agent) {
        return sendError(res, API_MESSAGES.AGENT_NOT_FOUND, 404);
      }

      const { name, email, department, skills } = req.body;

      if (name) agent.name = name;
      if (email) agent.email = email;
      if (department) agent.department = department;
      if (skills) agent.skills = skills;

      agent.updatedAt = new Date();

      console.log(`✏️ Updated agent: ${agent.agentCode}`);
      return sendSuccess(res, API_MESSAGES.AGENT_UPDATED, agent.toJSON());
    } catch (error) {
      console.error('Error in updateAgent:', error);
      return sendError(res, API_MESSAGES.INTERNAL_ERROR, 500);
    }
  },

  // 🔄 TODO #3 (ทำเสร็จแล้ว)
  // PATCH /api/agents/:id/status
  updateAgentStatus: (req, res) => {
    try {
      const { id } = req.params;
      const { status, reason } = req.body;

      // หา agent จาก id
      const agent = agents.get(id);
      if (!agent) {
        return sendError(res, API_MESSAGES.AGENT_NOT_FOUND, 404);
      }

      // ตรวจสอบว่า status ที่ส่งมาตรงกับ AGENT_STATUS
      if (!Object.values(AGENT_STATUS).includes(status)) {
        return sendError(res, `Invalid status: ${status}`, 400);
      }

      // ตรวจสอบ transition ถูกต้อง
      const currentStatus = agent.status;
      const validNext = VALID_STATUS_TRANSITIONS[currentStatus] || [];
      if (!validNext.includes(status)) {
        return sendError(
          res,
          `Invalid status transition from ${currentStatus} to ${status}`,
          400
        );
      }

      // อัพเดทสถานะ
      agent.updateStatus(status, reason);

      console.log(`🔄 Updated status for agent ${agent.agentCode}: ${currentStatus} -> ${status}`);
      return sendSuccess(res, API_MESSAGES.STATUS_UPDATED, agent.toJSON());
    } catch (error) {
      console.error('Error in updateAgentStatus:', error);
      return sendError(res, API_MESSAGES.INTERNAL_ERROR, 500);
    }
  },

  // ✅ DELETE /api/agents/:id
  deleteAgent: (req, res) => {
    try {
      const { id } = req.params;
      const agent = agents.get(id);

      if (!agent) {
        return sendError(res, API_MESSAGES.AGENT_NOT_FOUND, 404);
      }

      agents.delete(id);

      console.log(`🗑️ Deleted agent: ${agent.agentCode} - ${agent.name}`);
      return sendSuccess(res, API_MESSAGES.AGENT_DELETED);
    } catch (error) {
      console.error('Error in deleteAgent:', error);
      return sendError(res, API_MESSAGES.INTERNAL_ERROR, 500);
    }
  },

  // ✅ GET /api/agents/status/summary
  getStatusSummary: (req, res) => {
    try {
      const agentList = Array.from(agents.values());
      const totalAgents = agentList.length;

      const statusCounts = {};
      Object.values(AGENT_STATUS).forEach(status => {
        statusCounts[status] = agentList.filter(agent => agent.status === status).length;
      });

      const statusPercentages = {};
      Object.entries(statusCounts).forEach(([status, count]) => {
        statusPercentages[status] =
          totalAgents > 0 ? Math.round((count / totalAgents) * 100) : 0;
      });

      const summary = {
        totalAgents,
        statusCounts,
        statusPercentages,
        lastUpdated: new Date().toISOString()
      };

      return sendSuccess(res, 'Status summary retrieved successfully', summary);
    } catch (error) {
      console.error('Error in getStatusSummary:', error);
      return sendError(res, API_MESSAGES.INTERNAL_ERROR, 500);
    }
  }
};

module.exports = agentController;
