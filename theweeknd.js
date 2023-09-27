const axios = require('axios');
const cheerio = require('cheerio');
const notifier = require('node-notifier');
const client = require('twilio')("ACef0e8d518a24f58067e046fec3ae1178", "c95935c3d8f2ef70a3b920a6cf88d7d4")

const eventimUrl = [
  'https://www.eventim.com.br/event/the-weeknd-allianz-parque-16309921/'
];
const checkInterval = 6000; // Intervalo de verificação em milissegundos (20 segundos)

setorsToFind = ['CADEIRA INFERIOR', 'CADEIRA SUPERIOR']
tickets = {}
oldMsg = undefined
registered = {}

function NotifyWeb(msg) {
  notifier.notify({
    title: "The Weeknd",
    message: msg,
    icon: "https://www.eventim.com.br/obj/media/BR-eventim/teaser/evo/artwork/2020/theweeknd_artwork.pngps://www.eventim.com.br/static/2019/11/theweeknd-200x200.jpg",
    sound: true, // Ativar som da notificação
  });
}

function NotifyMessage(msg) {
  client.messages.create({
    body: `${msg}`,
    from: 'whatsapp:+14155238886',
    to: 'whatsapp:+5511988406193'
  })
}

async function checkTickets(url) {
  try {
    const response = await axios.get(url);
    const html = response.data;
    const $ = cheerio.load(html);
    let msg = []
    let disponibleMsg = []
    let oldTickets = tickets[url] == undefined ? {} : tickets[url]
    msg.push(`${$('.stage-headline').first().text()} - ${$('span[data-qa="event-venue"]').first().text().trim().replaceAll('\n', '')} - ${$('time[data-qa="event-date"]').first().text().trim().split(',')[1].trim().split(' ')[0]}`)
    disponibleMsg.push(`${$('.stage-headline').first().text()} - ${$('span[data-qa="event-venue"]').first().text().trim().replaceAll('\n', '')} - ${$('time[data-qa="event-date"]').first().text().trim().split(',')[1].trim().split(' ')[0]}`)
    disponibleMsg.push("")
    let has = false
    for (let i = 0; i < setorsToFind.length; i++) {
      const zone = $(`span.sr-only:contains("${setorsToFind[i]}")`)
      if (zone.length > 0) {
        for (let ticket of zone) {
          let zoneName = $(ticket).text().trim()
          let zoneTicketType = $(ticket).parent().parent().find('[data-tt-name]')
          if (zoneTicketType.length > 0) {
            for (let type of zoneTicketType) {
              let ticketType = $(type).attr('data-tt-name')
              let ticketPrice = $(type).before().find('div[data-qa="tickettypeItem-price"]').text().trim()
              let isUnavailable = $(type).before().find('div').hasClass('ticket-type-unavailable')
              msg.push(`${zoneName} - ${ticketType} (${ticketPrice}) ${isUnavailable ? "- ESGOTADO" : ""}`)
              if (!isUnavailable) {
                disponibleMsg.push(`${zoneName} - ${ticketType} (${ticketPrice})`)
              }
              if (tickets[url] == undefined) {
                tickets[url] = {}
              }
              if (tickets[url][zoneName] == undefined) {
                tickets[url][zoneName] = {}
              }
              if (tickets[url][zoneName][ticketType] == undefined) {
                tickets[url][zoneName][ticketType] = {}
              }
              if (tickets[url][zoneName][ticketType].price != ticketPrice || tickets[url][zoneName][ticketType].isUnavailable != isUnavailable) {
                tickets[url][zoneName][ticketType].isUnavailable = isUnavailable
                tickets[url][zoneName][ticketType].price = ticketPrice
                has = true
              }
            }
          }
          has = true
        } 
      }
    }
    msg.push(`🔗 ${eventimUrl}`)
    if (has) {
      if (!registered[url]) {
        console.log(`[${getActualTime()}] Ingressos encontrados!`)
        NotifyWeb(`[${getActualTime()}] Ingressos encontrados!`)
        NotifyMessage(`*THE WEEKND - INGRESSOS ENCONTRADOS* \n\n${disponibleMsg.join('\n')}\n\n🔗 ${eventimUrl}`)
        console.log(msg.join('\n\n'))
        registered[url] = true
      }
      // getting the difference between the two objects
      let diff = {}
      for (let zone in tickets[url]) {
        for (let type in tickets[url][zone]) {
          if (oldTickets[zone] == undefined || oldTickets[zone][type] == undefined || oldTickets[zone][type].price != tickets[url][zone][type].price || oldTickets[zone][type].isUnavailable != tickets[url][zone][type].isUnavailable) {
            if (diff[zone] == undefined) {
              diff[zone] = {}
            }
            diff[zone][type] = tickets[url][zone][type]
          }
        }
      }
      if (Object.keys(diff).length > 0) {
        console.log(`[${getActualTime()}] Mudanças:`)
        console.log(diff)
      } else {
        console.log(`[${getActualTime()}] Nada mudou`)
      }
    }      
  } catch (error) {
    console.error('Erro ao obter a página:', error);
  }
}

// returns: 28/08/2023 às 22:26
function getActualTime() {
  let date = new Date()
  let day = date.getDate()
  let month = date.getMonth() + 1
  let year = date.getFullYear()
  let hour = date.getHours()
  let minute = date.getMinutes()
  let second = date.getSeconds()
  return `${day < 10 ? "0" + day : day}/${month < 10 ? "0" + month : month}/${year} às ${hour < 10 ? "0" + hour : hour}:${minute < 10 ? "0" + minute : minute}:${second < 10 ? "0" + second : second}`
}


for (let url of eventimUrl) {
  checkTickets(url)
}
setInterval(async() => {
  for (let url of eventimUrl) {
    checkTickets(url)
  }
  await new Promise(resolve => setTimeout(resolve, Math.random() * 17270));
}, checkInterval)