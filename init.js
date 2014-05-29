/**
 * User: garcia.wul (garcia.wul@alibaba-inc.com)
 * Date: 2014/05/28
 * Time: 13:04
 *
 */

module.exports = {
    concat: require("./tasks/plugins/concat"),
    debug: require("./tasks/plugins/debug"),
    handlebarsTemplate: require("./tasks/plugins/handlebars-template"),
    json: require("./tasks/plugins/json"),
    lessStyle: require("./tasks/plugins/less-style"),
    sassStyle: require("./tasks/plugins/sass-style"),
    script: require("./tasks/plugins/script"),
    style: require("./tasks/plugins/style"),
    text: require("./tasks/plugins/text"),
    underscoreTemplate: require("./tasks/plugins/underscore-template")
};