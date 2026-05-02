/**
 * Base Value Object.
 *
 * Value objects are compared structurally. Subclasses provide their own
 * immutable `props` bag; equality is delegated to a shallow JSON compare
 * which is sufficient for simple VOs used in this sandbox codebase.
 */
export abstract class ValueObject<TProps extends Record<string, unknown>> {
  protected constructor(protected readonly props: Readonly<TProps>) {}

  equals(other: ValueObject<TProps> | null | undefined): boolean {
    if (!other) return false;
    if (other === this) return true;
    return JSON.stringify(this.props) === JSON.stringify(other.props);
  }

  toJSON(): Readonly<TProps> {
    return this.props;
  }
}
