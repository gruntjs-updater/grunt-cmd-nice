/**
 * User: garcia.wul (garcia.wul@alibaba-inc.com)
 * Date: 2014/05/21
 * Time: 16:44
 * 转换Javascript脚本文件
 */

var fs = require("fs");
var path = require("path");
var util = require("util");

var _ = require("underscore");
var StringUtils = require("underscore.string");
var Log = require("log");

var Base = require("./base");
var CmdParser = require("../utils/cmd-parser");

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
};
util.inherits(Script, Base);

Script.prototype.execute = function(inputFile) {
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
    var ast = cmdParser.getAst(content);
    if (!ast) {
        self.logger.error("Parse %s failed", source);
        self.dumpFileBySource(inputFile);
        return;
    }

    var metaAst = cmdParser.parseFirst(ast);
    if (!metaAst) {
        self.logger.warning("%s is not AMD format", source);
        self.dumpFileBySource(inputFile);
        return;
    }

    // Step 3: 得到依赖的模块
    var dependencies = metaAst.dependencies;

    // Step 4: 使用alias和aliasPaths来替换dependencies
    _.each(dependencies, function(dependency, index) {
        dependencies[index] = self.replaceByAlias(dependencies[index]);
        dependencies[index] = self.replaceByPaths(dependencies[index]);
    });

    // Step 5: 递归地查找依赖关系
    var newDependencies = [];
    _.each(dependencies, function(dependency) {
        dependency = StringUtils.rstrip(dependency, {source: ".js"});
        newDependencies.push(dependency);
        newDependencies = _.union(newDependencies,
            self.findDependencies(dependency, path.normalize(path.join(source, "..")))
        );
    });

    // Step 6: 修改成CMD格式
    var modifyOptions = {
        id: function() {
            return StringUtils.rstrip(StringUtils.lstrip(
                StringUtils.lstrip(source, {source: self.options.rootPath}),
                {source: path.sep}
            ), ".js");
        },
        dependencies: newDependencies,
        require: function(name) {
            return self.replaceByPaths(self.replaceByAlias(name));
        }
    };
    if (_.isFunction(self.options.idRule)) {
        modifyOptions.id = function(id) {
            return self.options.idRule.call(self, id, source);
        };
    }
    var modified = cmdParser.modify(ast, modifyOptions);

    // Step 7: 输出文件
    var code = modified.print_to_string();
    code = self.beautify(code, "js");
    self.dumpFile(inputFile.dest, code);
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
    var names = name.split(path.sep);
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
    return newName.join(path.sep);
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
    // Step 1: 读取输入文件的内容
    var content = fs.readFileSync(realFilePath, "utf-8");
    // Step 2: 得到抽象语法树
    var cmdParser = new CmdParser();
    var ast = cmdParser.getAst(content);
    var metaAst = cmdParser.parseFirst(ast);
    // Step 3: 使用alias和aliasPaths来替换dependencies
    _.each(metaAst.dependencies, function(dependency, index) {
        metaAst.dependencies[index] = self.replaceByAlias(metaAst.dependencies[index]);
        metaAst.dependencies[index] = self.replaceByPaths(metaAst.dependencies[index]);
    });
    _.each(metaAst.dependencies, function(dependency) {
        dependency = StringUtils.rstrip(dependency, {source: ".js"});
        dependencies.push(dependency);
        dependencies = _.union(dependencies,
            self.findDependencies(dependency, path.normalize(path.join(realFilePath, "..")))
        );
    });
    return dependencies;
};

module.exports = Script;