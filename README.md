# pid-descendant
get pid descendant

# Install
```
npm install pid-descendant
```

# Usage & Api
```javascript

var pid_descendant = require("pid-descendant");

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


```
