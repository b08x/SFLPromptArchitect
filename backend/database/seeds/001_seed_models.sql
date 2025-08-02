-- Seed Models
INSERT INTO models (name, description) VALUES
('gemini-2.5-flash', 'Google''s fast and versatile multimodal model.'),
('imagen-3.0-generate-002', 'Google''s latest high-quality image generation model.')
ON CONFLICT (name) DO NOTHING;
