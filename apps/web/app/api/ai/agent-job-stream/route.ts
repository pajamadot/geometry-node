import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // SSE sometimes doesn't work with edge runtime

export async function GET(
  req: NextRequest,
) {
  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get('job_id');
  const pyApiUrl = process.env.PY_API_URL || 'http://localhost:8000';
  const targetUrl = `${pyApiUrl}/api/v1/ai/assistant/stream/${jobId}`;

  // Use ReadableStream to proxy SSE from Python backend
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      try {
        // Only add Cookie header if present
        const headers: HeadersInit = {};
        const cookie = req.headers.get('cookie');
        if (cookie) { headers['Cookie'] = cookie; }

        const pyRes = await fetch(targetUrl, { method: 'GET', headers, });

        if (!pyRes.body) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'error',
                message: 'No stream from backend',
              })}\n\n`
            )
          );
          console.log('No stream from backend, closing controller');
          return;
        }

        const reader = pyRes.body.getReader();
        while (true) {
          const readerResult = await reader.read();
          const { done, value } = readerResult;
          if (done) { break; }
          if (value) { controller.enqueue(value); }
        }
      } catch (err) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: 'error',
              message: 'Failed to connect to backend',
              detail: String(err),
            })}\n\n`
          )
        );
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Transfer-Encoding': 'chunked',
    },
  });
}
