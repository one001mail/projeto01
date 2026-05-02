export class InvalidNamespaceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidNamespaceError';
  }
}
