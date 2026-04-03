import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("PixelArt Provider Structure", () => {
  const pkgDir = path.join(__dirname, "..", "packages", "pixelart");

  it("should have a valid package.json", () => {
    const pkg = JSON.parse(
      fs.readFileSync(path.join(pkgDir, "package.json"), "utf-8")
    );
    expect(pkg.name).toContain("pixelart");
  });

  it("should have src/index.ts with exports", () => {
    const content = fs.readFileSync(
      path.join(pkgDir, "src", "index.ts"),
      "utf-8"
    );
    expect(content).toContain("createPixelArt");
    expect(content).toContain("export");
  });

  it("should have the image model file", () => {
    const content = fs.readFileSync(
      path.join(pkgDir, "src", "pixelart-image-model.ts"),
      "utf-8"
    );
    expect(content).toContain("pixelDensity");
    expect(content).toContain("style");
  });

  it("should have the provider file", () => {
    const content = fs.readFileSync(
      path.join(pkgDir, "src", "pixelart-provider.ts"),
      "utf-8"
    );
    expect(content).toContain("PixelArt");
    expect(content).toContain("api.pixelart.ai");
  });
});
