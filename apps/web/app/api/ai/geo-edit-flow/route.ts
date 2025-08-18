import { NextRequest } from 'next/server';
import { createGeometryEditFlow } from '@/app/agent/pocketflow/flow';
import { FlowSharedStore } from '@/app/agent/pocketflow/types';
import { measureTime } from '@/app/utils/decorators';

export async function POST(req: NextRequest) {
  const requestData = await req.json();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (msg: string) => {
        controller.enqueue(`data: ${msg}\n\n`);
      };

      try {
        const shared: FlowSharedStore = {
          model: requestData.model,
          user_query: requestData.user_query,
          actionStream: {
            update: (msg: string) => send(msg),
            done: () => {},
          } as any,
          metadata: requestData,
        };

        const flow = createGeometryEditFlow();

        await measureTime(async () => {
          await flow.run(shared);
        })();

        send(JSON.stringify({ step: 'edit_finished', content: '✅ Agent Flow Finished!' }));
      } catch (err: any) {
        send(JSON.stringify({ step: 'error', content: err.message }));
      } finally {
        send(JSON.stringify({ step: 'close', content: 'stream closed' }));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}