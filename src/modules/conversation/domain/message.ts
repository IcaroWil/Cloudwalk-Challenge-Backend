export type Role = 'user' | 'agent';

export class Message {
  private constructor(
    public readonly role: Role,
    public readonly content: string,
    public readonly at: number,
  ) {}

  static create(role: Role, content: string, at: number = Date.now()) {
    return new Message(role, content, at);
  }
}
