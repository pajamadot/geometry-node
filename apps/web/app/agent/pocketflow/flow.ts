import { Flow } from 'pocketflow'
import {
  IntentRecognitionNode, 
  ModifySceneNode, ModifyNodeNode, 
  GenerateSceneNode, GenerateNodeNode, 
  ChatNode, ApplyDiffNode
} from '@/app/agent/pocketflow/nodes'
import type { FlowSharedStore } from '@/app/agent/pocketflow/types'

/*
// sequence
nodeA.next(nodeB);
nodeB.next(nodeC);
nodeC.next(nodeD);

// branch
nodeA.on("approved", nodeB);
nodeA.on("rejected", nodeC);
nodeA.on("needs_review", nodeD);

// sub flow
paymentFlow.next(inventoryFlow).next(shippingFlow);
const orderPipeline = new Flow(paymentFlow);
orderPipeline.run(sharedData);
*/

export function createGeometryEditFlow(): Flow {
  const intentRecognitionNode = new IntentRecognitionNode()
  const modifySceneNode = new ModifySceneNode()
  const modifyNodeNode = new ModifyNodeNode()
  const generateSceneNode = new GenerateSceneNode()
  const generateNodeNode = new GenerateNodeNode()
  const chatNode = new ChatNode()
  const applyDiffNode = new ApplyDiffNode()

  intentRecognitionNode.on("modify_scene", modifySceneNode)
  intentRecognitionNode.on("modify_node", modifyNodeNode)
  intentRecognitionNode.on("generate_scene", generateSceneNode)
  intentRecognitionNode.on("generate_node", generateNodeNode)
  intentRecognitionNode.on("chat", chatNode)

  modifySceneNode.on("apply_diff", applyDiffNode)
  modifyNodeNode.on("apply_diff", applyDiffNode)
  generateSceneNode.on("apply_diff", applyDiffNode)
  generateNodeNode.on("apply_diff", applyDiffNode)

  return new Flow<FlowSharedStore>(intentRecognitionNode)
}