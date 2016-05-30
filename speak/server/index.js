'use strict';

var watson = require('watson-developer-cloud');
var fs = require('fs-extra');

var speech_to_text = watson.speech_to_text({
    username: 'ceef8700-b4f7-4e9d-9b45-7ba7efe5f658',
    password: 'J0hM2Y0MAhfU',
    version: 'v1',
    url: 'https://stream.watsonplatform.net/speech-to-text/api'
});

var params = {
    content_type: 'audio/wav'
};

// create the stream
var recognizeStream = speech_to_text.createRecognizeStream(params);

// pipe in some audio
//fs.createReadStream(__dirname + '/resources/61d3bc24-ca61-af70-39cd-145a6a9302c3-0.wav').pipe(recognizeStream);

// and pipe out the transcription
//recognizeStream.pipe(fs.createWriteStream('transcription.txt'));


// listen for 'data' events for just the final text
// listen for 'results' events to get the raw JSON with interim results, timings, etc.

recognizeStream.setEncoding('utf8'); // to get strings instead of Buffers from `data` events

['data', 'results', 'error', 'connection-close'].forEach(function(eventName) {
    recognizeStream.on(eventName, console.log.bind(console, eventName + ' event: '));
});

var express = require('express');
var fileUpload = require('express-fileupload');
var app = express();

// default options
app.use(fileUpload());

app.post('/upload', function(req, res) {

    console.log('received something over here!')

    if (!req.files) {
        res.send('No files were uploaded.');
        return;
    }
    console.log(req.files);
    var file = req.files.fileUpload;
    //  console.log(file.mv.toString());
    var uploadPath = __dirname + '/uploads/' + file.name;
    console.log(uploadPath);
    file.mv(uploadPath, function(err) {
        if (err) {
            console.log(err)
            res.status(500).send(err);
        } else {
            res.send('File uploaded!');
            // pipe in some audio
            fs.createReadStream(uploadPath).pipe(recognizeStream);

            // and pipe out the transcription
            recognizeStream.pipe(fs.createWriteStream('transcription.txt'));
        }
    });
    /*
      if (!req.files) {
        res.send('No files were uploaded.');
        return;
      }
      console.log(req.files);
      var file = req.files.files;
    //  console.log(file.mv.toString());
      var uploadPath = __dirname + '/uploads/' + file.name;
      console.log(uploadPath);
      file.mv(uploadPath, function(err) {
        if (err) {
          console.log(err)
          res.status(500).send(err);
        }
        else {
          res.send('File uploaded!');
          // pipe in some audio
          fs.createReadStream(uploadPath).pipe(recognizeStream);
          recognizeStream = speech_to_text.createRecognizeStream(params);
          // and pipe out the transcription
        //  recognizeStream.pipe(fs.createWriteStream('transcription.txt'));
        }
      });
    */
});
app.listen(3000);
