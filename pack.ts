import { rollup, watch, type RollupWatchOptions, type RollupOptions, type OutputOptions } from "rollup";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import { babel } from "@rollup/plugin-babel";
import terser from "@rollup/plugin-terser";
import json from "rollup-plugin-json";
import del from "rollup-plugin-delete";
import dotenv from "rollup-plugin-dotenv";
import typescript from "rollup-plugin-typescript";
import { dts } from "rollup-plugin-dts";
import { join, dirname, relative } from "path";
import { fileURLToPath } from "url";

const cDir = dirname(fileURLToPath(import.meta.url));
const handleOptions = (options: RollupOptions, cwd: string): RollupOptions => {
  const plugins = options.plugins || [];
  const output = (options.output && Array.isArray(options.output) ? options.output : [options.output]) || [];
  const packDir = handleOutput(output as OutputOptions[]);
  const envPath = relative(cDir, join(cDir, "..", "env"));
  const abs = relative(cDir, cwd);
  console.log('cDir', cDir);
  console.log('cwd', cwd, );
  console.log('packDir', packDir);
  console.log('join', join(cwd, packDir));
  console.log('relative', relative(cDir, join(cwd, packDir)));
  const defaultPlugins = [
    // 删除dist目录
    del({ targets: join(relative(cDir, join(cwd, packDir)), "/*") }),
    resolve(),
    json(),
    typescript({
      tsconfig: join(relative(cDir, cwd), "tsconfig.json"),
    }),
    commonjs({
      exclude: [join(abs, "src/**")],
    }),
    dotenv({ cwd: envPath }),
    babel({ babelHelpers: "bundled" }),
  ] as (typeof options.plugins)[];
  return {
    ...options,
    plugins: Array.isArray(plugins) ? [...defaultPlugins, ...plugins] : [...defaultPlugins, plugins],
  };
};

export async function build(options: RollupOptions, cwd: string) {
  const params = handleOptions(options, cwd);
  try {
    const bundle = await rollup(params);
    if (Array.isArray(options.output)) {
      await Promise.all(options.output.map((output) => bundle.write(output)));
    } else {
      await bundle.write(options.output!);
    }
    await bundle.close();
  } catch (error) {
    console.log("构建失败", error);
    process.exit(1);
  }
  console.log("end");
}

export function watchBuild(options: RollupWatchOptions, cwd: string) {
  return watch(handleOptions(options, cwd));
}

/** 添加代码压缩 */
function addTerser(output: OutputOptions) {
  if (output.format === "es" && !output.file?.includes(".d.ts")) {
    if (!output.plugins) {
      output.plugins = [];
    }
    if (output.plugins && !Array.isArray(output.plugins)) {
      output.plugins = [output.plugins];
    }
    output.plugins.push(terser());
  }
}

// 增加dts插件
const addDts = (output: OutputOptions) => {
  if (output.file?.includes(".d.ts")) {
    if (!output.plugins) {
      output.plugins = [];
    }
    if (output.plugins && !Array.isArray(output.plugins)) {
      output.plugins = [output.plugins];
    }
    output.plugins.push(dts());
  }
};

const handleOutput = (output: OutputOptions[]) => {
  output.forEach((out) => {
    addTerser(out);
    addDts(out);
  });
  return output[0].dir || dirname(output[0].file!) || "dist";
};
