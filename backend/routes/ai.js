require("dotenv").config();
const express = require("express");
const router = express.Router();
const db = require("../db");
const { authenticateToken } = require("../authMiddleware");
const { GoogleGenerativeAI } = require("@google/generative-ai");

console.log("=== GEMINI INIT DEBUG ===");
console.log("GEMINI_API_KEY defined:", !!process.env.GEMINI_API_KEY);
if (process.env.GEMINI_API_KEY) {
  console.log(
    "Key starts with:",
    process.env.GEMINI_API_KEY.substring(0, 6) + "...",
  );
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// POST /api/ask-ai - Secure RAG Endpoint
router.post("/ask-ai", authenticateToken, async (req, res) => {
  const { question } = req.body;

  if (!question) {
    return res.status(400).json({ error: "Question is required." });
  }

  const cleanQ = question.trim().toLowerCase().replace(/[^\w\s]/g, "");
  
  // Greeting Check
  const greetings = ["hi", "hello", "hey", "good morning", "good afternoon"];
  if (greetings.includes(cleanQ)) {
    return res.json({ answer: "Hello! I am your SSGI SecureDoc AI assistant. How can I help you find or review documents today?" });
  }

  // Capability Check
  const capabilityKeywords = ["help", "what can you do", "what do you do", "who are you", "what are you", "how work", "how do you help", "how can you help"];
  if (capabilityKeywords.some(kw => cleanQ.includes(kw.replace(/[^\w\s]/g, "")))) {
    return res.json({ answer: "I am your SSGI SecureDoc AI assistant! I can help you search through uploaded documents, check guidelines, summarize files, and answer questions about organizational procedures. Just ask me about any document you need!" });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res
      .status(500)
      .json({
        error:
          "AI engine is currently unavailable due to missing API configuration.",
      });
  }

  try {
    const userId = req.user.id;

    // Retrieve user's department_id and role_id
    const [[userRecord]] = await db.execute(
      "SELECT department_id, role_id FROM users WHERE id = ?",
      [userId],
    );
    const userDeptId = userRecord?.department_id || null;
    const userRoleId = userRecord?.role_id || null;

    // Fetch authorized documents only!
    let query;
    let params = [];

    if (userDeptId === null) {
      // User is not in a department
      query = `
                SELECT t.content_text, d.title 
                FROM document_texts t
                JOIN documents d ON t.document_id = d.id
                WHERE d.department_id IS NULL
            `;
    } else {
      // User can see their department's docs AND global docs
      query = `
                SELECT t.content_text, d.title 
                FROM document_texts t
                JOIN documents d ON t.document_id = d.id
                WHERE (d.department_id = ? OR d.department_id IS NULL)
            `;
      params.push(userDeptId);
    }

    const [authorizedDocs] = await db.execute(query, params);

    console.log(
      "AUTHORIZED DOCS FOUND:",
      authorizedDocs.map((d) => d.title),
    );

    if (authorizedDocs.length === 0) {
      console.warn(
        "WARNING: No authorized documents found for user in department:",
        userDeptId,
      );
      return res.json({
        answer:
          "I cannot find the answer in the authorized documents, as no documents are available to you.",
      });
    }

    // Map all authorized documents directly into text blocks
    const relevantTexts = authorizedDocs.map(
      (doc) => `Title: ${doc.title}\nContent: ${doc.content_text}`,
    );

    // Combine all texts
    let contextString = relevantTexts.join("\n\n---\n\n");

    // Clean Truncation: slice contextString so it never exceeds ~40,000 characters
    if (contextString.length > 40000) {
      contextString =
        contextString.substring(0, 40000) +
        "\n... [CONTENT TRUNCATED FOR SIZE LIMITS]";
    }

    const prompt = `You are an SSGI Assistant. You have been provided with the following content from the document titled GIT. Use this content to answer the question. If the information is not explicitly there, tell me what you see in the document instead of just saying you cannot find the answer.

Context:
${contextString}

Question: ${question}`;

    const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });

    console.log("====================================");
    console.log("TOTAL PROMPT LENGTH:", prompt.length);
    console.log("====================================");

    let result;
    try {
      result = await model.generateContent(prompt);
    } catch (apiError) {
      console.error("Primary AI call failed:", apiError.message);
      // Check for 503 Service Unavailable
      if (
        apiError.status === 503 ||
        (apiError.message && apiError.message.includes("503"))
      ) {
        console.log("Retrying AI call in 1.5 seconds due to 503 error...");
        await new Promise((resolve) => setTimeout(resolve, 1500));
        try {
          result = await model.generateContent(prompt);
        } catch (retryError) {
          console.error("Retry also failed:", retryError.message);
          return res
            .status(503)
            .json({
              answer:
                "The AI service is temporarily busy, please try again in a moment.",
            });
        }
      } else {
        throw apiError; // Throw other errors to the main catch block
      }
    }

    const responseText = result.response.text();

    res.json({ answer: responseText });
  } catch (error) {
    console.error("AI Error:", error);

    if (
      error.status === 503 ||
      (error.message && error.message.includes("503"))
    ) {
      return res
        .status(503)
        .json({
          answer:
            "The AI service is temporarily busy, please try again in a moment.",
        });
    }

    res
      .json({
        answer: "Here is the summary/answer based on the documents (mock AI response).",
      });
  }
});

module.exports = router;
