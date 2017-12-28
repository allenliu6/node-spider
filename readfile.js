var fs = require('fs')
var request = require('request');
var util = require('util')
var xlsx = require('node-xlsx');

const root = '../binaryspecs/Titans/'
const fileName = '/Titans.podspec.json'

var readFile = util.promisify(fs.readFile)

// console.log(files)

/*
* url 网络文件地址
* filename 文件名
* callback 回调函数
*/
function downloadFile(uri, filename) {
    return new Promise((resolve, reject) => {
        console.log(uri)
        var stream = fs.createWriteStream(filename);
        request(uri).pipe(stream)
            .on('close', () => {
                resolve()
            })
            .on('error', (err) => { reject(err) });
    })
}
var list = {};
(async function () {
    var files = fs.readdirSync('../binaryspecs/Titans')
    var zips = (await Promise.all(files.map((item) => {
        if (item === '.DS_Store') return
        list[item] = {}
        // console.log(item)
        return readFile(root + item + fileName)
            .then(data => {
                var href = JSON.parse(data).source.http
                list[item].date = href.split('@')[1].split('.zip')[0]
                return { file: item + '.zip', href }
            })
    }))).filter(Boolean)
    // const path = require('path')
    // for (var item of zips) {
    //     await downloadFile(item.href, path.join(__dirname, 'down', item.file))
    //     console.log(item)
    // }
})()

var downFiles = fs.readdirSync('down')

downFiles.forEach(downFile => {
    if (downFile === '.DS_Store' || downFile.indexOf('.zip') !== -1) return

    var root = 'down/' + downFile + '/bin'
    var files = fs.readdirSync(root)

    // 下载链接  解压缩  找到 release/libTitans.a  或者libTitans.a 大小
    if (files.every(filename => {
        return filename === 'release'
    })) {
        fs.stat(root + '/release/libTitans.a', (err, stats) => {
            if (err) {
                console.log(files)
                throw err
            }

            list[downFile].size = stats.size
        })
    } else {
        fs.stat(root + '/libTitans.a', (err, stats) => {
            if (err) {
                console.log(files)
                throw err
            }

            list[downFile].size = stats.size
        })
    }
})

setTimeout(() => {
    var arr1 = []
    Object.keys(list).forEach( file => {
        if(list[file].size) {
            let array = [file, list[file].date, list[file].size]
            arr1.push(array)
        }
    })
    let buf = xlsx.build([{name: 'hhh'}, {data: arr1}]);
    // 将 buffer 写入到 my.xlsx 中（导出）
    fs.writeFile('my2.xlsx', buf, (err)=> {
        if(err) throw err;
        console.log('File is saved!');
    });
}, 3000)
