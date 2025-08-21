/**
 * @file 005_create_tasks_table.sql
 * @description Creates the tasks table to store individual workflow tasks with input mappings
 * This supports the data dependency feature where tasks can reference outputs from other tasks
 */

-- Up Migration
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL,
    dependencies TEXT[], -- Array of task IDs that this task depends on
    input_keys TEXT[], -- Array of input keys using dot notation (e.g., 'userInput.text', 'task1.summary')
    output_key VARCHAR(255) NOT NULL, -- Key under which this task's result is stored
    inputs JSONB, -- Input mappings: {"summary_text": {"nodeId": "node_1", "outputName": "summary"}}
    prompt_id UUID REFERENCES prompts(id),
    prompt_template TEXT,
    agent_config JSONB,
    function_body TEXT,
    static_value JSONB,
    data_key VARCHAR(255),
    position_x FLOAT, -- For UI positioning
    position_y FLOAT, -- For UI positioning
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX idx_tasks_workflow_id ON tasks(workflow_id);
CREATE INDEX idx_tasks_type ON tasks(type);
CREATE INDEX idx_tasks_prompt_id ON tasks(prompt_id);

-- Down Migration
DROP TABLE tasks;