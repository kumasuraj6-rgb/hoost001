import { Readable, Writable } from 'stream';
import http from 'http';
import { handleApiRequest } from '@/src/server/apiHandler';

export const dynamic = 'force-dynamic';

async function handler(request: Request) {
  const url = new URL(request.url);
  const method = request.method;

  const headers: http.IncomingHttpHeaders = {};
  request.headers.forEach((val, key) => {
    headers[key.toLowerCase()] = val;
  });

  const arrayBuf = await request.arrayBuffer();
  const bodyBuffer = Buffer.from(arrayBuf);

  const req = new Readable({
    read() {
      if (bodyBuffer.length > 0) {
        this.push(bodyBuffer);
      }
      this.push(null);
    },
  }) as http.IncomingMessage;

  req.url = url.pathname + url.search;
  req.method = method;
  req.headers = headers;

  return new Promise<Response>(async (resolve) => {
    let statusCode = 200;
    const resHeaders = new Headers();
    const chunks: Buffer[] = [];

    const res = new Writable({
      write(chunk, encoding, callback) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        callback();
      },
    }) as any;

    res.statusCode = 200;
    res.setHeader = (name: string, value: any) => {
      resHeaders.set(name, String(value));
    };
    res.getHeader = (name: string) => {
      return resHeaders.get(name);
    };
    res.writeHead = (code: number, headers?: any) => {
      statusCode = code;
      if (headers) {
        Object.entries(headers).forEach(([k, v]) => resHeaders.set(k, String(v)));
      }
    };

    res.on('finish', () => {
      statusCode = res.statusCode || statusCode;
      const body = Buffer.concat(chunks);
      resolve(
        new Response(body, {
          status: statusCode,
          headers: resHeaders,
        })
      );
    });

    try {
      const handled = await handleApiRequest(req, res);
      if (!handled) {
        resolve(
          new Response(JSON.stringify({ error: 'Endpoint not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          })
        );
      }
    } catch (err: any) {
      console.error('API Error in Next.js route:', err);
      resolve(
        new Response(JSON.stringify({ error: err.message || 'Internal API Error' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        })
      );
    }
  });
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;
export const OPTIONS = handler;
