/**
 * User: garcia.wul (garcia.wul@alibaba-inc.com)
 * Date: 2014/05/21
 * Time: 16:44
 * 转换Javascript脚本文件
 */

var fs = require('graceful-fs');
var path = require("path");
var util = require("util");

var _ = require("underscore");
var StringUtils = require("underscore.string");
var Log = require("log");

var Base = require("./base");
var CmdParser = require("../utils/cmd-parser");
var chalk = require('chalk');

/**
 * 构造函数
 * @param options 是一个对象，可以传递的参数有:
 * - idRule: 自定义id的规则函数
 * - alias: 别名
 * - aliasPaths: 路径的别名
 * - rootPath:
 * @constructor
 */
var Script = function(options) {
    var self = this;
    Base.call(self, options);
    // 2014-06-03 garcia.wul 为了提升性能，将已经读取过的文件保存到内存中
    self.dependenciesCache = {};
    self.astCache = {};
};
util.inherits(Script, Base);

Script.prototype.execute = function(inputFile) {
    var self = this;
    // Step 1: 读取输入文件的内容
    var start = new Date().getTime();
    var source = path.normalize(fs.realpathSync(inputFile.src));
    if (!fs.existsSync(source)) {
        self.logger.error("%s does not exist", source);
        return;
    }

    self.logger.debug("[Profile] Step 1: 读取输入文件的内容: " + (new Date().getTime() - start));
    var cmdParser = new CmdParser();
    var ast = null;
    if (self.options.useCache && _.has(self.astCache, source) && self.astCache[source].ast) {
        ast = self.astCache[source].ast;
    }
    else {
        var content = fs.readFileSync(source, "utf-8");
        // Step 2: 得到抽象语法树
        start = new Date().getTime();
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

    var metaAst = null;
    if (self.options.useCache && _.has(self.astCache, source) && self.astCache[source].metaAst) {
        metaAst = self.astCache[source].metaAst;
    }
    else {
        metaAst = cmdParser.parseFirst(ast);
        if (self.options.useCache && metaAst) {
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
    self.logger.debug("[Profile] Step 2: 得到抽象语法树: " + (new Date().getTime() - start));

    // Step 3: 得到依赖的模块
    start = new Date().getTime();
    var dependencies = metaAst.dependencies;

    // Step 4: 使用alias和aliasPaths来替换dependencies
    _.each(dependencies, function(dependency, index) {
        dependencies[index] = self.replaceByAlias(dependencies[index]);
        dependencies[index] = self.replaceByPaths(dependencies[index]);
    });
    self.logger.debug("[Profile] Step 4: 使用alias和aliasPaths来替换dependencies: " + (new Date().getTime() - start));

    // Step 5: 递归地查找依赖关系
    start = new Date().getTime();
    var newDependencies = [];
    _.each(dependencies, function(dependency) {
        dependency = self.getRealName(dependency, path.normalize(path.join(source, "..")));
        dependency = StringUtils.rstrip(dependency, {source: ".js"});
        newDependencies.push(dependency);
        newDependencies = _.union(newDependencies,
            self.findDependencies(dependency, path.normalize(path.join(source, "..")))
        );
    });
    self.logger.debug("[Profile] Step 5: 递归地查找依赖关系: " + (new Date().getTime() - start));

    // Step 6: 修改成CMD格式
    start = new Date().getTime();
    var modifyOptions = {
        id: function() {
            return StringUtils.rstrip(StringUtils.lstrip(
                StringUtils.lstrip(self.toUnixPath(source), {source: self.options.rootPath}),
                {source: "/"}
            ), {source: ".js"});
        },
        dependencies: newDependencies,
        require: function(name) {
            var newName = self.replaceByPaths(self.replaceByAlias(name));
            newName = self.getRealName(newName, path.normalize(path.join(source, "..")));
            newName = StringUtils.rstrip(newName, {source: ".js"});
            return newName;
        }
    };
    if (_.isFunction(self.options.idRule)) {
        modifyOptions.id = function(id) {
            return self.options.idRule.call(self, id, source);
        };
    }
    var modified = cmdParser.modify(ast, modifyOptions);
    self.logger.debug("[Profile] Step 6: 修改成CMD格式: " + (new Date().getTime() - start));

    // Step 7: 输出文件
    var code = modified.print_to_string();
    code = self.beautify(code, "js");
    self.dumpFile(inputFile.dest, code);
    return true;
};

/**
 * 是否是别名
 * @param name
 * @returns {*}
 */
Script.prototype.isAlias = function(name) {
    var self = this;
    return _.has(self.options.alias, name);
};

/**
 * 使用别名来替换依赖
 * @param name
 * @returns {*}
 */
Script.prototype.replaceByAlias = function(name) {
    var self = this;
    if (self.isAlias(name)) {
        return self.options.alias[name];
    }
    return name;
};

/**
 * 使用路径来替换依赖
 * @param name
 */
Script.prototype.replaceByPaths = function(name) {
    var self = this;
    var names = name.split("/");
    if (!names || names.length <= 1) {
        // 没有路径
        return name;
    }
    var newName = [];
    _.each(names.slice(0, names.length - 1), function(item) {
        if (_.has(self.options.aliasPaths, item) &&
            _.isString(self.options.aliasPaths[item])) {
            newName.push(self.options.aliasPaths[item]);
        }
        else {
            newName.push(item);
        }
    });
    newName.push(names[names.length - 1]);
    return newName.join("/");
};

/**
 * 递归的找到依赖的依赖
 * @param dependency
 * @param basePath
 */
Script.prototype.findDependencies = function(dependency, basePath) {
    var self = this;
    var dependencies = [];
    var realFilePath = path.normalize(path.join(basePath, dependency));
    if (!/\.js$/.test(realFilePath)) {
        realFilePath += ".js";
    }
    if (!fs.existsSync(realFilePath)) {
        realFilePath = null;
        _.some(self.options.paths, function(pathname) {
            var filename = path.join(pathname, dependency);
            if (!/\.js$/.test(filename)) {
                filename += '.js';
            }
            if (fs.existsSync(filename)) {
                realFilePath = filename;
                return true;
            }
            return false;
        });
    }
    if (!realFilePath) {
        return dependencies;
    }
    realFilePath = path.normalize(fs.realpathSync(realFilePath));
    // 2014-06-03 garcia.wul 增加从cache功能，以优化性能
    if (self.options.useCache && _.has(self.dependenciesCache, realFilePath)) {
        return self.dependenciesCache[realFilePath];
    }

    // Step 1: 读取输入文件的内容
    var ast = null;
    var metaAst = null;
    if (self.options.useCache && _.has(self.astCache, realFilePath) &&
        self.astCache[realFilePath].metaAst
        ) {
        metaAst = self.astCache[realFilePath].metaAst;
    }
    else {
        var content = fs.readFileSync(realFilePath, "utf-8");
        // Step 2: 得到抽象语法树
        var cmdParser = new CmdParser();
        ast = cmdParser.getAst(content);
        if (!ast) {
            self.logger.error("Parse %s failed", realFilePath);
            return dependencies;
        }
        if (ast.error === true) {
            self.logger.error("Parse %s failed: %s,%s", realFilePath, ast.line, ast.col);
            return dependencies;
        }
        metaAst = cmdParser.parseFirst(ast);
        if (self.options.useCache && metaAst && ast) {
            self.options.useCache = {
                ast: ast,
                metaAst: metaAst
            };
        }
    }
    if (!metaAst) {
        return dependencies;
    }

    // Step 3: 使用alias和aliasPaths来替换dependencies
    _.each(metaAst.dependencies, function(dependency, index) {
        metaAst.dependencies[index] = self.replaceByAlias(metaAst.dependencies[index]);
        metaAst.dependencies[index] = self.replaceByPaths(metaAst.dependencies[index]);
    });
    _.each(metaAst.dependencies, function(dependency) {
        dependency = StringUtils.rstrip(dependency, {source: ".js"});
        dependency = self.getRealName(dependency, basePath);
        if (!dependency) {
            return null;
        }
        dependencies.push(dependency);
        dependencies = _.union(dependencies,
            self.findDependencies(dependency, path.normalize(path.join(realFilePath, "..")))
        );
    });
    if (self.options.useCache) {
        self.dependenciesCache[realFilePath] = dependencies;
    }
    return dependencies;
};

Script.prototype.getRealName = function(dependency, base) {
    var self = this;
    if (dependency.indexOf("../") === 0 || dependency.indexOf("./") === 0) {
        var realName = path.normalize(path.join(base, dependency));
        if (!fs.existsSync(realName) && !/\.js$/.test(realName)) {
            realName += ".js";
        }
        if (!fs.existsSync(realName)) {
            return null;
        }
        if (_.isFunction(self.options.idRule)) {
            return self.options.idRule.call(self, id, realName);
        }
        else {
            return StringUtils.rstrip(StringUtils.lstrip(
                StringUtils.lstrip(self.toUnixPath(realName), {source: self.options.rootPath}),
                {source: "/"}
            ), {source: ".js"})
        }
    }
    else {
        return dependency;
    }
};

module.exports = Script;