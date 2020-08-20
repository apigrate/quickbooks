const {S3} = require('aws-sdk');
const s3 = new S3();

/**
 * Utility class to store JSON data in a secure AWS bucket.
 * Note, your AWS profile must be configured correctly in your environment
 * and have appropriate permissions to the AWS bucket in question.
 */
class AwsStorage{
  constructor(bucket, key){
    if(!bucket) throw new Error('bucket is required');
    if(!key) throw new Error('key is required');
    this.bucket = bucket;
    this.key = key;
  }

  /**
   * Gets the JSON data from an AWS bucket. 
   * @returns a json object containing the data.
   */
  async get(){
    try {
      let objectResult = await s3.getObject({
        Bucket: this.bucket,
        Key: this.key
      }).promise();
    
      let creds = JSON.parse(objectResult.Body);
      return creds;
    } catch(ex){
      if(ex.code === 'NoSuchKey'){
        return null;
      }
      console.error(ex);
      throw ex;
    }
  }

  /**
   * Stores JSON data in an AWS bucket.
   * @param {object} data an object containing data data to store.
   */
  async set(data){
    return await s3.putObject({
      Body: JSON.stringify(data),
      Bucket: this.bucket,
      Key: this.key,
      ServerSideEncryption: "AES256"
    }).promise();

  }

}

exports.AwsStorage = AwsStorage;