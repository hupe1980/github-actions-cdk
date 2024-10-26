export interface CronOptions {
  /**
   * Specifies the minute(s) the cron job should run.
   * Use `*` for every minute or specify a specific minute (0-59).
   * Multiple values can be separated by commas, ranges with `-`, and intervals with `/`.
   *
   * @default "*" - Every minute
   */
  readonly minute?: string;

  /**
   * Specifies the hour(s) the cron job should run.
   * Use `*` for every hour or specify a specific hour (0-23).
   * Multiple values can be separated by commas, ranges with `-`, and intervals with `/`.
   *
   * @default "*" - Every hour
   */
  readonly hour?: string;

  /**
   * Specifies the day(s) of the month the cron job should run.
   * Use `*` for every day, or specify a day (1-31).
   * Supports `L` for the last day of the month and `W` for weekdays.
   * Multiple values can be separated by commas, ranges with `-`, and intervals with `/`.
   *
   * @default "*" - Every day of the month
   */
  readonly day?: string;

  /**
   * Specifies the month(s) the cron job should run.
   * Use `*` for every month or specify a month (1-12 or JAN-DEC).
   * Multiple values can be separated by commas, ranges with `-`, and intervals with `/`.
   *
   * @default "*" - Every month
   */
  readonly month?: string;

  /**
   * Specifies the day(s) of the week the cron job should run.
   * Use `*` for every day of the week, or specify a specific day (0-6 or SUN-SAT).
   * Supports `L` for the last instance and `#` for specifying nth occurrence of the day in the month.
   * Multiple values can be separated by commas, ranges with `-`, and intervals with `/`.
   *
   * @default "*" - Any day of the week
   */
  readonly weekDay?: string;
}

export class Cron {
  public readonly minute: string;
  public readonly hour: string;
  public readonly day: string;
  public readonly month: string;
  public readonly weekDay: string;
  public readonly expression: string;

  /**
   * Constructs a new Cron instance using the specified options.
   * Generates a cron expression string from the input fields and validates it.
   *
   * @param props - The schedule options for the cron job.
   * @throws Will throw an error if the generated cron expression is invalid.
   */
  constructor(props: CronOptions = {}) {
    this.minute = props.minute ?? "*";
    this.hour = props.hour ?? "*";
    this.day = props.day ?? "*";
    this.month = props.month ?? "*";
    this.weekDay = props.weekDay ?? "*";

    // Generate the cron expression from individual fields.
    this.expression = `${this.minute} ${this.hour} ${this.day} ${this.month} ${this.weekDay}`;

    // Validate the generated cron expression.
    if (!isValidCronExpression(this.expression)) {
      throw new Error(`Invalid cron expression: "${this.expression}"`);
    }
  }

  /**
   * Converts the Cron instance to a cron expression string.
   *
   * @returns The cron expression string in "minute hour day month weekDay" format.
   */
  public toString(): string {
    return this.expression;
  }

  /**
   * Converts the Cron instance to a JSON representation (string format).
   *
   * @returns The cron expression string.
   */
  public toJSON(): string {
    return this.toString();
  }

  /**
   * Creates a Cron instance from a single cron expression string.
   *
   * @param expression - The cron expression string.
   * @returns A new Cron instance based on the provided expression.
   * @throws Will throw an error if the expression is invalid.
   */
  public static fromExpression(expression: string): Cron {
    // Validate the expression before creating the instance.
    if (!isValidCronExpression(expression)) {
      throw new Error(`Invalid cron expression: "${expression}"`);
    }

    // Split the expression into its components.
    const [minute, hour, day, month, weekDay] = expression.split(" ");
    return new Cron({ minute, hour, day, month, weekDay });
  }
}

/**
 * Validates the format of a cron expression string by checking each field
 * (minute, hour, day, month, and weekday) for compliance with standard cron
 * syntax, including special characters like `*`, `,`, `-`, `/`, `L`, `W`, and `#`.
 *
 * @param expression - The cron expression string to validate.
 * @returns True if the expression is valid, otherwise false.
 */
export function isValidCronExpression(expression: string): boolean {
  /**
   * Minute field validation pattern.
   * Accepts values 0-59, `*`, commas for multiple values, ranges with `-`, and intervals with `/`.
   */
  const minutePattern = "(?:[0-5]?\\d|\\*|(?:[0-5]?\\d)(?:,[0-5]?\\d)*(?:-[0-5]?\\d)?)";

  /**
   * Hour field validation pattern.
   * Accepts values 0-23, `*`, commas for multiple values, ranges with `-`, and intervals with `/`.
   */
  const hourPattern =
    "(?:[01]?\\d|2[0-3]|\\*|(?:[01]?\\d|2[0-3])(?:,[01]?\\d|2[0-3])*(?:-[01]?\\d|2[0-3])?)";

  /**
   * Day of month field validation pattern.
   * Accepts values 1-31, `*`, commas for multiple values, ranges with `-`, intervals with `/`,
   * and special characters `L` for last day and `W` for weekday nearest to the specified day.
   */
  const dayPattern =
    "(?:[1-9]|[12]\\d|3[01]|\\*|L|W|(?:[1-9]|[12]\\d|3[01])(?:,[1-9]|[12]\\d|3[01])*(?:-[1-9]|[12]\\d|3[01])?)";

  /**
   * Month field validation pattern.
   * Accepts values 1-12, `*`, month names (JAN-DEC), commas for multiple values,
   * ranges with `-`, and intervals with `/`.
   */
  const monthPattern =
    "(?:1[0-2]|[1-9]|\\*|(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)(?:,(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC))*(?:-(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC))?)";

  /**
   * Day of week field validation pattern.
   * Accepts values 0-6, `*`, day names (SUN-SAT), commas for multiple values,
   * ranges with `-`, intervals with `/`, `L` for last day, and `#` for nth occurrence of the day in the month.
   */
  const weekDayPattern =
    "(?:[0-6]|SUN|MON|TUE|WED|THU|FRI|SAT|\\*|L|#|(?:[0-6]|SUN|MON|TUE|WED|THU|FRI|SAT)(?:,[0-6]|SUN|MON|TUE|WED|THU|FRI|SAT)*(?:-[0-6]|SUN|MON|TUE|WED|THU|FRI|SAT)?)";

  // Combine all patterns into a complete cron regex.
  const cronRegex = new RegExp(
    `^${minutePattern}\\s+${hourPattern}\\s+${dayPattern}\\s+${monthPattern}\\s+${weekDayPattern}$`,
  );

  // Test the expression against the cron regex.
  return cronRegex.test(expression);
}
