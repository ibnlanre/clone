const { expect } = require("chai");
const clone = require("./index")

describe("#Cloning", function () {
  describe("#Primitives", function () {
    it("should return undefined", () => {
      expect(clone(undefined)).to.be.undefined;
    });

    it("should return a boolean", () => {
      expect(clone(true)).to.be.true;
    });

    it("should return a number", () => {
      expect(clone(0)).to.be.a("number");
    });

    it("should return string", () => {
      expect(clone("foo")).to.be.a("string");
    });

    it("should be of type BigInt", () => {
      expect(clone(BigInt(10)))
        .to.be.a("bigint")
        .that.equals(10n);
    });

    let foo = Symbol("foo");
    it("should be a unique symbol", () => {
      expect(clone(foo)).to.equal(foo);
    });

    it("should be null", () => {
      expect(clone(null)).to.be.null;
    });
  });

  describe("#Functions", function () {
    describe("#Promises", () => {
      let myFirstPromise = new Promise((resolve) =>
        setTimeout(() => resolve("Success!"), 250)
      ).then((message) => console.log("Yay! " + message));

      it("should return a success message", () => {
        let promise = clone(myFirstPromise);
        expect(promise).to.be.a("promise");
      });
    });

    describe("#Function Statements", function () {
      function unique(arr) {
        if (!Array.isArray(arr)) {
          throw new TypeError("array-unique expects an array.");
        }
        return arr.length;
      }
      unique.prototype.greet = () => "hello";

      it("should have similar prototypes", () => {
        expect(clone(unique).prototype)
          .to.have.property("greet")
          .that.is.a("function");
      });

      it("should be a callable function", () => {
        expect(clone(unique)([1, 2, 3])).to.equals(3);
      });

      it("should have the same body", () => {
        expect(clone(unique).toString()).to.equals(unique.toString());
      });
    });

    describe("#Function Expressions", function () {
      let test = function () {
        return 0;
      };

      it("should return a function", () => {
        expect(clone(test)).to.be.a("function");
      });

      it("should return same body", () => {
        expect(clone(test).toString()).to.equals(test.toString());
      });

      it("should not return the same input", () => {
        expect(clone(test)).to.not.equal(test);
      });
    });

    describe("#Constructor Functions", function () {
      var Person = function (name) {
        this.name = name;
        this.canTalk = true;
      };
      Person.prototype.greet = function () {
        if (this.canTalk) {
          console.log("Hi, I am " + this.name);
        }
      };

      it("should have similar prototypes", () => {
        expect(clone(Person).prototype).to.have.ownProperty("greet");
      });

      it("should not mistake prototype keys for own keys", () => {
        expect(clone(Person)).to.not.have.property("greet");
      });
    });

    describe("#Asynchronous Functions", function () {
      const h = async (a, b) => a + b;
      it("should be asynchronous", () => {
        expect(clone(h).toString()).to.equal(h.toString());
      });
    });

    describe("#Function Constructors", function () {
      it("should return a function", () => {
        expect(clone(new Function("a", "b", "return 'hello'"))).be.a(
          "function"
        );
      });
    });

    describe("#Generator Function", function () {
      it("should return a generator", () => {
        expect(
          clone(function* (b, c) {
            yield 0;
          }).constructor.name
        ).to.equals("GeneratorFunction");
      });
    });

    describe("#Arrow Function", function () {
      it("should return an arrow function", () => {
        expect(clone(() => {}).toString()).to.equal("() => {}");
      });
    });
  });

  describe("#Arrays", function () {
    let sequence = [1, 1, [2, 5], 3, 5];
    it("should be deep equals to input", () => {
      expect(clone(sequence)).to.eql(sequence);
    });
  });

  describe("#Dates", function () {
    it("should return a date", () => {
      expect(clone(new Date("1986-05-21T00:00:00.000Z"))).to.be.a("date");
    });

    it("should be equal to the same time given", () => {
      expect(
        clone(new Date("1986-05-21T00:00:00.000Z")).toISOString()
      ).to.equal("1986-05-21T00:00:00.000Z");
    });
  });
});
