export interface FlowSharedStore extends Record<string, any> {}

export interface StreamMessage {
  step:     string; // "intent_recognition", "modify_scene", "apply_diff", "apply_diff_finished", "chat"
  type:     string; // "thinking", "markdown", "Planning next moves", "todo", "grep", "Read file", "code", "diff"
  content:  string; // 
}