import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.resolve(__dirname, "../src");
const globalsCssPath = path.resolve(srcDir, "app/globals.css");

describe("Global Thai Typography System & Font Refactor", () => {
  // ── 1. globals.css Specifications ──
  describe("globals.css Architecture & Tokens", () => {
    const cssContent = fs.readFileSync(globalsCssPath, "utf-8");

    test("Includes Google Font imports for both UI Sans and Reading Serif Thai families", () => {
      assert.ok(cssContent.includes("Prompt"), "Must import Prompt font");
      assert.ok(cssContent.includes("Noto+Sans+Thai"), "Must import Noto Sans Thai font");
      assert.ok(cssContent.includes("Noto+Serif+Thai"), "Must import Noto Serif Thai font");
      assert.ok(cssContent.includes("Sarabun"), "Must import Sarabun font");
      assert.ok(cssContent.includes("Inter"), "Must import Inter font");
    });

    test("Defines --font-ui-thai and --font-reading-thai variables", () => {
      assert.match(
        cssContent,
        /--font-ui-thai:\s*['"]Prompt['"]/i,
        "--font-ui-thai must start with Prompt font"
      );
      assert.match(
        cssContent,
        /--font-reading-thai:\s*['"]Noto Serif Thai['"]/i,
        "--font-reading-thai must start with Noto Serif Thai font"
      );
    });

    test("Enforces strict minimum font size token (--text-xs) at 0.75rem (12px)", () => {
      assert.match(
        cssContent,
        /--text-xs:\s*0\.75rem;/,
        "--text-xs must be 0.75rem (12px)"
      );
    });

    test("Defines Thai-optimized line-height tokens to avoid tone mark / diacritic collisions", () => {
      assert.match(cssContent, /--lh-heading:\s*1\.35;/, "--lh-heading must be 1.35");
      assert.match(cssContent, /--lh-ui:\s*1\.45;/, "--lh-ui must be 1.45");
      assert.match(cssContent, /--lh-body:\s*1\.65;/, "--lh-body must be 1.65");
      assert.match(cssContent, /--lh-reading:\s*1\.8;/, "--lh-reading must be 1.8");
    });

    test("Provides .font-reading and .font-ui utility classes", () => {
      assert.ok(cssContent.includes(".font-reading"), "Must have .font-reading class");
      assert.ok(cssContent.includes(".font-ui"), "Must have .font-ui class");
      assert.ok(cssContent.includes(".thai-reading"), "Must have .thai-reading class");
      assert.ok(cssContent.includes(".thai-ui"), "Must have .thai-ui class");
    });
  });

  // ── 2. Full Codebase Scan for Sub-12px Font Sizes ──
  describe("Sub-12px Font Size Elimination Audit", () => {
    function getAllSourceFiles(dir, fileList = []) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          getAllSourceFiles(fullPath, fileList);
        } else if (/\.(tsx|ts|css)$/.test(entry.name)) {
          fileList.push(fullPath);
        }
      }
      return fileList;
    }

    const allFiles = getAllSourceFiles(srcDir);

    test("Zero occurrences of sub-12px rem values (< 0.75rem) in readable UI elements", () => {
      const subRemRegex = /fontSize:\s*["'](0\.(?:[0-6][0-9]*|7[0-4][0-9]*))rem["']/g;
      const violations = [];

      for (const file of allFiles) {
        const content = fs.readFileSync(file, "utf-8");
        let match;
        while ((match = subRemRegex.exec(content)) !== null) {
          violations.push({
            file: path.relative(srcDir, file),
            match: match[0],
            val: match[1],
          });
        }
      }

      assert.deepEqual(
        violations,
        [],
        `Found sub-12px rem font sizes:\n${violations.map(v => `${v.file}: ${v.match}`).join("\n")}`
      );
    });

    test("Zero occurrences of sub-12px explicit pixel values (< 12px) in readable UI elements", () => {
      // Matches fontSize: "8px" to "11px" or font-size: 8px to 11px
      const subPxRegex = /(?:fontSize:\s*["']|font-size:\s*)([1-9]|10|11)px/g;
      const violations = [];

      for (const file of allFiles) {
        const content = fs.readFileSync(file, "utf-8");
        let match;
        while ((match = subPxRegex.exec(content)) !== null) {
          violations.push({
            file: path.relative(srcDir, file),
            match: match[0],
            val: match[1],
          });
        }
      }

      assert.deepEqual(
        violations,
        [],
        `Found sub-12px px font sizes:\n${violations.map(v => `${v.file}: ${v.match}`).join("\n")}`
      );
    });
  });

  // ── 3. Two-Tier Font Hierarchy Utilization ──
  describe("Two-Tier Thai Typography Hierarchy Utilization", () => {
    test("CustomerPriority utilizes --font-reading-thai for AI insight summaries and cautions", () => {
      const file = path.join(srcDir, "components/customer/CustomerPriority.tsx");
      const content = fs.readFileSync(file, "utf-8");
      assert.ok(
        content.includes("var(--font-reading-thai)") || content.includes("font-reading"),
        "CustomerPriority must utilize reading font for AI insights"
      );
    });

    test("CustomerRecommendations utilizes --font-reading-thai for recommendation rationales", () => {
      const file = path.join(srcDir, "components/customer/CustomerRecommendations.tsx");
      const content = fs.readFileSync(file, "utf-8");
      assert.ok(
        content.includes("var(--font-reading-thai)") || content.includes("font-reading"),
        "CustomerRecommendations must utilize reading font for rationales"
      );
    });

    test("CustomerPrep utilizes --font-reading-thai for dialogue guidance and questions", () => {
      const file = path.join(srcDir, "components/customer/CustomerPrep.tsx");
      const content = fs.readFileSync(file, "utf-8");
      assert.ok(
        content.includes("var(--font-reading-thai)") || content.includes("font-reading"),
        "CustomerPrep must utilize reading font for talk tracks"
      );
    });

    test("CustomerDecisionPanel utilizes --font-reading-thai for Why Now and AI action rationales", () => {
      const file = path.join(srcDir, "components/visit-planner/CustomerDecisionPanel.tsx");
      const content = fs.readFileSync(file, "utf-8");
      assert.ok(
        content.includes("var(--font-reading-thai)") || content.includes("font-reading"),
        "CustomerDecisionPanel must utilize reading font for Why Now rationales"
      );
    });

    test("AIRecommendationWidget utilizes --font-reading-thai for narrative advice", () => {
      const file = path.join(srcDir, "components/dashboard/AIRecommendationWidget.tsx");
      const content = fs.readFileSync(file, "utf-8");
      assert.ok(
        content.includes("var(--font-reading-thai)") || content.includes("font-reading"),
        "AIRecommendationWidget must utilize reading font for narrative advice"
      );
    });

    test("DashboardHeroBanner utilizes --font-reading-thai for morning briefing commentary", () => {
      const file = path.join(srcDir, "components/dashboard/DashboardHeroBanner.tsx");
      const content = fs.readFileSync(file, "utf-8");
      assert.ok(
        content.includes("var(--font-reading-thai)") || content.includes("font-reading"),
        "DashboardHeroBanner must utilize reading font for briefing commentary"
      );
    });
  });
});
