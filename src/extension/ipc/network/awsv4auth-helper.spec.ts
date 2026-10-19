import { beforeEach, describe, expect, it, vi } from 'vitest';
import axios, { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { addAwsV4Interceptor, resolveAwsV4Credentials, AwsV4Config } from './awsv4auth-helper';

const fromIni = vi.hoisted(() => vi.fn());
vi.mock('@aws-sdk/credential-providers', () => ({ fromIni }));

/** Resolves with the final request config so the signed headers can be inspected. */
const echoAdapter: AxiosAdapter = (config: InternalAxiosRequestConfig) =>
  Promise.resolve({ data: '', status: 200, statusText: 'OK', headers: {}, config } as AxiosResponse);

const send = async (awsv4config: AwsV4Config) => {
  const instance = axios.create({ adapter: echoAdapter });
  addAwsV4Interceptor(instance, { awsv4config });
  const response = await instance.request({
    url: 'https://abc123.execute-api.us-east-1.amazonaws.com/prod/items',
    method: 'post',
    headers: { 'content-type': 'application/json' },
    data: JSON.stringify({ hello: 'world' })
  });
  return response.config.headers as Record<string, string | undefined>;
};

describe('addAwsV4Interceptor signs requests with Signature v4', () => {
  it('adds an Authorization header scoped to the given region and service', async () => {
    const headers = await send({ accessKeyId: 'AKIAEXAMPLE', secretAccessKey: 'secret', region: 'us-east-1', service: 'execute-api' });

    expect(headers.Authorization).toMatch(
      /^AWS4-HMAC-SHA256 Credential=AKIAEXAMPLE\/\d{8}\/us-east-1\/execute-api\/aws4_request, SignedHeaders=.*, Signature=[0-9a-f]{64}$/
    );
    expect(headers['X-Amz-Date']).toMatch(/^\d{8}T\d{6}Z$/);
    expect(headers['X-Amz-Security-Token']).toBeUndefined();
  });

  it('includes the session token when temporary credentials are used', async () => {
    const headers = await send({ accessKeyId: 'AKIAEXAMPLE', secretAccessKey: 'secret', sessionToken: 'session-token', region: 'eu-west-1', service: 's3' });

    expect(headers['X-Amz-Security-Token']).toBe('session-token');
    expect(headers.Authorization).toContain('/eu-west-1/s3/aws4_request');
  });

  it('leaves the request unsigned when the access keys are missing', async () => {
    const headers = await send({ region: 'us-east-1', service: 'execute-api' });

    expect(headers.Authorization).toBeUndefined();
    expect(headers['X-Amz-Date']).toBeUndefined();
  });
});

describe('resolveAwsV4Credentials', () => {
  beforeEach(() => fromIni.mockReset());

  it('returns the config untouched when no profile is set', async () => {
    const awsv4config = { accessKeyId: 'AKIA', secretAccessKey: 'secret', region: 'us-east-1' };

    expect(await resolveAwsV4Credentials({ awsv4config })).toEqual(awsv4config);
    expect(fromIni).not.toHaveBeenCalled();
  });

  it('fills the keys from the named profile', async () => {
    fromIni.mockReturnValue(async () => ({ accessKeyId: 'PROFILE-KEY', secretAccessKey: 'profile-secret', sessionToken: 'profile-token' }));

    const resolved = await resolveAwsV4Credentials({ awsv4config: { profileName: 'staging', region: 'us-east-1' } });

    expect(fromIni).toHaveBeenCalledWith({ profile: 'staging', ignoreCache: true });
    expect(resolved).toEqual({ profileName: 'staging', region: 'us-east-1', accessKeyId: 'PROFILE-KEY', secretAccessKey: 'profile-secret', sessionToken: 'profile-token' });
  });

  it('keeps the config when the profile cannot be loaded', async () => {
    fromIni.mockReturnValue(async () => {
      throw new Error('Profile staging not found');
    });
    const awsv4config = { profileName: 'staging', region: 'us-east-1' };

    expect(await resolveAwsV4Credentials({ awsv4config })).toEqual(awsv4config);
  });
});
