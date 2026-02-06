import { describe, test, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAuth } from "@/hooks/use-auth";
import { signIn as signInAction, signUp as signUpAction } from "@/actions";
import * as anonTracker from "@/lib/anon-work-tracker";
import { getProjects } from "@/actions/get-projects";
import { createProject } from "@/actions/create-project";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/actions", () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
}));

vi.mock("@/lib/anon-work-tracker", () => ({
  getAnonWorkData: vi.fn(),
  clearAnonWork: vi.fn(),
}));

vi.mock("@/actions/get-projects", () => ({
  getProjects: vi.fn(),
}));

vi.mock("@/actions/create-project", () => ({
  createProject: vi.fn(),
}));

const mockSignIn = vi.mocked(signInAction);
const mockSignUp = vi.mocked(signUpAction);
const mockGetAnonWorkData = vi.mocked(anonTracker.getAnonWorkData);
const mockClearAnonWork = vi.mocked(anonTracker.clearAnonWork);
const mockGetProjects = vi.mocked(getProjects);
const mockCreateProject = vi.mocked(createProject);

beforeEach(() => {
  vi.clearAllMocks();
  mockGetAnonWorkData.mockReturnValue(null);
  mockGetProjects.mockResolvedValue([]);
  mockCreateProject.mockResolvedValue({ id: "new-123" } as any);
});

describe("useAuth", () => {
  test("returns signIn, signUp, and isLoading", () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current.signIn).toBeTypeOf("function");
    expect(result.current.signUp).toBeTypeOf("function");
    expect(result.current.isLoading).toBe(false);
  });

  describe("signIn", () => {
    test("calls signInAction and returns its result", async () => {
      mockSignIn.mockResolvedValue({ success: true });
      const { result } = renderHook(() => useAuth());

      let response: any;
      await act(async () => {
        response = await result.current.signIn("test@test.com", "password");
      });

      expect(mockSignIn).toHaveBeenCalledWith("test@test.com", "password");
      expect(response).toEqual({ success: true });
    });

    test("sets isLoading to true during sign in and resets after", async () => {
      let resolveSignIn: (v: any) => void;
      mockSignIn.mockReturnValue(
        new Promise((resolve) => {
          resolveSignIn = resolve;
        })
      );
      const { result } = renderHook(() => useAuth());

      expect(result.current.isLoading).toBe(false);

      let promise: Promise<any>;
      act(() => {
        promise = result.current.signIn("test@test.com", "password");
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolveSignIn!({ success: false, error: "invalid" });
        await promise!;
      });

      expect(result.current.isLoading).toBe(false);
    });

    test("resets isLoading even when signInAction throws", async () => {
      mockSignIn.mockRejectedValue(new Error("network error"));
      const { result } = renderHook(() => useAuth());

      await expect(
        act(async () => {
          await result.current.signIn("test@test.com", "password");
        })
      ).rejects.toThrow("network error");

      expect(result.current.isLoading).toBe(false);
    });

    test("does not call handlePostSignIn when sign in fails", async () => {
      mockSignIn.mockResolvedValue({ success: false, error: "bad credentials" });
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("test@test.com", "wrong");
      });

      expect(mockPush).not.toHaveBeenCalled();
      expect(mockGetAnonWorkData).not.toHaveBeenCalled();
    });

    test("returns the error result when sign in fails", async () => {
      mockSignIn.mockResolvedValue({ success: false, error: "bad credentials" });
      const { result } = renderHook(() => useAuth());

      let response: any;
      await act(async () => {
        response = await result.current.signIn("test@test.com", "wrong");
      });

      expect(response).toEqual({ success: false, error: "bad credentials" });
    });
  });

  describe("signUp", () => {
    test("calls signUpAction and returns its result", async () => {
      mockSignUp.mockResolvedValue({ success: true });
      const { result } = renderHook(() => useAuth());

      let response: any;
      await act(async () => {
        response = await result.current.signUp("new@test.com", "password");
      });

      expect(mockSignUp).toHaveBeenCalledWith("new@test.com", "password");
      expect(response).toEqual({ success: true });
    });

    test("sets isLoading during sign up and resets after", async () => {
      let resolveSignUp: (v: any) => void;
      mockSignUp.mockReturnValue(
        new Promise((resolve) => {
          resolveSignUp = resolve;
        })
      );
      const { result } = renderHook(() => useAuth());

      let promise: Promise<any>;
      act(() => {
        promise = result.current.signUp("new@test.com", "password");
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolveSignUp!({ success: true });
        await promise!;
      });

      expect(result.current.isLoading).toBe(false);
    });

    test("resets isLoading even when signUpAction throws", async () => {
      mockSignUp.mockRejectedValue(new Error("server error"));
      const { result } = renderHook(() => useAuth());

      await expect(
        act(async () => {
          await result.current.signUp("new@test.com", "password");
        })
      ).rejects.toThrow("server error");

      expect(result.current.isLoading).toBe(false);
    });

    test("does not call handlePostSignIn when sign up fails", async () => {
      mockSignUp.mockResolvedValue({ success: false, error: "email taken" });
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signUp("taken@test.com", "password");
      });

      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe("post-sign-in routing", () => {
    test("saves anonymous work as a project and navigates to it", async () => {
      mockSignIn.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue({
        messages: [{ role: "user", content: "hello" }],
        fileSystemData: { "App.tsx": "code" },
      });
      mockCreateProject.mockResolvedValue({ id: "anon-proj-1" } as any);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("test@test.com", "password");
      });

      expect(mockCreateProject).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [{ role: "user", content: "hello" }],
          data: { "App.tsx": "code" },
        })
      );
      expect(mockClearAnonWork).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/anon-proj-1");
    });

    test("ignores anonymous work when messages are empty", async () => {
      mockSignIn.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue({
        messages: [],
        fileSystemData: {},
      });
      mockGetProjects.mockResolvedValue([{ id: "proj-1" }] as any);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("test@test.com", "password");
      });

      expect(mockClearAnonWork).not.toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/proj-1");
    });

    test("navigates to most recent project when no anon work exists", async () => {
      mockSignIn.mockResolvedValue({ success: true });
      mockGetProjects.mockResolvedValue([
        { id: "recent-1" },
        { id: "older-2" },
      ] as any);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("test@test.com", "password");
      });

      expect(mockPush).toHaveBeenCalledWith("/recent-1");
    });

    test("creates a new project when user has no existing projects", async () => {
      mockSignIn.mockResolvedValue({ success: true });
      mockGetProjects.mockResolvedValue([]);
      mockCreateProject.mockResolvedValue({ id: "fresh-proj" } as any);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("test@test.com", "password");
      });

      expect(mockCreateProject).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [],
          data: {},
        })
      );
      expect(mockPush).toHaveBeenCalledWith("/fresh-proj");
    });

    test("post-sign-in routing works the same for signUp", async () => {
      mockSignUp.mockResolvedValue({ success: true });
      mockGetProjects.mockResolvedValue([{ id: "proj-99" }] as any);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signUp("new@test.com", "password");
      });

      expect(mockPush).toHaveBeenCalledWith("/proj-99");
    });
  });
});
