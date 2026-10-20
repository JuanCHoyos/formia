export function createStorage() {
  const uploads = new sst.aws.Bucket("Uploads");

  return {
    uploads,
  };
}
