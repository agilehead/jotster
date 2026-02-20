import { TestDatabase } from "./utils/test-db.js";
import { TestServer } from "./utils/test-server.js";

let testDb: TestDatabase;
let testServer: TestServer;

before(async function () {
  this.timeout(30000);
  testDb = new TestDatabase();
  await testDb.setup();
  testServer = new TestServer();
  await testServer.start();
});

beforeEach(async function () {
  await testDb.truncateAllTables();
});

after(async function () {
  this.timeout(10000);
  await testServer.stop();
  await testDb.teardown();
});

export { testDb, testServer };
