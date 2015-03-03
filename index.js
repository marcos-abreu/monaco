/**
 * Monaco Framework
 *
 * @author Marcos Abreu (abreu.marcos@gmail.com)
 */

'use strict';

var Monaco = (function() {
  var Monaco;
  var isNode = typeof module !== "undefined" && module.exports && typeof require === "function";
  var isAMD = typeof define === "function" && typeof define.amd === "object" && define.amd;

  function loadDependencies(require, exports, module) {
    Monaco = module.exports = require('./lib/monaco-application');
    require('./lib/utils/monaco-cookies');
    require('./lib/utils/monaco-extend');
    require('./lib/utils/monaco-patches');
    require('./lib/monaco-router.js');
    require('./lib/monaco-views.js');
    require('./lib/monaco-local.js');
    require('./lib/monaco-analytics.js');
    require('./lib/monaco-experiments.js');
    require('./lib/monaco-transition.js');
  }

  if (isAMD) {
    define(loadDependencies);
  }
  else if (isNode) {
    loadDependencies(require, module.exports, module);
    Monaco = module.exports;
  } else {
    Monaco = {};
  }

  return Monaco;
}());
