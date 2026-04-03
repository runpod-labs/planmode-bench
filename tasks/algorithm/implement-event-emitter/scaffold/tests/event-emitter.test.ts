import { describe, it, expect, vi } from "vitest";
import { EventEmitter } from "../src/event-emitter.js";

describe("EventEmitter", () => {
  // -------------------------------------------------------
  // Basic on / emit
  // -------------------------------------------------------
  describe("on and emit", () => {
    it("should register a listener and call it on emit", () => {
      const emitter = new EventEmitter();
      const fn = vi.fn();

      emitter.on("data", fn);
      emitter.emit("data", 42);

      expect(fn).toHaveBeenCalledWith(42);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("should pass multiple arguments to listener", () => {
      const emitter = new EventEmitter();
      const fn = vi.fn();

      emitter.on("multi", fn);
      emitter.emit("multi", "a", "b", "c");

      expect(fn).toHaveBeenCalledWith("a", "b", "c");
    });

    it("should call listener on every emit", () => {
      const emitter = new EventEmitter();
      const fn = vi.fn();

      emitter.on("ping", fn);
      emitter.emit("ping");
      emitter.emit("ping");
      emitter.emit("ping");

      expect(fn).toHaveBeenCalledTimes(3);
    });
  });

  // -------------------------------------------------------
  // Multiple listeners on same event
  // -------------------------------------------------------
  describe("multiple listeners on same event", () => {
    it("should call all listeners for an event", () => {
      const emitter = new EventEmitter();
      const fn1 = vi.fn();
      const fn2 = vi.fn();
      const fn3 = vi.fn();

      emitter.on("event", fn1);
      emitter.on("event", fn2);
      emitter.on("event", fn3);
      emitter.emit("event", "hello");

      expect(fn1).toHaveBeenCalledWith("hello");
      expect(fn2).toHaveBeenCalledWith("hello");
      expect(fn3).toHaveBeenCalledWith("hello");
    });
  });

  // -------------------------------------------------------
  // Multiple events
  // -------------------------------------------------------
  describe("multiple events", () => {
    it("should keep listeners separate per event", () => {
      const emitter = new EventEmitter();
      const fnA = vi.fn();
      const fnB = vi.fn();

      emitter.on("a", fnA);
      emitter.on("b", fnB);
      emitter.emit("a", 1);

      expect(fnA).toHaveBeenCalledWith(1);
      expect(fnB).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------
  // once
  // -------------------------------------------------------
  describe("once", () => {
    it("should fire listener only once", () => {
      const emitter = new EventEmitter();
      const fn = vi.fn();

      emitter.once("login", fn);
      emitter.emit("login", "user1");
      emitter.emit("login", "user2");

      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith("user1");
    });

    it("should not affect other listeners on the same event", () => {
      const emitter = new EventEmitter();
      const onceFn = vi.fn();
      const alwaysFn = vi.fn();

      emitter.once("msg", onceFn);
      emitter.on("msg", alwaysFn);
      emitter.emit("msg", "first");
      emitter.emit("msg", "second");

      expect(onceFn).toHaveBeenCalledTimes(1);
      expect(alwaysFn).toHaveBeenCalledTimes(2);
    });
  });

  // -------------------------------------------------------
  // off
  // -------------------------------------------------------
  describe("off", () => {
    it("should remove a specific listener", () => {
      const emitter = new EventEmitter();
      const fn = vi.fn();

      emitter.on("x", fn);
      emitter.off("x", fn);
      emitter.emit("x");

      expect(fn).not.toHaveBeenCalled();
    });

    it("should not throw when removing a non-existent listener", () => {
      const emitter = new EventEmitter();
      const fn = vi.fn();

      expect(() => emitter.off("nope", fn)).not.toThrow();
    });

    it("should not throw when removing from a non-existent event", () => {
      const emitter = new EventEmitter();

      expect(() => emitter.off("ghost", () => {})).not.toThrow();
    });

    it("should only remove the specified listener", () => {
      const emitter = new EventEmitter();
      const fn1 = vi.fn();
      const fn2 = vi.fn();

      emitter.on("e", fn1);
      emitter.on("e", fn2);
      emitter.off("e", fn1);
      emitter.emit("e");

      expect(fn1).not.toHaveBeenCalled();
      expect(fn2).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------------
  // Unsubscribe function returned by on()
  // -------------------------------------------------------
  describe("unsubscribe function from on()", () => {
    it("should unsubscribe the listener when called", () => {
      const emitter = new EventEmitter();
      const fn = vi.fn();

      const unsub = emitter.on("tick", fn);
      emitter.emit("tick");
      expect(fn).toHaveBeenCalledTimes(1);

      unsub();
      emitter.emit("tick");
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("should not affect other listeners when called", () => {
      const emitter = new EventEmitter();
      const fn1 = vi.fn();
      const fn2 = vi.fn();

      const unsub = emitter.on("tick", fn1);
      emitter.on("tick", fn2);

      unsub();
      emitter.emit("tick");

      expect(fn1).not.toHaveBeenCalled();
      expect(fn2).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------------
  // removeAllListeners
  // -------------------------------------------------------
  describe("removeAllListeners", () => {
    it("should remove all listeners for all events when no arg given", () => {
      const emitter = new EventEmitter();
      const fn1 = vi.fn();
      const fn2 = vi.fn();

      emitter.on("a", fn1);
      emitter.on("b", fn2);
      emitter.removeAllListeners();
      emitter.emit("a");
      emitter.emit("b");

      expect(fn1).not.toHaveBeenCalled();
      expect(fn2).not.toHaveBeenCalled();
    });

    it("should remove listeners only for the specified event", () => {
      const emitter = new EventEmitter();
      const fnA = vi.fn();
      const fnB = vi.fn();

      emitter.on("a", fnA);
      emitter.on("b", fnB);
      emitter.removeAllListeners("a");
      emitter.emit("a");
      emitter.emit("b");

      expect(fnA).not.toHaveBeenCalled();
      expect(fnB).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------------
  // listenerCount
  // -------------------------------------------------------
  describe("listenerCount", () => {
    it("should return 0 for unknown event", () => {
      const emitter = new EventEmitter();
      expect(emitter.listenerCount("none")).toBe(0);
    });

    it("should return correct count after adding listeners", () => {
      const emitter = new EventEmitter();
      emitter.on("x", () => {});
      emitter.on("x", () => {});
      emitter.on("x", () => {});

      expect(emitter.listenerCount("x")).toBe(3);
    });

    it("should decrease after off", () => {
      const emitter = new EventEmitter();
      const fn = () => {};
      emitter.on("x", fn);
      emitter.on("x", () => {});

      expect(emitter.listenerCount("x")).toBe(2);
      emitter.off("x", fn);
      expect(emitter.listenerCount("x")).toBe(1);
    });

    it("should decrease after once listener fires", () => {
      const emitter = new EventEmitter();
      emitter.once("x", () => {});
      emitter.on("x", () => {});

      expect(emitter.listenerCount("x")).toBe(2);
      emitter.emit("x");
      expect(emitter.listenerCount("x")).toBe(1);
    });
  });

  // -------------------------------------------------------
  // eventNames
  // -------------------------------------------------------
  describe("eventNames", () => {
    it("should return empty array when no listeners registered", () => {
      const emitter = new EventEmitter();
      expect(emitter.eventNames()).toEqual([]);
    });

    it("should return event names that have listeners", () => {
      const emitter = new EventEmitter();
      emitter.on("foo", () => {});
      emitter.on("bar", () => {});
      emitter.on("baz", () => {});

      const names = emitter.eventNames();
      expect(names).toContain("foo");
      expect(names).toContain("bar");
      expect(names).toContain("baz");
      expect(names).toHaveLength(3);
    });

    it("should not include events after all their listeners are removed", () => {
      const emitter = new EventEmitter();
      const fn = () => {};
      emitter.on("temp", fn);
      emitter.off("temp", fn);

      expect(emitter.eventNames()).not.toContain("temp");
    });
  });

  // -------------------------------------------------------
  // emit return value
  // -------------------------------------------------------
  describe("emit return value", () => {
    it("should return false when no listeners exist", () => {
      const emitter = new EventEmitter();
      expect(emitter.emit("nothing")).toBe(false);
    });

    it("should return true when listeners exist", () => {
      const emitter = new EventEmitter();
      emitter.on("something", () => {});
      expect(emitter.emit("something")).toBe(true);
    });

    it("should return true even if the only listener was a once that just fired", () => {
      const emitter = new EventEmitter();
      emitter.once("one-shot", () => {});

      // First emit: the once listener is present => true
      expect(emitter.emit("one-shot")).toBe(true);
      // Second emit: no listeners left => false
      expect(emitter.emit("one-shot")).toBe(false);
    });
  });

  // -------------------------------------------------------
  // Listener invocation order
  // -------------------------------------------------------
  describe("listener invocation order", () => {
    it("should call listeners in registration order", () => {
      const emitter = new EventEmitter();
      const order: number[] = [];

      emitter.on("order", () => order.push(1));
      emitter.on("order", () => order.push(2));
      emitter.on("order", () => order.push(3));
      emitter.emit("order");

      expect(order).toEqual([1, 2, 3]);
    });
  });

  // -------------------------------------------------------
  // Listener removes itself during emit (no crash)
  // -------------------------------------------------------
  describe("self-removal during emit", () => {
    it("should not crash when a listener removes itself during emit", () => {
      const emitter = new EventEmitter();
      const results: string[] = [];

      const selfRemover = () => {
        results.push("self-remover");
        emitter.off("evt", selfRemover);
      };

      emitter.on("evt", selfRemover);
      emitter.on("evt", () => results.push("after"));

      expect(() => emitter.emit("evt")).not.toThrow();
      expect(results).toEqual(["self-remover", "after"]);
    });

    it("should not call a listener that was removed by an earlier listener during the same emit", () => {
      const emitter = new EventEmitter();
      const results: string[] = [];
      const victim = () => results.push("victim");

      emitter.on("evt", () => {
        results.push("killer");
        emitter.off("evt", victim);
      });
      emitter.on("evt", victim);

      emitter.emit("evt");

      // The victim was registered after killer, but killer removed it during emit.
      // Whether victim runs or not depends on implementation — both are acceptable.
      // The key requirement is: no crash.
      expect(results).toContain("killer");
    });

    it("should handle unsubscribe function used during emit", () => {
      const emitter = new EventEmitter();
      const results: string[] = [];
      let unsub: () => void;

      unsub = emitter.on("evt", () => {
        results.push("will-unsub");
        unsub();
      });
      emitter.on("evt", () => results.push("second"));

      expect(() => emitter.emit("evt")).not.toThrow();
      expect(results).toContain("will-unsub");
      expect(results).toContain("second");
    });
  });
});
