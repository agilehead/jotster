import { expect } from "chai";
import http from "node:http";
import { createApiClient } from "../../utils/api-client.js";

describe("ApiClient", () => {
  it("forwards tenant host headers for authenticated requests", async () => {
    const observedHosts: string[] = [];
    const server = http.createServer((req, res) => {
      observedHosts.push(req.headers.host ?? "");
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ result: "success" }));
    });

    await new Promise<void>((resolve) =>
      server.listen(9989, "127.0.0.1", resolve),
    );

    try {
      const client = createApiClient(
        "http://127.0.0.1:9989",
        "user@test.local",
        "secret",
        "tenant-a.test.local:9877",
      );

      const res = await client.getRaw("/health");
      expect(res.status).to.equal(200);
      expect(observedHosts).to.deep.equal(["tenant-a.test.local:9877"]);
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
    }
  });

  it("serializes array and object payload fields as JSON form values", async () => {
    const observedBodies: string[] = [];
    const server = http.createServer((req, res) => {
      const chunks: Buffer[] = [];
      req.on("data", (chunk) => {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      });
      req.on("end", () => {
        observedBodies.push(Buffer.concat(chunks).toString("utf8"));
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ result: "success" }));
      });
    });

    await new Promise<void>((resolve) =>
      server.listen(9990, "127.0.0.1", resolve),
    );

    try {
      const client = createApiClient(
        "http://127.0.0.1:9990",
        "user@test.local",
        "secret",
      );

      const res = await client.postRaw("/submit", {
        subscriptions: [{ name: "general" }],
        principals: ["alice@test.local", "bob@test.local"],
        invite_only: true,
      });

      expect(res.status).to.equal(200);
      expect(observedBodies).to.deep.equal([
        "subscriptions=%5B%7B%22name%22%3A%22general%22%7D%5D&principals=%5B%22alice%40test.local%22%2C%22bob%40test.local%22%5D&invite_only=true",
      ]);
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
    }
  });
});
