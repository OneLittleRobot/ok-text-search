module.exports = function (content) {
    return function (str) {
        const results = [];
        for (const phrase of content) {
            let pos = 0;
            while ((pos = str.indexOf(phrase, pos)) !== -1) {
                results.push({ index: pos, text: phrase });
                pos++;
            }
        }
        return results;
    };
};
