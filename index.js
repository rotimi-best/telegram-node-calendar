const Telegram = require("telegram-node-bot");
const TelegramBaseController = Telegram.TelegramBaseController
const TextCommand = Telegram.TextCommand;
const makeCalendar = require('./modules/calendar');
require("dotenv").config();
let called = false;
const bot = new Telegram.Telegram(process.env.API_KEY, {
    workers: 1 });

class TodoController extends TelegramBaseController {
    /**
     * @param {Scope} $
     */
    startDatePickerHandler($) {
        let {monthNumber} = makeCalendar();
        let genMenus = this.generateMenu($, monthNumber);
        const btnParams = { $, month: monthNumber};
        genMenus.push(this.genPrevtBtn(btnParams), this.genNextBtn(btnParams));
        
        $.runInlineMenu({
            layout: [1,7,7,7,7,7,7,7,3],
            method: 'sendMessage',
            params: ['Choose a date'],
            menu: genMenus
        });
    }

    genNextBtn ({$, month}) {
        month += 1;
        const menu = this.generateMenu($, month);
        let next = { 
                text: '▶️',
                message: 'Choose a date',
                layout: [1,7,7,7,7,7,7,7,3],
                menu: menu           

        };
        return next;
    }

    genPrevtBtn ({$, month}) {
        month -= 1;
        const menu = this.generateMenu($, month);

        let prev = {
            text: '◀️',
            message: 'Choose a date',
            layout: [1,7,7,7,7,7,7,7,3],
            menu: menu 
        };
        return prev;
    }
    
    generateMenu ($, monthnum = '') {
        
        let {monthCalendar, monthText, monthNumber, year} = makeCalendar(monthnum);
        
        let genMenus = [
            { text: monthText+` ${year}`, callback: (callbackQuery) => this.callbackRes (callbackQuery) },
            { text:'Su', callback: (callbackQuery) => this.callbackRes(callbackQuery) },
            { text:'M', callback: (callbackQuery) =>  this.callbackRes(callbackQuery) },  
            { text:'T', callback: (callbackQuery) =>  this.callbackRes(callbackQuery) }, 
            { text:'W', callback: (callbackQuery) =>  this.callbackRes(callbackQuery) }, 
            { text:'T', callback: (callbackQuery) =>  this.callbackRes(callbackQuery) }, 
            { text:'F', callback: (callbackQuery) =>  this.callbackRes(callbackQuery) }, 
            { text:'Sa', callback: (callbackQuery) => this.callbackRes(callbackQuery) },
        ];
        
        for (let i = 0; i < monthCalendar.length; i++) {
            for (let j = 0; j < 7; j++) {
                let menu = null;
                if (monthCalendar[i][j] === 0) {
                    menu = { text: '-', callback: (callbackQuery) => { this.callbackRes(callbackQuery); }}
                } else {
                    menu = { 
                        text: `${monthCalendar[i][j]}`, 
                        callback: (callbackQuery) => { 
                            this.callbackRes(callbackQuery, {$, day: monthCalendar[i][j], month: monthNumber, year});
                        } }
                    }
                    genMenus.push(menu);
                }
            }
        return genMenus;
    }

    callbackRes (callbackQuery, res) {
        if (!res) return bot.api.answerCallbackQuery(callbackQuery.id, { text: 'Not a Valid option, Please pick a day', show_alert: true});
        const { $, day, month, year } = res;
        const jsDate = new Date(year, month, day);
        const chooseDate = jsDate.toString().replace(/\s00:00:00?.*/g, '');
        bot.api.answerCallbackQuery(callbackQuery.id, { text: 'Success!'});
        return $.sendMessage(`You have choosen ${chooseDate}`);
    }

    get routes() {
        return {
            'startDatePickerCommand': 'startDatePickerHandler'
        }
    }
}


bot.router
.when(new TextCommand('/calendar', 'startDatePickerCommand'), new TodoController())
