var generators = require('yeoman-generator');
var async = require('async');
var _ = require('lodash');

const
	PRESET_APP = 'app',
	PRESET_OVERLAY = 'overlay',
	PRESET_STREAM_ONLY = 'stream-only',
	PRESET_BROWSER = 'browser-window'
	;


var MyBase = generators.Base.extend({});


module.exports = MyBase.extend({
	// The name `constructor` is important here
	constructor: function () {
		// Calling the super constructor is important so our generator is correctly set up
		generators.Base.apply(this, arguments);

		// Next, add your custom code
		this.argument('windowName', {
			desc: 'The name used as Window-name within manifest.json and overwolf methods',
			required: true,
			optional: false,
			type: 'String'
			//, defaults: "Window"
		});
		// normalizing windowName
		this.windowName = _.startCase(this.windowName).replace(/\s/g, '');

		/** filenames */
		this.names = {
			html: this.windowName + '.html',
			js: _.camelCase(this.windowName) + '.js',
			css: _.camelCase(this.windowName) + '.css',
			jsShared: 'shared.js',
			cssShared: 'shared.css'
		};

		var base = 'windows/';
		/** paths with trailing slashes */
		this.paths = {
			base: base,
			window: base + _.camelCase(this.windowName) + '/'
		};

		/** filenames for template files*/
		this.tplNames = {
			html: 'window.html',
			js: 'window.js',
			css: 'window.css',
			jsShared: 'shared.js',
			cssShared: 'shared.css'
		}
	},
	// Priority actions (all above will be pushed to the "default" group)
	// can be single methods or a group of methods priority: {}

	// 1 Your initialization methods (checking current project state, getting configs, etc)
	initializing: function () {
		this.log('-------------- creating Window "' + this.windowName + '" --------------');
		this.config.save(); // creates .yo-rc.json as project-root indicator

		try {
			this.manifest = this.fs.readJSON(this.destinationPath('manifest.json'));
		} catch (e) {
			throw e;
		}
		if (!this.manifest) {
			this.log('No manifest.json found - run app-generator first or create manifest.json manually.');
			this.abort = true;
		}
	},
	// 2 Where you prompt users for options (where you'd call this.prompt())
	prompting: function () {
		if (this.abort) return;
		this.log('prompting');
		var self = this;
		this.answers = {};

		var done = this.async();
		async.series([
			manifestConfirmOverwriteOrEnd,
			manifestWindowProperty,
			doneWindow
		]);

		function manifestConfirmOverwriteOrEnd(callback) {
			// questions for meta-section
			if (self.manifest.data.windows[self.windowName]) {
				self.prompt(
					{
						type: 'confirm',
						name: 'continue',
						message: 'A window named "' + self.windowName + '" already exists in manifest.json. Are you sure you want to continue?',
						default: false
					}
					, function (answers) {
						if (answers.continue === false) {
							self.abort = true;
							callback("cancel");
							done();
						} else {
							callback(null);
						}
					});
			} else {
				callback(null);
			}
		}

		function manifestWindowProperty(callback) {

			var promptsWindow = [
				{
					type: "checkbox", name: "options",
					message: "select options:",
					choices: [
						{name: 'resizable', checked: true},
						{name: 'desktop_only'},
						{name: 'disable_restore_animation', checked: true},
						{name: 'grab_keyboard_focus'}
					]
				},
				{
					type: "input", name: "top",
					message: "Startposition from top in pixel (leave empty to skip)"
				},
				{
					type: "input", name: "left",
					message: "Startposition from left in pixel (leave empty to skip)"
				},
				{
					type: "input", name: "width",
					message: "Width in pixel (leave empty to skip)"
				},
				{
					type: "input", name: "minWidth",
					message: "min width in pixel (leave empty to skip)",
					when: function (answersTilNow) {
						return answersTilNow.resizable && parseInt(answersTilNow.width) > 0;
					}
				},
				{
					type: "input", name: "maxWidth",
					message: "max width in pixel (leave empty to skip)",
					when: function (answersTilNow) {
						return answersTilNow.resizable && parseInt(answersTilNow.width) > 0;
					}
				},
				{
					type: "input", name: "height",
					message: "Height in pixel (leave empty to skip)"
				},
				{
					type: "input", name: "minHeight",
					message: "min height in pixel (leave empty to skip)",
					when: function (answersTilNow) {
						return answersTilNow.resizable && parseInt(answersTilNow.height) > 0;
					}
				},
				{
					type: "input", name: "maxHeight",
					message: "max height in pixel (leave empty to skip)",
					when: function (answersTilNow) {
						return answersTilNow.resizable && parseInt(answersTilNow.height) > 0;
					}
				},
				{
					type: "list", name: "preset",
					message: "Select a window-preset",
					choices: [PRESET_APP, PRESET_OVERLAY, PRESET_STREAM_ONLY, PRESET_BROWSER]
				}
			];

			self.prompt(promptsWindow, function (answers) {
				self.answers = answers;
				callback(null);
			});
		}

		function doneWindow(callback) {
			done();
			callback(null);
		}
	},
	// 3 Saving configurations and configure the project (creating .editorconfig files and other metadata files)
	configuring: function () {
		if (this.abort) return;
		this.log('configuring');
		var self = this;

		this.manifest.data.windows[self.windowName] = { // http://developers.overwolf.com/documentation/overwolf/manifest-json/#ExtensionWindowData
			file: self.paths.window + self.names.html,
			show_in_taskbar: (function () { return self.answers.preset === PRESET_BROWSER || self.answers.preset === PRESET_APP; })(),
			transparent: (function () { return self.answers.preset !== PRESET_BROWSER; })(),
			resizable: (function () { return self.answers.options.indexOf('resizable') >= 0 })(),
			show_minimize: (function () { return !self.answers.transparent;})(), // if Window not set transparent, show minimize-button for starters
			clickthrough: (function () { return self.answers.preset === PRESET_OVERLAY;})(),
			//forcecapture	bool	0.78 // TODO: what does this do?
			show_only_on_stream: (function () { return self.answers.preset === PRESET_STREAM_ONLY; })(),
			ignore_keyboard_events: (function () { return self.answers.preset === PRESET_OVERLAY || self.answers.preset === PRESET_STREAM_ONLY; })(),
			in_game_only: (function () { return self.answers.preset === PRESET_OVERLAY; })(),
			desktop_only: (function () { return self.answers.options.indexOf('desktop_only') >= 0 })(),
			disable_restore_animation: (function () { return self.answers.options.indexOf('disable_restore_animation') >= 0 })(),
			grab_keyboard_focus: (function () { return self.answers.options.indexOf('grab_keyboard_focus') >= 0 })(),
			size: (function () {
				var size = {};
				if (self.answers.width) size.width = parseInt(self.answers.width);
				if (self.answers.height) size.height = parseInt(self.answers.height);
				return size;
			})(),
			min_size: (function () {
				var size = {};
				if (self.answers.minWidth) size.width = parseInt(self.answers.minWidth);
				if (self.answers.minHeight) size.height = parseInt(self.answers.minHeight);
				return size;
			})(),
			max_size: (function () {
				var size = {};
				if (self.answers.maxWidth) size.width = parseInt(self.answers.maxWidth);
				if (self.answers.maxHeight) size.height = parseInt(self.answers.maxHeight);
				return size;
			})(),
			start_position: (function () {
				var pos = {};
				if (self.answers.left) pos.left = parseInt(self.answers.left);
				if (self.answers.top) pos.top = parseInt(self.answers.top);
				return pos;
			})(),
			topmost: (function () { return self.answers.preset === PRESET_OVERLAY})()
		}

	},
	// 4 If the method name doesn't match a priority, it will be pushed to this group.
	default: function () {
		if (this.abort) return;
		this.log('default');
	},
	// 5 Where you write the generator specific files (routes, controllers, etc)
	writing: function () {
		if (this.abort) return;
		this.log('writing');
		var self = this;

		copyTpl('html', self.paths.window, {
			title: self.windowName,
			scriptPath: self.names.js,
			cssPath: self.names.css,
			scriptSharedPath: '../' + self.names.jsShared,
			cssSharedPath: '../' + self.names.cssShared
		});

		copyTpl('css', self.paths.window, {});
		copyTpl('js', self.paths.window, {});

		copyTplUnlessExists('cssShared', self.paths.base, {});
		copyTplUnlessExists('jsShared', self.paths.base, {});

		// write the manifest.json
		this.fs.writeJSON(this.destinationPath('manifest.json'), this.manifest);

		/** Copy a template from default templates directory to destinationPath
		 * @param {string} type fileType to copy
		 * @param {object} options */
		function copyTpl(type, dir, options) {
			self.fs.copyTpl(
				self.templatePath(self.tplNames[type]),
				self.destinationPath(dir + self.names[type]),
				options
			);
		}

		function copyTplUnlessExists(type, dir, options) {
			if ( ! self.fs.exists( self.destinationPath( dir + self.names[type] ) ) ) {
				copyTpl(type, dir, options);
			}
		}
	},
	// 6 Where conflicts are handled (used internally)
	conflicts: function () {
		this.log('conflicts');
	},
	// 7 Where installation are run (npm, bower)
	install: function () {
		if (this.abort) return;
		this.log('install');
	},
	// 8 Called last, cleanup, say good bye, etc
	end: function () {
		this.log('end');
	}
});