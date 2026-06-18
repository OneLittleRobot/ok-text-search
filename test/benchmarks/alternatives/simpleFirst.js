module.exports = function (content) {
    return function (str) {
        for (const phrase of content) {
            const pos = str.indexOf(phrase);
            if (pos !== -1) return { index: pos, text: phrase };
        }
        return null;
    };
};
