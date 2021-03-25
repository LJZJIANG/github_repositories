/*
 * @Descripttion: 工具方法
 * @Author: ljz
 * @Date: 2021-03-23 11:02:09
 * @LastEditors: ljz
 * @LastEditTime: 2021-03-25 14:15:09
 */


/**
 * 判断输入的是不是number类型
 * @param {*} value 
 */
export const validatorNumber = (rule, value) => {
  let reg = /^[0-9]+.?[0-9]*$/; //判断字符串是否为数字
  if (value) {
    if (reg.test(value)) {
      return Promise.resolve()
    } else if (!reg.test(value)) {
      return Promise.reject('只能输入数字')
    }
  } else {
    return Promise.resolve()
  }
}

/**
 * 
 * @param {*} timeWei 
 * @param {*} issuesWei 
 * @param {*} forkWei 
 * @param {*} data 
 */
const getValue = (timeWei, issuesWei, forkWei, data) => {
  let result = [];
  data.forEach(item => {
    let timeValue = timeWei * ((new Date(item.updated_at).getTime() - new Date().getTime()) / (10 * 31 * 24 * 60 * 60 * 1000));
    result.push({
      repoName: item.name,
      value: timeValue + issuesWei * item.open_issues + forkWei * item.forks
    })
  })
  return result
}

/**
 * 格式化参数  处理未填情况
 * @param {*} timeWei 
 * @param {*} issuesWei 
 * @param {*} forkWei 
 */
const formatParams = (timeWei, issuesWei, forkWei) => {
  timeWei = timeWei ? parseFloat(timeWei) : 0;
  issuesWei = issuesWei ? parseFloat(issuesWei) : 0;
  forkWei = forkWei ? parseFloat(forkWei) : 0;
  return { t: timeWei, i: issuesWei, f: forkWei }

}

/**
 * 
 * @param {*} timeWei 
 * @param {*} issuesWei 
 * @param {*} forkWei 
 * @param {*} data 
 */

export const softmax = (timeWei, issuesWei, forkWei, data) => {
  let { t, i, f } = formatParams(timeWei, issuesWei, forkWei);
  let result = getValue(t, i, f, data) || []
  let totalExp = 0;
  result.forEach(item => {
    let repoExp = isNaN(parseFloat(Math.exp(item.value.toFixed(2)).toString().substr(0, 12))) ? 0 : parseFloat(Math.exp(item.value.toFixed(2)).toString().substr(0, 12));
    totalExp += repoExp;
    item.value = repoExp;
  })

  result.forEach(item => {
    item.value = (item.value / totalExp).toFixed(6);
  })

  console.log(result.sort((a, b) => b.value - a.value).slice(0, 5));
  // 返回top5
  return result.sort((a, b) => b.value - a.value).slice(0, 5)
}