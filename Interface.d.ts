interface PackageJson extends Record<string, any> {
  name: string;
  umd?: string;
  version: string;
  description: string;
  main: string;
  module: string;
  types: string;
  scripts: Record<string, string>;
  devDependencies: Record<string, string>;
  dependencies: Record<string, string>;
  peerDependencies: Record<string, string>;
}
