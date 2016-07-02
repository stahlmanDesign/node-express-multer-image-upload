var express = require('express');
var fs = require('fs');
var request = require('request');

var url = require('url'); // to parse URL and separate filename from path

var multer = require('multer'); // library to uplaod photos https://github.com/expressjs/multer

// storage used with Multer library to define where to save files on server, and how to save filename
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads')
    },
    filename: function (req, file, cb) {
        //console.log(file.mimetype)
        cb(null, file.originalname + '-' + Date.now() + '-' +  getExtension(file));
    }
});

function getExtension(file){
    // this function gets the filename extension by determining mimetype. To be exanded to support others, for example .jpeg or .tiff
    var res = '';
    if (file.mimetype === 'image/jpeg') res = '.jpg';
    if (file.mimetype === 'image/png') res = '.png';
    return res;
}

// initialize Multer with storage definition and other options like limit to file size that can be uploaded
var upload = multer({
    storage: storage,
    limits: { fileSize: 100000, files: 1 },
    onFileUploadStart: function (file) {
        console.log('Upload starting for filename: ' + file.originalname);
    },
    onFileUploadData: function (file, data) {
        console.log(data.length + ' of ' + file.fieldname + ' arrived')
    },
    onFileUploadComplete: function (file) {
      console.log(file.fieldname + ' uploaded to  ' + file.path)
    }
    //,fileFilter: // another possible option
});

var app = express()

app.use(express.static('./')); // serve all files in root folder, such as index.html

var cpUpload = upload.fields([  // fields to accept multiple types of uploads
  { name: "file", maxCount: 1 }, // in <input name='file' />
  { name: "imageUrl", maxCount: 1 } // in <input name='imageUrl' />
])

// for input type=file
app.post('/uploads', cpUpload, function (req, res, next) {
    //console.log(req.files); // the file 'name' from input type=file
    //console.log(req.body); // the text fields, if there were any

    //res.status(200).json({"success": { "status_code": 200, "message": "File successfully uploaded." }})
    //.end("<h1>uploads</h2><a href='/'>Go back</a>")

    res.end("<h1>Uploaded</h2><a href='/'>Go back</a>")

    // here we grab the text entered into the optional text field for a remote url image
    // @params (text string entered into input field, filename to save)



    // now process the input type=text with regular node/express
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
      download(urlParsed.href, onlyTheFilename + '-' + Date.now() + '-' + onlyTheFilename, function () {
          console.log('done');
      });
    }
})

app.listen(3000, function () {
    console.log("Working on port 3000");
});
