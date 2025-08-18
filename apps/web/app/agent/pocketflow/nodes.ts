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

    console.log("\n\nIntentRecognitionNode exec prompt:\n", prompt, "\n\n");

    const streamResponse = await createStreamingSession(prompt, model);

    let respBuffer = ""
    for await (const chunk of streamResponse.textStream) {
      const formattedChunk = `${chunk}`
      respBuffer += formattedChunk
    }

    // TODO: remove this
    console.log("\n\nIntentRecognitionNode response:\n", respBuffer, "\n\n");

    let resDict = parseYamlToDict(respBuffer);

    console.log("\n\nIntentRecognitionNode resDict:\n", resDict, "\n\n");

    // if the response is not a valid YAML, set the next action to chat
    if (!resDict) {
      resDict = { "next_action": "chat" }
    }

    const message = {
      "step": "intent_recognition",
      "content": `next_action: ${resDict.next_action}`,
    }
    actionStream.update(message);

    return { resDict }
  }

  // async execFallback(prepRes: unknown, error: Error): Promise<unknown> {
  //   return "There was an error processing your request.";
  // }

  async post(shared: FlowSharedStore, prepRes: any, execRes: any): Promise<string | undefined> {
    const { resDict } = execRes
    const nextAction = resDict.next_action
    shared.current_intent = nextAction
    console.log("\n\nIntentRecognitionNode post nextAction:\n", nextAction, "\n\n");
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

    const streamResponse = await createStreamingSession(prompt, model);

    let respBuffer = ""
    for await (const chunk of streamResponse.textStream) {
      // TODO: only data: should be handled with respBuffer
      const formattedChunk = `${chunk}`
      respBuffer += formattedChunk

      const message = {
        "step": "modify_scene",
        "content": formattedChunk,
      }
      actionStream.update(message);
    }

    // TODO: remove this
    console.log("\n\nModifySceneNode response:\n", respBuffer, "\n\n");

    // TODO: check respBuffer validity

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
      const formattedChunk = `${chunk}`
      actionStream.update(formattedChunk);
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

    const originalSceneJson = shared.metadata.scene_data || null
    const diffContent = shared.diff_content || null

    const currentIntent = shared.current_intent || null

    return { actionStream, originalSceneJson, diffContent, currentIntent }
  }

  async exec(prepRes: any): Promise<any> {
    const { actionStream, originalSceneJson, diffContent, currentIntent } = prepRes;

    const modifiedScene = applyDiff(originalSceneJson, diffContent);
    const modifiedSceneJson = JSON.parse(modifiedScene);

    const message = {
      "step": "apply_diff_finished",
      "intent": currentIntent,
      "content": modifiedSceneJson,
    }
    actionStream.update(message);
    return "default";
  }

  async post(shared: FlowSharedStore, prepRes: any, execRes: any): Promise<string | undefined> {
    // TODO: is it means "done"?
    return "default";
  }
}