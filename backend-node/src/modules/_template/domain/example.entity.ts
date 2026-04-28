/**
 * Example domain entity.
 *
 * Reference shape for new modules. Pure data + invariants. No I/O. No
 * framework imports. The entity is constructed via a factory that enforces
 * invariants up-front so invalid states cannot be instantiated.
 */
export interface ExampleProps {
  readonly id: string;
  readonly name: string;
  readonly createdAt: Date;
}

export class Example {
  private constructor(private readonly props: ExampleProps) {}

  static create(input: { id: string; name: string }): Example {
    if (!input.id) throw new Error('Example.id is required');
    const trimmed = input.name.trim();
    if (trimmed.length === 0) throw new Error('Example.name must not be empty');
    if (trimmed.length > 200) throw new Error('Example.name exceeds 200 chars');
    return new Example({ id: input.id, name: trimmed, createdAt: new Date() });
  }

  static restore(props: ExampleProps): Example {
    return new Example(props);
  }

  get id(): string {
    return this.props.id;
  }
  get name(): string {
    return this.props.name;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }

  toJSON(): ExampleProps {
    return { ...this.props };
  }
}
