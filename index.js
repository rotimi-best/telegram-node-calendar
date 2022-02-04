const Telegram = require("telegram-node-bot");
const TelegramBaseController = Telegram.TelegramBaseController
const TextCommand = Telegram.TextCommand;
const makeCalendar = require('./modules/calendar');
require("dotenv").config();
let called = false;
const bot = new Telegram.Telegram(process.env.BOT_TOKEN, {
    workers: 1
});

class TodoController extends TelegramBaseController {
    /**
     * @param {Scope} $
     */
    startDatePickerHandler($) {
        this.out = [];
        let { monthNumber } = makeCalendar();
        // To avoid Maximum call stack size exceeded, First create tables for all months
        for (let q = 0; q < 12; q = q + 1) {
            let genMenus = this.generateMenu($, q);
            const btnParams = { $, month: q };
            if (q == 0)
                genMenus.push(this.genNextBtn(btnParams));
            else if (q == 11)
                genMenus.push(this.genPrevtBtn(btnParams));
            else
                genMenus.push(this.genPrevtBtn(btnParams), this.genNextBtn(btnParams));
            this.out.push(genMenus);
        }
        // Adjusting next month pointer
        for (let q = 10; q >= 0; q = q - 1) {
            this.out[q].forEach(element => {
                if (element.callback == undefined) {
                    if (element.menu == undefined) {
                        element.menu = this.out[q+1];
                    }
                    return element;
                }
            });
        }

        $.runInlineMenu({
            layout: [1, 7, 7, 7, 7, 7, 7, 7, 3],
            method: 'sendMessage',
            params: ['Choose a date'],
            menu: this.out[monthNumber]
        });
    }

    nextFields(menu) {
        return {
            text: '▶️',
            message: 'Choose a date',
            layout: [1, 7, 7, 7, 7, 7, 7, 7, 3],
            menu: menu
        };
    }

    previous() {
        return {
            text: "",
            callback: (cq) => {
                bot.api.answerCallbackQuery(cq.id, { text: 'Previous!' });
            }
        }
    }

    genNextBtn({ $, month }) {
        if ((month + 1) <= 11) {
            const next = this.nextFields(this.out[month + 1]);
            return next;
        }
    }

    prevFields(menu) {
        return {
            text: '◀️',
            message: 'Choose a date',
            layout: [1, 7, 7, 7, 7, 7, 7, 7, 3],
            menu: menu
        };
    }

    genPrevtBtn({ $, month }) {
        if ((month - 1) >= 0) {
            const prev = this.prevFields(this.out[month - 1]);
            return prev;
        }
    }

    generateMenu($, monthnum = '') {
        let { monthCalendar, monthText, monthNumber, year } = makeCalendar(monthnum);

        let genMenus = [
            { text: monthText + ` ${year}`, callback: (callbackQuery) => this.callbackRes(callbackQuery) },
            { text: 'Su', callback: (callbackQuery) => this.callbackRes(callbackQuery) },
            { text: 'M', callback: (callbackQuery) => this.callbackRes(callbackQuery) },
            { text: 'T', callback: (callbackQuery) => this.callbackRes(callbackQuery) },
            { text: 'W', callback: (callbackQuery) => this.callbackRes(callbackQuery) },
            { text: 'T', callback: (callbackQuery) => this.callbackRes(callbackQuery) },
            { text: 'F', callback: (callbackQuery) => this.callbackRes(callbackQuery) },
            { text: 'Sa', callback: (callbackQuery) => this.callbackRes(callbackQuery) },
        ];

        for (let i = 0; i < monthCalendar.length; i++) {
            for (let j = 0; j < 7; j++) {
                let menu = null;
                if (monthCalendar[i][j] === 0) {
                    menu = { text: '-', callback: (callbackQuery) => { this.callbackRes(callbackQuery); } }
                } else {
                    menu = {
                        text: `${monthCalendar[i][j]}`,
                        callback: (callbackQuery) => {
                            this.callbackRes(callbackQuery, { $, day: monthCalendar[i][j], month: monthNumber, year });
                        }
                    }
                }
                genMenus.push(menu);
            }
        }
        return genMenus;
    }

    callbackRes(callbackQuery, res) {
        if (!res) return bot.api.answerCallbackQuery(callbackQuery.id, { text: 'Not a Valid option, Please pick a day', show_alert: true });
        const { $, day, month, year } = res;
        const jsDate = new Date(year, month, day);
        const chooseDate = jsDate.toString().replace(/\s00:00:00?.*/g, '');
        bot.api.answerCallbackQuery(callbackQuery.id, { text: 'Success!' });
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
