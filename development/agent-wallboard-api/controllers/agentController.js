const { Agent, agents } = require('../models/Agent');
const { AGENT_STATUS, VALID_STATUS_TRANSITIONS, API_MESSAGES } = require('../utils/constants');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const agentController = {
  // ✅ ตัวอย่างที่ให้มา
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

  // ✅ TODO #1: getAllAgents
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

      return sendSuccess(res, 'Agents retrieved successfully',
        agentList.map(agent => agent.toJSON())
      );
    } catch (error) {
      return sendError(res, 'Failed to retrieve agents', 500, error);
    }
  },

  // ✅ TODO #2: createAgent
  createAgent: (req, res) => {
    try {
      const agentData = req.body;

      const existingAgent = Array.from(agents.values())
        .find(agent => agent.agentCode === agentData.agentCode);

      if (existingAgent) {
        return sendError(res, `Agent code ${agentData.agentCode} already exists`, 409);
      }

      const newAgent = new Agent(agentData);
      agents.set(newAgent.id, newAgent);

      console.log(`➕ Created new agent: ${newAgent.agentCode}`);
      return sendSuccess(res, API_MESSAGES.AGENT_CREATED, newAgent.toJSON(), 201);
    } catch (error) {
      console.error('Error in createAgent:', error);
      return sendError(res, API_MESSAGES.INTERNAL_ERROR, 500);
    }
  },

  // ✅ ให้ code สำเร็จ
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

  // ✅ TODO #3: updateAgentStatus
  updateAgentStatus: (req, res) => {
    try {
      const { id } = req.params;
      const { status, reason } = req.body;

      const agent = agents.get(id);

      if (!agent) {
        return sendError(res, API_MESSAGES.AGENT_NOT_FOUND, 404);
      }

      if (!Object.values(AGENT_STATUS).includes(status)) {
        return sendError(res,
          `Invalid status. Valid: ${Object.values(AGENT_STATUS).join(', ')}`,
          400
        );
      }

      const currentStatus = agent.status;
      const validTransitions = VALID_STATUS_TRANSITIONS[currentStatus];

      if (!validTransitions.includes(status)) {
        return sendError(res,
          `Cannot change from ${currentStatus} to ${status}. Valid: ${validTransitions.join(', ')}`,
          400
        );
      }

      agent.updateStatus(status, reason);

      console.log(`🔄 Status changed for ${agent.agentCode}: ${currentStatus} → ${status}`);
      return sendSuccess(res, API_MESSAGES.AGENT_STATUS_UPDATED, agent.toJSON());
    } catch (error) {
      console.error('Error in updateAgentStatus:', error);
      return sendError(res, API_MESSAGES.INTERNAL_ERROR, 500);
    }
  },

  // ✅ deleteAgent
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

  // ✅ getStatusSummary
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
        statusPercentages[status] = totalAgents > 0 ? Math.round((count / totalAgents) * 100) : 0;
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
