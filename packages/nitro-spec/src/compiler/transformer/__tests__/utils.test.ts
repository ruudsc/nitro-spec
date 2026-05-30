import { describe, it, expect } from "vitest";
import { getMethodFromFileName } from "../utils";

describe("getMethodFromFileName", () => {
  describe("HTTP method extraction", () => {
    it("should extract GET method from filename", () => {
      const result = getMethodFromFileName("stores.get");
      expect(result.method).toBe("get");
      expect(result.routePart).toBe("stores");
    });

    it("should extract POST method from filename", () => {
      const result = getMethodFromFileName("stores.post");
      expect(result.method).toBe("post");
      expect(result.routePart).toBe("stores");
    });

    it("should extract PATCH method from filename", () => {
      const result = getMethodFromFileName("api-keys.patch");
      expect(result.method).toBe("patch");
      expect(result.routePart).toBe("api-keys");
    });

    it("should extract DELETE method from filename", () => {
      const result = getMethodFromFileName("api-keys.delete");
      expect(result.method).toBe("delete");
      expect(result.routePart).toBe("api-keys");
    });

    it("should extract PUT method from filename", () => {
      const result = getMethodFromFileName("resources.put");
      expect(result.method).toBe("put");
      expect(result.routePart).toBe("resources");
    });

    it("should extract HEAD method from filename", () => {
      const result = getMethodFromFileName("check.head");
      expect(result.method).toBe("head");
      expect(result.routePart).toBe("check");
    });

    it("should extract OPTIONS method from filename", () => {
      const result = getMethodFromFileName("preflight.options");
      expect(result.method).toBe("options");
      expect(result.routePart).toBe("preflight");
    });

    it("should extract TRACE method from filename", () => {
      const result = getMethodFromFileName("debug.trace");
      expect(result.method).toBe("trace");
      expect(result.routePart).toBe("debug");
    });
  });

  describe("case insensitivity", () => {
    it("should handle uppercase method suffix and normalize to lowercase", () => {
      const result = getMethodFromFileName("stores.GET");
      expect(result.method).toBe("get");
      expect(result.routePart).toBe("stores");
    });

    it("should handle mixed case method suffix and normalize to lowercase", () => {
      const result = getMethodFromFileName("stores.Post");
      expect(result.method).toBe("post");
      expect(result.routePart).toBe("stores");
    });
  });

  describe("filenames without method suffix", () => {
    it("should default to GET when no method is specified", () => {
      const result = getMethodFromFileName("audit-log");
      expect(result.method).toBe("get");
      expect(result.routePart).toBe("audit-log");
    });

    it("should default to GET for filenames with only alphanumerics and hyphens", () => {
      const result = getMethodFromFileName("users-list");
      expect(result.method).toBe("get");
      expect(result.routePart).toBe("users-list");
    });
  });

  describe("complex route names with hyphens", () => {
    it("should correctly parse hyphenated route names with method suffix", () => {
      const result = getMethodFromFileName("api-keys.post");
      expect(result.method).toBe("post");
      expect(result.routePart).toBe("api-keys");
    });

    it("should correctly parse deeply hyphenated route names", () => {
      const result = getMethodFromFileName("user-profile-settings.patch");
      expect(result.method).toBe("patch");
      expect(result.routePart).toBe("user-profile-settings");
    });

    it("should correctly parse hyphenated routes with no method", () => {
      const result = getMethodFromFileName("user-profile-settings");
      expect(result.method).toBe("get");
      expect(result.routePart).toBe("user-profile-settings");
    });
  });

  describe("bug regression tests", () => {
    // These test the specific bug cases from the issue
    it("should not match 'get' inside 'post' method", () => {
      const result = getMethodFromFileName("items.post");
      expect(result.method).toBe("post");
      expect(result.routePart).toBe("items");
    });

    it("should not match 'get' inside 'delete' method", () => {
      const result = getMethodFromFileName("items.delete");
      expect(result.method).toBe("delete");
      expect(result.routePart).toBe("items");
    });

    it("should correctly parse all affected routes from the bug report", () => {
      const buggyRoutes = [
        { file: "stores.get", expectedMethod: "get", expectedRoute: "stores" },
        { file: "stores.post", expectedMethod: "post", expectedRoute: "stores" },
        { file: "api-keys.get", expectedMethod: "get", expectedRoute: "api-keys" },
        { file: "api-keys.post", expectedMethod: "post", expectedRoute: "api-keys" },
        { file: "locators.post", expectedMethod: "post", expectedRoute: "locators" },
        { file: "webhooks.get", expectedMethod: "get", expectedRoute: "webhooks" },
      ];

      buggyRoutes.forEach(({ file, expectedMethod, expectedRoute }) => {
        const result = getMethodFromFileName(file);
        expect(result.method).toBe(expectedMethod);
        expect(result.routePart).toBe(expectedRoute);
      });
    });
  });
});
