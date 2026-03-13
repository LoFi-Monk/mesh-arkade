import { readFileSync } from "fs";
import { relative } from "path";
import { execSync } from "child_process";

const TS_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx"];

function getStagedFiles() {
  try {
    const output = execSync("git diff --cached --name-only --diff-filter=ACM", {
      encoding: "utf-8",
    });
    return output
      .split("\n")
      .map((f) => f.trim())
      .filter((f) => f.length > 0);
  } catch {
    return [];
  }
}

function getAllFiles(dir = "src") {
  try {
    const output = execSync(`find ${dir} -type f`, {
      encoding: "utf-8",
    });
    return output
      .split("\n")
      .map((f) => f.trim())
      .filter((f) => f.length > 0 && TS_EXTENSIONS.some((ext) => f.endsWith(ext)));
  } catch {
    // Fallback for Windows if find is not available
    try {
      const output = execSync(`dir /s /b ${dir}`, {
        encoding: "utf-8",
      });
      return output
        .split("\r\n")
        .map((f) => f.trim())
        .filter((f) => f.length > 0 && TS_EXTENSIONS.some((ext) => f.endsWith(ext)))
        .map((f) => relative(process.cwd(), f));
    } catch {
      return [];
    }
  }
}

function isExported(memberLine) {
  const trimmed = memberLine.trim();
  return (
    trimmed.startsWith("export const ") ||
    trimmed.startsWith("export let ") ||
    trimmed.startsWith("export var ") ||
    trimmed.startsWith("export function ") ||
    trimmed.startsWith("export class ") ||
    trimmed.startsWith("export interface ") ||
    trimmed.startsWith("export type ") ||
    trimmed.startsWith("export async function ")
  );
}

function extractMemberName(line) {
  const patterns = [
    /export\s+(?:async\s+)?function\s+(\w+)/,
    /export\s+class\s+(\w+)/,
    /export\s+interface\s+(\w+)/,
    /export\s+type\s+(\w+)/,
    /export\s+(?:const|let|var)\s+(\w+)/,
  ];

  for (const pattern of patterns) {
    const match = line.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function findTSDocComment(lines, currentIndex) {
  let startIndex = currentIndex - 1;

  while (startIndex >= 0) {
    const line = lines[startIndex].trim();
    if (line.startsWith("/**")) {
      let docContent = "";
      let i = startIndex;
      while (i < lines.length) {
        docContent += lines[i] + "\n";
        if (lines[i].includes("*/")) break;
        i++;
      }
      return docContent;
    } else if (
      line.length > 0 &&
      !line.startsWith("*") &&
      !line.startsWith("//")
    ) {
      break;
    }
    startIndex--;
  }

  return null;
}

function validateTSDoc(docContent, memberName, filePath) {
  const errors = [];

  if (!docContent) {
    errors.push(`${memberName}: Missing TSDoc comment`);
    return errors;
  }

  if (!docContent.includes("@intent") && !docContent.includes("* @intent")) {
    errors.push(`${memberName}: Missing @intent tag`);
  }

  const hasGuarantee =
    docContent.includes("@guarantee") ||
    docContent.includes("* @guarantee") ||
    docContent.includes("@contract") ||
    docContent.includes("* @contract");

  if (!hasGuarantee) {
    errors.push(`${memberName}: Missing @guarantee or @contract tag`);
  }

  return errors;
}

function checkFile(filePath) {
  const ext = filePath.slice(filePath.lastIndexOf("."));
  if (!TS_EXTENSIONS.includes(ext)) {
    return { filePath, errors: [], skipped: true };
  }

  try {
    const content = readFileSync(filePath, "utf-8");
    const lines = content.split("\n");
    const errors = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (isExported(line)) {
        const memberName = extractMemberName(line);
        if (memberName) {
          const docContent = findTSDocComment(lines, i);
          const memberErrors = validateTSDoc(docContent, memberName, filePath);
          errors.push(...memberErrors);
        }
      }
    }

    return { filePath, errors, skipped: false };
  } catch (err) {
    return {
      filePath,
      errors: [`Error reading file: ${err.message}`],
      skipped: false,
    };
  }
}

function main() {
  const args = process.argv.slice(2);
  const checkAll = args.includes("--all") || args.includes("--strict");

  let srcFiles = [];

  if (checkAll) {
    console.log("Mode: Strict (Scanning all source files)");
    srcFiles = getAllFiles("src");
  } else {
    const stagedFiles = getStagedFiles();
    srcFiles = stagedFiles.filter((f) => f.startsWith("src/"));
  }

  if (srcFiles.length === 0) {
    console.log("No files to check.");
    process.exit(0);
  }

  console.log(`Checking TSDoc in ${srcFiles.length} file(s)...\n`);

  let hasErrors = false;

  for (const file of srcFiles) {
    const result = checkFile(file);

    if (result.skipped) continue;

    if (result.errors.length > 0) {
      hasErrors = true;
      console.log(`\n❌ ${file}`);
      for (const error of result.errors) {
        console.log(`   ${error}`);
      }
    } else {
      console.log(`✓ ${file}`);
    }
  }

  console.log("");

  if (hasErrors) {
    console.log("TSDoc validation failed. Please fix the issues above.");
    process.exit(1);
  } else {
    console.log("All TSDoc checks passed!");
    process.exit(0);
  }
}

main();
