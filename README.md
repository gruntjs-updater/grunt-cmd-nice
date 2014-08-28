# grunt-cmd-nice

> another transport javascript into cmd

## 为什么要重复造这个轮子?

将Javascript转换成[cmd](https://github.com/seajs/seajs/issues/242)格式之前已经有了[spmjs](http://spmjs.io/)中的[grunt-cmd-transport](https://github.com/spmjs/grunt-cmd-transport)，那我为什么还要重复造这个轮子呢?原本我也是fork了一份[grunt-cmd-transport](https://github.com/spmjs/grunt-cmd-transport)，但在拓展的时候，总是觉得它包含了太多和[spmjs](http://spmjs.io/)相交融的隐形规则。我觉得这种隐形规则应该从[Gruntfile](http://gruntjs.com/sample-gruntfile)中去配置。当然，在开发过程中，我大量参考了[grunt-cmd-transport](https://github.com/spmjs/grunt-cmd-transport)之前代码，其中一些逻辑也做了简化。

另外，之前[spmjs](http://spmjs.io/)也提供了`合并`任务:[grunt-cmd-concat](https://github.com/spmjs/grunt-cmd-concat)。在我这个[grunt-cmd-nice](/)中直接也包含`concat`任务。

### 什么是transport?

简单说来，transport就是将js代码，转换成一个理想的cmd格式；而理想的cmd格式，包含id、dependencies等;

然后，transport还包括将一些模板文件（如handlebars文件）、CSS文件（*.css、*.less、*.scss等）也转换成js代码——如果你代码中使用require方式来加载这些*.handlebars等的话。

## Getting Started
This plugin requires Grunt `~0.4.2`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-cmd-nice --save
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-cmd-nice');
```

## The "cmd_nice" task

### Overview
In your project's Gruntfile, add a section named `cmd_nice` to the data object passed into `grunt.initConfig()`.

```js
// transport javascript to cmd
grunt.initConfig({
  cmd_transport: {
    options: {
      // Task-specific options go here.
    },
    your_target: {
      // Target-specific file lists and/or options go here.
    },
  },
});

// concat transported javascripts
grunt.initConfig({
  cmd_concat: {
    options: {
      // Task-specific options go here.
    },
    your_target: {
      // Target-specific file lists and/or options go here.
    },
  },
});
```

### Options for cmd_transport

#### options.debug
Type: `Boolean`
Default value: false

是否生成debug文件

#### options.useCache
Type: `Boolean`
Default value: false

是否使用cache来提升transport的性能


#### options.debugOptions
Type: `object`
Default value:

```js
debugOptions: {
    postfix: "-debug" // 如果是*.js文件，debug文件就是*-debug.js; 再比如是*.css.js文件，debug文件是*-debug.css.js
}
```

如果debug为true,为debug配置的参数

#### options.rootPath
Type: `String`
Default value: `process.cwd()`

代码所在的根目录,这个配置的作用是：默认transport后的代码的`id = lstrip(文件所在的路径, ptions.rootPath)`;当然，你完全可以通过函数来自定义id

#### options.paths

Type: `String`
Default value: `[]`

寻找代码的路径

#### options.alias
Type: `object`
Default value: `{}`

别名的map，比如你需要做合并，那么需要实现把别名转换成真正的名

#### options.aliasPaths
Type: `object`
Default value: `{}`

路径别名的map，作用和上述的alias类似

#### options.handlebars
Type: `object`
Default value:

```js
{
    id: 'alinw/handlebars/1.3.0/runtime',
    knownHelpers: [
        "if",
        "unless",
        "each"
    ],
    knownHelpersOnly: false
}
```

预编译*.handlebars文件时所需要的配置

#### options.sassOptions

Type: `object`
Default value: `{}`

使用[node-sass](https://github.com/andrew/node-sass)来编译[sass](http://sass-lang.com/)所需要的参数。

其中的options字段可以参考[node-sass#options](https://github.com/andrew/node-sass#options)。

#### options.lessOptions

Type: `object`
Default value: `{}`

编译[less](http://lesscss.org/)文件时所需要的参数。

其中的options字段可以参考[using-less-configuration](http://lesscss.org/#using-less-configuration)。

#### options.cssOptions

Type: `object`
Default value: `{}`

transport css to js时需要的参数，目前就一个`paths`字段（类似`array`）。

### Options for cmd_concat

#### options.paths

Type: `array`
Default value: `[]`

#### options.filters

Type: `boolean` `array` `function`
Default value: `false`

是否使用过滤功能，默认false，即不使用;你可以配置成一个数组，其中的元素是各种后缀名，来只合并这些文件;或者完全自定义一个函数。

#### options.include

Type: `String`
Default value: `relative`

这个的意思可以参考一下:[spm-build#include](http://docs.spmjs.org/doc/spm-build#include)

### Usage Examples

理想中，可以简单的编译、打包、压缩工具类似这样:

```js
var fs = require("fs");
var path = require("path");

module.exports = function(grunt) {

    var configFile = grunt.option("config");
    if (!configFile) {
        grunt.log.error("helps:");
        grunt.log.error("--config : config file for seajs");
        return;
    }
    if (!fs.existsSync(configFile)) {
        grunt.log.error("Config file: " + configFile + " does not exist");
        return;
    }

    var configFileContent = fs.readFileSync(configFile, "utf-8");
    configFileContent = eval(configFileContent);

     var config = {};

    config.cmd_transport = {
        options: {
            debug: true,
            rootPath: path.join(process.cwd(), "src"),
            paths: [
                path.join(process.cwd(), "src")
            ],
            alias: configFileContent.alias,
            aliasPaths: configFileContent.paths,
            handlebars: {
                id: 'alinw/handlebars/1.3.0/runtime',
                knownHelpers: [
                    "if",
                    "unless",
                    "each"
                ]
            },
            sassOptions: {
                includePaths: [
                    path.normalize(path.join(__dirname, "src", "css")),
                ],
                outputStyle: "expanded"
            },
            lessOptions: {
                paths: [
                    path.normalize(path.join(__dirname, "src", "css"))
                ]
            },
            cssOptions: {
                paths: [
                    path.normalize(path.join(__dirname, "src", "css"))
                ]
            }
        },
        release: {
            files: [
                {
                    src: ["**/*.js"],
                    dest: "dist",
                    expand: true,
                    ext: ".js",
                    cwd: "src",
                    filter: "isFile"
                },
                {
                    src: ["**/*.json"],
                    dest: "dist",
                    expand: true,
                    ext: ".json.js",
                    cwd: "src",
                    filter: "isFile"
                },
                {
                    src: ["**/*.handlebars"],
                    dest: "dist",
                    expand: true,
                    ext: ".handlebars.js",
                    cwd: "src",
                    filter: "isFile"
                },
                {
                    src: ["**/*.tpl"],
                    dest: "dist",
                    expand: true,
                    ext: ".tpl.js",
                    cwd: "src",
                    filter: "isFile"
                },
                {
                    src: ["**/*.html"],
                    dest: "dist",
                    expand: true,
                    ext: ".html.js",
                    cwd: "src",
                    filter: "isFile"
                },
                {
                    src: ["**/*.css"],
                    dest: "dist",
                    expand: true,
                    ext: ".css.js",
                    cwd: "src",
                    filter: "isFile"
                },
                {
                    src: ["**/*.less"],
                    dest: "dist",
                    expand: true,
                    ext: ".less.js",
                    cwd: "src",
                    filter: "isFile"
                },
                {
                    src: ["**/*.scss"],
                    dest: "dist",
                    expand: true,
                    ext: ".scss.js",
                    cwd: "src",
                    filter: "isFile"
                }
            ]
        }
    };

    config.cmd_concat = {
        options: {
            paths: [
                path.normalize(path.join(__dirname,  "dist"))
            ],
            filters: false,
            include: "all"
        },
        release: {
            files: [
                {
                    src: ["**/*.js"],
                    dest: "dist",
                    expand: true,
                    cwd: "dist",
                    filter: "isFile"
                }
            ]
        }
    };

    // https://github.com/gruntjs/grunt-contrib-uglify
    config.uglify = {
        options: {
            mangle: false,
            compress: true,
            beautify: false,
            report: "min",
            preserveComments: false
        },
        release: {
            files: [
                {
                    src: ["**/*.js"],
                    dest: "dist",
                    expand: true,
                    ext: ".js",
                    cwd: "dist",
                    filter: function(file) {
                        var stats = fs.lstatSync(file);
                        return stats.isFile() && !/\-debug\.*\.js$/.test(file);
                    }
                }
            ]
        }
    };

    // less: https://github.com/gruntjs/grunt-contrib-less
    config.less = {
        options: {
            paths: [
                path.normalize(path.join(__dirname, "src", "css"))
            ],
            cleancss: true,
            compress: true,
            ieCompat: true
        },
        release: {
            files: [
                {
                    src: ["**/*.js"],
                    dest: "dist",
                    expand: true,
                    ext: ".js",
                    cwd: "dist",
                    filter: function(filePath) {
                        var baseName = path.basename(filePath);
                        return !/\.json\.js$/.test(baseName) &&
                            !/\.handlebars\.js$/.test(baseName) &&
                            !/\.css\.js$/.test(baseName) &&
                            !/\.less\.js$/.test(baseName) &&
                            !/\.scss\.js$/.test(baseName)
                },
                {
                    src: ["**/*.json.js"],
                    dest: "dist",
                    expand: true,
                    ext: ".json.js",
                    cwd: "dist",
                    filter: "isFile"
                },
                {
                    src: ["**/*.handlebars.js"],
                    dest: "dist",
                    expand: true,
                    ext: ".handlebars.js",
                    cwd: "dist",
                    filter: "isFile"
                },
                {
                    src: ["**/*.css.js"],
                    dest: "dist",
                    expand: true,
                    ext: ".css.js",
                    cwd: "dist",
                    filter: "isFile"
                },
                {
                    src: ["**/*.less.js"],
                    dest: "dist",
                    expand: true,
                    ext: ".less.js",
                    cwd: "dist",
                    filter: "isFile"
                }
            ]
        }
    };

    // sass: https://github.com/gruntjs/grunt-contrib-sass
    config.sass = {
        options: {
            paths: [
                path.normalize(path.join(__dirname, "src", "css"))
            ],
            style: "expanded",
            compass: true
        },
        release: {
            files: [
                {
                    src: ["**/*.scss"],
                    dest: "dist",
                    expand: true,
                    ext: ".css",
                    cwd: "src",
                    filter: "isFile"
                }
            ]
        }
    };

    // css min: https://github.com/gruntjs/grunt-contrib-cssmin
    config.cssmin = {
        options: {
            keepSpecialComments: 0,
            report: "min"
        },
        release: {
            files: [
                {
                    src: ["**/*.css"],
                    dest: "dist",
                    expand: true,
                    ext: ".css",
                    cwd: "src",
                    filter: "isFile"
                }
            ]
        }
    };

    grunt.initConfig(config);

    grunt.loadNpmTasks("grunt-cmd-nice");
    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.loadNpmTasks("grunt-contrib-less");
    grunt.loadNpmTasks("grunt-contrib-sass");
    grunt.loadNpmTasks("grunt-contrib-cssmin");

    grunt.registerTask("default", [
        "cmd_transport",
        "cmd_concat",
        "uglify",
        "less",
        "cssmin"
    ]);

};
```

运行grunt时指定一个config，这个config类似这样:

```js
(function() {
    var root = this;
    var config = {

        alias: {
            $: 'alinw/jquery/1.11.0/jquery',
            "$-debug": 'alinw/jquery/1.11.0/jquery-debug'
        },
        paths: {
        },
        comboSyntax: ["??", ","],
        comboMaxLength: 500,
        preload: [
            "$"
        ],
        map: [],
        charset: 'utf-8',
        timeout: 20000,
        debug: true
    };

    if (root.seajs) {
        root.seajs.config(config);
    }

    return config;
}).call(this);
```

这份`config.js`在浏览器中和在grunt中可以共用。

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History

### 0.2.1
* 使用[cssjoin](https://github.com/suisho/cssjoin)来做transport中的CSS合并

### 0.2.0
* 修复依赖相对路径的handlebars文件时没有合并进去的bug
* 将debug单独做成一个任务
* 所有插件改成`promise`
* 修复transport时CSS中含有@import时没有展开的bug

### 0.1.1
* 合并时的seperator优化
* 增加统计的回掉功能

### 0.1.0
* 先正式发布一版

### 0.0.15
* 修复佛山发现的在合并时的一个bug

### 0.0.14
* 对JS代码解析时，增加对语法错误的文件的报错提示

### 0.0.13
* 使用[sass.js](https://github.com/medialize/sass.js/)来替换[node-sass](https://github.com/sass/node-sass)

#### 0.0.4
* concat也添加 `useCache` 来提升性能

#### 0.0.3
* 添加 `useCache` 来提升性能

#### 0.0.2
* 修复windows下路径格式的问题

#### 0.0.1
* 第一个测试版
