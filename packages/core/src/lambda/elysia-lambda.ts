import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import type { AnyElysia } from 'elysia';

function resolveRequestBody(event: APIGatewayProxyEventV2): ArrayBuffer | string | null {
  let body: ArrayBuffer | string | null = event.body ?? null;

  if (body && event.isBase64Encoded) {
    const buf = Buffer.from(body, 'base64');
    body = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  }

  return body;
}

/** Named so consumers can emit declarations without depending on `@types/aws-lambda` themselves. */
export type ElysiaLambdaHandler = (
  event: APIGatewayProxyEventV2,
) => Promise<APIGatewayProxyStructuredResultV2>;

export function elysiaLambda(app: AnyElysia): ElysiaLambdaHandler {
  return async (event) => {
    const method = event.requestContext.http.method;

    const headers = new Headers(
      Object.entries(event.headers).filter(
        (entry): entry is [string, string] => entry[1] !== undefined,
      ),
    );

    if (event.cookies?.length) headers.set('cookie', event.cookies.join('; '));

    const path = event.rawPath;
    const query = event.rawQueryString ? `?${event.rawQueryString}` : '';

    const host = headers.get('host') ?? 'localhost';

    const url = `https://${host}${path}${query}`;

    const body = resolveRequestBody(event);

    const request = new Request(url, {
      method,
      headers: new Headers(headers),
      body,
    });

    const response = await app.handle(request);

    const responseCookies = response.headers.getSetCookie();
    const responseHeaders = Object.fromEntries(response.headers.entries());
    delete responseHeaders['set-cookie'];

    return {
      statusCode: response.status,
      headers: responseHeaders,
      ...(responseCookies.length > 0 && { cookies: responseCookies }),
      body: await response.text(),
    };
  };
}
