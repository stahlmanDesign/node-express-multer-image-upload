var express = require('express');
var fs = require('fs');
var request = require('request');
var url = require('url'); // to parse URL and separate filename from path

var app = express();

var multer = require('multer'); // library to uplaod photos https://github.com/expressjs/multer

// storage used with Multer library to define where to save files on server, and how to save filename
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads')
    },
    filename: function (req, file, cb) {
        //console.log(file.mimetype)
        cb(null, file.originalname + '-' + Date.now() + '-' + getExtension(file));
    }
});

function getExtension(file) {
    // this function gets the filename extension by determining mimetype. To be exanded to support others, for example .jpeg or .tiff
    var res = '';
    if (file.mimetype === 'image/jpeg') res = '.jpg';
    if (file.mimetype === 'image/png') res = '.png';
    return res;
}

app.use(express.static('./')); // serve all files in root folder, such as index.html

// initialize Multer with storage definition and other options like limit to file size that can be uploaded
var upload = multer({
    storage: storage,
    limits: { fileSize: 1048576, files: 1 } // limit file size to 1048576 bytes or 1 MB
    //,fileFilter: // TODO limit types of files. currently can upload a .txt or any kind of file into uploads folder
}).fields([ // fields to accept multiple types of uploads
    { name: "fileName", maxCount: 1 } // in <input name='file' />
]);

// for input type=file
app.post('/uploads', function (req, res, next) {
    upload(req, res, function (err) {
        if (err) {
            res.status(err.status || 500).json({ "error": { "status_code": err.status || 500, "message": err.code } });
            return;
        } else {

          // NOTE on what you can expect here
          // console.log(req.file); // if using upload.single('yourInputName')
          // console.log(req.files); // if using upload.fields([]); // array of input field names
          // console.log(req.body); // if using a text field instead of file input, ex. to grab url from another site by path name

            if (req.files.fileName) { // fileName comes from input element:   <input type="file" name="fileName">
                var reqJSON = JSON.stringify(req.files.fileName, null, 2); // pretty print the JSON for <pre> tag
                res.writeHead(200,{'Content-Type':'text/html'});
                res.write("<h1>Uploaded from file</h2><img style='max-width:20%' src='" + req.files.fileName[0].path + "'/><pre>" + reqJSON + "</pre><a href='/'>Go back</a>");
                res.end();
                //console.log("req.files.fileName")
                //console.log(req.files.fileName)
            }
            else if (req.body.imageUrl) {

              // the text field was used, so process the input type=text with regular node/express
                var download = function (uri, filename, callback) {
                    request.head(uri, function (err, res, body) {
                        console.log('content-type:', res.headers['content-type']);
                        console.log('content-length:', res.headers['content-length']);
                        request(uri).pipe(fs.createWriteStream('./uploads/' + filename)).on('close', callback);
                    });
                };

                // this is only available when submitting a text url, not by choosing file to upload
                var urlParsed = url.parse(req.body.imageUrl);
                if (urlParsed.pathname){
                  var onlyTheFilename = urlParsed.pathname ? urlParsed.pathname.substring(urlParsed.pathname.lastIndexOf('/') + 1).replace(/((\?|#).*)?$/, '') : '';
                  //console.log(urlParsed)
                  var newFilename = onlyTheFilename + '-' + Date.now() + '-' + onlyTheFilename
                  var wholePath = 'uploads/' + newFilename;
                  download(urlParsed.href, newFilename, function () {
                    var reqJSON = JSON.stringify(wholePath, null, 2); // pretty print
                    res.end("<h1>Uploaded from URL</h2><img style='max-width:50%' src='" + wholePath + "'/><pre>" + reqJSON + "</pre><a href='/'>Go back</a>")
                    console.log("wholePath")
                    console.log(wholePath)
                  });
                }
            }
        }
    });
});

app.listen(3000, function () {
    console.log("Working on port 3000");
});
