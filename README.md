Streaming Directly to S3 with ExpressJS
=======================================

This is a good quest. After an hour of Googling I found two solutions:

1. Use Express and create a middleware that oeverrides onPart method of node-formidable
http://stackoverflow.com/questions/11764585/stream-file-uploaded-with-express-js-through-gm-to-eliminate-double-write
https://groups.google.com/forum/?fromgroups=#!topic/express-js/BeXdMic6POE

2. Directly upload from browser to S3.
Since my most immediate requirement is to have the upload functionality working, 
it's much more convenient and cheaper to perform the upload right from the browser.

- Let's look 