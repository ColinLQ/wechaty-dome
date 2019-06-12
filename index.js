const { Wechaty } = require('wechaty');
const { getWeather, getOne } = require('./superagent');
const schedule = require('node-schedule')

const bot = new Wechaty();
bot.on('scan', onScan)
bot.on('login', onLogin)
bot.on('logout', onLogout)
bot.on('message', onMessage)
bot.start();

let qrcodeImageUrl;
let xbContact = null;

const contactQueue = [];
let prevContact = null;

function onScan(qrcode) {
  require('qrcode-terminal').generate(qrcode, { small: true })  // 在console端显示二维码
  qrcodeImageUrl = [
    'https://api.qrserver.com/v1/create-qr-code/?data=',
    encodeURIComponent(qrcode),
    '&size=220x220&margin=20',
  ].join('');
  console.log(qrcodeImageUrl); // 二维码地址
}

function onLogin(user) {
  console.log(`User ${user} login`);
  main();
}

function onLogout() {
  qrcodeImageUrl = '';
  prevContact = null;
  contactQueue.splice(0, contactQueue.length);
  xbContact = null;
  clearTimeout(timer);
}

let timer = null;

async function onMessage(msg) {
  const contact = msg.from() // 发消息人
  let content = msg.text() //消息内容
  const room = msg.room() //是否是群消息

  if (contact.payload.name === '小冰' && contact.payload.signature === '我是人工智能微软小冰~~') {
    clearTimeout(timer);
    const contact = contactQueue.shift() || prevContact;
    if (contact) {
      contact.say(content);
      prevContact = contact;
      timer = setTimeout(() => prevContact = null, 10000);
    }
    return;
  }

  if (!room) {
    let reply;

    if (/每日一句/.test(content)) {
      reply = await getOne();
    } else if (content.indexOf('天气') !== -1) {
      reply = await getWeather(content.slice(0, content.indexOf('天气')))
    } else if (!msg.self()) {
      getReply(content);
      contactQueue.push(contact);
    }

    reply && await contact.say(reply);
  }
}

async function getReply(word) {
  if (!xbContact) {
    xbContact = await bot.Contact.find({ name: '小冰' }) || await bot.Contact.find({ alias: '小冰' });
  }
  xbContact.say(word);
}

const scheduleMsg = [
  {
    userName: 'self',
    nickName: '²⁰¹⁹',
    location: '广州',
  },
  {
    userName: '朱盈',
    nickName: '小雀儿的幸运',
    location: '岳麓',
  }
]

function main() {

  // 每分钟的第30秒触发： '30 * * * * *'
  //
  // 每小时的1分30秒触发 ：'30 1 * * * *'
  //
  // 每天的凌晨1点1分30秒触发 ：'30 1 1 * * *'
  //
  // 每月的1日1点1分30秒触发 ：'30 1 1 1 * *'
  //
  // 每周1的1点1分30秒触发 ：'30 1 1 * * 1'

  schedule.scheduleJob('0 0 7 * * *', send)

  async function send() {
    const one = await getOne();

    scheduleMsg.forEach(async item => {
      const { userName, nickName, location } = item;
      const weather = await getWeather(location);
      const msg = `${weather}<br/>每日一句：${one}`;
      const contact = await bot.Contact.find({ name: nickName }) || await bot.Contact.find({ alias: userName });
      contact.say(msg);
    })
  }
}

const Koa = require('koa');
const app = new Koa();

app.use(ctx => {
  ctx.body = `<img src="${qrcodeImageUrl}"/>`;
});

app.listen(4000);
