export class ClientError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public details: { [_: string]: any } = {},
  ) {
    super(message);
  }
}
