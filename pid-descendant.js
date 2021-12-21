
// pid-descendant @ npm, get pid descendant.

/*
comment text from ps-tree @ npm, thanks.

The `ps-tree` module behaves differently on *nix vs. Windows
by spawning different programs and parsing their output.

Linux:
1. " <defunct> " need to be striped
```bash
$ ps -A -o comm,ppid,pid,stat
COMMAND          PPID   PID STAT
bbsd             2899 16958 Ss
watch <defunct>  1914 16964 Z
ps              20688 16965 R+
```

Win32:
1. wmic PROCESS WHERE ParentProcessId=4604 GET Name,ParentProcessId,ProcessId,Status)
2. The order of head columns is fixed ----- !!!
```shell
> wmic PROCESS GET Name,ProcessId,ParentProcessId,Status
Name                          ParentProcessId  ProcessId   Status
System Idle Process           0                0
System                        0                4
smss.exe                      4                228
```
*/

var child_process = require('child_process');

var text_line_array = require('text-line-array');

//==============================
//define result-item as [ppid, pid, name, stat]

var COLUMN_COUNT = 4;

var INDEX_PPID = 0;
var INDEX_PID = 1;
var INDEX_NAME = 2;
var INDEX_STAT = 3;

//------------------------------

var isWindows = (process.platform.slice(0, 3) === 'win');

//getPidDescendant = function (pid, cb)		//set pid=null to get system pid
var getPidDescendant = function (pid, cb) {
	//arguments
	if (typeof (cb) !== "function") throw Error("getPidDescendant require callback function");
	if (!pid) { pid = isWindows ? 0 : 1; }

	pid = pid.toString();

	//exec ps
	var proc = isWindows
		//in windows, the Status is not implemented, and is always empty, refer to https://docs.microsoft.com/zh-cn/windows/win32/cimwin32prov/win32-process?redirectedfrom=MSDN
		? child_process.spawn('wmic.exe', ['PROCESS', 'GET', 'Name,ParentProcessId,ProcessId'])
		: child_process.spawn('ps', ['-A', '-o', 'ppid,pid,stat,comm']);

	//result variable
	var headLine = true;		//head line flag.
	var mapPpid = {};	//map ppid to result-item array
	var resultArray = [];		//array of result-item

	//line callback
	var lineCallback = function (lineText) {
		if (!proc || !lineText) return;	//stopped or empty line
		//console.log("[" + lineText + "]");

		var sa = lineText.trim().split(/(\s+)/);	//capture spaces, for name may contain continual spaces

		if (headLine) { headLine = false; return; }	//skip head line

		//parse item
		var item = isWindows
			? [
				sa[sa.length - 3],
				sa[sa.length - 1],
				sa.slice(0, -4).join("")
			]
			: [
				sa[0],
				sa[2],
				sa.slice(6).join(""),
				sa[4]
			];

		var ppid = item[INDEX_PPID];
		if (ppid != item[INDEX_PID]) {		//to avoid duplicated for "0, 0, System Idle Process"
			var ar = (ppid in mapPpid) ? mapPpid[ppid] : (mapPpid[ppid] = []);
			ar[ar.length] = item;	//append
		}

		if (item[INDEX_PID] == pid) resultArray.push(item);
	}

	//text line buffer
	var tla = text_line_array(lineCallback);
	tla.lineSplitter = /[\r\n]+/;		//for wmic.exe use '\r\r\n' to line break

	proc.stdout.on('data', (data) => { tla.add(data.toString()); });

	proc.stdout.on('close', (code) => {
		if (!proc) return;	//stopped

		tla.end();	//for last line
		//console.log(tla.lineArray);

		//collect result
		var i = resultArray.length - 1, ar;

		while (pid) {
			ar = mapPpid[pid];
			if (ar) Array.prototype.push.apply(resultArray, ar);

			i++;
			pid = resultArray[i] && resultArray[i][INDEX_PID];
		}
		cb(null, resultArray);
	});
};

//module

module.exports = exports = getPidDescendant;

exports.COLUMN_COUNT = COLUMN_COUNT;
exports.INDEX_PPID = INDEX_PPID;
exports.INDEX_PID = INDEX_PID;
exports.INDEX_NAME = INDEX_NAME;
exports.INDEX_STAT = INDEX_STAT;

//.kill = function (pid, signal) {
exports.kill = function (pid, signal) {
	getPidDescendant(pid, function (err, data) {
		if (err) { console.log(err); return; }

		for (var i = 0; i < data.length; i++) {
			process.kill(data[i][INDEX_PID], signal);
		}
	});
}
