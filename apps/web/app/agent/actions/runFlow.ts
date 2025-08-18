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

    // measure how long the flow takes
    // await measureTime(async () => {
    //   await flow.run(shared);
    // });
    await flow.run(shared);

    streamableValue.update("Agent Flow Finished!");
    streamableValue.done();
  })();

  return {
    actionStream: streamableValue.value,
  }
}
