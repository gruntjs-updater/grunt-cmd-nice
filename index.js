/**
 * User: garcia.wul (garcia.wul@alibaba-inc.com)
 * Date: 2014/05/28
 * Time: 13:04
 *
 */

module.exports = {
    Concat: require("./tasks/plugins/concat"),
    Debug: require("./tasks/plugins/debug"),
    JandlebarsTemplate: require("./tasks/plugins/handlebars-template"),
    Json: require("./tasks/plugins/json"),
    LessStyle: require("./tasks/plugins/less-style"),
    SassStyle: require("./tasks/plugins/sass-style"),
    Script: require("./tasks/plugins/script"),
    Style: require("./tasks/plugins/style"),
    Text: require("./tasks/plugins/text"),
    UnderscoreTemplate: require("./tasks/plugins/underscore-template")
};