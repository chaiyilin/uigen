// @vitest-environment node
import { test, expect, vi, beforeEach } from "vitest";
import { SignJWT, jwtVerify } from "jose";

vi.mock("server-only", () => ({}));

const mockCookieStore = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}));

const JWT_SECRET = new TextEncoder().encode("development-secret-key");

beforeEach(() => {
  vi.clearAllMocks();
});

async function createToken(payload: Record<string, unknown>, expired = false) {
  const builder = new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt();

  if (expired) {
    builder.setExpirationTime(Math.floor(Date.now() / 1000) - 60);
  } else {
    builder.setExpirationTime("7d");
  }

  return builder.sign(JWT_SECRET);
}

test("createSession sets a cookie with JWT token", async () => {
  const { createSession } = await import("@/lib/auth");

  await createSession("user-123", "test@example.com");

  expect(mockCookieStore.set).toHaveBeenCalledOnce();
  const [name, token, options] = mockCookieStore.set.mock.calls[0];

  expect(name).toBe("auth-token");
  expect(typeof token).toBe("string");
  expect(options.httpOnly).toBe(true);
  expect(options.sameSite).toBe("lax");
  expect(options.path).toBe("/");
  expect(options.expires).toBeInstanceOf(Date);

  const { payload } = await jwtVerify(token, JWT_SECRET);
  expect(payload.userId).toBe("user-123");
  expect(payload.email).toBe("test@example.com");
});

test("getSession returns payload when valid token exists", async () => {
  const { getSession } = await import("@/lib/auth");

  const token = await createToken({
    userId: "user-456",
    email: "user@test.com",
    expiresAt: new Date().toISOString(),
  });

  mockCookieStore.get.mockReturnValue({ value: token });

  const session = await getSession();
  expect(session).not.toBeNull();
  expect(session!.userId).toBe("user-456");
  expect(session!.email).toBe("user@test.com");
});

test("getSession returns null when no cookie exists", async () => {
  const { getSession } = await import("@/lib/auth");

  mockCookieStore.get.mockReturnValue(undefined);

  const session = await getSession();
  expect(session).toBeNull();
});

test("getSession returns null for expired token", async () => {
  const { getSession } = await import("@/lib/auth");

  const token = await createToken(
    { userId: "user-789", email: "expired@test.com" },
    true
  );

  mockCookieStore.get.mockReturnValue({ value: token });

  const session = await getSession();
  expect(session).toBeNull();
});

test("getSession returns null for invalid token", async () => {
  const { getSession } = await import("@/lib/auth");

  mockCookieStore.get.mockReturnValue({ value: "not-a-valid-jwt" });

  const session = await getSession();
  expect(session).toBeNull();
});

test("deleteSession removes the auth cookie", async () => {
  const { deleteSession } = await import("@/lib/auth");

  await deleteSession();

  expect(mockCookieStore.delete).toHaveBeenCalledWith("auth-token");
});

test("verifySession returns payload from request cookies", async () => {
  const { verifySession } = await import("@/lib/auth");

  const token = await createToken({
    userId: "user-abc",
    email: "verify@test.com",
  });

  const mockRequest = {
    cookies: {
      get: vi.fn().mockReturnValue({ value: token }),
    },
  } as any;

  const session = await verifySession(mockRequest);
  expect(session).not.toBeNull();
  expect(session!.userId).toBe("user-abc");
  expect(session!.email).toBe("verify@test.com");
});

test("verifySession returns null when no cookie in request", async () => {
  const { verifySession } = await import("@/lib/auth");

  const mockRequest = {
    cookies: {
      get: vi.fn().mockReturnValue(undefined),
    },
  } as any;

  const session = await verifySession(mockRequest);
  expect(session).toBeNull();
});

test("verifySession returns null for tampered token", async () => {
  const { verifySession } = await import("@/lib/auth");

  const wrongSecret = new TextEncoder().encode("wrong-secret");
  const token = await new SignJWT({ userId: "hacker" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(wrongSecret);

  const mockRequest = {
    cookies: {
      get: vi.fn().mockReturnValue({ value: token }),
    },
  } as any;

  const session = await verifySession(mockRequest);
  expect(session).toBeNull();
});
