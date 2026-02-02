// extract.js
import { spawn } from "child_process";
import fs from "fs";
import path from "path";

// Detect multipart first volumes OR single-volume rars
const FIRST_VOLUME_REGEX = /\.(part0*1|r0*0)\.rar$/i;

function getRarArchivesToExtract(downloadsDir) {
  const files = fs.readdirSync(downloadsDir);

  const rarFiles = files.filter((f) => f.toLowerCase().endsWith(".rar"));
  if (rarFiles.length === 0) return [];

  const groups = new Map();

  for (const file of rarFiles) {
    // Remove .partXX.rar or .rXX.rar or just .rar
    const base = file
      .replace(/\.(part\d+|r\d+)\.rar$/i, "")
      .replace(/\.rar$/i, "");

    if (!groups.has(base)) {
      groups.set(base, []);
    }
    groups.get(base).push(file);
  }

  const firstVolumes = [];

  for (const files of groups.values()) {
    // Prefer explicit first volumes
    let first = files.find((f) => /\.(part0*1|r0*0)\.rar$/i.test(f));

    // Single-volume fallback
    if (!first && files.length === 1) {
      first = files[0];
    }

    // Last-resort numeric sort
    if (!first) {
      files.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
      first = files[0];
    }

    firstVolumes.push(first);
  }

  return firstVolumes.map((f) => path.join(downloadsDir, f));
}

export async function unzipFiles() {
  const downloadsDir = path.join(process.cwd(), "downloads");
  const outputDir = path.join(downloadsDir, "game_files");

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // ---- 1. Find ALL archives to extract ----
  const archives = getRarArchivesToExtract(downloadsDir);

  if (archives.length === 0) {
    console.log("❌ No RAR archives found.");
    return;
  }

  // ---- 2. Extract EACH archive set ----
  for (const rarPath of archives) {
    console.log(`\nExtracting: ${path.basename(rarPath)}`);

    await new Promise((resolve, reject) => {
      const unrar = spawn("unrar", ["x", "-o+", rarPath, outputDir], {
        shell: true,
      });

      unrar.stdout.on("data", (d) => process.stdout.write(d));
      unrar.stderr.on("data", (d) => process.stderr.write(d));

      unrar.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`unrar failed for ${rarPath}`));
      });
    });
  }

  console.log("\n✅ All RAR archives extracted.");

  // ---- 3. Move everything that is NOT .rar ----
  const entries = fs.readdirSync(downloadsDir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name === "game_files") continue;

    if (entry.isFile() && entry.name.toLowerCase().endsWith(".rar")) {
      continue;
    }

    const src = path.join(downloadsDir, entry.name);
    const dest = path.join(outputDir, entry.name);

    try {
      fs.renameSync(src, dest);
      console.log(`Moved: ${entry.name}`);
    } catch (err) {
      console.error(`Failed to move ${entry.name}: ${err.message}`);
    }
  }

  console.log("\n📁 All non-RAR files moved to game_files.");
}
