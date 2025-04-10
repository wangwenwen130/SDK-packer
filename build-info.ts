import type { RollupOptions } from "rollup";
import { readFile } from "fs/promises";
import { join, relative, parse, dirname, format } from "path";
import { fileURLToPath } from "url";

const cDir = dirname(fileURLToPath(import.meta.url));

const packageJsonCacheMap = new Map<string, PackageJson>();
export const getPackageJson = async (cwd: string): Promise<PackageJson> => {
  const data = packageJsonCacheMap.get(cwd);
  if (data) return data;
  return readFile(join(cwd, "package.json"), "utf-8").then((data) => {
    const obj = JSON.parse(data);
    packageJsonCacheMap.set(cwd, obj);
    return obj;
  });
};
export const renderBuildInfo: (config: PackageJson, cwd: string) => RollupOptions = (config: PackageJson, cwd: string) => {
  const { name, umd, dependencies = {}, main, types } = config;
  const umdName = umd || convertToCamelCase(name);
  const packDir = parse(main).dir
  console.log(format(parse(main)), parse(main));
  const outputPath = relative(cDir, join(cwd, packDir))
  const typeOutputPath = relative(cDir, join(cwd, parse(types).dir))
  return {
    input: join(relative(cDir, join(cwd, "src")), "index.ts"),
    output: [
      {
        file: join(outputPath, 'index.esm.js'),
        format: "es",
      },
      {
        file: join(outputPath, 'index.js'),
        format: "umd",
        name: umdName,
      },
      {
        file: join(typeOutputPath, 'index.d.ts'),
        format: "es",
      },
    ],
    treeshake: true,
    external: [...Object.keys(dependencies)],
  };
};

function convertToCamelCase(str: string): string {
  return str.replace(/-(\w)/g, (match, letter) => letter.toUpperCase());
}
