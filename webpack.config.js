const { CleanWebpackPlugin } = require("clean-webpack-plugin");

module.exports = env => {
    const plugins = env && env.clean
    ? [new CleanWebpackPlugin()]
    : [];

    const mode = env && env.prod
        ? "production"
        : "development";

    return {
        target: "node",
        devtool: "inline-source-map",
        entry: {
            index: "./src/index.ts",
        },
        mode,
        module: {
            rules: [{
                test: /\.tsx?$/,
                loader: "ts-loader"
            },
            {
                test: /\.js$/,
                include: [/*/node_modules\/MY_MODULE/*/]
              },]
        },
        output: {
            filename: "[name].js",
        },
        plugins,
        resolve: {
            modules: [
                "node_modules"
             ],
            extensions: [".ts", ".js"],
        },
        devServer: {
            open: true
        },
        
    };
};