import { describe, expect, it } from "vitest";
import { estUnCommit } from "./check-avant-commit.mjs";

describe("estUnCommit", () => {
  it("reconnaît un git commit, seul ou enchaîné", () => {
    expect(estUnCommit('git commit -m "docs: x"')).toBe(true);
    expect(estUnCommit("git add CLAUDE.md && git commit -qm x")).toBe(true);
    expect(estUnCommit("npm run check; git commit --amend")).toBe(true);
    expect(estUnCommit("cd /tmp && git -C /home/user/nintendo-db commit -m x")).toBe(true);
    expect(estUnCommit("git commit")).toBe(true);
  });

  it("laisse passer les autres commandes", () => {
    expect(estUnCommit("git status")).toBe(false);
    expect(estUnCommit("git log --grep commit")).toBe(false);
    expect(estUnCommit("git commit-tree HEAD^{tree}")).toBe(false);
    expect(estUnCommit("npm run check")).toBe(false);
    expect(estUnCommit("ls .gitcommit")).toBe(false);
  });
});
