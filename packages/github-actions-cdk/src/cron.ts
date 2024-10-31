/**
 * CronOptions interface defines the structure for specifying cron fields.
 * Each field is optional and, if omitted, defaults to '*'.
 */
export interface CronOptions {
  readonly minute?: string;
  readonly hour?: string;
  readonly day?: string;
  readonly month?: string;
  readonly weekDay?: string;
}

/**
 * The Cron class provides a structure to define, validate, and manipulate cron expressions.
 * It includes pre-defined schedules and supports custom cron expressions.
 */
export class Cron {
  /**
   * A cron expression that triggers every hour, at the start of the hour.
   * Expression: `0 * * * *` - This will run at 00:00, 01:00, 02:00, etc.
   */
  public static readonly HOURLY: Cron = Cron.fromFields({ minute: "0" });

  /**
   * A cron expression that triggers every day, at midnight.
   * Expression: `0 0 * * *` - This will run every day at 00:00.
   */
  public static readonly DAILY: Cron = Cron.fromFields({ minute: "0", hour: "0" });

  /**
   * A cron expression that triggers every week, on Sunday at midnight.
   * Expression: `0 0 * * 0` - This will run every Sunday at 00:00.
   */
  public static readonly WEEKLY: Cron = Cron.fromFields({ minute: "0", hour: "0", weekDay: "0" });

  /**
   * A cron expression that triggers on the first day of every month at midnight.
   * Expression: `0 0 1 * *` - This will run on the first day of every month at 00:00.
   */
  public static readonly MONTHLY: Cron = Cron.fromFields({ minute: "0", hour: "0", day: "1" });

  /**
   * A cron expression that triggers once a year, on January 1st at midnight.
   * Expression: `0 0 1 1 *` - This will run on January 1st every year at 00:00.
   */
  public static readonly YEARLY: Cron = Cron.fromFields({
    minute: "0",
    hour: "0",
    day: "1",
    month: "1",
  });

  /**
   * Validates a POSIX cron expression string, checking adherence to constraints for each field.
   * @param expression A cron expression string to validate (5 fields).
   * @returns True if the cron expression is valid, otherwise false.
   */
  public static isValidExpression(expression: string): boolean {
    const fields = expression.split(" ");
    if (fields.length !== 5) {
      return false;
    }

    /**
     * Helper function to validate a range of names, ensuring start is before or equal to end.
     * @param start The starting name in the range.
     * @param end The ending name in the range.
     * @param names An array of allowed names (e.g., ["SUN", "MON"]).
     * @returns True if the range is valid; false otherwise.
     */
    const isValidNameRange = (start: string, end: string, names: string[]): boolean => {
      const startIndex = names.indexOf(start);
      const endIndex = names.indexOf(end);
      return startIndex !== -1 && endIndex !== -1 && startIndex <= endIndex;
    };

    /**
     * Validates individual cron field values based on numeric ranges or allowed names.
     * Supports '*', ',' for lists, '-' for ranges, and '/' for step values.
     * @param field The cron field to validate.
     * @param min The minimum numeric value allowed.
     * @param max The maximum numeric value allowed.
     * @param allowNames An optional list of allowed names for the field.
     * @returns True if the field is valid; false otherwise.
     */
    const checkField = (
      field: string,
      min: number,
      max: number,
      allowNames: string[] = [],
    ): boolean => {
      if (field === "*") return true;

      const regex = new RegExp(`^([0-9${allowNames.join("")},*/-]+)$`);
      if (!regex.test(field)) return false;

      const parts = field.split(",");
      for (const part of parts) {
        if (part.includes("/")) {
          const [range, step] = part.split("/");
          if (!range || Number.isNaN(Number(step))) return false;
        } else if (part.includes("-")) {
          const [start, end] = part.split("-");
          const isNamedRange = allowNames.includes(start) && allowNames.includes(end);
          const startNum = Number(start);
          const endNum = Number(end);

          // Check for named range validity
          if (isNamedRange && !isValidNameRange(start, end, allowNames)) {
            return false;
          }

          // Check for numeric range validity
          if (
            !isNamedRange &&
            (Number.isNaN(startNum) || Number.isNaN(endNum) || startNum < min || endNum > max)
          ) {
            return false;
          }
        } else {
          const partNum = Number(part);
          if (Number.isNaN(partNum) && !allowNames.includes(part)) return false;
          if (!Number.isNaN(partNum) && (partNum < min || partNum > max)) return false;
        }
      }
      return true;
    };

    const [minute, hour, day, month, weekDay] = fields;

    return (
      checkField(minute, 0, 59) &&
      checkField(hour, 0, 23) &&
      checkField(day, 1, 31) &&
      checkField(month, 1, 12, [
        "JAN",
        "FEB",
        "MAR",
        "APR",
        "MAY",
        "JUN",
        "JUL",
        "AUG",
        "SEP",
        "OCT",
        "NOV",
        "DEC",
      ]) &&
      checkField(weekDay, 0, 6, ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"])
    );
  }

  // Cron fields representing minute, hour, day, month, and weekday expressions
  public readonly minute: string;
  public readonly hour: string;
  public readonly day: string;
  public readonly month: string;
  public readonly weekDay: string;

  /**
   * Constructs a Cron instance with each field defaulting to '*' if not specified.
   * @param options CronOptions object for defining each cron field.
   */
  constructor(options: CronOptions = {}) {
    this.minute = options.minute ?? "*";
    this.hour = options.hour ?? "*";
    this.day = options.day ?? "*";
    this.month = options.month ?? "*";
    this.weekDay = options.weekDay ?? "*";
  }

  /**
   * Returns the cron expression as a single string in standard cron format.
   * @returns The cron expression string.
   */
  public toString(): string {
    return `${this.minute} ${this.hour} ${this.day} ${this.month} ${this.weekDay}`;
  }

  /**
   * Converts the cron expression to a JSON-compatible string.
   * @returns The cron expression in string format, suitable for JSON.
   */
  public toJSON(): string {
    return this.toString();
  }

  /**
   * Creates a Cron instance from provided cron options.
   * @param options CronOptions object for defining each cron field.
   * @returns A new Cron instance with the specified options.
   */
  public static fromFields(options: CronOptions): Cron {
    return new Cron(options);
  }

  /**
   * Parses a cron expression string into a Cron instance. Supports standard POSIX format and special strings like "@hourly".
   * @param expression A valid cron expression string (5 fields or predefined like "@hourly").
   * @throws Error if the expression does not have exactly 5 fields and is not a recognized special string.
   * @returns A new Cron instance.
   */
  public static fromExpression(expression: string): Cron {
    switch (expression.trim()) {
      case "@hourly":
        return Cron.HOURLY;
      case "@daily":
        return Cron.DAILY;
      case "@weekly":
        return Cron.WEEKLY;
      case "@monthly":
        return Cron.MONTHLY;
      case "@yearly":
        return Cron.YEARLY;
      default: {
        const fields = expression.split(" ");
        if (fields.length !== 5) {
          throw new Error(`Invalid cron expression: "${expression}"`);
        }

        const [minute, hour, day, month, weekDay] = fields;
        return new Cron({ minute, hour, day, month, weekDay });
      }
    }
  }
}
