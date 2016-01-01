var generators = require('yeoman-generator');
var async = require('async');
var mkdirp = require('mkdirp');

module.exports = generators.Base.extend({
	// The name `constructor` is important here
	constructor: function () {
		// Calling the super constructor is important so our generator is correctly set up
		generators.Base.apply(this, arguments);

		// Next, add your custom code
		this.manifest = null;
	},
	// Priority actions (all above will be pushed to the "default" group)
	// can be single methods or a group of methods priority: {}

	// 1 Your initialization methods (checking current project state, getting configs, etc)
	initializing: function () {
		this.config.save(); // creates .yo-rc.json as project-root indicator

		try {
			this.manifest = this.fs.readJSON(this.destinationPath('manifest.json'));
		} catch (e) {
			this.manifest = {meta: {}}; // manifest found but could not be parsed
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
			manifestMeta,
			manifestPermissions,
			doneManifest
		]);

		function manifestConfirmOverwriteOrEnd(callback) {
			// questions for meta-section
			if (self.manifest) {
				self.prompt(
					{
						type: 'confirm',
						name: 'continue',
						message: 'A manifest.json already exists, are you sure you want to continue?',
						default: false
					}
					, function (answers) {
						if (answers.continue === false) {
							callback("abort");
							self.abort = true;
							done();
						} else {
							callback(null);
						}

					});
			} else {
				callback(null);
			}
		}

		function manifestMeta(callback) {
			function currentMetaVal(prop) {
				if (self.manifest) return self.manifest.meta[prop];
				else return null;
			}

			var promptsMeta = [
				{
					type: "input",
					name: "name",
					message: "App name",
					default: function () {
						return currentMetaVal('name');
					},
					validate: function (input) {
						if (!input) {
							return "App name is mandatory";
						} else {
							return true;
						}
					}
				},
				{
					type: "input",
					name: "author",
					message: "Author",
					default: function () {
						return currentMetaVal('author');
					},
					validate: function (input) {
						if (!input) {
							return "Author is mandatory";
						} else {
							return true;
						}
					}
				},
				{
					type: "input",
					name: "version",
					message: "Version",
					default: function () {
						return currentMetaVal('version') || "0.1.0.0";
					}
				},
				{
					type: "input",
					name: "description",
					message: "Description [180 chars]",
					filter: function (input) {
						return input.substr(0, 179);
					},
					default: function () {
						return currentMetaVal('description');
					}
				},
				{
					type: "input",
					name: "dock_button_title",
					message: "Title for dock-button [18 chars]",
					default: function (answersTilNow) {
						var value = currentMetaVal('dock_button_title') || answersTilNow.name.substr(0, 17);
						return (value) ? value : null;
					},
					filter: function (input) {
						return input.substr(0, 17);
					}
				},
				{
					type: "input",
					name: "minimumOverwolfVersion",
					message: "Minimum Overwolf Version",
					default: function (answersTilNow) {
						var value = currentMetaVal('minimum-overwolf-version') || "0.91.145";
						return (value) ? value : null;
					},
				}
			];

			self.prompt(promptsMeta, function (answers) {
				self.answers.meta = answers;
				callback(null);
			});
		}

		function manifestPermissions(callback) {
			self.log('---------------------');
			self.prompt({
				type: 'confirm',
				name: 'continue',
				message: 'Set Permissions for your App?',
				default: false
			}, function (answers) {
				if (answers.continue === true) {
					self.prompt({
						type: "checkbox",
						name: "permissions",
						message: "Permissions you need (space to select)",
						choices: [
							// Access the webcam.
							{name: 'Camera'},
							// Access the microphone.
							{name: 'Microphone'},
							// Access the logging system APIs.
							{name: 'Logging'},
							// Run or get information about other extensions.
							{name: 'Extensions'},
							// Enable game streaming.
							{name: 'Streaming'},
							// Enable desktop streaming.
							{name: 'DesktopStreaming'},
							// Access profile information and perform actions such as login and modifications.
							{name: 'Profile'},
							// Access the clipboard.
							{name: 'Clipboard'},
							// Get hotkeys information for the current extension.
							{name: 'Hotkeys'},
							// Access the media library.
							{name: 'Media'},
							// Access current game information.
							{name: 'GameInfo'},
							// Allows controlling the game through the extension.
							{name: 'GameControl'},
							// Allows accessing files from the local file system.
							{name: 'FileSystem'}
						]
					}, function (answers) {
						self.answers.permissions = answers.permissions;
						callback(null);
					});
				} else {
					callback(null);
				}
			});
		}

		function doneManifest(callback) {
			done();
			callback(null);
		}
	},
	// 3 Saving configurations and configure the project (creating .editorconfig files and other metadata files)
	configuring: function () {
		if (this.abort) return;
		var self = this;
		this.log('configuring');

		var iconName = 'icon';
		var iconNameInactive = iconName + '_inactive.png';
		var iconNameHover = iconName + '_hover.png';
		var iconPath = "assets/img/";

		// http://developers.overwolf.com/documentation/overwolf/manifest-json
		this.manifest = { // TODO: export to a template-file // (created for API version 0.89)
			manifest_version: 1,
			type: 'WebApp', // currently (0.89) only thos type of extension available
			meta: {
				name: self.answers.meta.name,
				author: self.answers.meta.author,
				version: self.answers.meta.version,
				"minimum-overwolf-version": self.answers.meta.minimumOverwolfVersion,
				"access-name": "",
				description: self.answers.meta.description,
				dock_button_title: self.answers.meta.dock_button_title,
				icon: iconPath + iconNameHover,
				icon_gray: iconPath + iconNameInactive
				// @deprecated store_icon: "" // not needed anymore ( see store folder)
			},
			permissions: self.answers.permissions,
			dependencies: [], // TODO: how to use this?
			data: { // currently only "webApp settings" relevant (0.89)
				windows: {
					// TODO: create start-window from user input
				},
				start_window: "Start",
				externally_connectable: {
					matches: []
				},
				plugins: [],
				hotkeys: {},
				content_scripts: [], // TODO: how to make use of this?
				launch_events: [],
				//user_agent: 'default' // TODO: how to include this useful? // ignored for now
			}
		};

	},
	// 4 If the method name doesn't match a priority, it will be pushed to this group.
	default: function () {
		if (this.abort) return;
		this.log('default');
		var self = this;
	},
	// 5 Where you write the generator specific files (routes, controllers, etc)
	writing: function () {
		if (this.abort) return;
		this.log('writing');
		var self = this;

		mkdirp(self.destinationPath('assets/img/'), function (err) {
			// path was created unless there was error
			// TODO: copy template icon.png and icon_gray.png
			self.fs.copy(self.templatePath('icon_hover.png'), self.destinationPath(self.manifest.meta.icon));
			self.fs.copy(self.templatePath('icon_inactive.png'), self.destinationPath(self.manifest.meta.icon_gray));
		});

		// write the manifest.json
		this.fs.writeJSON(this.destinationPath('manifest.json'), this.manifest);


	},
	// 6 Where conflicts are handled (used internally)
	conflicts: function () {
		this.log('conflicts');
	},
	// 7 Where installation are run (npm, bower)
	install: function () {
		if (this.abort) return;
		this.log('install');
		var self = this;
	},
	// 8 Called last, cleanup, say good bye, etc
	end: function (done) {
		this.log('end generator: app');

		// create start window
		this.composeWith("overwolf:window", {
			args: ['Start']
		}, {
			local: require.resolve("./../window")
		});
	}
});