/*
 * Todo: 
 * - Chrome extension 으로 file 저장공간 주소를 찾아내는 로직 추가 
 * - config.json에 url, 뿐 아니라 Chrome extension으로 찾아낸 주소를 기록
 * - 다운로더는 에피소드 번호에 file 저장공간 주소를 합쳐 경로 생성
 *
 */

const axios = require("axios");
const cheerio = require("cheerio");
const log = console.log;

const fs = require('fs');
const FILE_NAME = 'config.json';

const exec = require('child_process').exec;

const getHtml = async (urlstr) => {
    try {
        return await axios.get(urlstr);
    } catch (error) {
        console.error(error);
    }
};

const parseEpisods = (html) => {
    let ulList = [];
    const $ = cheerio.load(html.data);
    const $bodyList = $("div.ani_video_list").children("a");

    $bodyList.each(function(i, elem) {
        ulList[i] = {
            url: $(this).attr('href'),
            title: $(this).find('div.ani_upload_info div.subject').text()
        };
    });

    const data = ulList.filter(n => n.title);
    console.log(data);
    return data;
}


const downloadEpisod = (list_title, remote_path) => {
    return (episod) => {
        let child;
        let path = episod.url.split('/');
        let filename = path[path.length-1].replace("html","mp4");
        let out_file = list_title + "/" + episod.title + ".mp4";
        let command = "wget --no-check-certificate -c -O '" + out_file + "' " + remote_path + filename;

        console.log(command);
        child = exec(command, function (error, stdout, stderr) {
            //console.log('stdout: ' + stdout);
            console.log('stderr: ' + stderr);
            if (error !== null) {
                console.log('exec error: ' + error);
            }
        })
    }
}

function get_list(list_title, filepath, url) {
    let download = downloadEpisod(list_title, filepath);
    getHtml(url)
        .then(parseEpisods)
        .then(res => res.forEach(download));
}

const readFileAsync = () => {
    fs.readFile(FILE_NAME, (error, data) => {
        console.log('Async Read: starting...');
        if (error) {
            console.log('Async Read: NOT successfull!');
            console.log(error);
        } else {
            try {
                const dataJson = JSON.parse(data);
                console.log("Async Read: successful!");
                baseurl = dataJson.base;
                list = dataJson.monitor;
                console.log(baseurl, list);
                list.forEach((data) => {
                    console.log("fetch... ", baseurl+data.url);
                    fs.mkdirSync(data.title, { recursive: true })
                    get_list(data.title, data.path, baseurl+data.url)
                })
            } catch (error) {
                console.log(error);
            }
        }
    })
}

const deleteZeroSizeFiles = () => {
    exec('find . -maxdepth 2 -type f -empty -delete', function(error, stdout, stderr) {
        console.log(stderr);
    })
}


//deleteZeroSizeFiles();

readFileAsync();
