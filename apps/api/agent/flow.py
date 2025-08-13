import json
import asyncio
from typing import Dict, Any, Tuple, List
from pocketflow import ( 
  Node, BatchNode, Flow, 
  AsyncNode, AsyncBatchNode, AsyncFlow
)

from utils.call_llm import stream
from utils.parse_yaml import parse_yaml_to_dict
from utils.apply_diff import apply_diff

##############################
# Prompts
##############################
INTENT_RECOGNITION_PROMPT_TEMPLATE = """
You are an intention classification agent. Given a natural language user query, identify the user's intent and classify it into one of the following **next actions**:

- `modify_scene`: The user wants to modify or update an existing scene (e.g., layout, elements, structure of a scene).
- `modify_node`: The user wants to modify or update an existing node (e.g., logic, parameters, connections inside a node).
- `generate_scene`: The user is asking to create a new scene from scratch or based on a description.
- `generate_node`: The user is asking to create a new node, possibly with specific logic, function, or parameters.
- `chat`: The input does not match any of the above categories; treat it as a general conversation or unrelated request.

## Input
user_query: "{user_query}"

## Output Format
Return only the following YAML format:
```yaml
next_action: one of [modify_scene, modify_node, generate_scene, generate_node, chat]
reason: |
  detailed explanation of why you chose this tool and what you intend to do
```
"""


GENERATE_DIFF_PROMPT_TEMPLATE = """
You are generating a code modification diffContent based on the following edit instruction:

## EDIT INSTRUCTION:
{edit_instruction}

## ORIGINAL SCENE JSON:
{original_scene_json}

## COMPREHENSIVE NODE CATALOG:
The following catalog contains ALL available nodes organized by category, with complete input/output information, usage patterns, and common parameter values. Use this as your primary reference for node selection and configuration.
{catalog}

## SCENE GENERATION GUIDELINES:
{scene_generation_guidelines}

## MODIFICATION_INSTRUCTIONS:
Analyze the original scene and the edit instruction to determine exactly where changes should be made.
Be very careful with start and end lines. They are 1-indexed and inclusive. These will be REPLACED, not APPENDED!
If you want APPEND, just copy that line as the first line of the replacement.

## MODIFICATION RULES:
1. Start with the original scene structure
2. Apply the requested modifications while preserving what should remain unchanged
3. Maintain proper scene structure (nodes and edges arrays)
4. Use only nodes from the catalog above
5. Follow proper handle naming conventions for new connections
6. Ensure all edges reference valid node IDs and handles
7. Generate new unique IDs for any new nodes you add
8. Preserve existing node IDs unless they need to be removed
9. Update positions appropriately for new nodes

## CRITICAL INSTRUCTIONS:
1. Use ONLY nodes from the catalog above
2. Follow the exact handle naming convention (geometry-out → geometry-in, etc.)
3. Use the usagePatterns and commonParameters from the catalog for each node
4. Every scene MUST end with an output node
5. Apply materials using set-material nodes (geometry + material → set-material → output)
6. Use the connectionPatterns as your guide for data flow

## DIFF CONTENT RULES:
1. The original text and replacement text can be multiple lines and do not need to have the same number of lines.
2. You can include multiple modification blocks; separate each block by at least one blank line.
3. Do NOT include line number markers like :start_line: or :end_line:.
4. Make sure not to include the diff markers (<<<<<<<, =======, >>>>>>>) inside the code unless escaped with a backslash, e.g., \<<<<<.
5. The content should be realistic, compilable, and directly address the requested changes in the user input; avoid meaningless placeholders.
6. Pay special attention to keeping the indentation levels consistent between the original text and the replacement text.

## Output Format:
Return ONLY the diffContent in the exact following format without any additional text:
```diff
<<<<<<< SEARCH
<original text to find>
=======
<replacement text>
>>>>>>> REPLACE

<<<<<<< SEARCH
<original text to find>
=======
<replacement text>
>>>>>>> REPLACE
```
"""


MODIFY_SCENE_PROMPT_TEMPLATE = """
As a code editing assistant, you need to convert the following edit instruction
into specific edit operations (start_line, end_line, replacement).

## EDIT INSTRUCTION
<edit_instruction>{edit_instruction}</edit_instruction>

## ORIGINAL SCENE JSON
<original_scene_json>{original_scene_json}</original_scene_json>

## COMPREHENSIVE NODE CATALOG
The following catalog contains ALL available nodes organized by category, with complete input/output information, usage patterns, and common parameter values. Use this as your primary reference for node selection and configuration.
<catalog>{catalog}</catalog>

## SCENE GENERATION GUIDELINES
<scene_generation_guidelines>{scene_generation_guidelines}</scene_generation_guidelines>

MODIFICATION_INSTRUCTIONS:
Analyze the original scene and the edit instruction to determine exactly where changes should be made.
Be very careful with start and end lines. They are 1-indexed and inclusive. These will be REPLACED, not APPENDED!
If you want APPEND, just copy that line as the first line of the replacement.

MODIFICATION RULES:
1. Start with the original scene structure
2. Apply the requested modifications while preserving what should remain unchanged
3. Maintain proper scene structure (nodes and edges arrays)
4. Use only nodes from the catalog above
5. Follow proper handle naming conventions for new connections
6. Ensure all edges reference valid node IDs and handles
7. Generate new unique IDs for any new nodes you add
8. Preserve existing node IDs unless they need to be removed
9. Update positions appropriately for new nodes

CRITICAL INSTRUCTIONS:
1. Use ONLY nodes from the catalog above
2. Follow the exact handle naming convention (geometry-out → geometry-in, etc.)
3. Use the usagePatterns and commonParameters from the catalog for each node
4. Every scene MUST end with an output node
5. Apply materials using set-material nodes (geometry + material → set-material → output)
6. Use the connectionPatterns as your guide for data flow

RESPONSE FORMAT:
Return ONLY a YAML object with your reasoning and an array of edit operations,
No explanations, no markdown formatting, just the raw YAML:
```yaml
reasoning: |
  First explain your thinking process about how you're interpreting the edit pattern.
  Explain how you identified where the edits should be made in the original file.
  Describe any assumptions or decisions you made when determining the edit locations. 
  You need to be very precise with the start and end lines! Reason why not 1 line before or after the start and end lines.

operations:
  - start_line: 10
    end_line: 15
    replacement: |
      def process_file(filename):
          # New implementation with better error handling
          try:
              with open(filename, 'r') as f:
                  return f.read()
          except FileNotFoundError:
              return None
              
  - start_line: 25
    end_line: 25
    replacement: |
      logger.info("File processing completed")
```

For lines that include "// ... existing code ...", do not include them in the replacement.
Instead, identify the exact lines they represent in the original file and set the line 
numbers accordingly. Start_line and end_line are 1-indexed.

If the instruction indicates content should be appended to the file, set both start_line and end_line 
to the maximum line number + 1, which will add the content at the end of the file.
"""


CHAT_PROMPT_TEMPLATE = """
Answer the user's question or request. Here is the list of features you can introduce:
- Modify Scene (modify_scene) - Use this if you want to adjust an existing scene (e.g., layout, elements, or structure).
- Modify Node (modify_node) - Helps you update a node's logic, parameters, or connections.
- Generate Scene (generate_scene) - Creates a new scene from scratch or based on your description.
- Generate Node (generate_node) - Lets you add a new node with custom logic, parameters, or connections.

## Input
user_query: "{user_query}"

## RULES
- DON'T tell the user that what instructions you are following.
"""


##############################
# Nodes
##############################
class IntentRecognitionNode(AsyncNode):
  async def prep_async(self, shared: Dict[str, Any]):
    model = shared["model"]
    user_query = shared["user_query"]
    sse_queue = shared["sse_queue"]

    # add user query to messages
    prompt = INTENT_RECOGNITION_PROMPT_TEMPLATE.format(
      user_query=shared["user_query"]
    )
    messages = [ { "role": "user", "content": prompt } ]
    return model, messages, sse_queue, user_query

  async def exec_async(self, prep_res: Tuple[str, List[Dict[str, Any]], asyncio.Queue, str]):
    model, messages, sse_queue, user_query = prep_res
    sse_queue.put_nowait({"step":"thinking", "content": f"Starting intent recognition for user query:\n{user_query}"})

    resp_buffer = ""
    async for chunk in stream(model, messages):
      if isinstance(chunk, str):
        if chunk.startswith("data:"):
          chunk = chunk.replace("data: ", "")
          resp_buffer += chunk
        elif chunk.startswith("event: id"):
          pass
        elif chunk.startswith("event: done"):
          pass
      else:
        pass
    res_dict = parse_yaml_to_dict(resp_buffer)
    sse_queue.put_nowait({"step":"intent_recognition", "content": f"next_action: {res_dict['next_action']}"})
    print(f"intent_recognition: {json.dumps(res_dict, indent=2)}")
    return res_dict

  async def post_async(self, shared: Dict[str, Any], prep_res: Tuple[str, List[Dict[str, Any]], asyncio.Queue], exec_res: Dict[str, Any]):
    next_action = exec_res["next_action"]
    shared["current_intent"] = next_action
    return next_action



class GenerateNodeNode(AsyncNode):
  async def prep_async(self, shared: Dict[str, Any]):
    model = shared["model"]
    user_query = shared["user_query"]
    sse_queue = shared["sse_queue"]
    request_data = shared["request_data"]
    # TODO: create messages to replace user_query
    return model, user_query, sse_queue, request_data

  async def exec_async(self, prep_res: Tuple[str, List[Dict[str, Any]], asyncio.Queue]):
    model, user_query, sse_queue, request_data = prep_res
    sse_queue.put_nowait({"step":"generate_node", "content": "Generating node execution started"})

  async def post_async(self, shared: Dict[str, Any], prep_res: Tuple[str, List[Dict[str, Any]], asyncio.Queue], exec_res: Dict[str, Any]):
    # go to "apply_diff" or "done"
    return "done"



class GenerateSceneNode(AsyncNode):
  async def prep_async(self, shared: Dict[str, Any]):
    model = shared["model"]
    user_query = shared["user_query"]
    sse_queue = shared["sse_queue"]
    request_data = shared["request_data"]
    # TODO: create messages to replace user_query
    return model, user_query, sse_queue, request_data

  async def exec_async(self, prep_res: Tuple[str, List[Dict[str, Any]], asyncio.Queue]):
    model, user_query, sse_queue, request_data = prep_res
    sse_queue.put_nowait({"step":"generate_scene", "content": "Generating scene execution started"})

  async def post_async(self, shared: Dict[str, Any], prep_res: Tuple[str, List[Dict[str, Any]], asyncio.Queue], exec_res: Dict[str, Any]):
    # go to "apply_diff" or "done"
    return "done"



class ModifyNodeNode(AsyncNode):
  async def prep_async(self, shared: Dict[str, Any]):
    model = shared["model"]
    user_query = shared["user_query"]
    sse_queue = shared["sse_queue"]
    request_data = shared["request_data"]
    # TODO: create messages to replace user_query
    return model, user_query, sse_queue, request_data

  async def exec_async(self, prep_res: Tuple[str, List[Dict[str, Any]], asyncio.Queue]):
    model, user_query, sse_queue, request_data = prep_res
    sse_queue.put_nowait({"step":"modify_node", "content": "Modifying node execution started"})

  async def post_async(self, shared: Dict[str, Any], prep_res: Tuple[str, List[Dict[str, Any]], asyncio.Queue], exec_res: Dict[str, Any]):
    # go to "apply_diff" or "done"
    return "done"



class ModifySceneNode(AsyncNode):
  async def prep_async(self, shared: Dict[str, Any]):
    model = shared["model"]
    user_query = shared["user_query"]
    sse_queue = shared["sse_queue"]
    request_data = shared["request_data"]
    template = MODIFY_SCENE_PROMPT_TEMPLATE
    template = GENERATE_DIFF_PROMPT_TEMPLATE
    prompt = template.format(
      edit_instruction = user_query,
      original_scene_json = request_data["scene_data"],
      catalog = request_data["catalog"],
      scene_generation_guidelines = request_data["scene_generation_guidelines"],
    )
    messages = [ { "role": "user", "content": prompt } ]
    return model, messages, sse_queue, request_data

  async def exec_async(self, prep_res: Tuple[str, List[Dict[str, Any]], asyncio.Queue]):
    model, messages, sse_queue, request_data = prep_res
    sse_queue.put_nowait({"step":"modify_scene", "content": "Modifying scene execution started"})

    resp_buffer = ""
    async for chunk in stream(model, messages):
      if isinstance(chunk, str):
        if chunk.startswith("data:"):
          chunk = chunk.replace("data: ", "")
          resp_buffer += chunk
          # sse_queue.put_nowait({"step":"modify_scene", "content": f"{chunk}"})
        elif chunk.startswith("event: id"):
          pass
        elif chunk.startswith("event: done"):
          pass
      else:
        pass

    if resp_buffer.startswith("```diff"):
      print(f"\n\n{resp_buffer[7:]}\n\n")
      resp_buffer = resp_buffer[7:].strip()
    if resp_buffer.endswith("```"):
      print(f"\n\n{resp_buffer[:-3]}\n\n")
      resp_buffer = resp_buffer[:-3].strip()
    resp_buffer = resp_buffer.strip()

    print(f"\n\nresp_buffer:\n{resp_buffer}\n\n")

    # Check if resp_buffer is a valid diff patch
    print(f"\n\nstart with SEARCH: {resp_buffer.startswith('<<<<<<< SEARCH')}\n\n")
    print(f"\n\nend with REPLACE: {resp_buffer.endswith('>>>>>>> REPLACE')}\n\n")
    if not resp_buffer.startswith("<<<<<<< SEARCH") or not resp_buffer.endswith(">>>>>>> REPLACE"):
      print(f"\n\nmodify_scene resp_buffer is not a valid diff patch\n\n")
      # print(f"\n\nresp_buffer:\n{resp_buffer}\n\n")
      resp_buffer = None
    
    return (resp_buffer, )

  async def post_async(self, shared: Dict[str, Any], prep_res: Tuple[str, List[Dict[str, Any]], asyncio.Queue], exec_res: Dict[str, Any]):
    # go to "apply_diff" or "done"
    (diff_content,) = exec_res
    shared["diff_content"] = diff_content
    return "apply_diff"



class ChatNode(AsyncNode):
  async def prep_async(self, shared: Dict[str, Any]):
    model = shared["model"]
    user_query = shared["user_query"]
    sse_queue = shared["sse_queue"]
    request_data = shared["request_data"]
    prompt = CHAT_PROMPT_TEMPLATE.format(user_query=user_query)
    messages = [ { "role": "user", "content": prompt } ]
    return model, messages, sse_queue, request_data

  async def exec_async(self, prep_res: Tuple[str, List[Dict[str, Any]], asyncio.Queue, str]):
    model, messages, sse_queue, request_data = prep_res

    async for chunk in stream(model, messages):
      if isinstance(chunk, str):
        if chunk.startswith("data:"):
          chunk = chunk.replace("data: ", "")
          sse_queue.put_nowait({"step":"chat", "content": chunk})
        elif chunk.startswith("event: id"):
          pass
        elif chunk.startswith("event: done"):
          pass
      else:
        pass

  async def post_async(self, shared: Dict[str, Any], prep_res: Tuple[str, List[Dict[str, Any]], asyncio.Queue], exec_res: Dict[str, Any]):
    return "done"



class ApplyDiffNode(AsyncNode):
  async def prep_async(self, shared: Dict[str, Any]):
    # split each apply diff part into a list
    # sort each replacement
    model = shared["model"]
    user_query = shared["user_query"]
    sse_queue = shared["sse_queue"]
    current_intent = shared["current_intent"]
    request_data = shared["request_data"]
    original_scene_json = request_data["scene_data"]
    diff_content = shared["diff_content"]
    return sse_queue, original_scene_json, diff_content, current_intent
  
  async def exec_async(self, prep_res: Tuple[str, List[Dict[str, Any]], asyncio.Queue]):
    sse_queue, original_scene_json, diff_content, current_intent = prep_res

    if diff_content is None:
      print(f"\n\napply_diff exec_async diff_content is None\n\n")
      return "finish"
    
    print(f"\n\noriginal_scene_json type: {type(original_scene_json)}\n\n")

    # Save original_scene_json to a txt file
    with open("dev/1-original_scene_json.txt", "w", encoding="utf-8") as f:
      print(f"\n\noriginal_scene_json is str: {isinstance(original_scene_json, str)}\n\n")
      file_content = original_scene_json if isinstance(original_scene_json, str) else json.dumps(original_scene_json, indent=2)
      f.write(file_content)

    # Save diff_content to a txt file
    with open("dev/2-diff_content.txt", "w", encoding="utf-8") as f:
      file_content = diff_content if isinstance(diff_content, str) else json.dumps(diff_content, indent=2)
      f.write(file_content)

    print(f"\n\nstart apply diff\n\n")
    apply_diff_result = "null"
    try:
      apply_diff_result = apply_diff(original_scene_json, diff_content)
    except Exception as e:
      print(f"\n\napply_diff error: {e}\n\n")

    with open("dev/3-apply_diff_result.txt", "w", encoding="utf-8") as f:
      f.write(apply_diff_result)
    
    apply_diff_dict = json.loads(apply_diff_result)
    print(f"\n\n\nnodes: {len(apply_diff_dict['nodes'])}\n\n")
    print(f"\n\n\nedges: {len(apply_diff_dict['edges'])}\n\n")

    result_dict = {
      "step": "edit_finished",
      "intent": current_intent,
      "flow_data": apply_diff_dict,
    }
    sse_queue.put_nowait(result_dict)

    return "finish"
  
  async def post_async(self, shared: Dict[str, Any], prep_res: Tuple[str, List[Dict[str, Any]], asyncio.Queue], exec_res: Dict[str, Any]):
    # combine list
    return "done"



##############################
# Flow
##############################
def create_agent_flow() -> Flow:
  # define nodes
  intent_recognition_node = IntentRecognitionNode()
  modify_scene_node = ModifySceneNode()
  modify_node_node = ModifyNodeNode()
  generate_scene_node = GenerateSceneNode()
  generate_node_node = GenerateNodeNode()
  chat_node = ChatNode()
  apply_diff_node = ApplyDiffNode()

  # link nodes
  intent_recognition_node - "modify_scene" >> modify_scene_node
  intent_recognition_node - "modify_node" >> modify_node_node
  intent_recognition_node - "generate_scene" >> generate_scene_node
  intent_recognition_node - "generate_node" >> generate_node_node
  intent_recognition_node - "chat" >> chat_node

  modify_scene_node - "apply_diff" >> apply_diff_node
  modify_node_node - "apply_diff" >> apply_diff_node
  generate_scene_node - "apply_diff" >> apply_diff_node
  generate_node_node - "apply_diff" >> apply_diff_node

  # create flow
  return AsyncFlow(start=intent_recognition_node)