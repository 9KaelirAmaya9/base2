/**
 * Gemini AI Service
 * Core AI agent for contract generation, document analysis, and automation
 */

const { GoogleGenerativeAI } = require('@google-ai/generativelanguage');
const { GoogleAuth } = require('google-auth-library');

class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.model = process.env.GEMINI_MODEL || 'gemini-1.5-pro';
    this.maxTokens = parseInt(process.env.GEMINI_MAX_TOKENS) || 8192;
    this.client = null;
    this.initialized = false;
  }

  /**
   * Initialize Gemini service
   */
  async initialize() {
    try {
      if (!this.apiKey) {
        throw new Error('GEMINI_API_KEY not configured');
      }

      this.client = new GoogleGenerativeAI(this.apiKey);
      this.initialized = true;

      console.log(`Gemini service initialized with model: ${this.model}`);
      return this;
    } catch (error) {
      console.error('Failed to initialize Gemini service:', error.message);
      throw error;
    }
  }

  /**
   * Ensure service is initialized
   */
  ensureInitialized() {
    if (!this.initialized) {
      throw new Error('Gemini service not initialized. Call initialize() first.');
    }
  }

  /**
   * Generate content from text prompt
   * @param {string} prompt - Text prompt
   * @param {object} options - Generation options
   */
  async generateContent(prompt, options = {}) {
    this.ensureInitialized();

    try {
      const model = this.client.getGenerativeModel({ model: this.model });

      const generationConfig = {
        maxOutputTokens: options.maxTokens || this.maxTokens,
        temperature: options.temperature || 0.7,
        topP: options.topP || 0.9,
        topK: options.topK || 40,
      };

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig,
      });

      const response = result.response;
      const text = response.text();

      return {
        text,
        tokensUsed: {
          prompt: response.usageMetadata?.promptTokenCount || 0,
          response: response.usageMetadata?.candidatesTokenCount || 0,
          total: response.usageMetadata?.totalTokenCount || 0,
        },
      };
    } catch (error) {
      console.error('Gemini generateContent error:', error.message);
      throw new Error(`Gemini API error: ${error.message}`);
    }
  }

  /**
   * Analyze contract document
   * @param {string} contractText - Contract text content
   * @param {string} analysisType - Type of analysis
   */
  async analyzeContract(contractText, analysisType = 'comprehensive') {
    const prompts = {
      comprehensive: `Analyze the following contract comprehensively. Provide:
1. Contract type and parties involved
2. Key terms and obligations
3. Payment terms and amounts
4. Important dates (effective date, expiration, renewal)
5. Termination clauses
6. Potential risks or red flags
7. Missing or unclear provisions

Contract:
${contractText}

Provide your analysis in structured JSON format.`,

      risk_assessment: `Perform a risk assessment of the following contract. Identify:
1. Legal risks
2. Financial risks
3. Compliance risks
4. Operational risks
5. Risk mitigation recommendations

Contract:
${contractText}`,

      summary: `Provide a concise summary of the following contract in 3-5 bullet points:

Contract:
${contractText}`,

      key_dates: `Extract all important dates from the following contract:
- Effective date
- Expiration date
- Renewal dates
- Payment due dates
- Milestone dates
- Notice periods

Contract:
${contractText}

Return as JSON array of {date, description, type}.`,

      financial_terms: `Extract all financial terms from the following contract:
- Contract value/amount
- Payment schedule
- Currency
- Payment methods
- Late fees or penalties
- Discounts or incentives

Contract:
${contractText}

Return as structured JSON.`,
    };

    const prompt = prompts[analysisType] || prompts.comprehensive;

    const result = await this.generateContent(prompt);

    try {
      // Try to parse as JSON if analysis type expects it
      if (['comprehensive', 'key_dates', 'financial_terms'].includes(analysisType)) {
        const jsonMatch = result.text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
        if (jsonMatch) {
          return {
            ...result,
            analysis: JSON.parse(jsonMatch[0]),
          };
        }
      }
    } catch (e) {
      // If JSON parsing fails, return as text
    }

    return {
      ...result,
      analysis: result.text,
    };
  }

  /**
   * Generate contract from template and parameters
   * @param {object} params - Contract parameters
   */
  async generateContract(params) {
    const {
      contractType,
      partyName,
      templateInstructions,
      customTerms = {},
      tone = 'professional',
    } = params;

    const prompt = `Generate a ${contractType} contract with the following details:

Party Name: ${partyName}
Tone: ${tone}

Template Instructions:
${templateInstructions}

Custom Terms:
${JSON.stringify(customTerms, null, 2)}

Requirements:
1. Use professional legal language
2. Include all standard clauses for this contract type
3. Make it clear and unambiguous
4. Include placeholders for signatures and dates
5. Use proper formatting with sections and subsections
6. Include definitions section if needed

Generate the complete contract document.`;

    return await this.generateContent(prompt, {
      temperature: 0.5, // Lower temperature for more consistent legal text
    });
  }

  /**
   * Generate contract clauses
   * @param {string} clauseType - Type of clause
   * @param {object} parameters - Clause parameters
   */
  async generateClause(clauseType, parameters = {}) {
    const prompt = `Generate a ${clauseType} clause for a contract with the following parameters:

${JSON.stringify(parameters, null, 2)}

The clause should be:
1. Legally sound and clear
2. Appropriate for the contract context
3. Well-structured and professional
4. Include any necessary definitions

Generate only the clause text, properly formatted.`;

    return await this.generateContent(prompt, { temperature: 0.5 });
  }

  /**
   * Extract data from document
   * @param {string} documentText - Document text
   * @param {object} schema - Expected data schema
   */
  async extractData(documentText, schema) {
    const prompt = `Extract the following information from the document:

Expected Schema:
${JSON.stringify(schema, null, 2)}

Document:
${documentText}

Return the extracted data in JSON format matching the schema. If information is not found, use null.`;

    const result = await this.generateContent(prompt);

    try {
      const jsonMatch = result.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return {
          ...result,
          extractedData: JSON.parse(jsonMatch[0]),
        };
      }
    } catch (e) {
      console.error('Failed to parse extracted data:', e);
    }

    return result;
  }

  /**
   * Generate dashboard insights
   * @param {object} dashboardData - Dashboard data
   * @param {string} dashboardType - Type of dashboard (sales, operations, financial)
   */
  async generateDashboardInsights(dashboardData, dashboardType) {
    const prompt = `Analyze the following ${dashboardType} dashboard data and provide actionable insights:

Data:
${JSON.stringify(dashboardData, null, 2)}

Provide:
1. Key trends and patterns
2. Anomalies or concerns
3. Performance highlights
4. Recommendations for improvement
5. Predicted outcomes based on current trends

Format the insights as a structured report with clear sections.`;

    return await this.generateContent(prompt);
  }

  /**
   * Analyze email and suggest actions
   * @param {object} emailData - Email data (subject, body, sender, etc.)
   */
  async analyzeEmail(emailData) {
    const prompt = `Analyze this email and suggest appropriate actions:

From: ${emailData.sender}
Subject: ${emailData.subject}
Body:
${emailData.body}

Provide:
1. Email category (contract-related, inquiry, complaint, notification, etc.)
2. Priority level (high, medium, low)
3. Sentiment analysis
4. Key information extracted
5. Suggested actions or responses
6. Related tasks to create

Return as structured JSON.`;

    const result = await this.generateContent(prompt);

    try {
      const jsonMatch = result.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return {
          ...result,
          analysis: JSON.parse(jsonMatch[0]),
        };
      }
    } catch (e) {
      console.error('Failed to parse email analysis:', e);
    }

    return result;
  }

  /**
   * Generate email response
   * @param {object} params - Response parameters
   */
  async generateEmailResponse(params) {
    const { originalEmail, context, tone = 'professional', instructions = '' } = params;

    const prompt = `Generate a ${tone} email response based on:

Original Email:
From: ${originalEmail.sender}
Subject: ${originalEmail.subject}
Body: ${originalEmail.body}

Context:
${context}

Instructions:
${instructions}

Generate a well-formatted email response that is:
1. Professional and courteous
2. Addresses all points from the original email
3. Provides clear next steps if needed
4. Maintains appropriate tone`;

    return await this.generateContent(prompt);
  }

  /**
   * Automate workflow decision
   * @param {object} trigger - Workflow trigger data
   * @param {object} workflowConfig - Workflow configuration
   */
  async automateWorkflow(trigger, workflowConfig) {
    const prompt = `Based on the following trigger event and workflow configuration, determine the appropriate actions:

Trigger Event:
${JSON.stringify(trigger, null, 2)}

Workflow Configuration:
${JSON.stringify(workflowConfig, null, 2)}

Determine:
1. Should this workflow be executed? (yes/no with reasoning)
2. Which actions should be performed?
3. What are the action parameters?
4. Any special conditions or warnings?

Return as JSON with structure: {execute: boolean, reason: string, actions: [{action, parameters}], warnings: []}`;

    const result = await this.generateContent(prompt);

    try {
      const jsonMatch = result.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return {
          ...result,
          decision: JSON.parse(jsonMatch[0]),
        };
      }
    } catch (e) {
      console.error('Failed to parse workflow decision:', e);
    }

    return result;
  }

  /**
   * Summarize document
   * @param {string} documentText - Document text
   * @param {number} maxLength - Maximum summary length in words
   */
  async summarizeDocument(documentText, maxLength = 200) {
    const prompt = `Summarize the following document in no more than ${maxLength} words. Focus on key points and main takeaways:

${documentText}`;

    return await this.generateContent(prompt);
  }

  /**
   * Compare documents
   * @param {string} doc1 - First document
   * @param {string} doc2 - Second document
   */
  async compareDocuments(doc1, doc2) {
    const prompt = `Compare the following two documents and identify:
1. Key differences
2. Similarities
3. Missing content in either document
4. Conflicting information
5. Recommendations for reconciliation

Document 1:
${doc1}

Document 2:
${doc2}`;

    return await this.generateContent(prompt);
  }

  /**
   * Generate meeting summary from transcript
   * @param {string} transcript - Meeting transcript
   */
  async generateMeetingSummary(transcript) {
    const prompt = `Generate a meeting summary from the following transcript:

${transcript}

Include:
1. Meeting overview
2. Key discussion points
3. Decisions made
4. Action items with owners
5. Follow-up needed

Format as a professional meeting minutes document.`;

    return await this.generateContent(prompt);
  }

  /**
   * Chat with context (multi-turn conversation)
   * @param {Array} messages - Array of {role, content} messages
   * @param {object} options - Generation options
   */
  async chat(messages, options = {}) {
    this.ensureInitialized();

    try {
      const model = this.client.getGenerativeModel({ model: this.model });

      const contents = messages.map((msg) => ({
        role: msg.role,
        parts: [{ text: msg.content }],
      }));

      const generationConfig = {
        maxOutputTokens: options.maxTokens || this.maxTokens,
        temperature: options.temperature || 0.7,
      };

      const result = await model.generateContent({
        contents,
        generationConfig,
      });

      const response = result.response;

      return {
        text: response.text(),
        tokensUsed: {
          prompt: response.usageMetadata?.promptTokenCount || 0,
          response: response.usageMetadata?.candidatesTokenCount || 0,
          total: response.usageMetadata?.totalTokenCount || 0,
        },
      };
    } catch (error) {
      console.error('Gemini chat error:', error.message);
      throw new Error(`Gemini API error: ${error.message}`);
    }
  }

  /**
   * Log Gemini request to database
   * @param {object} db - Database instance
   * @param {object} requestData - Request data
   */
  async logRequest(db, requestData) {
    const {
      userId,
      requestType,
      prompt,
      response,
      tokensUsed,
      durationMs,
      status,
      errorMessage,
    } = requestData;

    try {
      await db.query(
        `INSERT INTO gemini_requests
         (request_id, user_id, request_type, model, prompt, prompt_tokens, response, response_tokens, total_tokens, duration_ms, status, error_message)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          `gemini-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          userId,
          requestType,
          this.model,
          prompt,
          tokensUsed?.prompt || 0,
          response,
          tokensUsed?.response || 0,
          tokensUsed?.total || 0,
          durationMs,
          status,
          errorMessage,
        ]
      );
    } catch (error) {
      console.error('Failed to log Gemini request:', error.message);
    }
  }

  /**
   * Generate content with logging
   * @param {object} db - Database instance
   * @param {string} prompt - Prompt
   * @param {object} options - Options including userId, requestType
   */
  async generateContentWithLogging(db, prompt, options = {}) {
    const startTime = Date.now();
    let status = 'success';
    let errorMessage = null;
    let result = null;

    try {
      result = await this.generateContent(prompt, options);
    } catch (error) {
      status = 'error';
      errorMessage = error.message;
      throw error;
    } finally {
      const durationMs = Date.now() - startTime;

      await this.logRequest(db, {
        userId: options.userId,
        requestType: options.requestType || 'generate_content',
        prompt: prompt.substring(0, 1000), // Truncate for storage
        response: result?.text?.substring(0, 1000),
        tokensUsed: result?.tokensUsed,
        durationMs,
        status,
        errorMessage,
      });
    }

    return result;
  }
}

module.exports = GeminiService;
