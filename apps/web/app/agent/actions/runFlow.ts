'use server';

import { createStreamableValue } from '@ai-sdk/rsc';
import { createGeometryEditFlow } from '@/app/agent/pocketflow/flow';
import { FlowSharedStore } from '@/app/agent/pocketflow/types';
import { measureTime } from '@/app/utils/decorators';

export async function runGeometryEditFlow(requestData: Record<string, any>) {
  const streamableValue = createStreamableValue<string>('');

  (async () => {
    const shared: FlowSharedStore = {
      model: requestData.model,
      user_query: requestData.user_query,
      actionStream: streamableValue,
      metadata: requestData,
    };
    const flow = createGeometryEditFlow();

    await measureTime(async () => {
      await flow.run(shared);
    })();
    // await flow.run(shared);

    const message = {
      "step": "edit_finished",
      "content": "Agent Flow Finished!",
    }
    streamableValue.update(JSON.stringify(message));
    streamableValue.done();
  })();

  return {
    actionStream: streamableValue.value,
  }
}
