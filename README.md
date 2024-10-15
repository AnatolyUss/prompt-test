<h1>Prompt-test</h1>

<h3>Known issues</h3>
1.</br> 
Sometimes may encounter /Error: write EPIPE` while running tests</br>
2.</br>
``(node:67548) NOTE: The AWS SDK for JavaScript (v2) is in maintenance mode.
 SDK releases are limited to address critical bug fixes and security issues only.

Please migrate your code to use AWS SDK for JavaScript (v3).
For more information, check the blog post at https://a.co/cUPnyil
(Use `node --trace-warnings ...` to show where the warning was created)``
 - That is due to usage of AWS JS SDK V2 instead of V3.</br>
Unfortunately, I still face some incompatibility between `AWS JS SDK V3` and `LocalStack/SQS`.</br>
