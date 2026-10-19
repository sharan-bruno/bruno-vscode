import { describe, test, expect } from 'vitest';
import type { NetworkLogEntry } from '@bruno-types';
import { sentHeadersFromTimeline } from './index';

const entry = (type: NetworkLogEntry['type'], message?: string): NetworkLogEntry => ({ timestamp: new Date(), type, message });
const header = (message: string) => entry('requestHeader', message);

describe('sentHeadersFromTimeline', () => {
  test('returns the sent headers in wire order, ignoring response headers', () => {
    const timeline = [
      entry('request', 'GET /items'),
      header('Host: example.com'),
      header('Authorization: AWS4-HMAC-SHA256 Credential=abc, Signature=def'),
      entry('response', 'HTTP/1.1 200 OK'),
      entry('responseHeader', 'content-type: text/plain')
    ];

    expect(sentHeadersFromTimeline(timeline)).toEqual([
      { name: 'Host', value: 'example.com' },
      { name: 'Authorization', value: 'AWS4-HMAC-SHA256 Credential=abc, Signature=def' }
    ]);
  });

  test('reports only the final hop after a redirect', () => {
    const timeline = [
      entry('request', 'GET /a'),
      header('Authorization: Bearer secret'),
      header('Host: localhost'),
      entry('response', 'HTTP/1.1 302 Found'),
      entry('request', 'GET /b'),
      header('Host: 127.0.0.1'),
      entry('response', 'HTTP/1.1 200 OK')
    ];

    expect(sentHeadersFromTimeline(timeline)).toEqual([{ name: 'Host', value: '127.0.0.1' }]);
  });

  test('returns an empty list when there are no sent headers', () => {
    expect(sentHeadersFromTimeline([entry('request', 'GET /x')])).toEqual([]);
    expect(sentHeadersFromTimeline(undefined)).toEqual([]);
  });
});
