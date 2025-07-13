const {
  OpenSearchServerlessClient,
  TagResourceCommand,
} = require('@aws-sdk/client-opensearchserverless');

exports.handler = async (event, context) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    const { collectionId, region, accountId, tag } = event.ResourceProperties;

    // Skip for Delete operation
    if (event.RequestType === 'Delete') {
      return await sendResponse(
        event,
        context,
        'SUCCESS',
        {},
        'ApplyTagsResource'
      );
    }

    // Create OpenSearch Serverless client
    const ossClient = new OpenSearchServerlessClient({ region });
    const collectionArn = `arn:aws:aoss:${region}:${accountId}:collection/${collectionId}`;

    console.log(
      `Applying tags to collection ${collectionId}: ${JSON.stringify(tag)}`
    );

    // Apply tags
    const command = new TagResourceCommand({
      resourceArn: collectionArn,
      tags: [tag],
    });

    const res = await ossClient.send(command);

    console.log(`response: ${JSON.stringify(res)}`);
    console.log(`Successfully applied tags to ${collectionArn}`);

    return await sendResponse(
      event,
      context,
      'SUCCESS',
      {},
      'ApplyTagsResource'
    );
  } catch (error) {
    console.error('Error:', error);
    return await sendResponse(
      event,
      context,
      'FAILED',
      {},
      'ApplyTagsResource'
    );
  }
};

// Function to send response to CloudFormation
async function sendResponse(event, context, status, data, physicalId) {
  const responseBody = JSON.stringify({
    Status: status,
    Reason: `See CloudWatch Log Stream: ${context.logStreamName}`,
    PhysicalResourceId: physicalId || context.logStreamName,
    StackId: event.StackId,
    RequestId: event.RequestId,
    LogicalResourceId: event.LogicalResourceId,
    Data: data,
  });

  return await new Promise((resolve, reject) => {
    const https = require('https');
    const url = require('url');
    const parsedUrl = url.parse(event.ResponseURL);

    const options = {
      hostname: parsedUrl.hostname,
      port: 443,
      path: parsedUrl.path,
      method: 'PUT',
      headers: {
        'Content-Type': '',
        'Content-Length': responseBody.length,
      },
    };

    const request = https.request(options, (response) => {
      console.log(`Status code: ${response.statusCode}`);
      resolve();
    });

    request.on('error', (error) => {
      console.log('send() error:', error);
      resolve(); // Still resolve to avoid CF waiting
    });

    request.write(responseBody);
    request.end();
  });
}
