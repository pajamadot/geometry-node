import { Node } from 'pocketflow'
import type { FlowSharedStore } from '@/app/agent/pocketflow/types'
import { createStreamingSession } from '@/app/agent/aiClient'
import { 
  INTENT_RECOGNITION_PROMPT_TEMPLATE,
  MODIFY_SCENE_PROMPT_TEMPLATE,
  CHAT_PROMPT_TEMPLATE,
 } from '@/app/agent/pocketflow/promptTemplate'
import { formatTemplate } from '@/app/utils/formatTemplate'
import { parseYamlToDict } from '@/app/utils/parseYaml'
import { applyDiff } from '@/app/utils/applyDiff'



export class IntentRecognitionNode extends Node<FlowSharedStore> {
  async prep(shared: FlowSharedStore): Promise<any> {
    const model = shared.model || ''
    const userQuery = shared.user_query || ''
    const actionStream = shared.actionStream || null

    const prompt = formatTemplate(INTENT_RECOGNITION_PROMPT_TEMPLATE, { user_query: userQuery })

    return { prompt, model, actionStream }
  }

  async exec(prepRes: any): Promise<any> {
    const { prompt, model, actionStream } = prepRes

    actionStream.update(JSON.stringify({ 
      step: 'intent_recognition', 
      type: 'markdown', 
      content: 'thinking...',
    }));

    const streamResponse = await createStreamingSession(prompt, model);

    let respBuffer = ""
    for await (const chunk of streamResponse.textStream) {
      respBuffer += chunk
    }

    let resDict = parseYamlToDict(respBuffer);

    // if the response is not a valid YAML, set the next action to chat
    if (!resDict) {
      resDict = { "next_action": "chat" }
    }

    const streamMessage = {
      "step": "intent_recognition",
      "type": "markdown",
      "content": `next_action: ${resDict.next_action}`,
    }
    actionStream.update(JSON.stringify(streamMessage));

    return { resDict }
  }

  // async execFallback(prepRes: unknown, error: Error): Promise<unknown> {
  //   return "There was an error processing your request.";
  // }

  async post(shared: FlowSharedStore, prepRes: any, execRes: any): Promise<string | undefined> {
    const { resDict } = execRes
    const nextAction = resDict.next_action
    shared.current_intent = nextAction
    return nextAction
  }
}



export class ModifySceneNode extends Node<FlowSharedStore> {
  async prep(shared: FlowSharedStore): Promise<any> {
    const model = shared.model || ''
    const userQuery = shared.user_query || ''
    const actionStream = shared.actionStream || null
    const metadata = shared.metadata || null

    const prompt = formatTemplate(
      MODIFY_SCENE_PROMPT_TEMPLATE, {
        user_query: userQuery, 
        original_scene_json: metadata.scene_data,
        catalog: metadata.catalog, 
        scene_generation_guidelines: metadata.scene_generation_guidelines
      })
    
    return { model, prompt, actionStream }
  }

  async exec(prepRes: any): Promise<any> {
    const { model, prompt, actionStream } = prepRes;

    let streamMessage = {
      "step": "modify_scene",
      "type": "markdown",
      "content": "processing...",
    }
    actionStream.update(JSON.stringify(streamMessage));

    const streamResponse = await createStreamingSession(prompt, model);

    let respBuffer = ""
    for await (const chunk of streamResponse.textStream) {
      respBuffer += chunk
    }

    streamMessage = {
      "step": "modify_scene",
      "type": "markdown",
      "content": "generate diff completed",
    }
    actionStream.update(JSON.stringify(streamMessage));

    return { respBuffer }
  }

  async post(shared: FlowSharedStore, prepRes: any, execRes: any): Promise<string | undefined> {
    const { respBuffer } = execRes
    const diffContent = respBuffer
    shared.diff_content = diffContent
    return "apply_diff";
  }
}



export class ModifyNodeNode extends Node<FlowSharedStore> {
  async prep(shared: FlowSharedStore): Promise<any> {
    const model = shared.model || ''
    const userQuery = shared.user_query || ''
    const actionStream = shared.actionStream || null
    return { userQuery, model, actionStream }
  }

  async exec(prepRes: any): Promise<any> {
    const { userQuery, model, actionStream } = prepRes;
    return "";
  }

  async post(shared: FlowSharedStore, prepRes: any, execRes: any): Promise<string | undefined> {
    return "default";
  }
}



export class GenerateSceneNode extends Node<FlowSharedStore> {
  async prep(shared: FlowSharedStore): Promise<any> {
    const model = shared.model || ''
    const userQuery = shared.user_query || ''
    const actionStream = shared.actionStream || null
    return { userQuery, model, actionStream }
  }

  async exec(prepRes: any): Promise<any> {
    const { userQuery, model, actionStream } = prepRes;
    return "";
  }

  async post(shared: FlowSharedStore, prepRes: any, execRes: any): Promise<string | undefined> {
    return "default";
  }
}



export class GenerateNodeNode extends Node<FlowSharedStore> {
  async prep(shared: FlowSharedStore): Promise<any> {
    const model = shared.model || ''
    const userQuery = shared.user_query || ''
    const actionStream = shared.actionStream || null
    return { userQuery, model, actionStream }
  }

  async exec(prepRes: any): Promise<any> {
    const { userQuery, model, actionStream } = prepRes;
    return "";
  }

  async post(shared: FlowSharedStore, prepRes: any, execRes: any): Promise<string | undefined> {
    return "default";
  }
}



export class ChatNode extends Node<FlowSharedStore> {
  async prep(shared: FlowSharedStore): Promise<any> {
    const model = shared.model || ''
    const userQuery = shared.user_query || ''
    const actionStream = shared.actionStream || null

    const prompt = formatTemplate(CHAT_PROMPT_TEMPLATE, { user_query: userQuery })

    return { prompt, model, actionStream }
  }

  async exec(prepRes: any): Promise<any> {
    const { prompt, model, actionStream } = prepRes;

    const streamResponse = await createStreamingSession(prompt, model);

    for await (const chunk of streamResponse.textStream) {
      // TODO: only data: should be handled with respBuffer
      const message = {
        "step": "chat",
        "type": "markdown",
        "content": chunk,
      }
      actionStream.update(JSON.stringify(message));
    }

    return "default";
  }

  async post(shared: FlowSharedStore, prepRes: any, execRes: any): Promise<string | undefined> {
    return "default";
  }
}



export class ApplyDiffNode extends Node<FlowSharedStore> {
  async prep(shared: FlowSharedStore): Promise<any> {
    const model = shared.model || ''
    const userQuery = shared.user_query || ''
    const actionStream = shared.actionStream || null

    const originalSceneJsonStr = shared.metadata.scene_data || null

    let diffContent = shared.diff_content || null
    if (diffContent) {
      if (diffContent.startsWith("```diff")) {
        diffContent = diffContent.slice(7).trim()
      }
      if (diffContent.endsWith("```")) {
        diffContent = diffContent.slice(0, -3).trim()
      }
      diffContent = diffContent.trim()
    }

    const currentIntent = shared.current_intent || null

    return { actionStream, originalSceneJsonStr, diffContent, currentIntent }
  }

  async exec(prepRes: any): Promise<any> {
    const { actionStream, originalSceneJsonStr, diffContent, currentIntent } = prepRes;

    const modifiedScene = applyDiff(originalSceneJsonStr, diffContent);

    const streamMessage = {
      "step": "apply_diff_finished",
      "type": "markdown",
      "intent": currentIntent,
      "content": modifiedScene,
    }
    actionStream.update(JSON.stringify(streamMessage));
    return "default";
  }

  async post(shared: FlowSharedStore, prepRes: any, execRes: any): Promise<string | undefined> {
    // TODO: is it means "done"?
    return "default";
  }
}