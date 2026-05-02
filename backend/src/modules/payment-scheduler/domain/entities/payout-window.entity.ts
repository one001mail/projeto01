/**
 * Payout Window entity — SANDBOX.
 */
export interface PayoutWindowProps {
  readonly id: string;
  readonly startsAt: Date;
  readonly endsAt: Date;
}

export class PayoutWindow {
  private constructor(private readonly props: PayoutWindowProps) {}

  static of(input: { id: string; startsAt: Date; endsAt: Date }): PayoutWindow {
    if (input.endsAt.getTime() <= input.startsAt.getTime()) {
      throw new Error('endsAt must be after startsAt');
    }
    return new PayoutWindow(input);
  }

  includes(at: Date): boolean {
    return (
      at.getTime() >= this.props.startsAt.getTime() && at.getTime() <= this.props.endsAt.getTime()
    );
  }

  get id(): string {
    return this.props.id;
  }
}
