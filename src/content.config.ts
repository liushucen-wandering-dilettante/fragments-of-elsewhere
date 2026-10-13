import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";

const fragmentTexts = defineCollection({
  loader: glob({
    base: "./src/content/fragments",
    pattern: "**/*.md",

    // 保留 T001 中的大写字母
    generateId: ({ entry }) =>
      entry.replace(/\.md$/, "")
  })
});

export const collections = {
  fragmentTexts
};