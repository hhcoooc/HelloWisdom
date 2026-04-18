import { NextConfig } from 'next';
export type PluginOptions = {
    /**
     * @default "/node_modules([\s\S]*?)\.(tsx|ts|js|mjs|jsx)$/"
     */
    test?: RegExp;
    /**
     * @default "\\.(less|css|scss|sass|styl)$"
     */
    matchImports?: string;
};
declare const removeImports: (pluginOptions?: PluginOptions) => (nextConfig?: NextConfig) => NextConfig;
export default removeImports;
export = removeImports;
