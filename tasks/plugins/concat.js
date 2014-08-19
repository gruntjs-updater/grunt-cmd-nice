/**
 * User: garcia.wul (garcia.wul@alibaba-inc.com)
 * Date: 2014/05/26
 * Time: 16:29
 * 对transport后的文件进行合并
 */

var fs = require("fs");
var path = require("path");
var util = require("util");

var _ = require("underscore");
var StringUtils = require("underscore.string");
var Handlebars = require("handlebars");

var Base = require("./base");
var CmdParser = require("../utils/cmd-parser");

/**
 * 构造函数
 * @param options 所包含的字段有：
 * * filters: 是否使用过滤功能，默认false; 可以传入一个数组，来过滤相应的后缀名; 也可以是一个函数，来自定义过滤;
 * * include: 打包策略; relative/all/self
 * * separator: 合并文件的分隔，默认;
 * @constructor
 */
var Concat = function(options) {
    var self = this;
    self.options = {
        // 是否使用过滤功能
        filters: false,
        // 打包策略:
        // 可以参考: http://docs.spmjs.org/doc/spm-build#include
        // * relative: 相对路径，即只会打包本项目的
        // * all: 把外部依赖也打包进来
        // * self: 仅仅自己，也就意味着不打包其依赖的文件
        include: "relative"
    };
    Base.call(self, options);
    // 保存id和内容的对应
    self.idCache = {};
    self.astCache = {};
    self.dependenciesCache = {};
};
util.inherits(Concat, Base);

Concat.prototype.execute = function(inputFile) {
    var self = this;
    // Step 1: 读取输入文件的内容
    var source = path.normalize(fs.realpathSync(inputFile.src));
    if (!fs.existsSync(source)) {
        self.logger.error("%s does not exist", source);
        return;
    }
    var content = fs.readFileSync(source, "utf-8");

    // Step 2: 得到抽象语法树
    var cmdParser = new CmdParser();
    var ast = null;
    var metaAst = null;
    if (self.options.useCache && _.has(self.astCache, source) &&
        self.astCache[source].ast
        ) {
        ast = self.astCache[source].ast;
    }
    else {
        ast = cmdParser.getAst(content);
        if (!ast) {
            self.logger.error("Parse %s failed", source);
            self.dumpFileBySource(inputFile);
            return;
        }
        if (ast.error === true) {
            self.logger.error("Parse %s failed: %s,%s", source, ast.line, ast.col);
            return;
        }
    }

    if (self.options.useCache && _.has(self.astCache, source) &&
        self.astCache[source].metaAst
        ) {
        metaAst = self.astCache[source].metaAst;
    }
    else {
        metaAst = cmdParser.parseFirst(ast);
        if (metaAst && self.options.useCache) {
            self.astCache[source] = {
                ast: ast,
                metaAst: metaAst
            };
        }
    }

    if (!metaAst) {
        self.logger.warning("%s is not AMD format", source);
        self.dumpFileBySource(inputFile);
        return;
    }

    // Step 3: 得到依赖的模块
    var start = new Date().getTime();
    var dependencies = metaAst.dependencies;
    var contents = [];
    if (self.options.useCache && self.dependenciesCache.hasOwnProperty(source)) {
        contents = self.dependenciesCache[source];
    }
    else {
        contents = [content];
        if (self.options.include !== "self") {
            _.each(dependencies, function(dependency) {
                var content = null;
                var extName = path.extname(dependency);
                var isConcat = false;
                if (_.isArray(self.options.filters) && _.contains(self.options.filters, extName)) {
                    isConcat = true;
                }
                else if (_.isFunction(self.options.filters)) {
                    isConcat = self.options.filters(dependency);
                }
                if (self.options.filters && !isConcat) {
                    // 如果使用了filter，并且不做合并
                    return;
                }
                if (self.options.include === "relative") {
                    if (dependency.indexOf("../") === 0 || dependency.indexOf("./") === 0) {
                         if (_.has(self.idCache, dependency)) {
                            content = self.readContentFromCache(dependency);
                        }
                        else {
                            content = self.readContentForRelativePath(dependency, path.dirname(source));
                         }
                    }
                }
                else {
                    if (_.has(self.idCache, dependency)) {
                        content = self.readContentFromCache(dependency);
                    }
                    else if (dependency.indexOf("../") === 0 || dependency.indexOf("./") === 0) {
                        content = self.readContentForRelativePath(dependency, path.dirname(source));
                    }
                    else {
                        content = self.readContentFromLocal(dependency);
                    }
                }

                if (!content) {
                    return;
                }
                contents.push(content);
            });
        }
        if (self.options.useCache) {
            self.dependenciesCache[source] = contents;
        }
        // fix 佛山发现的依赖库被合并了两次的bug 2014-07-16
        self.idCache[metaAst.id] = content;
    }
    self.logger.debug("[Profile] Step 3: 得到依赖的模块: " + (new Date().getTime() - start));
    start = new Date().getTime();
    contents = _.map(contents, function(content) {
        return StringUtils.rstrip(content, {source: ";"});
    });
    contents = contents.join((self.options.separator || ";") + "\n");
    contents = StringUtils.rstrip(contents, {source: ";"}) + (self.options.separator || ";");
    self.logger.debug("[Profile] Step 4: 合并: " + (new Date().getTime() - start));
    self.dumpFile(inputFile.dest, contents);
    return true;
};

Concat.prototype.readContentFromCache = function(id) {
    var self = this;
    return self.idCache[id];
};

Concat.prototype.readContentForRelativePath = function(id, dirName) {
    var self = this;
    var newPath = path.normalize(path.join(dirName, id));
    if (!/\.js$/.test(newPath)) {
        newPath += ".js";
    }
    if (!fs.existsSync(newPath)) {
        return;
    }
    var content = fs.readFileSync(newPath, "utf-8");
    var cmdParser = new CmdParser();
    var ast = cmdParser.getAst(content);
    if (!ast) {
        self.logger.error("Parse %s failed", newPath);
        return null;
    }
    if (ast.error === true) {
        self.logger.error("Parse %s failed: %s,%s", newPath, ast.line, ast.col);
        return null;
    }
    var metaAst = cmdParser.parseFirst(ast);
    if (!metaAst) {
        self.logger.warning("%s is not AMD format", newPath);
        return null;
    }
    self.idCache[metaAst.id] = content;
    return content;
};

Concat.prototype.readContentFromLocal = function(id) {
    var self = this;
    var file = null;
    _.some(self.options.paths, function(p) {
        var newFile = path.join(p, id);
        if (!/\.js$/.test(newFile)) {
            newFile += ".js";
        }
        if (fs.existsSync(newFile)) {
            file = newFile;
            return true;
        }
        return false;
    });
    if (!file) {
//        self.logger.warning("Can not find local file for: ", id);
        return null;
    }
    file = path.normalize(fs.realpathSync(file));
    var content = fs.readFileSync(file, "utf-8");
    var metaAst = null;
    if (self.options.useCache && self.astCache.hasOwnProperty(file) &&
        self.astCache[file].metaAst
        ) {
        metaAst = self.astCache[file].metaAst;
    }
    else {
        var cmdParser = new CmdParser();
        var ast = cmdParser.getAst(content);
        if (!ast) {
            self.logger.error("Parse %s failed", file);
            return null;
        }
        if (ast.error === true) {
            self.logger.error("Parse %s failed: %s,%s", file, ast.line, ast.col);
            return null;
        }
        metaAst = cmdParser.parseFirst(ast);
        if (metaAst && self.options.useCache) {
            self.astCache[file] = {
                ast: ast,
                metaAst: metaAst
            };
        }
    }

    if (!metaAst) {
        self.logger.warning("%s is not AMD format", file);
        return null;
    }

    self.idCache[metaAst.id] = content;
    return content;
};

module.exports = Concat;