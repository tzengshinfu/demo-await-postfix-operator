export const asyncIterable = {
    [Symbol.asyncIterator]() {
        return {
            currentCount: 1,
            next() {
                if (this.currentCount <= 3) {
                    return Promise.resolve({ value: this.currentCount++, done: false });
                }

                return Promise.resolve({ done: true });
            }
        };
    }
};
