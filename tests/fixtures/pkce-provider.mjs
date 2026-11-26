import { createHash, createHmac, randomUUID, randomBytes } from 'node:crypto';
import { createServer } from 'node:http';
import { serveWorkspace } from './workspace-store.mjs';

// An in-memory, loopback-only provider fixture. No credentials, verifiers,
// or requests are written to disk or logs; no emails are sent.
const provider = 'http://127.0.0.1:3101';
const signups = new Map();
const sessions = new Map();
const users = new Map();
const secret = randomBytes(32);
const encode = (value) =>
  Buffer.from(JSON.stringify(value)).toString('base64url');

function json(response, status, data) {
  response.writeHead(status, { 'content-type': 'application/json' });
  response.end(JSON.stringify(data));
}

async function readJson(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString());
}

function issueSession(user) {
  const now = Math.floor(Date.now() / 1000);
  const claims = {
    sub: user.id,
    aud: 'authenticated',
    iat: now,
    exp: now + 3600,
  };
  const unsigned = [encode({ alg: 'HS256', typ: 'JWT' }), encode(claims)].join(
    '.',
  );
  const signature = createHmac('sha256', secret)
    .update(unsigned)
    .digest('base64url');
  const access_token = unsigned + '.' + signature;
  sessions.set(access_token, user);
  return {
    access_token,
    refresh_token: randomUUID(),
    token_type: 'bearer',
    expires_in: 3600,
    user,
  };
}

async function handle(request, response) {
  const url = new URL(request.url, provider);
  if (url.pathname === '/health') return json(response, 200, { ready: true });
  if (url.pathname === '/__fixture/signup') {
    const signup = signups.get(url.searchParams.get('email'));
    return json(
      response,
      signup ? 200 : 404,
      signup
        ? {
            code: signup.code,
            redirectTo: signup.redirectTo,
            hasChallenge: Boolean(signup.challenge),
            method: signup.method,
          }
        : {},
    );
  }
  if (url.pathname === '/auth/v1/signup' && request.method === 'POST') {
    const { email, code_challenge, code_challenge_method } =
      await readJson(request);
    const user = {
      id: randomUUID(),
      email,
      aud: 'authenticated',
      role: 'authenticated',
      app_metadata: {},
      user_metadata: {},
    };
    signups.set(email, {
      code: randomUUID(),
      redirectTo: url.searchParams.get('redirect_to'),
      user,
      challenge: code_challenge,
      method: code_challenge_method,
      used: false,
    });
    return json(response, 200, user);
  }
  if (
    url.pathname === '/auth/v1/token' &&
    url.searchParams.get('grant_type') === 'password'
  ) {
    const { email } = await readJson(request);
    if (!users.has(email))
      users.set(email, {
        id: randomUUID(),
        email,
        role: 'authenticated',
        aud: 'authenticated',
        app_metadata: {},
        user_metadata: {},
      });
    return json(response, 200, issueSession(users.get(email)));
  }
  if (
    url.pathname === '/auth/v1/token' &&
    url.searchParams.get('grant_type') === 'pkce'
  ) {
    const { auth_code, code_verifier } = await readJson(request);
    if (auth_code === 'fixture-transport-error')
      return json(response, 503, { message: 'Unavailable' });
    if (auth_code === 'fixture-expired')
      return json(response, 400, {
        code: 'flow_state_expired',
        msg: 'Expired',
      });
    const signup = [...signups.values()].find(({ code }) => code === auth_code);
    if (
      !signup ||
      signup.used ||
      typeof code_verifier !== 'string' ||
      signup.method !== 's256' ||
      !signup.challenge ||
      createHash('sha256').update(code_verifier).digest('base64url') !==
        signup.challenge
    )
      return json(response, 400, {
        code: 'flow_state_not_found',
        msg: 'Invalid flow',
      });
    signup.used = true;
    return json(response, 200, issueSession(signup.user));
  }
  const token = request.headers.authorization?.replace(/^Bearer /, '');
  if (url.pathname.startsWith('/rest/v1/')) {
    return serveWorkspace({
      request,
      response,
      url,
      user: sessions.get(token),
      json,
      readJson,
    });
  }
  if (url.pathname === '/auth/v1/user' && request.method === 'GET') {
    const user = sessions.get(token);
    return user
      ? json(response, 200, user)
      : json(response, 401, { msg: 'No session' });
  }
  if (url.pathname === '/auth/v1/logout' && request.method === 'POST') {
    sessions.delete(token);
    response.writeHead(204).end();
    return;
  }
  return json(response, 404, { msg: 'Unsupported fixture request' });
}

createServer((request, response) => {
  void handle(request, response).catch(() =>
    json(response, 400, { msg: 'Fixture request rejected' }),
  );
}).listen(new URL(provider).port, '127.0.0.1');
