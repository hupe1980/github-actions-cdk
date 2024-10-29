import { Cron, type CronOptions } from "../src";

describe("Cron Class", () => {
  describe("constructor", () => {
    it("should create a Cron instance with default values", () => {
      const cron = new Cron();
      expect(cron.minute).toBe("*");
      expect(cron.hour).toBe("*");
      expect(cron.day).toBe("*");
      expect(cron.month).toBe("*");
      expect(cron.weekDay).toBe("*");
      expect(cron.toString()).toBe("* * * * *");
    });

    it("should create a Cron instance with specified values", () => {
      const options: CronOptions = {
        minute: "0",
        hour: "12",
        day: "1",
        month: "JAN",
        weekDay: "MON",
      };
      const cron = new Cron(options);
      expect(cron.minute).toBe("0");
      expect(cron.hour).toBe("12");
      expect(cron.day).toBe("1");
      expect(cron.month).toBe("JAN");
      expect(cron.weekDay).toBe("MON");
      expect(cron.toString()).toBe("0 12 1 JAN MON");
    });

    it("should accept numeric and name values in month and weekDay", () => {
      const options: CronOptions = {
        minute: "0",
        hour: "12",
        day: "1",
        month: "2", // February
        weekDay: "5", // Friday
      };
      const cron = new Cron(options);
      expect(cron.toString()).toBe("0 12 1 2 5");
    });
  });

  describe("fromExpression", () => {
    it("should create a Cron instance from a valid expression", () => {
      const expression = "15 10 * FEB 1";
      const cron = Cron.fromExpression(expression);
      expect(cron.minute).toBe("15");
      expect(cron.hour).toBe("10");
      expect(cron.day).toBe("*");
      expect(cron.month).toBe("FEB");
      expect(cron.weekDay).toBe("1");
      expect(cron.toString()).toBe(expression);
    });

    it("should handle mixed numeric and named values in expression", () => {
      const expression = "0 12 1 APR 5";
      const cron = Cron.fromExpression(expression);
      expect(cron.month).toBe("APR");
      expect(cron.weekDay).toBe("5");
      expect(cron.toString()).toBe(expression);
    });

    // Test for invalid cron expressions
    test.each([
      ["* * * *", false], // Missing weekDay
      ["* * * * * *", false], // Extra field
    ])("throws an error for invalid cron expression: %s", (expression) => {
      expect(() => {
        Cron.fromExpression(expression);
      }).toThrow(`Invalid cron expression: "${expression}"`);
    });
  });
});

describe("isValidCronExpression", () => {
  // Valid cron expressions
  test.each([
    ["* * * * *", true], // Every minute
    ["0 0 * * *", true], // Every day at midnight
    ["*/5 * * * *", true], // Every 5 minutes
    ["0 12 * * 1-5", true], // Every weekday at noon
    ["0 0 1 * *", true], // Every first day of the month at midnight
    ["0 0 * * 5", true], // Every Friday at midnight
    ["0 0 * 1 *", true], // Every January at midnight
    ["0 0 * * 1,2,3", true], // Every Monday, Tuesday, and Wednesday at midnight
    ["*/15 0-23 * * *", true], // Every 15 minutes throughout the day
    ["0 0 * * 0", true], // Every Sunday at midnight
    ["0 0 1-5 * 1-5", true], // Every Monday to Friday at midnight on the 1st to 5th of the month
    ["0 0 * JAN,DEC *", true], // Every day in January and December at midnight
    ["0 0 * * SUN", true], // Every Sunday at midnight
    ["0 0 * * MON-FRI", true], // Every weekday at midnight
    ["0 0 1 * *", true], // Every first day of the month at midnight
    ["*/10 * * * *", true], // Every 10 minutes
    ["5 4 * * *", true], // Every day at 4:05 AM
    ["0 0 * * *", true], // Every day at midnight
    ["0 0 * 8 *", true], // Every day in August at midnight
  ])("returns %p for valid cron expression %s", (expression, expected) => {
    expect(Cron.isValidExpression(expression)).toBe(expected);
  });

  // Invalid cron expressions
  test.each([
    ["60 * * * *", false], // Invalid minute
    ["* 24 * * *", false], // Invalid hour
    ["* * 32 * *", false], // Invalid day of month
    ["* * * 13 *", false], // Invalid month
    ["* * * * 7", false], // Invalid weekday (should be 0-6)
    ["* * * * 1-8", false], // Invalid range in weekdays
    ["* * * * SUN,SAT,MON,TUE,WED,THU,FRI,8", false], // Invalid weekday list
    ["* * * * 1#5", false], // Invalid nth weekday
    ["0 0 1-32 * *", false], // Invalid day of month range
    ["0 0 32 * *", false], // Invalid day of month
    ["0 0 * * * *", false], // Too many fields (should be 5)
    ["0 0 * *", false], // Not enough fields (should be 5)
    ["*/3 * * * 7", false], // Valid but testing '7' which should be '0' for Sunday
    ["* * * * * *", false], // Too many fields (should be 5)
  ])("returns %p for invalid cron expression %s", (expression, expected) => {
    expect(Cron.isValidExpression(expression)).toBe(expected);
  });
});
