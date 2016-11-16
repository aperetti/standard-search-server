var spawn = require('child_process').spawn;

getPdfText = (filePath) => { 
	spawn('pdftotext', [filePath, '-'])
}