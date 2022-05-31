import { assertEquals, delay, Denops, test } from "./deps.ts";
import { main } from "./main.ts";

test({
  mode: "all",
  name: "open assignee buffer from issue list",
  fn: async (denops: Denops) => {
    await main(denops);
    await denops.cmd("e https://github.com/skanehira/test/issues");
    await delay(300);
    const actual = await denops.call("getline", 1) as string[];
    const expect = "#27 test2 OPEN  () ";
    assertEquals(actual, expect);
  },
});
