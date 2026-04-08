import { getDb } from "./src/config/db.js";
async function test() {
  const db = await getDb();
  const c = await db.all("SELECT id FROM complaints");
  if (c.length > 0) {
    const id = c[0].id;
    const res = await db.run("UPDATE complaints SET status = ? WHERE id = ?", ["resolved", id]);
    console.log("Changes:", res.changes);
  } else {
    console.log("No complaints found");
  }
}
test();
