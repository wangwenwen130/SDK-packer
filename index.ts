import glob from "fast-glob";
import { fileURLToPath } from "url";
import { resolve, dirname, join } from "path";
import { getPackageJson, renderBuildInfo } from "./build-info";
import { build } from "./pack";

export const projRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const pkgRoot = resolve(projRoot, "packages");

const startBuild = async () => {
  /** 获取项目名称 */
  let projectNames = await glob("**", {
    cwd: pkgRoot,
    onlyFiles: false,
    deep: 1,
    absolute: false,
  });

  /** 开启构建 */
  projectNames = projectNames.filter((name) => !["ertc-web", "ertc-web-device"].includes(name));

  for await (const name of projectNames) {
    /** 当前的工作目录*/
    const cwd = join(pkgRoot, name);
    try {
      const pkg = await getPackageJson(cwd);
      const buildInfo = renderBuildInfo(pkg, cwd)
      await build(buildInfo, cwd);
    } catch (error) {
      console.log("获取 package.json 失败", error);
      process.exit(1);
    }
  }
};

startBuild();
