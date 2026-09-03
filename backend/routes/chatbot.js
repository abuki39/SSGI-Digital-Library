const express = require('express');
const router = express.Router();

// POST /api/chatbot/ask
router.post('/ask', (req, res) => {
    const { message } = req.body;
    
    if (!message) {
        return res.status(400).json({ error: 'Message is required.' });
    }

    // Mock AI responses based on keywords
    let aiResponse = "I'm the SSGI Digital Library AI Assistant. How can I help you find resources today?";
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('search') || lowerMessage.includes('find')) {
        aiResponse = "You can search for documents using the 'Search & Discovery' tab. Try searching by title, author, or keyword (e.g., 'mapping' or 'geospatial').";
    } else if (lowerMessage.includes('download') || lowerMessage.includes('print')) {
        aiResponse = "For security reasons, documents on SSGI Digital Library are read-only and cannot be downloaded or printed.";
    } else if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
        aiResponse = "Hello! I can assist you with navigating the digital library. What are you looking for?";
    } else {
        aiResponse = `I understand you are asking about "${message}". Since I am currently in Phase 3 mock mode, I recommend checking the Search tab or asking a Librarian for specific assistance.`;
    }

    // Simulate AI processing delay
    setTimeout(() => {
        res.json({ response: aiResponse });
    }, 1000);
});

module.exports = router;
