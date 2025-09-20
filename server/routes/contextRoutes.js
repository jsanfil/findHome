const express = require('express');
const router = express.Router();
const queryContextService = require('../services/queryContextService');

// Endpoint to reset context
router.post('/reset', (req, res) => {
    queryContextService.resetContext();
    res.json({ message: 'Context reset successfully' });
});

// Endpoint to get current context (optional, for debugging)
router.get('/current', (req, res) => {
    const currentContext = queryContextService.getContext();
    res.json(currentContext);
});

module.exports = router;
