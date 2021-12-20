// global, for html page
var child_process = require('child_process');
pid_descendant = require("../pid-descendant.js");

module.exports = {

	"pid_descendant": function (done) {
		if (typeof window !== "undefined") throw "disable for browser";

		var proc = child_process.exec("ping -n 8 www.163.com", { shell: true });

		setTimeout(
			function () {
				//getPidDescendant = function (pid, cb)		//set pid=null to get system pid
				pid_descendant(proc.pid,
					function (err, data) {
						if (err) { console.log(err); return; }

						//define result-item as [ppid, pid, name, stat]
						//data is an array of result-item
						console.log(data);
						/*
						output text like this
							[ [ '3764', '6744', 'cmd.exe' ],
							[ '6744', '8444', 'PING.EXE' ] ]
						*/

						//a simple kill tool
						pid_descendant.kill(proc.pid);

						done(!(
							data.length == 2
						));
					});
			},
			1000
		);
	},

	"system": function (done) {
		if (typeof window !== "undefined") throw "disable for browser";

		pid_descendant(null,
			function (err, data) {
				if (err) { console.log(err); return; }

				console.log(data);

				done(false);
			}
		);
	},

	"name with spaces": function (done) {
		if (typeof window !== "undefined") throw "disable for browser";

		pid_descendant(	5808,	//pid for "mingw-w64-   install-  1.exe", to manually check result
			function (err, data) {
				if (err) { console.log(err); return; }

				console.log(data);
				/*
				[ [ '2388', '5808', 'mingw-w64-   install-  1.exe' ] ]
				*/

				done(false);
			}
		);
	},

};

// for html page
//if (typeof setHtmlPage === "function") setHtmlPage("title", "10em", 1);	//page setting
if (typeof showResult !== "function") showResult = function (text) { console.log(text); }

//for mocha
if (typeof describe === "function") describe('mocha-test', function () { for (var i in module.exports) { it(i, module.exports[i]).timeout(15000); } });
