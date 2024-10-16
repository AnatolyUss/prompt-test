<h1>Prompt-test</h1>

<h3>Deliverables</h3>
<b>prompt-test.png</b> - a diagram, explaining the implementation idea.</br>
<b>prompt-api</b> - containing the back-end API part.</br>
<b>prompt-browser-extension</b> - containing, well, a chrome extension. Unfortunately, incomplete.</br>

<h3>Large scale support</h3>
<p>
Generally, as per proposed diagram (once fully implemented), the solution suppose to be able to operate under "median+" load.
To increase the scale, I would suggest to:
</br>1. Run <b>prompt-api</b> as <b>k8s</b> service, auto-scaled as needed according to CPU/RAM/{possibly rps rate}. The desired ratio would be eventually discovered. 
</br>2. Substitute <b>SQS</b> (easy to maintain / use) with <b>Kafka</b>, which is way more feature-rich, and generally faster due to lower level protocol.
</br>3. Ensure the DB vendor choice is optimal (I lack an info regarding the actual DB schema, so cannot suggest much right now).
</br>4. Once the DB is chosen - ensure its host env / settings are optimal. Ensure the apps does not abuse the DB. 
</br>5. Cache data, if possible. For example, current project/schema is implemented the way it is, due to assumption that some prompts/docs inspections might be repetitive.
Hence, cache invalidation logic isn't hard to implement, and allows to decrease the load on both the AI service and the DB.
</br>6. Deploy <b>Prompt background</b> as <b>k8s</b> suspended jobs, triggered by <b>Keda</b> (allows scale to zero as well) and auto-scaled by number of available messages (Kafka/SQS).
</p>

<h3>List of limitations</h3>
Currently, the list is quite long.
</br>I would say, the more <b>Large scale support</b> suggestions are implemented - the fewer limitations the solution poses.

<h3>How to make the solution prod-ready</h3>
</br>1. Decide how/where to host it the solution.
</br>2. Once decided, prepare CI-CD pipelines.
</br>3. Integrate logging-monitoring-alerting as much as possible.
</br>4. Use some sort of feature-flags and kill-switches. It will help to stay on the safe side.
</br>5. DO NOT sacrifice test-coverage in favour of time - good test-coverage allows to grow way quicker and <b>way safer</b>.

<h3>How to run the API</h3>
</br>1. Download/clone the repo.
</br>2. `cd` `/to/prompt-test/prompt-api`
</br>3. Adjust env vars, if necessary, at `/prompt-test/prompt-api/.env.sample` file, then rename it to `.env`
</br>4. Create local env using Docker compose: `{ /usr/local/bin/ }docker compose -f { /path/to }/prompt-test/prompt-api/docker-compose.yml -p prompt-api up -d`
</br>5. Create SQS queues via CLI <b>only</b> (commands are commented in `docker-compose.yml`) in case you'd like to test functionality using any sort of client app, Swagger UI or Postman.
</br>6. Install dependencies `npm i`
</br>7. Build the project `npm run build`
</br>8. If you'd like to use Swagger UI, then run `npm start`, then navigate to `localhost:3000/api`
</br>9. Run tests `npm test`

<h3>How to run the extension</h3>
The extension, although deployable, lacks required functionality and permissions.</br>
I learnt a bit about extensions/permissions/chrome-APIs, but unfortunately had no time to implement required functionality.
Hence, there isn't much to tests for now.

<h3>Known issues</h3>
1.</br> 
Sometimes may encounter `/Error: write EPIPE` while running tests`</br>
2.</br>
<p><code>(node:67548) NOTE: The AWS SDK for JavaScript (v2) is in maintenance mode.
 SDK releases are limited to address critical bug fixes and security issues only.

Please migrate your code to use AWS SDK for JavaScript (v3).
For more information, check the blog post at https://a.co/cUPnyil
(Use `node --trace-warnings ...` to show where the warning was created)</code></p>

That is due to usage of AWS JS SDK V2 instead of V3.</br>
Unfortunately, I still face some incompatibility between `AWS JS SDK V3` and `LocalStack/SQS`.</br>
