/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./src/gitui79.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./src/gitui79.js":
/*!************************!*\
  !*** ./src/gitui79.js ***!
  \************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("/**\n * GitUi79\n */\nwindow.GitUi79 = function($elm, fncCallGit, options){\n\tvar _this = this;\n\toptions = options || {};\n\n\tvar gitparse79 = new window.GitParse79(fncCallGit);\n\n\tvar $elms = {};\n\n\tvar templates = {\n\t\t\"mineFrame\": '<div class=\"gitui79__toolbar\">'\n\t\t\t\t+ '<ul>'\n\t\t\t\t+ '<li><button class=\"px2-btn px2-btn--default gitui79__btn gitui79__btn--status\">status</button></li>'\n\t\t\t\t+ '<li><button class=\"px2-btn px2-btn--default gitui79__btn gitui79__btn--pull\">pull</button></li>'\n\t\t\t\t+ '<li><button class=\"px2-btn px2-btn--default gitui79__btn gitui79__btn--commit\">commit</button></li>'\n\t\t\t\t+ '<li><button class=\"px2-btn px2-btn--default gitui79__btn gitui79__btn--push\">push</button></li>'\n\t\t\t\t+ '</ul>'\n\t\t\t\t+ '</div>'\n\t\t\t\t+ '<div class=\"gitui79__body\"></div>'\n\t\t\t\t+ '<div class=\"gitui79__statusbar\"></div>'\n\t};\n\n\t/**\n\t * GitUi79 を初期化します。\n\t */\n\tthis.init = function( callback ){\n\t\tcallback = callback || function(){};\n\t\t$elm.classList.add(\"gitui79\");\n\t\t$elm.innerHTML = templates.mineFrame;\n\n\t\t// buttons\n\t\t$elm.getElementsByClassName('gitui79__btn--status')[0].addEventListener('click', function(e){\n\t\t\t_this.pageStatus();\n\t\t});\n\t\t$elm.getElementsByClassName('gitui79__btn--pull')[0].addEventListener('click', function(e){\n\t\t\t_this.pagePull();\n\t\t});\n\t\t$elm.getElementsByClassName('gitui79__btn--commit')[0].addEventListener('click', function(e){\n\t\t\t_this.pageCommit();\n\t\t});\n\t\t$elm.getElementsByClassName('gitui79__btn--push')[0].addEventListener('click', function(e){\n\t\t\t_this.pagePush();\n\t\t});\n\n\t\t// body\n\t\t$elms.body = $elm.getElementsByClassName('gitui79__body')[0];\n\n\t\t// initialize page\n\t\t_this.pageStatus();\n\n\t\tcallback();\n\t}\n\n\t/**\n\t * page: status\n\t */\n\tthis.pageStatus = function(){\n\t\t$elms.body.innerHTML = '';\n\t\tgitparse79.git(\n\t\t\t['status'],\n\t\t\tfunction(result){\n\t\t\t\tconsole.log(result);\n\t\t\t\t// alert('refresh');\n\t\t\t\tvar src = '';\n\t\t\t\tsrc += '<ul class=\"gitui79__list-status\">';\n\t\t\t\tfunction mksrc(ary, isStaged, status){\n\t\t\t\t\tvar src = '';\n\t\t\t\t\tary.forEach(function(row){\n\t\t\t\t\t\tsrc += '<li class=\"'+(isStaged ? 'gitui79__list-status-staged' : '')+' '+('gitui79__list-status-'+status)+'\">';\n\t\t\t\t\t\tsrc += row;\n\t\t\t\t\t\tsrc += '</li>';\n\t\t\t\t\t});\n\t\t\t\t\treturn src;\n\t\t\t\t}\n\t\t\t\tsrc += mksrc(result.notStaged.untracked, false, 'untracked');\n\t\t\t\tsrc += mksrc(result.notStaged.modified, false, 'modified');\n\t\t\t\tsrc += mksrc(result.notStaged.deleted, false, 'deleted');\n\t\t\t\tsrc += mksrc(result.staged.untracked, true, 'untracked');\n\t\t\t\tsrc += mksrc(result.staged.modified, true, 'modified');\n\t\t\t\tsrc += mksrc(result.staged.deleted, true, 'deleted');\n\t\t\t\tsrc += '</ul>';\n\t\t\t\t$elms.body.innerHTML = src;\n\t\t\t}\n\t\t);\n\t}\n\n\t/**\n\t * page: pull\n\t */\n\tthis.pagePull = function(){\n\t\t$elms.body.innerHTML = '';\n\t\tgitparse79.git(\n\t\t\t['pull'],\n\t\t\tfunction(result){\n\t\t\t\tconsole.log(result);\n\t\t\t\t// alert('refresh');\n\t\t\t\tvar src = '';\n\t\t\t\tsrc += '<pre><code>';\n\t\t\t\tsrc += '</code></pre>';\n\t\t\t\t$elms.body.innerHTML = src;\n\t\t\t\t$elms.body.getElementsByTagName('code')[0].innerHTML = result.stdout;\n\t\t\t}\n\t\t);\n\t}\n\n\t/**\n\t * page: commit\n\t */\n\tthis.pageCommit = function(){\n\t\t$elms.body.innerHTML = '';\n\t\tvar message = prompt('Commit message?');\n\t\tif(!message){\n\t\t\treturn;\n\t\t}\n\t\tgitparse79.git(\n\t\t\t['add', './'],\n\t\t\tfunction(result){\n\t\t\t\tconsole.log(result);\n\t\t\t\tgitparse79.git(\n\t\t\t\t\t['commit', '-m', message],\n\t\t\t\t\tfunction(result){\n\t\t\t\t\t\tconsole.log(result);\n\t\t\t\t\t\t// alert('refresh');\n\t\t\t\t\t\tvar src = '';\n\t\t\t\t\t\tsrc += '<pre><code>';\n\t\t\t\t\t\tsrc += '</code></pre>';\n\t\t\t\t\t\t$elms.body.innerHTML = src;\n\t\t\t\t\t\t$elms.body.getElementsByTagName('code')[0].innerHTML = result.stdout;\n\t\t\t\t\t}\n\t\t\t\t);\n\t\t\t}\n\t\t);\n\t}\n\n\t/**\n\t * page: push\n\t */\n\tthis.pagePush = function(){\n\t\t$elms.body.innerHTML = '';\n\t\tgitparse79.git(\n\t\t\t['push'],\n\t\t\tfunction(result){\n\t\t\t\tconsole.log(result);\n\t\t\t\t// alert('refresh');\n\t\t\t\tvar src = '';\n\t\t\t\tsrc += '<pre><code>';\n\t\t\t\tsrc += '</code></pre>';\n\t\t\t\t$elms.body.innerHTML = src;\n\t\t\t\t$elms.body.getElementsByTagName('code')[0].innerHTML = result.stdout;\n\t\t\t}\n\t\t);\n\t}\n}\n\n\n//# sourceURL=webpack:///./src/gitui79.js?");

/***/ })

/******/ });