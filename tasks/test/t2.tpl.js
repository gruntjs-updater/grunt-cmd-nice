define("test/t2.tpl", [], function(require, exports, module) {
    module.exports = function(obj) {
        var __t, __p = '',
            __j = Array.prototype.join,
            print = function() {
                __p += __j.call(arguments, '');
            };
        with(obj || {}) {
            __p += 'hello: ' +
                ((__t = (name)) == null ? '' : __t) +
                '';
        }
        return __p;
    }
});