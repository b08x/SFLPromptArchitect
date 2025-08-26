import { Request, Response, NextFunction } from 'express';
import { generateCompletion, CompletionRequest, AIServiceError } from '../../services/ai/aiSdkService';
import UnifiedAIService, { ProviderAwareRequest } from '../../services/unifiedAIService';
import { AIProvider, ModelParameters } from '../../types/aiProvider';

class GeminiController {
  async testPrompt(req: Request, res: Response, next: NextFunction) {
    try {
      const { promptText, provider, model, parameters, apiKey, baseUrl } = req.body;
      if (!promptText) {
        return res.status(400).json({ message: 'promptText is required' });
      }

      // Use aiSdkService directly for better control and streaming support
      if (provider && provider !== 'google') {
        // For non-Google providers, use aiSdkService directly
        if (!apiKey) {
          return res.status(400).json({ message: 'API key is required for non-Google providers' });
        }
        
        const request: CompletionRequest = {
          provider: provider as AIProvider,
          model: model || 'gpt-4', // Default model, should be provider-specific
          prompt: promptText,
          parameters: parameters || { temperature: 0.7, maxTokens: 4096 },
          apiKey,
          baseUrl
        };
        
        const result = await generateCompletion(request);
        res.status(200).json({ text: result.text });
      } else {
        // For Google/Gemini or legacy support, use UnifiedAIService
        const providerConfig: ProviderAwareRequest = {
          provider: provider as AIProvider,
          model,
          parameters,
          apiKey,
          baseUrl
        };
        
        const result = await UnifiedAIService.testPrompt(promptText, providerConfig);
        res.status(200).json({ text: result });
      }
    } catch (error) {
      if (error instanceof AIServiceError) {
        res.status(500).json({ 
          message: `AI service error: ${error.message}`,
          provider: error.provider 
        });
      } else {
        next(error);
      }
    }
  }

  async generateSFLFromGoal(req: Request, res: Response, next: NextFunction) {
    try {
      console.log('POST /api/gemini/generate-sfl received');
      console.log('Request body:', JSON.stringify(req.body, null, 2));
      
      const { goal, sourceDocContent, provider, model, parameters, apiKey, baseUrl } = req.body;
      if (!goal) {
        console.log('Error: Goal is required but not provided');
        return res.status(400).json({ message: 'Goal is required' });
      }

      // Create provider configuration from request
      const providerConfig: ProviderAwareRequest = {
        provider: provider as AIProvider,
        model,
        parameters,
        apiKey,
        baseUrl
      };
      
      console.log('Calling UnifiedAIService.generateSFLFromGoal...');
      const result = await UnifiedAIService.generateSFLFromGoal(goal, sourceDocContent, providerConfig);
      console.log('Generated SFL result:', JSON.stringify(result, null, 2));
      
      res.status(200).json(result);
    } catch (error) {
      console.error('Error in generateSFLFromGoal controller:', error);
      if (error instanceof AIServiceError) {
        res.status(500).json({ 
          message: `AI service error: ${error.message}`,
          provider: error.provider 
        });
      } else {
        next(error);
      }
    }
  }

  async regenerateSFLFromSuggestion(req: Request, res: Response, next: NextFunction) {
    try {
      const { currentPrompt, suggestion, provider, model, parameters, apiKey, baseUrl } = req.body;
      if (!currentPrompt || !suggestion) {
        return res.status(400).json({ message: 'Current prompt and suggestion are required' });
      }

      // Create provider configuration from request
      const providerConfig: ProviderAwareRequest = {
        provider: provider as AIProvider,
        model,
        parameters,
        apiKey,
        baseUrl
      };

      const result = await UnifiedAIService.regenerateSFLFromSuggestion(currentPrompt, suggestion, providerConfig);
      res.status(200).json(result);
    } catch (error) {
      if (error instanceof AIServiceError) {
        res.status(500).json({ 
          message: `AI service error: ${error.message}`,
          provider: error.provider 
        });
      } else {
        next(error);
      }
    }
  }

  async generateWorkflowFromGoal(req: Request, res: Response, next: NextFunction) {
    try {
      const { goal, provider, model, parameters, apiKey, baseUrl } = req.body;
      if (!goal) {
        return res.status(400).json({ message: 'Goal is required' });
      }

      // Create provider configuration from request
      const providerConfig: ProviderAwareRequest = {
        provider: provider as AIProvider,
        model,
        parameters,
        apiKey,
        baseUrl
      };

      const result = await UnifiedAIService.generateWorkflowFromGoal(goal, providerConfig);
      res.status(200).json(result);
    } catch (error) {
      if (error instanceof AIServiceError) {
        res.status(500).json({ 
          message: `AI service error: ${error.message}`,
          provider: error.provider 
        });
      } else {
        next(error);
      }
    }
  }
}

export default new GeminiController();
