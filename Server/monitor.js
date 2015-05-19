/*
var respawn = require('respawn');
var monitor = respawn(['node', 'app.js'], {
	env: {ENV_VAR:'test'}, // set env vars
	cwd: '.',              // set cwd
	maxRestarts:5,        // how many restarts are allowed within 60s
						// or -1 for infinite restarts
	sleep:1000,            // time to sleep between restarts,
	kill:30000,            // wait 30s before force killing after stopping
	stdio: [...]           // forward stdio options
});

monitor.start() // spawn and watch
*/
var respawn = require('respawn');
var util = require('util');
//var logger = require('./source/utils/logger');

var proc = respawn(['node', 'app.js'], {
  cwd: '.',
  maxRestarts: 5,
  sleep: 1000,
  kill: 30000
});

proc.on('spawn', function () {
  util.print('application monitor started...');
});

proc.on('exit', function (code, signal) {
  util.print('process exited, code: ' + code + ' signal: ' + signal);
});

proc.on('stdout', function (data) {
  util.print(data.toString());
});

proc.on('stderr', function (data) {
  util.print('process error', data);
  proc.stop();
//  proc.start();
});

proc.start();
