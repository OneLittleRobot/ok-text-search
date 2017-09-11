module.exports = function (content) {
    return function (str) {
        // console.log('looking for ', content)
        // console.log('in ', str)

        return content.filter((phrase) => {
            return str.indexOf(phrase) !== -1;
        })
    };
}
