const { request } = require('../utils')
const { ONE } = require('../config/index')
const cheerio = require('cheerio')


async function getOne() { // 获取每日一句
  let res = await request(ONE, 'GET')
  let $ = cheerio.load(res.text)
  let todayOneList = $('#carousel-one .carousel-inner .item')
  let todayOne = $(todayOneList[0]).find('.fp-one-cita').text().replace(/(^\s*)|(\s*$)/g, '')
  return todayOne;
}



async function getWeather(str) {
  const city = str.split(/市|区|县/)[0];
  const url = `https://www.tianqiapi.com/api/?city=${encodeURI(city)}`;
  let { body } = await request(url, 'GET');
  if (RegExp(body.city).test(str)) {
    const { day, week, wea, tem, tem1, tem2, win_speed, index } = body.data[0];
    const clothes = index.find(item => /穿衣/.test(item.title));

    return `${day}${week} ${str}<br/>气候：${wea}<br/>当前温度：${tem}<br/>最高温度：${tem1}<br/>最低温度：${tem2}<br/>风力：${win_speed}<br/>穿衣指数：${clothes.level}，${clothes.desc}`;
  }

  return '对不起，没找到对应城市。'
}

module.exports = {
  getOne,
  getWeather,
}
