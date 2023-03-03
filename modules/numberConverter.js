// 숫자 형식 변경 모듈

const numberConverter = (num) => {

    if (num < 1000) {
        return num
    }
    else if (num < 1000000) {
        return `${(num / 1000).toFixed(1)}K`
    }
    else {
        return `${(num / 1000000).toFixed(1)}M`
    }
}

module.exports = numberConverter