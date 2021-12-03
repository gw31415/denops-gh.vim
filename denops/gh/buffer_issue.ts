import { autocmd, Denops, vars } from "./deps.ts";
import { BufferSchema, initializeBuffer } from "./buffer.ts";
import { getIssue, updateIssue } from "./github/issue.ts";
import { endpoint } from "./github/api.ts";
import { IssueItem } from "./github/schema.ts";

export async function actionEditIssue(denops: Denops, schema: BufferSchema) {
  if (!schema.issue) {
    throw new Error(`invalid schema: ${schema}`);
  }

  try {
    const issue = await getIssue(endpoint, {
      owner: schema.owner,
      repo: schema.repo,
      number: schema.issue.number,
    });
    await initializeBuffer(denops);
    await denops.call("setline", 1, issue.body.split("\r\n"));
    await denops.cmd("set ft=markdown nomodified buftype=acwrite");

    schema.actionType = "issues:update";
    await vars.b.set(denops, "gh_schema", schema);
    await vars.b.set(denops, "gh_issue", issue);

    await autocmd.group(
      denops,
      `gh_issue_edit_${schema.issue.number}`,
      (helper) => {
        helper.remove("*", "<buffer>");
        helper.define(
          "BufWriteCmd",
          "<buffer>",
          `call denops#notify("${denops.name}", "doAction", [])`,
        );
      },
    );
  } catch (e) {
    console.error(e.message);
  }
}

export async function actionUpdateIssue(denops: Denops, _schema: BufferSchema) {
  if (!await denops.eval("&modified")) {
    // if issue body doesn't changed, do nothing
    return;
  }

  const issue = await vars.b.get(denops, "gh_issue") as IssueItem;
  const body = await denops.eval(`getline(1, "$")`) as string[];
  if (body.length === 1 && body[0] === "") {
    console.error("issue body cannot be empty");
    return;
  }

  const input = {
    id: issue.id,
    body: body.join("\r\n"),
  };
  try {
    const newIssue = await updateIssue(endpoint, input);
    await vars.b.set(denops, "gh_issue", newIssue);
    await denops.cmd("setlocal nomodified");
  } catch (e) {
    console.error(e.message);
  }
}

export async function listIssues(_denops: Denops, _schema: BufferSchema) {
  console.warn("still implement yet");
  await Promise.resolve();
}
