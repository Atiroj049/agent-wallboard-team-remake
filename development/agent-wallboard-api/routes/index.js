const express = require('express');
const agentRoutes = require('./agents');

const router = express.Router();

// ✅ API health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'OK',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// ✅ API documentation
router.get('/docs', (req, res) => {
  res.json({
    title: 'Agent Wallboard API Documentation',
    version: '1.0.0',
    baseUrl: `${req.protocol}://${req.get('host')}/api/v1`,
    endpoints: {
      'GET /api/health': 'API health check',
      'GET /api/v1/agents': 'List all agents (supports ?status= and ?department=)',
      'POST /api/v1/agents': 'Create new agent',
      'GET /api/v1/agents/:id': 'Get specific agent',
      'PUT /api/v1/agents/:id': 'Update agent information',
      'PATCH /api/v1/agents/:id/status': 'Update agent status',
      'DELETE /api/v1/agents/:id': 'Delete agent',
      'GET /api/v1/agents/status/summary': 'Agent status summary'
    },
    examples: {
      createAgent: {
        method: 'POST',
        url: '/api/v1/agents',
        body: {
          agentCode: 'A999',
          name: 'John Doe',
          email: 'john@company.com',
          department: 'Sales',
          skills: ['Thai', 'English']
        }
      }
    }
  });
});

// ✅ Mount agent routes at /v1/agents
router.use('/v1/agents', agentRoutes);

module.exports = router;
