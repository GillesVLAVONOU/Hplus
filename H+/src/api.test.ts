import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api, ApiError } from "./api";

describe("client API", () => {
  const storage = new Map<string, string>();

  beforeEach(() => {
    storage.clear();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
      clear: () => storage.clear(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("sends API requests with cookie credentials", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify([{ id: 1 }]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    await expect(api.get<{ id: number }[]>("/types-chambres")).resolves.toEqual(
      [{ id: 1 }],
    );
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:3000/api/types-chambres",
      expect.any(Object),
    );
    const options = vi.mocked(fetch).mock.calls[0]?.[1];
    expect(options?.method).toBe("GET");
    expect(options?.credentials).toBe("include");
  });

  it("surfaces API errors with the server message and status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ message: "Dates invalides" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    await expect(api.get("/chambres/disponibles")).rejects.toMatchObject({
      message: "Dates invalides",
      status: 400,
    } satisfies Partial<ApiError>);
  });

  it("sends delete requests for staff-managed unavailability periods", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ id: 3 }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    await expect(
      api.delete<{ id: number }>("/personnel/indisponibilites/3"),
    ).resolves.toEqual({ id: 3 });
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:3000/api/personnel/indisponibilites/3",
      expect.objectContaining({ method: "DELETE", credentials: "include" }),
    );
  });
});
