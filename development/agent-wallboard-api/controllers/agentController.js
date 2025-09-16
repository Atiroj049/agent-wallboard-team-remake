const Agent = require('../models/Agent');
const { AGENT_STATUS, VALID_STATUS_TRANSITIONS, API_MESSAGES } = require('../utils/constants');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const agentController = {
  // ✅ GET /api/agents/:id
  getAgentById: async (req, res) => {
    try {
      const { id } = req.params;
      const agent = await Agent.findById(id);

      if (!agent) {
        return sendError(res, API_MESSAGES.AGENT_NOT_FOUND, 404);
      }

      console.log(`📋 Retrieved agent: ${agent.agentCode}`);
      return sendSuccess(res, 'Agent retrieved successfully', agent);
    } catch (error) {
      console.error('Error in getAgentById:', error);
      return sendError(res, API_MESSAGES.INTERNAL_ERROR, 500, error);
    }
  },

  // ✅ GET /api/agents?status=Available&department=Sales
  getAllAgents: async (req, res) => {
    try {
      const { status, department } = req.query;
      const filters = {};
      if (status) filters.status = status;
      if (department) filters.department = department;

      const agents = await Agent.find(filters);
      return sendSuccess(res, 'Agents retrieved successfully', agents);
    } catch (error) {
      return sendError(res, 'Failed to retrieve agents', 500, error);
    }
  },

  // ✅ POST /api/agents
  createAgent: async (req, res) => {
    try {
      const { agentCode } = req.body;

      const existingAgent = await Agent.findOne({ agentCode });
      if (existingAgent) {
        return sendError(res, `Agent code ${agentCode} already exists`, 409);
      }

      const newAgent = new Agent(req.body);
      await newAgent.save();

      console.log(`➕ Created new agent: ${newAgent.agentCode}`);
      return sendSuccess(res, API_MESSAGES.AGENT_CREATED, newAgent, 201);
    } catch (error) {
      console.error('Error in createAgent:', error);
      return sendError(res, API_MESSAGES.INTERNAL_ERROR, 500, error);
    }
  },

  // ✅ PUT /api/agents/:id
  updateAgent: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const agent = await Agent.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true
      });

      if (!agent) {
        return sendError(res, API_MESSAGES.AGENT_NOT_FOUND, 404);
      }

      console.log(`✏️ Updated agent: ${agent.agentCode}`);
      return sendSuccess(res, API_MESSAGES.AGENT_UPDATED, agent);
    } catch (error) {
      console.error('Error in updateAgent:', error);
      return sendError(res, API_MESSAGES.INTERNAL_ERROR, 500, error);
    }
  },

  // ✅ PATCH /api/agents/:id/status
  updateAgentStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status, reason } = req.body;

      const agent = await Agent.findById(id);
      if (!agent) {
        return sendError(res, API_MESSAGES.AGENT_NOT_FOUND, 404);
      }

      if (!Object.values(AGENT_STATUS).includes(status)) {
        return sendError(res,
          `Invalid status. Valid: ${Object.values(AGENT_STATUS).join(', ')}`,
          400
        );
      }

      const validTransitions = VALID_STATUS_TRANSITIONS[agent.status];
      if (!validTransitions.includes(status)) {
        return sendError(res,
          `Cannot change from ${agent.status} to ${status}. Valid: ${validTransitions.join(', ')}`,
          400
        );
      }

      // เรียกเมธอดของ schema
      agent.updateStatus(status, reason);
      await agent.save();

      // ✅ Emit WebSocket event
      const io = req.app.get('io');
      io.emit('agentStatusChanged', {
        agentId: agent._id,
        agentCode: agent.agentCode,
        newStatus: agent.status,
        timestamp: new Date()
      });

      console.log(`🔄 Status changed for ${agent.agentCode}: ${status}`);
      return sendSuccess(res, API_MESSAGES.AGENT_STATUS_UPDATED, agent);
    } catch (error) {
      console.error('Error in updateAgentStatus:', error);
      return sendError(res, API_MESSAGES.INTERNAL_ERROR, 500, error);
    }
  },

  // ✅ DELETE /api/agents/:id
  deleteAgent: async (req, res) => {
    try {
      const { id } = req.params;

      const agent = await Agent.findByIdAndDelete(id);
      if (!agent) {
        return sendError(res, API_MESSAGES.AGENT_NOT_FOUND, 404);
      }

      console.log(`🗑️ Deleted agent: ${agent.agentCode} - ${agent.name}`);
      return sendSuccess(res, API_MESSAGES.AGENT_DELETED);
    } catch (error) {
      console.error('Error in deleteAgent:', error);
      return sendError(res, API_MESSAGES.INTERNAL_ERROR, 500, error);
    }
  },

  // ✅ GET /api/agents/status/summary
  getStatusSummary: async (req, res) => {
    try {
      const allAgents = await Agent.find();
      const totalAgents = allAgents.length;

      const statusCounts = {};
      Object.values(AGENT_STATUS).forEach(status => {
        statusCounts[status] = allAgents.filter(agent => agent.status === status).length;
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
      return sendError(res, API_MESSAGES.INTERNAL_ERROR, 500, error);
    }
  }
};

module.exports = agentController;
