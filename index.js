const axios = require("axios");
const cheerio = require("cheerio");
const qs = require("querystring");
const util = require('util')
const log = console.log;

const argv = require('yargs').argv;
const keyword = argv.search;

const base = "https://ani24zo.com/ani/";
const search_action = "search.php?type=scan&query="+qs.escape(keyword);

let urlstr = base + search_action;

log(urlstr);

const getHtml = async () => {
    try {
        return await axios.get(urlstr);
    } catch (error) {
        console.error(error);
    }
};

getHtml()
    .then(html => {
        let ulList = [];
        const $ = cheerio.load(html.data);
        const $bodyList = $("div.ani_search_list_box").children("div.ani_search_info_box");

        $bodyList.each(function(i, elem) {
            ulList[i] = {
                url: $(this).find('a.subject').attr('href'),
                title: $(this).find('a.subject').text()
            };
        });

        const data = ulList.filter(n => n.title);
        return data;
    })
    .then(res => {
        //console.log(res);
        res.forEach(item => {
            console.log(util.format('        { "url" : "%s", "title" : "%s"},', item.url, item.title));
        })
    });
