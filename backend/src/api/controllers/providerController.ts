/**
 * @file providerController.ts
 * @description Controller for AI provider validation and status endpoints
 * @since 0.6.0
 */

import { Request, Response } from 'express';
import {
  detectAvailableProviders,
  validateAllProviders,
  hasValidProvider,
  getPreferredProvider,
  validateProviderApiKey,
  type AIProvider,
} from '../../services/providerValidationService';

/**
 * Controller class for managing AI provider validation and configuration
 */
class ProviderController {
  /**
   * Get the status of all available providers
   * @route GET /api/providers/status
   */
  static async getProviderStatus(req: Request, res: Response): Promise<void> {
    try {
      const providers = await validateAllProviders();
      const hasAnyValid = providers.some(p => p.validationResult?.success === true);
      const preferredProvider = await getPreferredProvider();

      res.json({
        success: true,
        data: {
          providers,
          hasValidProvider: hasAnyValid,
          preferredProvider,
        },
      });
    } catch (error) {
      console.error('Error checking provider status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to check provider status',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Get available providers without validation (faster)
   * @route GET /api/providers/available
   */
  static async getAvailableProviders(req: Request, res: Response): Promise<void> {
    try {
      const providers = detectAvailableProviders();

      res.json({
        success: true,
        data: {
          providers,
        },
      });
    } catch (error) {
      console.error('Error getting available providers:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get available providers',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Check if at least one provider is valid and ready
   * @route GET /api/providers/health
   */
  static async checkProviderHealth(req: Request, res: Response): Promise<void> {
    try {
      const isHealthy = await hasValidProvider();
      const preferredProvider = await getPreferredProvider();

      res.json({
        success: true,
        data: {
          healthy: isHealthy,
          preferredProvider,
          requiresSetup: !isHealthy,
        },
      });
    } catch (error) {
      console.error('Error checking provider health:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to check provider health',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Validate a specific provider's API key
   * @route POST /api/providers/validate
   * @body { provider: string, apiKey: string, baseUrl?: string }
   */
  static async validateProvider(req: Request, res: Response): Promise<void> {
    try {
      const { provider, apiKey, baseUrl } = req.body;

      if (!provider || !apiKey) {
        res.status(400).json({
          success: false,
          error: 'Provider and API key are required',
        });
        return;
      }

      // Validate provider type
      const validProviders: AIProvider[] = ['google', 'openai', 'openrouter', 'anthropic'];
      if (!validProviders.includes(provider)) {
        res.status(400).json({
          success: false,
          error: `Invalid provider. Must be one of: ${validProviders.join(', ')}`,
        });
        return;
      }

      const result = await validateProviderApiKey(provider, apiKey, baseUrl);

      res.json({
        success: true,
        data: {
          provider,
          validation: result,
        },
      });
    } catch (error) {
      console.error('Error validating provider:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to validate provider',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Get the preferred provider based on configuration
   * @route GET /api/providers/preferred
   */
  static async getPreferredProvider(req: Request, res: Response): Promise<void> {
    try {
      const preferredProvider = await getPreferredProvider();

      if (!preferredProvider) {
        res.status(404).json({
          success: false,
          error: 'No valid provider available',
          data: {
            preferredProvider: null,
            requiresSetup: true,
          },
        });
        return;
      }

      res.json({
        success: true,
        data: {
          preferredProvider,
          requiresSetup: false,
        },
      });
    } catch (error) {
      console.error('Error getting preferred provider:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get preferred provider',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

export default ProviderController;