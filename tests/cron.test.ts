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
      expect(cron.expression).toBe("* * * * *");
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
      expect(cron.expression).toBe("0 12 1 JAN MON");
    });

    it("should throw an error for invalid cron expression", () => {
      const options: CronOptions = {
        minute: "60", // Invalid minute
        hour: "12",
        day: "1",
        month: "JAN",
        weekDay: "MON",
      };
      expect(() => new Cron(options)).toThrow('Invalid cron expression: "60 12 1 JAN MON"');
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
      expect(cron.expression).toBe("0 12 1 2 5");
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
      expect(cron.expression).toBe(expression);
    });

    it("should throw an error for invalid cron expression in fromExpression", () => {
      const expression = "60 10 * * 1"; // Invalid minute
      expect(() => Cron.fromExpression(expression)).toThrow(
        `Invalid cron expression: "${expression}"`,
      );
    });

    it("should handle mixed numeric and named values in expression", () => {
      const expression = "0 12 1 APR 5";
      const cron = Cron.fromExpression(expression);
      expect(cron.month).toBe("APR");
      expect(cron.weekDay).toBe("5");
      expect(cron.expression).toBe(expression);
    });
  });
});
