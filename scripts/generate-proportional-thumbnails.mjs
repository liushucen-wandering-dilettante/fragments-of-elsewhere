import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import sharp from "sharp";

const run = promisify(execFile);
const projectRoot = process.cwd();
const publicRoot = path.join(projectRoot, "public");
const destination = path.join(publicRoot, "thumbnails-proportional");

const fragments = JSON.parse(
  await fs.readFile(
    path.join(projectRoot, "src/data/fragments.json"),
    "utf8"
  )
);

await fs.mkdir(destination, { recursive: true });

function localAsset(url) {
  if (
    typeof url !== "string" ||
    !url.startsWith("/") ||
    url.startsWith("//")
  ) {
    throw new Error(`Expected an asset path under public: ${url}`);
  }

  const decoded = decodeURIComponent(url.split(/[?#]/, 1)[0]);
  const absolute = path.resolve(publicRoot, `.${decoded}`);
  const relative = path.relative(publicRoot, absolute);

  if (
    !relative ||
    relative.startsWith("..") ||
    path.isAbsolute(relative)
  ) {
    throw new Error(`Asset is outside public: ${url}`);
  }

  return absolute;
}

async function videoFrame(source) {
  const ffmpeg = process.env.FFMPEG_PATH || "ffmpeg";

  for (const seconds of ["0.5", "0"]) {
    try {
      const { stdout } = await run(
        ffmpeg,
        [
          "-hide_banner",
          "-loglevel", "error",
          "-ss", seconds,
          "-i", source,
          "-map", "0:v:0",
          "-frames:v", "1",
          "-vf",
          "scale=w='if(gte(dar,1),480,max(1,round(480*dar)))':h='if(gte(dar,1),max(1,round(480/dar)),480)',setsar=1",
          "-f", "image2pipe",
          "-vcodec", "png",
          "pipe:1"
        ],
        {
          encoding: "buffer",
          maxBuffer: 32 * 1024 * 1024
        }
      );

      if (stdout.length) return stdout;
    } catch (error) {
      if (error.code === "ENOENT") {
        throw new Error(
          "ffmpeg is not installed. Install it or set FFMPEG_PATH."
        );
      }

      if (seconds === "0") throw error;
    }
  }

  throw new Error(`No readable frame: ${source}`);
}

const seenIds = new Set();
let succeeded = 0;
let failed = 0;

for (const fragment of fragments) {
  if (!["image", "video"].includes(fragment.type)) continue;

  let temporary;

  try {
    if (
      typeof fragment.id !== "string" ||
      !/^[A-Za-z0-9_-]+$/.test(fragment.id) ||
      seenIds.has(fragment.id)
    ) {
      throw new Error("Invalid or duplicate fragment ID");
    }

    seenIds.add(fragment.id);

    const input =
      fragment.type === "image"
        ? localAsset(fragment.image)
        : fragment.poster
          ? localAsset(fragment.poster)
          : await videoFrame(localAsset(fragment.video));

    const target = path.join(
      destination,
      `${fragment.id}.webp`
    );

    temporary = `${target}.${process.pid}.tmp`;

    await sharp(input)
      .rotate()
      .resize({
        width: 480,
        height: 480,
        fit: "inside",
        withoutEnlargement: true
      })
      .webp({ quality: 80 })
      .toFile(temporary);

    await fs.rename(temporary, target);
    succeeded += 1;
  } catch (error) {
    failed += 1;
    console.error(`${fragment.id}: ${error.message}`);
  } finally {
    if (temporary) {
      await fs.rm(temporary, { force: true }).catch(() => {});
    }
  }
}

console.log(
  `Generated ${succeeded} proportional previews in public/thumbnails-proportional.`
);

if (failed) {
  console.error(
    `${failed} preview(s) failed. Fix the reported sources and run again.`
  );
  process.exitCode = 1;
}
