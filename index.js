import fs from "fs";
import path from "path";
import * as cheerio from "cheerio";
import readline from "node:readline";
import AdmZip from "adm-zip";
import { unzipFiles } from "./extract.js";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const downloadsDir = path.join(process.cwd(), "downloads");
if (!fs.existsSync(downloadsDir))
  fs.mkdirSync(downloadsDir, { recursive: true });

const gameFilesDir = path.join(downloadsDir, "game_files");
if (!fs.existsSync(gameFilesDir)) {
  fs.mkdirSync(gameFilesDir, { recursive: true });
}

async function streamDownload(url, fileName) {
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });

  if (!res.ok) throw new Error(`Failed to download: ${res.status}`);

  const total = Number(res.headers.get("content-length"));
  const filePath = path.join(downloadsDir, fileName);

  let downloaded = 0;
  const fileStream = fs.createWriteStream(filePath);

  for await (const chunk of res.body) {
    downloaded += chunk.length;
    fileStream.write(chunk);

    if (total) {
      const percent = ((downloaded / total) * 100).toFixed(1);
      process.stdout.write(`\r⬇️  ${fileName} — ${percent}%`);
    } else {
      process.stdout.write(`\r⬇️  ${fileName} — ${downloaded} bytes`);
    }
  }

  fileStream.end();
  process.stdout.write(`\r✅ ${fileName} — done\n`);
}

async function downloadFromLink(href, fileName) {
  const response = await fetch(href, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  const resHtml = await response.text();

  const $$ = cheerio.load(resHtml);
  const downloadLink = $$.html()
    .split("window.open")[2]
    .split('("')[1]
    .split('")')[0];

  if (!downloadLink) throw new Error("Could not extract final download link!");

  await streamDownload(downloadLink, fileName);
}

// function unzipFiles() {
//   fs.readdir(downloadsDir, (err, files) => {
//     if (err) {
//       console.error("Failed to read downloads folder:", err);
//       return;
//     }

//     // Filter only .rar files
//     const rarFiles = files.filter(
//       (file) => path.extname(file).toLowerCase() === ".rar",
//     );

//     if (rarFiles.length === 0) {
//       console.log("No RAR files found.");
//       return;
//     }

//     rarFiles.forEach((file, i) => {
//       const rarPath = path.join(downloadsDir, file);

//       try {
//         const zip = new AdmZip(rarPath);
//         console.log(`Extracting (${i + 1}/${rarFiles.length}): ${file}`);
//         zip.extractAllTo(gameFilesDir, true);
//         console.log(`Extracted!`);
//       } catch (e) {
//         console.error(`Failed to extract ${file}:`, e);
//       }
//     });
//   });

//   fs.readdir(downloadsDir, { withFileTypes: true }, (err, entries) => {
//     if (err) {
//       console.error("Failed to read downloads folder:", err);
//       return;
//     }

//     entries.forEach((entry) => {
//       const srcPath = path.join(downloadsDir, entry.name);
//       const destPath = path.join(gameFilesDir, entry.name);

//       // Skip game_files folder itself
//       if (entry.name === "game_files") return;

//       // Skip .rar files
//       if (entry.isFile() && path.extname(entry.name).toLowerCase() === ".rar") {
//         return;
//       }

//       fs.rename(srcPath, destPath, (err) => {
//         if (err) {
//           console.error(`Failed to move ${entry.name}:`, err);
//         } else {
//           console.log(`Moved: ${entry.name}`);
//         }
//       });
//     });
//   });
// }

const html = fs.readFileSync(path.join(process.cwd(), "index.html"), "utf-8");
const $ = cheerio.load(html);

let links = $('a[href*="fuckingfast.co"]')
  .map((i, el) => $(el).attr("href"))
  .get();

const optionalDownloads = links.filter(
  (item) => !item.includes("fitgirl-repacks.site"),
);

links = links.filter((item) => !optionalDownloads.includes(item));

fs.readdir("downloads", (err, files) => {
  if (err) throw err;

  links = links.filter((link) => !files.some((file) => link.includes(file)));
  rl.question(
    optionalDownloads
      .map((item, index) => `[${index}] ${item.split("#")[1]}`)
      .join("\n") +
      '\nSelect the optional downloads [seperated by " "] or press Enter for none: ',
    async (userInput) => {
      const files = userInput.split(" ").map((i) => {
        return optionalDownloads[i];
      });

      const results = optionalDownloads.filter((item) => files.includes(item));
      links.push(...results);

      if (links.length != 0) {
        for (const href of links) {
          const fileName = href.split("#")[1];

          console.log(`\nStarting download for: ${fileName}`);
          try {
            await downloadFromLink(href, fileName);
          } catch (err) {
            console.error(`❌ Failed for ${fileName}: ${err.message}`);
          }
        }

        console.log("😄 Downloading Successful");
        await unzipFiles();
      } else {
        console.log("🤔 All files already exist");
        rl.question("Do you want to unzip the files? [y/n]: ", async (ans) => {
          if (ans.trim().toLowerCase() == "y") {
            await unzipFiles();
          }
          rl.close();
        });
      }
    },
  );
});
