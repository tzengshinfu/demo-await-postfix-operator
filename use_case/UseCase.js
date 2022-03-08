/**
 * Asynchronous calculator class
 */
class AsyncCalculator {
  constructor(initialValue) {
    this.calculationResult = initialValue;
  }

  /**
   * Do asynchronous addition
   * @param {number} addend
   * @returns this(for method chaining)
   */
  async plusAsync(addend) {
    await new Promise(function (resolve) {
      setTimeout(resolve, 0);
    });

    this.calculationResult += addend;

    return this;
  }

  /**
   * Do asynchronous subtraction
   * @param {number} subtrahend
   * @returns this(for method chaining)
   */
  async minusAsync(subtrahend) {
    await new Promise(function (resolve) {
      setTimeout(resolve, 0);
    });

    this.calculationResult -= subtrahend;

    return this;
  }

  /**
   * Do asynchronous multiplication
   * @param {number} multiplicand
   * @returns this(for method chaining)
   */
  async multiplyAsync(multiplicand) {
    await new Promise(function (resolve) {
      setTimeout(resolve, 0);
    });

    this.calculationResult *= multiplicand;

    return this;
  }

  /**
   * Do asynchronous division
   * @param {number} divisor
   * @returns this(for method chaining)
   */
  async divideAsync(divisor) {
    await new Promise(function (resolve) {
      setTimeout(resolve, 0);
    });

    this.calculationResult /= divisor;

    return this;
  }

  /**
   * Get asynchronous calculate result
   * @returns calculate result
   */
  async getCalculationResultAsync() {
    await new Promise(function (resolve) {
      setTimeout(resolve, 0);
    });

    return this.calculationResult;
  }

  *getSequenceNumbers(maxCount) {
    for (let currentCount = 1; currentCount <= maxCount; currentCount++) {
      yield currentCount;
    }
  }}


/**
 * Do asynchronous addition
 * @param {number} augend
 * @param {number} addend
 * @returns result
 */
async function plusAsync(augend, addend) {
  let result = 0;

  await new Promise(function (resolve) {
    setTimeout(resolve, 0);
  });

  result = augend + addend;

  return result;
}

/**
 * Do asynchronous subtraction
 * @param {number} minuend
 * @param {number} subtrahend
 * @returns result
 */
async function minusAsync(minuend, subtrahend) {
  let result = 0;

  await new Promise(function (resolve) {
    setTimeout(resolve, 0);
  });

  result = minuend - subtrahend;

  return result;
}

/**
 * Do asynchronous multiplication
 * @param {number} multiplier
 * @param {number} multiplicand
 * @returns result
 */
async function multiplyAsync(multiplier, multiplicand) {
  let result = 0;

  await new Promise(function (resolve) {
    setTimeout(resolve, 0);
  });

  result = multiplier * multiplicand;

  return result;
}

/**
 * Do asynchronous division
 * @param {number} dividend
 * @param {number} divisor
 * @returns result
 */
async function divideAsync(dividend, divisor) {
  let result = 0;

  await new Promise(function (resolve) {
    setTimeout(resolve, 0);
  });

  result = dividend / divisor;

  return result;
}

//#region asynchronous method call
let asyncCalculator = new AsyncCalculator(0);
await asyncCalculator.plusAsync(10);
await asyncCalculator.minusAsync(1);
await asyncCalculator.multiplyAsync(2);
await asyncCalculator.divideAsync(18);
//#endregion

//#region asynchronous method chaining
await (await (await (await asyncCalculator.plusAsync(10)).minusAsync(1)).multiplyAsync(2)).divideAsync(18);
//#endregion

//#region asynchronous nested method call
await divideAsync(await multiplyAsync(await minusAsync(await plusAsync(0, 10), 1), 2), 18);
//#endregion

//#region getting asynchronous calculate result
let calculationResult = await asyncCalculator.getCalculationResultAsync();

console.log(calculationResult);

let calculationResultTask = asyncCalculator.getCalculationResultAsync();

console.log(await calculationResultTask);

let calculationResultFromProperty = (await asyncCalculator.plusAsync(0)).calculationResult;

console.log(calculationResultFromProperty);
//#endregion

//#region dynamic import()
let variables = await import('./AsyncIterable.js');
//#endregion

//#region asynchronous iterating
for await (let number of variables.asyncIterable) {
  console.log(number);
}

for await (let number of asyncCalculator.getSequenceNumbers(10)) {
  console.log(number);
}
//#endregion