/**
 * When Gulp is closed, either on error, crash, or intentionally, do
 *     a quick cleanup.
 */
var cleanup = require("node-cleanup");
cleanup(function(exit_code, signal) {
	// Is alphabetize really needed for an internal file?
	var alphabetize = require("alphabetize-object-keys");

	// The purpose of this cleanup is to cleanup the internal settings
	// file. This code will run when the current Gulp instance is closed
	// for whatever reason. When the process ID matches that of the stored
	// PID then the file will get cleared. Non-matching PIDs will not
	// cause any cleanup, as they should not.

	// Termination signal explanation: [https://goo.gl/rJNKNZ]

	// Re-read the file to get the most current value.
	$internal = json.read($paths.config_internal);
	INT_PROCESS = get($internal.data, "process", "");
	INT_PID = get(INT_PROCESS, "pid", "");

	// If the process is closed and it matches the recorded PID it is
	// the original process so close it and clear the internal file.
	if (INT_PID && INT_PID === process.pid) {
		// Don't call cleanup handler again.
		cleanup.uninstall();

		// Note: Remove markdown previews to keep things clean but also due
		// to changed port numbers. Some previews might contain old instance
		// browser-sync port numbers. Resulting in an console error. Though
		// nothing major as the HTML file will still load this just prevents
		// this issue.
		del.sync([
			globall($paths.markdown_preview),
			bangify($paths.markdown_preview)
		]);

		// When closed due to an error give an error message & notification.
		if (exit_code) {
			var message = `Error caused instance ${chalk.green(
				process.pid
			)} to close.`;
			notify(message, true);
			print.gulp.error(message);
		} else {
			// Else simply show that the process was successfully stopped.
			print.gulp.success(
				`Gulp instance ${chalk.green(process.pid)} stopped.`
			);
		}

		// Clear stored internal process values.
		$internal.set("process", null);
		$internal.data = alphabetize($internal.data);
		$internal.writeSync(null, JINDENT);

		// Cleanup other variables.
		__branch_name = undefined;
		if (__bs && __bs.exit) {
			__bs.exit();
		}

		// Finally kill the process.
		process.kill(INT_PID, signal);

		return false;
	}
});

/**
 * Store current process information in internal config. file.
 *
 * • This will write current process information to an internal gulp
 *     configuration file. This is done to prevent multiple Gulp
 *     instances from being spawned. Only one can be made at a time.
 *
 * @internal - Used with the default task.
 */
gulp.task("init:save-pid", function(done) {
	// Set the process information.
	$internal.set("process.pid", process.pid);
	$internal.set("process.title", process.title);
	$internal.set("process.argv", process.argv);

	// Store and save changes to file.
	$internal.write(
		function() {
			done();
		},
		null,
		JINDENT
	);
});

/**
 * Watch for Git branch changes.
 *
 * • Branch name checks are done to check whether the branch was changed
 *     after the Gulp instance was made. When switching branches files
 *     and file structure might be different. This can cause problems
 *     like making performing unnecessary tasks calls. Therefore, after
 *     making a branch change simply restart Gulp. This is something that
 *     needs to be made seamless.
 *
 * @internal - Used with the default task.
 */
gulp.task("init:watch-git-branch", function(done) {
	var git = require("git-state");

	git.isGit($paths.dirname, function(exists) {
		// If no .git/ exists simply ignore and return done.
		if (!exists) {
			return done();
		}

		// Else it does exist so continue.
		git.check($paths.dirname, function(err, result) {
			if (err) {
				throw err;
			}

			// Record branch name.
			__branch_name = result.branch;

			// Create a Gulp watcher as .git/ exists.
			gulp.watch(
				[$paths.githead],
				{
					cwd: $paths.basedir,
					dot: true
				},
				function() {
					// Get the branch name.
					var brn_current = git.checkSync($paths.dirname).branch;

					// Print the branch name being watched.
					if (__branch_name) {
						print.gulp.info(
							"Gulp is monitoring branch:",
							chalk.magenta(__branch_name)
						);
					}

					// When the branch names do not match a switch was made.
					// Print some messages and exit the process.
					if (brn_current !== __branch_name) {
						// message + exit
						print.gulp.warn(
							"Gulp stopped due to a branch switch.",
							`(${__branch_name} => ${chalk.magenta(
								brn_current
							)})`
						);
						print.gulp.info(
							"Restart Gulp to monitor",
							chalk.magenta(brn_current),
							"branch."
						);

						process.exit();
					}
				}
			);

			done();
		});
	});
});

/**
 * Build app files.
 *
 * @internal - Used with the default task.
 */
gulp.task("init:build", function(done) {
	// Cache task.
	var task = this;

	// Get the gulp build tasks.
	var tasks = BUNDLE_GULP.tasks;

	// Add callback to the sequence.
	tasks.push(function() {
		notify("Build complete");
		done();
	});

	// Apply the tasks and callback to sequence and run the tasks.
	return sequence.apply(task, tasks);
});

/**
 * Variables are declared outside of tasks to be able to use them in
 *     multiple tasks. The variables are populated in the
 *     default:active-pid-check task and used in the default task.
 */
var __process_exists;
var __process_stopped;

/**
 * Check for an active Gulp process before making another.
 *
 * @internal - Used with the default task.
 */
gulp.task("default:active-pid-check", function(done) {
	// Run yargs.
	var __flags = yargs.argv;

	// When the --stop flag is provided the Gulp instance must be stopped.
	if (__flags.stop) {
		// Set the task variable to true.
		__process_stopped = true;

		if (INT_PID) {
			// Kill the Gulp instance.
			print.gulp.success(
				`Gulp instance ${chalk.green(INT_PID)} stopped.`
			);
			process.kill(INT_PID);
		} else {
			// No open process exists so simply print out a message.
			print.gulp.warn("No Gulp process exists.");
		}

		return done();
	}

	// If a PID is stored it means a Gulp instance has already started
	// or the file was not cleared properly. This task will help determine
	// which case of the two it is.

	var find = require("find-process");

	// If no stored PID simply continue. No stored PID means there is
	// no active running gulp instance so continue the task normally
	// to create the Gulp instance.
	if (!INT_PID) {
		return done();
	} else {
		// Else if a PID exists determine if its active and a Gulp process.

		// Get the process information using the stored PID.
		find("pid", INT_PID).then(
			function(processes) {
				// This module will return an array containing the found
				// process in objects. Because we are supplying it the
				// PID the array will only return 1 object if the process
				// exists.

				// Get the process.
				var p = processes[0];

				// If no process exists then the process with the stored PID
				// does not exist and so we can proceed to the next task to
				// create a new instance.
				if (!p) {
					return done();
				}

				// When a process does exist then the following have to match
				// to make sure the process is legit. In other words if they
				// match then the process exists. An existing process will
				// prevent making other processes.
				// To-Do: Make this check better in the future.
				if (p.cmd === INT_TITLE && p.name.toLowerCase() === "gulp") {
					// A process exists so store the process information
					// to access it in the following task.
					__process_exists = p;
				}

				return done();
			},
			function(err) {
				if (err) {
					throw err;
				}
			}
		);
	}
});

/**
 * Runs Gulp.
 *
 * • This is the default task that will build project files, watch files,
 *     run browser-sync, etc.
 * • Only one instance can be run at a time.
 *
 * -s, --stop [boolean]
 *     Flag indicating to stop Gulp.
 *
 * -p, --ports [string]
 *     The ports for browser-sync to use. Ports must be provided in the
 *     following format: "local-port:ui-port". Some valid examples are
 *     "3000:3001", "3000:", "3000", and  ":3001". Provided ports must
 *     obviously not be in use. When ports are provided empty ports are
 *     found and passed to browser-sync.
 *
 * $ gulp
 *     Run Gulp.
 *
 * $ gulp --stop
 *     If running, stops the active Gulp process.
 *
 * $ gulp --ports "3000:3001"
 *     Open BrowserSync server on port 3000 and UI on port 3001.
 *
 * @internal - Set as internal to hide from default help output.
 */
gulp.task("default", ["default:active-pid-check"], function(done) {
	// Check the default:active-pid-check variables before the actual
	// task code runs.

	// When the --stop flag is provided do not let the task run.
	if (__process_stopped) {
		return done();
	}

	// As only one Gulp instance is allowed return if a process exists.
	if (__process_exists) {
		print.gulp.warn(
			`Gulp process ${chalk.green(__process_exists.pid)}`,
			"is running. Stop it before starting a new one."
		);
		print.gulp.info(
			"Stop current instance by running: $ gulp settings --rebuild"
		);

		return done();
	}

	// Actual task starts here.

	var find_free_port = require("find-free-port");

	var __flags = yargs
		.option("ports", {
			alias: "p",
			type: "string"
		})
		.coerce("ports", function(opt) {
			// Remove all but non numbers and colons (:).
			opt = opt.replace(/[^\d:]/g, "");
			// Split ports by the colon.
			return opt.split(":");
		}).argv;

	// Get the values.
	var ports = __flags.p || __flags.ports;

	// Find free ports to open browser-sync on.
	new Promise(function(resolve, reject) {
		// Find two free ports in case ports are not provided via CLI.
		find_free_port(
			$configs.findfreeport.range.start,
			$configs.findfreeport.range.end,
			$configs.findfreeport.ip,
			$configs.findfreeport.count,
			function(err) {
				// Ports are in this order: p1:local, p2:UI.
				if (err) {
					reject(err);
				}

				// Reset the ports (local, UI) when ports are provided via
				// the CLI.
				if (ports) {
					// Reset the port values.
					for (var i = 1, l = arguments.length; i < l; i++) {
						// Get the argument and port.
						var argument = arguments[i];
						var port = ports[i - 1];

						// There must be a port to make the change.
						if (port) {
							arguments[i] = port * 1;
						}
					}
				}

				// Resolve the promise and return the ports.
				resolve([arguments[1], arguments[2]]);
			}
		);
	})
		.then(function(ports) {
			// Get the ports.
			var p1 = ports[0];
			var p2 = ports[1];

			// Store the ports.
			$internal.set("process", {
				ports: {
					local: p1,
					ui: p2
				}
			});

			// Save ports.
			$internal.write(
				function() {
					// Store ports on the browser-sync object itself.
					__bs.__ports = [p1, p2]; // [app, ui]

					// After getting the free ports run the build task.
					return sequence(
						"init:save-pid",
						"init:watch-git-branch",
						"init:build",
						function() {
							// Pretty files before working on them for
							// the first time.
							cmd.get(`${GULPCLI} pretty -q`, function(
								err,
								data
							) {
								if (err) {
									throw err;
								}

								// Highlight data string.
								print(cli_highlight(data));

								// Finally, watch files for changes.
								return sequence("watch", function() {
									done();
								});
							});
						}
					);
				},
				null,
				JINDENT
			);
		})
		.catch(function(err) {
			if (err) {
				throw err;
			}

			done();
		});
});
